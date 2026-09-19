from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "yolov8n-seg.pt"

# Your machine is CPU-only, so keep inference on CPU.
model = YOLO(str(MODEL_PATH))


def _largest_person_mask(result, width: int, height: int) -> np.ndarray:
    """Return the largest detected person's soft mask at original image size."""
    if result.masks is None or result.boxes is None:
        raise ValueError("No person detected in the image.")

    classes = result.boxes.cls.cpu().numpy()
    masks = result.masks.data.cpu().numpy()

    person_indexes = [
        i for i, class_id in enumerate(classes) if int(class_id) == 0
    ]

    if not person_indexes:
        raise ValueError("No person detected in the image.")

    best_index = max(
        person_indexes,
        key=lambda i: float(np.sum(masks[i] > 0.20)),
    )

    mask = masks[best_index].astype(np.float32)
    mask = cv2.resize(mask, (width, height), interpolation=cv2.INTER_LINEAR)
    return np.clip(mask, 0.0, 1.0)


def _refine_mask(image: np.ndarray, soft_mask: np.ndarray) -> np.ndarray:
    """
    Refine the YOLO mask without cropping the image.

    Strategy:
    1. Start from a lower-confidence foreground region so fine hair/cloth edges
       are less likely to be cut away.
    2. Build sure/probable foreground and probable background for GrabCut.
    3. Keep the YOLO mask as a strong prior so a bright garment (e.g. white hijab)
       is not lost simply because it resembles the background.
    4. Create a soft alpha edge rather than a hard binary cutout.
    """
    height, width = image.shape[:2]

    # A slightly permissive initial foreground keeps more outer hair/fabric pixels.
    initial_fg = (soft_mask >= 0.20).astype(np.uint8) * 255

    # Clean tiny holes while preserving the overall silhouette.
    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    initial_fg = cv2.morphologyEx(
        initial_fg,
        cv2.MORPH_CLOSE,
        kernel_close,
        iterations=2,
    )

    # Expand the probable foreground zone a little so GrabCut can recover thin edges.
    kernel_expand = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    probable_fg = cv2.dilate(initial_fg, kernel_expand, iterations=1)

    # GrabCut labels:
    #   0 = definite background
    #   1 = definite foreground
    #   2 = probable background
    #   3 = probable foreground
    gc_mask = np.full((height, width), cv2.GC_BGD, dtype=np.uint8)
    gc_mask[probable_fg > 0] = cv2.GC_PR_BGD
    gc_mask[initial_fg > 0] = cv2.GC_PR_FGD

    # Strong interior pixels from YOLO are definite foreground.
    sure_fg = (soft_mask >= 0.55).astype(np.uint8) * 255
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    sure_fg = cv2.erode(sure_fg, kernel_erode, iterations=1)
    gc_mask[sure_fg > 0] = cv2.GC_FGD

    # Never let pixels outside the expanded person area become foreground.
    outside = probable_fg == 0
    gc_mask[outside] = cv2.GC_BGD

    # GrabCut needs a reasonably constrained region. Run only when there is a
    # useful foreground region; otherwise fall back to the YOLO mask.
    if np.count_nonzero(initial_fg) > 0:
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)

        try:
            cv2.grabCut(
                image,
                gc_mask,
                None,
                bgd_model,
                fgd_model,
                3,
                cv2.GC_INIT_WITH_MASK,
            )
            refined = np.where(
                (gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD),
                255,
                0,
            ).astype(np.uint8)
        except cv2.error:
            refined = initial_fg
    else:
        refined = initial_fg

    # Preserve YOLO foreground as a safety prior. This matters for white/light
    # clothing where GrabCut can otherwise confuse garment and background.
    yolo_core = (soft_mask >= 0.35).astype(np.uint8) * 255
    refined = cv2.bitwise_or(refined, yolo_core)

    # Fill small internal holes and remove isolated speckles.
    kernel_cleanup = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    refined = cv2.morphologyEx(
        refined,
        cv2.MORPH_CLOSE,
        kernel_cleanup,
        iterations=2,
    )
    refined = cv2.morphologyEx(
        refined,
        cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
        iterations=1,
    )

    # Recover a tiny amount of outer edge before feathering. This is especially
    # helpful for dark hair against a light wall.
    edge_expand = cv2.dilate(
        refined,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
        iterations=1,
    )

    # Distance-based soft alpha gives a much cleaner contour than a hard 0/255
    # threshold while retaining the full image dimensions.
    fg_binary = edge_expand > 0
    dist_fg = cv2.distanceTransform(
        fg_binary.astype(np.uint8), cv2.DIST_L2, 3
    )
    dist_bg = cv2.distanceTransform(
        (~fg_binary).astype(np.uint8), cv2.DIST_L2, 3
    )

    # Start with a crisp mask, then feather only near the contour.
    alpha = (fg_binary.astype(np.float32) * 255.0)
    contour_band = np.minimum(dist_fg, dist_bg)
    feather = np.clip(1.0 - (dist_bg / 3.0), 0.0, 1.0)

    # Use soft values only close to the contour. Keep interior fully opaque.
    alpha = np.where(
        contour_band < 3.0,
        alpha * feather,
        alpha,
    )

    # Blend in the original YOLO confidence near the edge. This helps retain
    # thin hair/fabric details that have non-binary segmentation probability.
    yolo_edge = np.clip((soft_mask - 0.12) / 0.50, 0.0, 1.0) * 255.0
    edge_zone = cv2.GaussianBlur(refined.astype(np.float32), (0, 0), 1.0) / 255.0
    alpha = np.maximum(alpha, yolo_edge * edge_zone)

    # Final gentle feather.
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
    return np.clip(alpha, 0, 255).astype(np.uint8)


def remove_background(image_bytes: bytes) -> bytes:
    """
    Remove the background from a person photo and return a transparent PNG.
    The original image dimensions are preserved; no cropping is performed.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Could not decode image.")

    height, width = image.shape[:2]

    result = model.predict(
        source=image,
        conf=0.20,
        verbose=False,
        device="cpu",
    )[0]

    soft_mask = _largest_person_mask(result, width, height)
    alpha = _refine_mask(image, soft_mask)

    output = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    output[:, :, 3] = alpha

    success, encoded = cv2.imencode(
        ".png",
        output,
        [cv2.IMWRITE_PNG_COMPRESSION, 4],
    )

    if not success:
        raise ValueError("Failed to create transparent PNG.")

    return encoded.tobytes()
