from __future__ import annotations

import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai


# =========================================================
# Environment
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

ENV_LOCAL = PROJECT_ROOT / ".env.local"

if ENV_LOCAL.exists():
    load_dotenv(ENV_LOCAL)

load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. "
        "Add GEMINI_API_KEY=... to the project root .env.local file."
    )


# =========================================================
# Gemini Client
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY,
)


# =========================================================
# Model
# =========================================================

MODEL_NAME = "gemini-3.1-flash-image"


# =========================================================
# Virtual Try-On Prompt
# =========================================================

VIRTUAL_TRY_ON_PROMPT = """
Edit the SECOND image, which is the person's real photo.

Use the FIRST image only as the clothing reference.

Replace the person's current clothing with the referenced garment
and make it look naturally worn by the same person.

STRICT REQUIREMENTS:

- Keep the exact same person and identity.
- Preserve the face and facial identity.
- Preserve facial structure, eyes, nose, mouth and skin appearance.
- Preserve hair and head covering.
- Preserve body proportions.
- Preserve the original pose and camera angle.
- Preserve hands, arms and visible skin.
- Replace the existing clothing rather than simply placing a sticker
  or flat image over it.
- Fit the new garment naturally to the person's body.
- Follow the person's pose and perspective.
- Preserve realistic cloth folds, seams, collar, cuffs, buttons and details
  when visible in the reference.
- Match the original lighting, shadows and highlights.
- Make the result photorealistic.
- Do NOT make the clothing look like a cartoon, vector, illustration,
  sticker or pasted graphic.
- Do NOT alter the person's face or identity.
- Do NOT change the background.
- Return one final edited image.

The first image is the garment reference.
The second image is the person to edit.
"""


# =========================================================
# Generate Virtual Try-On
# =========================================================

def generate_virtual_try_on(
    person_bytes: bytes,
    person_mime_type: str,
    clothing_bytes: bytes,
    clothing_mime_type: str,
) -> bytes:

    if not person_bytes:
        raise ValueError(
            "Person image is empty."
        )

    if not clothing_bytes:
        raise ValueError(
            "Clothing image is empty."
        )

    if not person_mime_type.startswith("image/"):
        raise ValueError(
            f"Invalid person MIME type: {person_mime_type}"
        )

    if not clothing_mime_type.startswith("image/"):
        raise ValueError(
            f"Invalid clothing MIME type: {clothing_mime_type}"
        )

    # -----------------------------------------------------
    # Base64
    # -----------------------------------------------------

    clothing_base64 = base64.b64encode(
        clothing_bytes
    ).decode("utf-8")

    person_base64 = base64.b64encode(
        person_bytes
    ).decode("utf-8")

    print(
        "[Gemini] Starting virtual try-on request..."
    )

    print(
        f"[Gemini] Person MIME: {person_mime_type}"
    )

    print(
        f"[Gemini] Clothing MIME: {clothing_mime_type}"
    )

    # -----------------------------------------------------
    # Gemini request
    # -----------------------------------------------------

    interaction = client.interactions.create(
        model=MODEL_NAME,
        input=[
            {
                "type": "text",
                "text": VIRTUAL_TRY_ON_PROMPT,
            },
            {
                "type": "image",
                "data": clothing_base64,
                "mime_type": clothing_mime_type,
            },
            {
                "type": "image",
                "data": person_base64,
                "mime_type": person_mime_type,
            },
        ],
        response_format={
            "type": "image",

            # IMPORTANT:
            # Gemini image output currently supports JPEG here.
            "mime_type": "image/jpeg",

            "image_size": "1K",
        },

        timeout=300,
    )

    print(
        "[Gemini] Interaction completed."
    )

    # -----------------------------------------------------
    # Direct output image
    # -----------------------------------------------------

    output_image = getattr(
        interaction,
        "output_image",
        None,
    )

    if output_image is not None:

        image_data = getattr(
            output_image,
            "data",
            None,
        )

        if image_data:

            print(
                "[Gemini] Output image received."
            )

            try:
                return base64.b64decode(
                    image_data
                )

            except Exception as exc:

                raise RuntimeError(
                    "Could not decode Gemini output image."
                ) from exc

    # -----------------------------------------------------
    # Fallback
    # -----------------------------------------------------

    steps = getattr(
        interaction,
        "steps",
        None,
    )

    if steps:

        for step in steps:

            step_type = getattr(
                step,
                "type",
                None,
            )

            if step_type != "model_output":
                continue

            content_blocks = getattr(
                step,
                "content",
                None,
            )

            if not content_blocks:
                continue

            for block in content_blocks:

                block_type = getattr(
                    block,
                    "type",
                    None,
                )

                if block_type != "image":
                    continue

                data = getattr(
                    block,
                    "data",
                    None,
                )

                if not data:
                    continue

                print(
                    "[Gemini] Output image found in model_output step."
                )

                try:
                    return base64.b64decode(
                        data
                    )

                except Exception as exc:

                    raise RuntimeError(
                        "Could not decode Gemini step image."
                    ) from exc

    raise RuntimeError(
        "Gemini completed but did not return an output image."
    )