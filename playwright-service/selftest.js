"use strict";
// Offline self-test: starts fake Cloudflare + Gemini servers and the bot, then calls every route.
// Run:  npm install && npm run selftest
const http = require("http");
const { spawn } = require("child_process");
const sharp = require("sharp");

const FAKE_PORT = 4511, BOT_PORT = 4512;
let cfMode = "ok", gemMode = "ok";
const seen = { cf: null, gem: null };

async function pic(w, h, color) {
  return sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();
}

const fake = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  if (req.url.includes("/ai/run/")) {
    const form = await new Request("http://x/", { method: "POST", headers: req.headers, body }).formData();
    seen.cf = { fields: [...form.keys()], size: `${form.get("width")}x${form.get("height")}`, auth: req.headers.authorization };
    if (cfMode === "quota") { res.writeHead(429); return res.end('{"errors":[{"message":"out of neurons"}]}'); }
    const img = await pic(64, 64, "#3366ff");
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ success: true, result: { image: img.toString("base64") } }));
  }
  if (req.url.includes(":generateContent")) {
    const j = JSON.parse(body.toString());
    seen.gem = { parts: j.contents[0].parts.length, key: req.headers["x-goog-api-key"] };
    if (gemMode === "limit0") { res.writeHead(429); return res.end('{"error":{"message":"Quota exceeded ... limit: 0"}}'); }
    const img = await pic(64, 64, "#ff6633");
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }, { inlineData: { mimeType: "image/png", data: img.toString("base64") } }] } }] }));
  }
  res.writeHead(404); res.end();
});

async function call(path, fields, files, headers = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  for (const [k, buf] of Object.entries(files)) form.append(k, new Blob([buf], { type: "image/png" }), k + ".png");
  const r = await fetch(`http://127.0.0.1:${BOT_PORT}${path}`, { method: "POST", body: form, headers });
  return { status: r.status, json: await r.json() };
}

let failures = 0;
function check(name, cond, extra = "") { console.log(`${cond ? "PASS" : "FAIL"}  ${name} ${extra}`); if (!cond) failures++; }

(async () => {
  await new Promise((r) => fake.listen(FAKE_PORT, "127.0.0.1", r));
  const bot = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, BOT_PORT: String(BOT_PORT), ASK_KEY: "secret", BOT_ALERT_KEY: "adm",
      CF_BASE_URL: `http://127.0.0.1:${FAKE_PORT}`, GEMINI_BASE_URL: `http://127.0.0.1:${FAKE_PORT}`,
      CF_ACCOUNT_ID: "acc1", CF_API_TOKEN: "tok1", GEMINI_API_KEY: "gkey" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  await new Promise((r) => setTimeout(r, 1500));
  try {
    const A = await pic(300, 400, "#aaaaaa"), B = await pic(800, 600, "#222222"), C = await pic(200, 200, "#00aa00");
    const key = { "x-api-key": "secret" };

    let r = await call("/edit-image", { prompt: "make it blue" }, { image: A });
    check("no api key -> 401", r.status === 401);

    r = await call("/edit-image", { prompt: "make it blue" }, { image: A }, key);
    check("edit-image via Cloudflare", r.status === 200 && r.json.success && r.json.image.startsWith("data:image/") && r.json.provider === "api-cloudflare", JSON.stringify(seen.cf));
    check("portrait photo gives portrait output size", seen.cf.size === "768x1024");

    r = await call("/template-edit", { prompt: "put me here" }, { templateImage: B, image: A, image2: C }, key);
    check("template-edit sends 3 reference images in order", r.status === 200 && seen.cf.fields.filter((f) => f.startsWith("input_image_")).join() === "input_image_0,input_image_1,input_image_2", seen.cf.size);
    check("template aspect (landscape) is used", seen.cf.size === "1024x768");

    r = await call("/edit-image-dual", { prompt: "group photo" }, { image: A, image2: C }, key);
    check("edit-image-dual", r.status === 200 && r.json.success);

    r = await call("/edit-image", { prompt: "" }, { image: A }, key);
    check("empty prompt -> 400", r.status === 400);
    r = await call("/edit-image", { prompt: "x" }, {}, key);
    check("missing image -> 400", r.status === 400);

    cfMode = "quota";
    r = await call("/edit-image", { prompt: "x" }, { image: A }, key);
    check("Cloudflare quota -> falls back to Gemini", r.status === 200 && r.json.provider === "api-gemini" && seen.gem.parts === 2);

    gemMode = "limit0";
    r = await call("/edit-image", { prompt: "x" }, { image: A }, key);
    check("all providers resting -> 503 BUSY with retryAfter", r.status === 503 && r.json.code === "BUSY" && r.json.retryAfter > 0, JSON.stringify(r.json));

    const h = await (await fetch(`http://127.0.0.1:${BOT_PORT}/health`)).json();
    check("/health lists both providers as resting", h.sessions.length === 2 && h.sessions.every((s) => !s.usable));
    const a = await fetch(`http://127.0.0.1:${BOT_PORT}/admin-report`, { headers: { "x-bot-alert-key": "adm" } });
    check("/admin-report works with key", a.status === 200);
    const a2 = await fetch(`http://127.0.0.1:${BOT_PORT}/admin-report`);
    check("/admin-report hidden without key", a2.status === 404);
  } finally {
    bot.kill(); fake.close();
  }
  console.log(failures ? `\n${failures} test(s) FAILED` : "\nAll tests passed.");
  process.exit(failures ? 1 : 0);
})();
