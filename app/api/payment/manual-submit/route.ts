import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import {
  SUBSCRIPTION_PLAN_BY_ID,
  type SubscriptionPlanId,
} from "@/app/_lib/subscriptionPlans";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "";
const WALLET_NUMBERS = {
  Nagad: process.env.NAGAD_PAYMENT_NUMBER?.trim() || "",
  "bKash": process.env.BKASH_PAYMENT_NUMBER?.trim() || "",
};

type AuthClaims = { userId?: string };
type PlanId = SubscriptionPlanId;
type WalletMethod = keyof typeof WALLET_NUMBERS;

function getToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice("Bearer ".length).trim();
    if (bearer) return bearer;
  }
  const cookie = request.headers.get("cookie") || "";
  const pair = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!pair) return null;
  try {
    return decodeURIComponent(pair.slice("token=".length));
  } catch {
    return pair.slice("token=".length);
  }
}

function getUserId(request: Request): string | null {
  const token = getToken(request);
  if (!token || !JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthClaims;
    return decoded.userId && mongoose.isValidObjectId(decoded.userId)
      ? decoded.userId
      : null;
  } catch {
    return null;
  }
}

function normalizePhone(value: unknown): string | null {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("00880")) digits = digits.slice(2);
  if (digits.startsWith("880")) digits = `0${digits.slice(3)}`;
  if (!/^01[3-9]\d{8}$/.test(digits)) return null;
  return digits;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function authError() {
  return NextResponse.json(
    { success: false, message: "পেমেন্ট জমা দিতে আগে আপনার অ্যাকাউন্টে লগইন করুন।" },
    { status: 401 },
  );
}

function getPlan(planId: string | null) {
  const id = (planId || "1-month") as PlanId;
  if (!Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLAN_BY_ID, id)) return null;
  return SUBSCRIPTION_PLAN_BY_ID[id];
}

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) return authError();

  try {
    await connectDB();
    const url = new URL(request.url);
    const planId = url.searchParams.get("plan") || "1-month";
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ success: false, message: "সঠিক সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন।" }, { status: 400 });
    }

    const [user, pending] = await Promise.all([
      User.findById(userId).select("fullName email phoneNumber").lean(),
      Subscription.findOne({ userId, paymentStatus: "PENDING", accessStatus: "PENDING", paymentMethod: { $in: ["Nagad", "bKash"] }, transactionId: { $ne: "" } })
        .sort({ createdAt: -1 })
        .select("planId planName amount paymentMethod transactionId senderNumber submittedAt reviewStatus createdAt")
        .lean(),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: "আপনার অ্যাকাউন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        user: { fullName: user.fullName || "", phoneNumber: user.phoneNumber || "" },
        plan: { id: planId, name: plan.name, duration: plan.duration, months: plan.months, days: plan.days, price: plan.price },
        paymentNumbers: WALLET_NUMBERS,
        pending: pending ? {
          id: String(pending._id),
          planId: pending.planId,
          planName: pending.planName,
          amount: Number(pending.amount || 0),
          paymentMethod: pending.paymentMethod || "",
          transactionId: pending.transactionId || "",
          senderNumber: pending.senderNumber || "",
          submittedAt: pending.submittedAt || pending.createdAt || null,
          reviewStatus: pending.reviewStatus || "PENDING",
        } : null,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Manual payment setup error:", error);
    return NextResponse.json({ success: false, message: "পেমেন্টের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  if (!userId) return authError();

  try {
    await connectDB();
    const body = await request.json().catch(() => null);
    const planId = String(body?.planId || "");
    const plan = getPlan(planId);
    const method = String(body?.paymentMethod || "") as WalletMethod;
    // MFS TrxIDs are 8–10 alphanumeric characters. Do not silently strip
    // internal spaces or punctuation; reject values that do not match the format.
    const transactionId = String(body?.transactionId || "").trim();
    const transactionIdKey = transactionId.toUpperCase();
    const senderNumber = normalizePhone(body?.senderNumber);

    if (!plan) {
      return NextResponse.json({ success: false, message: "সঠিক সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন।" }, { status: 400 });
    }
    if (!Object.prototype.hasOwnProperty.call(WALLET_NUMBERS, method)) {
      return NextResponse.json({ success: false, message: "Nagad অথবা bKash নির্বাচন করুন।" }, { status: 400 });
    }
    if (!WALLET_NUMBERS[method]) {
      return NextResponse.json({ success: false, message: `${method} পেমেন্ট নম্বর সার্ভারে সেট করা নেই। সাপোর্টে যোগাযোগ করুন।` }, { status: 503 });
    }
    if (!/^[A-Za-z0-9]{8,10}$/.test(transactionId)) {
      return NextResponse.json(
        { success: false, message: "সঠিক TrxID লিখুন। TrxID অবশ্যই ৮–১০টি ইংরেজি অক্ষর/সংখ্যার হতে হবে; ৪–৫ অক্ষরের ID গ্রহণ করা হবে না।" },
        { status: 400 },
      );
    }
    if (!senderNumber) {
      return NextResponse.json({ success: false, message: "যে বাংলাদেশি মোবাইল নম্বর থেকে টাকা পাঠিয়েছেন, সেটি সঠিকভাবে লিখুন।" }, { status: 400 });
    }

    const user = await User.findById(userId).select("_id").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "আপনার অ্যাকাউন্টটি পাওয়া যায়নি।" }, { status: 404 });
    }

    const alreadyPending = await Subscription.findOne({
      userId: user._id,
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
      paymentMethod: { $in: ["Nagad", "bKash"] },
      transactionId: { $ne: "" },
    }).select("_id").lean();
    if (alreadyPending) {
      return NextResponse.json({ success: false, message: "আপনার একটি পেমেন্ট ইতিমধ্যে রিভিউতে আছে। সেটির রিভিউ শেষ হওয়া পর্যন্ত অপেক্ষা করুন।" }, { status: 409 });
    }

    const trxRegex = new RegExp(`^${escapeRegExp(transactionId)}$`, "i");
    const duplicate = await Subscription.findOne({
      $or: [{ transactionIdKey }, { transactionId: trxRegex }],
    }).select("_id").lean();
    if (duplicate) {
      return NextResponse.json({ success: false, message: "এই TrxID আগে জমা দেওয়া হয়েছে। সঠিক Transaction ID যাচাই করে দিন।" }, { status: 409 });
    }

    const subscription = await Subscription.create({
      userId: user._id,
      planId,
      planName: plan.name,
      months: plan.months,
      amount: plan.price,
      paymentMethod: method,
      senderNumber,
      transactionId,
      transactionIdKey,
      submittedAt: new Date(),
      reviewStatus: "PENDING",
      paymentStatus: "PENDING",
      accessStatus: "PENDING",
      invoiceId: "",
    });

    return NextResponse.json({
      success: true,
      message: "আপনার পেমেন্টের তথ্য জমা হয়েছে। অ্যাডমিন যাচাই করার পর অ্যাক্সেস চালু হবে।",
      subscription: {
        id: String(subscription._id),
        planId: subscription.planId,
        planName: subscription.planName,
        amount: subscription.amount,
        paymentMethod: subscription.paymentMethod,
        transactionId: subscription.transactionId,
        senderNumber: subscription.senderNumber,
        paymentStatus: subscription.paymentStatus,
        accessStatus: subscription.accessStatus,
        reviewStatus: subscription.reviewStatus,
        submittedAt: subscription.submittedAt,
      },
    }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, message: "এই TrxID আগে জমা দেওয়া হয়েছে।" }, { status: 409 });
    }
    console.error("Manual payment submission error:", error);
    return NextResponse.json({ success: false, message: "পেমেন্ট জমা দেওয়া যায়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
