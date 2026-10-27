import {
  analyzeImage, runAutoEnhance, denoise, deblur, relight, removeSpecks, restoreFade, restorePhoto,
  isGrayscaleImage, boxBlur, EnhanceCancelledError, DEFAULT_RELIGHT, clonePixels,
} from "../manual-editor/_components/manual-editor/photoEnhance";
type Pixels = { data: Uint8ClampedArray; width: number; height: number };

let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
const make = (w: number, h: number, f: (x: number, y: number) => [number, number, number]): Pixels => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = f(x, y); const i = (y * w + x) * 4; d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255; }
  return { data: d, width: w, height: h };
};
const meanOf = (p: Pixels, x0: number, y0: number, x1: number, y1: number, c = 1) => { let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { s += p.data[(y * p.width + x) * 4 + c]; n++; } return s / n; };
const stdOf = (p: Pixels, x0: number, y0: number, x1: number, y1: number) => { const m = meanOf(p, x0, y0, x1, y1); let s = 0, n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const v = p.data[(y * p.width + x) * 4 + 1]; s += (v - m) ** 2; n++; } return Math.sqrt(s / n); };

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, info = "") => { (ok ? pass++ : fail++); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  [" + info + "]" : ""}`); };

(async () => {
  const W = 120, H = 120;
  const noisy = (base: number, sigma: number) => make(W, H, () => { const v = base + gauss() * sigma; return [v, v, v]; });

  // 1. noise estimate
  const clean = make(W, H, () => [128, 128, 128]);
  const n8 = noisy(128, 8);
  check("noise estimate ~0 on clean image", analyzeImage(clean).noiseSigma < 1.5, analyzeImage(clean).noiseSigma.toFixed(2));
  const est = analyzeImage(n8).noiseSigma;
  check("noise estimate close to true sigma=8", est > 5.5 && est < 10.5, est.toFixed(2));

  // 2. denoise reduces noise, keeps edge
  const stepNoisy = make(W, H, (x) => { const v = (x < W / 2 ? 70 : 190) + gauss() * 8; return [v, v, v]; });
  for (const lvl of [1, 2, 3] as const) {
    const out = await denoise(stepNoisy, lvl);
    const before = stdOf(stepNoisy, 5, 5, 50, 115);
    const after = stdOf(out, 5, 5, 50, 115);
    const edgeBefore = meanOf(stepNoisy, 70, 5, 115, 115) - meanOf(stepNoisy, 5, 5, 50, 115);
    const edgeAfter = meanOf(out, 70, 5, 115, 115) - meanOf(out, 5, 5, 50, 115);
    check(`denoise level ${lvl} lowers noise`, after < before * (lvl === 1 ? 0.8 : 0.6), `${before.toFixed(1)} -> ${after.toFixed(1)}`);
    check(`denoise level ${lvl} keeps edge contrast`, edgeAfter > edgeBefore * 0.93, `${edgeBefore.toFixed(0)} -> ${edgeAfter.toFixed(0)}`);
  }

  // 3. auto enhance
  const dark = make(W, H, (x, y) => { const v = 25 + (x / W) * 60 + (y / H) * 20; return [v, v, v]; });
  const r1 = await runAutoEnhance(dark, 1);
  const mDark0 = meanOf(dark, 0, 0, W, H), mDark1 = meanOf(r1.pixels, 0, 0, W, H);
  check("auto enhance brightens an under-exposed photo", mDark1 > mDark0 + 25, `${mDark0.toFixed(0)} -> ${mDark1.toFixed(0)}`);

  const good = make(W, H, (x, y) => { const v = 10 + ((x * 7 + y * 13) % 236); return [v, v * 0.95 + 5, v * 0.9 + 10]; });
  const r2 = await runAutoEnhance(good, 1);
  let diff = 0; for (let i = 0; i < good.data.length; i += 4) diff += Math.abs(good.data[i+1] - r2.pixels.data[i+1]);
  check("auto enhance is gentle on an already balanced photo", diff / (W * H) < 12, `mean abs diff ${(diff / (W * H)).toFixed(1)}; notes: ${r2.notes.join(" | ")}`);

  const cast = make(W, H, (x, y) => { const v = 40 + ((x * 3 + y * 5) % 180); return [Math.min(255, v * 1.25), v, v * 0.8]; });
  const r3 = await runAutoEnhance(cast, 1);
  const spread = (p: Pixels) => { const a = [0,1,2].map((c) => meanOf(p, 0, 0, W, H, c)); return Math.max(...a) - Math.min(...a); };
  check("auto enhance reduces a colour cast", spread(r3.pixels) < spread(cast) * 0.6, `${spread(cast).toFixed(1)} -> ${spread(r3.pixels).toFixed(1)}`);

  const half = await runAutoEnhance(dark, 0.5);
  const mHalf = meanOf(half.pixels, 0, 0, W, H);
  check("strength 0.5 lies between original and full result", mHalf > mDark0 && mHalf < mDark1, mHalf.toFixed(0));
  const zero = await runAutoEnhance(dark, 0);
  check("strength 0 returns the original", meanOf(zero.pixels, 0, 0, W, H) === mDark0);

  // 4. deblur - mild softness is the realistic target; strong blur is reported, not asserted
  const softF = (r: number) => boxBlur(Float32Array.from({ length: W * H }, (_, p) => (p % W < W / 2 ? 60 : 200)), W, H, r, 2);
  const softImg = (r: number) => { const f = softF(r); return make(W, H, (x, y) => { const v = f[y * W + x]; return [v, v, v]; }); };
  const grad = (p: Pixels) => Math.abs(p.data[(60 * W + W / 2 + 1) * 4 + 1] - p.data[(60 * W + W / 2 - 2) * 4 + 1]);
  const mild = softImg(1);
  const dbMild = deblur(mild, 0.7);
  check("deblur steepens a mildly soft edge", grad(dbMild) > grad(mild) * 1.25, `${grad(mild).toFixed(0)} -> ${grad(dbMild).toFixed(0)}`);
  const strong = softImg(3);
  const dbStrong = deblur(strong, 0.7);
  console.log(`INFO  strongly blurred edge (13 px wide): gradient ${grad(strong).toFixed(0)} -> ${grad(dbStrong).toFixed(0)}  (modest gain: classical deblur cannot undo heavy blur)`);
  check("deblur never makes a strongly blurred edge worse", grad(dbStrong) >= grad(strong));
  const db = dbMild;
  let maxV = 0, minV = 255; for (let i = 0; i < db.data.length; i += 4) { maxV = Math.max(maxV, db.data[i+1]); minV = Math.min(minV, db.data[i+1]); }
  check("deblur halo limiter bounds overshoot", maxV <= 200 + 30 && minV >= 60 - 30, `range ${minV.toFixed(0)}..${maxV.toFixed(0)}`);
  check("deblur leaves a flat area untouched", Math.abs(meanOf(db, 5, 5, 20, 20) - 60) < 0.5);

  // 5. relight
  const scene = make(W, H, (x) => { const v = x < W / 2 ? 35 : 225; return [v, v, v]; });
  const rl = relight(scene, { ...DEFAULT_RELIGHT, strength: 1, shadows: 1 });
  const dBefore = meanOf(scene, 5, 5, 40, 115), dAfter = meanOf(rl, 5, 5, 40, 115);
  const hBefore = meanOf(scene, 80, 5, 115, 115), hAfter = meanOf(rl, 80, 5, 115, 115);
  check("relight lifts shadows", dAfter > dBefore * 1.4, `${dBefore.toFixed(0)} -> ${dAfter.toFixed(0)}`);
  check("relight protects highlights", Math.abs(hAfter - hBefore) < 4, `${hBefore.toFixed(0)} -> ${hAfter.toFixed(0)}`);
  const rl0 = relight(scene, { ...DEFAULT_RELIGHT, strength: 0 });
  check("relight strength 0 is a no-op", Math.abs(meanOf(rl0, 5, 5, 40, 115) - dBefore) < 0.5);
  const faceScene = make(W, H, () => [60, 60, 60]);
  const rf = relight(faceScene, { ...DEFAULT_RELIGHT, shadows: 0, strength: 1, faceBox: { x: 40, y: 30, width: 40, height: 50 }, faceBoost: 1 });
  check("relight face fill raises the face more than the surroundings", meanOf(rf, 50, 45, 70, 65) > meanOf(rf, 2, 2, 20, 20) + 15, `${meanOf(rf, 50, 45, 70, 65).toFixed(0)} vs ${meanOf(rf, 2, 2, 20, 20).toFixed(0)}`);

  // 6. specks & scratches
  const paper = make(W, H, () => [150, 150, 150]);
  const defects = clonePixels(paper);
  const setPx = (p: Pixels, x: number, y: number, v: number) => { const i = (y * W + x) * 4; p.data[i] = p.data[i+1] = p.data[i+2] = v; };
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) setPx(defects, 30 + dx, 30 + dy, 250);   // 2x2 dust
  for (let y = 10; y < 110; y++) { setPx(defects, 80, y, 40); setPx(defects, 81, y, 40); }              // 2px dark scratch
  const sp = removeSpecks(defects, 0.5);
  check("dust speck removed", Math.abs(sp.pixels.data[(30 * W + 30) * 4 + 1] - 150) < 3);
  check("2-px scratch removed", Math.abs(sp.pixels.data[(60 * W + 80) * 4 + 1] - 150) < 3 && Math.abs(sp.pixels.data[(60 * W + 81) * 4 + 1] - 150) < 3);
  const spClean = removeSpecks(paper, 0.9);
  check("clean image is unchanged by speck removal", spClean.repaired === 0);
  const edgeImg = make(W, H, (x) => { const v = x < W / 2 ? 60 : 200; return [v, v, v]; });
  check("a normal edge is not treated as a defect", removeSpecks(edgeImg, 0.9).repaired === 0);
  const prot = removeSpecks(defects, 0.5, [{ x: 20, y: 20, width: 30, height: 30 }]);
  check("protected region keeps its pixels", prot.pixels.data[(30 * W + 30) * 4 + 1] === 250);

  // 7. fade restore
  const faded = make(W, H, (x) => { const v = 70 + (x / W) * 110; return [v, v, v]; });
  const fr = clonePixels(faded); restoreFade(fr, 1, true);
  const rng = (p: Pixels) => { let lo = 255, hi = 0; for (let i = 0; i < p.data.length; i += 4) { lo = Math.min(lo, p.data[i+1]); hi = Math.max(hi, p.data[i+1]); } return hi - lo; };
  check("fade restore widens the tonal range", rng(fr) > rng(faded) + 40, `${rng(faded).toFixed(0)} -> ${rng(fr).toFixed(0)}`);
  const rp = await restorePhoto(defects, { dust: 0.5, fade: 0.5, denoise: 1, detail: 0.3, protect: [] });
  check("restorePhoto runs end to end and repairs defects", rp.repaired > 100 && rp.notes.length >= 3, rp.notes.join(" | "));

  // 8. alpha safety
  const withAlpha = clonePixels(n8);
  for (let i = 0; i < withAlpha.data.length; i += 4) if ((i / 4) % W < 30) withAlpha.data[i + 3] = 0;
  const alphaOut = await runAutoEnhance(withAlpha, 1);
  let alphaOk = true;
  for (let i = 0; i < withAlpha.data.length; i += 4) {
    if (alphaOut.pixels.data[i + 3] !== withAlpha.data[i + 3]) alphaOk = false;
    if (withAlpha.data[i + 3] === 0 && (alphaOut.pixels.data[i] !== withAlpha.data[i])) alphaOk = false;
  }
  check("alpha channel and transparent pixels are untouched", alphaOk);

  // 9. grayscale detection
  check("grayscale photo detected", isGrayscaleImage(noisy(120, 20)));
  check("colour photo not flagged grayscale", !isGrayscaleImage(make(W, H, (x) => [x * 2, 100, 255 - x * 2])));

  // 10. cancellation + progress
  let cancelled = false;
  try { await denoise(n8, 2, { isCancelled: () => true }); } catch (e) { cancelled = e instanceof EnhanceCancelledError; }
  check("cancellation stops processing with EnhanceCancelledError", cancelled);
  const prog: number[] = []; await denoise(n8, 1, { onProgress: (f) => prog.push(f) });
  check("progress reaches 1 and never decreases", prog[prog.length - 1] === 1 && prog.every((v, i) => i === 0 || v >= prog[i - 1]), `${prog.length} updates`);

  console.log(`\n${pass} passed, ${fail} failed`);
  (globalThis as unknown as { process: { exit(c: number): never } }).process.exit(fail ? 1 : 0);
})();
