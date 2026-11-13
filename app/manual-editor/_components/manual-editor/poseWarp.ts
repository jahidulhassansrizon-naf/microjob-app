/**
 * Pose Fix engine. Pure TypeScript, no dependencies.
 *
 * Every tool is a *backward map*: for each output pixel we compute where to read
 * from in the source image, then sample it bilinearly (alpha-aware).
 *
 * All operations store their coordinates in "width units" (pixels / image width),
 * so the exact same operation list is replayed on the small preview and on the
 * full-resolution photo.
 */

export type SourceFn = (x: number, y: number, out: Float64Array) => void;

export type PinOp = { t: "pins"; pins: { ax: number; ay: number; bx: number; by: number }[]; lockEdges: boolean; reach: number };
export type TiltOp = { t: "tilt"; px: number; py: number; hx: number; hy: number; r: number; angle: number };
export type RotateOp = { t: "rotate"; angle: number; fill: boolean };
export type LiquifyOp = { t: "liquify"; pts: { x: number; y: number }[]; radius: number; strength: number };
/** Levels the shoulders: rotates everything below the neck around (px,py); the rotation fades in over `ramp`. */
export type BodyOp = { t: "body"; px: number; py: number; ramp: number; angle: number };
export type PoseOp = PinOp | TiltOp | RotateOp | LiquifyOp | BodyOp;

const smoothstep = (a: number, b: number, x: number) => {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

/* ------------------------------------------------------------------ */
/* Sampler                                                             */
/* ------------------------------------------------------------------ */

/** dst(x, y) = src(fn(x, y)) for every pixel in [x0,x1) x [y0,y1). */
export function warpRect(
  src: ImageData,
  dst: ImageData,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  fn: SourceFn,
  transparentOutside = false,
) {
  const sd = src.data;
  const dd = dst.data;
  const W = src.width;
  const H = src.height;
  const out = new Float64Array(2);
  x0 = Math.max(0, Math.floor(x0));
  y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(dst.width, Math.ceil(x1));
  y1 = Math.min(dst.height, Math.ceil(y1));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      fn(x, y, out);
      const sx = out[0];
      const sy = out[1];
      const fx = Math.floor(sx);
      const fy = Math.floor(sy);
      const tx = sx - fx;
      const ty = sy - fy;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let k = 0; k < 4; k += 1) {
        const ix = fx + (k & 1);
        const iy = fy + (k >> 1);
        const w = (k & 1 ? tx : 1 - tx) * (k >> 1 ? ty : 1 - ty);
        if (w <= 0) continue;
        if (transparentOutside && (ix < 0 || iy < 0 || ix >= W || iy >= H)) continue;
        const cx = ix < 0 ? 0 : ix >= W ? W - 1 : ix;
        const cy = iy < 0 ? 0 : iy >= H ? H - 1 : iy;
        const i = (cy * W + cx) * 4;
        const pa = sd[i + 3] * w;
        r += sd[i] * pa;
        g += sd[i + 1] * pa;
        b += sd[i + 2] * pa;
        a += pa;
      }
      const o = (y * dst.width + x) * 4;
      if (a <= 0.0001) {
        dd[o] = 0;
        dd[o + 1] = 0;
        dd[o + 2] = 0;
        dd[o + 3] = 0;
      } else {
        dd[o] = r / a;
        dd[o + 1] = g / a;
        dd[o + 2] = b / a;
        dd[o + 3] = a;
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Coarse grid (keeps smooth maps cheap)                                */
/* ------------------------------------------------------------------ */

export function gridSourceFn(width: number, height: number, fn: SourceFn): SourceFn {
  const step = Math.max(3, Math.ceil(Math.max(width, height) / 260));
  const gw = Math.floor((width - 1) / step) + 2;
  const gh = Math.floor((height - 1) / step) + 2;
  const gx = new Float32Array(gw * gh);
  const gy = new Float32Array(gw * gh);
  const tmp = new Float64Array(2);
  for (let j = 0; j < gh; j += 1) {
    for (let i = 0; i < gw; i += 1) {
      fn(i * step, j * step, tmp);
      gx[j * gw + i] = tmp[0];
      gy[j * gw + i] = tmp[1];
    }
  }
  return (x, y, out) => {
    const fx = x / step;
    const fy = y / step;
    let i = Math.floor(fx);
    let j = Math.floor(fy);
    if (i > gw - 2) i = gw - 2;
    if (j > gh - 2) j = gh - 2;
    const tx = fx - i;
    const ty = fy - j;
    const a = j * gw + i;
    const b = a + 1;
    const c = a + gw;
    const d = c + 1;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;
    out[0] = gx[a] * w00 + gx[b] * w10 + gx[c] * w01 + gx[d] * w11;
    out[1] = gy[a] * w00 + gy[b] * w10 + gy[c] * w01 + gy[d] * w11;
  };
}

/* ------------------------------------------------------------------ */
/* 1. Pin warp (Moving Least Squares, rigid)                            */
/* ------------------------------------------------------------------ */

/**
 * `a` = where a pin was (source), `b` = where the person dragged it (destination).
 * Pins that were not dragged have a == b, so they stay where they are.
 * Rigid MLS keeps the dragged part rotating/moving like a real object instead of stretching.
 */
export function pinsSourceFn(pins: { ax: number; ay: number; bx: number; by: number }[], reach: number): SourceFn {
  const n = pins.length;
  const alpha = Math.min(2.2, Math.max(0.5, reach));
  const w = new Float64Array(n);
  return (x, y, out) => {
    let sw = 0;
    let pxs = 0;
    let pys = 0;
    let qxs = 0;
    let qys = 0;
    for (let i = 0; i < n; i += 1) {
      const dx = x - pins[i].bx;
      const dy = y - pins[i].by;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1e-6) {
        out[0] = pins[i].ax;
        out[1] = pins[i].ay;
        return;
      }
      const wi = Math.pow(d2, -alpha);
      w[i] = wi;
      sw += wi;
      pxs += wi * pins[i].bx;
      pys += wi * pins[i].by;
      qxs += wi * pins[i].ax;
      qys += wi * pins[i].ay;
    }
    pxs /= sw;
    pys /= sw;
    qxs /= sw;
    qys /= sw;
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i += 1) {
      const px = pins[i].bx - pxs;
      const py = pins[i].by - pys;
      const qx = pins[i].ax - qxs;
      const qy = pins[i].ay - qys;
      re += w[i] * (px * qx + py * qy);
      im += w[i] * (px * qy - py * qx);
    }
    const m = Math.hypot(re, im);
    if (m < 1e-12) {
      re = 1;
      im = 0;
    } else {
      re /= m;
      im /= m;
    }
    const vx = x - pxs;
    const vy = y - pys;
    out[0] = re * vx - im * vy + qxs;
    out[1] = im * vx + re * vy + qys;
  };
}

/** Pins in pixels + 8 fixed edge pins (so the background does not swirl). */
export function pinsFor(op: PinOp, width: number, height: number) {
  const pins = op.pins.map((p) => ({ ax: p.ax * width, ay: p.ay * width, bx: p.bx * width, by: p.by * width }));
  if (op.lockEdges) {
    const xs = [0, (width - 1) / 2, width - 1];
    const ys = [0, (height - 1) / 2, height - 1];
    for (const x of xs) for (const y of ys) {
      if (x === xs[1] && y === ys[1]) continue;
      pins.push({ ax: x, ay: y, bx: x, by: y });
    }
  }
  return pins;
}

/* ------------------------------------------------------------------ */
/* 2. Head / neck tilt                                                  */
/* ------------------------------------------------------------------ */

/** Rotates the head area around the neck point; the rotation fades out smoothly into neck and shoulders. */
export function tiltSourceFn(op: TiltOp, width: number): SourceFn {
  const px = op.px * width;
  const py = op.py * width;
  const hx = op.hx * width;
  const hy = op.hy * width;
  const r = Math.max(4, op.r * width);
  const L = Math.max(1, Math.hypot(hx - px, hy - py));
  const ux = (hx - px) / L;
  const uy = (hy - py) / L;
  const soft = 0.6 * L;
  const weight = (qx: number, qy: number) => {
    const t = (qx - px) * ux + (qy - py) * uy;
    const wv = smoothstep(0, soft, t);
    if (wv <= 0) return 0;
    const wr = 1 - smoothstep(r, r * 1.7, Math.hypot(qx - hx, qy - hy));
    return wv * wr;
  };
  return (x, y, out) => {
    let qx = x;
    let qy = y;
    for (let k = 0; k < 5; k += 1) {
      const th = -op.angle * weight(qx, qy);
      const c = Math.cos(th);
      const s = Math.sin(th);
      const vx = x - px;
      const vy = y - py;
      qx = px + c * vx - s * vy;
      qy = py + s * vx + c * vy;
    }
    out[0] = qx;
    out[1] = qy;
  };
}

/* ------------------------------------------------------------------ */
/* 2b. Shoulder / torso level                                           */
/* ------------------------------------------------------------------ */

export function bodySourceFn(op: BodyOp, width: number): SourceFn {
  const px = op.px * width;
  const py = op.py * width;
  const ramp = Math.max(1, op.ramp * width);
  return (x, y, out) => {
    let qx = x;
    let qy = y;
    for (let k = 0; k < 5; k += 1) {
      const th = -op.angle * smoothstep(py, py + ramp, qy);
      const c = Math.cos(th);
      const s = Math.sin(th);
      const vx = x - px;
      const vy = y - py;
      qx = px + c * vx - s * vy;
      qy = py + s * vx + c * vy;
    }
    out[0] = qx;
    out[1] = qy;
  };
}

/* ------------------------------------------------------------------ */
/* 3. Whole-photo rotate                                                */
/* ------------------------------------------------------------------ */

export function rotateScale(angle: number, width: number, height: number) {
  const ratio = Math.max(width / height, height / width);
  return Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)) * ratio;
}

export function rotateSourceFn(op: RotateOp, width: number, height: number): SourceFn {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const s = op.fill ? rotateScale(op.angle, width, height) : 1;
  const c = Math.cos(-op.angle);
  const sn = Math.sin(-op.angle);
  return (x, y, out) => {
    const vx = (x - cx) / s;
    const vy = (y - cy) / s;
    out[0] = cx + c * vx - sn * vy;
    out[1] = cy + sn * vx + c * vy;
  };
}

/* ------------------------------------------------------------------ */
/* 4. Liquify (push brush)                                              */
/* ------------------------------------------------------------------ */

export type LiquifyField = { ox: number; oy: number; w: number; h: number; dx: Float32Array; dy: Float32Array };

export function createLiquifyField(ox: number, oy: number, w: number, h: number): LiquifyField {
  return { ox, oy, w, h, dx: new Float32Array(w * h), dy: new Float32Array(w * h) };
}

/** Adds one push segment a -> b to the field. Returns the dirty rectangle (image coordinates). */
export function liquifySegment(field: LiquifyField, ax: number, ay: number, bx: number, by: number, radius: number, strength: number) {
  const mx = bx - ax;
  const my = by - ay;
  const left = Math.max(field.ox, Math.floor(bx - radius));
  const top = Math.max(field.oy, Math.floor(by - radius));
  const right = Math.min(field.ox + field.w, Math.ceil(bx + radius) + 1);
  const bottom = Math.min(field.oy + field.h, Math.ceil(by + radius) + 1);
  const r2 = radius * radius;
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const d2 = (x - bx) * (x - bx) + (y - by) * (y - by);
      if (d2 >= r2) continue;
      const f = 1 - d2 / r2;
      const k = f * f * strength;
      const i = (y - field.oy) * field.w + (x - field.ox);
      // content moves with the brush, so each pixel reads from "behind" the push
      field.dx[i] -= mx * k;
      field.dy[i] -= my * k;
    }
  }
  return { left, top, right, bottom };
}

export function renderLiquify(src: ImageData, dst: ImageData, field: LiquifyField, rect: { left: number; top: number; right: number; bottom: number }) {
  const fn: SourceFn = (x, y, out) => {
    const lx = x - field.ox;
    const ly = y - field.oy;
    if (lx < 0 || ly < 0 || lx >= field.w || ly >= field.h) {
      out[0] = x;
      out[1] = y;
      return;
    }
    const i = ly * field.w + lx;
    out[0] = x + field.dx[i];
    out[1] = y + field.dy[i];
  };
  warpRect(src, dst, rect.left, rect.top, rect.right, rect.bottom, fn);
}

/** Space between recorded stroke points, in px. Replay uses the same rule. */
export const liquifyStepPx = (radiusPx: number) => Math.max(1, radiusPx / 6);

function applyLiquify(base: ImageData, op: LiquifyOp): ImageData {
  const W = base.width;
  const radius = op.radius * W;
  const pts = op.pts.map((p) => ({ x: p.x * W, y: p.y * W }));
  if (pts.length < 2) return base;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const ox = Math.max(0, Math.floor(minX - radius - 2));
  const oy = Math.max(0, Math.floor(minY - radius - 2));
  const ex = Math.min(base.width, Math.ceil(maxX + radius + 2));
  const ey = Math.min(base.height, Math.ceil(maxY + radius + 2));
  if (ex <= ox || ey <= oy) return base;
  const field = createLiquifyField(ox, oy, ex - ox, ey - oy);
  for (let i = 1; i < pts.length; i += 1) {
    liquifySegment(field, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, radius, op.strength);
  }
  const out = cloneImageData(base);
  renderLiquify(base, out, field, { left: ox, top: oy, right: ex, bottom: ey });
  return out;
}

/* ------------------------------------------------------------------ */
/* Replay                                                               */
/* ------------------------------------------------------------------ */

/** Applies one operation to `base` and returns a new image of the same size. */
export function applyPoseOp(base: ImageData, op: PoseOp): ImageData {
  const { width, height } = base;
  if (op.t === "liquify") return applyLiquify(base, op);
  let fn: SourceFn;
  let transparentOutside = false;
  if (op.t === "pins") {
    const pins = pinsFor(op, width, height);
    if (pins.length < 1) return base;
    fn = gridSourceFn(width, height, pinsSourceFn(pins, op.reach));
  } else if (op.t === "tilt") {
    fn = gridSourceFn(width, height, tiltSourceFn(op, width));
  } else if (op.t === "body") {
    fn = gridSourceFn(width, height, bodySourceFn(op, width));
  } else {
    fn = gridSourceFn(width, height, rotateSourceFn(op, width, height));
    transparentOutside = !op.fill;
  }
  const out = new ImageData(width, height);
  warpRect(base, out, 0, 0, width, height, fn, transparentOutside);
  return out;
}

export function applyPoseOps(base: ImageData, ops: PoseOp[]): ImageData {
  let current = base;
  for (const op of ops) current = applyPoseOp(current, op);
  return current;
}
