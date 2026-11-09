// Shared, email-client-safe HTML templates for SebaLagbe.com transactional mail.
// Table layout + inline styles only (Gmail/Outlook/Apple Mail safe). Theme matches the
// site's login/register pages: cream #F2E8D2 page, #FBF6E8 card, red #DC2626 accents, deep brown #3B2F1E text.

const FONT = "'Hind Siliguri','Plus Jakarta Sans',Segoe UI,Arial,Helvetica,sans-serif";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] || c;
  });
}

type OtpKind = "register" | "password-reset";

const COPY: Record<
  OtpKind,
  {
    badge: string;
    title: string;
    titleBn: string;
    intro: string;
    introBn: string;
    ignore: string;
    ignoreBn: string;
    preheader: string;
  }
> = {
  register: {
    badge: "EMAIL VERIFICATION",
    title: "Verify your email",
    titleBn: "আপনার ইমেইল যাচাই করুন",
    intro: "Use this one-time code to finish creating your Seba Lagbe account.",
    introBn: "আপনার সেবা লাগবে অ্যাকাউন্ট তৈরি সম্পন্ন করতে এই একবারের কোডটি ব্যবহার করুন।",
    ignore: "If you did not try to create a Seba Lagbe account, you can safely ignore this email.",
    ignoreBn: "আপনি অ্যাকাউন্ট খোলার চেষ্টা না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।",
    preheader: "Your Seba Lagbe verification code. It expires in 5 minutes.",
  },
  "password-reset": {
    badge: "ACCOUNT SECURITY",
    title: "Reset your password",
    titleBn: "পাসওয়ার্ড রিসেট করুন",
    intro: "Use this one-time code to securely reset your Seba Lagbe password.",
    introBn: "আপনার সেবা লাগবে পাসওয়ার্ড নিরাপদে রিসেট করতে এই একবারের কোডটি ব্যবহার করুন।",
    ignore:
      "If you did not request a password reset, no action is needed and your password will remain unchanged.",
    ignoreBn: "আপনি পাসওয়ার্ড রিসেটের অনুরোধ না করে থাকলে কিছু করতে হবে না, আপনার পাসওয়ার্ড অপরিবর্তিত থাকবে।",
    preheader: "Your Seba Lagbe password reset code. It expires in 5 minutes.",
  },
};

// Same brand asset the website uses (SiteBrandLogo falls back to it). Email clients need an
// absolute URL, so the site origin comes from the same env vars used for unsubscribe links.
function siteOrigin() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "").trim();
  return (configured || "https://sebalagbe.com").replace(/\/+$/, "");
}

function shell(preheader: string, inner: string) {
  const year = new Date().getFullYear();
  const origin = siteOrigin();
  const logo = `${origin}/sebalagbelogo/sebalagbelogo.png`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>Seba Lagbe</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#F2E8D2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F2E8D2;font-size:1px;line-height:1px;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2E8D2" style="background:#F2E8D2;">
<tr><td align="center" style="padding:40px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td align="center" style="padding:0 0 22px;">
      <a href="${origin}" target="_blank" style="text-decoration:none;"><img src="${logo}" width="150" alt="SEBALAGBE.COM" style="display:block;border:0;outline:none;height:auto;max-width:150px;font-family:${FONT};font-size:18px;font-weight:800;color:#DC2626;"></a>
    </td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;background:#FBF6E8;border:1px solid #E3D6B8;border-radius:20px;overflow:hidden;font-family:${FONT};color:#3B2F1E;">
        <tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:#DC2626;background:linear-gradient(90deg,#E5393B 0%,#DC2626 55%,#F0B27A 100%);">&nbsp;</td></tr>
        ${inner}
        <tr><td style="padding:18px 32px;background:#3B2F1E;font-size:11px;line-height:1.7;color:#D9C9A6;">
          <div style="font-weight:700;color:#F5E9C8;">Seba Lagbe &middot; সেবা লাগবে</div>
          <div style="color:#BFAE8B;">&copy; ${year} SebaLagbe.com. All rights reserved. &middot; সর্বস্বত্ব সংরক্ষিত।</div>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:16px 8px 0;font-family:${FONT};font-size:11px;line-height:1.6;color:#9A8A6E;">This is an automated security message. Please do not reply to this email.<br>এটি একটি স্বয়ংক্রিয় নিরাপত্তা বার্তা, অনুগ্রহ করে উত্তর দেবেন না।</td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export function renderOtpEmail(input: { kind: OtpKind; name?: string; code: string; expiresMinutes?: number }) {
  const c = COPY[input.kind];
  const name = escapeHtml((input.name || "").trim().slice(0, 100));
  const minutes = input.expiresMinutes ?? 5;
  const digits = escapeHtml(input.code);

  const inner = `<tr><td style="padding:32px 32px 30px;">
      <div style="display:inline-block;margin-bottom:16px;padding:6px 12px;border:1px solid #FBD5D5;border-radius:999px;background:#FDECEC;color:#B91C1C;font-size:11px;font-weight:700;letter-spacing:1.2px;font-family:Arial,Helvetica,sans-serif;">${c.badge}</div>
      <h1 style="margin:0;font-size:26px;line-height:1.25;color:#3B2F1E;font-weight:800;">${c.title}</h1>
      <div style="margin:4px 0 20px;font-size:15px;line-height:1.6;color:#7A6A50;">${c.titleBn}</div>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.75;color:#4A3C27;font-weight:600;">${name ? `Hello ${name}, &nbsp;/&nbsp; হ্যালো ${name},` : "Hello, &nbsp;/&nbsp; হ্যালো,"}</p>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#5A4A32;">${c.intro}</p>
      <p style="margin:2px 0 0;font-size:14px;line-height:1.75;color:#7A6A50;">${c.introBn}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;"><tr>
        <td align="center" bgcolor="#F6EFDC" style="padding:18px;background:#F6EFDC;background:linear-gradient(135deg,#F6EFDC 0%,#FDECEC 100%);border:1px solid #FBD5D5;border-radius:16px;">
          <div style="margin-bottom:10px;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#9A8A6E;font-family:Arial,Helvetica,sans-serif;">YOUR 6-DIGIT CODE &middot; আপনার ৬ সংখ্যার কোড</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td align="center" bgcolor="#FFFFFF" style="padding:16px 8px;background:#FFFFFF;border:1px solid #F5B5B5;border-radius:12px;">
              <div style="font-size:36px;line-height:1.15;font-weight:800;letter-spacing:10px;color:#B91C1C;font-family:'Courier New',Consolas,monospace;padding-left:10px;">${digits}</div>
            </td>
          </tr></table>
          <div style="margin-top:12px;font-size:12px;color:#7A6A50;">Valid for <strong style="color:#3B2F1E;">${minutes} minutes</strong> &middot; ${minutes} মিনিট পর্যন্ত বৈধ</div>
        </td>
      </tr></table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:12px 14px;background:#FFF6E0;border:1px solid #F0DDA8;border-radius:12px;font-size:12px;line-height:1.7;color:#7A5A12;">
          <strong>Never share this code</strong> with anyone &mdash; Seba Lagbe staff will never ask for it.<br>
          এই কোড কাউকে দেবেন না। সেবা লাগবে থেকে কেউ এটি চাইবে না।
        </td>
      </tr></table>

      <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#9A8A6E;">${c.ignore}<br>${c.ignoreBn}</p>
    </td></tr>`;

  return shell(c.preheader, inner);
}

export function renderTestEmail() {
  const inner = `<tr><td style="padding:30px 30px 28px;">
      <div style="display:inline-block;margin-bottom:16px;padding:6px 12px;border:1px solid #BFE3CB;border-radius:999px;background:#E9F7EE;color:#166534;font-size:11px;font-weight:700;letter-spacing:1.2px;font-family:Arial,Helvetica,sans-serif;">SMTP TEST</div>
      <h1 style="margin:0 0 10px;font-size:24px;line-height:1.25;color:#3B2F1E;font-weight:800;">SMTP is working</h1>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#5A4A32;">This is a test email from your SebaLagbe.com admin panel. Your mail settings are configured correctly.</p>
    </td></tr>`;
  return shell("SMTP test from SebaLagbe.com admin panel.", inner);
}
