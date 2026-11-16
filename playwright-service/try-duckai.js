"use strict";
// Local test ONLY. Does not touch server.js.
//
// Put these next to this script:
//   test-photo.jpg   the photo to edit (or give another name/path as the first argument)
//   prompt.txt       the instruction text (the script TYPES it into the message box)
// Run:  node try-duckai.js
// Optional:  node try-duckai.js my-photo.png my-prompt.txt
//
// It opens a visible browser window, opens duck.ai, attaches ONLY the photo, types the prompt
// text into the message box (Duck.ai does not accept .txt attachments), sends it, waits for the
// new image and saves the ORIGINAL full-size image as duckai-result.(png|jpg|webp).
// If it gets stuck it prints what it can see and saves a screenshot.
// It does NOT try to get around any check page: if Duck.ai shows one, the test stops there.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const PHOTO = path.resolve(process.argv[2] || "test-photo.jpg");
const PROMPT = path.resolve(process.argv[3] || "prompt.txt");
const OUT = path.resolve("duckai-result.png");
const PROMPT_TEXT = fs.existsSync(PROMPT) ? fs.readFileSync(PROMPT, "utf8").trim() : "";
const WAIT_IMAGE_MS = 150_000;
const HEADLESS = process.env.HEADLESS === "1";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function launch() {
  const args = ["--disable-blink-features=AutomationControlled"];
  try {
    return await chromium.launch({ channel: "chrome", headless: HEADLESS, args });
  } catch {
    console.log("Google Chrome not found, using Playwright Chromium.");
    return await chromium.launch({ headless: HEADLESS, args });
  }
}

async function debugDump(page, label) {
  try {
    const shot = path.resolve(`duckai-${label}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    const info = await page.evaluate(() => ({
      url: location.href,
      buttons: [...document.querySelectorAll("button,[role=button]")]
        .map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 40),
      inputs: [...document.querySelectorAll("textarea,input,[contenteditable=true]")]
        .map((i) => `${i.tagName}[type=${i.type || ""}][placeholder=${i.placeholder || ""}]`)
        .slice(0, 20),
      text: document.body.innerText.replace(/\s+/g, " ").slice(0, 600),
    }));
    console.log(`[debug:${label}]`, JSON.stringify(info, null, 2));
    console.log(`[debug:${label}] screenshot: ${shot}`);
  } catch (e) {
    console.log("debug dump failed:", e.message);
  }
}

// Click a few common first-visit buttons if they appear (consent / welcome). Never anything else.
async function dismissWelcome(page) {
  const names = [/^got it$/i, /^agree and continue$/i, /^accept/i, /^continue$/i, /^ok$/i];
  for (const name of names) {
    const btn = page.getByRole("button", { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      console.log("Clicking welcome button:", name);
      await btn.click().catch(() => {});
      await sleep(800);
    }
  }
}

// Pixel size of the photo we upload, so we never mistake our own photo (thumbnail or chat bubble)
// for the generated result.
async function uploadedSize(page) {
  const ext = path.extname(PHOTO).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const b64 = fs.readFileSync(PHOTO).toString("base64");
  return page.evaluate(
    async ({ m, d }) => {
      const img = new Image();
      img.src = `data:${m};base64,${d}`;
      await img.decode();
      return { w: img.naturalWidth, h: img.naturalHeight };
    },
    { m: mime, d: b64 },
  );
}

async function countResultImages(page, up) {
  return page.evaluate(
    ({ uw, uh }) =>
      [...document.querySelectorAll("img")].filter(
        (i) =>
          i.naturalWidth >= 400 &&
          i.naturalHeight >= 400 &&
          !(i.naturalWidth === uw && i.naturalHeight === uh),
      ).length,
    { uw: up.w, uh: up.h },
  );
}

(async () => {
  if (!PROMPT_TEXT) {
    console.error("Prompt file is missing or empty:", PROMPT);
    process.exit(1);
  }
  if (!fs.existsSync(PHOTO)) {
    console.error("File not found:", PHOTO);
    process.exit(1);
  }

  const browser = await launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("Opening duck.ai ...");
    await page.goto("https://duck.ai/", { waitUntil: "domcontentloaded", timeout: 60_000 });
    await sleep(3000);
    await dismissWelcome(page);

    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) === 0) {
      console.log("No file input found yet. Trying to wait a little more ...");
      await sleep(4000);
    }
    if ((await fileInput.count()) === 0) {
      console.log("STOP: could not find the upload control.");
      await debugDump(page, "no-upload");
      process.exitCode = 2;
      return;
    }

    const up = await uploadedSize(page);
    console.log(`Uploaded photo size: ${up.w}x${up.h}`);
    console.log("Attaching the photo ...");
    await fileInput.setInputFiles(PHOTO);
    await sleep(2500);

    console.log(`Typing the prompt (${PROMPT_TEXT.length} characters) ...`);
    const box = page.locator("textarea, [contenteditable=true]").first();
    await box.click();
    await box.fill(PROMPT_TEXT);
    await sleep(800);

    const before = await countResultImages(page, up);

    // Send: the button is called "Ask"; fall back to a submit/send button, then Enter.
    const askBtn = page
      .getByRole("button", { name: /^ask$/i })
      .or(page.locator('button[type="submit"], button[aria-label*="send" i]'))
      .first();
    if (await askBtn.isVisible().catch(() => false)) {
      console.log("Clicking Ask ...");
      await askBtn.click();
    } else {
      console.log("Ask button not found, pressing Enter ...");
      await box.click().catch(() => {});
      await page.keyboard.press("Enter");
    }

    console.log(`Waiting up to ${WAIT_IMAGE_MS / 1000}s for the new image ...`);
    const started = Date.now();
    let got = false;
    while (Date.now() - started < WAIT_IMAGE_MS) {
      await sleep(2000);
      if ((await countResultImages(page, up)) > before) {
        got = true;
        break;
      }
      const text = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (/daily limit|reached.*limit|try again tomorrow|limit.*reached/.test(text)) {
        console.log("STOP: Duck.ai says the usage limit is reached.");
        await debugDump(page, "limit");
        process.exitCode = 3;
        return;
      }
    }

    if (!got) {
      console.log("STOP: no new image appeared in time.");
      await debugDump(page, "no-image");
      process.exitCode = 4;
      return;
    }

    await sleep(2500); // let the image finish loading
    const imgs = page.locator("img");
    const total = await imgs.count();
    let best = null;
    let bestArea = 0;
    for (let i = 0; i < total; i += 1) {
      const el = imgs.nth(i);
      const dim = await el.evaluate((n) => ({ w: n.naturalWidth, h: n.naturalHeight })).catch(() => null);
      if (
        dim &&
        dim.w >= 400 &&
        dim.h >= 400 &&
        !(dim.w === up.w && dim.h === up.h) &&
        dim.w * dim.h >= bestArea
      ) {
        best = el;
        bestArea = dim.w * dim.h;
      }
    }
    if (!best) {
      console.log("Image counted but not found again.");
      await debugDump(page, "lost-image");
      process.exitCode = 5;
      return;
    }

    // 1) Best: read the ORIGINAL image behind the picture (full resolution, no quality loss).
    const orig = await best
      .evaluate(async (img) => {
        try {
          const res = await fetch(img.currentSrc || img.src);
          const blob = await res.blob();
          const data = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(",")[1]);
            r.onerror = reject;
            r.readAsDataURL(blob);
          });
          return { data, type: blob.type, w: img.naturalWidth, h: img.naturalHeight };
        } catch (e) {
          return { error: String(e && e.message ? e.message : e) };
        }
      })
      .catch((e) => ({ error: e.message }));

    let saved = false;
    if (orig && orig.data) {
      const ext = /png/.test(orig.type)
        ? ".png"
        : /webp/.test(orig.type)
          ? ".webp"
          : /jpe?g/.test(orig.type)
            ? ".jpg"
            : ".png";
      const file = OUT.replace(/\.png$/, ext);
      fs.writeFileSync(file, Buffer.from(orig.data, "base64"));
      console.log(
        `Saved ORIGINAL image: ${file}  (${orig.w}x${orig.h}, ${Math.round(fs.statSync(file).size / 1024)} KB)`,
      );
      saved = true;
    } else {
      console.log("Could not read the original image:", orig && orig.error);
    }

    // 2) Fallback: click the page's own download button.
    if (!saved) {
      try {
        const dl = page.getByRole("button", { name: /download/i }).last();
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 15_000 }),
          dl.click(),
        ]);
        const file = path.resolve(`duckai-download-${download.suggestedFilename() || "result.png"}`);
        await download.saveAs(file);
        console.log("Saved via the download button:", file);
        saved = true;
      } catch (e) {
        console.log("Download button did not work:", e.message);
      }
    }

    // 3) Last resort: screenshot of what is on screen (low quality, only for checking).
    if (!saved) {
      await best.screenshot({ path: OUT });
      console.log("Saved a SCREENSHOT only (low quality):", OUT);
    }
    console.log(`DONE in ${Math.round((Date.now() - started) / 1000)}s.`);
  } catch (e) {
    console.error("FAILED:", e.message);
    await debugDump(page, "error");
    process.exitCode = 1;
  } finally {
    await sleep(1500);
    await browser.close();
  }
})();
