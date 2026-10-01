const express = require("express");
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");

const { promises: fs } = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { existsSync } = require("node:fs");
const { WebSocketServer } = require("ws");

const app = express();

const PORT = Number(process.env.PORT || 10000);
const DISPLAY = process.env.DISPLAY || ":99";
const VNC_PORT = 5900;

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

  const xauthFile = "/tmp/gemini-xauth";
  const cookie = crypto.randomBytes(16).toString("hex");

  console.log("Creating X11 authentication cookie...");

  execFileSync("xauth", ["-f", xauthFile, "add", DISPLAY, ".", cookie], {
    stdio: "inherit",
  });

  process.env.XAUTHORITY = xauthFile;

  console.log("X11 authentication cookie created.");

  startProcess(
    "Xvfb",
    [
      DISPLAY,
      "-screen",
      "0",
      "1440x900x24",
      "-ac",
      "+extension",
      "RANDR",
      "-auth",
      xauthFile,
    ],
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

  await sleep(2000);

  console.log("Virtual desktop is ready.");
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
      "--start-maximized",
      "--disable-dev-shm-usage",
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
// Basic routes
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
// Start browser
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
      "/novnc/vnc.html?autoconnect=true&resize=scale&path=websockify",
    );
  });
} else {
  console.error("Could not find noVNC directory.");
}

// --------------------------------------------------
// HTTP server
// --------------------------------------------------

const server = http.createServer(app);

// --------------------------------------------------
// WebSocket → VNC TCP bridge
// --------------------------------------------------

const wss = new WebSocketServer({
  noServer: true,
});

server.on("upgrade", (req, socket, head) => {
  const requestUrl = new URL(
    req.url || "/",
    `http://${req.headers.host || "localhost"}`,
  );

  if (requestUrl.pathname !== "/websockify") {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

wss.on("connection", (ws) => {
  console.log("noVNC WebSocket connected.");

  const vncSocket = net.createConnection({
    host: "127.0.0.1",
    port: VNC_PORT,
  });

  let closed = false;

  function closeEverything() {
    if (closed) return;

    closed = true;

    try {
      vncSocket.destroy();
    } catch {}

    try {
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    } catch {}
  }

  vncSocket.on("connect", () => {
    console.log("Connected to x11vnc TCP server.");
  });

  vncSocket.on("data", (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });

  vncSocket.on("error", (error) => {
    console.error("VNC TCP error:", error.message);
    closeEverything();
  });

  vncSocket.on("close", () => {
    console.log("VNC TCP connection closed.");
    closeEverything();
  });

  ws.on("message", (message) => {
    if (!vncSocket.destroyed) {
      const buffer = Buffer.isBuffer(message) ? message : Buffer.from(message);

      vncSocket.write(buffer);
    }
  });

  ws.on("error", (error) => {
    console.error("noVNC WebSocket error:", error.message);
    closeEverything();
  });

  ws.on("close", () => {
    console.log("noVNC WebSocket closed.");
    closeEverything();
  });
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
