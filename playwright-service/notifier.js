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

// snapshot = { sessions: [{ slot, usable, until, reason }], jobs, failed, retries }
function createMonitor({ getSnapshot, send, now = () => Date.now() }) {
  let prev = null;
  let history = [];
  let lastFailAlertAt = 0;
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
      return s.until ? `দৈনিক লিমিট শেষ, ${dhakaTime(s.until)} নাগাদ আবার চালু হবে` : "দৈনিক লিমিট শেষ";
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

    // 2) Failure rate over the last 10 minutes
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

    prev = snap;
  }

  return { check, startupText, say };
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

    const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
    if (/enter your pin|restore (your )?chats|restore messages/i.test(bodyText)) {
      throw new Error("messenger-pin-required: Messenger asks for the chat PIN on this device");
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

    await box.waitFor({ state: "visible", timeout: 30_000 });
    await box.click();

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
      throw new Error("message-not-confirmed: could not see the sent message in the chat");
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
          const msg = (error instanceof Error ? error.message : String(error)).slice(0, 200);
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

function start({ getBrowser, getSnapshot }) {
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
