const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../firebase");
const {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} = require("firebase/firestore");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

// ==========================================
// দেশের নাম এবং ফোন নম্বরের লেন্থ বা প্যাটার্ন ভ্যালিডেশন রুলস
// ==========================================
const countryPhoneRules = {
  Bangladesh: { code: "+880", minLen: 10, maxLen: 11, example: "017XXXXXXXX" },
  India: { code: "+91", minLen: 10, maxLen: 10, example: "9876543210" },
  "United States": {
    code: "+1",
    minLen: 10,
    maxLen: 10,
    example: "2025550143",
  },
  "United Kingdom": {
    code: "+44",
    minLen: 10,
    maxLen: 10,
    example: "7911123456",
  },
};

const validatePhoneNumber = (countryString, phoneNumber) => {
  if (!phoneNumber) return "Phone number is required!";
  const countryName = countryString ? countryString.split(" (")[0].trim() : "";
  const rule = countryPhoneRules[countryName];
  const cleanNum = phoneNumber.toString().trim();

  if (rule) {
    if (cleanNum.length < rule.minLen || cleanNum.length > rule.maxLen) {
      return `For ${countryName}, phone number must be between ${rule.minLen} and ${rule.maxLen} digits! (e.g. ${rule.example})`;
    }
  } else {
    if (cleanNum.length < 5 || cleanNum.length > 15) {
      return "Please enter a valid phone number!";
    }
  }
  return null;
};

// ==========================================
// ১.১ SMS-এ OTP পাঠানোর এন্ডপয়েন্ট
// ==========================================
router.post("/send-sms-otp", async (req, res) => {
  try {
    const { phoneNumber, country } = req.body;

    const validationError = validatePhoneNumber(country, phoneNumber);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanPhone = phoneNumber.toString().trim();

    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("phoneNumber", "==", cleanPhone));
    const userSnap = await getDocs(qUser);

    if (!userSnap.empty) {
      return res
        .status(400)
        .json({ message: "This phone number is already registered!" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otpsRef = collection(db, "otps");
    const qOtp = query(otpsRef, where("phoneNumber", "==", cleanPhone));
    const otpSnap = await getDocs(qOtp);

    for (const d of otpSnap.docs) {
      await deleteDoc(doc(db, "otps", d.id));
    }

    await setDoc(doc(db, "otps", cleanPhone), {
      phoneNumber: cleanPhone,
      otp: otpCode,
      createdAt: new Date(),
    });

    console.log(`[TEST MODE] Phone OTP for ${cleanPhone} is: ${otpCode}`);

    res.status(200).json({
      message: "OTP sent successfully to your phone number!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ১.২ জিমেইলে OTP পাঠানোর এন্ডপয়েন্ট
// ==========================================
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required!" });
    }

    const cleanEmail = email.toString().toLowerCase().trim();

    const usersRef = collection(db, "users");
    const qUser = query(usersRef, where("email", "==", cleanEmail));
    const userSnap = await getDocs(qUser);

    if (!userSnap.empty) {
      return res
        .status(400)
        .json({ message: "This email is already registered!" });
    }

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    if (!GOOGLE_SCRIPT_URL) {
      return res.status(500).json({
        message:
          "GOOGLE_SCRIPT_URL is missing in environment variables (.env)!",
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const otpsRef = collection(db, "otps");
    const qOtp = query(otpsRef, where("email", "==", cleanEmail));
    const otpSnap = await getDocs(qOtp);

    for (const d of otpSnap.docs) {
      await deleteDoc(doc(db, "otps", d.id));
    }

    const emailDocId = cleanEmail.replace(/[^a-zA-Z0-9]/g, "_");
    await setDoc(doc(db, "otps", emailDocId), {
      email: cleanEmail,
      otp: otpCode,
      createdAt: new Date(),
    });

    const emailHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #FF5D00; margin-bottom: 10px;">SohozKaj Email Verification</h2>
        <p style="color: #333; font-size: 14px;">Hello,</p>
        <p style="color: #555; font-size: 14px;">Your verification code for SohozKaj account registration is:</p>
        <div style="background-color: #fff3ec; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #FF5D00; letter-spacing: 6px; font-size: 32px; margin: 0;">${otpCode}</h1>
        </div>
        <p style="color: #777; font-size: 12px;">This code is valid for 5 minutes. Do not share this code with anyone.</p>
      </div>
    `;

    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        subject: `${otpCode} is your SohozKaj verification code`,
        html: emailHTML,
      }),
    });

    const responseText = await googleResponse.text();
    let googleResult;

    try {
      googleResult = JSON.parse(responseText);
    } catch (err) {
      await deleteDoc(doc(db, "otps", emailDocId));
      return res.status(500).json({
        message: "Google Script did not return valid JSON response.",
      });
    }

    if (!googleResult.success) {
      await deleteDoc(doc(db, "otps", emailDocId));
      return res.status(500).json({
        message: "Failed to send email via Google Script.",
      });
    }

    console.log(`[TEST MODE] Email OTP for ${cleanEmail} is: ${otpCode}`);

    res.status(200).json({
      message: `OTP sent successfully to ${cleanEmail}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ২. OTP ভ্যালিডেশন সহ রেজিস্ট্রেশন
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { country, phoneNumber, email, fullName, district, password, otp } =
      req.body;

    if (!phoneNumber || !email || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number, Email, and OTP code are required!" });
    }

    const validationError = validatePhoneNumber(country, phoneNumber);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanPhone = phoneNumber.toString().trim();
    const cleanEmail = email.toString().toLowerCase().trim();

    const otpsRef = collection(db, "otps");
    const qPhoneOtp = query(
      otpsRef,
      where("phoneNumber", "==", cleanPhone),
      where("otp", "==", otp.trim()),
    );
    const qEmailOtp = query(
      otpsRef,
      where("email", "==", cleanEmail),
      where("otp", "==", otp.trim()),
    );

    const [phoneSnap, emailSnap] = await Promise.all([
      getDocs(qPhoneOtp),
      getDocs(qEmailOtp),
    ]);

    if (phoneSnap.empty && emailSnap.empty) {
      return res.status(400).json({ message: "Invalid or expired OTP code!" });
    }

    const usersRef = collection(db, "users");
    const qUserPhone = query(usersRef, where("phoneNumber", "==", cleanPhone));
    const qUserEmail = query(usersRef, where("email", "==", cleanEmail));

    const [existingPhoneSnap, existingEmailSnap] = await Promise.all([
      getDocs(qUserPhone),
      getDocs(qUserEmail),
    ]);

    if (!existingPhoneSnap.empty) {
      return res
        .status(400)
        .json({ message: "This phone number is already registered!" });
    }
    if (!existingEmailSnap.empty) {
      return res
        .status(400)
        .json({ message: "This email is already registered!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRef = doc(collection(db, "users"));
    const userData = {
      id: newUserRef.id,
      country,
      phoneNumber: cleanPhone,
      email: cleanEmail,
      fullName,
      district,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await setDoc(newUserRef, userData);

    for (const d of phoneSnap.docs) await deleteDoc(doc(db, "otps", d.id));
    for (const d of emailSnap.docs) await deleteDoc(doc(db, "otps", d.id));

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUserRef.id,
        fullName,
        phoneNumber: cleanPhone,
        email: cleanEmail,
        district,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ৩. লগইন
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const formattedInput = phoneNumber ? phoneNumber.toLowerCase().trim() : "";

    const usersRef = collection(db, "users");

    const qPhone = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const qEmail = query(usersRef, where("email", "==", formattedInput));

    const [phoneSnap, emailSnap] = await Promise.all([
      getDocs(qPhone),
      getDocs(qEmail),
    ]);

    let userDoc = null;
    if (!phoneSnap.empty) {
      userDoc = phoneSnap.docs[0].data();
    } else if (!emailSnap.empty) {
      userDoc = emailSnap.docs[0].data();
    }

    if (!userDoc) {
      return res.status(400).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password!" });
    }

    const token = jwt.sign(
      { userId: userDoc.id, phoneNumber: userDoc.phoneNumber },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: userDoc.id,
        fullName: userDoc.fullName,
        phoneNumber: userDoc.phoneNumber,
        email: userDoc.email,
        district: userDoc.district,
        country: userDoc.country,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ৪. বর্তমান লগইনকৃত ইউজার প্রোফাইল ডাটা পাওয়া
// ==========================================
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided!" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("id", "==", decoded.userId));
    const userSnap = await getDocs(q);

    if (userSnap.empty) {
      return res.status(404).json({ message: "User not found!" });
    }

    const userData = userSnap.docs[0].data();
    delete userData.password; // সিকিউরিটির জন্য পাসওয়ার্ড বাদ দেওয়া হলো

    res.status(200).json({ user: userData });
  } catch (error) {
    res
      .status(401)
      .json({ message: "Invalid or expired token!", error: error.message });
  }
});

module.exports = router;
