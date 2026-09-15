import cv2
import numpy as np


def process_document_image(image_bytes: bytes) -> bytes:
    # ১. Image Bytes থেকে OpenCV ইমেজে রূপান্তর
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image file or format")

    # ২. গ্রে-স্কেল কনভার্সন
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ৩. ব্যাকগ্রাউন্ড এস্টিমেশন
    dilated = cv2.dilate(gray, np.ones((7, 7), np.uint8))
    bg = cv2.medianBlur(dilated, 21)

    # ৪. লাইটিং কারেকশন
    corrected = cv2.divide(gray, bg, scale=255)

    # ৫. কনট্রাস্ট বাড়ানো (CLAHE)
    clahe = cv2.createCLAHE(
        clipLimit=2.5,
        tileGridSize=(8, 8)
    )
    enhanced = clahe.apply(corrected)

    # ৬. স্মুথ হোয়াইট ব্যাকগ্রাউন্ড + টেক্সট এনহ্যান্সমেন্ট
    min_val, max_val = 35, 180

    normalized = np.clip(enhanced, min_val, max_val)

    stretched = (
        (normalized - min_val)
        * (255.0 / (max_val - min_val))
    ).astype(np.uint8)

    # ৭. High Quality Crystal Clear Text Sharpening
    # Low-radius blur ব্যবহার করে text edge আরও পরিষ্কার করা হচ্ছে
    gaussian = cv2.GaussianBlur(
        stretched,
        (0, 0),
        sigmaX=1.2
    )

    # Strong কিন্তু controlled sharpening
    sharpened = cv2.addWeighted(
        stretched,
        1.8,
        gaussian,
        -0.8,
        0
    )

    # ৮. Fine Detail Enhancement
    # ছোট font এবং handwriting-এর edge আরও স্পষ্ট করতে
    detail_kernel = np.array([
        [0, -1,  0],
        [-1, 5, -1],
        [0, -1,  0]
    ], dtype=np.float32)

    crystal_clear = cv2.filter2D(
        sharpened,
        -1,
        detail_kernel
    )

    # ৯. অতিরিক্ত bright/black clipping এড়ানো
    crystal_clear = np.clip(
        crystal_clear,
        0,
        255
    ).astype(np.uint8)

    # ১০. Result PNG হিসেবে encode
    success, encoded_img = cv2.imencode(
        ".png",
        crystal_clear
    )

    if not success:
        raise ValueError("Failed to encode processed image")

    return encoded_img.tobytes()