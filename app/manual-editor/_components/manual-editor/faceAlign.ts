/**
 * Auto face-straighten helper.
 *
 * Measures how much the head is tilted (roll) from MediaPipe Face Landmarker points
 * (eyes, nose bridge, forehead, chin), and builds the geometry for a head-tilt warp.
 *
 * The MediaPipe library and its model are loaded from a CDN the first time the button is used,
 * so no `npm install` is needed. To self-host (offline / faster), copy the files into /public and
 * change the three constants below.
 */

export const MEDIAPIPE_VERSION = "0.10.14";
export const MEDIAPIPE_BUNDLE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;
export const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export type LandmarkPt = { x: number; y: number };

export type FaceMeasure = {
  /** Head tilt in radians. Positive = head leans clockwise (top towards the right of the photo). */
  roll: number;
  eyeRoll: number;
  midRoll: number;
  pivot: LandmarkPt;
  head: LandmarkPt;
  r: number;
  faceHeight: number;
  faceWidth: number;
  top: LandmarkPt;
  chin: LandmarkPt;
  bridge: LandmarkPt;
};

const IDX = {
  leftEye: [33, 133],
  rightEye: [362, 263],
  forehead: 10,
  bridge: 168,
  chin: 152,
  cheekA: 234,
  cheekB: 454,
};

const mid = (a: LandmarkPt, b: LandmarkPt): LandmarkPt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Pure geometry. `pts` are landmark coordinates in pixels. */
export function computeFaceGeometry(pts: LandmarkPt[]): FaceMeasure {
  const p = (i: number) => pts[i];
  let eyeA = mid(p(IDX.leftEye[0]), p(IDX.leftEye[1]));
  let eyeB = mid(p(IDX.rightEye[0]), p(IDX.rightEye[1]));
  if (eyeA.x > eyeB.x) [eyeA, eyeB] = [eyeB, eyeA];
  const eyeRoll = Math.atan2(eyeB.y - eyeA.y, eyeB.x - eyeA.x);

  const top = p(IDX.forehead);
  const bridge = p(IDX.bridge);
  const chin = p(IDX.chin);
  const axisRoll = (from: LandmarkPt) => Math.atan2(-(chin.x - from.x), chin.y - from.y);
  const midRoll = (axisRoll(top) + axisRoll(bridge)) / 2;

  // Eye line is the most reliable. If the face axis disagrees a lot (turned head), trust the eyes only.
  const roll = Math.abs(eyeRoll - midRoll) > (10 * Math.PI) / 180 ? eyeRoll : 0.6 * eyeRoll + 0.4 * midRoll;

  const faceHeight = Math.hypot(chin.x - top.x, chin.y - top.y);
  const a = p(IDX.cheekA);
  const b = p(IDX.cheekB);
  const faceWidth = Math.hypot(a.x - b.x, a.y - b.y);
  const ux = (chin.x - top.x) / Math.max(1, faceHeight);
  const uy = (chin.y - top.y) / Math.max(1, faceHeight);

  return {
    roll,
    eyeRoll,
    midRoll,
    faceHeight,
    faceWidth,
    top,
    chin,
    bridge,
    // neck base: a little below the chin, along the face axis
    pivot: { x: chin.x + ux * 0.55 * faceHeight, y: chin.y + uy * 0.55 * faceHeight },
    // middle of the head (face + hair)
    head: { x: top.x + ux * 0.4 * faceHeight, y: top.y + uy * 0.4 * faceHeight },
    r: 0.85 * faceWidth,
  };
}

/**
 * MediaPipe writes harmless status lines ("INFO: Created TensorFlow Lite XNNPACK delegate...")
 * through console.error, which the Next.js dev overlay shows as a red error. Its runtime keeps its own
 * reference to console.error when it starts, so the filter must be installed BEFORE the library is
 * imported. It only drops lines that begin with "INFO:" / "WARNING:".
 */
let consoleFilterInstalled = false;
function installConsoleFilter() {
  if (consoleFilterInstalled || typeof console === "undefined") return;
  consoleFilterInstalled = true;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && /^\s*(INFO|WARNING)\b/.test(first)) return;
    original.apply(console, args as []);
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let landmarkerPromise: Promise<any> | null = null;

async function getLandmarker(): Promise<any> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      installConsoleFilter();
      const vision: any = await import(/* webpackIgnore: true */ MEDIAPIPE_BUNDLE_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const make = (delegate: "GPU" | "CPU") =>
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
          runningMode: "IMAGE",
          numFaces: 1,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })().catch((cause) => {
      landmarkerPromise = null;
      throw cause;
    });
  }
  return landmarkerPromise;
}

export function preloadFaceLandmarker() {
  void getLandmarker().catch(() => undefined);
}

export async function measureFace(canvas: HTMLCanvasElement): Promise<FaceMeasure> {
  let landmarker: any;
  try {
    landmarker = await getLandmarker();
  } catch {
    throw new Error("FACE_MODEL_LOAD");
  }
  const result = landmarker.detect(canvas);
  const face = result?.faceLandmarks?.[0];
  if (!face || face.length < 455) throw new Error("NO_FACE");
  const pts: LandmarkPt[] = face.map((l: { x: number; y: number }) => ({ x: l.x * canvas.width, y: l.y * canvas.height }));
  return computeFaceGeometry(pts);
}

/* ------------------------------------------------------------------ */
/* Body (shoulders)                                                     */
/* ------------------------------------------------------------------ */

export const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export type BodyMeasure = {
  /** shoulders ordered left-to-right in the photo */
  a: LandmarkPt;
  b: LandmarkPt;
  mid: LandmarkPt;
  /** Shoulder-line tilt in radians. Positive = right side of the photo is lower (clockwise). */
  roll: number;
};

let posePromise: Promise<any> | null = null;

async function getPose(): Promise<any> {
  if (!posePromise) {
    posePromise = (async () => {
      installConsoleFilter();
      const vision: any = await import(/* webpackIgnore: true */ MEDIAPIPE_BUNDLE_URL);
      const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const make = (delegate: "GPU" | "CPU") =>
        vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
          runningMode: "IMAGE",
          numPoses: 1,
        });
      try {
        return await make("GPU");
      } catch {
        return await make("CPU");
      }
    })().catch((cause) => {
      posePromise = null;
      throw cause;
    });
  }
  return posePromise;
}

/** Returns null when both shoulders are not clearly visible (or the model could not load). */
export async function measureBody(canvas: HTMLCanvasElement): Promise<BodyMeasure | null> {
  try {
    const pose = await getPose();
    const lms = pose.detect(canvas)?.landmarks?.[0];
    if (!lms) return null;
    const ok = (l: { x: number; y: number; visibility?: number }) =>
      (l.visibility ?? 1) >= 0.5 && l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1;
    const l = lms[11];
    const r = lms[12];
    if (!l || !r || !ok(l) || !ok(r)) return null;
    let a: LandmarkPt = { x: l.x * canvas.width, y: l.y * canvas.height };
    let b: LandmarkPt = { x: r.x * canvas.width, y: r.y * canvas.height };
    if (a.x > b.x) [a, b] = [b, a];
    if (b.x - a.x < canvas.width * 0.1) return null; // shoulders on top of each other: body is turned sideways
    return { a, b, mid: mid(a, b), roll: Math.atan2(b.y - a.y, b.x - a.x) };
  } catch {
    return null;
  }
}

export function preloadPoseLandmarker() {
  void getPose().catch(() => undefined);
}
