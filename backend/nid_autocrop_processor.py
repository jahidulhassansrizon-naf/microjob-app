from __future__ import annotations

import cv2
import numpy as np


# ============================================================
# NID AUTO CROP CONFIG
# ============================================================

MIN_DOCUMENT_AREA_RATIO = 0.15
MAX_DETECTION_SIDE = 1600


# ============================================================
# POINT HELPERS
# ============================================================

def order_points(points: np.ndarray) -> np.ndarray:
    """Return points ordered as top-left, top-right, bottom-right, bottom-left."""
    pts = np.asarray(points, dtype=np.float32).reshape(4, 2)

    rect = np.zeros((4, 2), dtype=np.float32)
    sums = pts.sum(axis=1)
    diffs = np.diff(pts, axis=1).reshape(-1)

    rect[0] = pts[np.argmin(sums)]
    rect[2] = pts[np.argmax(sums)]
    rect[1] = pts[np.argmin(diffs)]
    rect[3] = pts[np.argmax(diffs)]

    return rect


def _resize_for_detection(
    image: np.ndarray,
) -> tuple[np.ndarray, float]:
    height, width = image.shape[:2]
    largest_side = max(height, width)

    if largest_side <= MAX_DETECTION_SIDE:
        return image, 1.0

    scale = MAX_DETECTION_SIDE / float(largest_side)
    resized = cv2.resize(
        image,
        (
            max(1, int(round(width * scale))),
            max(1, int(round(height * scale))),
        ),
        interpolation=cv2.INTER_AREA,
    )

    return resized, scale


def _angle_quality(points: np.ndarray) -> float:
    """Return a 0..1 score for corners being close to right angles."""
    rect = order_points(points)
    quality_total = 0.0

    for index in range(4):
        previous = rect[(index - 1) % 4] - rect[index]
        following = rect[(index + 1) % 4] - rect[index]

        previous_norm = np.linalg.norm(previous)
        following_norm = np.linalg.norm(following)

        if previous_norm < 1e-6 or following_norm < 1e-6:
            return 0.0

        cosine = float(
            np.dot(previous, following)
            / (previous_norm * following_norm)
        )
        cosine = float(np.clip(abs(cosine), 0.0, 1.0))

        # 0° or 180° -> poor; 90° -> best.
        quality_total += 1.0 - cosine

    return quality_total / 4.0


def _find_document_quad(
    image: np.ndarray,
) -> np.ndarray | None:
    """Find the most likely NID/document quadrilateral."""
    detection_image, scale = _resize_for_detection(image)
    height, width = detection_image.shape[:2]
    total_area = float(height * width)

    if total_area <= 0:
        return None

    gray = cv2.cvtColor(detection_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    edge_maps = [
        cv2.Canny(blurred, 40, 140),
        cv2.Canny(blurred, 70, 180),
    ]

    # Close small gaps in the document boundary.
    kernel = cv2.getStructuringElement(
        cv2.MORPH_RECT,
        (5, 5),
    )

    candidates: list[tuple[float, np.ndarray]] = []

    for edges in edge_maps:
        edges = cv2.morphologyEx(
            edges,
            cv2.MORPH_CLOSE,
            kernel,
            iterations=2,
        )

        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        contours = sorted(
            contours,
            key=cv2.contourArea,
            reverse=True,
        )

        for contour in contours[:40]:
            contour_area = float(cv2.contourArea(contour))
            area_ratio = contour_area / total_area

            if area_ratio < MIN_DOCUMENT_AREA_RATIO:
                continue

            perimeter = cv2.arcLength(contour, True)
            if perimeter <= 0:
                continue

            hull = cv2.convexHull(contour)
            hull_area = float(cv2.contourArea(hull))
            if hull_area <= 0:
                continue

            # Try several approximation tolerances because phone photos can
            # have soft/irregular card borders.
            for epsilon_factor in (
                0.010,
                0.015,
                0.020,
                0.025,
                0.035,
                0.045,
            ):
                approx = cv2.approxPolyDP(
                    hull,
                    epsilon_factor * cv2.arcLength(hull, True),
                    True,
                )

                if len(approx) != 4:
                    continue

                if not cv2.isContourConvex(approx):
                    continue

                quad = approx.reshape(4, 2).astype(np.float32)
                quad_area = float(abs(cv2.contourArea(quad)))
                quad_ratio = quad_area / total_area

                if quad_ratio < MIN_DOCUMENT_AREA_RATIO:
                    continue

                ordered = order_points(quad)
                top_left, top_right, bottom_right, bottom_left = ordered

                top_width = np.linalg.norm(top_right - top_left)
                bottom_width = np.linalg.norm(bottom_right - bottom_left)
                left_height = np.linalg.norm(bottom_left - top_left)
                right_height = np.linalg.norm(bottom_right - top_right)

                avg_width = (top_width + bottom_width) / 2.0
                avg_height = (left_height + right_height) / 2.0

                if avg_width <= 1.0 or avg_height <= 1.0:
                    continue

                aspect_ratio = avg_width / avg_height
                if not 0.35 <= aspect_ratio <= 3.5:
                    continue

                # Width/height consistency: a genuine document should not be
                # wildly different on opposite edges.
                width_consistency = min(
                    top_width / max(bottom_width, 1.0),
                    bottom_width / max(top_width, 1.0),
                )
                height_consistency = min(
                    left_height / max(right_height, 1.0),
                    right_height / max(left_height, 1.0),
                )
                rectangularity = (
                    width_consistency + height_consistency
                ) / 2.0

                corner_quality = _angle_quality(quad)

                # Reject a quad that is effectively the entire input image.
                border_margin = max(
                    3,
                    int(min(width, height) * 0.015),
                )
                near_full_frame = (
                    quad[:, 0].min() <= border_margin
                    and quad[:, 1].min() <= border_margin
                    and quad[:, 0].max() >= width - border_margin
                    and quad[:, 1].max() >= height - border_margin
                    and quad_ratio > 0.97
                )

                if near_full_frame:
                    continue

                score = (
                    min(1.0, quad_ratio / 0.75) * 0.55
                    + rectangularity * 0.25
                    + corner_quality * 0.20
                )

                candidates.append(
                    (
                        float(score),
                        quad,
                    )
                )
                break

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    best_score, best_quad = candidates[0]

    # Safe fallback: do not apply a doubtful crop.
    if best_score < 0.35:
        return None

    if scale != 1.0:
        best_quad = best_quad / scale

    original_height, original_width = image.shape[:2]
    best_quad[:, 0] = np.clip(
        best_quad[:, 0],
        0,
        original_width - 1,
    )
    best_quad[:, 1] = np.clip(
        best_quad[:, 1],
        0,
        original_height - 1,
    )

    return best_quad.astype(np.float32)


# ============================================================
# PERSPECTIVE TRANSFORM
# ============================================================

def four_point_transform(
    image: np.ndarray,
    points: np.ndarray,
) -> np.ndarray:
    rect = order_points(points)
    top_left, top_right, bottom_right, bottom_left = rect

    width_a = np.linalg.norm(bottom_right - bottom_left)
    width_b = np.linalg.norm(top_right - top_left)
    height_a = np.linalg.norm(top_right - bottom_right)
    height_b = np.linalg.norm(top_left - bottom_left)

    max_width = max(
        2,
        int(round(max(width_a, width_b))),
    )
    max_height = max(
        2,
        int(round(max(height_a, height_b))),
    )

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype=np.float32,
    )

    matrix = cv2.getPerspectiveTransform(
        rect,
        destination,
    )

    return cv2.warpPerspective(
        image,
        matrix,
        (max_width, max_height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )


# ============================================================
# PUBLIC API
# ============================================================

def auto_crop_and_deskew(
    image_bytes: bytes,
) -> bytes:
    """
    Detect an NID/document boundary, crop it, and deskew it.

    When the detector does not have enough confidence, the original image is
    returned instead of risking a destructive incorrect crop.
    """
    if not image_bytes:
        raise ValueError("Empty image data.")

    array = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        array,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError("Invalid or unsupported image.")

    original = image.copy()
    quad = _find_document_quad(image)

    if quad is not None:
        try:
            transformed = four_point_transform(
                image,
                quad,
            )

            if (
                transformed is not None
                and transformed.size > 0
                and transformed.shape[0] >= 50
                and transformed.shape[1] >= 50
            ):
                image = transformed
        except Exception:
            image = original

    success, encoded = cv2.imencode(
        ".png",
        image,
        [
            cv2.IMWRITE_PNG_COMPRESSION,
            3,
        ],
    )

    if not success:
        raise RuntimeError(
            "Could not encode auto-cropped image."
        )

    return encoded.tobytes()
