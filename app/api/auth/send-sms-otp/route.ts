import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phoneNumber, country } = await req.json();

    const validationError = validatePhoneNumber(country, phoneNumber);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const cleanPhone = phoneNumber.toString().trim();

    const existingUser = await User.findOne({ phoneNumber: cleanPhone });
    if (existingUser) {
      return NextResponse.json(
        { message: "This phone number is already registered!" },
        { status: 400 },
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ phoneNumber: cleanPhone });
    await Otp.create({ phoneNumber: cleanPhone, otp: otpCode });

    console.log(`[TEST MODE] Phone OTP for ${cleanPhone} is: ${otpCode}`);

    return NextResponse.json(
      { message: "OTP sent successfully to your phone number!" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
