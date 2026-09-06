const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Otp = require("../models/Otp"); // OTP Model
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
  // প্রয়োজন অনুযায়ী অন্যান্য দেশের রুলস এখানে যোগ করতে পারেন
};

// হেল্পার ফাংশন: ফোন নম্বর সঠিক দেশ অনুযায়ী ভ্যালিড করার জন্য
const validatePhoneNumber = (countryString, phoneNumber) => {
  if (!phoneNumber) return "Phone number is required!";

  // country স্ট্রিং থেকে দেশের নাম বের করা (যেমন: "Bangladesh (+880)" থেকে "Bangladesh")
  const countryName = countryString ? countryString.split(" (")[0].trim() : "";
  const rule = countryPhoneRules[countryName];

  // যদি নির্দিষ্ট দেশের রুলস ব্যাকএন্ডে না থাকে, তবে সাধারণ একটি বেসিক চেক (যেমন ৫ থেকে ১৫ ডিজিট) করতে পারেন
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
  return null; // কোনো এরর না থাকলে null রিটার্ন করবে
};

// ==========================================
// ১.১ SMS-এ OTP পাঠানোর এন্ডপয়েন্ট (Send SMS OTP)
// ==========================================
router.post("/send-sms-otp", async (req, res) => {
  try {
    const { phoneNumber, country } = req.body;

    // কান্ট্রি ও ফোন নম্বর ভ্যালিডেশন চেক
    const validationError = validatePhoneNumber(country, phoneNumber);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanPhone = phoneNumber.toString().trim();

    // ফোন নম্বরটি আগে থেকে রেজিস্টার্ড কি না চেক
    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This phone number is already registered!" });
    }

    // ৬ ডিজিটের র্যান্ডম OTP কোড জেনারেট
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // আগের কোনো পেন্ডিং OTP থাকলে মুছে নতুনটি সেভ করা
    await Otp.deleteMany({ phoneNumber: cleanPhone });
    await new Otp({ phoneNumber: cleanPhone, otp: otpCode }).save();

    console.log(`[TEST MODE] Phone OTP for ${cleanPhone} is: ${otpCode}`);

    res.status(200).json({
      message: "OTP sent successfully to your phone number!",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ১.২ জিমেইলে OTP পাঠানোর এন্ডপয়েন্ট (Send Email OTP via Google Script)
// ==========================================
router.post("/send-email-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email address is required!" });
    }

    const cleanEmail = email.toString().toLowerCase().trim();

    // ইমেইলটি আগে থেকে রেজিস্টার্ড কি না চেক
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
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

    // ৬ ডিজিটের র্যান্ডম OTP কোড জেনারেট
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // আগের কোনো পেন্ডিং OTP থাকলে মুছে নতুনটি সেভ করা
    await Otp.deleteMany({ email: cleanEmail });
    await new Otp({ email: cleanEmail, otp: otpCode }).save();

    // Google Script ইমেইল টেমপ্লেট
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

    // Google Apps Script এ রিকোয়েস্ট পাঠানো
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
      await Otp.deleteMany({ email: cleanEmail });
      return res.status(500).json({
        message: "Google Script did not return valid JSON response.",
      });
    }

    if (!googleResult.success) {
      await Otp.deleteMany({ email: cleanEmail });
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
// ২. OTP ভ্যালিডেশন সহ রেজিস্ট্রেশন (Register with OTP)
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

    // কান্ট্রি ও ফোন নম্বর ভ্যালিডেশন চেক
    const validationError = validatePhoneNumber(country, phoneNumber);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const cleanPhone = phoneNumber.toString().trim();
    const cleanEmail = email.toString().toLowerCase().trim();

    // ১. OTP কোড ডাটাবেজে সঠিক আছে কি না চেক (Phone বা Email যেটার মাধ্যমেই আসুক)
    const validOtp = await Otp.findOne({
      $or: [
        { phoneNumber: cleanPhone, otp: otp.trim() },
        { email: cleanEmail, otp: otp.trim() },
      ],
    });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP code!" });
    }

    // ২. ইমেইল বা ফোন নম্বর ডুপ্লিকেট আছে কি না চেক
    const existingUser = await User.findOne({
      $or: [{ phoneNumber: cleanPhone }, { email: cleanEmail }],
    });

    if (existingUser) {
      if (existingUser.phoneNumber === cleanPhone) {
        return res
          .status(400)
          .json({ message: "This phone number is already registered!" });
      }
      if (existingUser.email === cleanEmail) {
        return res
          .status(400)
          .json({ message: "This email is already registered!" });
      }
    }

    // ৩. পাসওয়ার্ড হ্যাশ করা
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ৪. নতুন ইউজার সেভ করা
    const newUser = new User({
      country,
      phoneNumber: cleanPhone,
      email: cleanEmail,
      fullName,
      district,
      password: hashedPassword,
    });

    await newUser.save();

    // ৫. রেজিস্ট্রেশন সফল হলে ব্যবহৃত OTP টি মুছে দেওয়া
    await Otp.deleteMany({
      $or: [{ phoneNumber: cleanPhone }, { email: cleanEmail }],
    });

    res
      .status(201)
      .json({ message: "User registered successfully!", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// ৩. লগইন (Login Route)
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const formattedInput = phoneNumber ? phoneNumber.toLowerCase().trim() : "";

    const user = await User.findOne({
      $or: [{ phoneNumber: phoneNumber }, { email: formattedInput }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password!" });
    }

    const token = jwt.sign(
      { userId: user._id, phoneNumber: user.phoneNumber },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        district: user.district,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
