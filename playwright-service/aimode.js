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

const AIMODE_URL = process.env.AIMODE_URL || "https://www.google.com/search?udm=50&hl=en";
// Tried one after another when the first page shows no prompt box (not used when AIMODE_URL is set, e.g. in tests).
const ALT_URLS = process.env.AIMODE_URL ? [] : ["https://www.google.com/search?udm=50&hl=en&gl=bd", "https://www.google.com/ai?hl=en"];
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
      .launch({ headless: process.env.AIMODE_HEADED !== "1", args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"] })
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
    page.__eiSnap = true;
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
      const text = (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 400);
      return { buttons, inputs, imgs, text };
    });
    console.log(`[aimode] debug(${label}) url=${page.url().slice(0, 120)} buttons=${JSON.stringify(info.buttons)} inputs=${JSON.stringify(info.inputs)} imgs=${JSON.stringify(info.imgs)} text=${JSON.stringify(info.text)} screenshot=${path.basename(file)}`);
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


// Waits (polling) for the prompt box instead of failing at once: Google's page can render slowly.
async function waitForPromptBox(page, ms) {
  const end = Date.now() + ms;
  for (;;) {
    try {
      return await findPromptBox(page);
    } catch (e) {
      if (Date.now() >= end) throw e;
      await page.waitForTimeout(700);
    }
  }
}

// Finds the "+" / attach button. 1) by label, 2) the left-most small button that lives in the same
// box as the prompt field (the "+" in Google's input box has no useful text).
async function findPlusButton(page) {
  const byLabel = page
    .locator(
      'button[aria-label*="add" i], button[aria-label*="upload" i], button[aria-label*="attach" i], button[aria-label*="image" i], button[aria-label*="file" i], button[title*="add" i], [role=button][aria-label*="upload" i], [role=button][aria-label*="add" i]',
    )
    .filter({ hasNot: page.locator('[aria-label*="mic" i], [aria-label*="voice" i], [aria-label*="send" i]') });
  const n = await byLabel.count();
  for (let i = 0; i < n; i++) {
    const b = byLabel.nth(i);
    if (await b.isVisible().catch(() => false)) return b;
  }
  const tagged = await page.evaluate(() => {
    document.querySelectorAll("[data-ei-plus]").forEach((e) => e.removeAttribute("data-ei-plus"));
    const box = [...document.querySelectorAll('textarea, [contenteditable="true"], [role=textbox], input[type=text], input:not([type])')].find(
      (e) => e.offsetWidth > 100 && e.offsetHeight > 10,
    );
    if (!box) return false;
    const bad = /mic|voice|send|submit|search|clear|close/i;
    let node = box.parentElement;
    for (let depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      const btns = [...node.querySelectorAll('button,[role=button]')].filter((b) => {
        const label = `${b.getAttribute("aria-label") || ""} ${b.getAttribute("title") || ""}`;
        const r = b.getBoundingClientRect();
        return r.width > 8 && r.width < 90 && r.height > 8 && !bad.test(label);
      });
      if (btns.length) {
        btns.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        btns[0].setAttribute("data-ei-plus", "1");
        return true;
      }
    }
    return false;
  });
  return tagged ? page.locator('[data-ei-plus="1"]').first() : null;
}

// How many picture-like things are on the page (used to notice that a thumbnail appeared).
const countThumbs = (page) => page.evaluate(() => document.querySelectorAll("img, canvas, [style*='blob:']").length);

async function waitMore(page, before, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if ((await countThumbs(page)) > before) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

// Pretends the user pasted / dropped the photo into the box (no language, no button needed).
async function injectFile(page, buffer, mime, name, mode) {
  await page.evaluate(
    async ({ b64, mime, name, mode }) => {
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const file = new File([arr], name, { type: mime });
      const dt = new DataTransfer();
      dt.items.add(file);
      const box =
        [...document.querySelectorAll('textarea, [contenteditable="true"], [role=textbox]')].find((e) => e.offsetWidth > 100) || document.body;
      if (mode === "paste") {
        box.focus();
        box.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      } else {
        let target = box;
        for (let n = box.parentElement, d = 0; n && d < 4; n = n.parentElement, d++) if (n.offsetWidth > 300) target = n;
        for (const type of ["dragenter", "dragover", "drop"]) {
          target.dispatchEvent(new DragEvent(type, { dataTransfer: dt, bubbles: true, cancelable: true }));
        }
      }
    },
    { b64: buffer.toString("base64"), mime, name, mode },
  );
}

async function smallJpeg(buffer, mime) {
  try {
    const sh = require("sharp");
    const out = await sh(buffer, { failOn: "none" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
    return { buffer: out, mime: "image/jpeg" };
  } catch {
    return { buffer, mime };
  }
}

// Menu path: click "+", then the first menu entry ("Add image" in any language).
async function attachViaMenu(page, filePath) {
  const plus = await findPlusButton(page);
  if (!plus) throw err("bad", "attach button not found");
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 6000 }).catch(() => null);
  await plus.click();
  let chooser = await chooserPromise;
  if (chooser) return chooser.setFiles(filePath);

  // A menu opened. Prefer English words, otherwise take the FIRST entry (Google lists "add image" first).
  const items = page.locator('[role=menuitem], [role=option], [role=menu] li, [role=listbox] li');
  let item = page.getByText(/^(add|upload) (an )?(image|photo)s?$|upload image/i).first();
  if (!(await item.isVisible().catch(() => false))) item = items.first();
  if (await item.isVisible().catch(() => false)) {
    const second = page.waitForEvent("filechooser", { timeout: 8000 }).catch(() => null);
    await item.click({ timeout: 5000 });
    chooser = await second;
  }
  if (!chooser) {
    // Last resort: click where the first menu entry usually is (just under and right of "+").
    const box = await plus.boundingBox();
    if (box) {
      const second = page.waitForEvent("filechooser", { timeout: 8000 }).catch(() => null);
      await page.mouse.click(box.x + 40, box.y + box.height + 28);
      chooser = await second;
    }
  }
  if (!chooser) throw err("bad", "upload menu did not open a file picker");
  await chooser.setFiles(filePath);
}

// Attaches one image: paste -> drop -> hidden file input -> "+" menu.
async function attachImage(page, filePath, image, index) {
  const before = await countThumbs(page);
  const small = await smallJpeg(image.buffer, image.mime);
  const name = `photo-${index + 1}.jpg`;

  for (const mode of ["paste", "drop"]) {
    await injectFile(page, small.buffer, small.mime, name, mode).catch(() => {});
    if (await waitMore(page, before, 4000)) {
      console.log(`[aimode] photo ${index + 1} attached by ${mode}`);
      return;
    }
  }
  const direct = page.locator('input[type="file"]');
  if ((await direct.count()) > 0) {
    await direct.last().setInputFiles(filePath);
    if (await waitMore(page, before, 4000)) return;
  }
  await attachViaMenu(page, filePath);
  console.log(`[aimode] photo ${index + 1} attached by menu`);
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
    if (m && m[2].length > 2000) {
      console.log("[aimode] result read via fetch");
      return { buffer: Buffer.from(m[2], "base64"), mime: m[1] };
    }
  }

  // 2) press the page's own download button under the picture (full quality, any language)
  try {
    const tagged = await page.evaluate((u) => {
      document.querySelectorAll("[data-ei-dl]").forEach((e) => e.removeAttribute("data-ei-dl"));
      const img = [...document.querySelectorAll("img")].find((i) => i.src === u);
      if (!img) return false;
      const isBtn = (e) => e.matches('button,[role=button],a[download],a[href]');
      let node = img.parentElement;
      for (let d = 0; node && d < 8; d++, node = node.parentElement) {
        const btns = [...node.querySelectorAll("button,[role=button],a")].filter((b) => {
          const r = b.getBoundingClientRect();
          return isBtn(b) && r.width > 8 && r.height > 8 && b.getBoundingClientRect().top >= img.getBoundingClientRect().bottom - 5;
        });
        if (btns.length) {
          const label = (b) => `${b.getAttribute("aria-label") || ""} ${b.getAttribute("title") || ""} ${b.innerText || ""}`;
          const dl = btns.find((b) => /download|ডাউনলোড|save|সংরক্ষণ/i.test(label(b))) || btns[btns.length - 1];
          dl.setAttribute("data-ei-dl", "1");
          return true;
        }
      }
      return false;
    }, src);
    if (tagged) {
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 15000 }),
        page.locator('[data-ei-dl="1"]').first().click({ timeout: 5000 }),
      ]);
      const file = await download.path();
      const buffer = await fs.readFile(file);
      if (buffer.length > 2000) {
        const name = (download.suggestedFilename() || "").toLowerCase();
        console.log("[aimode] result read via download button");
        return { buffer, mime: /png$/.test(name) ? "image/png" : /webp$/.test(name) ? "image/webp" : /jpe?g$/.test(name) ? "image/jpeg" : "image/png" };
      }
    }
  } catch (e) {
    console.log(`[aimode] download button path failed: ${String(e.message).split("\n")[0]}`);
  }

  // 3) last resort: screenshot of the image element (lower quality)
  const handle = await page.evaluateHandle((u) => [...document.querySelectorAll("img")].find((i) => i.src === u) || null, src);
  const el = handle.asElement();
  if (!el) throw err("transient", "generated image vanished from the page");
  console.log("[aimode] result read via screenshot (lower quality)");
  return { buffer: await el.screenshot({ type: "png" }), mime: "image/png" };
}

// Tiny fingerprint (16x16 greyscale) to tell whether two images are nearly identical.
async function ahash(buf) {
  const sh = require("sharp");
  const px = await sh(buf, { failOn: "none" }).rotate().resize(16, 16, { fit: "fill" }).greyscale().raw().toBuffer();
  return [...px]; // 256 brightness values (0-255)
}
async function looksSame(a, b) {
  try {
    const ha = await ahash(a);
    const hb = await ahash(b);
    const diff = bitsDiff(ha, hb);
    console.log(`[aimode] similarity check: avg brightness difference ${diff.toFixed(1)} (<${ECHO_BITS} = same as uploaded photo)`);
    return diff < ECHO_BITS;
  } catch {
    return false; // sharp missing / unreadable image: skip the check
  }
}

// A real echo of the uploaded photo differs by only ~0-3 brightness levels on average (0-255 scale);
// a generated photo (new background, etc.) differs a lot more.
const ECHO_BITS = 4;
const bitsDiff = (a, b) => a.reduce((n, v, i) => n + Math.abs(v - b[i]), 0) / a.length;

// True when this page image is just the user's own uploaded photo shown back in the chat.
async function isEcho(page, src, inputHashes, cache) {
  if (cache.has(src)) return cache.get(src);
  if (!inputHashes.length) return false;
  try {
    const data = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u, { credentials: "include" });
        if (!r.ok) return null;
        const b = await r.blob();
        return await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(b);
        });
      } catch {
        return null;
      }
    }, src);
    const m = data && /^data:([^;]+);base64,(.*)$/s.exec(data);
    if (!m) return false; // could not read it now; the final check after download still protects us
    const h = await ahash(Buffer.from(m[2], "base64"));
    const echo = inputHashes.some((ih) => bitsDiff(h, ih) < ECHO_BITS);
    cache.set(src, echo);
    return echo;
  } catch {
    return false;
  }
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

    // page is ready when the input box exists; if it never shows up, try other AI Mode addresses
    try {
      await waitForPromptBox(page, 10000);
    } catch {
      let ok = false;
      for (const alt of ALT_URLS) {
        console.log(`[aimode] no prompt box on the first page, trying ${alt}`);
        await page.goto(alt, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
        await page.waitForTimeout(2500);
        await dismissPopups(page);
        if (await waitForPromptBox(page, 8000).then(() => true).catch(() => false)) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        await snapshot(page, "no-prompt-box");
        // Rest this login for 15 minutes so the next jobs go straight to the next provider (Cloudflare).
        throw err("quota", "Google AI Mode shows no prompt box from this server", { retryAt: Date.now() + 15 * 60e3 });
      }
    }
    // 1) attach the photos, in the order given
    for (let i = 0; i < job.images.length; i++) {
      const ext = /png/i.test(job.images[i].mime) ? "png" : "jpg";
      const file = path.join(tmp, `photo-${i + 1}.${ext}`);
      await fs.writeFile(file, job.images[i].buffer);
      await attachImage(page, file, job.images[i], i);
      await page.waitForTimeout(1500 + i * 300);
    }

    const before = new Set((await collectImages(page)).map((x) => x.src));

    // 2) type the prompt and send
    const box = await findPromptBox(page);
    await box.click();
    await page.keyboard.insertText(job.prompt.slice(0, 4000));
    await page.waitForTimeout(500);
    await page.keyboard.press("Enter");

    // Google echoes the user's own photo(s) into the chat after sending. Instead of waiting a fixed
    // time, every new image is compared with the uploaded photos and skipped if it is just that photo.
    const inputHashes = [];
    for (const im of job.images) {
      try {
        inputHashes.push(await ahash(im.buffer));
      } catch {
        /* sharp missing: the check is skipped */
      }
    }
    const echoCache = new Map();

    // 3) wait for a NEW big image
    const deadline = Date.now() + WAIT_IMAGE_MS;
    let found = null;
    let stableSince = 0;
    let lastSrc = "";
    while (Date.now() < deadline) {
      await page.waitForTimeout(1000);
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
      const fresh = [];
      for (const x of (await collectImages(page)).filter((x) => !before.has(x.src))) {
        if (await isEcho(page, x.src, inputHashes, echoCache)) {
          before.add(x.src);
          console.log(`[aimode] skipped uploaded-photo echo ${x.w}x${x.h}`);
        } else fresh.push(x);
      }
      if (fresh.length && !found) console.log(`[aimode] new image seen: ${fresh.map((x) => `${x.w}x${x.h} ${x.src.slice(0, 40)}`).join(" | ")}`);
      if (fresh.length) {
        fresh.sort((a, b) => b.w * b.h - a.w * a.h);
        found = fresh[0];
        if (found.src === lastSrc) {
          if (!stableSince) stableSince = Date.now();
          if (Date.now() - stableSince >= 2500) break; // same image for 2.5s = finished
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

    // Safety: if the "result" looks like the uploaded photo itself, it is not the generated image
    let gotInputBack = false;
    for (const im of job.images) {
      if (await looksSame(out.buffer, im.buffer)) {
        gotInputBack = true;
        break;
      }
    }
    if (gotInputBack) {
      await snapshot(page, "got-input-back");
      throw err("transient", "got the uploaded photo back, not the generated image");
    }

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
    if (page && !page.__eiSnap) await snapshot(page, "error");
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
