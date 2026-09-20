import gc
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "yolov8n-seg.pt"

# CPU-only inference
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
    height, width = image.shape[:2]

    initial_fg = (soft_mask >= 0.20).astype(np.uint8) * 255

    kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    initial_fg = cv2.morphologyEx(
        initial_fg,
        cv2.MORPH_CLOSE,
        kernel_close,
        iterations=2,
    )

    kernel_expand = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    probable_fg = cv2.dilate(initial_fg, kernel_expand, iterations=1)

    gc_mask = np.full((height, width), cv2.GC_BGD, dtype=np.uint8)
    gc_mask[probable_fg > 0] = cv2.GC_PR_BGD
    gc_mask[initial_fg > 0] = cv2.GC_PR_FGD

    sure_fg = (soft_mask >= 0.55).astype(np.uint8) * 255
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    sure_fg = cv2.erode(sure_fg, kernel_erode, iterations=1)
    gc_mask[sure_fg > 0] = cv2.GC_FGD

    outside = probable_fg == 0
    gc_mask[outside] = cv2.GC_BGD

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
                2,  # Iterations reduced to 2 for fast low-RAM computation
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

    yolo_core = (soft_mask >= 0.35).astype(np.uint8) * 255
    refined = cv2.bitwise_or(refined, yolo_core)

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

    edge_expand = cv2.dilate(
        refined,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
        iterations=1,
    )

    fg_binary = edge_expand > 0
    dist_fg = cv2.distanceTransform(
        fg_binary.astype(np.uint8), cv2.DIST_L2, 3
    )
    dist_bg = cv2.distanceTransform(
        (~fg_binary).astype(np.uint8), cv2.DIST_L2, 3
    )

    alpha = (fg_binary.astype(np.float32) * 255.0)
    contour_band = np.minimum(dist_fg, dist_bg)
    feather = np.clip(1.0 - (dist_bg / 3.0), 0.0, 1.0)

    alpha = np.where(
        contour_band < 3.0,
        alpha * feather,
        alpha,
    )

    yolo_edge = np.clip((soft_mask - 0.12) / 0.50, 0.0, 1.0) * 255.0
    edge_zone = cv2.GaussianBlur(refined.astype(np.float32), (0, 0), 1.0) / 255.0
    alpha = np.maximum(alpha, yolo_edge * edge_zone)

    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
    return np.clip(alpha, 0, 255).astype(np.uint8)


def remove_background(image_bytes: bytes) -> bytes:
    """
    Remove background safely with RAM optimization for Render hosting.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    orig_image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if orig_image is None:
        raise ValueError("Could not decode image.")

    orig_height, orig_width = orig_image.shape[:2]

    # 1. Downscale image for AI processing to fit inside 512MB RAM
    max_dim = 800
    scale = min(max_dim / orig_height, max_dim / orig_width, 1.0)

    if scale < 1.0:
        proc_width = int(orig_width * scale)
        proc_height = int(orig_height * scale)
        proc_image = cv2.resize(orig_image, (proc_width, proc_height), interpolation=cv2.INTER_AREA)
    else:
        proc_image = orig_image
        proc_width, proc_height = orig_width, orig_height

    # 2. Run YOLO segmentation
    result = model.predict(
        source=proc_image,
        conf=0.20,
        verbose=False,
        device="cpu",
    )[0]

    soft_mask = _largest_person_mask(result, proc_width, proc_height)
    alpha_proc = _refine_mask(proc_image, soft_mask)

    # 3. Scale mask back to original resolution
    if scale < 1.0:
        alpha = cv2.resize(alpha_proc, (orig_width, orig_height), interpolation=cv2.INTER_LINEAR)
    else:
        alpha = alpha_proc

    output = cv2.cvtColor(orig_image, cv2.COLOR_BGR2BGRA)
    output[:, :, 3] = alpha

    success, encoded = cv2.imencode(
        ".png",
        output,
        [cv2.IMWRITE_PNG_COMPRESSION, 4],
    )

    # Explicitly clear RAM
    del orig_image, proc_image, result, alpha_proc, alpha
    gc.collect()

    if not success:
        raise ValueError("Failed to create transparent PNG.")

    return encoded.tobytes()