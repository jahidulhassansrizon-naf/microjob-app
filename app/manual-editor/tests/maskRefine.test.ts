import { refineAlpha } from "../_components/manual-editor/maskRefine";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, info = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  [" + info + "]" : ""}`);
};

const W = 64;
const H = 64;
const src = new Uint8Array(W * H).fill(20); // faint haze everywhere
for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) src[y * W + x] = 255; // subject
for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) src[y * W + x] = 255; // floating speck
src[10 * W + 50] = 120; // single faint stray pixel
for (let y = 16; y < 48; y++) src[y * W + 15] = 128; // soft edge column

const out = refineAlpha(src, W, H);

check("haze becomes fully transparent", out[60 * W + 60] === 0 && out[30 * W + 5] === 0);
check("subject interior stays opaque", out[32 * W + 32] === 255);
check("floating speck removed", out[3 * W + 3] === 0);
check("stray faint pixel removed", out[10 * W + 50] === 0);
check("soft edge stays partially transparent", out[32 * W + 15] > 0 && out[32 * W + 15] < 255, String(out[32 * W + 15]));
check("choke pulls edge inward", out[32 * W + 16] < 255, String(out[32 * W + 16]));

const multi = new Uint8Array(W * H);
for (let y = 10; y < 40; y++) for (let x = 10; x < 40; x++) multi[y * W + x] = 255;
for (let y = 44; y < 54; y++) for (let x = 44; x < 54; x++) multi[y * W + x] = 255; // 100px vs 900px = 11%
const kept = refineAlpha(multi, W, H);
check("sizeable second piece (e.g. a hand) is kept", kept[48 * W + 48] === 255);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
