import { NextResponse } from "next/server";
import { getVerifiedRequestSession } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Deprecated compatibility endpoint. Live presence now uses authenticated HTTP
 * heartbeat/polling, so tickets and provider-specific WebSocket upgrades are not needed.
 */
export async function POST(request: Request) {
  const session = getVerifiedRequestSession(request);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please sign in." },
      { status: 401 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "WebSocket tickets are no longer used; HTTP live presence is active.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
