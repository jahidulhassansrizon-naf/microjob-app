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
// Gemini cloud browser status
// --------------------------------------------------

app.get("/gemini-status", async (req, res) => {
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

    await page.waitForTimeout(5000);

    const bodyText = await page.locator("body").innerText();

    const promptBox = page.getByRole("textbox", {
      name: "Enter a prompt for Gemini",
    });

    const promptBoxVisible = await promptBox.isVisible().catch(() => false);

    const requiresSignIn =
      bodyText.toLowerCase().includes("sign in") &&
      bodyText.toLowerCase().includes("sign in to save activity");

    const title = await page.title();

    await browser.close();

    return res.json({
      success: true,
      geminiReachable: true,
      title,
      url: page.url(),
      promptBoxVisible,
      requiresSignIn,
      message: requiresSignIn
        ? "Gemini is reachable, but the cloud browser is not authenticated."
        : "Gemini cloud browser status checked.",
    });
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error("Gemini status error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// --------------------------------------------------
// Server
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Playwright service running on port ${PORT}`);
});
