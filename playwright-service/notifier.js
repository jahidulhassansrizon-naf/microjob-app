// notifier.js
//
// Sends status alerts to the owner by EMAIL. The bot calls a small route of the website
// (app/api/bot-alert) and the website sends the email.
//
// Environment:
//   ALERT_WEBHOOK_URL   full URL of the website route, e.g. https://YOUR-SITE/api/bot-alert
//   BOT_ALERT_KEY       the same secret as on the website (Vercel)
//
// Everything here is best effort: if sending fails, the bot keeps working and the
// problem is only logged and shown on /health under "notifier".

const WEBHOOK_URL = (process.env.ALERT_WEBHOOK_URL || "").trim();
const WEBHOOK_KEY = (process.env.BOT_ALERT_KEY || "").trim();

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
// Monitor logic (pure: easy to test without a network)
// --------------------------------------------------

const SESSION_WARN_AT = Math.max(0, Number(process.env.SESSION_WARN_AT) || 0);
const DAILY_REPORT_HOUR_DHAKA = 21;
// REPORT_EVERY_MINUTES: send the status report every N minutes (0 = off, only the 21:00 daily report).
const REPORT_EVERY_MS = Math.max(0, Number(process.env.REPORT_EVERY_MINUTES) || 0) * 60_000;
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
  let lastPeriodicAt = startedAt;
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
    if (s.reason === "failing") {
      const err = s.lastError ? ` (${String(s.lastError).slice(0, 110)})` : "";
      return s.until
        ? `বারবার ফেল করছে${err}, ${dhakaTime(s.until)} নাগাদ আবার চেষ্টা হবে`
        : `বারবার ফেল করছে${err}`;
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
    const periodicDue = REPORT_EVERY_MS > 0 && t - lastPeriodicAt >= REPORT_EVERY_MS;
    // With a regular report switched on, the separate 21:00 report is not needed.
    const dailyDue =
      REPORT_EVERY_MS === 0 && dh.hour >= DAILY_REPORT_HOUR_DHAKA && lastDailyDate !== dh.date;
    const endDue = !runEndSent && t - startedAt >= RUN_END_REPORT_AFTER_MS;

    if (dailyDue) lastDailyDate = dh.date;
    if (endDue) runEndSent = true;
    if (periodicDue) lastPeriodicAt = t;

    // A run that has just started after 21:00 has nothing to report yet, so it skips today's report.
    const firstCheck = prev === null;

    if (dailyDue && firstCheck && !endDue) {
      // nothing to say
    } else if (dailyDue && endDue) {
      say(summaryText("দৈনিক আপডেট, এই রান শেষ হচ্ছে"));
    } else if (dailyDue) {
      say(summaryText("দৈনিক আপডেট"));
    } else if (endDue) {
      say(summaryText("এই রান শেষ হচ্ছে"));
    } else if (periodicDue) {
      say(summaryText("নিয়মিত আপডেট"));
    }

    prev = snap;
  }

  return { check, startupText, summaryText, say };
}

// --------------------------------------------------
// Email sender
// --------------------------------------------------

const emailStats = { enabled: false, sent: 0, failed: 0, lastError: "", lastSentAt: "" };

async function sendViaWebhook(text) {
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-bot-alert-key": WEBHOOK_KEY },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`website answered HTTP ${response.status}`);
  }
}

let emailQueue = Promise.resolve();

function enqueueEmail(text) {
  emailQueue = emailQueue
    .then(async () => {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await sendViaWebhook(text);
          emailStats.sent += 1;
          emailStats.lastSentAt = new Date().toISOString();
          emailStats.lastError = "";
          console.log("[notifier] alert sent by email.");
          return;
        } catch (error) {
          const msg = (error instanceof Error ? error.message : String(error)).slice(0, 200);
          emailStats.lastError = msg;
          console.log(`[notifier] email alert failed (attempt ${attempt}/3): ${msg}`);
          if (attempt < 3) await new Promise((r) => setTimeout(r, 15_000));
        }
      }
      emailStats.failed += 1;
    })
    .catch(() => {});
  return emailQueue;
}

function isEmailEnabled() {
  return Boolean(WEBHOOK_URL && WEBHOOK_KEY);
}

function start({ getSnapshot, runStartMs }) {
  const emailOn = isEmailEnabled();

  if (!emailOn) {
    console.log("[notifier] disabled (set ALERT_WEBHOOK_URL + BOT_ALERT_KEY to get email alerts).");
    return;
  }

  emailStats.enabled = true;
  console.log("[notifier] enabled: email alerts.");

  const monitor = createMonitor({
    getSnapshot,
    send: (text) => {
      enqueueEmail(text);
    },
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

async function sendEmailTest(text) {
  if (!isEmailEnabled()) throw new Error("Set ALERT_WEBHOOK_URL and BOT_ALERT_KEY first.");
  await sendViaWebhook(text);
}

module.exports = {
  sendEmailTest,
  start,
  notify: () => {},
  status: () => ({
    email: { ...emailStats },
  }),
  createMonitor,
};
