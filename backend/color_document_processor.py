import cv2
import numpy as np

def enhance_color_document(image_bytes):
    # ১. ইমেজ বাইটস ডিকোড করা
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Failed to decode image")

    # ২. LAB কালার স্পেসে কনভার্ট (L = Lightness, A & B = Color)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # ৩. ব্যাকগ্রাউন্ড শ্যাডো স্মুথলি ফ্লাট করার জন্য বড় গাসিয়ান ব্লার
    bg = cv2.GaussianBlur(l, (55, 55), 0)
    
    # ৪. লাইটিং নরম্যালাইজেশন (Division Normalization)
    norm_l = cv2.divide(l.astype(np.float32), bg.astype(np.float32) + 2.0, scale=255.0)
    norm_l = np.clip(norm_l, 0, 255).astype(np.uint8)

    # ৫. CLAHE দিয়ে হালকা ও ঝাপসা লেখার লোকাল কনট্রাস্ট ফুটিয়ে তোলা
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l_clahe = clahe.apply(norm_l)

    # ৬. HSV কালার স্পেস থেকে সিলের নীল/বেগুনি কালি শনাক্ত করার জন্য মাস্ক তৈরি
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    _, s, v = cv2.split(hsv)
    
    # যেখানে সিলের কালার বা নীল কালি আছে, তার জন্য প্রটেকশন মাস্ক
    color_mask = (s > 25) & (v < 240)

    # ৭. সিলের নীল/বেগুনি রঙ উজ্জ্বল ও সজীব করা (A এবং B চ্যানেল বুস্ট)
    a_float = (a.astype(np.float32) - 128.0) * 1.35 + 128.0
    b_float = (b.astype(np.float32) - 128.0) * 1.35 + 128.0
    a_out = np.clip(a_float, 0, 255).astype(np.uint8)
    b_out = np.clip(b_float, 0, 255).astype(np.uint8)

    # ৮. Smooth Background Whitening Ramp (হঠাৎ পিক্সেল না কেটে স্মুথলি ব্যাকগ্রাউন্ড সাদা করা)
    l_float = l_clahe.astype(np.float32)
    bg_factor = np.clip((l_float - 165.0) / (230.0 - 165.0), 0.0, 1.0)
    l_whitened = l_float * (1.0 - bg_factor) + 255.0 * bg_factor
    l_final = np.clip(l_whitened, 0, 255).astype(np.uint8)

    # ৯. সিলের অংশে অরিজিনাল কালার বজায় রাখা এবং বাকি অংশে ক্লিনার টেক্সট বসানো
    final_l = np.where(color_mask, l, l_final).astype(np.uint8)

    # ১০. চ্যানেলগুলো মার্জ করে BGR-এ রূপান্তর
    merged_lab = cv2.merge((final_l, a_out, b_out))
    output_img = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

    # ১১. ফাইনাল শার্পনিং (লেখাগুলোকে আরও ক্রিস্প ও প্রিন্ট-রেডি করার জন্য)
    gaussian = cv2.GaussianBlur(output_img, (0, 0), 1.5)
    output_img = cv2.addWeighted(output_img, 1.3, gaussian, -0.3, 0)

    success, encoded_img = cv2.imencode('.png', output_img)
    if not success:
        raise ValueError("Failed to process color document")

    return encoded_img.tobytes()