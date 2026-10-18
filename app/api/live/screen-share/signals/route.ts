/**
 * Retired WebRTC signaling relay. Screen sharing now uses an authenticated
 * LiveKit room; SDP/candidate messages are not written to the application DB.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("Screen-share signaling moved to LiveKit.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, max-age=0" },
  });
}

export async function POST() {
  return new Response("Screen-share signaling moved to LiveKit.", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, max-age=0" },
  });
}
