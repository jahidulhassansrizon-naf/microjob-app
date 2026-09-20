import os

# ১. Render-এর ফোল্ডার পারমিশন ফিক্স
os.environ["U2NET_HOME"] = "/tmp"

# ২. Render Free Tier-এর CPU/RAM ক্র্যাশ ঠেকাতে থ্রেড লিমিট করে দেওয়া
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["ONNXRUNTIME_NUM_THREADS"] = "1"

from rembg import remove, new_session

# লাইটওয়েট মডেল সেশন তৈরি
session = new_session("u2netp")

def remove_background(image_bytes: bytes) -> bytes:
    """
    Remove background optimized for Render Free Tier.
    """
    if not image_bytes:
        raise ValueError("Image bytes are empty.")

    output_bytes = remove(image_bytes, session=session)
    return output_bytes