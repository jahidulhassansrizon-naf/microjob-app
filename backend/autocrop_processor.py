import cv2
import numpy as np

def order_points(pts):
    """ ৪টি কর্নার পয়েন্টকে (Top-Left, Top-Right, Bottom-Right, Bottom-Left) ক্রমানুসারে সাজানো """
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect

def four_point_transform(image, pts):
    """ বাঁকা ৪টি পয়েন্ট অনুযায়ী ছবি কেটে একদম সোজা ও সমান্তরাল করা """
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
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def auto_crop_and_deskew(image_bytes: bytes) -> bytes:
    """ ইমেজ থেকে ডকুমেন্টের বর্ডার খুঁজে বের করে অটো-ক্রপ ও সোজা করা """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    orig = image.copy()

    # ১. ইমেজ ফিল্টারিং ও এজ (Edge) ডিটেকশন
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 200)

    # ২. কন্ট্যুর (Contour) খুঁজে বের করা
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    screenCnt = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        
        # ৪টি কোণা বিশিষ্ট বড় কন্ট্যুর পাওয়া গেলে সেটাই ডকুমেন্ট
        if len(approx) == 4:
            screenCnt = approx
            break

    # ৩. যদি ৪টি কোণা পাওয়া যায় তবে ট্রান্সফর্ম হবে, না হলে Bounding Box দিয়ে ক্রপ হবে
    if screenCnt is not None:
        pts = screenCnt.reshape(4, 2)
        warped = four_point_transform(orig, pts)
    else:
        # ফলব্যাক: ডকুমেন্টের সবচেয়ে বড় অংশের চারপাশ কেটে দেওয়া
        rect = cv2.minAreaRect(contours[0]) if contours else None
        if rect:
            box = cv2.boxPoints(rect)
            box = np.intp(box)
            warped = four_point_transform(orig, box)
        else:
            warped = orig

    _, encoded_img = cv2.imencode('.png', warped)
    return encoded_img.tobytes()