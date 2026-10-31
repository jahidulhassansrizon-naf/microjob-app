import { NextResponse } from "next/server";
import { getUddoktaPayConfig } from "@/app/api/uddoktapay/_lib/uddoktapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
const NO_STORE = { "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate" };

export async function GET() {
  try {
    const config = await getUddoktaPayConfig();
    return NextResponse.json({ success: true, enabled: Boolean(config.configured && config.enabled) }, { headers: NO_STORE });
  } catch (error) {
    console.error("UddoktaPay public status check failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, enabled: false }, { status: 503, headers: NO_STORE });
  }
}
