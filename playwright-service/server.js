const express = require("express");
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("node:child_process");
const { promises: fs, existsSync } = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const httpProxy = require("http-proxy");

const app = express();

const PORT = Number(process.env.PORT || 10000);
const DISPLAY = process.env.DISPLAY || ":99";

const VNC_PORT = 5900;
const WEBSOCKIFY_PORT = 6080;

const BROWSER_DATA_DIR = process.env.BROWSER_DATA_DIR || "/tmp/gemini-profile";

process.env.DISPLAY = DISPLAY;

let browserContext = null;
let desktopProcesses = [];

const websockifyProxy = httpProxy.createProxyServer({
  target: `http://127.0.0.1:${WEBSOCKIFY_PORT}`,
  ws: true,
  changeOrigin: true,
});

websockifyProxy.on("error", (error) => {
  console.error("websockify proxy error:", error.message);
});

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

  const xauthFile = "/tmp/gemini-xauth";

  console.log("Creating X11 authentication cookie...");

  const cookie = crypto.randomBytes(16).toString("hex");

  try {
    execFileSync("xauth", ["-f", xauthFile, "add", DISPLAY, ".", cookie], {
      stdio: "inherit",
    });
  } catch (error) {
    console.error("Failed to create X11 auth cookie:", error);
    throw error;
  }

  process.env.XAUTHORITY = xauthFile;

  console.log("Starting Xvfb...");

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

  console.log("Starting Fluxbox...");

  startProcess("fluxbox", [], "fluxbox");

  await sleep(1500);

  console.log("Starting x11vnc...");

  startProcess(
    "x11vnc",
    [
      "-display",
      DISPLAY,
      "-auth",
      xauthFile,
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

  await sleep(2500);

  console.log("Starting websockify...");

  startProcess(
    "websockify",
    [String(WEBSOCKIFY_PORT), `127.0.0.1:${VNC_PORT}`],
    "websockify",
  );

  await sleep(2500);

  console.log("Virtual desktop and WebSocket VNC proxy are ready.");
}

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
// Health
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
// Start cloud browser
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
      novncUrl: "/novnc/vnc.html?autoconnect=true&resize=scale&path=websockify",
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

// --------------------------------------------------
// noVNC
// --------------------------------------------------

const noVncCandidates = ["/usr/share/novnc", "/usr/share/noVNC"];

let noVncDirectory = null;

for (const candidate of noVncCandidates) {
  if (existsSync(candidate)) {
    noVncDirectory = candidate;
    break;
  }
}

if (noVncDirectory) {
  console.log("Using noVNC directory:", noVncDirectory);

  app.use("/novnc", express.static(noVncDirectory));

  app.get("/novnc", (req, res) => {
    res.redirect(
      "/novnc/vnc.html?autoconnect=true&resize=scale&path=/websockify",
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
// WebSocket → websockify
// --------------------------------------------------

server.on("upgrade", (req, socket, head) => {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );

  if (url.pathname !== "/websockify") {
    socket.destroy();
    return;
  }

  console.log("WebSocket upgrade received for /websockify");

  websockifyProxy.ws(req, socket, head);
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
