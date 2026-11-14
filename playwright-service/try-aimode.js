"use strict";
// Real-page test on YOUR computer, before using GitHub:
//   node try-aimode.js gemini-session-6.json photo.jpg "make a passport size photo, blue background"
// A browser window opens so you can WATCH the upload and generation. Result: try-result.png
// If it fails, copy the "[aimode] debug(...)" lines from the terminal (and the screenshot in ./debug) to Claude.
process.env.AIMODE_HEADED = "1";
const fs = require("fs");
const { aiModeGenerate } = require("./aimode");

const [session, photo, ...rest] = process.argv.slice(2);
const prompt = rest.join(" ") || "make a passport size photo with blue background";
if (!session || !photo) {
  console.log('Use: node try-aimode.js <session.json> <photo.jpg> "prompt"');
  process.exit(1);
}
(async () => {
  const ext = photo.toLowerCase().endsWith("png") ? "image/png" : "image/jpeg";
  const t0 = Date.now();
  try {
    const out = await aiModeGenerate(session, { kind: "edit", prompt, images: [{ buffer: fs.readFileSync(photo), mime: ext }] });
    fs.writeFileSync("try-result.png", out.buffer);
    console.log(`OK in ${Math.round((Date.now() - t0) / 1000)}s -> try-result.png (${out.buffer.length} bytes)`);
  } catch (e) {
    console.log(`FAILED (${e.kind}): ${e.message}`);
  }
  process.exit(0);
})();
