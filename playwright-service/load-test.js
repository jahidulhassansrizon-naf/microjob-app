// load-test.js
// Sends N real image-edit requests at the SAME moment to the Playwright
// service (local http OR a public https URL such as a Cloudflare tunnel)
// and shows how many run at once vs wait in line.
//
// Put this file in the playwright-service folder (next to server.js).
// Put 1 or more real photos in  playwright-service/test-images/
// (jpg / png / webp). They are used round-robin.
//
// Run:
//   node load-test.js            -> 20 requests
//   node load-test.js 5          -> 5 requests
//   node load-test.js 20 /edit-image
//
// PowerShell options:
//   $env:BASE="http://127.0.0.1:4000"                      (local server)
//   $env:BASE="https://xxxx.trycloudflare.com"             (GitHub bot via tunnel)
//   $env:ASK_KEY="..."       (only if the server uses ASK_KEY)
//   $env:PROMPT="Make this a clean passport photo, white background"

const fs = require("node:fs");
const path = require("node:path");

const BASE = new URL(process.env.BASE || "http://127.0.0.1:4000");
const IS_HTTPS = BASE.protocol === "https:";
// https URLs (Cloudflare tunnel) need the https module, plain http needs http.
const http = IS_HTTPS ? require("node:https") : require("node:http");
const BASE_PORT = BASE.port ? Number(BASE.port) : IS_HTTPS ? 443 : 80;

const N = Number(process.argv[2]) || 20;
// Optional: $env:SLOT="2" sends every request to Gemini session 2 only.
// (The server must be started with $env:ALLOW_FORCE_SLOT="1".)
const ENDPOINT = (process.argv[3] || "/edit-image") + (process.env.SLOT ? `?slot=${Number(process.env.SLOT)}` : "");
const ASK_KEY = process.env.ASK_KEY || "";
// Different prompts. Request #1 uses prompt 1, #2 uses prompt 2, ...
// After the last one it starts again from the first. Edit freely.
// (Set $env:PROMPT="..." to use ONE prompt for every request instead.)
const PROMPTS = process.env.PROMPT
  ? [process.env.PROMPT]
  : [
      "Make this a clean passport size photo with a plain white background. Keep the face exactly the same.",
      "Change the background to solid blue and make it a professional visa photo. Keep the face exactly the same.",
      "Put the person in a black formal suit with a white shirt and tie, plain light grey background. Keep the face exactly the same.",
      "Make the skin look smooth and bright, fix lighting, plain white background, passport photo style. Keep the face exactly the same.",
      "Crop to head and shoulders, neat combed hair, trimmed beard, plain white background. Keep the face exactly the same.",
      "Dress the person in a light blue formal shirt, plain white background, professional ID photo. Keep the face exactly the same.",
      "Remove the outdoor background and replace with a plain light blue studio background. Keep the face exactly the same.",
      "Make a clean stamp size photo with a white background, face centered, even lighting. Keep the face exactly the same.",
      "Put the person in a dark navy blazer with a light blue shirt, plain white background, corporate profile photo. Keep the face exactly the same.",
      "Change the background to a soft light grey gradient and make it a professional LinkedIn headshot. Keep the face exactly the same.",
      "Put the person in a white shirt with a dark red tie, plain white background, job application photo. Keep the face exactly the same.",
      "Brighten the photo, remove shadows on the face, natural skin tone, plain white background, NID card style. Keep the face exactly the same.",
      "Give the person a traditional white panjabi, plain light green background, formal portrait. Keep the face exactly the same.",
      "Make a clean e-passport photo: neutral expression, straight head pose, plain off-white background, no shadows. Keep the face exactly the same.",
      "Replace the background with solid red and make it a clean visa style photo, even lighting. Keep the face exactly the same.",
    ];
const IMAGE_DIR = path.join(__dirname, "test-images");
const RESULT_DIR = path.join(__dirname, "test-results", new Date().toISOString().replace(/[:.]/g, "-"));
const POLL_MS = 500;

// ---------- load test images ----------
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

function loadImages() {
  if (!fs.existsSync(IMAGE_DIR)) {
    console.error(`Folder not found: ${IMAGE_DIR}\nCreate it and put 1+ real photos inside.`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(IMAGE_DIR)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .map((f) => ({
      name: f,
      mime: MIME[path.extname(f).toLowerCase()],
      data: fs.readFileSync(path.join(IMAGE_DIR, f)),
    }));
  if (!files.length) {
    console.error(`No jpg/png/webp image in ${IMAGE_DIR}`);
    process.exit(1);
  }
  return files;
}

// ---------- tiny multipart builder (no dependency) ----------
function buildMultipart(image, prompt) {
  const boundary = "----loadtest" + Math.random().toString(16).slice(2);
  const parts = [
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${image.name}"\r\nContent-Type: ${image.mime}\r\n\r\n`,
    ),
    image.data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

// ---------- http helpers (no client-side timeout) ----------
function request(method, urlPath, { headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: BASE.hostname,
        port: BASE_PORT,
        path: urlPath,
        method,
        headers,
        agent: false, // own socket per request, no pool limit
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") }));
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getHealth() {
  try {
    const headers = ASK_KEY ? { "x-api-key": ASK_KEY } : {};
    const r = await request("GET", "/health", { headers });
    return JSON.parse(r.text).generation;
  } catch {
    return null;
  }
}

const sec = (ms) => (ms / 1000).toFixed(1).padStart(6) + "s";

// ---------- main ----------
(async () => {
  const images = loadImages();
  const before = await getHealth();
  if (!before) {
    console.error(`Cannot reach ${BASE.origin}/health. Is the server running / is the URL correct?`);
    process.exit(1);
  }
  console.log(`Target: ${BASE.origin}`);
  console.log(`Server limits: ${before.maxConcurrent} at once, ${before.maxQueue} waiting`);
  console.log(
    `Sending ${N} requests to ${ENDPOINT} using ${images.length} test image(s) and ${PROMPTS.length} different prompt(s)\n`,
  );

  let maxActive = 0;
  let maxWaiting = 0;
  let last = "";
  const t0 = Date.now();

  const poller = setInterval(async () => {
    const h = await getHealth();
    if (!h) return;
    maxActive = Math.max(maxActive, h.active);
    maxWaiting = Math.max(maxWaiting, h.waiting);
    const line = `active=${h.active} waiting=${h.waiting}`;
    if (line !== last) {
      last = line;
      console.log(`[${sec(Date.now() - t0)}] LIVE  ${line}`);
    }
  }, POLL_MS);

  const results = new Array(N);

  await Promise.all(
    Array.from({ length: N }, async (_, i) => {
      const image = images[i % images.length];
      const promptNo = (i % PROMPTS.length) + 1;
      const { body, contentType } = buildMultipart(image, PROMPTS[promptNo - 1]);
      const headers = { "Content-Type": contentType, "Content-Length": body.length };
      if (ASK_KEY) headers["x-api-key"] = ASK_KEY;
      // Same as the website route: keeps the Cloudflare tunnel from cutting
      // long requests (error 524). Set $env:KEEPALIVE="0" to test without it.
      if (process.env.KEEPALIVE !== "0") headers["x-keepalive"] = "1";

      const sentAt = Date.now() - t0;
      let status = 0;
      let ok = false;
      let error = "";

      try {
        const r = await request("POST", ENDPOINT, { headers, body });
        status = r.status;
        let json = {};
        try {
          json = JSON.parse(r.text);
        } catch {}
        // With keep-alive the HTTP status is always 200; the real one is in the JSON.
        if (typeof json.status === "number") status = json.status;
        ok = status === 200 && json.success === true && typeof json.image === "string";
        if (!ok) {
          error = json.error || r.text.slice(0, 120);
        } else {
          // Save the generated image to test-results/
          const m = /^data:(image\/[a-z+]+);base64,(.+)$/s.exec(json.image);
          if (m) {
            const ext = m[1].includes("png") ? ".png" : m[1].includes("webp") ? ".webp" : ".jpg";
            fs.mkdirSync(RESULT_DIR, { recursive: true });
            fs.writeFileSync(
              path.join(RESULT_DIR, `result-${String(i + 1).padStart(2, "0")}-prompt${promptNo}${ext}`),
              Buffer.from(m[2], "base64"),
            );
          }
        }
      } catch (e) {
        error = e.message;
      }

      const doneAt = Date.now() - t0;
      results[i] = { n: i + 1, sentAt, doneAt, status, ok, error };
      console.log(
        `[${sec(doneAt)}] #${String(i + 1).padStart(2)} prompt${promptNo} ${ok ? "OK  " : "FAIL"} status=${status} took=${sec(doneAt - sentAt)}${error ? "  " + error : ""}`,
      );
    }),
  );

  clearInterval(poller);

  // ---------- summary ----------
  const okCount = results.filter((r) => r.ok).length;
  const durations = results.filter((r) => r.ok).map((r) => r.doneAt - r.sentAt).sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0;

  console.log("\n================ SUMMARY ================");
  console.log(`Requests sent        : ${N}`);
  console.log(`Success / Failed     : ${okCount} / ${N - okCount}`);
  console.log(`Max active seen      : ${maxActive}  (limit ${before.maxConcurrent})`);
  console.log(`Max waiting seen     : ${maxWaiting}  (expected about ${Math.max(0, N - before.maxConcurrent)})`);
  console.log(`Median time (OK ones): ${sec(median).trim()}`);
  console.log(`Total test time      : ${sec(Date.now() - t0).trim()}`);
  console.log(`Result images saved  : ${okCount ? RESULT_DIR : "(none, no request succeeded)"}`);

  // Failures grouped by reason (helps to see timeout vs refusal vs busy)
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    const groups = {};
    for (const f of failed) {
      const key = `status=${f.status} ${f.error}`.slice(0, 140);
      groups[key] = (groups[key] || 0) + 1;
    }
    console.log("\nFailure reasons:");
    for (const [reason, count] of Object.entries(groups)) {
      console.log(`  ${count} x ${reason}`);
    }
  }

  const limiterVerdict =
    maxActive > before.maxConcurrent
      ? "LIMITER PROBLEM: more jobs ran at once than the limit."
      : maxActive >= Math.min(N, before.maxConcurrent) - 1
        ? "LIMITER OK: ran up to the limit and never went above it."
        : "LIMITER NOTE: fewer ran at once than expected.";
  const genVerdict =
    okCount === N
      ? `GENERATION OK: all ${N} images were created at ${Math.min(N, maxActive)} at once.`
      : `GENERATION FAILED: only ${okCount} of ${N} images were created. ${Math.min(N, maxActive)} at once is too many right now (Gemini/Google side). Try a smaller number.`;
  console.log(limiterVerdict);
  console.log(genVerdict);
  console.log("Tip: failures with 'limit' / 'out of limit' mean Gemini session quota, not the queue.");
})();
