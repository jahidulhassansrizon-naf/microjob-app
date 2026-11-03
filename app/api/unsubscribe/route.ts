import { addOptOut, readUnsubscribeToken } from "@/app/api/_lib/mailUnsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:24px;background:#EFE5CE;font-family:Arial,Helvetica,sans-serif;color:#3B2F1E">
<div style="max-width:460px;margin:48px auto;background:#FBF6E8;border:1px solid #E3D6B8;border-radius:16px;padding:28px;text-align:center">
<h1 style="margin:0 0 12px;font-size:20px">${title}</h1>${body}</div></body></html>`;
  return new Response(html, { status, headers: HEADERS });
}

/**
 * GET only shows a confirm button. Mail scanners often open links automatically, so the
 * opt-out itself happens on POST (button click, or the mail app's one-click unsubscribe).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = readUnsubscribeToken(url.searchParams.get("e"), url.searchParams.get("t"));
  if (!email) return page("Link not valid", `<p style="margin:0;line-height:1.6">This unsubscribe link is invalid or incomplete.</p>`, 400);
  return page(
    "Unsubscribe from offer emails?",
    `<p style="margin:0 0 18px;line-height:1.6">You will stop receiving offer and promotional emails from SebaLagbe.com. Account emails (like password reset) will still be sent.</p>
<form method="post" action="${url.pathname}${url.search.replace(/&/g, "&amp;")}"><button type="submit" style="background:#DC2626;color:#fff;border:0;border-radius:10px;padding:12px 22px;font-weight:700;font-size:15px;cursor:pointer">Yes, unsubscribe me</button></form>`,
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const email = readUnsubscribeToken(url.searchParams.get("e"), url.searchParams.get("t"));
  if (!email) return page("Link not valid", `<p style="margin:0;line-height:1.6">This unsubscribe link is invalid or incomplete.</p>`, 400);
  try {
    await addOptOut(email);
  } catch (error) {
    console.error("Unsubscribe failed:", error instanceof Error ? error.message : "Unknown error");
    return page("Something went wrong", `<p style="margin:0;line-height:1.6">Please try again in a moment.</p>`, 500);
  }
  return page("You are unsubscribed", `<p style="margin:0;line-height:1.6">You will no longer receive offer emails from SebaLagbe.com.</p>`);
}
