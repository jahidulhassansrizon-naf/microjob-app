// Shared, email-client-safe HTML templates for SebaLagbe.com transactional mail.
// Table layout + inline styles only (Gmail/Outlook/Apple Mail safe). Theme matches the
// site: cream background, red accent, deep brown text.

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
  { badge: string; title: string; titleBn: string; intro: string; ignore: string; preheader: string }
> = {
  register: {
    badge: "EMAIL VERIFICATION",
    title: "Verify your email",
    titleBn: "আপনার ইমেইল যাচাই করুন",
    intro: "Use this one-time code to finish creating your Seba Lagbe account.",
    ignore: "If you did not try to create a Seba Lagbe account, you can safely ignore this email.",
    preheader: "Your Seba Lagbe verification code. It expires in 5 minutes.",
  },
  "password-reset": {
    badge: "ACCOUNT SECURITY",
    title: "Reset your password",
    titleBn: "পাসওয়ার্ড রিসেট করুন",
    intro: "Use this one-time code to securely reset your Seba Lagbe password.",
    ignore:
      "If you did not request a password reset, no action is needed and your password will remain unchanged.",
    preheader: "Your Seba Lagbe password reset code. It expires in 5 minutes.",
  },
};

function shell(preheader: string, inner: string) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>Seba Lagbe</title></head>
<body style="margin:0;padding:0;background:#F2E8D2;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F2E8D2;font-size:1px;line-height:1px;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F2E8D2" style="background:#F2E8D2;">
<tr><td align="center" style="padding:36px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-collapse:separate;border-spacing:0;background:#FBF6E8;border:1px solid #E3D6B8;border-radius:20px;overflow:hidden;font-family:${FONT};color:#3B2F1E;">
    <tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:#DC2626;background:linear-gradient(90deg,#E5393B 0%,#DC2626 55%,#F0B27A 100%);">&nbsp;</td></tr>
    <tr><td style="padding:26px 30px 20px;border-bottom:1px solid #E9DDBF;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle" width="44" height="44" align="center" bgcolor="#DC2626" style="width:44px;height:44px;border-radius:12px;background:#DC2626;background:linear-gradient(135deg,#E5393B 0%,#B91C1C 100%);color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif;">SL</td>
        <td valign="middle" style="padding-left:12px;">
          <div style="font-size:21px;line-height:1.15;font-weight:800;color:#3B2F1E;">সেবা <span style="color:#DC2626;">লাগবে</span></div>
          <div style="margin-top:4px;font-size:10px;font-weight:700;letter-spacing:2px;color:#9A8A6E;font-family:Arial,Helvetica,sans-serif;">SEBALAGBE.COM</div>
        </td>
      </tr></table>
    </td></tr>
    ${inner}
    <tr><td style="padding:18px 30px;background:#3B2F1E;font-size:11px;line-height:1.7;color:#D9C9A6;">
      <div style="font-weight:700;color:#F5E9C8;">Seba Lagbe &middot; সেবা লাগবে</div>
      <div style="color:#BFAE8B;">&copy; ${year} SebaLagbe.com. All rights reserved. &middot; সর্বস্বত্ব সংরক্ষিত।</div>
    </td></tr>
  </table>
  <div style="max-width:560px;margin:14px auto 0;font-family:${FONT};font-size:11px;line-height:1.6;color:#9A8A6E;text-align:center;">This is an automated security message. Please do not reply to this email.</div>
</td></tr>
</table>
</body></html>`;
}

export function renderOtpEmail(input: { kind: OtpKind; name?: string; code: string; expiresMinutes?: number }) {
  const c = COPY[input.kind];
  const name = escapeHtml((input.name || "").trim().slice(0, 100)) || "there";
  const minutes = input.expiresMinutes ?? 5;
  const digits = escapeHtml(input.code);

  const inner = `<tr><td style="padding:30px 30px 28px;">
      <div style="display:inline-block;margin-bottom:16px;padding:6px 12px;border:1px solid #F3C6C6;border-radius:999px;background:#FDECEC;color:#B91C1C;font-size:11px;font-weight:700;letter-spacing:1.2px;font-family:Arial,Helvetica,sans-serif;">${c.badge}</div>
      <h1 style="margin:0;font-size:26px;line-height:1.25;color:#3B2F1E;font-weight:800;">${c.title}</h1>
      <div style="margin:4px 0 18px;font-size:14px;line-height:1.6;color:#7A6A50;">${c.titleBn}</div>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.75;color:#4A3C27;">Hello ${name},</p>
      <p style="margin:0;font-size:14px;line-height:1.75;color:#5A4A32;">${c.intro}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
        <td align="center" bgcolor="#FFFFFF" style="padding:22px 12px 20px;background:#FFFFFF;border:1px solid #E3D6B8;border-radius:16px;">
          <div style="margin-bottom:10px;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#9A8A6E;font-family:Arial,Helvetica,sans-serif;">YOUR 6-DIGIT CODE</div>
          <div style="font-size:36px;line-height:1.15;font-weight:800;letter-spacing:10px;color:#B91C1C;font-family:'Courier New',Consolas,monospace;padding-left:10px;">${digits}</div>
          <div style="margin-top:12px;font-size:12px;color:#7A6A50;">Valid for <strong style="color:#3B2F1E;">${minutes} minutes</strong> &middot; ${minutes} মিনিট পর্যন্ত বৈধ</div>
        </td>
      </tr></table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding:12px 14px;background:#FFF6E0;border:1px solid #F0DDA8;border-radius:12px;font-size:12px;line-height:1.7;color:#7A5A12;">
          <strong>Never share this code</strong> with anyone &mdash; Seba Lagbe staff will never ask for it.<br>
          এই কোড কাউকে দেবেন না। সেবা লাগবে থেকে কেউ এটি চাইবে না।
        </td>
      </tr></table>

      <p style="margin:22px 0 0;font-size:12px;line-height:1.7;color:#9A8A6E;">${c.ignore}</p>
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
