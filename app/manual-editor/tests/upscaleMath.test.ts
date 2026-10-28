import {
  boxBlockFor,
  buildTileSpecs,
  overlapWaste,
  planUpscale,
  planarToRgbaBox,
  rgbaToPlanar,
  tilePlacement,
} from "../_components/manual-editor/upscaleMath";
import {
  TOOL_GUIDE,
  TOOL_GUIDE_ORDER,
} from "../_components/manual-editor/toolGuide";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, info = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  [" + info + "]" : ""}`);
};

/* ---- 1. RGBA <-> planar --------------------------------------------- */
{
  const w = 3;
  const h = 2;
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = i * 10;
    rgba[i * 4 + 1] = 100 + i;
    rgba[i * 4 + 2] = 255 - i;
    rgba[i * 4 + 3] = 7; // alpha must be ignored
  }
  const planar = rgbaToPlanar(rgba, w, h);
  const back = planarToRgbaBox(planar, w, h, 1);
  let same = back.width === w && back.height === h;
  for (let i = 0; i < w * h; i++) {
    same &&= back.rgba[i * 4] === rgba[i * 4];
    same &&= back.rgba[i * 4 + 1] === rgba[i * 4 + 1];
    same &&= back.rgba[i * 4 + 2] === rgba[i * 4 + 2];
    same &&= back.rgba[i * 4 + 3] === 255;
  }
  check("rgba -> planar -> rgba round trip is lossless (alpha forced opaque)", same);
}

/* ---- 2. box downscale ------------------------------------------------ */
{
  // 4x4 single-value-per-2x2 image: block 2 must give the exact block value.
  const w = 4;
  const h = 4;
  const data = new Float32Array(3 * w * h);
  const vals = [0.0, 0.5, 1.0, 0.25];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = vals[(y >> 1) * 2 + (x >> 1)];
      const p = y * w + x;
      data[p] = v;
      data[w * h + p] = 1 - v;
      data[2 * w * h + p] = v / 2;
    }
  const out = planarToRgbaBox(data, w, h, 2);
  check("box 2x2 output size", out.width === 2 && out.height === 2);
  check(
    "box 2x2 keeps block values",
    out.rgba[0] === 0 && out.rgba[4] === 128 && out.rgba[8] === 255 && out.rgba[12] === 64,
    Array.from(out.rgba.slice(0, 16)).join(","),
  );

  // Averaging inside a block: checker of 0 / 1 -> 0.5 (128)
  const c = new Float32Array(3 * 2 * 2);
  [0, 1, 1, 0].forEach((v, i) => {
    c[i] = v;
    c[4 + i] = v;
    c[8 + i] = v;
  });
  const avg = planarToRgbaBox(c, 2, 2, 2);
  check("box averages a checker pattern to mid grey", avg.rgba[0] === 128 && avg.rgba[1] === 128);

  // out-of-range model values are clamped
  const o = planarToRgbaBox(new Float32Array([1.4, -0.3, 0.5]), 1, 1, 1);
  check("values are clamped to 0..255", o.rgba[0] === 255 && o.rgba[1] === 0 && o.rgba[2] === 128);
}

/* ---- 3. block factor ------------------------------------------------- */
check("x4 model -> x2 result averages 2x2", boxBlockFor(100, 400, 2) === 2);
check("x4 model -> x4 result keeps size", boxBlockFor(100, 400, 4) === 1);
check("non-integer ratio falls back to 1", boxBlockFor(100, 300, 2) === 1);

/* ---- 4. tile geometry: cores cover the image exactly once ----------- */
for (const [w, h, t, o] of [
  [1000, 700, 256, 16],
  [1280, 960, 256, 16],
  [641, 473, 192, 12],
  [300, 300, 256, 16],
  [257, 1, 256, 16],
] as const) {
  const specs = buildTileSpecs(w, h, t, o);
  const cover = new Uint8Array(w * h);
  let inBounds = true;
  for (const s of specs) {
    inBounds &&= s.sx0 >= 0 && s.sy0 >= 0 && s.sx0 + s.tileWidth <= w && s.sy0 + s.tileHeight <= h;
    inBounds &&= s.x >= s.sx0 && s.x + s.coreWidth <= s.sx0 + s.tileWidth;
    inBounds &&= s.y >= s.sy0 && s.y + s.coreHeight <= s.sy0 + s.tileHeight;
    for (let y = s.y; y < s.y + s.coreHeight; y++)
      for (let x = s.x; x < s.x + s.coreWidth; x++) cover[y * w + x]++;
  }
  check(`tiles ${w}x${h} (tile ${t}): every pixel covered exactly once`, cover.every((v) => v === 1), `${specs.length} tiles`);
  check(`tiles ${w}x${h}: every tile inside the image and containing its core`, inBounds);
}

/* ---- 5. end-to-end reassembly with a fake x2 "model" ---------------- */
{
  // Source image with a unique value per pixel; fake model = pixel doubling.
  // Rebuilding it tile by tile (using tilePlacement exactly like the UI
  // thread does with putImageData) must equal doubling the whole image.
  const W = 530;
  const H = 411;
  const F = 2;
  const src = new Uint8Array(W * H);
  for (let i = 0; i < src.length; i++) src[i] = (i * 2654435761) >>> 24;

  const expected = new Uint8Array(W * F * H * F);
  for (let y = 0; y < H * F; y++)
    for (let x = 0; x < W * F; x++) expected[y * W * F + x] = src[(y >> 1) * W + (x >> 1)];

  const out = new Uint8Array(W * F * H * F).fill(0);
  for (const s of buildTileSpecs(W, H, 192, 12)) {
    const tw = s.tileWidth * F;
    const th = s.tileHeight * F;
    const tile = new Uint8Array(tw * th);
    for (let y = 0; y < th; y++)
      for (let x = 0; x < tw; x++)
        tile[y * tw + x] = src[(s.sy0 + (y >> 1)) * W + (s.sx0 + (x >> 1))];

    const p = tilePlacement(s, F);
    // putImageData(img, dx, dy, dirtyX, dirtyY, dirtyW, dirtyH)
    for (let y = p.dirtyY; y < p.dirtyY + p.dirtyHeight; y++)
      for (let x = p.dirtyX; x < p.dirtyX + p.dirtyWidth; x++)
        out[(p.dy + y) * W * F + (p.dx + x)] = tile[y * tw + x];
  }
  let equal = true;
  for (let i = 0; i < out.length; i++) if (out[i] !== expected[i]) { equal = false; break; }
  check("reassembled tiles equal the whole-image result (no seams, no gaps)", equal);
}

/* ---- 6. plan numbers / work estimate -------------------------------- */
{
  const gpu = planUpscale("webgpu");
  const cpu = planUpscale("wasm");
  check("GPU plan: 1280 px input cap (matches the on-screen guide)", gpu.maxInputSide === 1280);
  check("CPU plan: 640 px input cap (matches the on-screen guide)", cpu.maxInputSide === 640);
  const oldWaste = overlapWaste(128, 20);
  const newWaste = overlapWaste(gpu.tileSize, gpu.overlap);
  check("overlap waste dropped (old 128/20 vs new GPU plan)", newWaste < oldWaste * 0.8, `${oldWaste.toFixed(2)}x -> ${newWaste.toFixed(2)}x`);

  // Tile count for a typical 3:4 passport-size source on GPU, old vs new.
  const oldTiles = buildTileSpecs(1200, 1600, 128, 20).length;
  const newTiles = buildTileSpecs(960, 1280, gpu.tileSize, gpu.overlap).length;
  check("fewer model calls for a 960x1280 photo than the old 1200x1600 plan", newTiles < oldTiles / 3, `${oldTiles} -> ${newTiles}`);
}

/* ---- 7. guide text completeness ------------------------------------- */
{
  const ids = Object.keys(TOOL_GUIDE);
  check("guide covers all 10 tools", ids.length === 10 && TOOL_GUIDE_ORDER.length === 10 && TOOL_GUIDE_ORDER.every((id) => id in TOOL_GUIDE));
  const bangla = /[\u0980-\u09FF]/;
  let complete = true;
  for (const id of TOOL_GUIDE_ORDER) {
    for (const lang of ["en", "bn"] as const) {
      const g = TOOL_GUIDE[id][lang];
      complete &&= g.name.trim().length > 3 && [g.summary, g.useWhen, g.limits].every((t) => t.trim().length > 12);
    }
    complete &&= bangla.test(TOOL_GUIDE[id].bn.summary) && bangla.test(TOOL_GUIDE[id].bn.useWhen) && bangla.test(TOOL_GUIDE[id].bn.limits);
    complete &&= !bangla.test(TOOL_GUIDE[id].en.summary);
  }
  check("every tool has name / what it does / use when / limits in English and Bangla", complete);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
