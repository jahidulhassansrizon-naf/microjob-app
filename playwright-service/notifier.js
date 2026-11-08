// notifier.js
//
// Sends status messages to the owner on Facebook Messenger, using a SEPARATE
// "bot" Facebook account whose logged-in session is stored in
// facebook-session.json (see save-facebook-session.js).
//
// Environment:
//   FB_SESSION_FILE   path of the saved Facebook session (default: facebook-session.json)
//   FB_RECIPIENT      the owner's Facebook profile id or username (the account that RECEIVES messages)
//
// Everything here is best effort: if sending fails, the bot keeps working and the
// problem is only logged and shown on /health under "notifier".

const fs = require("fs");
const path = require("path");

const SESSION_FILE = path.resolve(
  process.env.FB_SESSION_FILE || path.join(__dirname, "facebook-session.json"),
);
const RECIPIENT = (process.env.FB_RECIPIENT || "").trim();
// Chat PIN of the bot account (only digits are used). Needed because every GitHub run is a
// "new device" for Messenger. Keep it in the GitHub secret FB_MESSENGER_PIN, never in the code.
const MESSENGER_PIN = (process.env.FB_MESSENGER_PIN || "").replace(/\D/g, "");
const PIN_SCREEN_RE = /enter your pin|restore (your )?chats|restore messages|\bPIN\b/i;

const MAX_MESSAGES_PER_HOUR = 12;
const CHECK_EVERY_MS = 60_000;
const FAIL_WINDOW_MS = 10 * 60_000;
const FAIL_ALERT_COOLDOWN_MS = 30 * 60_000;
const MIN_JOBS_FOR_RATE = 5;
const FAIL_RATE_LIMIT = 0.3;

function dhakaTime(ms) {
  try {
    return new Date(ms).toLocaleTimeString("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return new Date(ms).toISOString().slice(11, 16) + " UTC";
  }
}

// --------------------------------------------------
// Monitor logic (pure: easy to test without Facebook)
// --------------------------------------------------

const SESSION_WARN_AT = Math.max(0, Number(process.env.SESSION_WARN_AT) || 0);
const DAILY_REPORT_HOUR_DHAKA = 21;
const RUN_END_REPORT_AFTER_MS = 345 * 60_000;

function dhakaParts(ms) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(new Date(ms));
    const get = (t) => parts.find((p) => p.type === t).value;
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24 };
  } catch {
    const d = new Date(ms + 6 * 3600_000);
    return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
  }
}

function durationText(ms) {
  const m = Math.max(0, Math.round(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)} ঘণ্টা ${m % 60} মিনিট` : `${m} মিনিট`;
}

// snapshot = { sessions: [{ slot, usable, until, reason, ok, since, limitAfter }],
//              jobs, ok, failed, retries, refused, timedOut, peakActive, peakWaiting, avgSeconds }
function createMonitor({ getSnapshot, send, now = () => Date.now(), runStartMs = 0 }) {
  const startedAt = runStartMs || now();
  let prev = null;
  let history = [];
  let lastFailAlertAt = 0;
  let lastDailyDate = "";
  let runEndSent = false;
  const warned = {};
  const sentTimes = [];

  function allowed() {
    const cutoff = now() - 60 * 60_000;
    while (sentTimes.length && sentTimes[0] < cutoff) sentTimes.shift();
    if (sentTimes.length >= MAX_MESSAGES_PER_HOUR) return false;
    sentTimes.push(now());
    return true;
  }

  function say(text) {
    if (!allowed()) {
      console.log("[notifier] hourly message limit reached, dropped:", text.split("\n")[0]);
      return;
    }
    send(text);
  }

  function reasonText(s) {
    if (s.reason === "logged-out") {
      return "লগ-আউট হয়ে গেছে (নতুন সেশন সেভ করতে হবে)";
    }
    if (s.reason === "limit") {
      const after = s.limitAfter > 0 ? ` (${s.limitAfter}টা ছবির পর)` : "";
      return s.until
        ? `দৈনিক লিমিট শেষ${after}, ${dhakaTime(s.until)} নাগাদ আবার চালু হবে`
        : `দৈনিক লিমিট শেষ${after}`;
    }
    return s.until ? `সাময়িক বন্ধ, ${dhakaTime(s.until)} নাগাদ আবার চালু হবে` : "বন্ধ";
  }

  function startupText() {
    const snap = getSnapshot();
    const up = snap.sessions.filter((s) => s.usable).length;
    const lines = [`✅ বট চালু হয়েছে। সেশন চালু: ${up}/${snap.sessions.length}`];
    for (const s of snap.sessions.filter((x) => !x.usable)) {
      lines.push(`⚠️ সেশন ${s.slot}: ${reasonText(s)}`);
    }
    return lines.join("\n");
  }

  function summaryText(title) {
    const snap = getSnapshot();
    const done = snap.ok || 0;
    const total = done + (snap.failed || 0);
    const rate = total ? Math.round((done / total) * 100) : 100;
    const lines = [
      `📊 ${title} (এই রান ${durationText(now() - startedAt)} ধরে চলছে)`,
      `ছবি: ${done} সফল, ${snap.failed || 0} ফেল (সাফল্য ${rate}%)`,
    ];
    if (snap.retries) {
      lines.push(`রিট্রাই: ${snap.retries} বার (রিফিউজ ${snap.refused || 0}, টাইমআউট ${snap.timedOut || 0})`);
    }
    if (done) {
      lines.push(`গড় সময়: ${snap.avgSeconds || 0} সেকেন্ড`);
      lines.push(`সর্বোচ্চ একসাথে: ${snap.peakActive || 0}, লাইনে সর্বোচ্চ: ${snap.peakWaiting || 0}`);
    }
    lines.push(
      "সেশন: " +
        snap.sessions
          .map((s) => `${s.slot}: ${s.ok || 0}টা ${s.usable ? "🟢" : "🔴"}`)
          .join(" | "),
    );
    const down = snap.sessions.filter((s) => !s.usable);
    for (const s of down) lines.push(`⚠️ সেশন ${s.slot}: ${reasonText(s)}`);
    if (!down.length) lines.push("সব সেশন ঠিক আছে।");
    return lines.join("\n");
  }

  function check() {
    const snap = getSnapshot();
    const t = now();

    // 1) Session changes
    if (prev) {
      const prevUp = new Map(prev.sessions.map((s) => [s.slot, s.usable]));
      const lines = [];

      for (const s of snap.sessions) {
        const before = prevUp.get(s.slot);
        if (before === undefined) {
          lines.push(`ℹ️ নতুন সেশন ${s.slot} যোগ হয়েছে`);
        } else if (before && !s.usable) {
          lines.push(`🔴 সেশন ${s.slot} বন্ধ: ${reasonText(s)}`);
        } else if (!before && s.usable) {
          lines.push(`🟢 সেশন ${s.slot} আবার চালু হয়েছে`);
        }
      }

      if (lines.length) {
        const up = snap.sessions.filter((s) => s.usable).length;
        lines.push(`চালু আছে: ${up}/${snap.sessions.length}`);
        if (up === 0) lines.push("🚨 সব সেশন বন্ধ! ছবি বানানো এখন সম্ভব না।");
        say(lines.join("\n"));
      }
    }

    // 2) Early warning: a session is close to its daily limit.
    //    The limit is learned from this run's limit message (80% of it), or set with SESSION_WARN_AT.
    const warnLines = [];
    for (const s of snap.sessions) {
      const threshold = s.limitAfter > 0 ? Math.floor(s.limitAfter * 0.8) : SESSION_WARN_AT;
      if (!s.usable || !(s.since > 0) || !(threshold > 0)) {
        if (!s.usable || !(s.since > 0)) warned[s.slot] = false;
        continue;
      }
      if (s.since >= threshold && !warned[s.slot]) {
        warned[s.slot] = true;
        const limitPart = s.limitAfter > 0 ? ` (আগের লিমিট ${s.limitAfter}টায়)` : "";
        warnLines.push(`⏳ সেশন ${s.slot}: ${s.since}টা ছবি হয়ে গেছে${limitPart}, লিমিটের কাছাকাছি`);
      }
    }
    if (warnLines.length) say(warnLines.join("\n"));

    // 3) Failure rate over the last 10 minutes
    history.push({ t, jobs: snap.jobs, failed: snap.failed });
    history = history.filter((h) => t - h.t <= FAIL_WINDOW_MS + CHECK_EVERY_MS);
    const first = history[0];
    const dJobs = snap.jobs - first.jobs;
    const dFailed = snap.failed - first.failed;

    if (
      dJobs >= MIN_JOBS_FOR_RATE &&
      dFailed / dJobs >= FAIL_RATE_LIMIT &&
      t - lastFailAlertAt > FAIL_ALERT_COOLDOWN_MS
    ) {
      lastFailAlertAt = t;
      say(`⚠️ গত ১০ মিনিটে ${dJobs}টার মধ্যে ${dFailed}টা ছবি ফেল হয়েছে। লগ দেখুন।`);
    }

    // 4) Daily report (21:00 Dhaka time, once a day) and a report when this run is about to end.
    const dh = dhakaParts(t);
    const dailyDue = dh.hour >= DAILY_REPORT_HOUR_DHAKA && lastDailyDate !== dh.date;
    const endDue = !runEndSent && t - startedAt >= RUN_END_REPORT_AFTER_MS;

    if (dailyDue) lastDailyDate = dh.date;
    if (endDue) runEndSent = true;

    if (dailyDue && endDue) {
      say(summaryText("দৈনিক আপডেট, এই রান শেষ হচ্ছে"));
    } else if (dailyDue) {
      say(summaryText("দৈনিক আপডেট"));
    } else if (endDue) {
      say(summaryText("এই রান শেষ হচ্ছে"));
    }

    prev = snap;
  }

  return { check, startupText, summaryText, say };
}

// --------------------------------------------------
// Messenger sender
// --------------------------------------------------

const stats = { enabled: false, sent: 0, failed: 0, lastError: "", lastSentAt: "" };

let queue = Promise.resolve();

async function sendViaMessenger(getBrowser, text) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
  });

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    await page.goto(`https://www.facebook.com/messages/t/${encodeURIComponent(RECIPIENT)}`, {
      waitUntil: "domcontentloaded",
    });

    // Give the page a moment to decide where it goes (login, checkpoint, chat).
    await page.waitForTimeout(6000);

    const url = page.url();
    if (/\/login|\/checkpoint|\/two_step_verification/i.test(url)) {
      throw new Error(
        /checkpoint|two_step/i.test(url)
          ? "facebook-checkpoint: Facebook asks for a security check"
          : "facebook-logged-out: session expired, save a new one",
      );
    }
    if ((await page.locator('input[name="pass"]').count()) > 0) {
      throw new Error("facebook-logged-out: session expired, save a new one");
    }

    // On a new device (like the GitHub runner) Messenger may show a "restore chats /
    // enter your PIN" screen. Our chat with the owner is a normal chat, so we first
    // try to close that screen and only give up if the message box stays unusable.
    const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
    const pinScreen = PIN_SCREEN_RE.test(bodyText);
    let pinInfo = "";

    if (pinScreen) {
      // Generic dialog wording only (never the chat list), so it is safe to log.
      const dialogText = (
        (await page.locator('[role="dialog"]').first().innerText().catch(() => "")) || ""
      )
        .replace(/\s+/g, " ")
        .slice(0, 160);
      pinInfo = ` [dialog: ${dialogText || "none"}]`;
      console.log("[notifier] PIN-like screen seen." + pinInfo);

      // 1) If we know the PIN, type it in (once).
      if (MESSENGER_PIN) {
        console.log("[notifier] entering the Messenger PIN.");
        try {
          const field = page
            .locator(
              [
                '[role="dialog"] input',
                'input[type="password"]',
                'input[inputmode="numeric"]',
                'input[autocomplete="one-time-code"]',
              ].join(", "),
            )
            .first();
          await field.waitFor({ state: "visible", timeout: 10_000 });
          await field.click();
          await page.keyboard.type(MESSENGER_PIN, { delay: 150 });
          await page.waitForTimeout(600);

          const go = page
            .locator('[role="dialog"] [role="button"], [role="dialog"] button')
            .filter({ hasText: /^(continue|confirm|next|done|submit|restore|ok)$/i })
            .first();
          if ((await go.count().catch(() => 0)) > 0) {
            await go.click({ timeout: 4000 }).catch(() => {});
          } else {
            await page.keyboard.press("Enter");
          }
        } catch {
          console.log("[notifier] could not find a PIN field on that screen.");
        }

        // Wait (up to 30s) until the PIN screen has gone away.
        for (let i = 0; i < 30; i += 1) {
          await page.waitForTimeout(1000);
          const t = (await page.locator("body").innerText().catch(() => "")) || "";
          if (!PIN_SCREEN_RE.test(t)) break;
        }
        await page.waitForTimeout(3000);
      }

      // 2) Otherwise (or if it is still there) try to close the screen.
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(800);

      const closers = page
        .locator('[role="dialog"] [role="button"], [role="dialog"] button, [role="dialog"] [aria-label="Close"]')
        .filter({ hasText: /^(not now|close|skip|cancel|maybe later|dismiss|don.t restore|no thanks)$/i });

      if ((await closers.count().catch(() => 0)) > 0) {
        await closers.first().click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1200);
      }
    }

    // An old chat (made before end-to-end encryption) shows a blue "Continue" button
    // instead of the message box ("You can't reply..."). Press it so the box appears.
    for (let i = 0; i < 3; i += 1) {
      const cont = page
        .locator('[role="button"], button')
        .filter({ hasText: /^continue$/i })
        .first();

      if (!(await cont.isVisible().catch(() => false))) break;

      console.log("[notifier] pressing the Continue button (chat upgrade).");
      await cont.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(4000);
    }

    const box = page
      .locator(
        [
          'div[role="textbox"][contenteditable="true"][aria-label^="Message"]',
          'div[role="textbox"][contenteditable="true"]',
          'div[contenteditable="true"][aria-label]',
        ].join(", "),
      )
      .first();

    try {
      await box.waitFor({ state: "visible", timeout: 30_000 });
      await box.click({ timeout: 10_000 });
    } catch (error) {
      throw new Error(
        pinScreen
          ? `messenger-pin-required: Messenger asks for the chat PIN on this device${pinInfo}`
          : "message-box-not-found: could not open the message box",
      );
    }

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i]) await page.keyboard.insertText(lines[i]);
      if (i < lines.length - 1) await page.keyboard.press("Shift+Enter");
    }

    await page.keyboard.press("Enter");
    await page.waitForTimeout(4000);

    // Best check: the first words of our message must now be visible in the chat.
    const probe = lines[0].slice(0, 25);
    const visible = await page
      .getByText(probe, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);

    if (!visible) {
      throw new Error(
        pinScreen
          ? `messenger-pin-required: message not delivered, Messenger asks for the chat PIN${pinInfo}`
          : "message-not-confirmed: could not see the sent message in the chat",
      );
    }
  } finally {
    await context.close().catch(() => {});
  }
}

function enqueue(getBrowser, text) {
  queue = queue
    .then(async () => {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          await sendViaMessenger(getBrowser, text);
          stats.sent += 1;
          stats.lastSentAt = new Date().toISOString();
          stats.lastError = "";
          console.log("[notifier] message sent to Messenger.");
          return;
        } catch (error) {
          const msg = (error instanceof Error ? error.message : String(error)).slice(0, 400);
          stats.lastError = msg;
          console.log(`[notifier] send failed (attempt ${attempt}/2): ${msg}`);
          // A dead session or a security check will not fix itself within seconds.
          if (/logged-out|checkpoint|pin-required/.test(msg)) break;
          if (attempt < 2) await new Promise((r) => setTimeout(r, 20_000));
        }
      }
      stats.failed += 1;
    })
    .catch(() => {});
  return queue;
}

function isEnabled() {
  return Boolean(RECIPIENT) && fs.existsSync(SESSION_FILE);
}

function start({ getBrowser, getSnapshot, runStartMs }) {
  if (!isEnabled()) {
    console.log(
      "[notifier] disabled (set FB_RECIPIENT and provide facebook-session.json to turn it on).",
    );
    return;
  }

  stats.enabled = true;
  console.log("[notifier] enabled.");

  const monitor = createMonitor({
    getSnapshot,
    send: (text) => enqueue(getBrowser, text),
    runStartMs,
  });

  // Wait a little so sessions are loaded, then say hello.
  setTimeout(() => {
    try {
      monitor.say(monitor.startupText());
    } catch (error) {
      console.log("[notifier] startup message failed:", error && error.message);
    }
  }, 45_000).unref();

  setTimeout(() => {
    setInterval(() => {
      try {
        monitor.check();
      } catch (error) {
        console.log("[notifier] check failed:", error && error.message);
      }
    }, CHECK_EVERY_MS).unref();
  }, 50_000).unref();

  // Used by POST /notify (the GitHub watchdog calls it).
  module.exports.notify = (text) => monitor.say(String(text || "").slice(0, 500));
}

// Used by test-notify.js on your own computer to try one message before deploying.
async function sendTest(text, headed) {
  if (!RECIPIENT) throw new Error("Set FB_RECIPIENT first.");
  if (!fs.existsSync(SESSION_FILE)) throw new Error(`Session file not found: ${SESSION_FILE}`);
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ headless: !headed });
  try {
    await sendViaMessenger(async () => browser, text);
  } finally {
    await browser.close().catch(() => {});
  }
}

module.exports = {
  sendTest,
  start,
  notify: () => {},
  status: () => ({ ...stats }),
  createMonitor,
};
