import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { country, phoneNumber, email, fullName, district, password, otp } =
      await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP code are required!" },
        { status: 400 },
      );
    }

    const cleanEmail = email.toString().toLowerCase().trim();
    const cleanPhone = phoneNumber ? phoneNumber.toString().trim() : "";
    const cleanOtp = otp.toString().trim();

    // ডাটাবেজ থেকে ওটিপি চেক করার সময় email, phoneNumber এবং identifier সব দিক থেকে কুয়েরি করা হলো যাতে মিস না হয়
    const validOtp = await Otp.findOne({
      $or: [
        { email: cleanEmail },
        { phoneNumber: cleanPhone },
        { identifier: cleanEmail },
        { identifier: cleanPhone },
      ],
      otp: cleanOtp,
    });

    if (!validOtp) {
      return NextResponse.json(
        { message: "Invalid or expired OTP code!" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({
      $or: [{ phoneNumber: cleanPhone }, { email: cleanEmail }],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json(
          { message: "This email is already registered!" },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { message: "This phone number is already registered!" },
        { status: 400 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      country,
      phoneNumber: cleanPhone,
      email: cleanEmail,
      fullName,
      district,
      password: hashedPassword,
    });

    // রেজিস্ট্রেশন সফল হওয়ার পর ওটিপি মুছে ফেলা
    await Otp.deleteMany({
      $or: [
        { email: cleanEmail },
        { phoneNumber: cleanPhone },
        { identifier: cleanEmail },
        { identifier: cleanPhone },
      ],
    });

    return NextResponse.json(
      {
        message: "User registered successfully!",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          phoneNumber: newUser.phoneNumber,
          email: newUser.email,
          district: newUser.district,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration API error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
