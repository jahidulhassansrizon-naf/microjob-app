/// <reference lib="webworker" />

"use strict";

import type { Detection, Box } from "./aiEnhancement";

type Detector = (
  image: string,
  options?: { threshold?: number; percentage?: boolean },
) => Promise<unknown>;

type WorkerRequest =
  | { type: "warmup"; id: number }
  | { type: "detect"; id: number; blob: Blob };

type WorkerResponse =
  | { type: "ready"; id: number }
  | { type: "result"; id: number; detections: Detection[] }
  | { type: "error"; id: number; message: string };

let detectorPromise: Promise<Detector> | null = null;

function isDetection(value: unknown): value is Detection {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const b = v.box as Record<string, unknown> | undefined;
  return (
    typeof v.score === "number" &&
    typeof v.label === "string" &&
    !!b &&
    typeof b.xmin === "number" &&
    typeof b.ymin === "number" &&
    typeof b.xmax === "number" &&
    typeof b.ymax === "number"
  );
}

async function getDetector(): Promise<Detector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = true;

      const wasm = (
        env.backends?.onnx as
          | { wasm?: { numThreads?: number } }
          | undefined
      )?.wasm;
      if (wasm) {
        wasm.numThreads = Math.min(4, navigator.hardwareConcurrency || 2);
      }

      // The installed @xenova/transformers version uses a PretrainedOptions
      // type that does not expose a `device` field. Let the runtime choose the
      // available backend instead of passing a version-incompatible option.
      return (await pipeline(
        "object-detection",
        "Xenova/yolos-tiny",
        { quantized: true },
      )) as unknown as Detector;
    })().catch((error) => {
      detectorPromise = null;
      throw error;
    });
  }

  return detectorPromise;
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "warmup") {
      await getDetector();
      const response: WorkerResponse = { type: "ready", id: message.id };
      workerScope.postMessage(response);
      return;
    }

    const detector = await getDetector();

    // @xenova/transformers v2 (the legacy package already installed in this
    // project) is reliable with URL/string image inputs. Passing a Blob
    // directly through the worker can surface the runtime error:
    // "Unsupported input type: object". Keep the image fully client-side,
    // but expose it to Transformers.js as a temporary object URL instead.
    const imageUrl = URL.createObjectURL(message.blob);
    let raw: unknown;
    try {
      raw = await detector(imageUrl, {
        threshold: 0.35,
        percentage: false,
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }

    const detections = (Array.isArray(raw) ? raw : [])
      .filter(isDetection)
      .filter((d) => d.label === "person")
      .slice(0, 8);

    const response: WorkerResponse = {
      type: "result",
      id: message.id,
      detections,
    };
    workerScope.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      id: message.id,
      message:
        error instanceof Error && error.message
          ? error.message
          : "Face detection failed.",
    };
    workerScope.postMessage(response);
  }
};

export {};
