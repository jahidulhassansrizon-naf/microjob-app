"""Color Document enhancement.

Drop-in replacement for the old ``enhance_color_document(image_bytes)``:
same name, same input (image bytes), same output (PNG bytes). The route that
calls it does not have to change.

What it does, in order:

1. Flat-field / white balance, per colour channel. The "paper" colour is
   estimated on a small copy (a morphological closing removes ink and stamps,
   so they are never mistaken for background) and every pixel is divided by
   it. Shadows, uneven light and a yellow/grey cast disappear, while the ink
   keeps its colour *relative to the paper*.
2. Local contrast (CLAHE) on the lightness of near-neutral pixels only
   (text, lines). Coloured pixels are left alone, so stamps and coloured ink
   do not get blotchy.
3. Neutral paper is pushed smoothly to pure white. Pale coloured fills
   (e.g. a light blue table header) are NOT whitened.
4. Faded colours are brought back: chroma is boosted with a smooth curve that
   leaves neutral pixels (paper, black ink) untouched and caps very strong
   colours so they do not clip.
5. A light, resolution-aware unsharp mask.

Everything that depends on size (kernel sizes, blur radii) is derived from the
image size, so the result looks the same on a 1000 px photo and on a 3500 px
Magic Clean image. Heavy per-pixel float maths runs in row strips, so memory
stays low on small servers.
"""

from __future__ import annotations

import cv2
import numpy as np

# --------------------------------------------------------------------------
# Tunables (all size-independent unless noted)
# --------------------------------------------------------------------------

# Inputs bigger than this (longest side, px) are shrunk first. It protects the
# server's memory; the app itself never sends more than 3508 px.
MAX_SIDE = 3600

# The paper colour is estimated on a copy with this longest side (px).
ESTIMATE_SIDE = 640
# Closing kernel as a fraction of the short side of that copy. It must be
# larger than the thickest ink stroke / stamp detail so ink is treated as
# "not paper".
INK_KERNEL_FRACTION = 0.045
# Never brighten an area by more than 1 / this factor (protects real dark
# content such as photos or a table edge).
MIN_PAPER_FRACTION = 0.55
# Ignore glare brighter than this multiple of the typical paper level.
MAX_PAPER_OVERSHOOT = 1.08

# Local contrast on neutral pixels.
CLAHE_CLIP = 2.0
CLAHE_TILES = (8, 8)
CLAHE_MIX = 0.6  # 0 = none, 1 = full CLAHE

# Neutral paper -> white ramp (on the 0..255 lightness scale).
WHITE_LOW = 205.0
WHITE_HIGH = 240.0

# "Is this pixel coloured?" smooth threshold on LAB chroma.
COLOR_LOW = 7.0
COLOR_HIGH = 18.0

# Colour restoration.
CHROMA_GAIN = 1.35
CHROMA_GAIN_START = 4.0  # below this chroma nothing is boosted
CHROMA_GAIN_FULL = 16.0  # from here on the full gain applies
CHROMA_MAX = 100.0

# Final sharpening.
SHARPEN_AMOUNT = 0.4

PNG_COMPRESSION = 4  # 0..9, lower = faster, bigger file
STRIP_ROWS = 256


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------


def _odd(value: float, minimum: int = 3) -> int:
    n = int(round(value))
    if n % 2 == 0:
        n += 1
    return max(minimum, n)


def _smoothstep(x: np.ndarray, low: float, high: float) -> np.ndarray:
    t = np.clip((x - low) / (high - low), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _to_u8(x: np.ndarray) -> np.ndarray:
    return np.clip(x + 0.5, 0.0, 255.0).astype(np.uint8)


def _decode(image_bytes: bytes) -> np.ndarray:
    if not image_bytes:
        raise ValueError("Empty image")

    data = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Failed to decode image")

    height, width = image.shape[:2]
    if height < 8 or width < 8:
        raise ValueError("Image is too small")

    longest = max(height, width)
    if longest > MAX_SIDE:
        scale = MAX_SIDE / longest
        image = cv2.resize(
            image,
            (max(1, round(width * scale)), max(1, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )
    return image


def _flat_field(image: np.ndarray) -> np.ndarray:
    """Divide every channel by its own smooth paper estimate."""
    height, width = image.shape[:2]

    scale = min(1.0, ESTIMATE_SIDE / max(height, width))
    if scale < 1.0:
        small = cv2.resize(
            image,
            (max(1, round(width * scale)), max(1, round(height * scale))),
            interpolation=cv2.INTER_AREA,
        )
    else:
        small = image
    small_h, small_w = small.shape[:2]

    small = cv2.GaussianBlur(small, (3, 3), 0)

    kernel_size = _odd(min(small_h, small_w) * INK_KERNEL_FRACTION)
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
    )
    # Per channel closing: dark ink/stamps vanish, paper stays.
    paper = cv2.morphologyEx(small, cv2.MORPH_CLOSE, kernel)
    paper = cv2.medianBlur(paper, _odd(kernel_size / 2))
    paper = cv2.GaussianBlur(paper, (0, 0), kernel_size / 2.0)

    # Typical paper level per channel, used to keep the correction sane.
    reference = np.percentile(paper.reshape(-1, 3), 90, axis=0)
    low = np.maximum(16.0, reference * MIN_PAPER_FRACTION)
    high = np.minimum(255.0, reference * MAX_PAPER_OVERSHOOT)
    paper = np.clip(paper.astype(np.float32), low, high).astype(np.uint8)

    if paper.shape[:2] != (height, width):
        paper = cv2.resize(paper, (width, height), interpolation=cv2.INTER_LINEAR)

    return cv2.divide(image, paper, scale=255.0)


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------


def enhance_color_document(image_bytes: bytes) -> bytes:
    """Bring a colour document back to life. Returns PNG bytes.

    Raises ``ValueError`` when the input is not a usable image.
    """
    image = _decode(image_bytes)
    height, width = image.shape[:2]
    longest = max(height, width)

    # 1. shadows, uneven light and colour cast
    flat = _flat_field(image)
    del image

    lab = cv2.cvtColor(flat, cv2.COLOR_BGR2LAB)
    del flat
    l_norm, a_chan, b_chan = cv2.split(lab)
    del lab

    # 2. local contrast (a new CLAHE object per call keeps this thread-safe)
    clahe = cv2.createCLAHE(clipLimit=CLAHE_CLIP, tileGridSize=CLAHE_TILES)
    l_clahe = clahe.apply(l_norm)

    # 3. where is real colour? (smooth weight, feathered a little so there are
    #    no hard edges around coloured strokes)
    weight = np.empty((height, width), np.uint8)
    for y0 in range(0, height, STRIP_ROWS):
        y1 = min(height, y0 + STRIP_ROWS)
        ca = a_chan[y0:y1].astype(np.float32) - 128.0
        cb = b_chan[y0:y1].astype(np.float32) - 128.0
        chroma = np.hypot(ca, cb)
        weight[y0:y1] = _to_u8(_smoothstep(chroma, COLOR_LOW, COLOR_HIGH) * 255.0)
    feather = max(0.8, longest / 2500.0)
    weight = cv2.GaussianBlur(weight, (0, 0), feather)

    # 4. combine lightness + colour, strip by strip (low memory)
    l_out = np.empty_like(l_norm)
    a_out = np.empty_like(a_chan)
    b_out = np.empty_like(b_chan)

    for y0 in range(0, height, STRIP_ROWS):
        y1 = min(height, y0 + STRIP_ROWS)

        ln = l_norm[y0:y1].astype(np.float32)
        lc = l_clahe[y0:y1].astype(np.float32)
        w = weight[y0:y1].astype(np.float32) / 255.0

        # neutral pixels: local contrast, then smooth white paper
        neutral = (1.0 - CLAHE_MIX) * ln + CLAHE_MIX * lc
        white = _smoothstep(neutral, WHITE_LOW, WHITE_HIGH) * (1.0 - w)
        neutral = neutral * (1.0 - white) + 255.0 * white
        # coloured pixels keep their normalised lightness
        l_out[y0:y1] = _to_u8(w * ln + (1.0 - w) * neutral)

        ca = a_chan[y0:y1].astype(np.float32) - 128.0
        cb = b_chan[y0:y1].astype(np.float32) - 128.0
        chroma = np.hypot(ca, cb)

        gain = 1.0 + (CHROMA_GAIN - 1.0) * _smoothstep(
            chroma, CHROMA_GAIN_START, CHROMA_GAIN_FULL
        )
        safe = np.maximum(chroma, 1e-3)
        factor = np.minimum(chroma * gain, CHROMA_MAX) / safe
        # paper that was pushed to white must not keep a colour tint
        factor = factor * (1.0 - white)

        a_out[y0:y1] = _to_u8(128.0 + ca * factor)
        b_out[y0:y1] = _to_u8(128.0 + cb * factor)

    result = cv2.cvtColor(cv2.merge((l_out, a_out, b_out)), cv2.COLOR_LAB2BGR)

    # 5. light unsharp mask, radius follows the image size
    sigma = max(0.8, longest / 2000.0)
    blurred = cv2.GaussianBlur(result, (0, 0), sigma)
    result = cv2.addWeighted(result, 1.0 + SHARPEN_AMOUNT, blurred, -SHARPEN_AMOUNT, 0)

    ok, encoded = cv2.imencode(
        ".png", result, [cv2.IMWRITE_PNG_COMPRESSION, PNG_COMPRESSION]
    )
    if not ok:
        raise ValueError("Failed to encode result")
    return encoded.tobytes()