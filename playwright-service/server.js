const express = require("express");
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const httpProxy = require("http-proxy");

const app = express();

const PORT = Number(process.env.PORT || 10000);
const DISPLAY = process.env.DISPLAY || ":99";

const VNC_PORT = 5900;
const WEBSOCKIFY_PORT = 6080;
const CDP_PORT = 9222;

const BROWSER_DATA_DIR = process.env.BROWSER_DATA_DIR || "/tmp/gemini-profile";

process.env.DISPLAY = DISPLAY;

let browserContext = null;
let desktopProcesses = [];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "10mb" }));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);

  const child = spawn(command, args, {
    env: {
      ...process.env,
      DISPLAY,
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
    console.error(`${name} failed:`, error);
  });

  child.on("exit", (code, signal) => {
    console.log(`${name} exited`, { code, signal });
  });

  desktopProcesses.push(child);

  return child;
}

async function startDesktop() {
  if (desktopProcesses.length > 0) {
    return;
  }

  startProcess(
    "Xvfb",
    [DISPLAY, "-screen", "0", "1440x900x24", "-ac", "+extension", "RANDR"],
    "Xvfb",
  );

  await sleep(1500);

  startProcess("fluxbox", [], "fluxbox");

  await sleep(1500);

  startProcess(
    "x11vnc",
    [
      "-display",
      DISPLAY,
      "-forever",
      "-shared",
      "-rfbport",
      String(VNC_PORT),
      "-nopw",
      "-listen",
      "127.0.0.1",
      "-noxdamage",
    ],
    "x11vnc",
  );

  await sleep(1500);

  startProcess(
    "websockify",
    [String(WEBSOCKIFY_PORT), `127.0.0.1:${VNC_PORT}`],
    "websockify",
  );

  await sleep(1500);
}

async function getBrowserContext() {
  if (browserContext) {
    return browserContext;
  }

  await fs.promises.mkdir(BROWSER_DATA_DIR, {
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
      `--remote-debugging-port=${CDP_PORT}`,
      "--remote-debugging-address=127.0.0.1",
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
// Basic health
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "microjob-playwright",
    status: "online",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

// --------------------------------------------------
// Start cloud browser + open Gemini
// --------------------------------------------------

app.get("/login", async (req, res) => {
  try {
    await startDesktop();

    const page = await getGeminiPage();

    await page.bringToFront();

    return res.json({
      success: true,
      message:
        "Cloud Chromium is running. Open the noVNC URL and complete Gemini login yourself.",
      geminiUrl: page.url(),
      novncPath:
        "/novnc/vnc.html?autoconnect=true&resize=scale&path=websockify",
    });
  } catch (error) {
    console.error("Login browser error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// --------------------------------------------------
// Browser status
// --------------------------------------------------

app.get("/browser-status", async (req, res) => {
  try {
    const context = await getBrowserContext();

    const pages = context.pages();

    return res.json({
      success: true,
      browserRunning: true,
      pageCount: pages.length,
      pages: pages.map((page) => page.url()),
      cdp: `127.0.0.1:${CDP_PORT}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// --------------------------------------------------
// noVNC static files
// --------------------------------------------------

const noVncCandidates = ["/usr/share/novnc", "/usr/share/noVNC"];

let noVncDirectory = null;

for (const candidate of noVncCandidates) {
  if (fs.existsSync(candidate)) {
    noVncDirectory = candidate;
    break;
  }
}

if (noVncDirectory) {
  console.log("noVNC directory:", noVncDirectory);

  app.use("/novnc", express.static(noVncDirectory));

  app.get("/novnc", (req, res) => {
    res.redirect(
      "/novnc/vnc.html?autoconnect=true&resize=scale&path=websockify",
    );
  });
} else {
  console.error("noVNC directory was not found.");
}

// --------------------------------------------------
// HTTP server
// --------------------------------------------------

const server = http.createServer(app);

// --------------------------------------------------
// WebSocket proxy:
// public /websockify
//        ↓
// localhost:6080
//        ↓
// x11vnc :5900
// --------------------------------------------------

const proxy = httpProxy.createProxyServer({
  target: `http://127.0.0.1:${WEBSOCKIFY_PORT}`,
  ws: true,
  changeOrigin: true,
});

proxy.on("error", (error) => {
  console.error("WebSocket proxy error:", error.message);
});

server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/websockify")) {
    proxy.ws(req, socket, head);
    return;
  }

  socket.destroy();
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`Playwright service running on port ${PORT}`);

  try {
    await startDesktop();
  } catch (error) {
    console.error("Desktop startup error:", error);
  }
});

// --------------------------------------------------
// Graceful shutdown
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
