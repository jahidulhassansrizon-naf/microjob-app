"use strict";
/**
 * Google AI Mode provider (google.com/search?udm=50) driven by Playwright with a saved Google login
 * (storageState file, same gemini-session-N.json files the old bot used).
 *
 * IMPORTANT: this clicks through Google's own web page, so it can break whenever Google changes
 * the page, and the login can still be signed out by Google. That is why server.js keeps
 * Cloudflare as an automatic fallback. When something fails, a screenshot + a list of the buttons
 * on the page is written to ./debug and printed in the log, so the selectors can be fixed fast.
 */

const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");
const path = require("path");

let chromium = null;
try {
  ({ chromium } = require("playwright"));
} catch {
  /* reported when first used */
}

const AIMODE_URL = process.env.AIMODE_URL || "https://www.google.com/search?udm=50";
const PER_SESSION = Number(process.env.AIMODE_PER_SESSION) || 2;
const WAIT_IMAGE_MS = Number(process.env.AIMODE_WAIT_MS) || 150000;
const FRESH_DIR = process.env.FRESH_SESSION_DIR || path.join(__dirname, "fresh-sessions");
const DEBUG_DIR = path.join(__dirname, "debug");
const LOCALE = process.env.BROWSER_LOCALE || "en-US";
const TIMEZONE = process.env.BROWSER_TIMEZONE || "Asia/Dhaka";

function err(kind, message, extra = {}) {
  const e = new Error(message);
  e.kind = kind;
  Object.assign(e, extra);
  return e;
}

// ---------------------------------------------------------------- shared browser + per-session limits
let browserPromise = null;
function getBrowser() {
  if (!chromium) throw err("bad", 'The "playwright" package is not installed (npm install).');
  if (!browserPromise) {
    browserPromise = chromium
      .launch({ headless: true, args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"] })
      .catch((e) => {
        browserPromise = null;
        throw e;
      });
  }
  return browserPromise;
}

const gates = new Map(); // sessionFile -> { running, queue[] }
async function enter(key) {
  let g = gates.get(key);
  if (!g) gates.set(key, (g = { running: 0, queue: [] }));
  if (g.running < PER_SESSION) {
    g.running++;
    return;
  }
  await new Promise((resolve) => g.queue.push(resolve));
}
function leave(key) {
  const g = gates.get(key);
  const next = g.queue.shift();
  if (next) next();
  else g.running--;
}

// ---------------------------------------------------------------- page helpers
async function snapshot(page, label) {
  try {
    await fs.mkdir(DEBUG_DIR, { recursive: true });
    const file = path.join(DEBUG_DIR, `${Date.now()}-${label}.png`);
    await page.screenshot({ path: file, fullPage: false }).catch(() => {});
    const info = await page.evaluate(() => {
      const vis = (el) => !!(el.offsetWidth || el.offsetHeight);
      const buttons = [...document.querySelectorAll("button,[role=button],a")]
        .filter(vis)
        .map((b) => (b.getAttribute("aria-label") || b.innerText || "").trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 40);
      const inputs = [...document.querySelectorAll("input,textarea,[contenteditable],[role=textbox]")].map(
        (i) => `${i.tagName.toLowerCase()}${i.type ? `[${i.type}]` : ""}${vis(i) ? "" : "(hidden)"}`,
      );
      const imgs = [...document.querySelectorAll("img")]
        .filter((i) => i.naturalWidth >= 200)
        .map((i) => `${i.naturalWidth}x${i.naturalHeight} ${i.src.slice(0, 60)}`)
        .slice(0, 10);
      return { buttons, inputs, imgs };
    });
    console.log(`[aimode] debug(${label}) url=${page.url().slice(0, 120)} buttons=${JSON.stringify(info.buttons)} inputs=${JSON.stringify(info.inputs)} imgs=${JSON.stringify(info.imgs)} screenshot=${path.basename(file)}`);
  } catch (e) {
    console.log(`[aimode] debug(${label}) failed: ${e.message}`);
  }
}

async function isLoggedOut(page) {
  const url = page.url();
  if (/accounts\.google\.com/.test(url)) return true;
  return (await page.locator('a[href*="accounts.google.com/ServiceLogin"], a[href*="accounts.google.com/v3/signin"]').count()) > 0;
}

async function dismissPopups(page) {
  for (const name of [/^(accept all|i agree|agree|got it|no thanks|not now|dismiss|ok)$/i, /^reject all$/i]) {
    const b = page.getByRole("button", { name }).first();
    if (await b.isVisible().catch(() => false)) await b.click({ timeout: 2000 }).catch(() => {});
  }
}

async function findPromptBox(page) {
  const candidates = [
    page.getByRole("textbox").last(),
    page.locator("textarea:visible").last(),
    page.locator('[contenteditable="true"]:visible').last(),
  ];
  for (const c of candidates) {
    if (await c.isVisible().catch(() => false)) return c;
  }
  throw err("bad", "prompt box not found");
}

// Attaches one image. Tries a hidden <input type=file> first, then the "+" / attach menu.
async function attachImage(page, filePath) {
  const direct = page.locator('input[type="file"]');
  if ((await direct.count()) > 0) {
    await direct.last().setInputFiles(filePath);
    return;
  }
  const plus = page
    .locator('button[aria-label*="add" i], button[aria-label*="upload" i], button[aria-label*="attach" i], button[aria-label*="image" i], [role=button][aria-label*="upload" i]')
    .first();
  if (!(await plus.isVisible().catch(() => false))) throw err("bad", "attach button not found");

  const chooserPromise = page.waitForEvent("filechooser", { timeout: 8000 }).catch(() => null);
  await plus.click();
  let chooser = await chooserPromise;
  if (!chooser) {
    // A menu opened: pick an item that looks like "Upload ...".
    const item = page
      .getByRole("menuitem", { name: /upload|photo|image|file|device|computer/i })
      .or(page.getByText(/upload (an )?(image|file|photo)|from (device|computer)/i))
      .first();
    const second = page.waitForEvent("filechooser", { timeout: 8000 });
    await item.click({ timeout: 5000 });
    chooser = await second;
  }
  await chooser.setFiles(filePath);
}

async function collectImages(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((i) => i.complete && i.naturalWidth >= 400 && i.naturalHeight >= 400)
      .map((i) => ({ src: i.src, w: i.naturalWidth, h: i.naturalHeight })),
  );
}

async function readImage(page, src) {
  // 1) download inside the page (keeps full quality, uses the login)
  const viaFetch = await page
    .evaluate(async (u) => {
      try {
        const r = await fetch(u, { credentials: "include" });
        if (!r.ok) return null;
        const b = await r.blob();
        const data = await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(b);
        });
        return data;
      } catch {
        return null;
      }
    }, src)
    .catch(() => null);
  if (viaFetch) {
    const m = /^data:([^;]+);base64,(.*)$/s.exec(viaFetch);
    if (m && m[2].length > 2000) return { buffer: Buffer.from(m[2], "base64"), mime: m[1] };
  }
  // 2) fall back to a screenshot of the image element
  const handle = await page.evaluateHandle((u) => [...document.querySelectorAll("img")].find((i) => i.src === u) || null, src);
  const el = handle.asElement();
  if (!el) throw err("transient", "generated image vanished from the page");
  return { buffer: await el.screenshot({ type: "png" }), mime: "image/png" };
}

// ---------------------------------------------------------------- main entry used by server.js
async function aiModeGenerate(sessionFile, job) {
  await enter(sessionFile);
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "aimode-"));
  let context = null;
  let page = null;
  try {
    const browser = await getBrowser();
    context = await browser.newContext({
      storageState: sessionFile,
      locale: LOCALE,
      timezoneId: TIMEZONE,
      viewport: { width: 1280, height: 900 },
    });
    page = await context.newPage();
    page.setDefaultTimeout(20000);

    await page.goto(AIMODE_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    await dismissPopups(page);

    if (await isLoggedOut(page)) {
      await snapshot(page, "logged-out");
      throw err("auth", `Google login expired for ${path.basename(sessionFile)}`);
    }
    if (/\/sorry\//.test(page.url()) || (await page.getByText(/unusual traffic|not a robot/i).count()) > 0) {
      await snapshot(page, "captcha");
      throw err("quota", "Google asked for a robot check (captcha)", { retryAt: Date.now() + 30 * 60e3 });
    }

    // 1) attach the photos, in the order given
    for (let i = 0; i < job.images.length; i++) {
      const ext = /png/i.test(job.images[i].mime) ? "png" : "jpg";
      const file = path.join(tmp, `photo-${i + 1}.${ext}`);
      await fs.writeFile(file, job.images[i].buffer);
      await attachImage(page, file);
      await page.waitForTimeout(2500 + i * 500);
    }

    const before = new Set((await collectImages(page)).map((x) => x.src));

    // 2) type the prompt and send
    const box = await findPromptBox(page);
    await box.click();
    await page.keyboard.insertText(job.prompt.slice(0, 4000));
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");

    // 3) wait for a NEW big image
    const deadline = Date.now() + WAIT_IMAGE_MS;
    let found = null;
    let stableSince = 0;
    let lastSrc = "";
    while (Date.now() < deadline) {
      await page.waitForTimeout(2000);
      const text = (await page.locator("body").innerText().catch(() => "")).slice(-1500);
      if (/(can['’]t|cannot|unable to|not able to) (generate|create|edit)|against (my|our) (policy|guidelines)/i.test(text) && !found) {
        // Give it a moment: this text can also be part of a normal answer that still shows an image.
        const imgsNow = (await collectImages(page)).filter((x) => !before.has(x.src));
        if (!imgsNow.length) {
          await snapshot(page, "refused");
          throw err("refused", "Google declined to make this image");
        }
      }
      if (/(reached|hit) (your|the) (daily )?(limit|quota)|limit (resets|reached)/i.test(text)) {
        await snapshot(page, "limit");
        throw err("quota", "Google image limit reached", { retryAt: Date.now() + 3 * 3600e3 });
      }
      const fresh = (await collectImages(page)).filter((x) => !before.has(x.src));
      if (fresh.length) {
        fresh.sort((a, b) => b.w * b.h - a.w * a.h);
        found = fresh[0];
        if (found.src === lastSrc) {
          if (!stableSince) stableSince = Date.now();
          if (Date.now() - stableSince >= 3000) break; // same image for 3s = finished
        } else {
          lastSrc = found.src;
          stableSince = 0;
        }
      }
    }
    if (!found) {
      await snapshot(page, "timeout");
      throw err("transient", "timed out waiting for the generated image");
    }

    const out = await readImage(page, found.src);

    // renew cookies (rate-limited) so the session lives longer
    try {
      const target = path.join(FRESH_DIR, path.basename(sessionFile));
      const stat = fsSync.existsSync(target) ? fsSync.statSync(target) : null;
      if (!stat || Date.now() - stat.mtimeMs > 10 * 60e3) {
        await fs.mkdir(FRESH_DIR, { recursive: true });
        await fs.writeFile(target, JSON.stringify(await context.storageState()));
      }
    } catch {
      /* not important */
    }
    return out;
  } catch (e) {
    if (page && !e.kind) await snapshot(page, "error");
    if (!e.kind) {
      const m = String(e.message || e);
      e = err(/Timeout|waiting for/i.test(m) ? "transient" : "bad", `AI Mode page problem: ${m.split("\n")[0]}`);
    }
    throw e;
  } finally {
    if (context) await context.close().catch(() => {});
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
    leave(sessionFile);
  }
}

module.exports = { aiModeGenerate };
