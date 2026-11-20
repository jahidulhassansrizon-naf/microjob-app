"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg, terminateFFmpeg } from "./ffmpeg-singleton";
import {
  buildSpeedArgs,
  clampSpeed,
  getExtension,
  isNormalSpeed,
  validateVideoFile,
} from "./utils";

export type VideoSpeedStatus =
  | "idle"
  | "ready"
  | "loading"
  | "processing"
  | "done"
  | "error";

export interface VideoSpeedResult {
  url: string;
  speed: number;
  size: number;
}

// Structural types for ffmpeg events (kept local so we don't depend on the package's type exports).
interface LogPayload {
  type: string;
  message: string;
}
interface ProgressPayload {
  progress: number;
  time: number; // microseconds of *output* produced so far
}

// If ffmpeg emits no log/progress event for this long during encoding, treat the worker as hung.
const STALL_TIMEOUT_MS = 90_000;

const DURATION_RE = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/;

class VideoSpeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoSpeedError";
  }
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
}

function describeError(error: unknown): string {
  if (error instanceof VideoSpeedError) return error.message;
  const text = error instanceof Error ? error.message : String(error);
  if (/memory|out of bounds|enlarge|oom/i.test(text)) {
    return "This video is too large for your browser's memory. Try a shorter or smaller video.";
  }
  return "Could not process this video in the browser. Please try another video.";
}

export function useVideoSpeed() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VideoSpeedResult | null>(null);
  const [status, setStatus] = useState<VideoSpeedStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  /** Non-null while a job is running. A ref (not state) so guards are synchronous. */
  const abortRef = useRef<AbortController | null>(null);

  // --- Blob URL lifecycle: each URL is revoked exactly once, when it is replaced or on unmount. ---
  useEffect(() => {
    if (!sourceUrl) return;
    return () => URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  const resultUrl = result?.url;
  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  // --- Unmount: stop any running job and free the WASM worker + core blobs. ---
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      terminateFFmpeg({ releaseAssets: true });
    };
  }, []);

  /** Aborts the active job (if any) and kills the worker. Returns true if a job was running. */
  const abortActiveJob = useCallback((): boolean => {
    const controller = abortRef.current;
    if (!controller) return false;
    controller.abort();
    abortRef.current = null;
    terminateFFmpeg();
    return true;
  }, []);

  const selectFile = useCallback((incoming: File): boolean => {
    if (abortRef.current) {
      setMessage("Cancel the current job before choosing another video.");
      return false;
    }

    const problem = validateVideoFile(incoming);
    if (problem) {
      setStatus("error");
      setMessage(problem);
      return false;
    }

    setFile(incoming);
    setSourceUrl(URL.createObjectURL(incoming));
    setResult(null);
    setStatus("ready");
    setProgress(0);
    setMessage("");
    return true;
  }, []);

  const cancel = useCallback(() => {
    if (!abortActiveJob()) return;
    setStatus("ready");
    setProgress(0);
    setMessage("Processing cancelled.");
  }, [abortActiveJob]);

  const reset = useCallback(() => {
    abortActiveJob();
    setFile(null);
    setSourceUrl(null);
    setResult(null);
    setStatus("idle");
    setProgress(0);
    setMessage("");
  }, [abortActiveJob]);

  const process = useCallback(
    async (requestedSpeed: number) => {
      if (!file || abortRef.current) return;

      const speed = clampSpeed(requestedSpeed);
      if (isNormalSpeed(speed)) {
        setStatus("error");
        setMessage("Choose a speed other than 1x.");
        return;
      }

      const controller = new AbortController();
      const { signal } = controller;
      abortRef.current = controller;

      const stamp = Date.now().toString(36);
      const inputName = `input-${stamp}.${getExtension(file.name) ?? "mp4"}`;
      const outputName = `output-${stamp}.mp4`;

      let ffmpeg: FFmpeg | null = null;
      let detachListeners: () => void = () => undefined;
      let watchdog: ReturnType<typeof setInterval> | undefined;
      let lastActivity = Date.now();

      setResult(null);
      setProgress(0);
      setStatus("loading");
      setMessage("Loading the video engine...");

      try {
        try {
          ffmpeg = await getFFmpeg();
        } catch (loadError) {
          if (signal.aborted) throw loadError;
          console.error(loadError);
          throw new VideoSpeedError(
            "Couldn't load the video engine. Check your connection and try again.",
          );
        }
        throwIfAborted(signal);

        // --- Progress: ffmpeg reports output time; expected output length = input length / speed. ---
        let inputDurationUs = 0;
        let lastPercent = 0;

        const onLog = ({ message: line }: LogPayload) => {
          lastActivity = Date.now();
          if (inputDurationUs) return;
          const match = DURATION_RE.exec(line);
          if (match) {
            inputDurationUs =
              (Number(match[1]) * 3600 +
                Number(match[2]) * 60 +
                Number(match[3])) *
              1_000_000;
          }
        };

        const onProgress = ({
          progress: coreProgress,
          time,
        }: ProgressPayload) => {
          lastActivity = Date.now();
          const expectedOutputUs = inputDurationUs / speed;
          const ratio =
            expectedOutputUs > 0 && Number.isFinite(time) && time > 0
              ? time / expectedOutputUs
              : coreProgress;
          if (!Number.isFinite(ratio)) return;

          // Monotonic, and held at 99 until the file has actually been written and read back.
          lastPercent = Math.min(
            99,
            Math.max(lastPercent, Math.round(ratio * 100)),
          );
          setProgress(lastPercent);
        };

        ffmpeg.on("log", onLog);
        ffmpeg.on("progress", onProgress);
        const attached = ffmpeg;
        detachListeners = () => {
          try {
            attached.off("log", onLog);
            attached.off("progress", onProgress);
          } catch {
            // Worker already terminated.
          }
        };

        setStatus("processing");
        setMessage("Reading video...");
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        throwIfAborted(signal);

        setMessage(`Changing playback speed to ${speed}x...`);
        lastActivity = Date.now();
        watchdog = setInterval(() => {
          if (abortRef.current !== controller) return;
          if (Date.now() - lastActivity < STALL_TIMEOUT_MS) return;
          // Same pattern as cancel(): update the UI synchronously, then abandon the hung job.
          abortActiveJob();
          setStatus("error");
          setProgress(0);
          setMessage(
            "Processing got stuck (the browser may be out of memory). Try a shorter video or a smaller file.",
          );
        }, 5_000);
        const exitCode = await ffmpeg.exec(
          buildSpeedArgs(inputName, outputName, speed),
        );
        throwIfAborted(signal);
        // exec() resolves (does not throw) on a non-zero exit code.
        if (exitCode !== 0) {
          throw new VideoSpeedError(
            "This video couldn't be converted. It may be corrupted or use an unsupported codec.",
          );
        }

        const data = await ffmpeg.readFile(outputName);
        throwIfAborted(signal);
        if (typeof data === "string" || data.byteLength === 0) {
          throw new VideoSpeedError(
            "The converted video was empty. Please try another video.",
          );
        }

        const blob = new Blob([data as BlobPart], { type: "video/mp4" });
        setResult({ url: URL.createObjectURL(blob), speed, size: blob.size });
        setStatus("done");
        setProgress(100);
        setMessage("Your video is ready.");
      } catch (error) {
        // Cancel/reset already updated the UI synchronously; stay silent so we don't overwrite it.
        if (!signal.aborted) {
          console.error(error);
          setStatus("error");
          setProgress(0);
          setMessage(describeError(error));
        }
      } finally {
        if (watchdog) clearInterval(watchdog);
        detachListeners();
        // Release the guard first so a slow cleanup can never leave the UI stuck.
        if (abortRef.current === controller) abortRef.current = null;
        // Always discard the worker after a job: WASM memory never shrinks, so reusing one
        // worker makes 2nd/3rd runs slower and eventually hang. The core files stay cached, so
        // the next run only pays a short re-init. (Skipped if cancel()/reset() already did it,
        // otherwise we could kill a newer job's worker.)
        if (!signal.aborted) terminateFFmpeg();
      }
    },
    [file, abortActiveJob],
  );

  return {
    file,
    sourceUrl,
    result,
    status,
    progress,
    message,
    isBusy: status === "loading" || status === "processing",
    selectFile,
    process,
    cancel,
    reset,
  };
}
