from rembg import remove, new_session

# Load ultra-lightweight u2netp model (~4.7MB model size, uses <100MB RAM)
session = new_session("u2netp")

def remove_background(image_bytes: bytes) -> bytes:
    """
    Remove background using u2netp ONNX engine.
    Fully optimized for low-RAM cloud servers (Render Free Tier).
    """
    if not image_bytes:
        raise ValueError("Image bytes are empty.")
    
    output_bytes = remove(image_bytes, session=session)
    return output_bytes