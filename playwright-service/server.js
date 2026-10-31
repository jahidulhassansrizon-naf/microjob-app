const express = require("express");
const { chromium } = require("playwright");
const multer = require("multer");
const { spawn } = require("node:child_process");
const { promises: fs, existsSync } = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");

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

function findSessionFile() {
  return [
    "/etc/secrets/gemini-session.json",
    path.join(__dirname, "gemini-session.json"),
  ].find((p) => existsSync(p));
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

const MAX_CONCURRENT_GENERATIONS = readIntEnv(
  "MAX_CONCURRENT_GENERATIONS",
  15,
  1,
  50,
);
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

    if (activeJobs < MAX_CONCURRENT_GENERATIONS) {
      activeJobs += 1;
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
  });
}

function releaseSlot() {
  const next = waitingJobs.shift();

  if (next) {
    // Hand the slot straight to the next person in line.
    clearTimeout(next.timer);
    next.signal.removeEventListener("abort", next.onAbort);
    next.resolve();
    return;
  }

  activeJobs = Math.max(0, activeJobs - 1);

  if (activeJobs === 0) {
    recycleBrowserIfIdle().catch(() => {});
  }
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

    throwIfAborted(controller.signal);

    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
    res.off("close", onClientClose);

    if (acquired) {
      releaseSlot();
    }
  }
}

function sendGenerationError(res, error, label) {
  const statusCode =
    error && typeof error.statusCode === "number" ? error.statusCode : 500;

  if (statusCode === 499) {
    console.log(`${label}: client disconnected, job cancelled.`);
  } else {
    console.error(`${label} error:`, error);
  }

  if (res.headersSent || res.writableEnded || res.destroyed) {
    return;
  }

  if (error && error.retryAfter) {
    res.set("Retry-After", String(error.retryAfter));
  }

  return res.status(statusCode).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
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

async function runGeminiGeneration({
  imagePaths,
  prompt,
  outputDir,
  settleMs,
  defaultFilename,
  signal,
}) {
  const sessionFile = findSessionFile();

  if (!sessionFile) {
    throw new Error("Session file not found on server.");
  }

  throwIfAborted(signal);

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

    // 2. Type the prompt
    const promptWrapper = page.locator('[data-test-id="textarea-wrapper"]');

    await promptWrapper.waitFor({
      state: "visible",
      timeout: 45000,
    });

    const promptParagraph = promptWrapper.getByRole("paragraph").first();

    await promptParagraph.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await promptParagraph.click();

    await page.keyboard.insertText(String(prompt).trim());

    // 3. Open Upload & tools
    const uploadToolsButton = page.getByRole("button", {
      name: "Upload & tools",
    });

    await uploadToolsButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await uploadToolsButton.click();

    // 4. Click the local uploader and attach the image(s).
    //    With two images the order is kept: first file, then second file.
    const uploaderButton = page.locator(
      '[data-test-id="local-images-files-uploader-button"]',
    );

    await uploaderButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

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

    // 5. Send
    const sendButton = page.getByRole("button", {
      name: "Send message",
    });

    await sendButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await sendButton.click();

    // 6. Wait for the generated image
    const downloadButton = page
      .getByRole("button", {
        name: "Download full size image",
      })
      .last();

    await downloadButton.waitFor({
      state: "visible",
      timeout: 180000,
    });

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

    const message = error instanceof Error ? error.message : String(error);

    let pageInfo = "";

    if (page) {
      try {
        const bodyText = await page.locator("body").innerText({
          timeout: 3000,
        });

        pageInfo = ` [page: ${page.url()} | signInVisible: ${/Sign in/i.test(bodyText)}]`;
      } catch {
        pageInfo = ` [page: ${page.url()}]`;
      }
    }

    throw new Error(`${message}${pageInfo}`);
  } finally {
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }

    if (context) {
      await context.close().catch(() => {});
    }
  }
}

// --------------------------------------------------
// Existing AI Editor Gemini generation (one image)
// --------------------------------------------------

function generateWithGemini(imagePath, prompt, outputDir, signal) {
  return runGeminiGeneration({
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
) {
  return runGeminiGeneration({
    imagePaths: [templateImagePath, userImagePath],
    prompt,
    outputDir,
    settleMs: 4000,
    defaultFilename: "gemini-template-generated-image.png",
    signal,
  });
}

// --------------------------------------------------
// API
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    generation: {
      active: activeJobs,
      waiting: waitingJobs.length,
      maxConcurrent: MAX_CONCURRENT_GENERATIONS,
      maxQueue: MAX_QUEUE_LENGTH,
    },
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
    const sessionFile = [
      "/etc/secrets/gemini-session.json",
      path.join(__dirname, "gemini-session.json"),
    ].find((p) => existsSync(p));

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

  try {
    const result = await runGenerationJob(res, (signal) =>
      withTempDir("gemini-edit-", async (tempDir) => {
        const sourcePath = path.join(
          tempDir,
          `source${getExtension(file.mimetype)}`,
        );

        await fs.writeFile(sourcePath, file.buffer);

        return generateWithGemini(sourcePath, prompt, tempDir, signal);
      }),
    );

    return res.json({
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

          return generateTemplateWithGemini(
            templatePath,
            userPath,
            prompt,
            tempDir,
            signal,
          );
        }),
      );

      return res.json({
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

      return res.json({
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
    `Generation limits: ${MAX_CONCURRENT_GENERATIONS} at once, ${MAX_QUEUE_LENGTH} waiting.`,
  );

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
