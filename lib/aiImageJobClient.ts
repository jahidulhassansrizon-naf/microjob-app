"use client";

export type AIImageJobSource =
  | "ai-editor"
  | "ai-template"
  | "bulk-photo-edit";

type SubmitResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
  job?: {
    id?: string;
    status?: string;
    resultUrl?: string | null;
  };
};

type StatusResponse = {
  success?: boolean;
  error?: string;
  job?: {
    id?: string;
    status?: "queued" | "processing" | "completed" | "failed";
    resultUrl?: string | null;
    error?: string | null;
  };
};

const POLL_INTERVAL_MS = 2_000;
const MAX_WAIT_MS = 20 * 60 * 1_000;

function wait(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Request cancelled.", "AbortError"));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Request cancelled.", "AbortError"));
    };

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export async function submitAndWaitForAIImageJob(
  formData: FormData,
  source: AIImageJobSource,
  signal?: AbortSignal,
): Promise<string> {
  formData.set("source", source);

  const existingKey = formData.get("idempotencyKey");
  const idempotencyKey =
    typeof existingKey === "string" && existingKey.trim()
      ? existingKey.trim()
      : crypto.randomUUID();

  formData.set("idempotencyKey", idempotencyKey);

  const submitResponse = await fetch("/api/ai-image-jobs", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: formData,
    credentials: "include",
    cache: "no-store",
    signal,
  });

  const submitted = await readJson<SubmitResponse>(submitResponse);

  if (
    submitResponse.status === 403 &&
    submitted?.code === "SUBSCRIPTION_REQUIRED"
  ) {
    window.dispatchEvent(new Event("sohozkaj:subscription-required"));
    throw new Error("SUBSCRIPTION_REQUIRED");
  }

  const jobId = submitted?.job?.id;
  if (
    !submitResponse.ok ||
    !submitted?.success ||
    typeof jobId !== "string" ||
    !jobId
  ) {
    throw new Error(
      submitted?.error ||
        submitted?.message ||
        `Could not submit image generation (${submitResponse.status}).`,
    );
  }

  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await wait(POLL_INTERVAL_MS, signal);

    const statusResponse = await fetch(
      `/api/ai-image-jobs/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
      },
    );

    const statusData = await readJson<StatusResponse>(statusResponse);
    if (!statusResponse.ok || !statusData?.success || !statusData.job) {
      throw new Error(
        statusData?.error ||
          `Could not check generation status (${statusResponse.status}).`,
      );
    }

    const job = statusData.job;
    if (job.status === "completed") {
      if (typeof job.resultUrl !== "string" || !job.resultUrl) {
        throw new Error("The job completed without an image URL.");
      }
      return job.resultUrl;
    }

    if (job.status === "failed") {
      throw new Error(job.error || "Image generation failed. Please try again.");
    }
  }

  throw new Error(
    "Image generation is still processing. Please wait before submitting another request.",
  );
}
