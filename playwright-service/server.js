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

// Reuse one Chromium process while giving every generation its own isolated
// browser context. This avoids serializing unrelated users and is substantially
// lighter than starting a new Chromium process for every request.
let generationBrowser = null;
let generationBrowserPromise = null;

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

// --------------------------------------------------
// Existing AI Editor Gemini generation
// --------------------------------------------------

async function generateWithGemini(imagePath, prompt, outputDir) {
  const sessionFile = findSessionFile();

  if (!sessionFile) {
    throw new Error("Session file not found on server.");
  }

  let context = null;
  let page = null;

  try {
    const browser = await getGenerationBrowser();
    context = await browser.newContext({
      storageState: sessionFile,
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });

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

    // 4. Click the local uploader and attach the image
    const uploaderButton = page.locator(
      '[data-test-id="local-images-files-uploader-button"]',
    );

    await uploaderButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    const chooserPromise = page
      .waitForEvent("filechooser", {
        timeout: 5000,
      })
      .catch(() => null);

    await uploaderButton.click();

    const fileChooser = await chooserPromise;

    if (fileChooser) {
      await fileChooser.setFiles(imagePath);
    } else {
      const fileInput = page.locator('input[name="Filedata"]');

      await fileInput.waitFor({
        state: "attached",
        timeout: 15000,
      });

      await fileInput.setInputFiles(imagePath);
    }

    // Give Gemini a moment to attach the image
    await page.waitForTimeout(3000);

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

    const suggestedFilename =
      download.suggestedFilename() || "gemini-generated-image.png";

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
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

// --------------------------------------------------
// NEW AI Template Gemini generation
// --------------------------------------------------

async function generateTemplateWithGemini(
  templateImagePath,
  userImagePath,
  prompt,
  outputDir,
) {
  const sessionFile = findSessionFile();

  if (!sessionFile) {
    throw new Error("Session file not found on server.");
  }

  let context = null;
  let page = null;

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

    page = await context.newPage();

    // 1. Open Gemini
    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 2. Type the template prompt
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

    // 4. Attach BOTH images.
    //
    // First image  = template/reference
    // Second image = user's own photo
    const uploaderButton = page.locator(
      '[data-test-id="local-images-files-uploader-button"]',
    );

    await uploaderButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    const filesToUpload = [templateImagePath, userImagePath];

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

    // Give Gemini time to attach both images.
    await page.waitForTimeout(4000);

    // 5. Send
    const sendButton = page.getByRole("button", {
      name: "Send message",
    });

    await sendButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await sendButton.click();

    // 6. Wait for generated image
    const downloadButton = page
      .getByRole("button", {
        name: "Download full size image",
      })
      .last();

    await downloadButton.waitFor({
      state: "visible",
      timeout: 180000,
    });

    // 7. Download generated image
    const downloadPromise = page.waitForEvent("download", {
      timeout: 120000,
    });

    await downloadButton.click();

    const download = await downloadPromise;

    const suggestedFilename =
      download.suggestedFilename() || "gemini-template-generated-image.png";

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
    if (context) {
      await context.close().catch(() => {});
    }
  }
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

  let tempDir = null;

  try {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gemini-edit-"));

    const sourcePath = path.join(
      tempDir,
      `source${getExtension(req.file.mimetype)}`,
    );

    await fs.writeFile(sourcePath, req.file.buffer);

    const result = await generateWithGemini(sourcePath, prompt, tempDir);

    return res.json({
      success: true,
      provider: "gemini-playwright-render",
      image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
    });
  } catch (error) {
    console.error("edit-image error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    if (tempDir) {
      await fs
        .rm(tempDir, {
          recursive: true,
          force: true,
        })
        .catch(() => {});
    }
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

    let tempDir = null;

    try {
      tempDir = await fs.mkdtemp(
        path.join(os.tmpdir(), "gemini-template-edit-"),
      );

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

      const result = await generateTemplateWithGemini(
        templatePath,
        userPath,
        prompt,
        tempDir,
      );

      return res.json({
        success: true,
        provider: "gemini-playwright-template",
        image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
      });
    } catch (error) {
      console.error("template-edit error:", error);

      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (tempDir) {
        await fs
          .rm(tempDir, {
            recursive: true,
            force: true,
          })
          .catch(() => {});
      }
    }
  },
);

// --------------------------------------------------
// NEW AI Editor DUAL endpoint (two photos -> ONE group photo)
// Existing endpoints above are untouched. This reuses the generic
// two-image Gemini uploader (generateTemplateWithGemini), which just
// attaches the two files in order and sends the prompt.
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

    let tempDir = null;

    try {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gemini-dual-edit-"));

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

      const result = await generateTemplateWithGemini(
        leftPath,
        rightPath,
        prompt,
        tempDir,
      );

      return res.json({
        success: true,
        provider: "gemini-playwright-dual",
        image: `data:${result.mimeType};base64,${result.buffer.toString("base64")}`,
      });
    } catch (error) {
      console.error("edit-image-dual error:", error);

      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (tempDir) {
        await fs
          .rm(tempDir, {
            recursive: true,
            force: true,
          })
          .catch(() => {});
      }
    }
  },
);

// --------------------------------------------------
// Start Node API
// --------------------------------------------------

const server = app.listen(PORT, "127.0.0.1", async () => {
  console.log(`Node API running on internal port ${PORT}`);

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
