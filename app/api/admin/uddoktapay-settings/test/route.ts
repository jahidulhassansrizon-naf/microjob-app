import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { testUddoktaPayConnection } from "@/app/api/uddoktapay/_lib/uddoktapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function POST(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;
  try {
    const result = await testUddoktaPayConnection();
    return NextResponse.json(result, { status: 200, headers: NO_STORE });
  } catch (error) {
    console.error("UddoktaPay connection test failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, status: "connection-error", message: "UddoktaPay connection test could not be completed." }, { status: 200, headers: NO_STORE });
  }
}
