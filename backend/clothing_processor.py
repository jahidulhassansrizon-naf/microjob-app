from __future__ import annotations

from pathlib import Path
from typing import Tuple

import cv2
import numpy as np
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent

SEG_MODEL_PATH = BASE_DIR / "yolov8n-seg.pt"
POSE_MODEL_PATH = BASE_DIR / "yolov8n-pose.pt"


# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

seg_model = YOLO(str(SEG_MODEL_PATH))

# Pose model is used to estimate shoulders / hips so that
# the old clothing region can be isolated more safely.
pose_model = YOLO(str(POSE_MODEL_PATH))


# ---------------------------------------------------------
# Clothing layout
# ---------------------------------------------------------

CLOTHING_LAYOUT = {
    0: {"top": 0.29, "bottom": 0.96, "width": 0.90},  # Shirt
    1: {"top": 0.29, "bottom": 0.96, "width": 0.90},  # Polo
    2: {"top": 0.26, "bottom": 0.94, "width": 0.94},  # Suit
    3: {"top": 0.26, "bottom": 0.94, "width": 0.94},  # Blazer
    4: {"top": 0.18, "bottom": 0.99, "width": 0.98},  # Saree
    5: {"top": 0.10, "bottom": 0.99, "width": 0.99},  # Hijab
    6: {"top": 0.22, "bottom": 0.98, "width": 0.95},  # Panjabi
    7: {"top": 0.23, "bottom": 0.99, "width": 0.97},  # Dress
    8: {"top": 0.29, "bottom": 0.96, "width": 0.90},  # T-Shirt
    9: {"top": 0.10, "bottom": 0.99, "width": 0.99},  # Abaya
    10: {"top": 0.07, "bottom": 0.99, "width": 1.00},  # Burqa
    11: {"top": 0.20, "bottom": 0.99, "width": 0.97},  # Kameez
    12: {"top": 0.19, "bottom": 0.99, "width": 0.97},  # Kurti
    13: {"top": 0.26, "bottom": 0.96, "width": 0.94},  # Jacket
}


# ---------------------------------------------------------
# Basic image helpers
# ---------------------------------------------------------

def _decode_image(
    image_bytes: bytes,
    flags: int,
) -> np.ndarray:

    array = np.frombuffer(
        image_bytes,
        np.uint8,
    )

    image = cv2.imdecode(
        array,
        flags,
    )

    if image is None:
        raise ValueError("Could not decode image.")

    return image


def _largest_person_mask(
    image: np.ndarray,
) -> np.ndarray:

    result = seg_model.predict(
        source=image,
        conf=0.20,
        verbose=False,
        device="cpu",
    )[0]

    if result.masks is None or result.boxes is None:
        raise ValueError(
            "No person detected in the image."
        )

    classes = result.boxes.cls.cpu().numpy()
    masks = result.masks.data.cpu().numpy()

    person_indexes = [
        i
        for i, class_id in enumerate(classes)
        if int(class_id) == 0
    ]

    if not person_indexes:
        raise ValueError(
            "No person detected in the image."
        )

    best_index = max(
        person_indexes,
        key=lambda i: float(
            np.sum(masks[i] > 0.20)
        ),
    )

    h, w = image.shape[:2]

    mask = masks[best_index].astype(
        np.float32
    )

    mask = cv2.resize(
        mask,
        (w, h),
        interpolation=cv2.INTER_LINEAR,
    )

    return np.clip(
        mask,
        0.0,
        1.0,
    )


# ---------------------------------------------------------
# Pose detection
# ---------------------------------------------------------

def _get_pose_points(
    image: np.ndarray,
) -> dict:

    result = pose_model.predict(
        source=image,
        conf=0.25,
        verbose=False,
        device="cpu",
    )[0]

    if result.keypoints is None:
        return {}

    if result.keypoints.xy is None:
        return {}

    points = result.keypoints.xy.cpu().numpy()

    if len(points) == 0:
        return {}

    # Pick first detected person.
    person = points[0]

    def point(index: int):
        if index >= len(person):
            return None

        x = float(person[index][0])
        y = float(person[index][1])

        if x <= 0 or y <= 0:
            return None

        return x, y

    # COCO pose indexes
    return {
        "left_shoulder": point(5),
        "right_shoulder": point(6),
        "left_hip": point(11),
        "right_hip": point(12),
        "left_elbow": point(7),
        "right_elbow": point(8),
        "left_wrist": point(9),
        "right_wrist": point(10),
    }


# ---------------------------------------------------------
# Build torso / old clothing removal mask
# ---------------------------------------------------------

def _build_old_clothing_mask(
    image: np.ndarray,
    person_mask: np.ndarray,
    pose: dict,
) -> np.ndarray:

    h, w = image.shape[:2]

    mask = np.zeros(
        (h, w),
        dtype=np.uint8,
    )

    shoulders = [
        pose.get("left_shoulder"),
        pose.get("right_shoulder"),
    ]

    hips = [
        pose.get("left_hip"),
        pose.get("right_hip"),
    ]

    valid_shoulders = [
        p for p in shoulders if p is not None
    ]

    valid_hips = [
        p for p in hips if p is not None
    ]

    # -----------------------------------------------------
    # Preferred pose-based torso polygon
    # -----------------------------------------------------

    if len(valid_shoulders) == 2 and len(valid_hips) == 2:

        left_shoulder = valid_shoulders[0]
        right_shoulder = valid_shoulders[1]

        left_hip = valid_hips[0]
        right_hip = valid_hips[1]

        shoulder_y = min(
            left_shoulder[1],
            right_shoulder[1],
        )

        hip_y = max(
            left_hip[1],
            right_hip[1],
        )

        # Expand slightly to capture old clothing edges.
        shoulder_expand = max(
            12,
            int(
                abs(
                    right_shoulder[0]
                    - left_shoulder[0]
                )
                * 0.10
            ),
        )

        hip_expand = max(
            10,
            int(
                abs(
                    right_hip[0]
                    - left_hip[0]
                )
                * 0.15
            ),
        )

        polygon = np.array(
            [
                [
                    int(left_shoulder[0] - shoulder_expand),
                    int(shoulder_y),
                ],
                [
                    int(right_shoulder[0] + shoulder_expand),
                    int(shoulder_y),
                ],
                [
                    int(right_hip[0] + hip_expand),
                    int(hip_y),
                ],
                [
                    int(left_hip[0] - hip_expand),
                    int(hip_y),
                ],
            ],
            dtype=np.int32,
        )

        cv2.fillConvexPoly(
            mask,
            polygon,
            255,
        )

    else:
        # -------------------------------------------------
        # Fallback using person bounding box
        # -------------------------------------------------

        ys, xs = np.where(
            person_mask > 0.25
        )

        if len(xs) == 0:
            raise ValueError(
                "Could not determine person body region."
            )

        x0 = int(xs.min())
        x1 = int(xs.max())

        y0 = int(
            ys.min()
            + (ys.max() - ys.min()) * 0.28
        )

        y1 = int(
            ys.min()
            + (ys.max() - ys.min()) * 0.92
        )

        width = x1 - x0

        x0 = max(
            0,
            x0 - int(width * 0.05),
        )

        x1 = min(
            w - 1,
            x1 + int(width * 0.05),
        )

        cv2.rectangle(
            mask,
            (x0, y0),
            (x1, y1),
            255,
            -1,
        )

    # -----------------------------------------------------
    # Never erase outside the detected person.
    # -----------------------------------------------------

    person_binary = (
        person_mask > 0.20
    ).astype(np.uint8) * 255

    mask = cv2.bitwise_and(
        mask,
        person_binary,
    )

    # -----------------------------------------------------
    # Protect face/head
    # -----------------------------------------------------

    ys, xs = np.where(
        person_binary > 0
    )

    if len(xs) > 0:

        top = int(ys.min())

        face_end = int(
            top
            + (ys.max() - top) * 0.30
        )

        mask[:face_end, :] = 0

    # -----------------------------------------------------
    # Protect arms approximately.
    # -----------------------------------------------------

    for key in [
        "left_elbow",
        "right_elbow",
        "left_wrist",
        "right_wrist",
    ]:

        p = pose.get(key)

        if p is None:
            continue

        px, py = map(int, p)

        cv2.circle(
            mask,
            (px, py),
            max(
                18,
                int(
                    min(h, w) * 0.035
                ),
            ),
            0,
            -1,
        )

    # -----------------------------------------------------
    # Expand only slightly around torso.
    # -----------------------------------------------------

    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (9, 9),
    )

    mask = cv2.dilate(
        mask,
        kernel,
        iterations=1,
    )

    # Re-clamp to person
    mask = cv2.bitwise_and(
        mask,
        person_binary,
    )

    # Smooth
    mask = cv2.GaussianBlur(
        mask,
        (0, 0),
        1.2,
    )

    return mask


# ---------------------------------------------------------
# Remove old clothing using inpainting
# ---------------------------------------------------------

def _remove_old_clothing(
    image: np.ndarray,
    removal_mask: np.ndarray,
) -> np.ndarray:

    # Strong enough threshold for inpainting.
    binary_mask = np.where(
        removal_mask > 90,
        255,
        0,
    ).astype(np.uint8)

    if np.count_nonzero(binary_mask) == 0:
        return image.copy()

    # Inpaint radius kept modest so face/hands aren't affected.
    result = cv2.inpaint(
        image,
        binary_mask,
        5,
        cv2.INPAINT_TELEA,
    )

    return result


# ---------------------------------------------------------
# Clothing extraction
# ---------------------------------------------------------

def _border_background_mask(
    image_bgr: np.ndarray,
) -> np.ndarray:

    h, w = image_bgr.shape[:2]

    background = np.zeros(
        (h, w),
        dtype=np.uint8,
    )

    seeds = [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (0, h // 2),
        (w - 1, h // 2),
        (w // 2, h - 1),
    ]

    for x, y in seeds:

        if background[y, x] != 0:
            continue

        flood_mask = np.zeros(
            (h + 2, w + 2),
            dtype=np.uint8,
        )

        temp = image_bgr.copy()

        try:
            cv2.floodFill(
                temp,
                flood_mask,
                (x, y),
                (0, 0, 0),
                loDiff=(22, 22, 22),
                upDiff=(22, 22, 22),
                flags=4 | (255 << 8),
            )

            region = (
                flood_mask[1:-1, 1:-1] != 0
            )

            background[region] = 255

        except cv2.error:
            pass

    return background


def _extract_clothing_rgba(
    clothing_bytes: bytes,
) -> np.ndarray:

    rgba = _decode_image(
        clothing_bytes,
        cv2.IMREAD_UNCHANGED,
    )

    if rgba.ndim == 2:

        rgba = cv2.cvtColor(
            rgba,
            cv2.COLOR_GRAY2BGRA,
        )

    elif rgba.shape[2] == 3:

        rgba = cv2.cvtColor(
            rgba,
            cv2.COLOR_BGR2BGRA,
        )

    bgr = rgba[:, :, :3]

    alpha = rgba[:, :, 3].copy()

    background_mask = _border_background_mask(
        bgr
    )

    alpha[
        background_mask > 0
    ] = 0

    # Remove very bright mannequin/card regions
    # only where they are enclosed near the center.
    gray = cv2.cvtColor(
        bgr,
        cv2.COLOR_BGR2GRAY,
    )

    h, w = gray.shape

    yy, xx = np.ogrid[
        :h,
        :w,
    ]

    face_region = (
        ((xx - w * 0.50) / (w * 0.15)) ** 2
        +
        ((yy - h * 0.29) / (h * 0.18)) ** 2
        < 1
    )

    alpha[
        face_region
        &
        (gray > 210)
    ] = 0

    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (3, 3),
    )

    alpha = cv2.morphologyEx(
        alpha,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=1,
    )

    alpha = cv2.morphologyEx(
        alpha,
        cv2.MORPH_OPEN,
        kernel,
        iterations=1,
    )

    alpha = cv2.GaussianBlur(
        alpha,
        (0, 0),
        0.55,
    )

    rgba[:, :, 3] = alpha

    return rgba


# ---------------------------------------------------------
# Clothing placement
# ---------------------------------------------------------

def _alpha_bbox(
    alpha: np.ndarray,
) -> Tuple[int, int, int, int]:

    ys, xs = np.where(
        alpha > 10
    )

    if len(xs) == 0:
        raise ValueError(
            "No usable clothing pixels found."
        )

    return (
        int(xs.min()),
        int(ys.min()),
        int(xs.max()) + 1,
        int(ys.max()) + 1,
    )


def _place_clothing(
    image: np.ndarray,
    clothing_rgba: np.ndarray,
    person_mask: np.ndarray,
    pose: dict,
    clothing_index: int,
) -> np.ndarray:

    h, w = image.shape[:2]

    ys, xs = np.where(
        person_mask > 0.20
    )

    if len(xs) == 0:
        raise ValueError(
            "Person mask is empty."
        )

    person_x0 = int(xs.min())
    person_x1 = int(xs.max()) + 1

    person_y0 = int(ys.min())
    person_y1 = int(ys.max()) + 1

    person_width = max(
        1,
        person_x1 - person_x0,
    )

    person_height = max(
        1,
        person_y1 - person_y0,
    )

    layout = CLOTHING_LAYOUT.get(
        clothing_index,
        {
            "top": 0.28,
            "bottom": 0.96,
            "width": 0.92,
        },
    )

    # -----------------------------------------------------
    # Prefer shoulder width when pose is available.
    # -----------------------------------------------------

    ls = pose.get("left_shoulder")
    rs = pose.get("right_shoulder")

    if ls is not None and rs is not None:

        shoulder_width = abs(
            rs[0] - ls[0]
        )

        target_width = int(
            shoulder_width
            * 1.55
        )

        center_x = (
            ls[0] + rs[0]
        ) / 2

    else:

        target_width = int(
            person_width
            * layout["width"]
        )

        center_x = (
            person_x0 + person_x1
        ) / 2

    target_width = max(
        1,
        min(
            target_width,
            int(
                person_width
                * 1.10
            ),
        ),
    )

    target_top = int(
        person_y0
        + person_height
        * layout["top"]
    )

    target_bottom = int(
        person_y0
        + person_height
        * layout["bottom"]
    )

    target_height = max(
        1,
        target_bottom - target_top,
    )

    x0, y0, x1, y1 = _alpha_bbox(
        clothing_rgba[:, :, 3]
    )

    clothing = clothing_rgba[
        y0:y1,
        x0:x1,
    ]

    ch, cw = clothing.shape[:2]

    scale = min(
        target_width / max(1, cw),
        target_height / max(1, ch),
    )

    rw = max(
        1,
        int(round(cw * scale)),
    )

    rh = max(
        1,
        int(round(ch * scale)),
    )

    interpolation = (
        cv2.INTER_AREA
        if scale < 1
        else cv2.INTER_CUBIC
    )

    clothing = cv2.resize(
        clothing,
        (rw, rh),
        interpolation=interpolation,
    )

    place_x = int(
        center_x - rw / 2
    )

    place_y = int(
        target_top
        + (target_height - rh) / 2
    )

    dst_x0 = max(
        0,
        place_x,
    )

    dst_y0 = max(
        0,
        place_y,
    )

    dst_x1 = min(
        w,
        place_x + rw,
    )

    dst_y1 = min(
        h,
        place_y + rh,
    )

    if (
        dst_x0 >= dst_x1
        or dst_y0 >= dst_y1
    ):
        raise ValueError(
            "Clothing placement is outside image."
        )

    src_x0 = dst_x0 - place_x
    src_y0 = dst_y0 - place_y

    src_x1 = src_x0 + (
        dst_x1 - dst_x0
    )

    src_y1 = src_y0 + (
        dst_y1 - dst_y0
    )

    layer = clothing[
        src_y0:src_y1,
        src_x0:src_x1,
    ]

    rgb = layer[
        :, :, :3
    ].astype(np.float32)

    alpha = (
        layer[:, :, 3]
        .astype(np.float32)
        / 255.0
    )[:, :, None]

    base = image[
        dst_y0:dst_y1,
        dst_x0:dst_x1,
    ].astype(np.float32)

    composed = (
        rgb * alpha
        +
        base * (
            1.0 - alpha
        )
    )

    image[
        dst_y0:dst_y1,
        dst_x0:dst_x1
    ] = np.clip(
        composed,
        0,
        255,
    ).astype(np.uint8)

    return image


# ---------------------------------------------------------
# Public API
# ---------------------------------------------------------

def apply_clothing(
    person_bgra: np.ndarray,
    clothing_bytes: bytes,
    person_alpha: np.ndarray,
    clothing_index: int,
) -> np.ndarray:

    clothing_index = int(
        clothing_index
    )

    if not 0 <= clothing_index <= 13:
        raise ValueError(
            "Invalid clothing index."
        )

    if person_bgra.ndim != 3:
        raise ValueError(
            "Invalid person image."
        )

    if person_bgra.shape[2] != 4:
        raise ValueError(
            "Person image must contain alpha."
        )

    # Convert for processing
    person_bgr = cv2.cvtColor(
        person_bgra,
        cv2.COLOR_BGRA2BGR,
    )

    person_mask = (
        person_alpha.astype(
            np.float32
        )
        / 255.0
    )

    # -----------------------------------------------------
    # Get pose
    # -----------------------------------------------------

    pose = _get_pose_points(
        person_bgr
    )

    # -----------------------------------------------------
    # Build old clothing removal area
    # -----------------------------------------------------

    old_clothing_mask = (
        _build_old_clothing_mask(
            person_bgr,
            person_mask,
            pose,
        )
    )

    # -----------------------------------------------------
    # Remove old clothing
    # -----------------------------------------------------

    cleaned_person = _remove_old_clothing(
        person_bgr,
        old_clothing_mask,
    )

    # -----------------------------------------------------
    # Extract selected clothing
    # -----------------------------------------------------

    clothing_rgba = _extract_clothing_rgba(
        clothing_bytes
    )

    # -----------------------------------------------------
    # Put new clothing
    # -----------------------------------------------------

    final_bgr = _place_clothing(
        cleaned_person,
        clothing_rgba,
        person_mask,
        pose,
        clothing_index,
    )

    # -----------------------------------------------------
    # Restore original alpha
    # -----------------------------------------------------

    final_bgra = cv2.cvtColor(
        final_bgr,
        cv2.COLOR_BGR2BGRA,
    )

    final_bgra[:, :, 3] = person_bgra[
        :, :, 3
    ]

    return final_bgra