from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Dict, List, Tuple

import cv2
import numpy as np
import onnxruntime as ort

# ============================================================
# PATHS / MODEL CONFIG
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "face_parsing" / "resnet18.onnx"

INPUT_SIZE = (512, 512)
INPUT_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
INPUT_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

SUPPORTED_TARGETS = {"face", "skin", "hair", "shadow"}

# ============================================================
# FACE PARSING LABEL MAP
# ============================================================
# 0  background
# 1  skin
# 2  left eyebrow
# 3  right eyebrow
# 4  left eye
# 5  right eye
# 6  eyeglasses
# 7  left ear
# 8  right ear
# 9  earring
# 10 nose
# 11 mouth
# 12 upper lip
# 13 lower lip
# 14 neck
# 15 necklace
# 16 cloth
# 17 hair
# 18 hat
# ============================================================

TARGET_CLASS_IDS: Dict[str, List[int]] = {
    "face": [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13],
    "skin": [1],
    "hair": [17],
}

TARGET_CONFIDENCE: Dict[str, float] = {
    "face": 0.24,
    "skin": 0.38,
    "hair": 0.34,
}

TARGET_CROP_SCALE: Dict[str, float] = {
    "face": 2.25,
    "skin": 2.20,
    "hair": 2.80,
}

TARGET_CROP_CENTER_Y: Dict[str, float] = {
    "face": 0.52,
    "skin": 0.52,
    "hair": 0.40,
}

# ============================================================
# GLOBAL MODEL / DETECTOR STATE
# ============================================================

_parser_session = None
_parser_input_name: str | None = None
_parser_output_names: List[str] = []
_parser_lock = Lock()

_face_cascade = None
_face_lock = Lock()

# ============================================================
# FACE DETECTOR
# ============================================================


def _get_face_cascade():
    global _face_cascade

    if _face_cascade is not None:
        return _face_cascade

    with _face_lock:
        if _face_cascade is None:
            cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
            if not cascade_path.exists():
                raise RuntimeError("OpenCV frontal-face cascade was not found.")

            cascade = cv2.CascadeClassifier(str(cascade_path))
            if cascade.empty():
                raise RuntimeError("OpenCV frontal-face cascade could not be loaded.")

            _face_cascade = cascade

    return _face_cascade


def _detect_faces(image_bgr: np.ndarray) -> List[Tuple[int, int, int, int]]:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    cascade = _get_face_cascade()
    detected = cascade.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=5,
        minSize=(60, 60),
    )

    faces = [
        (int(x), int(y), int(w), int(h))
        for x, y, w, h in detected
    ]

    faces.sort(
        key=lambda item: item[2] * item[3],
        reverse=True,
    )

    return faces[:4]

# ============================================================
# ONNX MODEL
# ============================================================


def _get_parser():
    global _parser_session
    global _parser_input_name
    global _parser_output_names

    if _parser_session is not None:
        return _parser_session

    with _parser_lock:
        if _parser_session is not None:
            return _parser_session

        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                "Face parsing model was not found. "
                f"Expected file: {MODEL_PATH}"
            )

        model_size = MODEL_PATH.stat().st_size
        if model_size < 1_000_000:
            raise FileNotFoundError(
                "Face parsing model is empty or incomplete. "
                f"Expected a valid ONNX model at: {MODEL_PATH}"
            )

        try:
            session = ort.InferenceSession(
                str(MODEL_PATH),
                providers=["CPUExecutionProvider"],
            )
        except Exception as exc:
            raise RuntimeError(
                "Could not load the ResNet18 ONNX face parsing model."
            ) from exc

        inputs = session.get_inputs()
        if not inputs:
            raise RuntimeError("Face parsing model has no input.")

        outputs = session.get_outputs()
        if not outputs:
            raise RuntimeError("Face parsing model has no output.")

        _parser_session = session
        _parser_input_name = inputs[0].name
        _parser_output_names = [output.name for output in outputs]

    return _parser_session

# ============================================================
# IMAGE DECODE / ENCODE
# ============================================================


def _decode_image(image_bytes: bytes) -> np.ndarray:
    if not image_bytes:
        raise ValueError("Image bytes are empty.")

    buffer = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(buffer, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("Invalid image file.")

    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGRA)

    if image.ndim != 3:
        raise ValueError("Unsupported image format.")

    channels = image.shape[2]
    if channels == 4:
        return image
    if channels == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)

    raise ValueError("Unsupported image channel count.")


def _encode_png(image: np.ndarray) -> bytes:
    success, encoded = cv2.imencode(".png", image)
    if not success:
        raise RuntimeError("Could not encode PNG output.")
    return encoded.tobytes()


def _encode_mask_png(mask: np.ndarray) -> bytes:
    """
    Return an RGBA mask where RGB is white and alpha is the soft mask.

    Using alpha here is important for the browser preview: a grayscale PNG
    has an opaque alpha channel, which can accidentally make the frontend
    treat the entire image as selected.
    """
    alpha = np.clip(mask, 0, 255).astype(np.uint8)
    white = np.full((alpha.shape[0], alpha.shape[1], 3), 255, dtype=np.uint8)
    rgba = np.dstack([white, alpha])
    return _encode_png(rgba)


def _to_bgr(image: np.ndarray) -> np.ndarray:
    if image.ndim != 3:
        raise ValueError("Invalid image array.")

    channels = image.shape[2]
    if channels == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    if channels == 3:
        return image.copy()

    raise ValueError("Unsupported image channel count.")

# ============================================================
# MODEL PREPROCESSING / INFERENCE
# ============================================================


def _preprocess_face(face_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, INPUT_SIZE, interpolation=cv2.INTER_LINEAR)

    normalized = resized.astype(np.float32) / 255.0
    normalized = (normalized - INPUT_MEAN) / INPUT_STD

    chw = np.transpose(normalized, (2, 0, 1))
    return np.expand_dims(chw, axis=0).astype(np.float32)


def _predict_face(face_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    global _parser_input_name

    session = _get_parser()
    if _parser_input_name is None:
        raise RuntimeError("Face parser input name is not initialized.")

    tensor = _preprocess_face(face_bgr)
    outputs = session.run(
        _parser_output_names,
        {_parser_input_name: tensor},
    )

    if not outputs:
        raise RuntimeError("Face parsing model returned no output.")

    output = np.asarray(outputs[0])
    if output.ndim != 4:
        raise RuntimeError(
            "Unexpected face parsing model output shape: "
            f"{output.shape}"
        )

    if output.shape[1] == 19:
        logits = np.moveaxis(output[0], 0, -1).astype(np.float32)
    elif output.shape[-1] == 19:
        logits = output[0].astype(np.float32)
    else:
        raise RuntimeError(
            "Expected a 19-class face parser output. "
            f"Received shape: {output.shape}"
        )

    logits -= np.max(logits, axis=-1, keepdims=True)
    probabilities = np.exp(logits)
    probabilities /= np.maximum(
        np.sum(probabilities, axis=-1, keepdims=True),
        1e-8,
    )

    labels = np.argmax(probabilities, axis=-1).astype(np.uint8)
    return labels, probabilities

# ============================================================
# FACE REGION HELPERS
# ============================================================


def _expanded_face_rect(
    face: Tuple[int, int, int, int],
    image_width: int,
    image_height: int,
    scale: float,
    center_y_ratio: float,
) -> Tuple[int, int, int, int]:
    x, y, w, h = face

    size = max(1, int(round(max(w, h) * scale)))
    center_x = x + (w / 2.0)
    center_y = y + (h * center_y_ratio)

    left = int(round(center_x - (size / 2.0)))
    top = int(round(center_y - (size / 2.0)))
    right = left + size
    bottom = top + size

    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > image_width:
        shift = right - image_width
        left = max(0, left - shift)
        right = image_width
    if bottom > image_height:
        shift = bottom - image_height
        top = max(0, top - shift)
        bottom = image_height

    width = max(1, right - left)
    height = max(1, bottom - top)

    return left, top, width, height

# ============================================================
# MASK CLEANUP / FEATHERING
# ============================================================


def _remove_small_components(
    mask: np.ndarray,
    minimum_area: int,
) -> np.ndarray:
    binary = (mask >= 24).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary,
        connectivity=8,
    )

    if count <= 1:
        return mask

    cleaned = np.zeros_like(mask)
    for component_id in range(1, count):
        area = int(stats[component_id, cv2.CC_STAT_AREA])
        if area >= minimum_area:
            cleaned[labels == component_id] = mask[labels == component_id]

    return cleaned


def _clean_segmentation_mask(
    mask: np.ndarray,
    target: str,
) -> np.ndarray:
    mask = np.clip(mask, 0, 255).astype(np.uint8)

    if not np.any(mask > 8):
        return np.zeros_like(mask)

    total_pixels = mask.shape[0] * mask.shape[1]
    minimum_area = max(32, int(total_pixels * (0.000015 if target == "hair" else 0.00002)))
    mask = _remove_small_components(mask, minimum_area)

    if target == "hair":
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    else:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    # Final soft edge. This is intentionally small so the adjustment stays local.
    sigma = 1.25 if target == "hair" else 1.4
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=sigma, sigmaY=sigma)
    return mask

# ============================================================
# FACE / SKIN / HAIR MASK
# ============================================================


def _build_face_based_mask(
    image_bgr: np.ndarray,
    target: str,
) -> np.ndarray:
    height, width = image_bgr.shape[:2]
    output_mask = np.zeros((height, width), dtype=np.uint8)

    faces = _detect_faces(image_bgr)

    # A full-image fallback is useful for unusual inputs where Haar does not find
    # a face. The normal path still uses face-local crops to prevent background bleed.
    if not faces:
        labels, probabilities = _predict_face(image_bgr)
        ids = TARGET_CLASS_IDS[target]
        target_probability = np.sum(probabilities[..., ids], axis=-1)
        threshold = TARGET_CONFIDENCE[target]
        mask = np.where(
            target_probability >= threshold,
            target_probability * 255.0,
            0.0,
        ).astype(np.uint8)
        return _clean_segmentation_mask(mask, target)

    target_ids = TARGET_CLASS_IDS[target]
    threshold = TARGET_CONFIDENCE[target]
    crop_scale = TARGET_CROP_SCALE[target]
    center_y_ratio = TARGET_CROP_CENTER_Y[target]

    for face in faces:
        x, y, w, h = _expanded_face_rect(
            face,
            width,
            height,
            crop_scale,
            center_y_ratio,
        )

        crop = image_bgr[y : y + h, x : x + w]
        if crop.size == 0:
            continue

        labels, probabilities = _predict_face(crop)
        target_probability = np.sum(
            probabilities[..., target_ids],
            axis=-1,
        )

        # Keep the highest-confidence target pixels. This is substantially safer
        # than taking every argmax pixel in the crop.
        target_mask = np.where(
            target_probability >= threshold,
            target_probability * 255.0,
            0.0,
        ).astype(np.uint8)

        # Additional protection against accidental background picks around the
        # parser crop boundary: keep only non-background parser labels.
        if target == "hair":
            target_mask[labels != 17] = 0
        elif target == "skin":
            target_mask[labels != 1] = 0
        elif target == "face":
            face_ids = np.asarray(target_ids, dtype=np.uint8)
            target_mask[~np.isin(labels, face_ids)] = 0

        resized_mask = cv2.resize(
            target_mask,
            (w, h),
            interpolation=cv2.INTER_LINEAR,
        )

        current = output_mask[y : y + h, x : x + w]
        np.maximum(current, resized_mask, out=current)

    return _clean_segmentation_mask(output_mask, target)

# ============================================================
# SHADOW MASK
# ============================================================


def _build_shadow_mask(image_bgr: np.ndarray) -> np.ndarray:
    """
    Build a soft shadow-confidence mask over the full image.

    This is a local-illumination heuristic rather than a dedicated shadow model:
    shadows are detected where local luminance is noticeably higher than the
    current pixel. The mask is softened and small texture regions are discarded.
    """
    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    lightness = lab[:, :, 0].astype(np.float32)

    min_dim = min(image_bgr.shape[0], image_bgr.shape[1])
    sigma = float(np.clip(min_dim * 0.025, 10.0, 28.0))
    local_lightness = cv2.GaussianBlur(
        lightness,
        (0, 0),
        sigmaX=sigma,
        sigmaY=sigma,
    )

    darkness = local_lightness - lightness
    # Very dark pixels are more likely to be hair, eyes, clothing, or other
    # objects than removable cast/shading shadows, so keep them out of this mask.
    candidate = (
        (darkness > 9.0)
        & (lightness > 34.0)
        & (lightness < 238.0)
    )

    softness = np.clip(
        (darkness - 7.0) * 18.0,
        0.0,
        255.0,
    )

    mask = np.where(candidate, softness, 0.0).astype(np.uint8)

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    mask = _remove_small_components(
        mask,
        max(50, int(mask.shape[0] * mask.shape[1] * 0.00002)),
    )

    return cv2.GaussianBlur(mask, (0, 0), sigmaX=1.5, sigmaY=1.5)

# ============================================================
# PUBLIC API: GENERATE MASK
# ============================================================


def generate_object_mask(image_bytes: bytes, target: str) -> bytes:
    target = (target or "").strip().lower()
    if target not in SUPPORTED_TARGETS:
        raise ValueError(
            "Unsupported object target. Use face, skin, hair or shadow."
        )

    image = _decode_image(image_bytes)
    bgr = _to_bgr(image)

    if target == "shadow":
        mask = _build_shadow_mask(bgr)
    else:
        mask = _build_face_based_mask(bgr, target)

    return _encode_mask_png(mask)

# ============================================================
# MASK READER / FEATHERING
# ============================================================


def _read_mask(
    mask_bytes: bytes,
    width: int,
    height: int,
) -> np.ndarray:
    if not mask_bytes:
        raise ValueError("Mask bytes are empty.")

    buffer = np.frombuffer(mask_bytes, dtype=np.uint8)
    mask = cv2.imdecode(buffer, cv2.IMREAD_UNCHANGED)
    if mask is None:
        raise ValueError("Invalid mask image.")

    if mask.ndim == 2:
        alpha = mask.astype(np.uint8)
    elif mask.ndim == 3 and mask.shape[2] == 4:
        alpha = mask[:, :, 3].astype(np.uint8)
        # Backward compatibility with old opaque grayscale/RGBA masks.
        if int(alpha.min()) >= 250 and int(alpha.max()) >= 250:
            alpha = cv2.cvtColor(mask, cv2.COLOR_BGRA2GRAY)
    elif mask.ndim == 3 and mask.shape[2] == 3:
        alpha = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    else:
        raise ValueError("Unsupported mask channel count.")

    if alpha.shape[1] != width or alpha.shape[0] != height:
        alpha = cv2.resize(
            alpha,
            (width, height),
            interpolation=cv2.INTER_LINEAR,
        )

    return np.clip(alpha, 0, 255).astype(np.uint8)


def _prepare_mask(mask: np.ndarray, target: str) -> np.ndarray:
    if not np.any(mask > 5):
        raise ValueError("No selected area was found in the mask.")

    mask = np.clip(mask, 0, 255).astype(np.uint8)

    # A modest blur makes the final transition invisible without noticeably
    # expanding the mask into surrounding background pixels.
    sigma = 1.6 if target in {"face", "skin"} else 1.4
    if target == "shadow":
        sigma = 1.8

    softened = cv2.GaussianBlur(
        mask,
        (0, 0),
        sigmaX=sigma,
        sigmaY=sigma,
    )

    return np.clip(softened, 0, 255).astype(np.uint8)

# ============================================================
# LOCAL TONE ADJUSTMENT
# ============================================================


def _adjust_brightness_contrast(
    image_bgr: np.ndarray,
    brightness: float,
    contrast: float,
    target: str,
) -> np.ndarray:
    brightness = float(np.clip(brightness, 0, 200))
    contrast = float(np.clip(contrast, 0, 200))

    image = image_bgr.astype(np.float32)

    # Tone-preserving RGB adjustment. Instead of independently multiplying R/G/B,
    # adjust luminance and scale the channels together. That avoids obvious hue
    # shifts on skin and keeps dark hair looking naturally dark.
    blue, green, red = image[:, :, 0], image[:, :, 1], image[:, :, 2]
    luma = 0.0722 * blue + 0.7152 * green + 0.2126 * red

    contrast_factor = 1.0 + ((contrast - 100.0) / 100.0) * 0.45
    brightness_scale = 1.0
    if target == "hair":
        brightness_scale = 1.10
    elif target == "skin":
        brightness_scale = 0.90
    elif target == "face":
        brightness_scale = 0.95

    brightness_delta = (brightness - 100.0) * 0.80 * brightness_scale

    new_luma = (
        (luma - 128.0) * contrast_factor
        + 128.0
        + brightness_delta
    )
    new_luma = np.clip(new_luma, 0.0, 255.0)

    gain = new_luma / np.maximum(luma, 20.0)
    gain = np.clip(gain, 0.15, 3.0)

    result = image * gain[:, :, None]
    return np.clip(result, 0, 255).astype(np.uint8)

# ============================================================
# SHADOW CLEARING
# ============================================================


def _clear_shadow(image_bgr: np.ndarray, strength: float) -> np.ndarray:
    strength = float(np.clip(strength, 0, 100))

    lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
    lightness = lab[:, :, 0].astype(np.float32)

    min_dim = min(image_bgr.shape[0], image_bgr.shape[1])
    sigma = float(np.clip(min_dim * 0.025, 10.0, 28.0))
    local_lightness = cv2.GaussianBlur(
        lightness,
        (0, 0),
        sigmaX=sigma,
        sigmaY=sigma,
    )

    darkness = np.maximum(local_lightness - lightness, 0.0)
    lift = darkness * (strength / 100.0) * 0.82
    lift = np.minimum(lift, 44.0)

    lightness = np.clip(lightness + lift, 0.0, 255.0)
    lab[:, :, 0] = lightness.astype(np.uint8)

    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

# ============================================================
# PUBLIC API: APPLY OBJECT ADJUSTMENT
# ============================================================


def apply_object_adjust(
    image_bytes: bytes,
    mask_bytes: bytes,
    target: str,
    brightness: float = 100,
    contrast: float = 100,
    shadow_strength: float = 100,
) -> bytes:
    target = (target or "").strip().lower()
    if target not in SUPPORTED_TARGETS:
        raise ValueError("Unsupported object target.")

    image = _decode_image(image_bytes)
    original_alpha = image[:, :, 3].copy() if image.shape[2] == 4 else None
    bgr = _to_bgr(image)

    height, width = bgr.shape[:2]
    raw_mask = _read_mask(mask_bytes, width, height)
    mask = _prepare_mask(raw_mask, target)

    alpha = mask.astype(np.float32)[:, :, None] / 255.0

    if target == "shadow":
        adjusted = _clear_shadow(bgr, shadow_strength)
    else:
        adjusted = _adjust_brightness_contrast(
            bgr,
            brightness,
            contrast,
            target,
        )

    result = (
        bgr.astype(np.float32) * (1.0 - alpha)
        + adjusted.astype(np.float32) * alpha
    )
    result = np.clip(result, 0, 255).astype(np.uint8)

    if original_alpha is not None:
        result = np.dstack([result, original_alpha])

    return _encode_png(result)
