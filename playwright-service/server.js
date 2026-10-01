const express = require("express");
const { chromium } = require("playwright");

const app = express();

const PORT = process.env.PORT || 3000;

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

// Health check
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

// Playwright + Chromium test
app.get("/playwright-test", async (req, res) => {
  let browser = null;

  try {
    console.log("Starting Playwright...");

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const title = await page.title();

    await browser.close();

    return res.json({
      success: true,
      playwright: "working",
      chromium: "working",
      title,
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error("Playwright test failed:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/gemini-test", async (req, res) => {
  let browser = null;

  try {
    console.log("Opening Gemini...");

    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const title = await page.title();
    const url = page.url();

    await browser.close();

    return res.json({
      success: true,
      gemini: "reachable",
      title,
      url,
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error("Gemini test failed:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/gemini-login-test", async (req, res) => {
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").innerText();

    const needsLogin =
      bodyText.toLowerCase().includes("sign in") ||
      bodyText.toLowerCase().includes("sign into");

    await browser.close();

    return res.json({
      success: true,
      loggedIn: !needsLogin,
      message: needsLogin
        ? "Gemini opened, but login is required."
        : "Gemini appears to be logged in.",
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/gemini-ui-test", async (req, res) => {
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);

    const promptWrapper = page.locator('[data-test-id="textarea-wrapper"]');

    const uploadToolsButton = page.getByRole("button", {
      name: "Upload & tools",
    });

    const promptVisible = await promptWrapper.isVisible().catch(() => false);
    const uploadToolsVisible = await uploadToolsButton
      .isVisible()
      .catch(() => false);

    await browser.close();

    return res.json({
      success: true,
      geminiPage: "opened",
      promptEditor: promptVisible,
      uploadTools: uploadToolsVisible,
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Playwright service running on port ${PORT}`);
});
