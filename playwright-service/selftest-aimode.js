"use strict";
// Offline test of the AI Mode clicking logic against FAKE pages (NOT the real Google page).
// Run: npm install && node selftest-aimode.js
const http = require("http");
const fs = require("fs");
const sharp = require("sharp");

const PORT = 4521;
const THUMB = "document.getElementById('answer').insertAdjacentHTML('beforeend','<img width=60 height=60 src=\\'data:image/gif;base64,R0lGODlhAQABAAAAACw=\\'>')";
const page = (png, variant) => `<!doctype html><body>
<div id=answer></div>
<div id=menu role=menu hidden>
  ${variant === "bengali"
    ? `<div role=menuitem onclick="var i=document.createElement('input');i.type='file';i.onchange=function(){${THUMB}};i.click()">ছবি যোগ করা</div><div role=menuitem>ফাইল যোগ করুন</div>`
    : `<div role=menuitem onclick="document.getElementById('f').click()">Upload image</div>`}
</div>
${variant === "bengali" ? "" : `<input id=f type=file style="display:none" onchange="${THUMB}">`}
<div class=card style="width:500px;border:1px solid #000;padding:8px">
  <textarea id=box placeholder="Ask anything" style="width:480px"></textarea>
  <div>
    ${variant === "labeled" ? '<button aria-label="Add files" style="width:32px;height:32px" onclick="document.getElementById(\'menu\').hidden=false">+</button>'
      : variant === "paste" ? ""
      : '<button style="width:32px;height:32px" onclick="document.getElementById(\'menu\').hidden=false"><svg width=12 height=12></svg></button>'}
    <button aria-label="Voice search" style="width:32px;height:32px">m</button>
  </div>
</div>
<script>
${variant === "paste" ? `document.getElementById('box').addEventListener('paste',function(e){ if(e.clipboardData.files.length){ e.preventDefault(); ${THUMB} } });` : ""}
document.getElementById('box').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault();
  setTimeout(()=>{ document.getElementById('answer').insertAdjacentHTML('beforeend','<p>Here is your generated image.</p><img src="data:image/png;base64,${png}">'); },1500);} });
</script></body>`;

(async () => {
  const png = await sharp({ create: { width: 512, height: 512, channels: 3, background: "#33aa66" } }).png().toBuffer();
  const server = http.createServer((q, r) => {
    r.writeHead(200, { "content-type": "text/html" });
    r.end(page(png.toString("base64"), (q.url.split("?v=")[1] || "labeled")));
  });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  fs.writeFileSync("/tmp/fake-session.json", JSON.stringify({ cookies: [], origins: [] }));
  process.env.AIMODE_WAIT_MS = "20000";
  const photo = await sharp({ create: { width: 300, height: 300, channels: 3, background: "#888" } }).jpeg().toBuffer();
  let failures = 0;
  for (const variant of ["labeled", "plain", "paste", "bengali"]) {
    process.env.AIMODE_URL = `http://127.0.0.1:${PORT}/?v=${variant}`;
    delete require.cache[require.resolve("./aimode")];
    const { aiModeGenerate } = require("./aimode");
    try {
      const out = await aiModeGenerate("/tmp/fake-session.json", { kind: "template", prompt: "make a passport photo", images: [{ buffer: photo, mime: "image/jpeg" }, { buffer: photo, mime: "image/jpeg" }] });
      const meta = await sharp(out.buffer).metadata();
      const ok = meta.width >= 400;
      console.log(ok ? "PASS" : "FAIL", `${variant} "+" button -> ${out.mime} ${meta.width}x${meta.height}`);
      if (!ok) failures++;
    } catch (e) { console.log("FAIL", variant, e.kind, e.message); failures++; }
  }
  server.close();
  process.exit(failures ? 1 : 0);
})();
