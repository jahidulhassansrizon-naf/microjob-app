import os
from rembg import remove, new_session

os.environ["U2NET_HOME"] = "/tmp"
os.environ["OMP_NUM_THREADS"] = "1"

_session = None

def get_session():
    global _session
    if _session is None:
        _session = new_session("u2netp")
    return _session

def remove_background(image_bytes: bytes) -> bytes:
    if not image_bytes:
        raise ValueError("Image bytes are empty.")
    
    session = get_session()
    output_bytes = remove(image_bytes, session=session)
    return output_bytes