"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Hand, Loader2, Pin, Redo2, RotateCcw, RotateCw, Sparkles, Undo2, User, UserCog, Shirt, X } from "lucide-react";
import type { PhotoAsset } from "./types";
import { useManualEditor } from "./EditorProvider";
import { useManualEditorText } from "./manualEditorI18n";
import { measureBody, measureFace, preloadFaceLandmarker, preloadPoseLandmarker } from "./faceAlign";
import {
  applyPoseOp,
  applyPoseOps,
  cloneImageData,
  createLiquifyField,
  liquifySegment,
  liquifyStepPx,
  renderLiquify,
  type LiquifyField,
  type PoseOp,
} from "./poseWarp";

type ToolId = "pins" | "tilt" | "body" | "rotate" | "liquify";
type PinPt = { id: number; ax: number; ay: number; bx: number; by: number };
type Pt = { x: number; y: number };
type TiltState = { px: number; py: number; hx: number; hy: number; r: number; angle: number };
type BodyState = { px: number; py: number; ramp: number; angle: number };

type Drag =
  | { kind: "pin"; id: number }
  | { kind: "pivot" }
  | { kind: "head" }
  | { kind: "handle" }
  | { kind: "bpivot" }
  | { kind: "bhandle" }
  | { kind: "ruler"; start: Pt };

type Stroke = { pts: Pt[]; radius: number; strength: number; snapshot: ImageData; work: ImageData; field: LiquifyField };

const PREVIEW_MAX = 1000;
const MAX_TILT = Math.PI / 3;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const deg = (rad: number) => (rad * 180) / Math.PI;
const rad = (d: number) => (d * Math.PI) / 180;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The photo could not be loaded."));
    image.src = url;
  });
}

type Props = { sourcePhoto: PhotoAsset; onClose: () => void };

export default function PoseFixModal({ sourcePhoto, onClose }: Props) {
  const { applyRetouchedFile, setAiNotice, setActiveAiTool } = useManualEditor();
  const { locale } = useManualEditorText();
  const bn = String(locale ?? "").toLowerCase().startsWith("bn");
  const tx = useCallback((b: string, e: string) => (bn ? b : e), [bn]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const origRef = useRef<ImageData | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const opsRef = useRef<PoseOp[]>([]);
  const redoRef = useRef<PoseOp[]>([]);
  const pendingRef = useRef<PoseOp | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const rafRef = useRef(0);
  const pinIdRef = useRef(1);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tool, setTool] = useState<ToolId>("pins");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [fitScale, setFitScale] = useState(1);
  const [guides, setGuides] = useState(true);
  const [showOrig, setShowOrig] = useState(false);
  const [hover, setHover] = useState<Pt | null>(null);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMsg, setAutoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [pins, setPins] = useState<PinPt[]>([]);
  const [lockEdges, setLockEdges] = useState(true);
  const [spread, setSpread] = useState(50);
  const [tilt, setTilt] = useState<TiltState>({ px: 0, py: 0, hx: 0, hy: 0, r: 0, angle: 0 });
  const [bodyS, setBodyS] = useState<BodyState>({ px: 0, py: 0, ramp: 0, angle: 0 });
  const [rotAngle, setRotAngle] = useState(0);
  const [rotFill, setRotFill] = useState(true);
  const [ruler, setRuler] = useState<{ a: Pt; b: Pt } | null>(null);
  const [brush, setBrush] = useState(80);
  const [strength, setStrength] = useState(85);

  const pw = size.w;
  const ph = size.h;
  const reach = 2.0 - (spread / 100) * 1.4;

  /* ---------------- load photo (small preview copy) ---------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const image = await loadImage(sourcePhoto.url);
        if (cancelled) return;
        const scale = Math.min(1, PREVIEW_MAX / Math.max(image.naturalWidth, image.naturalHeight));
        const w = Math.max(2, Math.round(image.naturalWidth * scale));
        const h = Math.max(2, Math.round(image.naturalHeight * scale));
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        if (!canvas || !ctx) throw new Error("The editing canvas could not be started.");
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingQuality = "high";
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(image, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        origRef.current = data;
        baseRef.current = data;
        setSize({ w, h });
        setTilt({ px: w * 0.5, py: h * 0.68, hx: w * 0.5, hy: h * 0.38, r: w * 0.28, angle: 0 });
        setBodyS({ px: w * 0.5, py: h * 0.66, ramp: w * 0.22, angle: 0 });
        setBrush(Math.round(w / 8));
        setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "The editor could not be opened.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      origRef.current = null;
      baseRef.current = null;
    };
  }, [sourcePhoto]);

  /* ---------------- fit to screen ---------------- */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !pw) return;
    const update = () => {
      const rect = viewport.getBoundingClientRect();
      const scale = Math.min((rect.width - 8) / pw, (rect.height - 8) / ph);
      setFitScale(scale > 0 && Number.isFinite(scale) ? scale : 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [pw, ph]);

  const displayWidth = pw * fitScale * (zoom / 100);
  const displayHeight = ph * fitScale * (zoom / 100);
  const unit = pw && displayWidth ? pw / displayWidth : 1; // preview px per screen px

  /* ---------------- the operation currently being set up ---------------- */
  const pendingOp = useMemo<PoseOp | null>(() => {
    if (!pw) return null;
    if (tool === "pins") {
      if (!pins.some((p) => Math.hypot(p.bx - p.ax, p.by - p.ay) > 0.5)) return null;
      return { t: "pins", lockEdges, reach, pins: pins.map((p) => ({ ax: p.ax / pw, ay: p.ay / pw, bx: p.bx / pw, by: p.by / pw })) };
    }
    if (tool === "tilt") {
      if (Math.abs(tilt.angle) < 1e-4) return null;
      return { t: "tilt", px: tilt.px / pw, py: tilt.py / pw, hx: tilt.hx / pw, hy: tilt.hy / pw, r: tilt.r / pw, angle: tilt.angle };
    }
    if (tool === "body") {
      if (Math.abs(bodyS.angle) < 1e-4) return null;
      return { t: "body", px: bodyS.px / pw, py: bodyS.py / pw, ramp: bodyS.ramp / pw, angle: bodyS.angle };
    }
    if (tool === "rotate") {
      if (Math.abs(rotAngle) < 1e-4) return null;
      return { t: "rotate", angle: rotAngle, fill: rotFill };
    }
    return null;
  }, [tool, pins, lockEdges, reach, tilt, bodyS, rotAngle, rotFill, pw]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const base = baseRef.current;
    if (!canvas || !ctx || !base) return;
    if (strokeRef.current) return;
    if (showOrig && origRef.current) {
      ctx.putImageData(origRef.current, 0, 0);
      return;
    }
    const op = pendingRef.current;
    ctx.putImageData(op ? applyPoseOp(base, op) : base, 0, 0);
  }, [showOrig]);

  useEffect(() => {
    pendingRef.current = pendingOp;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  }, [pendingOp, draw, tick]);

  /* ---------------- history ---------------- */
  const resetPending = useCallback(() => {
    pendingRef.current = null;
    setPins([]);
    setTilt((t) => ({ ...t, angle: 0 }));
    setBodyS((b) => ({ ...b, angle: 0 }));
    setRotAngle(0);
    setRuler(null);
  }, []);

  const commitPending = useCallback(() => {
    const op = pendingRef.current;
    const base = baseRef.current;
    if (!op || !base) return false;
    baseRef.current = applyPoseOp(base, op);
    opsRef.current = [...opsRef.current, op];
    redoRef.current = [];
    resetPending();
    setTick((v) => v + 1);
    return true;
  }, [resetPending]);

  const undo = useCallback(() => {
    if (pendingRef.current || pins.length) {
      resetPending();
      return;
    }
    const orig = origRef.current;
    if (!orig || opsRef.current.length === 0) return;
    const ops = opsRef.current.slice();
    const last = ops.pop() as PoseOp;
    redoRef.current = [...redoRef.current, last];
    opsRef.current = ops;
    baseRef.current = applyPoseOps(orig, ops);
    setTick((v) => v + 1);
  }, [pins.length, resetPending]);

  const redo = useCallback(() => {
    const base = baseRef.current;
    const next = redoRef.current[redoRef.current.length - 1];
    if (!base || !next) return;
    redoRef.current = redoRef.current.slice(0, -1);
    opsRef.current = [...opsRef.current, next];
    baseRef.current = applyPoseOp(base, next);
    setTick((v) => v + 1);
  }, []);

  const resetAll = useCallback(() => {
    resetPending();
    opsRef.current = [];
    redoRef.current = [];
    baseRef.current = origRef.current;
    setTick((v) => v + 1);
  }, [resetPending]);

  /* ---------------- one-click auto straighten (shoulders -> head -> neck) ---------------- */
  const runAuto = async () => {
    if (loading || busy || autoBusy || !pw) return;
    commitPending();
    setAutoBusy(true);
    setAutoMsg(null);
    try {
      const snap = () => {
        const base = baseRef.current as ImageData;
        const canvas = document.createElement("canvas");
        canvas.width = base.width;
        canvas.height = base.height;
        canvas.getContext("2d")?.putImageData(base, 0, 0);
        return canvas;
      };
      const push = (op: PoseOp) => {
        baseRef.current = applyPoseOp(baseRef.current as ImageData, op);
        opsRef.current = [...opsRef.current, op];
        redoRef.current = [];
        setTick((v) => v + 1);
      };
      const done: string[] = [];

      let face = await measureFace(snap());
      let body = await measureBody(snap());

      // 1) shoulders level: rotate everything below the neck around the neck base
      if (body && Math.abs(body.roll) > rad(0.5)) {
        const sRoll = body.roll;
        const neckY = face.chin.y + 0.2 * Math.max(10, body.mid.y - face.chin.y);
        const ramp = Math.max(10, 0.8 * (body.mid.y - face.chin.y));
        push({ t: "body", px: body.mid.x / pw, py: neckY / pw, ramp: ramp / pw, angle: clamp(-sRoll, -rad(15), rad(15)) });
        done.push(tx(`কাঁধ ${Math.abs(deg(sRoll)).toFixed(1)}° কাত ছিল, লেভেল করা হয়েছে`, `shoulders were ${Math.abs(deg(sRoll)).toFixed(1)}° off, levelled`));
        face = await measureFace(snap());
        body = await measureBody(snap());
      }

      // 2) head upright: eyes, nose and chin line (up to 2 measuring passes)
      let headRoll = 0;
      for (let pass = 0; pass < 2; pass += 1) {
        if (Math.abs(face.roll) < rad(0.4)) break;
        if (pass === 0) headRoll = face.roll;
        push({
          t: "tilt",
          px: face.pivot.x / pw,
          py: face.pivot.y / pw,
          hx: face.head.x / pw,
          hy: face.head.y / pw,
          r: face.r / pw,
          angle: clamp(-face.roll, -MAX_TILT, MAX_TILT),
        });
        face = await measureFace(snap());
      }
      if (headRoll !== 0) done.push(tx(`মাথা ${Math.abs(deg(headRoll)).toFixed(1)}° কাত ছিল, সোজা করা হয়েছে`, `head was ${Math.abs(deg(headRoll)).toFixed(1)}° tilted, straightened`));

      // 3) neck: bring the head over the middle of the shoulders
      body = await measureBody(snap());
      if (body) {
        const dx = body.mid.x - face.chin.x;
        const limit = 0.3 * face.faceWidth;
        if (Math.abs(dx) > 0.04 * face.faceWidth) {
          const move = clamp(dx, -limit, limit);
          const below = { x: body.mid.x, y: Math.min(snap().height - 2, body.mid.y + 1.2 * face.faceHeight) };
          const fixed = [body.a, body.b, below];
          const moved = [face.top, face.bridge, face.chin];
          push({
            t: "pins",
            lockEdges: true,
            reach: 1.3,
            pins: [
              ...fixed.map((q) => ({ ax: q.x / pw, ay: q.y / pw, bx: q.x / pw, by: q.y / pw })),
              ...moved.map((q) => ({ ax: q.x / pw, ay: q.y / pw, bx: (q.x + move) / pw, by: q.y / pw })),
            ],
          });
          done.push(tx("মাথা কাঁধের মাঝ বরাবর আনা হয়েছে", "head centred over the shoulders"));
        }
      }

      let text: string;
      if (done.length === 0) {
        text = tx("ছবি আগে থেকেই প্রায় সোজা আছে, কিছু বদলানো হয়নি।", "The photo is already almost straight. Nothing was changed.");
      } else {
        text = done.join(tx("। ", ". ")) + tx("। পছন্দ না হলে আনডু করুন।", ". Undo if you do not like it.");
      }
      if (!body) {
        text += tx(" (দুই কাঁধ পুরো দেখা যায়নি, তাই শুধু মাথা ঠিক করা হয়েছে।)", " (Both shoulders were not clearly visible, so only the head was corrected.)");
      }
      setAutoMsg({ ok: true, text });
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      setAutoMsg({
        ok: false,
        text:
          code === "NO_FACE"
            ? tx("ছবিতে মুখ পাওয়া যায়নি। মুখ পুরোটা দেখা যায় এমন ছবি দিন, অথবা নিচের টুলগুলো হাতে ব্যবহার করুন।", "No face was found. Use a photo where the whole face is visible, or use the manual tools below.")
            : code === "FACE_MODEL_LOAD"
              ? tx("মুখ চেনার মডেল লোড হয়নি। ইন্টারনেট চালু আছে কিনা দেখে আবার চেষ্টা করুন।", "The face model could not be loaded. Check your internet connection and try again.")
              : tx("অটো সোজা করা যায়নি। নিচের টুলগুলো হাতে ব্যবহার করুন।", "Auto straighten failed. Please use the manual tools below."),
      });
    } finally {
      setAutoBusy(false);
    }
  };

  const switchTool = (next: ToolId) => {
    if (next === tool) return;
    commitPending();
    setPins([]);
    setRuler(null);
    setTool(next);
  };

  /* ---------------- pointer helpers ---------------- */
  const getPt = (event: ReactPointerEvent<SVGSVGElement> | { clientX: number; clientY: number }): Pt | null => {
    const svg = svgRef.current;
    if (!svg || !pw) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return null;
    return { x: ((event.clientX - rect.left) * pw) / rect.width, y: ((event.clientY - rect.top) * ph) / rect.height };
  };

  // tilt geometry (rotated live)
  const tiltGeo = useMemo(() => {
    const dx = tilt.hx - tilt.px;
    const dy = tilt.hy - tilt.py;
    const L = Math.max(1, Math.hypot(dx, dy));
    const c = Math.cos(tilt.angle);
    const s = Math.sin(tilt.angle);
    const rot = (vx: number, vy: number) => ({ x: tilt.px + c * vx - s * vy, y: tilt.py + s * vx + c * vy });
    const head = rot(dx, dy);
    const handle = rot((dx / L) * (L + tilt.r * 1.2), (dy / L) * (L + tilt.r * 1.2));
    return { L, head, handle, baseAngle: Math.atan2(dy, dx) };
  }, [tilt]);

  const bodyGeo = useMemo(() => {
    const len = pw * 0.36;
    const c = Math.cos(bodyS.angle);
    const sn = Math.sin(bodyS.angle);
    return {
      len,
      left: { x: bodyS.px - c * len, y: bodyS.py - sn * len },
      handle: { x: bodyS.px + c * len, y: bodyS.py + sn * len },
    };
  }, [bodyS, pw]);

  const hitPin = (p: Pt) => {
    let best: PinPt | null = null;
    let bestD = 14 * unit;
    for (const pin of pins) {
      const d = Math.hypot(pin.bx - p.x, pin.by - p.y);
      if (d <= bestD) {
        best = pin;
        bestD = d;
      }
    }
    return best;
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (loading || busy || event.button === 2) return;
    const p = getPt(event);
    if (!p) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "pins") {
      const hit = hitPin(p);
      if (hit) {
        dragRef.current = { kind: "pin", id: hit.id };
      } else {
        const id = pinIdRef.current++;
        setPins((list) => [...list, { id, ax: p.x, ay: p.y, bx: p.x, by: p.y }]);
        dragRef.current = { kind: "pin", id };
      }
      return;
    }
    if (tool === "tilt") {
      const near = (q: Pt) => Math.hypot(q.x - p.x, q.y - p.y) <= 16 * unit;
      if (near(tiltGeo.handle)) dragRef.current = { kind: "handle" };
      else if (near({ x: tilt.px, y: tilt.py }) && Math.abs(tilt.angle) < 1e-4) dragRef.current = { kind: "pivot" };
      else if (near(tiltGeo.head) && Math.abs(tilt.angle) < 1e-4) dragRef.current = { kind: "head" };
      return;
    }
    if (tool === "body") {
      const near = (q: Pt) => Math.hypot(q.x - p.x, q.y - p.y) <= 18 * unit;
      if (near(bodyGeo.handle)) dragRef.current = { kind: "bhandle" };
      else if (near({ x: bodyS.px, y: bodyS.py }) && Math.abs(bodyS.angle) < 1e-4) dragRef.current = { kind: "bpivot" };
      return;
    }
    if (tool === "rotate") {
      dragRef.current = { kind: "ruler", start: p };
      setRuler({ a: p, b: p });
      return;
    }
    // liquify
    const base = baseRef.current;
    if (!base) return;
    const radius = brush;
    strokeRef.current = {
      pts: [p],
      radius,
      strength: strength / 100,
      snapshot: base,
      work: cloneImageData(base),
      field: createLiquifyField(0, 0, base.width, base.height),
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const p = getPt(event);
    if (!p) return;
    if (tool === "liquify") setHover(p);

    const stroke = strokeRef.current;
    if (stroke) {
      const last = stroke.pts[stroke.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < liquifyStepPx(stroke.radius)) return;
      const rect = liquifySegment(stroke.field, last.x, last.y, p.x, p.y, stroke.radius, stroke.strength);
      renderLiquify(stroke.snapshot, stroke.work, stroke.field, rect);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && rect.right > rect.left && rect.bottom > rect.top) {
        ctx.putImageData(stroke.work, 0, 0, rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
      }
      stroke.pts.push(p);
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const x = clamp(p.x, 0, pw - 1);
    const y = clamp(p.y, 0, ph - 1);
    if (drag.kind === "pin") {
      setPins((list) => list.map((pin) => (pin.id === drag.id ? { ...pin, bx: x, by: y } : pin)));
    } else if (drag.kind === "pivot") {
      setTilt((t) => ({ ...t, px: x, py: y }));
    } else if (drag.kind === "head") {
      setTilt((t) => ({ ...t, hx: x, hy: y }));
    } else if (drag.kind === "handle") {
      let a = Math.atan2(p.y - tilt.py, p.x - tilt.px) - tiltGeo.baseAngle;
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      setTilt((t) => ({ ...t, angle: clamp(a, -MAX_TILT, MAX_TILT) }));
    } else if (drag.kind === "bpivot") {
      setBodyS((b) => ({ ...b, px: x, py: y }));
    } else if (drag.kind === "bhandle") {
      const a = Math.atan2(p.y - bodyS.py, Math.abs(p.x - bodyS.px) + 1e-6);
      setBodyS((b) => ({ ...b, angle: clamp(a, -rad(30), rad(30)) }));
    } else if (drag.kind === "ruler") {
      setRuler({ a: drag.start, b: p });
    }
  };

  const finishPointer = () => {
    const stroke = strokeRef.current;
    if (stroke) {
      strokeRef.current = null;
      if (stroke.pts.length >= 2) {
        const op: PoseOp = {
          t: "liquify",
          pts: stroke.pts.map((q) => ({ x: q.x / pw, y: q.y / pw })),
          radius: stroke.radius / pw,
          strength: stroke.strength,
        };
        baseRef.current = stroke.work;
        opsRef.current = [...opsRef.current, op];
        redoRef.current = [];
        setTick((v) => v + 1);
      }
      return;
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag?.kind === "ruler" && ruler) {
      const a = ruler.a.x <= ruler.b.x ? ruler.a : ruler.b;
      const b = ruler.a.x <= ruler.b.x ? ruler.b : ruler.a;
      if (Math.hypot(b.x - a.x, b.y - a.y) > 20 * unit) {
        // make the drawn line horizontal: rotate by minus its own angle
        setRotAngle(clamp(-Math.atan2(b.y - a.y, b.x - a.x), -rad(30), rad(30)));
      } else {
        setRuler(null);
      }
    }
  };

  const removePinAt = (event: { clientX: number; clientY: number; preventDefault: () => void }) => {
    if (tool !== "pins") return;
    event.preventDefault();
    const p = getPt(event);
    if (!p) return;
    const hit = hitPin(p);
    if (hit) setPins((list) => list.filter((pin) => pin.id !== hit.id));
  };

  /* ---------------- close / save ---------------- */
  const hasChanges = () => opsRef.current.length > 0 || Boolean(pendingRef.current);

  const close = useCallback(() => {
    if (busy) return;
    if (hasChanges() && !window.confirm(bn ? "আপনার করা পরিবর্তনগুলো বাতিল করবেন?" : "Discard your changes?")) return;
    setActiveAiTool(null);
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, bn, onClose, setActiveAiTool]);

  const save = async () => {
    if (loading || busy || error) return;
    commitPending();
    if (opsRef.current.length === 0) {
      setActiveAiTool(null);
      onClose();
      return;
    }
    setBusy(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      // Re-run every step on the full-resolution photo so quality is not reduced.
      const image = await loadImage(sourcePhoto.url);
      const w = image.naturalWidth;
      const h = image.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("The edited photo could not be created.");
      ctx.drawImage(image, 0, 0);
      const result = applyPoseOps(ctx.getImageData(0, 0, w, h), opsRef.current);
      ctx.putImageData(result, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("The edited photo could not be created."))), "image/png");
      });
      const name = sourcePhoto.file.name.replace(/\.[^/.]+$/, "");
      const file = new File([blob], `${name}-pose.png`, { type: "image/png" });
      await applyRetouchedFile(file, sourcePhoto.file);
      setAiNotice("Pose fix applied.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The edit could not be saved. Your photo was not changed.");
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, redo, undo]);

  /* ---------------- text ---------------- */
  const TOOLS: { id: ToolId; label: string; icon: typeof Pin; hint: string }[] = [
    {
      id: "pins",
      label: tx("পিন দিয়ে টানুন", "Pin pull"),
      icon: Pin,
      hint: tx(
        "১) যে অংশ নড়বে না (কাঁধ, বুক) সেখানে ক্লিক করে পিন বসান। ২) যে অংশ সোজা করতে চান (মাথা, ঘাড়) সেখানে পিন বসিয়ে মাউস দিয়ে ধরে টানুন। পিন মুছতে ডাবল ক্লিক বা রাইট ক্লিক করুন।",
        "1) Click to drop pins on parts that must stay (shoulders, chest). 2) Drop a pin on the part to straighten (head, neck) and drag it. Double-click or right-click a pin to delete it.",
      ),
    },
    {
      id: "tilt",
      label: tx("মাথা/ঘাড় ঘোরান", "Head & neck"),
      icon: User,
      hint: tx(
        "নীল বিন্দু = ঘাড়ের গোড়া (যেখানে ঘুরবে), সবুজ বিন্দু = মাথার মাঝখান। দুটোকে টেনে ঠিক জায়গায় বসান। তারপর লাল বিন্দুটা ধরে ঘোরান, ঘাড় সোজা হলে ছাড়ুন। সাইডের স্লাইডারও কাজ করে।",
        "Blue dot = neck base (the pivot), green dot = middle of the head. Drag both into place, then drag the red dot around to turn the head upright. The slider works too.",
      ),
    },
    {
      id: "liquify",
      label: tx("ব্রাশে ঠেলুন", "Push brush"),
      icon: Hand,
      hint: tx(
        "ছবির উপর মাউস চেপে টানলে ব্রাশের নিচের অংশটা সেই দিকে সরে যায়। কাঁধ, কলার, থুতনি বা চুলের কিনারা অল্প অল্প করে ঠেলে ঠিক করুন। ছোট ছোট টান দিন।",
        "Press and drag: the area under the brush follows the mouse. Nudge shoulders, collar, chin or hair edges with small strokes.",
      ),
    },
    {
      id: "body",
      label: tx("শরীর/কাঁধ ঘোরান", "Body & shoulders"),
      icon: Shirt,
      hint: tx(
        "নীল বিন্দু = ঘাড়ের গোড়া (এর নিচের অংশ ঘুরবে, মাথা নড়বে না)। বিন্দুটা ঘাড়ের গোড়ায় বসান, তারপর কাঁধের লাইনের ধারের লাল বিন্দুটা ধরে ঘোরান, কাঁধ লেভেল হলে ছাড়ুন। ঘাড় কতটা নরমভাবে বাঁকবে সেটা সাইডের স্লাইডারে ঠিক করুন।",
        "Blue dot = neck base (everything below it turns, the head stays). Place it at the neck base, then drag the red dot at the end of the shoulder line until the shoulders are level. The slider sets how softly the neck bends.",
      ),
    },
    {
      id: "rotate",
      label: tx("পুরো ছবি সোজা", "Straighten"),
      icon: RotateCw,
      hint: tx(
        "ছবি পুরোটাই কাত হলে: দুই চোখের উপর দিয়ে (বা দুই কাঁধের উপর দিয়ে) একটা লাইন টানুন, ছবি নিজে সোজা হয়ে যাবে। অথবা স্লাইডার দিয়ে ঠিক করুন।",
        "If the whole photo is crooked: drag a line across both eyes (or both shoulders) and the photo levels itself. Or use the slider.",
      ),
    },
  ];
  const activeTool = TOOLS.find((item) => item.id === tool) as (typeof TOOLS)[number];
  const disabled = loading || busy;
  const canUndo = Boolean(pendingOp) || pins.length > 0 || opsRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;
  const stepCount = opsRef.current.length;
  const mark = 9 * unit;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#211a13]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pose-fix-title">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E3D6B8] bg-[#F7EEDB] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-[#E3D6B8] px-4 py-3 sm:px-5">
          <div>
            <h2 id="pose-fix-title" className="text-base font-extrabold text-[#3B2F1E] sm:text-lg">{tx("ভঙ্গি সোজা করুন", "Pose Fix")}</h2>
            <p className="mt-0.5 text-xs text-[#6B5A40]">{tx("বাঁকা মাথা, ঘাড় বা কাঁধ মাউস দিয়ে ধরে টেনে সোজা করুন। কাজ আপনার ব্রাউজারেই হয়।", "Straighten a tilted head, neck or shoulders by dragging. Everything runs in your browser.")}</p>
          </div>
          <button type="button" onClick={close} disabled={busy} className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#3B2F1E] hover:bg-[#EFE3C8] disabled:opacity-50" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_290px]">
          <div className="relative flex min-h-[320px] flex-col gap-2 p-3 sm:p-4">
            <div ref={viewportRef} className="relative h-[62vh] overflow-auto rounded-xl border border-[#D8C9A6] bg-[#EFE5CE]">
              <div className={`relative m-auto ${loading ? "invisible" : "visible"}`} style={{ width: displayWidth || undefined, height: displayHeight || undefined, backgroundColor: "#fff", backgroundImage: "linear-gradient(45deg,#e7e0d2 25%,transparent 25%),linear-gradient(-45deg,#e7e0d2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e7e0d2 75%),linear-gradient(-45deg,transparent 75%,#e7e0d2 75%)", backgroundSize: "20px 20px", backgroundPosition: "0 0,0 10px,10px -10px,-10px 0" }}>
                <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-label="Photo" />
                {pw > 0 && (
                  <svg ref={svgRef} viewBox={`0 0 ${pw} ${ph}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} onPointerLeave={() => setHover(null)} onDoubleClick={removePinAt} onContextMenu={removePinAt} className={`absolute inset-0 block h-full w-full touch-none ${tool === "liquify" ? "cursor-none" : "cursor-crosshair"}`}>
                    {guides && (
                      <g stroke="#ffffff" strokeOpacity={0.55} strokeWidth={unit} strokeDasharray={`${6 * unit} ${6 * unit}`} pointerEvents="none">
                        <line x1={pw / 2} y1={0} x2={pw / 2} y2={ph} />
                        <line x1={0} y1={ph / 3} x2={pw} y2={ph / 3} />
                        <line x1={0} y1={(ph * 2) / 3} x2={pw} y2={(ph * 2) / 3} />
                      </g>
                    )}

                    {tool === "pins" && pins.map((pin) => {
                      const moved = Math.hypot(pin.bx - pin.ax, pin.by - pin.ay) > 0.5;
                      return (
                        <g key={pin.id} pointerEvents="none">
                          {moved && <line x1={pin.ax} y1={pin.ay} x2={pin.bx} y2={pin.by} stroke="#DC2626" strokeWidth={2 * unit} />}
                          {moved && <circle cx={pin.ax} cy={pin.ay} r={mark * 0.6} fill="none" stroke="#ffffff" strokeWidth={2 * unit} />}
                          <circle cx={pin.bx} cy={pin.by} r={mark} fill={moved ? "#DC2626" : "#2563EB"} stroke="#fff" strokeWidth={2 * unit} />
                        </g>
                      );
                    })}

                    {tool === "tilt" && (
                      <g>
                        <circle cx={tiltGeo.head.x} cy={tiltGeo.head.y} r={tilt.r} fill="#10B981" fillOpacity={0.08} stroke="#10B981" strokeWidth={2 * unit} strokeDasharray={`${8 * unit} ${6 * unit}`} pointerEvents="none" />
                        <line x1={tilt.px} y1={tilt.py} x2={tiltGeo.handle.x} y2={tiltGeo.handle.y} stroke="#fff" strokeWidth={3 * unit} pointerEvents="none" />
                        <line x1={tilt.px} y1={tilt.py} x2={tiltGeo.handle.x} y2={tiltGeo.handle.y} stroke="#DC2626" strokeWidth={1.5 * unit} pointerEvents="none" />
                        <circle cx={tilt.px} cy={tilt.py} r={mark * 1.1} fill="#2563EB" stroke="#fff" strokeWidth={2 * unit} />
                        <circle cx={tiltGeo.head.x} cy={tiltGeo.head.y} r={mark * 1.1} fill="#10B981" stroke="#fff" strokeWidth={2 * unit} />
                        <circle cx={tiltGeo.handle.x} cy={tiltGeo.handle.y} r={mark * 1.4} fill="#DC2626" stroke="#fff" strokeWidth={2.5 * unit} />
                      </g>
                    )}

                    {tool === "body" && (
                      <g>
                        <rect x={0} y={bodyS.py} width={pw} height={Math.min(bodyS.ramp, ph - bodyS.py)} fill="#2563EB" fillOpacity={0.08} pointerEvents="none" />
                        <line x1={0} y1={bodyS.py + bodyS.ramp} x2={pw} y2={bodyS.py + bodyS.ramp} stroke="#2563EB" strokeOpacity={0.6} strokeWidth={unit} strokeDasharray={`${6 * unit} ${6 * unit}`} pointerEvents="none" />
                        <line x1={bodyGeo.left.x} y1={bodyGeo.left.y} x2={bodyGeo.handle.x} y2={bodyGeo.handle.y} stroke="#fff" strokeWidth={4 * unit} pointerEvents="none" />
                        <line x1={bodyGeo.left.x} y1={bodyGeo.left.y} x2={bodyGeo.handle.x} y2={bodyGeo.handle.y} stroke="#DC2626" strokeWidth={2 * unit} pointerEvents="none" />
                        <circle cx={bodyS.px} cy={bodyS.py} r={mark * 1.1} fill="#2563EB" stroke="#fff" strokeWidth={2 * unit} />
                        <circle cx={bodyGeo.handle.x} cy={bodyGeo.handle.y} r={mark * 1.4} fill="#DC2626" stroke="#fff" strokeWidth={2.5 * unit} />
                      </g>
                    )}

                    {tool === "rotate" && ruler && (
                      <g pointerEvents="none">
                        <line x1={ruler.a.x} y1={ruler.a.y} x2={ruler.b.x} y2={ruler.b.y} stroke="#fff" strokeWidth={4 * unit} />
                        <line x1={ruler.a.x} y1={ruler.a.y} x2={ruler.b.x} y2={ruler.b.y} stroke="#DC2626" strokeWidth={2 * unit} />
                        <circle cx={ruler.a.x} cy={ruler.a.y} r={mark * 0.7} fill="#DC2626" stroke="#fff" strokeWidth={2 * unit} />
                        <circle cx={ruler.b.x} cy={ruler.b.y} r={mark * 0.7} fill="#DC2626" stroke="#fff" strokeWidth={2 * unit} />
                      </g>
                    )}

                    {tool === "liquify" && hover && (
                      <g pointerEvents="none">
                        <circle cx={hover.x} cy={hover.y} r={brush} fill="#fff" fillOpacity={0.12} stroke="#fff" strokeWidth={2 * unit} />
                        <circle cx={hover.x} cy={hover.y} r={brush} fill="none" stroke="#211a13" strokeWidth={unit} strokeDasharray={`${5 * unit} ${5 * unit}`} />
                      </g>
                    )}
                  </svg>
                )}
              </div>
              {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" /></div>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#5A4A32]">
              <label htmlFor="pose-zoom" className="whitespace-nowrap">{tx("জুম", "Zoom")} {zoom}%</label>
              <input id="pose-zoom" type="range" min={100} max={400} step={25} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={disabled} className="min-w-[120px] flex-1 accent-[#DC2626]" />
              <label className="flex items-center gap-1.5 whitespace-nowrap"><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} className="accent-[#DC2626]" />{tx("গাইড লাইন", "Guide lines")}</label>
              <button type="button" disabled={disabled} onPointerDown={() => setShowOrig(true)} onPointerUp={() => setShowOrig(false)} onPointerLeave={() => setShowOrig(false)} className="whitespace-nowrap rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1 disabled:opacity-40">{tx("ধরে রাখুন: মূল ছবি", "Hold: original")}</button>
            </div>
          </div>

          <aside className="flex flex-col gap-3 border-t border-[#E3D6B8] bg-[#F2E8D2] p-4 md:border-l md:border-t-0">
            <div className="rounded-xl border border-[#10B981]/40 bg-emerald-50 p-2.5">
              <button type="button" onClick={() => void runAuto()} onPointerEnter={() => {
                preloadFaceLandmarker();
                preloadPoseLandmarker();
              }} disabled={disabled || autoBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] px-3 py-2.5 text-[13px] font-extrabold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
                {autoBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {autoBusy ? tx("মাপা হচ্ছে…", "Measuring…") : tx("অটো সোজা করুন", "Auto straighten")}
              </button>
              <p className="mt-1.5 text-[11px] leading-4 text-emerald-900">{tx("এক ক্লিকে কাঁধ লেভেল, ঘাড় ও মাথা (চোখ, নাক, থুতনি) মেপে নিজে সোজা করবে। প্রথমবার মডেল নামাতে কয়েক সেকেন্ড লাগে।", "One click: measures shoulders, neck and head (eyes, nose, chin) and straightens them for you. The first run downloads small models.")}</p>
              {autoMsg && <p className={`mt-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-bold leading-4 ${autoMsg.ok ? "bg-white text-emerald-800" : "bg-red-50 text-red-700"}`} role="status">{autoMsg.text}</p>}
            </div>
            <p className="-mb-1 text-[12px] font-extrabold text-[#5A4A32]">{tx("অথবা নিজে হাতে করুন", "Or do it by hand")}</p>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS.map((item) => {
                const Icon = item.icon;
                const active = tool === item.id;
                return (
                  <button key={item.id} type="button" disabled={disabled} onClick={() => switchTool(item.id)} className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[12px] font-extrabold leading-tight ${item.id === "rotate" ? "col-span-2" : ""} ${active ? "border-[#DC2626] bg-[#F6D9A8] text-[#B91C1C]" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#5A4A32]"} disabled:opacity-50`}>
                    <Icon size={16} />{item.label}
                  </button>
                );
              })}
            </div>
            <p className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[12px] leading-5 text-[#6B5A40]">{activeTool.hint}</p>

            {tool === "pins" && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-spread">{tx("প্রভাবের এলাকা", "Area of effect")}</label><span className="text-[#DC2626]">{spread}%</span></div>
                  <input id="pose-spread" type="range" min={0} max={100} value={spread} onChange={(event) => setSpread(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
                  <p className="mt-1 text-[11px] text-[#6B5A40]">{tx("কম = শুধু পিনের আশপাশ নড়বে। বেশি = অনেকটা জায়গা নরমভাবে নড়বে।", "Low = only near the pin moves. High = a wide area follows smoothly.")}</p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#5A4A32]"><input type="checkbox" checked={lockEdges} onChange={(event) => setLockEdges(event.target.checked)} className="accent-[#DC2626]" />{tx("ছবির কিনারা স্থির রাখুন", "Keep photo edges fixed")}</label>
              </>
            )}

            {tool === "tilt" && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-tilt">{tx("মাথা ঘোরান", "Turn head")}</label><span className="text-[#DC2626]">{deg(tilt.angle).toFixed(1)}°</span></div>
                  <input id="pose-tilt" type="range" min={-30} max={30} step={0.5} value={deg(tilt.angle)} onChange={(event) => setTilt((t) => ({ ...t, angle: rad(Number(event.target.value)) }))} disabled={disabled} className="w-full accent-[#DC2626]" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-area">{tx("মাথার এলাকা", "Head area")}</label><span className="text-[#DC2626]">{Math.round((tilt.r / Math.max(1, pw)) * 100)}%</span></div>
                  <input id="pose-area" type="range" min={Math.round(pw * 0.1)} max={Math.round(pw * 0.6)} value={Math.round(tilt.r)} onChange={(event) => setTilt((t) => ({ ...t, r: Number(event.target.value) }))} disabled={disabled} className="w-full accent-[#DC2626]" />
                  <p className="mt-1 text-[11px] text-[#6B5A40]">{tx("সবুজ বৃত্তে পুরো মাথা ও চুল ঢুকিয়ে নিন।", "Make the green circle cover the whole head and hair.")}</p>
                </div>
              </>
            )}

            {tool === "body" && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-body">{tx("শরীর ঘোরান", "Turn body")}</label><span className="text-[#DC2626]">{deg(bodyS.angle).toFixed(1)}°</span></div>
                  <input id="pose-body" type="range" min={-20} max={20} step={0.1} value={deg(bodyS.angle)} onChange={(event) => setBodyS((b) => ({ ...b, angle: rad(Number(event.target.value)) }))} disabled={disabled} className="w-full accent-[#DC2626]" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-ramp">{tx("ঘাড়ের নরমভাব", "Neck softness")}</label><span className="text-[#DC2626]">{Math.round((bodyS.ramp / Math.max(1, pw)) * 100)}%</span></div>
                  <input id="pose-ramp" type="range" min={Math.round(pw * 0.05)} max={Math.round(pw * 0.6)} value={Math.round(bodyS.ramp)} onChange={(event) => setBodyS((b) => ({ ...b, ramp: Number(event.target.value) }))} disabled={disabled} className="w-full accent-[#DC2626]" />
                  <p className="mt-1 text-[11px] text-[#6B5A40]">{tx("নীল ছায়া ঢাকা অংশে ঘোরা ধীরে ধীরে শুরু হয়, ডটেড লাইনের নিচে পুরো ঘোরে। কাঁধ ওই লাইনের নিচে রাখুন।", "The turn fades in across the blue band and is full below the dashed line. Keep the shoulders below that line.")}</p>
                </div>
              </>
            )}

            {tool === "rotate" && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-rot">{tx("কাত ঠিক করুন", "Level")}</label><span className="text-[#DC2626]">{deg(rotAngle).toFixed(1)}°</span></div>
                  <input id="pose-rot" type="range" min={-30} max={30} step={0.1} value={deg(rotAngle)} onChange={(event) => setRotAngle(rad(Number(event.target.value)))} disabled={disabled} className="w-full accent-[#DC2626]" />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#5A4A32]"><input type="checkbox" checked={rotFill} onChange={(event) => setRotFill(event.target.checked)} className="accent-[#DC2626]" />{tx("ফাঁকা কোণ ভরতে একটু জুম করুন", "Zoom slightly to fill the corners")}</label>
              </>
            )}

            {tool === "liquify" && (
              <>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-brush">{tx("ব্রাশের মাপ", "Brush size")}</label><span className="text-[#DC2626]">{Math.round(brush)}</span></div>
                  <input id="pose-brush" type="range" min={Math.max(8, Math.round(pw * 0.02))} max={Math.max(40, Math.round(pw * 0.3))} value={Math.round(brush)} onChange={(event) => setBrush(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#5A4A32]"><label htmlFor="pose-strength">{tx("জোর", "Strength")}</label><span className="text-[#DC2626]">{strength}%</span></div>
                  <input id="pose-strength" type="range" min={20} max={100} value={strength} onChange={(event) => setStrength(Number(event.target.value))} disabled={disabled} className="w-full accent-[#DC2626]" />
                </div>
              </>
            )}

            {tool !== "liquify" && (
              <button type="button" onClick={() => commitPending()} disabled={disabled || !pendingOp} className="flex items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-3 py-2.5 text-xs font-extrabold text-white hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50">
                <Check size={14} /> {tx("এই পরিবর্তন প্রয়োগ করুন", "Apply this change")}
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button type="button" title="Undo (Ctrl+Z)" disabled={disabled || !canUndo} onClick={undo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Undo2 size={16} /></button>
              <button type="button" title="Redo (Ctrl+Shift+Z)" disabled={disabled || !canRedo} onClick={redo} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><Redo2 size={16} /></button>
              <button type="button" title={tx("সব মুছে শুরু থেকে", "Start over")} disabled={disabled || !(stepCount > 0 || pendingOp)} onClick={resetAll} className="flex items-center justify-center rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] p-2 text-[#5A4A32] disabled:opacity-40"><RotateCcw size={16} /></button>
            </div>

            <div className="rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-3 text-[12px] leading-5 text-[#6B5A40]" aria-live="polite">
              {busy
                ? tx("সেভ হচ্ছে… পূর্ণ মাপের ছবিতে কাজ হচ্ছে, একটু সময় লাগবে।", "Saving… applying to the full-size photo, this can take a moment.")
                : tx(`সম্পন্ন ধাপ: ${stepCount}। শেষে "ছবিতে সেভ করুন" চাপুন।`, `Steps done: ${stepCount}. Press "Save to photo" when finished.`)}
            </div>
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700" role="alert">{error}</div>}

            <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
              <button type="button" onClick={close} disabled={busy} className="rounded-xl border border-[#D8C9A6] bg-[#FBF6E8] px-3 py-2.5 text-xs font-extrabold text-[#5A4A32] disabled:opacity-50">{tx("বাতিল", "Cancel")}</button>
              <button type="button" onClick={() => void save()} disabled={disabled} className="flex items-center justify-center gap-2 rounded-xl bg-[#10B981] px-3 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {tx("ছবিতে সেভ করুন", "Save to photo")}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Self-contained button + modal, so it can be dropped into any step. */
export function PoseFixLauncher({ variant = "tile" }: { variant?: "tile" | "wide" }) {
  const { activePhoto, setAiNotice, setActiveAiTool, aiProcessing, isRemovingBackground, activeAiTool } = useManualEditor();
  const { locale } = useManualEditorText();
  const bn = String(locale ?? "").toLowerCase().startsWith("bn");
  const [source, setSource] = useState<PhotoAsset | null>(null);
  const label = bn ? "ভঙ্গি / ঘাড় সোজা করুন" : "Fix pose / straighten neck";
  const open = () => {
    if (!activePhoto) {
      setAiNotice("Upload a photo first.");
      return;
    }
    setAiNotice("");
    setActiveAiTool("pose");
    setSource(activePhoto);
  };
  return (
    <>
      {variant === "wide" ? (
        <button type="button" onClick={open} disabled={Boolean(aiProcessing) || isRemovingBackground || !activePhoto} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] py-2.5 text-[14px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8] disabled:cursor-not-allowed disabled:opacity-50">
          <UserCog size={17} />{label}
        </button>
      ) : (
        <button type="button" onClick={open} disabled={Boolean(aiProcessing) || isRemovingBackground} className={`col-span-2 flex min-h-[56px] cursor-pointer flex-row items-center justify-start gap-2.5 rounded-xl border bg-[#FBF6E8] px-3 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${activeAiTool === "pose" ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]" : "border-[#E3D6B8] hover:border-[#D8C9A6]"}`}>
          <UserCog className="h-5 w-5 shrink-0 text-[#7A6A50]" />
          <span className="text-left text-[13px] font-bold leading-tight text-[#3B2F1E]">{label}</span>
        </button>
      )}
      {source && (<PoseFixModal sourcePhoto={source} onClose={() => {
        setSource(null);
        setActiveAiTool(null);
      }} />)}
    </>
  );
}
