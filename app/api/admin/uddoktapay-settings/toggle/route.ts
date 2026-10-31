import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import UddoktaPaySettings from "@/models/UddoktaPaySettings";
import { testUddoktaPayConnection } from "@/app/api/uddoktapay/_lib/uddoktapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function POST(request: Request) {
  const { admin, response } = await requireAdmin(request);
  if (response) return response;
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.enabled !== "boolean") return NextResponse.json({ success: false, message: "Choose whether UddoktaPay checkout should be enabled or disabled." }, { status: 400, headers: NO_STORE });
    await connectDB();
    const existing = await UddoktaPaySettings.findOne({ key: "primary" });
    if (!existing) return NextResponse.json({ success: false, message: "Save UddoktaPay settings before changing checkout status." }, { status: 400, headers: NO_STORE });

    if (body.enabled) {
      const probe = await testUddoktaPayConnection();
      if (!probe.success) return NextResponse.json({ success: false, message: `Live checkout was not enabled. ${probe.message}` }, { status: 409, headers: NO_STORE });
    }
    await UddoktaPaySettings.updateOne({ key: "primary" }, { $set: { enabled: body.enabled, updatedBy: admin?.email || "administrator" } });
    return NextResponse.json({ success: true, settings: { enabled: body.enabled }, message: body.enabled ? "UddoktaPay live checkout is enabled. Customers can now start real payments." : "UddoktaPay checkout is disabled. PipraPay and manual bKash/Nagad remain unchanged." }, { headers: NO_STORE });
  } catch (error) {
    console.error("UddoktaPay checkout toggle failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "UddoktaPay checkout status could not be changed. Please try again." }, { status: 500, headers: NO_STORE });
  }
}
