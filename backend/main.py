from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import cv2
import numpy as np

# প্রসেসর মডিউলগুলো ইমপোর্ট
from document_processor import process_document_image
import color_document_processor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]       # Top-Left
    rect[2] = pts[np.argmax(s)]       # Bottom-Right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]    # Top-Right
    rect[3] = pts[np.argmin(-diff)]   # Bottom-Left
    return rect

def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(image, M, (maxWidth, maxHeight))


@app.post("/api/clean-document")
async def clean_document_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    output_bytes = process_document_image(contents)
    return Response(content=output_bytes, media_type="image/png")


@app.post("/api/color-document")
async def color_document_endpoint(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        # color_document_processor-এর সঠিক ফাংশনটি কল করা হয়েছে
        output_bytes = color_document_processor.enhance_color_document(contents)
        return Response(content=output_bytes, media_type="image/png")
    except Exception as e:
        print(f"Color processing error: {str(e)}")
        return Response(content=contents, media_type="image/png")


@app.post("/api/auto-crop")
async def auto_crop_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    h, w, _ = img.shape
    total_area = h * w

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    edged = cv2.Canny(blurred, 30, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    edged = cv2.dilate(edged, kernel, iterations=1)

    contours, _ = cv2.findContours(edged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    doc_pts = None

    for c in contours:
        area = cv2.contourArea(c)
        if area < (0.05 * total_area):
            continue

        hull = cv2.convexHull(c)
        peri = cv2.arcLength(hull, True)

        for eps_factor in [0.02, 0.03, 0.04, 0.05, 0.01]:
            approx = cv2.approxPolyDP(hull, eps_factor * peri, True)
            if len(approx) == 4:
                doc_pts = approx.reshape(4, 2)
                break

        if doc_pts is not None:
            break

        rect = cv2.minAreaRect(hull)
        box = cv2.boxPoints(rect)
        doc_pts = np.int32(box)
        break

    if doc_pts is not None:
        img = four_point_transform(img, doc_pts)

    _, encoded_img = cv2.imencode(".png", img)
    return Response(content=encoded_img.tobytes(), media_type="image/png")