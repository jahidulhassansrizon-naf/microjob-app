/// <reference lib="webworker" />

"use strict";

import type { ImageSegmenter } from "@mediapipe/tasks-vision";

const WASM_URL =
  process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_URL ||
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";

const MODEL_URL =
  process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite";

const CLASS_COUNT = 6;

type SegmentRequest =
  | { type: "warmup"; id: number }
  | { type: "segment"; id: number; bitmap: ImageBitmap };

type SegmentResponse =
  | { type: "ready"; id: number }
  | {
      type: "result";
      id: number;
      width: number;
      height: number;
      classes: ArrayBuffer[];
    }
  | { type: "error"; id: number; message: string };

let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(): Promise<ImageSegmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { FilesetResolver, ImageSegmenter: Segmenter } = await import(
        "@mediapipe/tasks-vision"
      );

      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);

      return Segmenter.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    })().catch((error: unknown) => {
      segmenterPromise = null;
      throw error;
    });
  }

  return segmenterPromise;
}

async function segmentBitmap(bitmap: ImageBitmap) {
  const segmenter = await getSegmenter();
  const result = segmenter.segment(bitmap);
  const masks = result.confidenceMasks ?? [];

  try {
    if (masks.length < CLASS_COUNT) {
      throw new Error("The segmentation model returned an unexpected result.");
    }

    const width = masks[0].width;
    const height = masks[0].height;
    const classes = masks.map((mask) => mask.getAsFloat32Array().slice());

    return { width, height, classes };
  } finally {
    masks.forEach((mask) => mask.close());
    bitmap.close();
  }
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

/*
 * MediaPipe's synchronous IMAGE-mode inference is intentionally serialized.
 * Keeping the queue in the worker prevents overlapping calls on the same
 * native runtime while the browser main thread remains responsive.
 */
let workQueue = Promise.resolve();

function respondError(id: number, error: unknown) {
  const response: SegmentResponse = {
    type: "error",
    id,
    message:
      error instanceof Error && error.message
        ? error.message
        : "Image segmentation failed.",
  };

  workerScope.postMessage(response);
}

workerScope.onmessage = (event: MessageEvent<SegmentRequest>) => {
  const message = event.data;

  workQueue = workQueue.then(async () => {
    try {
      if (message.type === "warmup") {
        await getSegmenter();
        const response: SegmentResponse = { type: "ready", id: message.id };
        workerScope.postMessage(response);
        return;
      }

      const result = await segmentBitmap(message.bitmap);
      const response: SegmentResponse = {
        type: "result",
        id: message.id,
        width: result.width,
        height: result.height,
        classes: result.classes.map((values) => values.buffer as ArrayBuffer),
      };

      workerScope.postMessage(response, response.classes);
    } catch (error) {
      if (message.type === "segment") {
        try {
          message.bitmap.close();
        } catch {
          // Ignore an already-closed/invalid transferred bitmap.
        }
      }

      respondError(message.id, error);
    }
  });
};

export {};
