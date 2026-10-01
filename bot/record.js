const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const CHROME_CDP_URL = "http://127.0.0.1:9222";

const OUTPUT_DIR = path.join(__dirname, "generated");

function ensureOutputDirectory() {
  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });
}

async function findGeminiPage(context) {
  const pages = context.pages();

  const geminiPages = pages.filter((page) =>
    page.url().includes("gemini.google.com"),
  );

  if (geminiPages.length > 0) {
    return geminiPages[geminiPages.length - 1];
  }

  const page = pages[0] || (await context.newPage());

  await page.goto("https://gemini.google.com/app", {
    waitUntil: "domcontentloaded",
  });

  return page;
}

async function runGeminiImageGeneration(imagePath, prompt) {
  if (!imagePath) {
    throw new Error("Image path is required.");
  }

  if (!prompt || !String(prompt).trim()) {
    throw new Error("Prompt is required.");
  }

  const absoluteImagePath = path.resolve(imagePath);

  if (!fs.existsSync(absoluteImagePath)) {
    throw new Error(`Image file not found: ${absoluteImagePath}`);
  }

  ensureOutputDirectory();

  let browser = null;

  try {
    console.log("Connecting to Chrome...");

    browser = await chromium.connectOverCDP(CHROME_CDP_URL);

    const contexts = browser.contexts();

    if (!contexts.length) {
      throw new Error("No Chrome browser context found.");
    }

    const context = contexts[0];

    const page = await findGeminiPage(context);

    console.log("Gemini page connected:");
    console.log(page.url());

    // --------------------------------------------------
    // 1. Always start from Gemini app
    // --------------------------------------------------

    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(2000);

    // --------------------------------------------------
    // 2. Find visible prompt editor
    // --------------------------------------------------

    const promptWrapper = page.locator('[data-test-id="textarea-wrapper"]');

    await promptWrapper.waitFor({
      state: "visible",
      timeout: 15000,
    });

    const promptParagraph = promptWrapper.getByRole("paragraph").first();

    await promptParagraph.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await promptParagraph.click();

    await page.keyboard.insertText(String(prompt).trim());

    console.log("Prompt entered.");

    // --------------------------------------------------
    // 3. Open Upload & tools
    // --------------------------------------------------

    const uploadToolsButton = page.getByRole("button", {
      name: "Upload & tools",
    });

    await uploadToolsButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await uploadToolsButton.click();

    console.log("Upload & tools opened.");

    // --------------------------------------------------
    // 4. Open local image uploader
    // --------------------------------------------------

    const uploaderButton = page.locator(
      '[data-test-id="local-images-files-uploader-button"]',
    );

    await uploaderButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await uploaderButton.click();

    console.log("Local file uploader opened.");

    // --------------------------------------------------
    // 5. Upload the exact image received from frontend
    // --------------------------------------------------

    const fileInput = page.locator('input[name="Filedata"]');

    await fileInput.waitFor({
      state: "attached",
      timeout: 15000,
    });

    await fileInput.setInputFiles(absoluteImagePath);

    console.log("Source image uploaded:");
    console.log(absoluteImagePath);

    // Give Gemini a moment to attach the image
    await page.waitForTimeout(1500);

    // --------------------------------------------------
    // 6. Send message
    // --------------------------------------------------

    const sendButton = page.getByRole("button", {
      name: "Send message",
    });

    await sendButton.waitFor({
      state: "visible",
      timeout: 15000,
    });

    await sendButton.click();

    console.log("Gemini request submitted.");

    // --------------------------------------------------
    // 7. Wait for generated image
    // --------------------------------------------------

    const downloadButton = page
      .getByRole("button", {
        name: "Download full size image",
      })
      .last();

    await downloadButton.waitFor({
      state: "visible",
      timeout: 180000,
    });

    console.log("Generated image is ready.");

    // --------------------------------------------------
    // 8. Download generated image
    // --------------------------------------------------

    const downloadPromise = page.waitForEvent("download", {
      timeout: 180000,
    });

    await downloadButton.click();

    const download = await downloadPromise;

    // --------------------------------------------------
    // 9. Save generated image
    // --------------------------------------------------

    const suggestedFilename =
      download.suggestedFilename() || "gemini-generated-image.png";

    let extension = path.extname(suggestedFilename);

    if (!extension) {
      extension = ".png";
    }

    const outputFilename = `gemini-${Date.now()}${extension}`;

    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    await download.saveAs(outputPath);

    console.log("Generated image saved successfully.");

    console.log(`OUTPUT_IMAGE=${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error("Gemini automation failed:");

    console.error(error);

    throw error;
  }

  // We deliberately do not call browser.close()
  // because this bot is attached to the user's
  // already-running Chrome through CDP.
}

module.exports = {
  runGeminiImageGeneration,
};

if (require.main === module) {
  const imagePath = process.argv[2];

  const prompt = process.argv.slice(3).join(" ");

  if (!imagePath || !prompt) {
    console.error('\nUsage:\nnode bot/record.js "IMAGE_PATH" "PROMPT"\n');

    process.exit(1);
  }

  runGeminiImageGeneration(imagePath, prompt)
    .then((outputPath) => {
      console.log("\nGemini generation completed successfully.");

      console.log(`OUTPUT_IMAGE=${outputPath}`);

      process.exit(0);
    })
    .catch((error) => {
      console.error("\nGemini generation failed:");

      console.error(error instanceof Error ? error.message : error);

      process.exit(1);
    });
}
