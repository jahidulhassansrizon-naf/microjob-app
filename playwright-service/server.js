"use strict";
/**
 * EI neo bot v2 - NO Google login, NO Playwright, NO cookies.
 *
 * Same routes as before, so the website does not change:
 *   POST /edit-image        (image, prompt)
 *   POST /template-edit     (image, templateImage, [image2], prompt)
 *   POST /edit-image-dual   (image, image2, prompt)
 *   GET  /health            POST /warm-hint    GET /admin-report    POST /notify
 *
 * Instead of driving the Gemini website, it calls an image API:
 *   1) Cloudflare Workers AI  (FLUX.2 klein)  - has a free daily allowance
 *   2) Gemini API "nano banana"               - only if your key can use it
 * Providers are tried in the order of IMAGE_PROVIDERS. When one is out of quota
 * (HTTP 429) it rests until its reset time and the next one is used.
 *
 * Needs Node 18+ (Node 22 on GitHub Actions is fine) and the "sharp" package.
 */

const http = require("http");
const crypto = require("crypto");

let sharp = null;
try {
  sharp = require("sharp");
} catch {
  /* reported later, only when an image really needs resizing */
}

// ------------------------------------------------------------------ config
const PORT = Number(process.env.BOT_PORT) || 4000;
const HOST = "127.0.0.1";
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_GENERATIONS) || 6;
const MAX_QUEUE = Number(process.env.MAX_QUEUE_LENGTH) || 100;
const REQUEST_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 120000;
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;
const STARTED_AT = Date.now();

const GEMINI_BASE = (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const CF_BASE = (process.env.CF_BASE_URL || "https://api.cloudflare.com").replace(/\/+$/, "");
const CF_MODEL = process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-4b";
// Added to every prompt sent to Cloudflare: pushes the small model away from the "cartoon" look.
// Set CF_PROMPT_SUFFIX to your own text, or to "off" to send the prompt untouched.
const CF_SUFFIX_RAW = process.env.CF_PROMPT_SUFFIX;
const CF_PROMPT_SUFFIX =
  CF_SUFFIX_RAW === undefined || CF_SUFFIX_RAW === ""
    ? "Photorealistic photograph, shot on a DSLR camera, natural skin texture with visible pores, realistic lighting, sharp focus. Keep the exact same real face, identity, skin tone and hairstyle as the reference photo. Not a cartoon, not an illustration, not 3D render, no airbrushed or plastic skin."
    : CF_SUFFIX_RAW.toLowerCase() === "off"
      ? ""
      : CF_SUFFIX_RAW;

// Reads KEY, KEY_2, KEY_3 ... KEY_10 (several keys = more free quota)
function readNumbered(name) {
  const out = [];
  for (const n of ["", ...Array.from({ length: 9 }, (_, i) => `_${i + 2}`)]) {
    const v = (process.env[name + n] || "").trim();
    if (v) out.push(v);
  }
  return out;
}

// ------------------------------------------------------------------ small helpers
class HttpError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.statusCode = statusCode;
    Object.assign(this, extra);
  }
}

const eventLog = [];
function logEvent(type, message, extra = {}) {
  const entry = { at: new Date().toISOString(), type, message: String(message).slice(0, 300), ...extra };
  eventLog.push(entry);
  while (eventLog.length > 150) eventLog.shift();
  console.log(`[${type}] ${entry.message}`);
}

function nextUtcMidnight() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 1, 0);
}

function sendJson(res, status, body, headers = {}) {
  if (res.writableEnded || res.destroyed) return;
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    ...headers,
  });
  res.end(data);
}

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ image helpers (sharp)
function needSharp() {
  if (!sharp) throw new Error('The "sharp" package is not installed. Run: npm install');
  return sharp;
}

// Shrinks a photo so its longest side is <= maxSide. Returns { buffer, mime, width, height }.
async function shrink(buffer, maxSide, mime = "image/jpeg") {
  const s = needSharp();
  let img = s(buffer, { failOn: "none" }).rotate();
  img = img.resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true });
  const { data, info } = await (mime === "image/png" ? img.png() : img.jpeg({ quality: 92 })).toBuffer({
    resolveWithObject: true,
  });
  return { buffer: data, mime, width: info.width, height: info.height };
}

// ------------------------------------------------------------------ providers
/**
 * job = {
 *   kind: "edit" | "template" | "dual",
 *   prompt: string,
 *   images: [{ buffer, mime }],   // in the order the website expects (template first for "template")
 * }
 * A provider returns { buffer, mime } or throws an error with
 *   .kind = "quota" | "auth" | "refused" | "transient" | "bad"
 *   .retryAt = epoch ms (for quota)
 */
function providerError(kind, message, extra = {}) {
  const e = new Error(message);
  e.kind = kind;
  Object.assign(e, extra);
  return e;
}

function classifyHttp(status, text, retryAfterHeader) {
  const snippet = String(text || "").replace(/\s+/g, " ").slice(0, 220);
  if (status === 429) {
    const secs = Number(retryAfterHeader);
    const retryAt = secs > 0 ? Date.now() + secs * 1000 : 0;
    return providerError("quota", `rate/quota limit (HTTP 429): ${snippet}`, { retryAt });
  }
  if (status === 401 || status === 403) return providerError("auth", `key rejected (HTTP ${status}): ${snippet}`);
  if (status === 402) return providerError("quota", `payment required (HTTP 402): ${snippet}`);
  if (status >= 500) return providerError("transient", `server error (HTTP ${status}): ${snippet}`);
  return providerError("bad", `request rejected (HTTP ${status}): ${snippet}`);
}

// ---- Cloudflare Workers AI (FLUX.2 klein): inputs must be < 512x512, up to 4 of them.
async function cloudflareGenerate(cred, job) {
  const [accountId, token] = cred.secret.split("|");
  const inputs = [];
  for (const img of job.images.slice(0, 4)) inputs.push(await shrink(img.buffer, 500, "image/jpeg"));

  // Output size follows the first image (template or photo), longest side 1024, multiples of 16.
  const first = job.kind === "dual" ? { width: 4, height: 3 } : inputs[0];
  const scale = 1024 / Math.max(first.width, first.height);
  const round16 = (n) => Math.min(1024, Math.max(256, Math.round((n * scale) / 16) * 16));
  const width = round16(first.width);
  const height = round16(first.height);

  const form = new FormData();
  let prompt = job.prompt;
  if (inputs.length > 1) {
    const names =
      job.kind === "template"
        ? ["the template", "person 1", "person 2"]
        : ["person 1 (left)", "person 2 (right)"];
    const hint = inputs.map((_, i) => `image ${i} = ${names[i] || "extra photo"}`).join(", ");
    prompt = `${prompt}\n\nReference images: ${hint}.`;
  }
  if (CF_PROMPT_SUFFIX) prompt = `${prompt}\n\n${CF_PROMPT_SUFFIX}`;
  form.append("prompt", prompt.slice(0, 2400));
  form.append("width", String(width));
  form.append("height", String(height));
  inputs.forEach((img, i) => {
    form.append(`input_image_${i}`, new Blob([img.buffer], { type: img.mime }), `input_${i}.jpg`);
  });

  const url = `${CF_BASE}/client/v4/accounts/${accountId}/ai/run/${CF_MODEL}`;
  const res = await fetchWithTimeout(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });

  if (!res.ok) {
    const err = classifyHttp(res.status, await res.text().catch(() => ""), res.headers.get("retry-after"));
    // Cloudflare's free allowance resets at 00:00 UTC.
    if (err.kind === "quota" && !err.retryAt) err.retryAt = nextUtcMidnight();
    // Cloudflare also reports "out of neurons" as a 4xx with an error code/message.
    throw err;
  }

  const ctype = res.headers.get("content-type") || "";
  if (ctype.startsWith("image/")) {
    return { buffer: Buffer.from(await res.arrayBuffer()), mime: ctype.split(";")[0] };
  }
  const json = await res.json().catch(() => null);
  let b64 = json && json.result && (json.result.image || json.result.b64_json || json.result.output);
  if (json && json.success === false) {
    const msg = JSON.stringify(json.errors || json).slice(0, 220);
    if (/neuron|quota|limit|capacity/i.test(msg)) throw providerError("quota", `Cloudflare: ${msg}`, { retryAt: nextUtcMidnight() });
    throw providerError("bad", `Cloudflare: ${msg}`);
  }
  if (typeof b64 !== "string" || !b64) throw providerError("refused", "Cloudflare returned no image");
  let mime = "image/png";
  const m = /^data:([^;]+);base64,/.exec(b64);
  if (m) {
    mime = m[1];
    b64 = b64.slice(m[0].length);
  } else if (b64.startsWith("/9j/")) mime = "image/jpeg";
  return { buffer: Buffer.from(b64, "base64"), mime };
}

// ---- Gemini API (nano banana). Works only if the key's project is allowed to make images.
async function geminiGenerate(cred, job) {
  const parts = [{ text: job.prompt }];
  for (const img of job.images) {
    const small = await shrink(img.buffer, 1536, "image/jpeg");
    parts.push({ inline_data: { mime_type: small.mime, data: small.buffer.toString("base64") } });
  }
  const url = `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": cred.secret },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    const err = classifyHttp(res.status, raw, res.headers.get("retry-after"));
    if (err.kind === "quota") {
      // "limit: 0" = this key can never make images (free tier). Rest it for a long time.
      err.retryAt = /limit:\s*0/i.test(raw) ? Date.now() + 6 * 3600e3 : err.retryAt || Date.now() + 10 * 60e3;
    }
    throw err;
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw providerError("transient", "Gemini sent an unreadable answer");
  }
  const cand = json.candidates && json.candidates[0];
  const partsOut = (cand && cand.content && cand.content.parts) || [];
  for (const p of partsOut) {
    const d = p.inlineData || p.inline_data;
    if (d && d.data) return { buffer: Buffer.from(d.data, "base64"), mime: d.mimeType || d.mime_type || "image/png" };
  }
  const why = (cand && cand.finishReason) || (json.promptFeedback && json.promptFeedback.blockReason) || "no image in answer";
  throw providerError("refused", `Gemini made no image (${why})`);
}

// Provider table. Each credential is one "slot" in the admin panel.
const PROVIDERS = [];
function buildProviders() {
  const order = (process.env.IMAGE_PROVIDERS || "cloudflare,gemini")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const cfIds = readNumbered("CF_ACCOUNT_ID");
  const cfTokens = readNumbered("CF_API_TOKEN");
  const cfCreds = cfIds.map((id, i) => (cfTokens[i] ? `${id}|${cfTokens[i]}` : null)).filter(Boolean);
  const gmCreds = readNumbered("GEMINI_API_KEY");

  const defs = {
    cloudflare: { label: "Cloudflare FLUX.2", creds: cfCreds, run: cloudflareGenerate },
    gemini: { label: "Gemini API", creds: gmCreds, run: geminiGenerate },
  };
  let slot = 0;
  for (const name of order) {
    const def = defs[name];
    if (!def) continue;
    def.creds.forEach((secret, i) => {
      slot += 1;
      PROVIDERS.push({
        slot,
        name,
        label: `${def.label} #${i + 1}`,
        secret,
        run: def.run,
        active: 0,
        ok: 0,
        failed: 0,
        streak: 0,
        lastError: "",
        restUntil: 0,
        restReason: "",
        dead: false, // key rejected: needs a human
      });
    });
  }
}

const isResting = (p) => p.restUntil > Date.now();
const isUsable = (p) => !p.dead && !isResting(p);

function rest(p, untilMs, reason) {
  p.restUntil = untilMs;
  p.restReason = reason;
}

async function runWithProviders(job) {
  if (!PROVIDERS.length) {
    throw new HttpError(503, "Image generation is not set up yet.", { code: "NOT_CONFIGURED" });
  }
  const tried = new Set();
  let sawQuota = false;
  let sawRefusal = false;
  let nextRetry = 0;

  // Least busy first, but keep the configured provider order as the main rule.
  for (;;) {
    const candidates = PROVIDERS.filter((p) => isUsable(p) && !tried.has(p.slot));
    if (!candidates.length) break;
    const firstName = candidates[0].name;
    const p = candidates.filter((c) => c.name === firstName).sort((a, b) => a.active - b.active)[0];
    tried.add(p.slot);

    // One quick retry for network hiccups / 5xx on the same key.
    for (let attempt = 1; attempt <= 2; attempt++) {
      p.active++;
      const t0 = Date.now();
      try {
        const out = await p.run({ secret: p.secret }, job);
        p.ok++;
        p.streak = 0;
        logEvent("ok", `${p.label} made an image in ${Math.round((Date.now() - t0) / 1000)}s`, { slot: p.slot });
        return { ...out, provider: p.name };
      } catch (err) {
        const kind = err.kind || (err.name === "AbortError" ? "transient" : "bad");
        const msg = err.name === "AbortError" ? "timed out" : err.message;
        p.failed++;
        p.streak++;
        p.lastError = String(msg).slice(0, 240);
        logEvent("fail", `${p.label} (${kind}): ${msg}`, { slot: p.slot });
        if (kind === "quota") {
          sawQuota = true;
          const until = err.retryAt || Date.now() + 15 * 60e3;
          rest(p, until, "quota/limit reached");
          nextRetry = nextRetry ? Math.min(nextRetry, until) : until;
          break;
        }
        if (kind === "auth") {
          rest(p, Date.now() + 3600e3, "key rejected"); // tried again after 1 hour
          break;
        }
        if (kind === "refused") {
          sawRefusal = true;
          break;
        }
        if (kind === "transient" && attempt === 1) continue;
        break;
      } finally {
        p.active--;
      }
    }
  }

  if (sawQuota) {
    const secs = Math.max(30, Math.round(((nextRetry || Date.now() + 600e3) - Date.now()) / 1000));
    throw new HttpError(503, "Image generation is busy right now. Please try again later.", {
      code: "BUSY",
      retryAfter: Math.min(secs, 3600),
    });
  }
  if (sawRefusal) {
    throw new HttpError(422, "The AI could not create this image. Please try another photo or press Generate again.", {
      code: "REFUSED",
    });
  }
  throw new HttpError(502, "Image generation is taking longer than usual. Please wait a moment and try again.", {
    code: "UPSTREAM",
  });
}

// ------------------------------------------------------------------ queue
let active = 0;
const waiting = [];
const stats = { jobs: 0, jobsOk: 0, jobsFailed: 0 };

function acquire() {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  if (waiting.length >= MAX_QUEUE) {
    return Promise.reject(new HttpError(503, "Too many people are generating right now. Please try again in a minute.", { code: "QUEUE_FULL", retryAfter: 30 }));
  }
  return new Promise((resolve) => waiting.push(resolve));
}
function release() {
  const next = waiting.shift();
  if (next) next();
  else active--;
}

async function runJob(job) {
  await acquire();
  stats.jobs++;
  try {
    const out = await runWithProviders(job);
    stats.jobsOk++;
    return out;
  } catch (e) {
    stats.jobsFailed++;
    throw e;
  } finally {
    release();
  }
}

// ------------------------------------------------------------------ request parsing
async function readRequest(req) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_UPLOAD_BYTES) throw new HttpError(413, "The upload is too large.");
    chunks.push(c);
  }
  const hasBody = chunks.length > 0 && req.method !== "GET" && req.method !== "HEAD";
  return new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });
}

async function fileOf(form, field) {
  const f = form.get(field);
  if (!f || typeof f === "string" || !f.size) return null;
  if (!String(f.type || "").toLowerCase().startsWith("image/")) {
    throw new HttpError(400, `Uploaded file "${field}" is not an image.`);
  }
  return { buffer: Buffer.from(await f.arrayBuffer()), mime: f.type };
}

function requireKey(req) {
  const required = process.env.ASK_KEY;
  if (required && req.headers["x-api-key"] !== required) throw new HttpError(401, "Invalid or missing API key.");
}

// ------------------------------------------------------------------ routes
async function handleGenerate(route, req, res) {
  requireKey(req);
  const request = await readRequest(req);
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new HttpError(400, "Send the photos as multipart/form-data.");
  }
  const prompt = typeof form.get("prompt") === "string" ? form.get("prompt").trim() : "";
  if (!prompt) {
    throw new HttpError(400, route === "template-edit" ? "No template generation prompt was provided." : "No editing prompt was provided.");
  }

  let job;
  if (route === "edit-image") {
    const image = await fileOf(form, "image");
    if (!image) throw new HttpError(400, "No source image was provided.");
    job = { kind: "edit", prompt, images: [image] };
  } else if (route === "template-edit") {
    const user = await fileOf(form, "image");
    const template = await fileOf(form, "templateImage");
    const second = await fileOf(form, "image2");
    if (!user) throw new HttpError(400, "No user photo was provided.");
    if (!template) throw new HttpError(400, "No template image was provided.");
    // Order: template first, then person 1, then (couple templates) person 2.
    job = { kind: "template", prompt, images: second ? [template, user, second] : [template, user] };
  } else {
    const left = await fileOf(form, "image");
    const right = await fileOf(form, "image2");
    if (!left) throw new HttpError(400, "No left person photo was provided.");
    if (!right) throw new HttpError(400, "No right person photo was provided.");
    job = { kind: "dual", prompt, images: [left, right] };
  }

  const out = await runJob(job);
  sendJson(res, 200, {
    success: true,
    provider: `api-${out.provider}`,
    image: `data:${out.mime};base64,${out.buffer.toString("base64")}`,
  });
}

function sessionsView() {
  return PROVIDERS.map((p) => ({
    slot: p.slot,
    name: p.label,
    active: p.active,
    usable: isUsable(p),
    healthy: isUsable(p) && p.streak < 3,
    downReason: isResting(p) ? p.restReason : p.streak >= 3 ? "failing" : "",
    failStreak: p.streak,
    lastError: p.streak > 0 ? p.lastError : "",
    lastCause: p.streak > 0 ? explain(p.lastError) : "",
    lastAdvice: "",
    restingUntil: isResting(p) ? new Date(p.restUntil).toISOString() : null,
    usableAgainAt: isResting(p) ? new Date(p.restUntil).toISOString() : null,
  }));
}

function explain(msg) {
  const m = String(msg || "");
  if (/quota|limit|429|neuron/i.test(m)) return "Free daily limit reached. It comes back by itself at the reset time.";
  if (/key rejected|401|403/i.test(m)) return "The API key or token is wrong or expired. Make a new one and update the GitHub secret.";
  if (/no image|refus|safety/i.test(m)) return "The AI declined this photo or prompt.";
  return "Temporary provider problem. The bot tries the next provider.";
}

function healthPayload() {
  return {
    success: true,
    status: "healthy",
    mode: "api (no Google login)",
    generation: { active, waiting: waiting.length, maxConcurrent: MAX_CONCURRENT, maxQueue: MAX_QUEUE },
    providers: PROVIDERS.map((p) => ({ slot: p.slot, name: p.label, usable: isUsable(p), ok: p.ok, failed: p.failed })),
    stats,
    sessions: sessionsView(),
    recentErrors: eventLog.filter((e) => e.type === "fail").slice(-8),
  };
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  try {
    if (req.method === "POST" && pathname === "/edit-image") return await handleGenerate("edit-image", req, res);
    if (req.method === "POST" && pathname === "/template-edit") return await handleGenerate("template-edit", req, res);
    if (req.method === "POST" && pathname === "/edit-image-dual") return await handleGenerate("edit-image-dual", req, res);

    if (req.method === "GET" && pathname === "/health") return sendJson(res, 200, healthPayload());

    if (req.method === "POST" && pathname === "/warm-hint") {
      requireKey(req);
      req.resume();
      return sendJson(res, 200, { ok: true, mode: "off" }); // nothing to warm up any more
    }

    if (req.method === "GET" && pathname === "/admin-report") {
      const key = (process.env.BOT_ALERT_KEY || "").trim();
      const sent = String(req.headers["x-bot-alert-key"] || "");
      const same = key && sent.length === key.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(key));
      if (!same) return sendJson(res, 404, { success: false });
      return sendJson(res, 200, {
        ...healthPayload(),
        detailed: true,
        startedAt: new Date(STARTED_AT).toISOString(),
        uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
        events: eventLog.slice(-80),
      });
    }

    if (req.method === "POST" && pathname === "/notify") {
      req.resume();
      return sendJson(res, 200, { success: true }); // email alerts are not used
    }

    return sendJson(res, 404, { success: false, error: "Not found." });
  } catch (error) {
    const status = error && typeof error.statusCode === "number" ? error.statusCode : 500;
    if (status >= 500 && !(error instanceof HttpError)) console.error("Unexpected error:", error);
    const safe = error instanceof HttpError || status < 500;
    return sendJson(
      res,
      status,
      {
        success: false,
        error: safe && error instanceof Error ? error.message : "Image generation is taking longer than usual. Please wait a moment and try again.",
        code: error && error.code ? error.code : undefined,
        retryAfter: error && error.retryAfter ? error.retryAfter : undefined,
      },
      error && error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {},
    );
  }
});

server.headersTimeout = 60000;
server.requestTimeout = 0;
server.timeout = 0;

buildProviders();
server.listen(PORT, HOST, () => {
  console.log(`Node API running on internal port ${PORT}`);
  if (!PROVIDERS.length) {
    console.log("WARNING: no image provider is configured. Set CF_ACCOUNT_ID + CF_API_TOKEN (and/or GEMINI_API_KEY).");
  }
  for (const p of PROVIDERS) console.log(`Provider slot ${p.slot}: ${p.label}`);
  console.log(`Generation limits: up to ${MAX_CONCURRENT} at once, ${MAX_QUEUE} waiting.`);
});

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
