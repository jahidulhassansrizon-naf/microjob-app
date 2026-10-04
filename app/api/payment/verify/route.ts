import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyAndActivateSubscription } from "../_lib/paymently";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_12345";

type JwtPayload = {
  userId: string;
  exp?: number;
};

function getTokenFromCookie(cookieHeader: string | null) {
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  return pair ? decodeURIComponent(pair.slice("token=".length)) : null;
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in before verifying this payment.",
        },
        { status: 401 },
      );
    }

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Your login session has expired.",
        },
        { status: 401 },
      );
    }

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login token.",
        },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const invoiceId = String(body?.invoice_id || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: "invoice_id is required.",
        },
        { status: 400 },
      );
    }

    const result = await verifyAndActivateSubscription(invoiceId, {
      expectedUserId: String(decoded.userId),
    });

    return NextResponse.json(
      {
        success: result.ok,
        alreadyCompleted: Boolean(result.alreadyCompleted),
        paymentStatus: result.paymentStatus || result.payment?.status || null,
        message: result.message,
        payment: result.payment
          ? {
              invoice_id: result.payment.invoice_id || invoiceId,
              transaction_id: result.payment.transaction_id || null,
              sender_number: result.payment.sender_number || null,
              payment_method: result.payment.payment_method || null,
              status: result.payment.status || null,
            }
          : null,
        subscription: result.subscription || null,
      },
      { status: result.ok ? 200 : result.httpStatus },
    );
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Payment verification failed.",
      },
      { status: 500 },
    );
  }
}
