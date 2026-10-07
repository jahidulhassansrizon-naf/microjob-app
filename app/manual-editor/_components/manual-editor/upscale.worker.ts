/// <reference lib="webworker" />

"use strict";

type OrtModule = typeof import("onnxruntime-web");
type OrtSession = import("onnxruntime-web").InferenceSession;
type InferenceDevice = "webgpu" | "wasm";

interface OrtBundle {
  ort: OrtModule;
  session: OrtSession;
}

type WorkerRequest =
  | { type: "warmup"; id: number }
  | { type: "tile"; id: number; input: ArrayBuffer; width: number; height: number };

type WorkerResponse =
  | { type: "ready"; id: number }
  | { type: "tile-result"; id: number; data: ArrayBuffer; width: number; height: number }
  | { type: "error"; id: number; message: string };

const MODEL_URL = "/models/realesr-general-x4v3.onnx";
const MODEL_CACHE_NAME = "manual-editor-upscaler-models-v1";
const MODEL_MIN_BYTES = 512 * 1024;

let upscalerPromise: Promise<OrtBundle> | null = null;
let device: InferenceDevice | null = null;

async function loadModelBytes(url: string): Promise<Uint8Array> {
  const cache =
    typeof caches !== "undefined"
      ? await caches.open(MODEL_CACHE_NAME).catch(() => null)
      : null;

  if (cache) {
    const hit = await cache.match(url).catch(() => undefined);
    if (hit) return new Uint8Array(await hit.arrayBuffer());
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      "Upscale model not found. Copy realesr-general-x4v3.onnx to /public/models/.",
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < MODEL_MIN_BYTES) {
    throw new Error(
      "Upscale model file is invalid. Check /public/models/realesr-general-x4v3.onnx.",
    );
  }

  if (cache) {
    await cache
      .put(
        url,
        new Response(bytes.slice().buffer as ArrayBuffer, {
          headers: { "Content-Type": "application/octet-stream" },
        }),
      )
      .catch(() => undefined);
  }

  return bytes;
}

async function getUpscaler(): Promise<OrtBundle> {
  if (!upscalerPromise) {
    upscalerPromise = (async () => {
      // @ts-ignore onnxruntime-web-upscaler is an npm alias without its own module types.
      const ort = (await import("onnxruntime-web-upscaler")) as OrtModule;
      ort.env.logLevel = "error";

      const version = ort.env.versions.web;
      if (version) {
        ort.env.wasm.wasmPaths =
          `https://cdn.jsdelivr.net/npm/onnxruntime-web@${version}/dist/`;
      }

      if (typeof crossOriginIsolated !== "undefined" && crossOriginIsolated) {
        ort.env.wasm.numThreads = Math.min(
          4,
          navigator.hardwareConcurrency || 2,
        );
      }

      const bytes = await loadModelBytes(MODEL_URL);
      const create = (provider: InferenceDevice) =>
        ort.InferenceSession.create(bytes, {
          executionProviders: [provider],
          graphOptimizationLevel: "all",
          logSeverityLevel: 3,
        });

      const preferred: InferenceDevice =
        device ?? ("gpu" in navigator ? "webgpu" : "wasm");

      try {
        const session = await create(preferred);
        device = preferred;
        return { ort, session };
      } catch (error) {
        if (preferred === "webgpu") {
          device = "wasm";
          return { ort, session: await create("wasm") };
        }
        throw error;
      }
    })().catch((error) => {
      upscalerPromise = null;
      throw error;
    });
  }

  return upscalerPromise;
}

async function runModel(
  { ort, session }: OrtBundle,
  input: Float32Array,
  width: number,
  height: number,
) {
  const tensor = new ort.Tensor("float32", input, [1, 3, height, width]);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const output = outputs[session.outputNames[0]];
  const data = (await output.getData()) as Float32Array;
  const [, , outH, outW] = output.dims;
  output.dispose();
  return { data, width: outW, height: outH };
}

async function runTile(
  input: Float32Array,
  width: number,
  height: number,
) {
  try {
    return await runModel(await getUpscaler(), input, width, height);
  } catch (error) {
    if (device === "webgpu") {
      device = "wasm";
      const old = upscalerPromise;
      upscalerPromise = null;
      void old?.then((bundle) => bundle.session.release()).catch(() => undefined);
      return runModel(await getUpscaler(), input, width, height);
    }
    throw error;
  }
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    if (message.type === "warmup") {
      await getUpscaler();
      const response: WorkerResponse = { type: "ready", id: message.id };
      workerScope.postMessage(response);
      return;
    }

    const input = new Float32Array(message.input);
    const result = await runTile(input, message.width, message.height);

    // In newer TypeScript/lib definitions, TypedArray.buffer is typed as
    // ArrayBufferLike (it may include SharedArrayBuffer). The worker protocol
    // intentionally uses a transferable ArrayBuffer, so create an explicit
    // ArrayBuffer copy for both the response type and transfer list.
    const transferableBuffer = new ArrayBuffer(result.data.byteLength);
    new Uint8Array(transferableBuffer).set(
      new Uint8Array(
        result.data.buffer,
        result.data.byteOffset,
        result.data.byteLength,
      ),
    );

    const response: WorkerResponse = {
      type: "tile-result",
      id: message.id,
      data: transferableBuffer,
      width: result.width,
      height: result.height,
    };

    workerScope.postMessage(response, [transferableBuffer]);
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      id: message.id,
      message:
        error instanceof Error && error.message
          ? error.message
          : "Upscale worker failed.",
    };
    workerScope.postMessage(response);
  }
};

export {};
