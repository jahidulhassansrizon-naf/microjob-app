/**
 * The old provider-specific WebSocket endpoint is intentionally retired.
 * Live user presence and activity use the standard authenticated HTTP snapshot
 * API so local Next.js, Vercel, and Node hosts share the same transport behavior.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(
    "WebSocket presence is retired. Use /api/auth/presence/update and /api/admin/live.",
    {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
