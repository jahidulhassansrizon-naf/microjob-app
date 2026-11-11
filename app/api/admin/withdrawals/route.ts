import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Withdrawal from "@/app/api/_lib/Withdrawal";
import Subscription from "@/models/Subscription";
import { requireAdmin } from "../_lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const HEADERS = { "Cache-Control": "no-store, max-age=0" };

// Same "real payment" rule the overview uses for Total revenue.
const realPaymentMatch = {
  paymentStatus: "COMPLETED",
  invoiceId: { $not: /^MOCK-/i },
  paymentMethod: { $not: /MOCK/i },
};

async function totals() {
  const [revenueRows, withdrawnRows] = await Promise.all([
    Subscription.aggregate([{ $match: realPaymentMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
  ]);
  const totalRevenue = Number(revenueRows[0]?.total || 0);
  const totalWithdrawn = Number(withdrawnRows[0]?.total || 0);
  return {
    totalRevenue,
    totalWithdrawn,
    withdrawalCount: Number(withdrawnRows[0]?.count || 0),
    availableRevenue: totalRevenue - totalWithdrawn,
  };
}

export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    await connectDB();
    const [rows, summary] = await Promise.all([
      Withdrawal.find({}).sort({ withdrawnAt: -1, createdAt: -1 }).limit(100).lean(),
      totals(),
    ]);
    return NextResponse.json(
      {
        success: true,
        ...summary,
        withdrawals: rows.map((row: any) => ({
          id: String(row._id),
          amount: Number(row.amount || 0),
          note: row.note || "",
          method: row.method || "",
          accountNumber: row.accountNumber || "",
          accountName: row.accountName || "",
          transactionId: row.transactionId || "",
          withdrawnAt: row.withdrawnAt,
          createdBy: row.createdBy || "",
        })),
      },
      { headers: HEADERS },
    );
  } catch (error) {
    console.error("Admin withdrawals load error:", error);
    return NextResponse.json({ success: false, message: "Could not load withdrawals." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    const amount = Math.round(Number(body?.amount));
    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json({ success: false, message: "Enter a valid withdrawal amount." }, { status: 400 });
    }
    if (amount > 100_000_000) {
      return NextResponse.json({ success: false, message: "That amount is too large." }, { status: 400 });
    }
    const note = clean(body?.note, 300);
    const method = clean(body?.method, 80);
    const accountNumber = clean(body?.accountNumber, 60);
    const accountName = clean(body?.accountName, 100);
    const transactionId = clean(body?.transactionId, 80);
    let withdrawnAt = new Date();
    if (body?.withdrawnAt) {
      const parsed = new Date(body.withdrawnAt);
      if (!Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now() + 24 * 60 * 60 * 1000) withdrawnAt = parsed;
    }

    await connectDB();
    const before = await totals();
    if (amount > before.availableRevenue) {
      return NextResponse.json(
        { success: false, message: `Withdrawal is more than the available revenue (BDT ${before.availableRevenue.toLocaleString("en-BD")}).` },
        { status: 400 },
      );
    }
    await Withdrawal.create({ amount, note, method, accountNumber, accountName, transactionId, withdrawnAt, createdBy: admin?.email || "administrator" });
    return NextResponse.json({ success: true, message: "Withdrawal added.", ...(await totals()) }, { headers: HEADERS });
  } catch (error) {
    console.error("Admin withdrawal create error:", error);
    return NextResponse.json({ success: false, message: "Could not save the withdrawal." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, message: "Invalid withdrawal id." }, { status: 400 });
    }
    await connectDB();
    const deleted = await Withdrawal.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: "Withdrawal not found." }, { status: 404 });
    return NextResponse.json({ success: true, message: "Withdrawal removed.", ...(await totals()) }, { headers: HEADERS });
  } catch (error) {
    console.error("Admin withdrawal delete error:", error);
    return NextResponse.json({ success: false, message: "Could not remove the withdrawal." }, { status: 500 });
  }
}
