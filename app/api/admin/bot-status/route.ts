import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/admin/_lib/adminAuth";
import { getBotUrl } from "@/app/api/_lib/botUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

// The bot is run by GitHub Actions in this (public) repository. Change with BOT_GITHUB_REPO if needed.
const GITHUB_REPO = process.env.BOT_GITHUB_REPO?.trim() || "jahidulhassansrizon-naf/microjob-app";

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function text(value: unknown, max = 400): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

type Channel = { enabled: boolean; sent: number; failed: number; lastError: string; lastSentAt: string };

function channel(value: any): Channel {
  return {
    enabled: value?.enabled === true,
    sent: num(value?.sent),
    failed: num(value?.failed),
    lastError: text(value?.lastError),
    lastSentAt: text(value?.lastSentAt, 40),
  };
}

type Run = { number: number; status: string; conclusion: string; event: string; startedAt: string; updatedAt: string };

let runsCache: { at: number; runs: Run[] | null } | null = null;

// Last GitHub Actions runs of the bot (public repo, no token). Cached for one minute.
async function loadRuns(): Promise<Run[] | null> {
  if (runsCache && Date.now() - runsCache.at < 60_000) return runsCache.runs;

  let runs: Run[] | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=6`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json", "User-Agent": "sebalagbe-admin-bot-status" },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const body: any = await res.json().catch(() => null);
      runs = (Array.isArray(body?.workflow_runs) ? body.workflow_runs : []).slice(0, 6).map((r: any) => ({
        number: num(r?.run_number),
        status: text(r?.status, 30),
        conclusion: text(r?.conclusion, 30),
        event: text(r?.event, 30),
        startedAt: text(r?.run_started_at || r?.created_at, 40),
        updatedAt: text(r?.updated_at, 40),
      }));
    }
  } catch {
    runs = null;
  }

  runsCache = { at: Date.now(), runs };
  return runs;
}

type Problem = { level: "error" | "warn" | "info"; title: string; cause?: string; advice?: string };

// The bot writes "slot=N" / "_N": put the real session number in.
function withSlot(value: string, slot: number): string {
  return slot > 0 ? value.replace(/slot=N/g, `slot=${slot}`).replace(/JSON_N/g, `JSON_${slot}`) : value;
}

function dhakaTime(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit" });
}

// Turns the raw numbers into a short list: what is wrong, why, and what to do.
function buildProblems(report: any, runs: Run[] | null, detailed: boolean): Problem[] {
  const out: Problem[] = [];

  for (const s of report.sessions as any[]) {
    if (s.usable && s.healthy) continue;
    if (s.downReason === "logged-out") {
      out.push({
        level: "error",
        title: `Session ${s.slot}: the Google login expired`,
        cause: "Google signed this account out, so it cannot make images.",
        advice: `Log in again, run save-session.js for slot ${s.slot}, update the GEMINI_SESSION_JSON_${s.slot} secret, then restart the bot.`,
      });
    } else if (s.downReason === "limit" || !s.usable) {
      out.push({
        level: "warn",
        title: `Session ${s.slot}: daily limit reached`,
        cause: "This account made as many images as Google allows for now.",
        advice: s.usableAgainAt ? `Nothing to do. It returns around ${dhakaTime(s.usableAgainAt)} (Dhaka time).` : "Nothing to do. It returns by itself.",
      });
    } else {
      out.push({
        level: "warn",
        title: `Session ${s.slot}: failing, resting for a while`,
        cause: s.lastCause || s.lastError || "It failed several times in a row.",
        advice: `${s.lastAdvice || "Check it with /session-test on the bot."}${s.restingUntil ? ` The bot tries it again around ${dhakaTime(s.restingUntil)}.` : ""}`,
      });
    }
  }

  const ready = (report.sessions as any[]).filter((s) => s.usable && s.healthy).length;
  if ((report.sessions as any[]).length > 0 && ready === 0) {
    out.unshift({
      level: "error",
      title: "No session is ready, images cannot be made",
      cause: "Every Google session is stopped or resting.",
      advice: "See the session problems below. Fix at least one session.",
    });
  }

  const st = report.stats;
  const done = st.jobsOk + st.jobsFailed;
  if (done >= 5 && st.jobsFailed / done >= 0.1) {
    out.push({
      level: "warn",
      title: `${st.jobsFailed} of ${done} images failed in this run`,
      cause: "The bot could not make these images even after trying other sessions.",
      advice: "See the failed jobs and the event list below for the reasons.",
    });
  }
  if (st.jobs >= 3 && st.retries / st.jobs >= 0.5) {
    out.push({
      level: "warn",
      title: "Many images needed a second try (slow images)",
      cause: `${st.retries} retries for ${st.jobs} images. Usually one or two sessions keep timing out.`,
      advice: "Look at the Google sessions table: the session with the most problems is the slow one.",
    });
  }

  const n = report.notifier;
  if (!n.email.enabled && !n.messenger.enabled) {
    out.push({
      level: "info",
      title: "No alerts are set up",
      cause: "Neither email nor Messenger alerts are active on the bot.",
      advice: "Set ALERT_WEBHOOK_URL and BOT_ALERT_KEY (GitHub secrets) to get email alerts.",
    });
  }
  if (n.email.enabled && n.email.lastError) {
    out.push({ level: "warn", title: "Email alerts are failing", cause: n.email.lastError, advice: "Check BOT_ALERT_KEY / BOT_ALERT_EMAIL on Vercel and the SMTP settings." });
  }
  if (n.messenger.enabled && n.messenger.lastError) {
    out.push({
      level: "info",
      title: "Messenger alerts are not working",
      cause: n.messenger.lastError,
      advice: "Facebook usually logs the bot account out. Email alerts do not depend on this.",
    });
  }

  if (runs && runs.length > 0) {
    const running = runs.find((r) => r.status === "in_progress" || r.status === "queued");
    if (!running) {
      out.push({
        level: "error",
        title: "No bot run is in progress on GitHub",
        cause: "The last run ended and no new run started yet.",
        advice: "The 30-minute schedule should start one. If not, open GitHub Actions and press Run workflow.",
      });
    }
    const lastDone = runs.find((r) => r.status === "completed");
    if (lastDone && lastDone.conclusion && lastDone.conclusion !== "success" && lastDone.conclusion !== "cancelled") {
      out.push({
        level: "warn",
        title: `The last finished run (#${lastDone.number}) ended with: ${lastDone.conclusion}`,
        cause: "That run stopped early.",
        advice: "Open GitHub Actions and read the log of that run.",
      });
    }
  }

  if (!detailed) {
    out.push({
      level: "info",
      title: "Detailed information is switched off",
      cause: "The bot has no BOT_ALERT_KEY (or the website does not), so jobs, events and the bot log are hidden.",
      advice: "Set the same BOT_ALERT_KEY on Vercel and as a GitHub secret, update the bot, restart it.",
    });
  }

  return out;
}

// Admin only. Reads the bot and GitHub and returns a cleaned copy.
// The secret bot address is never sent to the browser.
export async function GET(request: Request) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  const checkedAt = new Date().toISOString();
  const botUrl = await getBotUrl();
  const runsPromise = loadRuns();

  const offline = async (reason: string) => {
    const runs = await runsPromise;
    const problems: Problem[] = [
      {
        level: "error",
        title: "The bot is not answering",
        cause: reason,
        advice: "It may be restarting (wait a minute) or the tunnel address changed. Check the GitHub runs below.",
      },
    ];
    if (runs && runs.length > 0 && !runs.some((r) => r.status === "in_progress" || r.status === "queued")) {
      problems.push({
        level: "error",
        title: "No bot run is in progress on GitHub",
        cause: "The last run ended and no new run started yet.",
        advice: "Open GitHub Actions and press Run workflow if the schedule does not start one.",
      });
    }
    return NextResponse.json({ success: true, online: false, reason, checkedAt, runs, problems }, { headers: NO_STORE });
  };

  if (!botUrl) return offline("The bot address (botUrl) is not set.");

  const key = process.env.BOT_ALERT_KEY?.trim() || "";
  let data: any = null;
  let detailed = false;

  try {
    if (key) {
      const res = await fetch(`${botUrl}/admin-report`, {
        cache: "no-store",
        headers: { "x-bot-alert-key": key },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.success) {
          data = body;
          detailed = body.detailed === true;
        }
      }
    }

    if (!data) {
      const res = await fetch(`${botUrl}/health`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) return offline(`The bot answered with HTTP ${res.status}.`);
      data = body;
    }
  } catch {
    return offline("The bot did not answer (it may be restarting, or the tunnel changed).");
  }

  const stats = data.stats || {};
  const jobsOk = num(stats.jobsOk);

  const report = {
    sessions: (Array.isArray(data.sessions) ? data.sessions : []).slice(0, 30).map((s: any) => ({
      slot: num(s?.slot),
      active: num(s?.active),
      usable: s?.usable === true,
      healthy: s?.healthy !== false,
      downReason: text(s?.downReason, 20),
      failStreak: num(s?.failStreak),
      lastError: text(s?.lastError, 240),
      lastCause: text(s?.lastCause, 200),
      lastAdvice: withSlot(text(s?.lastAdvice, 260), num(s?.slot)),
      restingUntil: text(s?.restingUntil, 40),
      usableAgainAt: text(s?.usableAgainAt, 40),
      images: num(data.imagesPerSession?.[String(s?.slot)]),
    })),
    stats: {
      jobs: num(stats.jobs),
      jobsOk,
      jobsFailed: num(stats.jobsFailed),
      retries: num(stats.retries),
      attemptsRefused: num(stats.attemptsRefused),
      attemptsTimedOut: num(stats.attemptsTimedOut),
      limitHits: num(stats.limitHits),
      loggedOutSessions: num(stats.loggedOutSessions),
      otherErrors: num(stats.otherErrors),
      peakActive: num(stats.peakActive),
      peakWaiting: num(stats.peakWaiting),
      avgSeconds: jobsOk ? Math.round(num(stats.totalOkMs) / jobsOk / 1000) : 0,
    },
    notifier: {
      messenger: { ...channel(data.notifier), resting: data.notifier?.messengerResting === true },
      email: channel(data.notifier?.email),
    },
  };

  const runs = await runsPromise;

  return NextResponse.json(
    {
      success: true,
      online: true,
      detailed,
      checkedAt,
      startedAt: text(data.startedAt, 40),
      uptimeSeconds: num(data.uptimeSeconds),
      generation: {
        active: num(data.generation?.active),
        waiting: num(data.generation?.waiting),
        maxConcurrent: num(data.generation?.maxConcurrent),
        currentCapacity: num(data.generation?.currentCapacity),
        maxQueue: num(data.generation?.maxQueue),
      },
      perSessionConcurrency: num(data.perSessionConcurrency),
      maxJobRetries: num(data.maxJobRetries),
      ...report,
      recentErrors: (Array.isArray(data.recentErrors) ? data.recentErrors : []).slice(-8).map((e: any) => ({
        at: text(e?.at, 40),
        label: text(e?.label, 60),
        message: text(e?.message, 300),
      })),
      events: (Array.isArray(data.events) ? data.events : []).slice(-60).map((e: any) => ({
        at: text(e?.at, 40),
        type: text(e?.type, 30),
        slot: num(e?.slot),
        message: text(e?.message, 240),
        cause: text(e?.cause, 200),
        advice: withSlot(text(e?.advice, 260), num(e?.slot)),
      })),
      jobs: (Array.isArray(data.jobs) ? data.jobs : []).slice(-40).map((j: any) => ({
        at: text(j?.at, 40),
        ms: num(j?.ms),
        ok: j?.ok === true,
        error: text(j?.error, 200),
        attempts: (Array.isArray(j?.attempts) ? j.attempts : []).slice(0, 8).map((a: any) => ({
          slot: num(a?.slot),
          result: text(a?.result, 20),
          ms: num(a?.ms),
        })),
      })),
      logTail: (Array.isArray(data.logTail) ? data.logTail : []).slice(-120).map((l: any) => ({
        at: text(l?.at, 40),
        level: text(l?.level, 10),
        text: text(l?.text, 300),
      })),
      runs,
      problems: buildProblems(report, runs, detailed),
    },
    { headers: NO_STORE },
  );
}
