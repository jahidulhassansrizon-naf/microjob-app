"use strict";
// Offline test of the AI Mode clicking logic against a fake page (NOT the real Google page).
// Run: npm install && node selftest-aimode.js
const http = require("http");
const fs = require("fs");
const sharp = require("sharp");

const PORT = 4521;
const html = (png) => `<!doctype html><body>
<div id=answer></div>
<button aria-label="Add files" onclick="document.getElementById('menu').hidden=false">+</button>
<div id=menu role=menu hidden><div role=menuitem onclick="document.getElementById('f').click()">Upload image</div></div>
<input id=f type=file style="display:none" onchange="document.getElementById('answer').insertAdjacentHTML('beforeend','<img width=60 height=60 src=\\'data:image/gif;base64,R0lGODlhAQABAAAAACw=\\'>')">
<div contenteditable=true role=textbox id=box style="min-height:40px;border:1px solid #000"></div>
<script>
document.getElementById('box').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault();
  setTimeout(()=>{ document.getElementById('answer').insertAdjacentHTML('beforeend','<p>Here is your generated image.</p><img src="data:image/png;base64,${png}">'); },1500);} });
</script></body>`;

(async () => {
  const png = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#33aa66" } }).png().toBuffer();
  const server = http.createServer((q, r) => { r.writeHead(200, { "content-type": "text/html" }); r.end(html(png.toString("base64"))); });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  fs.writeFileSync("/tmp/fake-session.json", JSON.stringify({ cookies: [], origins: [] }));
  process.env.AIMODE_URL = `http://127.0.0.1:${PORT}/`;
  process.env.AIMODE_WAIT_MS = "20000";
  const { aiModeGenerate } = require("./aimode");
  const photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#888" } }).jpeg().toBuffer();
  let ok = false;
  try {
    const out = await aiModeGenerate("/tmp/fake-session.json", { kind: "template", prompt: "make a passport photo", images: [{ buffer: photo, mime: "image/jpeg" }, { buffer: photo, mime: "image/jpeg" }] });
    const meta = await sharp(out.buffer).metadata();
    ok = meta.width >= 400;
    console.log(ok ? "PASS" : "FAIL", `got ${out.mime} ${meta.width}x${meta.height}`);
  } catch (e) { console.log("FAIL", e.kind, e.message); }
  server.close();
  process.exit(ok ? 0 : 1);
})();
