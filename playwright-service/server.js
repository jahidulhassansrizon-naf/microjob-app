const express = require("express");
const { chromium } = require("playwright");
const multer = require("multer");
const { spawn } = require("node:child_process");
const { promises: fs, existsSync } = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");

const notifier = require("./notifier");

const app = express();

const PORT = Number(process.env.BOT_PORT) || 3000;
const DISPLAY = process.env.DISPLAY || ":99";

const VNC_PORT = 5900;
const WEBSOCKIFY_PORT = 6080;

const BROWSER_DATA_DIR = process.env.BROWSER_DATA_DIR || "/tmp/gemini-profile";

const VNC_PASSWORD_FILE = "/tmp/vnc-password";

process.env.DISPLAY = DISPLAY;

let browserContext = null;
let desktopStarted = false;
const desktopProcesses = [];

app.use(express.json({ limit: "10mb" }));

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);

  const child = spawn(command, args, {
    env: {
      ...process.env,
      DISPLAY,
      XAUTHORITY: "/tmp/gemini-xauth",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });

  child.on("error", (error) => {
    console.error(`${name} error:`, error);
  });

  child.on("exit", (code, signal) => {
    console.log(`${name} exited`, {
      code,
      signal,
    });
  });

  desktopProcesses.push(child);

  return child;
}

// --------------------------------------------------
// Desktop
// --------------------------------------------------

async function startDesktop() {
  if (desktopStarted) {
    return;
  }

  desktopStarted = true;

  console.log("Starting cloud desktop...");

  const xauthFile = "/tmp/gemini-xauth";
  const cookie = crypto.randomBytes(16).toString("hex");

  // Create X11 authentication cookie.
  await fs
    .rm(xauthFile, {
      force: true,
    })
    .catch(() => {});

  spawn("xauth", ["-f", xauthFile, "add", DISPLAY, ".", cookie], {
    stdio: "inherit",
  });

  await sleep(1000);

  process.env.XAUTHORITY = xauthFile;

  // ----------------------------------------------
  // Xvfb
  // ----------------------------------------------

  startProcess(
    "Xvfb",
    [
      DISPLAY,
      "-screen",
      "0",
      "1440x900x24",
      "-auth",
      xauthFile,
      "-nolisten",
      "tcp",
      "+extension",
      "RANDR",
    ],
    "Xvfb",
  );

  await sleep(1500);

  // ----------------------------------------------
  // Fluxbox
  // ----------------------------------------------

  startProcess("fluxbox", [], "fluxbox");

  await sleep(1500);

  // ----------------------------------------------
  // VNC password
  // ----------------------------------------------

  const vncPassword = process.env.NO_VNC_PASSWORD;

  if (!vncPassword) {
    throw new Error("NO_VNC_PASSWORD environment variable is required.");
  }

  if (vncPassword.length > 8) {
    throw new Error(
      "NO_VNC_PASSWORD must be 8 characters or fewer because of the VNC password protocol.",
    );
  }

  await fs.writeFile(VNC_PASSWORD_FILE, `${vncPassword}\n`, {
    mode: 0o600,
  });

  // ----------------------------------------------
  // x11vnc
  // ----------------------------------------------

  startProcess(
    "x11vnc",
    [
      "-display",
      DISPLAY,
      "-auth",
      xauthFile,
      "-rfbport",
      String(VNC_PORT),
      "-passwdfile",
      VNC_PASSWORD_FILE,
      "-forever",
      "-shared",
      "-listen",
      "127.0.0.1",
      "-noxdamage",
    ],
    "x11vnc",
  );

  await sleep(2500);

  // ----------------------------------------------
  // websockify
  // ----------------------------------------------

  startProcess(
    "websockify",
    [
      "--verbose",
      "--web",
      "/usr/share/novnc",
      String(WEBSOCKIFY_PORT),
      `127.0.0.1:${VNC_PORT}`,
    ],
    "websockify",
  );

  await sleep(2500);

  console.log("Cloud desktop is ready.");
}

// --------------------------------------------------
// Chromium
// --------------------------------------------------

async function getBrowserContext() {
  if (browserContext) {
    return browserContext;
  }

  await fs.mkdir(BROWSER_DATA_DIR, {
    recursive: true,
  });

  console.log("Launching cloud Chromium...");

  browserContext = await chromium.launchPersistentContext(BROWSER_DATA_DIR, {
    headless: false,

    viewport: {
      width: 1440,
      height: 900,
    },

    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--start-maximized",
    ],
  });

  console.log("Cloud Chromium launched.");

  return browserContext;
}

async function getGeminiPage() {
  const context = await getBrowserContext();

  const pages = context.pages();

  let page = pages.find((item) => item.url().includes("gemini.google.com"));

  if (!page) {
    page = pages[0] || (await context.newPage());

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }

  return page;
}

// --------------------------------------------------
// Gemini image editing helpers
// --------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

function parseUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next();
  });
}

function parseTemplateUpload(req, res, next) {
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "templateImage",
      maxCount: 1,
    },
    // Couple templates: the second person's photo (optional).
    //   image  = person 1, image2 = person 2
    {
      name: "image2",
      maxCount: 1,
    },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next();
  });
}

// Dual mode (AI Editor): two separate photos in one request.
//   image  = left person
//   image2 = right person
function parseDualUpload(req, res, next) {
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "image2",
      maxCount: 1,
    },
  ])(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    next();
  });
}

// Optional protection: if ASK_KEY is set in Render's Environment,
// every protected request must send the same value in the
// "x-api-key" header. If ASK_KEY is not set, the route is open.
function requireApiKey(req, res, next) {
  const requiredKey = process.env.ASK_KEY;

  if (!requiredKey) {
    return next();
  }

  if (req.get("x-api-key") !== requiredKey) {
    return res.status(401).json({
      success: false,
      error: "Invalid or missing API key.",
    });
  }

  next();
}

// --------------------------------------------------
// Multiple Gemini sessions (up to 3 Google accounts)
//
// Files: gemini-session-1.json, gemini-session-2.json, gemini-session-3.json
// (the old single gemini-session.json still works as slot 1).
// Jobs are spread over all sessions (least busy first, max
// the per-session limit each). When Gemini says "limit resets at ...",
// that session is parked until the reset time and the SAME job is
// retried on the next session. The parked state is saved to
// session-limits.json so a server restart does not forget it.
// --------------------------------------------------

// Up to 10 sessions. Only the slots that have a gemini-session-N.json file are used,
// so adding a 4th (or 5th...) session only needs its file, no code change.
const SESSION_SLOTS = Array.from({ length: 10 }, (_, i) => i + 1);
const LIMIT_STATE_FILE = path.join(__dirname, "session-limits.json");
const DEFAULT_LIMIT_PARK_MS = 60 * 60 * 1000; // used if reset time can't be read
const LIMIT_TEXT_REGEX =
  /limit resets|your limit resets|reached your (daily |usage )?limit|can create more images as soon as/i;

// Gemini sometimes gives up and writes this instead of making the image.
// The bot stops right away (no 3-minute wait) and the visitor is asked to retry.
// Known texts are caught instantly; unknown texts are caught by isReplyFinished() below.
const REFUSAL_TEXT_REGEX =
  /hard time fulfilling your request|encountered an error doing what you asked|couldn'?t (generate|create) (the |that |this )?image|unable to (generate|create) (the |that |this )?image|can'?t (generate|create|edit) (the |that |this )?(image|photo)/i;

// True when Gemini has finished writing its reply (the "Good response" feedback
// button is there and the "Stop response" button is gone). If no download button
// exists at that point, Gemini answered with text only and no image will come.
async function isReplyFinished(page) {
  const feedback = await page
    .getByRole("button", { name: /good response/i })
    .last()
    .isVisible()
    .catch(() => false);

  if (!feedback) return false;

  const stopVisible = await page
    .getByRole("button", { name: /stop (response|generating)/i })
    .first()
    .isVisible()
    .catch(() => false);

  return !stopVisible;
}

class GeminiLimitError extends Error {
  constructor(message, resetAt) {
    super(message);
    this.name = "GeminiLimitError";
    this.resetAt = resetAt || 0;
  }
}

// { "1": <epoch ms when usable again>, ... }
let limitState = {};

try {
  limitState = JSON.parse(require("node:fs").readFileSync(LIMIT_STATE_FILE, "utf8"));
} catch {
  limitState = {};
}

function saveLimitState() {
  fs.writeFile(LIMIT_STATE_FILE, JSON.stringify(limitState, null, 2)).catch(
    () => {},
  );
}

function sessionFileForSlot(slot) {
  const candidates = [
    `/etc/secrets/gemini-session-${slot}.json`,
    path.join(__dirname, `gemini-session-${slot}.json`),
  ];

  if (slot === 1) {
    candidates.push(
      "/etc/secrets/gemini-session.json",
      path.join(__dirname, "gemini-session.json"),
    );
  }

  return candidates.find((p) => existsSync(p));
}

// All sessions that have a file on disk, in order 1, 2, 3.
function listSessions() {
  return SESSION_SLOTS.map((slot) => ({
    slot,
    file: sessionFileForSlot(slot),
    usableAt: Number(limitState[slot]) || 0,
  })).filter((s) => s.file);
}

function isSessionUsable(session) {
  return Date.now() >= session.usableAt;
}

// "Current session" pointer: the session being used right now. It stays on
// one session until that one runs out of limit, then moves 1 -> 2 -> 3 -> ...
// and wraps around to 1 again. It is saved in session-limits.json too.
function getCurrentSlot(sessions) {
  const saved = Number(limitState.current) || 0;
  return sessions.some((s) => s.slot === saved) ? saved : sessions[0].slot;
}

function setCurrentSlot(slot) {
  if (limitState.current !== slot) {
    limitState.current = slot;
    saveLimitState();
    console.log(`Current Gemini session is now ${slot}.`);
  }
}

// Sessions in circular order, starting at startSlot.
function circularFrom(sessions, startSlot) {
  const index = Math.max(
    0,
    sessions.findIndex((s) => s.slot === startSlot),
  );

  return [...sessions.slice(index), ...sessions.slice(0, index)];
}

// Why a session is parked ("limit" or "logged-out"); only used for status messages.
const sessionDownReason = {};

function markSessionLimited(slot, resetAt) {
  sessionDownReason[slot] = "limit";
  const u = usageOf(slot);
  if (u.since > 0) u.limitAfter = u.since;
  u.since = 0;
  const until = resetAt && resetAt > Date.now() ? resetAt : Date.now() + DEFAULT_LIMIT_PARK_MS;
  limitState[slot] = until;
  saveLimitState();
  console.log(
    `Session ${slot}: limit reached, parked until ${new Date(until).toLocaleString()}.`,
  );
}

// Reads "Your limit resets at 11:05 PM" and returns epoch ms (0 if not found).
function parseResetTime(text) {
  const m = /resets?\s+(?:at|on)?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(
    String(text || ""),
  );

  if (!m) {
    return 0;
  }

  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ampm = (m[3] || "").toUpperCase();

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;

  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // Time already passed today means it is tomorrow.
  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }

  // Small safety margin so we don't retry a minute too early.
  return target.getTime() + 60 * 1000;
}

function getMimeType(extension) {
  const normalized = String(extension || "").toLowerCase();

  if (normalized === ".jpg" || normalized === ".jpeg") {
    return "image/jpeg";
  }

  if (normalized === ".webp") {
    return "image/webp";
  }

  if (normalized === ".gif") {
    return "image/gif";
  }

  return "image/png";
}

function getExtension(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();

  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return ".jpg";
  }

  if (normalized.includes("webp")) {
    return ".webp";
  }

  if (normalized.includes("gif")) {
    return ".gif";
  }

  return ".png";
}

// --------------------------------------------------
// Concurrency settings
//
// All of these can be changed from environment variables (for example
// in the GitHub Actions workflow) without touching the code.
//
//   MAX_CONCURRENT_GENERATIONS  how many Gemini jobs run at the same time
//   MAX_QUEUE_LENGTH            how many more may wait in line
//   QUEUE_WAIT_TIMEOUT_MS       longest a request may wait in line
//   GENERATION_TIMEOUT_MS       longest a single job may run
//   BROWSER_RECYCLE_AFTER_JOBS  restart the shared Chromium after N jobs
//                               (only while idle) to avoid slow memory growth
// --------------------------------------------------

function readIntEnv(name, fallback, min, max) {
  const parsed = Number.parseInt(process.env[name] || "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

// Jobs that start on the same session are spaced this far apart (ms), so one
// account never opens many Gemini pages in the very same moment.
const SESSION_START_STAGGER_MS = readIntEnv("SESSION_START_STAGGER_MS", 1000, 0, 10_000);

// Total number of Gemini jobs allowed at the same moment (the machine limit:
// about 20 headless Chromium pages fit on a 4 vCPU / 16 GB GitHub runner).
const MAX_CONCURRENT_GENERATIONS = readIntEnv("MAX_CONCURRENT_GENERATIONS", 20, 1, 200);

// Highest number of jobs one Google account may run at once. 5 per account was
// tested and works; 15 on one account made Google block it.
const PER_SESSION_HARD_MAX = readIntEnv("PER_SESSION_MAX", 5, 1, 20);

// PER_SESSION_CONCURRENCY is optional. If it is NOT set, the limit per account is
// worked out automatically from the number of session files:
//   4 sessions  -> 20 / 4  = 5 each
//   10 sessions -> 20 / 10 = 2 each
// so adding a session file spreads the same total load over more accounts.
const PER_SESSION_FIXED = readIntEnv("PER_SESSION_CONCURRENCY", 0, 0, 20);

function perSessionLimit() {
  if (PER_SESSION_FIXED > 0) {
    return PER_SESSION_FIXED;
  }

  const count = Math.max(1, listSessions().length);

  return Math.min(
    PER_SESSION_HARD_MAX,
    Math.max(1, Math.ceil(MAX_CONCURRENT_GENERATIONS / count)),
  );
}

// How many jobs may run right now: only sessions that are not parked / logged
// out count, and never more than MAX_CONCURRENT_GENERATIONS. This stops the bot
// from accepting 20 jobs when only 3 sessions work (and leaving 5 stuck).
function currentCapacity() {
  const usable = listSessions().filter(isSessionUsable).length;

  if (usable === 0) {
    return MAX_CONCURRENT_GENERATIONS;
  }

  return Math.max(
    1,
    Math.min(MAX_CONCURRENT_GENERATIONS, usable * perSessionLimit()),
  );
}

// How many times one job may be tried again on ANOTHER session after Gemini
// refuses it or it times out (each retry only if enough job time is left).
const MAX_JOB_RETRIES = readIntEnv("MAX_JOB_RETRIES", 2, 0, 5);
// How long ONE attempt waits for Gemini's image after the prompt is sent. A stuck
// attempt must give up early enough that the job still has time for a retry on
// another session (in the 20-at-once test, good images were done in under 90s,
// the stuck ones waited 150s and then had no time left to retry).
const IMAGE_WAIT_MS = readIntEnv("IMAGE_WAIT_MS", 100_000, 30_000, 300_000);
const RETRY_MIN_REMAINING_MS = readIntEnv("RETRY_MIN_REMAINING_MS", 80_000, 0, 600_000);

// Counters shown on /health so a load test shows WHY jobs failed.
const stats = {
  jobs: 0,
  jobsOk: 0,
  jobsFailed: 0,
  retries: 0,
  attemptsRefused: 0,
  attemptsTimedOut: 0,
  limitHits: 0,
  loggedOutSessions: 0,
  otherErrors: 0,
  peakActive: 0,
  peakWaiting: 0,
  totalOkMs: 0,
};

// Images made per session in this run, and since that session last hit its limit.
// limitAfter = how many images it made before the last limit message (shows the real daily limit).
const sessionUsage = {};

function usageOf(slot) {
  if (!sessionUsage[slot]) {
    sessionUsage[slot] = { ok: 0, since: 0, limitAfter: 0 };
  }
  return sessionUsage[slot];
}

function notePeaks() {
  if (activeJobs > stats.peakActive) stats.peakActive = activeJobs;
  if (waitingJobs.length > stats.peakWaiting) stats.peakWaiting = waitingJobs.length;
}

const MAX_QUEUE_LENGTH = readIntEnv("MAX_QUEUE_LENGTH", 100, 0, 1000);
const QUEUE_WAIT_TIMEOUT_MS = readIntEnv(
  "QUEUE_WAIT_TIMEOUT_MS",
  200_000,
  5_000,
  600_000,
);
const GENERATION_TIMEOUT_MS = readIntEnv(
  "GENERATION_TIMEOUT_MS",
  270_000,
  30_000,
  900_000,
);
const BROWSER_RECYCLE_AFTER_JOBS = readIntEnv(
  "BROWSER_RECYCLE_AFTER_JOBS",
  60,
  5,
  100_000,
);

// Temp folders created by this server (see withTempDir). Anything older than
// this is a leftover from a crash and is removed by the sweeper.
const TEMP_DIR_PREFIXES = [
  "gemini-edit-",
  "gemini-template-edit-",
  "gemini-dual-edit-",
];
const TEMP_DIR_MAX_AGE_MS = 30 * 60 * 1000;
const TEMP_SWEEP_INTERVAL_MS = 10 * 60 * 1000;

// --------------------------------------------------
// Errors
// --------------------------------------------------

class HttpError extends Error {
  constructor(message, statusCode = 500, extra = {}) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.retryAfter = extra.retryAfter || 0;
    this.code = extra.code || "";
  }
}

// Gemini refused / failed to make this image. Not a limit and not a broken session.
class GeminiRefusedError extends HttpError {
  constructor() {
    super("Gemini could not create this image this time. Please try again.", 422, {
      code: "GEMINI_REFUSED",
    });
    this.name = "GeminiRefusedError";
  }
}

function makeClientClosedError() {
  return new HttpError("Request was cancelled by the client.", 499);
}

function abortReason(signal) {
  return signal && signal.reason instanceof Error
    ? signal.reason
    : makeClientClosedError();
}

function throwIfAborted(signal) {
  if (signal && signal.aborted) {
    throw abortReason(signal);
  }
}

// --------------------------------------------------
// Job queue (counting semaphore with a bounded waiting line)
//
// Every generation takes one slot. When all slots are busy, new requests
// wait in line (up to MAX_QUEUE_LENGTH). If the line is full, or a request
// waits too long, it gets a clear 503 instead of hanging forever.
// A request whose client disconnects leaves the line immediately.
// --------------------------------------------------

let activeJobs = 0;
const waitingJobs = [];

function removeWaiter(waiter) {
  const index = waitingJobs.indexOf(waiter);

  if (index !== -1) {
    waitingJobs.splice(index, 1);
  }

  clearTimeout(waiter.timer);
  waiter.signal.removeEventListener("abort", waiter.onAbort);
}

function acquireSlot(signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(abortReason(signal));
    }

    if (activeJobs < currentCapacity()) {
      activeJobs += 1;
      notePeaks();
      return resolve();
    }

    if (waitingJobs.length >= MAX_QUEUE_LENGTH) {
      return reject(
        new HttpError(
          "The image server is busy right now. Please try again in a moment.",
          503,
          { retryAfter: 15 },
        ),
      );
    }

    const waiter = { signal, resolve, timer: null, onAbort: null };

    waiter.timer = setTimeout(() => {
      removeWaiter(waiter);
      reject(
        new HttpError(
          "Too many people are generating images right now. Please try again in a moment.",
          503,
          { retryAfter: 15 },
        ),
      );
    }, QUEUE_WAIT_TIMEOUT_MS);

    waiter.onAbort = () => {
      removeWaiter(waiter);
      reject(abortReason(signal));
    };

    signal.addEventListener("abort", waiter.onAbort, { once: true });

    waitingJobs.push(waiter);
    notePeaks();
  });
}

// Lets waiting requests in while there is free capacity. Capacity changes
// when a session gets parked or comes back, so this also runs on a timer.
function pumpWaiters() {
  while (waitingJobs.length > 0 && activeJobs < currentCapacity()) {
    const next = waitingJobs[0];

    removeWaiter(next);
    activeJobs += 1;
    notePeaks();
    next.resolve();
  }
}

function releaseSlot() {
  activeJobs = Math.max(0, activeJobs - 1);

  pumpWaiters();

  if (activeJobs === 0) {
    recycleBrowserIfIdle().catch(() => {});
  }
}

setInterval(pumpWaiters, 2000).unref();

// --------------------------------------------------
// Keep-alive (stops Cloudflare 524 on long jobs)
//
// A Cloudflare tunnel cuts any request that has not received an answer
// (HTTP headers) within about 100 seconds and returns error 524. A busy
// generation can take longer than that. So when the caller sends the header
//   x-keepalive: 1
// the bot answers "200" immediately and then writes one blank space every
// KEEPALIVE_INTERVAL_MS while it works. The real JSON arrives at the end.
// Blank spaces in front of JSON are ignored by JSON.parse.
//
// Because the HTTP status is already sent, the real status travels inside
// the JSON body ("status" and "retryAfter"). Callers that do not send the
// header get the old behaviour (real HTTP status, Retry-After header).
// --------------------------------------------------

const KEEPALIVE_INTERVAL_MS = readIntEnv("KEEPALIVE_INTERVAL_MS", 15_000, 1_000, 60_000);

function startKeepAlive(res) {
  if (res.headersSent || res.locals.keepAliveStarted) {
    return;
  }

  res.locals.keepAliveStarted = true;

  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  res.locals.keepAliveTimer = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(" ");
    }
  }, KEEPALIVE_INTERVAL_MS);
}

function stopKeepAlive(res) {
  if (res.locals.keepAliveTimer) {
    clearInterval(res.locals.keepAliveTimer);
    res.locals.keepAliveTimer = null;
  }
}

// Same as res.status(x).json(y), but also works after keep-alive started.
function sendJson(res, statusCode, payload) {
  if (res.locals.keepAliveStarted) {
    stopKeepAlive(res);

    if (res.writableEnded || res.destroyed) {
      return;
    }

    return res.end(JSON.stringify({ ...payload, status: statusCode }));
  }

  return res.status(statusCode).json(payload);
}

// Runs `work(signal)` inside a slot. The signal is aborted when:
//   - the client disconnects (browser closed, route.ts timed out, ...), or
//   - the job runs longer than GENERATION_TIMEOUT_MS.
// Aborting closes that job's browser context, so it never keeps working in
// the background or blocks a slot for people waiting behind it.
async function runGenerationJob(res, work) {
  const controller = new AbortController();

  const onClientClose = () => {
    if (!res.writableEnded && !controller.signal.aborted) {
      controller.abort(makeClientClosedError());
    }
  };

  res.on("close", onClientClose);

  // Caller asked for keep-alive: answer now, so the tunnel never times out
  // while this request waits in line or while Gemini is working.
  if (res.req && res.req.get("x-keepalive") === "1") {
    startKeepAlive(res);
  }

  let acquired = false;
  let timer = null;

  try {
    await acquireSlot(controller.signal);
    acquired = true;

    timer = setTimeout(() => {
      controller.abort(
        new HttpError(
          "Image generation took too long. Please try again.",
          504,
        ),
      );
    }, GENERATION_TIMEOUT_MS);

    controller.signal.deadlineAt = Date.now() + GENERATION_TIMEOUT_MS;

    throwIfAborted(controller.signal);

    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
    res.off("close", onClientClose);
    stopKeepAlive(res);

    if (acquired) {
      releaseSlot();
    }
  }
}

// Last few failures, shown on /health so a failed load test can be explained
// without opening the GitHub log. Only the short message is kept (no page URLs).
const recentErrors = [];

function noteRecentError(label, error) {
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .slice(0, 300);

  recentErrors.push({ at: new Date().toISOString(), label, message });

  while (recentErrors.length > 8) {
    recentErrors.shift();
  }
}

function sendGenerationError(res, error, label) {
  const statusCode =
    error && typeof error.statusCode === "number" ? error.statusCode : 500;

  if (statusCode !== 499) {
    noteRecentError(label, error);
  }

  if (statusCode === 499) {
    console.log(`${label}: client disconnected, job cancelled.`);
  } else {
    console.error(`${label} error:`, error);
  }

  if (res.writableEnded || res.destroyed) {
    return;
  }

  // Headers already sent for some other reason (not our keep-alive): nothing to do.
  if (res.headersSent && !res.locals.keepAliveStarted) {
    return;
  }

  if (error && error.retryAfter && !res.headersSent) {
    res.set("Retry-After", String(error.retryAfter));
  }

  // Only our own HttpError messages are written for visitors. Anything else
  // (Playwright / Gemini page details) gets a plain friendly message.
  const isSafe = error instanceof HttpError || statusCode < 500;
  const publicMessage = isSafe && error instanceof Error
    ? error.message
    : "Image generation is taking longer than usual. Please wait a moment and try again.";

  return sendJson(res, statusCode, {
    success: false,
    error: publicMessage,
    code: error && error.code ? error.code : undefined,
    retryAfter: error && error.retryAfter ? error.retryAfter : undefined,
  });
}

// --------------------------------------------------
// Temp folders
// --------------------------------------------------

async function withTempDir(prefix, work) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));

  try {
    return await work(dir);
  } finally {
    await fs
      .rm(dir, {
        recursive: true,
        force: true,
      })
      .catch(() => {});
  }
}

async function sweepStaleTempDirs() {
  const root = os.tmpdir();
  const entries = await fs.readdir(root).catch(() => []);
  const now = Date.now();

  for (const name of entries) {
    if (!TEMP_DIR_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      continue;
    }

    const fullPath = path.join(root, name);

    try {
      const stat = await fs.stat(fullPath);

      if (now - stat.mtimeMs > TEMP_DIR_MAX_AGE_MS) {
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`Removed stale temp folder: ${name}`);
      }
    } catch {
      // Already gone or not accessible. Nothing to do.
    }
  }
}

// --------------------------------------------------
// Shared Chromium for generation
//
// One Chromium process, one isolated browser context per generation.
// This avoids serializing unrelated users and is much lighter than
// starting a new Chromium process for every request.
// --------------------------------------------------

let generationBrowser = null;
let generationBrowserPromise = null;
let jobsOnCurrentBrowser = 0;

async function getGenerationBrowser() {
  if (generationBrowser && generationBrowser.isConnected()) {
    return generationBrowser;
  }

  if (!generationBrowserPromise) {
    generationBrowserPromise = chromium
      .launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      })
      .then((browser) => {
        generationBrowser = browser;
        jobsOnCurrentBrowser = 0;
        browser.on("disconnected", () => {
          if (generationBrowser === browser) {
            generationBrowser = null;
          }
        });
        return browser;
      })
      .finally(() => {
        generationBrowserPromise = null;
      });
  }

  return generationBrowserPromise;
}

// Restart the shared Chromium after many jobs, but only while nobody is
// generating, so no one's image is ever interrupted.
async function recycleBrowserIfIdle() {
  if (
    activeJobs !== 0 ||
    waitingJobs.length !== 0 ||
    !generationBrowser ||
    jobsOnCurrentBrowser < BROWSER_RECYCLE_AFTER_JOBS
  ) {
    return;
  }

  const browser = generationBrowser;
  generationBrowser = null;
  jobsOnCurrentBrowser = 0;

  console.log("Recycling shared Chromium (idle, many jobs served).");

  await browser.close().catch(() => {});
}

// --------------------------------------------------
// Gemini generation (shared by all three endpoints)
// --------------------------------------------------

async function runGeminiWithSession({
  sessionFile,
  slot,
  imagePaths,
  prompt,
  outputDir,
  settleMs,
  defaultFilename,
  signal,
}) {
  throwIfAborted(signal);

  const startedAt = Date.now();
  const step = (message) =>
    console.log(
      `[session ${slot}] +${Math.round((Date.now() - startedAt) / 1000)}s ${message}`,
    );

  let context = null;
  let page = null;
  let onAbort = null;

  try {
    const browser = await getGenerationBrowser();

    context = await browser.newContext({
      storageState: sessionFile,
      viewport: {
        width: 1440,
        height: 900,
      },
      acceptDownloads: true,
    });

    jobsOnCurrentBrowser += 1;

    // If the job is cancelled, closing the context makes every pending
    // Playwright call below fail right away.
    if (signal) {
      const activeContext = context;

      onAbort = () => {
        activeContext.close().catch(() => {});
      };

      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    page = await context.newPage();

    // 1. Open Gemini
    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    step("Gemini page opened");

    // 2. Type the prompt
    const promptWrapper = page.locator('[data-test-id="textarea-wrapper"]');

    await promptWrapper.waitFor({
      state: "visible",
      timeout: 45000,
    });

    // Limit banner already visible before we even start? Stop right away.
    await throwIfLimitShown(page);

    const promptParagraph = promptWrapper.getByRole("paragraph").first();

    await promptParagraph.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await promptParagraph.click();

    await page.keyboard.insertText(String(prompt).trim());
    step("prompt typed");

    // 3. Open Upload & tools (Gemini sometimes renames this button,
    //    so a few known names are tried)
    //    When many pages run at once, the menu sometimes does not appear after
    //    the click. So: if the "Upload files" item is not there after a few
    //    seconds, close the menu (Escape) and click "Upload & tools" again.
    const uploaderButton = page.locator(
      '[data-test-id="local-images-files-uploader-button"]',
    );

    let menuOpened = false;

    for (let attempt = 1; attempt <= 3 && !menuOpened; attempt += 1) {
      const uploadToolsButton = await findUploadToolsButton(page);

      await uploadToolsButton.click();
      step(attempt === 1 ? "upload menu opened" : `upload menu clicked again (try ${attempt})`);

      try {
        await uploaderButton.waitFor({
          state: "visible",
          timeout: attempt === 3 ? 15000 : 7000,
        });
        menuOpened = true;
      } catch (menuError) {
        throwIfAborted(signal);

        if (attempt === 3) {
          throw menuError;
        }

        step("upload menu did not show, closing it and trying again");
        await page.keyboard.press("Escape").catch(() => {});
        await page.waitForTimeout(800);
      }
    }

    // 4. Click the local uploader and attach the image(s).
    //    With two images the order is kept: first file, then second file.

    const filesToUpload = imagePaths.length === 1 ? imagePaths[0] : imagePaths;

    const chooserPromise = page
      .waitForEvent("filechooser", {
        timeout: 5000,
      })
      .catch(() => null);

    await uploaderButton.click();

    const fileChooser = await chooserPromise;

    if (fileChooser) {
      await fileChooser.setFiles(filesToUpload);
    } else {
      const fileInput = page.locator('input[name="Filedata"]');

      await fileInput.waitFor({
        state: "attached",
        timeout: 15000,
      });

      await fileInput.setInputFiles(filesToUpload);
    }

    // Give Gemini a moment to attach the image(s)
    await page.waitForTimeout(settleMs);
    step("image attached");

    // 5. Send
    const sendButton = page.getByRole("button", {
      name: "Send message",
    });

    await sendButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await sendButton.click();

    // 6. Wait for the generated image (or a limit message)
    step("message sent, waiting for the generated image");

    const waitDeadline = Date.now() + IMAGE_WAIT_MS;
    let downloadButton = null;
    let printedButtons = false;
    const waitStartedAt = Date.now();
    let replyFinishedSince = 0;

    while (true) {
      throwIfAborted(signal);

      downloadButton = await findDownloadButton(page);

      if (downloadButton) {
        break;
      }

      await throwIfLimitShown(page);

      // Gemini finished its reply but gave no image (whatever text it wrote):
      // waiting longer is pointless. Give it a few seconds in case the image is
      // still loading, then stop and ask the visitor to press Generate again.
      if (await isReplyFinished(page)) {
        if (!replyFinishedSince) {
          replyFinishedSince = Date.now();
        } else if (Date.now() - replyFinishedSince > 6000) {
          step("Gemini finished its reply without an image, asking the visitor to retry");
          throw new GeminiRefusedError();
        }
      } else {
        replyFinishedSince = 0;
      }

      // After 45s without a download button, print what buttons exist so
      // we can see if Gemini renamed it.
      if (!printedButtons && Date.now() - waitStartedAt > 45000) {
        printedButtons = true;

        const names = await page
          .evaluate(() =>
            Array.from(document.querySelectorAll("button"))
              .map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim())
              .filter(Boolean)
              .slice(0, 60),
          )
          .catch(() => []);

        step(`still no download button. Buttons on page: ${JSON.stringify(names)}`);
      }

      if (Date.now() > waitDeadline) {
        throw new Error("Timed out waiting for the generated image.");
      }

      await page.waitForTimeout(1500);
    }

    step("image ready, downloading");

    // 7. Download it
    const downloadPromise = page.waitForEvent("download", {
      timeout: 120000,
    });

    await downloadButton.click();

    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename() || defaultFilename;

    const extension = path.extname(suggestedFilename) || ".png";

    const outputPath = path.join(outputDir, `generated${extension}`);

    await download.saveAs(outputPath);
    step("image downloaded");

    const buffer = await fs.readFile(outputPath);

    if (!buffer.length) {
      throw new Error("Gemini returned an empty image.");
    }

    return {
      buffer,
      mimeType: getMimeType(extension),
    };
  } catch (error) {
    // A cancelled job (client left / timeout) is not a Gemini failure.
    if (signal && signal.aborted) {
      throw abortReason(signal);
    }

    // Limit reached: pass it up unchanged so the next session can be tried.
    if (error instanceof GeminiLimitError || error instanceof GeminiRefusedError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    let pageInfo = "";

    if (page) {
      try {
        const bodyText = await page.locator("body").innerText({
          timeout: 3000,
        });

        const buttonNames = await page
          .evaluate(() =>
            Array.from(document.querySelectorAll("button"))
              .map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim())
              .filter(Boolean)
              .map((name) => name.slice(0, 40))
              .slice(-30),
          )
          .catch(() => []);

        pageInfo = ` [page: ${page.url()} | signInVisible: ${/Sign in/i.test(bodyText)} | buttons: ${JSON.stringify(buttonNames)}]`;
      } catch {
        pageInfo = ` [page: ${page.url()}]`;
      }
    }

    // Debug details (page URL, button names) stay on the server only.
    // They must never travel inside the message that is sent to the visitor.
    if (pageInfo) {
      console.log(`[debug]${pageInfo}`);
    }

    const wrapped = new Error(message);
    wrapped.pageInfo = pageInfo;
    throw wrapped;
  } finally {
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }

    if (context) {
      await context.close().catch(() => {});
    }
  }
}

// Finds an enabled "download image" button (Gemini may rename it).
async function findDownloadButton(page) {
  const candidates = [
    page.getByRole("button", { name: "Download full size image" }),
    page.getByRole("button", { name: /download.*image|download full/i }),
    page.locator('button[aria-label*="download" i]'),
  ];

  for (const candidate of candidates) {
    const last = candidate.last();

    if (
      (await last.isVisible().catch(() => false)) &&
      (await last.isEnabled().catch(() => false))
    ) {
      return last;
    }
  }

  return null;
}

// Finds the "+" / "Upload & tools" button in the Gemini prompt box.
async function findUploadToolsButton(page) {
  const candidates = [
    page.getByRole("button", { name: "Upload & tools" }),
    page.getByRole("button", { name: /upload|add files|attach|open upload/i }),
    page.locator('button[aria-label*="upload" i]'),
    page.locator('button[aria-label*="add" i]:has(mat-icon)'),
    page.locator('button:has(mat-icon[fonticon="add_2"])'),
    page.locator('button:has(mat-icon[fonticon="add"])'),
  ];

  const deadline = Date.now() + 20000;

  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      const first = candidate.first();

      if (await first.isVisible().catch(() => false)) {
        return first;
      }
    }

    await sleep(500);
  }

  throw new Error("Could not find the Upload & tools button.");
}

// Looks at the page text. If Gemini shows its limit message, throws.
async function throwIfLimitShown(page) {
  const bodyText = await page
    .locator("body")
    .innerText({ timeout: 3000 })
    .catch(() => "");

  if (LIMIT_TEXT_REGEX.test(bodyText)) {
    throw new GeminiLimitError(
      "Gemini limit reached.",
      parseResetTime(bodyText),
    );
  }

  if (REFUSAL_TEXT_REGEX.test(bodyText)) {
    throw new GeminiRefusedError();
  }
}

// How many jobs are running on each session right now, and when the next
// job on that session may start (for the start spacing).
const sessionActive = {};
const sessionNextStartAt = {};

// Picks the least busy usable session (so 20 jobs at the same moment spread
// 5 / 5 / 5 / 5 over 4 sessions, and 3 jobs go to 3 different sessions).
// If every usable session is full, the job waits here until one is free.
// The chosen session is counted as busy BEFORE this function returns, so two
// jobs can never pick the same last free place.
// Returns null when no usable session is left (all parked / already tried).
const sessionLastClaimAt = {};

async function claimSession(signal, triedSlots, forceSlot = 0) {
  while (true) {
    throwIfAborted(signal);

    // forceSlot is only for testing one session on its own (see /edit-image).
    const candidates = listSessions().filter(
      (s) =>
        isSessionUsable(s) &&
        !triedSlots.has(s.slot) &&
        (!forceSlot || s.slot === forceSlot),
    );

    if (candidates.length === 0) {
      return null;
    }

    // Least busy session first, so jobs spread evenly over all accounts.
    // On a tie, the session that was used longest ago goes first (round robin).
    const limit = perSessionLimit();
    const free = candidates
      .filter((s) => (sessionActive[s.slot] || 0) < limit)
      .sort(
        (a, b) =>
          (sessionActive[a.slot] || 0) - (sessionActive[b.slot] || 0) ||
          (sessionLastClaimAt[a.slot] || 0) - (sessionLastClaimAt[b.slot] || 0) ||
          a.slot - b.slot,
      );

    const best = free[0];

    if (best) {
      sessionActive[best.slot] = (sessionActive[best.slot] || 0) + 1;
      sessionLastClaimAt[best.slot] = Date.now();
      return best;
    }

    await sleep(500);
  }
}

function releaseSession(slot) {
  sessionActive[slot] = Math.max(0, (sessionActive[slot] || 0) - 1);
}

// Spreads job starts on one session: the 1st starts now, the 2nd after
// SESSION_START_STAGGER_MS, the 3rd after twice that, and so on.
async function waitForStartTurn(slot, signal) {
  const now = Date.now();
  const startAt = Math.max(now, sessionNextStartAt[slot] || 0);

  sessionNextStartAt[slot] = startAt + SESSION_START_STAGGER_MS;

  if (startAt > now) {
    await sleep(startAt - now);
  }

  throwIfAborted(signal);
}

// Is this a failure worth trying again on another session?
function retryKind(error) {
  if (error instanceof GeminiRefusedError) {
    return "refused";
  }

  const message = error instanceof Error ? error.message : String(error);

  if (
    /Timed out waiting for the generated image|returned an empty image/i.test(message) ||
    (error && error.name === "TimeoutError") ||
    /Timeout \d+ms exceeded/i.test(message)
  ) {
    return "timeout";
  }

  return "";
}

// Spreads jobs over all sessions (least busy first). When a session says its
// limit is reached, the SAME job moves to another session. When Gemini refuses
// the image or the attempt times out, the job is tried again on a different
// session (up to MAX_JOB_RETRIES times, only if enough job time is left).
// The user only sees an error if every attempt fails.
async function runGeminiGeneration(options) {
  stats.jobs += 1;
  const startedAt = Date.now();

  try {
    const result = await runGeminiGenerationInner(options);
    stats.jobsOk += 1;
    stats.totalOkMs += Date.now() - startedAt;
    return result;
  } catch (error) {
    if (!(error && error.statusCode === 499)) {
      stats.jobsFailed += 1;
    }
    throw error;
  }
}

async function runGeminiGenerationInner(options) {
  if (listSessions().length === 0) {
    throw new Error("Session file not found on server.");
  }

  // Slots this job already tried, so one job can never loop forever.
  const triedSlots = new Set();
  let triedAny = false;
  let transientRetried = false;
  let retriesUsed = 0;
  let lastRetryableError = null;

  while (true) {
    const session = await claimSession(
      options.signal,
      triedSlots,
      options.forceSlot || 0,
    );

    if (!session) {
      break;
    }

    triedSlots.add(session.slot);
    triedAny = true;

    try {
      await waitForStartTurn(session.slot, options.signal);

      console.log(
        `Using Gemini session ${session.slot} (${sessionActive[session.slot]}/${perSessionLimit()} busy).`,
      );

      const generated = await runGeminiWithSession({
        ...options,
        sessionFile: session.file,
        slot: session.slot,
      });

      const usage = usageOf(session.slot);
      usage.ok += 1;
      usage.since += 1;

      return generated;
    } catch (error) {
      if (options.signal && options.signal.aborted) {
        throw abortReason(options.signal);
      }

      if (error instanceof GeminiLimitError) {
        stats.limitHits += 1;
        markSessionLimited(session.slot, error.resetAt);
        console.log(`Session ${session.slot} is out of limit, moving to the next one...`);
        continue;
      }

      const failMessage =
        (error instanceof Error ? error.message : String(error)) +
        ((error && error.pageInfo) || "");

      // Logged-out / expired session: skip it for 6 hours and try the next one,
      // so one dead account never blocks the others.
      if (/signInVisible: true|accounts\.google\.com/i.test(failMessage)) {
        stats.loggedOutSessions += 1;
        limitState[session.slot] = Date.now() + 6 * 60 * 60 * 1000;
        sessionDownReason[session.slot] = "logged-out";
        saveLimitState();
        console.log(
          `Session ${session.slot} looks logged out (re-save it with save-session.js). Skipping it, trying the next one...`,
        );
        continue;
      }

      // The upload step timed out BEFORE the message was sent, so no Gemini
      // quota was used. Try the whole job one more time (once per job).
      if (
        !transientRetried &&
        /local-images-files-uploader-button|input\[name="Filedata"\]/.test(failMessage)
      ) {
        transientRetried = true;
        triedSlots.delete(session.slot);
        console.log(
          `Session ${session.slot}: upload step timed out, trying this job once more...`,
        );
        continue;
      }

      // Gemini refused the image or the attempt timed out: try another session.
      const kind = retryKind(error);

      if (kind) {
        if (kind === "refused") stats.attemptsRefused += 1;
        else stats.attemptsTimedOut += 1;

        const deadlineAt = options.signal && options.signal.deadlineAt;
        const remainingMs = deadlineAt ? deadlineAt - Date.now() : Infinity;

        if (retriesUsed < MAX_JOB_RETRIES && remainingMs >= RETRY_MIN_REMAINING_MS) {
          retriesUsed += 1;
          stats.retries += 1;
          lastRetryableError = error;
          console.log(
            `Session ${session.slot}: ${kind}. Retry ${retriesUsed}/${MAX_JOB_RETRIES} on another session (${Math.round(remainingMs / 1000)}s of job time left)...`,
          );
          continue;
        }

        console.log(
          `Session ${session.slot}: ${kind}. No more retries (used ${retriesUsed}/${MAX_JOB_RETRIES}).`,
        );
        throw error;
      }

      stats.otherErrors += 1;
      console.log(
        `Session ${session.slot} failed (not a limit message): ${failMessage}`,
      );
      throw error;
    } finally {
      // Always give the place on this session back (success, error or retry).
      releaseSession(session.slot);
    }
  }

  // No other session left to retry on: report the real failure, not "out of limit".
  if (lastRetryableError) {
    throw lastRetryableError;
  }

  // Every session is parked or just hit its limit.
  const nextBackAt = listSessions()
    .map((x) => x.usableAt)
    .filter((t) => t > Date.now())
    .sort((x, y) => x - y)[0];

  const waitSeconds = nextBackAt
    ? Math.max(60, Math.ceil((nextBackAt - Date.now()) / 1000))
    : 900;

  console.log(
    `All Gemini sessions are out of limit (${triedAny ? "just checked" : "already parked"}).`,
  );

  throw new HttpError(
    "Image generation is busy right now. Please try again later.",
    503,
    { retryAfter: waitSeconds },
  );
}

// --------------------------------------------------
// Existing AI Editor Gemini generation (one image)
// --------------------------------------------------

function generateWithGemini(imagePath, prompt, outputDir, signal, forceSlot = 0) {
  return runGeminiGeneration({
    forceSlot,
    imagePaths: [imagePath],
    prompt,
    outputDir,
    settleMs: 3000,
    defaultFilename: "gemini-generated-image.png",
    signal,
  });
}

// --------------------------------------------------
// AI Template / Dual Gemini generation (two images, in order)
// --------------------------------------------------

function generateTemplateWithGemini(
  templateImagePath,
  userImagePath,
  prompt,
  outputDir,
  signal,
  secondUserImagePath = null,
) {
  // Order: template first, then person 1, then (couple templates only) person 2.
  const imagePaths = secondUserImagePath
    ? [templateImagePath, userImagePath, secondUserImagePath]
    : [templateImagePath, userImagePath];

  return runGeminiGeneration({
    imagePaths,
    prompt,
    outputDir,
    settleMs: secondUserImagePath ? 6000 : 4000,
    defaultFilename: "gemini-template-generated-image.png",
    signal,
  });
}

// --------------------------------------------------
// API
// --------------------------------------------------

// What the Messenger monitor looks at (see notifier.js).
function monitorSnapshot() {
  return {
    sessions: listSessions().map((x) => ({
      slot: x.slot,
      usable: isSessionUsable(x),
      until: x.usableAt > Date.now() ? x.usableAt : 0,
      reason: isSessionUsable(x) ? "" : sessionDownReason[x.slot] || "",
      ok: usageOf(x.slot).ok,
      since: usageOf(x.slot).since,
      limitAfter: usageOf(x.slot).limitAfter,
    })),
    jobs: stats.jobs,
    ok: stats.jobsOk,
    failed: stats.jobsFailed,
    retries: stats.retries,
    refused: stats.attemptsRefused,
    timedOut: stats.attemptsTimedOut,
    peakActive: stats.peakActive,
    peakWaiting: stats.peakWaiting,
    avgSeconds: stats.jobsOk ? Math.round(stats.totalOkMs / stats.jobsOk / 1000) : 0,
  };
}

// Only the GitHub watchdog script calls this (it knows a random token made for
// this run). It sends a short status line to Messenger.
app.post("/notify", (req, res) => {
  const token = process.env.NOTIFY_TOKEN || "";

  if (!token || req.get("x-notify-token") !== token) {
    return res.status(404).end();
  }

  const text = req.body && typeof req.body.text === "string" ? req.body.text : "";

  if (!text) {
    return res.status(400).json({ success: false });
  }

  notifier.notify(text);
  return res.json({ success: true });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    generation: {
      active: activeJobs,
      waiting: waitingJobs.length,
      maxConcurrent: MAX_CONCURRENT_GENERATIONS,
      currentCapacity: currentCapacity(),
      maxQueue: MAX_QUEUE_LENGTH,
    },
    perSessionConcurrency: perSessionLimit(),
    maxJobRetries: MAX_JOB_RETRIES,
    stats,
    imagesPerSession: Object.fromEntries(
      Object.entries(sessionUsage).map(([slot, u]) => [slot, u.ok]),
    ),
    notifier: notifier.status(),
    recentErrors,
    sessions: listSessions().map((x) => ({
      slot: x.slot,
      active: sessionActive[x.slot] || 0,
      usable: isSessionUsable(x),
      usableAgainAt: x.usableAt > Date.now() ? new Date(x.usableAt).toISOString() : null,
    })),
  });
});

app.get("/login", async (req, res) => {
  try {
    await startDesktop();

    const page = await getGeminiPage();

    await page.bringToFront();

    return res.json({
      success: true,
      message:
        "Cloud Chromium is running. Open /vnc.html and complete Gemini login yourself.",
      geminiUrl: page.url(),
      vncUrl: "/vnc.html?autoconnect=true&resize=scale&path=websockify",
    });
  } catch (error) {
    console.error("Login browser error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/browser-status", async (req, res) => {
  try {
    if (!browserContext) {
      return res.json({
        success: true,
        browserRunning: false,
        pageCount: 0,
        pages: [],
      });
    }

    const pages = browserContext.pages();

    return res.json({
      success: true,
      browserRunning: true,
      pageCount: pages.length,
      pages: pages.map((page) => page.url()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/session-test", async (req, res) => {
  let browser = null;

  try {
    // Tests the first usable session (add ?slot=2 or ?slot=3 to test another).
    const wantedSlot = Number(req.query.slot) || 0;
    const picked = listSessions().find((s) =>
      wantedSlot ? s.slot === wantedSlot : true,
    );
    const sessionFile = picked && picked.file;

    if (!sessionFile) {
      return res.status(404).json({
        success: false,
        error: "Session file not found on server.",
      });
    }

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const context = await browser.newContext({
      storageState: sessionFile,
      viewport: {
        width: 1440,
        height: 900,
      },
    });

    const page = await context.newPage();

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    const bodyText = await page.locator("body").innerText();

    const hasSignIn = /Sign in/i.test(bodyText);

    const hasPromptBox =
      (await page.locator('[data-test-id="textarea-wrapper"]').count()) > 0;

    return res.json({
      success: true,
      sessionFileFound: true,
      slot: picked.slot,
      url: page.url(),
      title: await page.title(),
      hasSignIn,
      hasPromptBox,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
});

// --------------------------------------------------
// Existing AI Editor endpoint
// --------------------------------------------------

app.post("/edit-image", requireApiKey, parseUpload, async (req, res) => {
  const prompt =
    typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: "No editing prompt was provided.",
    });
  }

  if (!req.file || !req.file.buffer || !req.file.buffer.length) {
    return res.status(400).json({
      success: false,
      error: "No source image was provided.",
    });
  }

  if (
    !String(req.file.mimetype || "")
      .toLowerCase()
      .startsWith("image/")
  ) {
    return res.status(400).json({
      success: false,
      error: "Uploaded source file is not an image.",
    });
  }

  const file = req.file;

  // Testing only: start the server with  $env:ALLOW_FORCE_SLOT="1"  and call
  // /edit-image?slot=2  to run this one job on Gemini session 2 only.
  const forceSlot =
    process.env.ALLOW_FORCE_SLOT === "1" ? Number(req.query.slot) || 0 : 0;

  try {
    const result = await runGenerationJob(res, (signal) =>
      withTempDir("gemini-edit-", async (tempDir) => {
        const sourcePath = path.join(
          tempDir,
          `source${getExtension(file.mimetype)}`,
        );

        await fs.writeFile(sourcePath, file.buffer);

        return generateWithGemini(sourcePath, prompt, tempDir, signal, forceSlot);
      }),
    );

    return sendJson(res, 200, {
      success: true,
      provider: "gemini-playwright-render",
      image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
    });
  } catch (error) {
    return sendGenerationError(res, error, "edit-image");
  }
});

// --------------------------------------------------
// NEW AI Template endpoint
// --------------------------------------------------

app.post(
  "/template-edit",
  requireApiKey,
  parseTemplateUpload,
  async (req, res) => {
    const prompt =
      typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "No template generation prompt was provided.",
      });
    }

    const files = req.files || {};

    const userFiles = Array.isArray(files.image) ? files.image : [];

    const templateFiles = Array.isArray(files.templateImage)
      ? files.templateImage
      : [];

    const userFile = userFiles[0];

    const templateFile = templateFiles[0];

    // Couple templates send the second person's photo as "image2" (optional).
    const secondUserFile = Array.isArray(files.image2) ? files.image2[0] : null;

    if (!userFile || !userFile.buffer || !userFile.buffer.length) {
      return res.status(400).json({
        success: false,
        error: "No user photo was provided.",
      });
    }

    if (!templateFile || !templateFile.buffer || !templateFile.buffer.length) {
      return res.status(400).json({
        success: false,
        error: "No template image was provided.",
      });
    }

    if (
      !String(userFile.mimetype || "")
        .toLowerCase()
        .startsWith("image/")
    ) {
      return res.status(400).json({
        success: false,
        error: "Uploaded user photo is not an image.",
      });
    }

    if (
      !String(templateFile.mimetype || "")
        .toLowerCase()
        .startsWith("image/")
    ) {
      return res.status(400).json({
        success: false,
        error: "Uploaded template file is not an image.",
      });
    }

    if (secondUserFile) {
      if (
        !secondUserFile.buffer ||
        !secondUserFile.buffer.length ||
        !String(secondUserFile.mimetype || "")
          .toLowerCase()
          .startsWith("image/")
      ) {
        return res.status(400).json({
          success: false,
          error: "Uploaded second person photo is not an image.",
        });
      }
    }

    try {
      const result = await runGenerationJob(res, (signal) =>
        withTempDir("gemini-template-edit-", async (tempDir) => {
          const templatePath = path.join(
            tempDir,
            `template${getExtension(templateFile.mimetype)}`,
          );

          const userPath = path.join(
            tempDir,
            `user${getExtension(userFile.mimetype)}`,
          );

          await fs.writeFile(templatePath, templateFile.buffer);

          await fs.writeFile(userPath, userFile.buffer);

          let secondUserPath = null;

          if (secondUserFile) {
            secondUserPath = path.join(
              tempDir,
              `user-2${getExtension(secondUserFile.mimetype)}`,
            );

            await fs.writeFile(secondUserPath, secondUserFile.buffer);
          }

          return generateTemplateWithGemini(
            templatePath,
            userPath,
            prompt,
            tempDir,
            signal,
            secondUserPath,
          );
        }),
      );

      return sendJson(res, 200, {
        success: true,
        provider: "gemini-playwright-template",
        image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
      });
    } catch (error) {
      return sendGenerationError(res, error, "template-edit");
    }
  },
);

// --------------------------------------------------
// NEW AI Editor DUAL endpoint (two photos -> ONE group photo)
// This reuses the generic two-image Gemini uploader
// (generateTemplateWithGemini), which just attaches the two files in
// order and sends the prompt.
// --------------------------------------------------

app.post(
  "/edit-image-dual",
  requireApiKey,
  parseDualUpload,
  async (req, res) => {
    const prompt =
      typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "No editing prompt was provided.",
      });
    }

    const files = req.files || {};
    const leftFile = Array.isArray(files.image) ? files.image[0] : null;
    const rightFile = Array.isArray(files.image2) ? files.image2[0] : null;

    if (!leftFile || !leftFile.buffer || !leftFile.buffer.length) {
      return res.status(400).json({
        success: false,
        error: "No left person photo was provided.",
      });
    }

    if (!rightFile || !rightFile.buffer || !rightFile.buffer.length) {
      return res.status(400).json({
        success: false,
        error: "No right person photo was provided.",
      });
    }

    if (
      !String(leftFile.mimetype || "").toLowerCase().startsWith("image/") ||
      !String(rightFile.mimetype || "").toLowerCase().startsWith("image/")
    ) {
      return res.status(400).json({
        success: false,
        error: "Uploaded dual photo is not an image.",
      });
    }

    try {
      const result = await runGenerationJob(res, (signal) =>
        withTempDir("gemini-dual-edit-", async (tempDir) => {
          // File names keep the upload order: person 1 first, person 2 second.
          const leftPath = path.join(
            tempDir,
            `person-1-left${getExtension(leftFile.mimetype)}`,
          );
          const rightPath = path.join(
            tempDir,
            `person-2-right${getExtension(rightFile.mimetype)}`,
          );

          await fs.writeFile(leftPath, leftFile.buffer);
          await fs.writeFile(rightPath, rightFile.buffer);

          return generateTemplateWithGemini(
            leftPath,
            rightPath,
            prompt,
            tempDir,
            signal,
          );
        }),
      );

      return sendJson(res, 200, {
        success: true,
        provider: "gemini-playwright-dual",
        image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
      });
    } catch (error) {
      return sendGenerationError(res, error, "edit-image-dual");
    }
  },
);

// --------------------------------------------------
// Start Node API
// --------------------------------------------------

const server = app.listen(PORT, "127.0.0.1", async () => {
  console.log(`Node API running on internal port ${PORT}`);
  console.log(
    `Generation limits: up to ${MAX_CONCURRENT_GENERATIONS} at once, ${MAX_QUEUE_LENGTH} waiting.`,
  );
  console.log(
    `Sessions found: ${listSessions().length} (${perSessionLimit()} jobs per session, capacity now ${currentCapacity()}, up to ${MAX_JOB_RETRIES} retries per job, ${SESSION_START_STAGGER_MS}ms start spacing).`,
  );

  notifier.start({
    getBrowser: getGenerationBrowser,
    getSnapshot: monitorSnapshot,
    runStartMs: Number(process.env.JOB_START_EPOCH) > 0
      ? Number(process.env.JOB_START_EPOCH) * 1000
      : Date.now(),
  });

  sweepStaleTempDirs().catch(() => {});

  setInterval(() => {
    sweepStaleTempDirs().catch(() => {});
  }, TEMP_SWEEP_INTERVAL_MS).unref();

  if (process.env.SKIP_DESKTOP !== "1") {
    try {
      await startDesktop();
    } catch (error) {
      console.error("Desktop startup failed:", error);
    }
  }
});

// --------------------------------------------------
// Shutdown
// --------------------------------------------------

async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down...`);

  try {
    if (browserContext) {
      await browserContext.close().catch(() => {});
    }

    if (generationBrowser) {
      await generationBrowser.close().catch(() => {});
    }
  } finally {
    for (const child of desktopProcesses) {
      child.kill("SIGTERM");
    }

    server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(0);
    }, 5000);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));

// A stray error inside one job must never take the whole service down.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});
