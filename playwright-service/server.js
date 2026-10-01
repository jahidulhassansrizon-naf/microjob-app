const express = require("express");
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const { promises: fs, existsSync } = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

const app = express();

const PORT = 3000;
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
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

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
// API
// --------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
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
      viewport: { width: 1440, height: 900 },
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
// Start Node API
// --------------------------------------------------

const server = app.listen(PORT, "127.0.0.1", async () => {
  console.log(`Node API running on internal port ${PORT}`);

  try {
    await startDesktop();
  } catch (error) {
    console.error("Desktop startup failed:", error);
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
