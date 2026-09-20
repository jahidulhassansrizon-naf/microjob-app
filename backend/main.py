from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

import cv2
import numpy as np
import os

from document_processor import process_document_image
import color_document_processor
from photo_processor import remove_background
# from clothing_processor import apply_clothing
from gemini_processor import generate_virtual_try_on
from nid_autocrop_processor import auto_crop_and_deskew


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="SohozKoj AI Backend",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DOCUMENT HELPERS
# =========================================================

def order_points(pts):
    rect = np.zeros(
        (4, 2),
        dtype="float32",
    )

    s = pts.sum(axis=1)

    rect[0] = pts[np.argmin(s)]       # Top-left
    rect[2] = pts[np.argmax(s)]       # Bottom-right

    diff = np.diff(
        pts,
        axis=1,
    )

    rect[1] = pts[np.argmin(diff)]    # Top-right
    rect[3] = pts[np.argmax(diff)]    # Bottom-left

    return rect


def four_point_transform(image, pts):
    rect = order_points(pts)

    tl, tr, br, bl = rect

    width_a = np.sqrt(
        ((br[0] - bl[0]) ** 2)
        +
        ((br[1] - bl[1]) ** 2)
    )

    width_b = np.sqrt(
        ((tr[0] - tl[0]) ** 2)
        +
        ((tr[1] - tl[1]) ** 2)
    )

    max_width = max(
        int(width_a),
        int(width_b),
    )

    height_a = np.sqrt(
        ((tr[0] - br[0]) ** 2)
        +
        ((tr[1] - br[1]) ** 2)
    )

    height_b = np.sqrt(
        ((tl[0] - bl[0]) ** 2)
        +
        ((tl[1] - bl[1]) ** 2)
    )

    max_height = max(
        int(height_a),
        int(height_b),
    )

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(
        rect,
        destination,
    )

    return cv2.warpPerspective(
        image,
        matrix,
        (
            max_width,
            max_height,
        ),
    )


# =========================================================
# HEALTH
# =========================================================

def gemini_is_configured() -> bool:
    """Return whether the Gemini API key is present on the backend."""
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


GEMINI_UNAVAILABLE_MESSAGE = (
    "Clothing Try-On is temporarily unavailable because our paid AI API "
    "quota has ended. Please wait—we will bring it back soon."
)


def is_temporary_gemini_error(message: str) -> bool:
    text = (message or "").lower()
    return any(
        marker in text
        for marker in (
            "api_key",
            "api key",
            "rate limit",
            "too many requests",
            "quota",
            "429",
            "resource exhausted",
        )
    )


@app.get("/api/gemini-status")
async def gemini_status():
    configured = gemini_is_configured()
    return {
        "success": True,
        "enabled": configured,
        "model": os.getenv("GEMINI_MODEL", "gemini-3.1-flash-image"),
    }


@app.get("/api/health")
async def health_check():
    return {
        "success": True,
        "service": "sohozkoj-ai-backend",
        "status": "running",
        "gemini": gemini_is_configured(),
    }


# =========================================================
# CLEAN DOCUMENT
# =========================================================

@app.post("/api/clean-document")
async def clean_document_endpoint(
    file: UploadFile = File(...),
):
    try:
        contents = await file.read()

        if not contents:
            return Response(
                content="Empty image file.",
                status_code=400,
                media_type="text/plain",
            )

        output_bytes = process_document_image(
            contents
        )

        return Response(
            content=output_bytes,
            media_type="image/png",
        )

    except Exception as error:
        print(
            f"[Clean Document] {error}"
        )

        return Response(
            content="Document processing failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# COLOR DOCUMENT
# =========================================================

@app.post("/api/color-document")
async def color_document_endpoint(
    file: UploadFile = File(...),
):
    try:
        contents = await file.read()

        if not contents:
            return Response(
                content="Empty image file.",
                status_code=400,
                media_type="text/plain",
            )

        output_bytes = (
            color_document_processor
            .enhance_color_document(
                contents
            )
        )

        return Response(
            content=output_bytes,
            media_type="image/png",
        )

    except Exception as error:
        print(
            f"[Color Document] {error}"
        )

        return Response(
            content="Color document processing failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# AUTO CROP
# =========================================================

@app.post("/api/auto-crop")
async def auto_crop_endpoint(
    file: UploadFile = File(...),
):
    try:
        contents = await file.read()

        if not contents:
            return Response(
                content="Empty image file.",
                status_code=400,
                media_type="text/plain",
            )

        image_array = np.frombuffer(
            contents,
            np.uint8,
        )

        image = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR,
        )

        if image is None:
            return Response(
                content="Invalid image.",
                status_code=400,
                media_type="text/plain",
            )

        height, width = image.shape[:2]

        total_area = height * width

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY,
        )

        blurred = cv2.GaussianBlur(
            gray,
            (5, 5),
            0,
        )

        edges = cv2.Canny(
            blurred,
            30,
            150,
        )

        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT,
            (5, 5),
        )

        edges = cv2.dilate(
            edges,
            kernel,
            iterations=1,
        )

        contours, _ = cv2.findContours(
            edges,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        if not contours:

            _, threshold = cv2.threshold(
                gray,
                0,
                255,
                cv2.THRESH_BINARY
                +
                cv2.THRESH_OTSU,
            )

            contours, _ = cv2.findContours(
                threshold,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )

        contours = sorted(
            contours,
            key=cv2.contourArea,
            reverse=True,
        )

        document_points = None

        for contour in contours:

            area = cv2.contourArea(
                contour
            )

            if area < (
                0.05 * total_area
            ):
                continue

            hull = cv2.convexHull(
                contour
            )

            perimeter = cv2.arcLength(
                hull,
                True,
            )

            for epsilon_factor in [
                0.01,
                0.02,
                0.03,
                0.04,
                0.05,
            ]:

                approx = cv2.approxPolyDP(
                    hull,
                    epsilon_factor
                    * perimeter,
                    True,
                )

                if len(approx) == 4:

                    document_points = (
                        approx.reshape(
                            4,
                            2,
                        )
                    )

                    break

            if document_points is not None:
                break

            rect = cv2.minAreaRect(
                hull
            )

            box = cv2.boxPoints(
                rect
            )

            document_points = np.int32(
                box
            )

            break

        if document_points is not None:

            image = four_point_transform(
                image,
                document_points,
            )

        success, encoded = cv2.imencode(
            ".png",
            image,
        )

        if not success:
            return Response(
                content="Could not encode image.",
                status_code=500,
                media_type="text/plain",
            )

        return Response(
            content=encoded.tobytes(),
            media_type="image/png",
        )

    except Exception as error:

        print(
            f"[Auto Crop] {error}"
        )

        return Response(
            content="Auto crop failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# NID AUTO CROP
# =========================================================

@app.post("/api/nid-auto-crop")
async def nid_auto_crop_endpoint(
    file: UploadFile = File(...),
):
    """NID-only auto crop endpoint.

    This endpoint intentionally uses nid_autocrop_processor so the existing
    /api/auto-crop flow used by other pages remains untouched.
    """
    try:
        contents = await file.read()

        if not contents:
            return Response(
                content="Empty image file.",
                status_code=400,
                media_type="text/plain",
            )

        output_bytes = auto_crop_and_deskew(
            contents
        )

        return Response(
            content=output_bytes,
            media_type="image/png",
            headers={"Cache-Control": "no-store"},
        )

    except ValueError as error:
        print(
            f"[NID Auto Crop Validation] {error}"
        )
        return Response(
            content=str(error),
            status_code=400,
            media_type="text/plain",
        )

    except Exception as error:
        print(
            f"[NID Auto Crop] {error}"
        )
        return Response(
            content="NID auto crop failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# REMOVE BACKGROUND
# =========================================================

@app.post("/api/remove-background")
async def remove_background_endpoint(
    file: UploadFile = File(...),
):
    try:
        contents = await file.read()

        if not contents:
            return Response(
                content="Empty image file.",
                status_code=400,
                media_type="text/plain",
            )

        output_bytes = remove_background(
            contents
        )

        return Response(
            content=output_bytes,
            media_type="image/png",
        )

    except ValueError as error:

        print(
            f"[Background Removal Validation] {error}"
        )

        return Response(
            content=str(error),
            status_code=400,
            media_type="text/plain",
        )

    except Exception as error:

        print(
            f"[Background Removal] {error}"
        )

        return Response(
            content="Background removal failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# LOCAL CLOTHING (ACTIVE FALLBACK)
# =========================================================

@app.post("/api/apply-clothing")
async def apply_clothing_endpoint(
    person: UploadFile = File(...),
    clothing: UploadFile = File(...),
    clothing_index: int = Form(0),
):
    try:
        person_bytes = await person.read()
        if not person_bytes:
            return Response(
                content="Person image is empty.",
                status_code=400,
                media_type="text/plain",
            )

        # Background removal fallback to prevent frontend 502/Failed to fetch
        output_bytes = remove_background(person_bytes)

        return Response(
            content=output_bytes,
            media_type="image/png",
        )

    except Exception as error:
        print(f"[Local Clothing Fallback] {error}")
        return Response(
            content="Clothing processing failed.",
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# GEMINI VIRTUAL TRY-ON
# =========================================================

@app.post("/api/gemini-tryon")
async def gemini_tryon_endpoint(
    person: UploadFile = File(...),
    clothing: UploadFile = File(...),
):
    """
    Realistic AI clothing replacement.

    Input:
        person   -> actual user/person photo
        clothing -> selected clothing reference

    Output:
        Gemini-generated JPEG image
    """

    try:

        # Keep the public API stable while Gemini is not configured.
        if not gemini_is_configured():
            return Response(
                content=GEMINI_UNAVAILABLE_MESSAGE,
                status_code=503,
                media_type="text/plain",
                headers={"Cache-Control": "no-store"},
            )

        # -------------------------------------------------
        # Read person image
        # -------------------------------------------------

        person_bytes = await person.read()

        if not person_bytes:
            return Response(
                content="Person image is empty.",
                status_code=400,
                media_type="text/plain",
            )

        # -------------------------------------------------
        # Read clothing image
        # -------------------------------------------------

        clothing_bytes = (
            await clothing.read()
        )

        if not clothing_bytes:
            return Response(
                content="Clothing image is empty.",
                status_code=400,
                media_type="text/plain",
            )

        # -------------------------------------------------
        # MIME types
        # -------------------------------------------------

        person_mime_type = (
            person.content_type
            or "image/jpeg"
        )

        clothing_mime_type = (
            clothing.content_type
            or "image/png"
        )

        if not person_mime_type.startswith(
            "image/"
        ):
            return Response(
                content=(
                    "Person file must be an image."
                ),
                status_code=400,
                media_type="text/plain",
            )

        if not clothing_mime_type.startswith(
            "image/"
        ):
            return Response(
                content=(
                    "Clothing file must be an image."
                ),
                status_code=400,
                media_type="text/plain",
            )

        # -------------------------------------------------
        # Gemini
        # -------------------------------------------------

        print(
            "[Gemini API] Starting virtual try-on..."
        )

        generated_bytes = (
            generate_virtual_try_on(
                person_bytes=person_bytes,
                person_mime_type=person_mime_type,
                clothing_bytes=clothing_bytes,
                clothing_mime_type=clothing_mime_type,
            )
        )

        if not generated_bytes:
            return Response(
                content=(
                    "Gemini returned an empty image."
                ),
                status_code=502,
                media_type="text/plain",
            )

        print(
            "[Gemini API] Virtual try-on completed."
        )

        # -------------------------------------------------
        # IMPORTANT:
        # Current Gemini image response is JPEG.
        # -------------------------------------------------

        return Response(
            content=generated_bytes,
            media_type="image/jpeg",
            headers={
                "Cache-Control": "no-store",
            },
        )

    except ValueError as error:

        print(
            f"[Gemini Validation Error] {error}"
        )

        return Response(
            content=str(error),
            status_code=400,
            media_type="text/plain",
        )

    except Exception as error:

        print(
            f"[Gemini API Error] {error}"
        )

        error_message = str(error)

        if is_temporary_gemini_error(error_message):
            return Response(
                content=GEMINI_UNAVAILABLE_MESSAGE,
                status_code=503,
                media_type="text/plain",
                headers={"Cache-Control": "no-store"},
            )

        return Response(
            content=(
                "Gemini virtual try-on failed: "
                f"{error_message}"
            ),
            status_code=500,
            media_type="text/plain",
        )


# =========================================================
# SERVER RUNNER FOR RENDER / LOCAL
# =========================================================

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)