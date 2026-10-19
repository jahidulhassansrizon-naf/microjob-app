"use strict";

const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");

const QUEUE_TOPIC = "sohojhub-ai-generation";
const QUEUE_CONSUMER = "sohojhub-playwright-daemon";
const QUEUE_REGION = process.env.QUEUE_REGION || "iad1";
const BOT_PORT = Number(process.env.BOT_PORT || 3000);
const BOT_URL = `http://127.0.0.1:${BOT_PORT}`;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_ATTEMPTS = 3;
const VISIBILITY_TIMEOUT_SECONDS = 3600;
const PROCESSING_STALE_MS = 55 * 60 * 1000;
const GENERATION_TIMEOUT_MS = 15 * 60 * 1000;

let botProcess = null;
let stopping = false;
let cleanupPromise = null;
let sessionFilePath = null;
let fatalWorkerExit = null;

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    operation: {
      type: String,
      enum: ["edit-image", "template-edit"],
      required: true,
    },
    source: {
      type: String,
      enum: ["ai-editor", "ai-template", "bulk-photo-edit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      required: true,
    },
    idempotencyKey: { type: String, required: true },
    prompt: { type: String, required: true },
    sourceImageUrl: { type: String, required: true },
    temporarySourcePublicId: { type: String, default: "" },
    templateImageUrl: { type: String, default: "" },
    temporaryTemplatePublicId: { type: String, default: "" },
    resultUrl: { type: String, default: "" },
    resultPublicId: { type: String, default: "" },
    queueMessageId: { type: String, default: "" },
    attempts: { type: Number, default: 0, min: 0 },
    errorMessage: { type: String, default: "" },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: "ai_image_jobs",
  },
);

const AIImageJob =
  mongoose.models.AIImageJob || mongoose.model("AIImageJob", jobSchema);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n\t]+/g, " ").slice(0, 500);
}

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not configured for the Daemon.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

async function materializeGeminiSession() {
  const base64 = process.env.GEMINI_SESSION_BASE64 || "";
  const rawJson = process.env.GEMINI_SESSION_JSON || "";

  if (!base64 && !rawJson) {
    throw new Error(
      "Set GEMINI_SESSION_BASE64 or GEMINI_SESSION_JSON in the Daemon environment.",
    );
  }

  const raw = base64
    ? Buffer.from(base64, "base64").toString("utf8")
    : rawJson;

  let state;
  try {
    state = JSON.parse(raw);
  } catch {
    throw new Error("Gemini session environment variable is not valid JSON.");
  }

  if (
    !state ||
    !Array.isArray(state.cookies) ||
    !Array.isArray(state.origins)
  ) {
    throw new Error("Gemini session must contain cookies and origins arrays.");
  }

  sessionFilePath = path.join(os.tmpdir(), `gemini-session-${process.pid}.json`);
  await fs.writeFile(sessionFilePath, JSON.stringify(state), { mode: 0o600 });
  return sessionFilePath;
}

function startBotServer(sessionPath) {
  const internalKey = crypto.randomBytes(32).toString("hex");
  const childEnv = { ...process.env };

  // The Bot only needs the temporary session-file path, not the raw session
  // secret itself. Avoid copying the full serialized session into its env.
  delete childEnv.GEMINI_SESSION_BASE64;
  delete childEnv.GEMINI_SESSION_JSON;

  botProcess = spawn(process.execPath, [path.join(__dirname, "server.js")], {
    env: {
      ...childEnv,
      BOT_PORT: String(BOT_PORT),
      SKIP_DESKTOP: "1",
      GEMINI_SESSION_PATH: sessionPath,
      ASK_KEY: internalKey,
    },
    stdio: "inherit",
  });

  botProcess.on("error", (error) => {
    if (stopping) return;
    fatalWorkerExit = error;
    stopping = true;
    console.error("Could not start local Playwright API:", safeErrorMessage(error));
  });

  botProcess.on("exit", (code, signal) => {
    if (stopping) return;
    fatalWorkerExit = new Error(
      `Local Playwright API exited unexpectedly (code=${code}, signal=${signal}).`,
    );
    stopping = true;
    console.error("Local Playwright API exited unexpectedly.", { code, signal });
  });

  return internalKey;
}

async function waitForBotServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && !stopping) {
    try {
      const response = await fetch(`${BOT_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {
      // Keep waiting while the local API starts.
    }
    await sleep(1000);
  }
  throw new Error("Local Playwright API did not become healthy within 60 seconds.");
}

function isCloudinaryUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    return (
      url.protocol === "https:" &&
      (url.hostname === "res.cloudinary.com" ||
        url.hostname.endsWith(".res.cloudinary.com"))
    );
  } catch {
    return false;
  }
}

function mimeExtension(mimeType) {
  const mime = String(mimeType || "").toLowerCase().split(";")[0];
  const mapping = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const extension = mapping[mime];
  if (!extension) throw new Error("Unsupported image MIME type.");
  return extension;
}

async function downloadImage(imageUrl, kind) {
  if (!isCloudinaryUrl(imageUrl)) {
    throw new Error(`Stored ${kind} image must be an HTTPS Cloudinary URL.`);
  }

  const url = new URL(imageUrl);
  const response = await fetch(url, {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Could not fetch ${kind} image (${response.status}).`);
  }

  const mimeType = (response.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  mimeExtension(mimeType);

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    throw new Error(`${kind} image exceeds the 15 MB limit.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`${kind} image is empty or exceeds the 15 MB limit.`);
  }
  return { buffer, mimeType };
}

async function generateImage(job, internalKey) {
  const source = await downloadImage(job.sourceImageUrl, "source");
  const form = new FormData();
  form.append(
    "image",
    new Blob([source.buffer], { type: source.mimeType }),
    `source${mimeExtension(source.mimeType)}`,
  );
  form.append("prompt", job.prompt);

  let endpoint = "/edit-image";
  if (job.operation === "template-edit") {
    if (!job.templateImageUrl) {
      throw new Error("Template job has no template image URL.");
    }
    const template = await downloadImage(job.templateImageUrl, "template");
    form.append(
      "templateImage",
      new Blob([template.buffer], { type: template.mimeType }),
      `template${mimeExtension(template.mimeType)}`,
    );
    endpoint = "/template-edit";
  }

  const response = await fetch(`${BOT_URL}${endpoint}`, {
    method: "POST",
    headers: { "x-api-key": internalKey },
    body: form,
    signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  });

  const rawText = await response.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Playwright API returned a non-JSON response (${response.status}).`,
    );
  }

  if (
    !response.ok ||
    !data?.success ||
    typeof data.image !== "string" ||
    !data.image.startsWith("data:image/")
  ) {
    throw new Error(data?.error || `Playwright generation failed (${response.status}).`);
  }
  return data.image;
}

async function cleanupTemporaryInputs(job) {
  const ids = [job.temporarySourcePublicId, job.temporaryTemplatePublicId].filter(Boolean);
  await Promise.all(
    ids.map(async (publicId) => {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      } catch (error) {
        console.error("Failed to remove temporary AI input asset:", safeErrorMessage(error));
      }
    }),
  );
}

async function completeExistingResult(job) {
  const result = await AIImageJob.updateOne(
    { _id: job._id, status: { $in: ["queued", "processing"] }, resultUrl: { $ne: "" } },
    { $set: { status: "completed", completedAt: new Date(), errorMessage: "" } },
  );
  if (result.matchedCount) await cleanupTemporaryInputs(job);
}

async function processJob(message, internalKey) {
  const jobId = message && typeof message.jobId === "string" ? message.jobId : "";
  if (!mongoose.isValidObjectId(jobId)) {
    console.error("Ignoring malformed AI image queue message.");
    return;
  }

  const beforeClaim = await AIImageJob.findById(jobId).select("status resultUrl").lean();
  if (!beforeClaim || beforeClaim.status === "completed" || beforeClaim.status === "failed") {
    return;
  }
  if (beforeClaim.resultUrl) {
    const jobWithInputs = await AIImageJob.findById(jobId);
    if (jobWithInputs) await completeExistingResult(jobWithInputs);
    return;
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROCESSING_STALE_MS);
  const claimed = await AIImageJob.findOneAndUpdate(
    {
      _id: jobId,
      $or: [
        { status: "queued" },
        { status: "processing", startedAt: { $lte: staleBefore } },
        { status: "processing", startedAt: { $exists: false } },
      ],
    },
    {
      $set: { status: "processing", startedAt: now, errorMessage: "" },
      $inc: { attempts: 1 },
    },
    { new: true },
  );

  if (!claimed) return;
  if (claimed.resultUrl) {
    await completeExistingResult(claimed);
    return;
  }

  let uploadedPublicId = "";
  let resultStored = false;
  try {
    const imageDataUrl = await generateImage(claimed, internalKey);
    const uploaded = await cloudinary.uploader.upload(imageDataUrl, {
      folder: `sohozkaj-ai-photos/${claimed.userId}/ai-job-results`,
      resource_type: "image",
      use_filename: false,
      unique_filename: true,
    });

    if (!uploaded.secure_url || !uploaded.public_id) {
      throw new Error("Cloudinary did not return the generated image URL.");
    }
    uploadedPublicId = uploaded.public_id;

    const completed = await AIImageJob.updateOne(
      { _id: jobId, status: "processing" },
      {
        $set: {
          status: "completed",
          resultUrl: uploaded.secure_url,
          resultPublicId: uploaded.public_id,
          errorMessage: "",
          completedAt: new Date(),
        },
      },
    );

    if (!completed.matchedCount) {
      const current = await AIImageJob.findById(jobId).select("status resultPublicId").lean();
      if (current?.status === "completed" && current.resultPublicId === uploaded.public_id) {
        resultStored = true;
        await cleanupTemporaryInputs(claimed);
        return;
      }
      await cloudinary.uploader.destroy(uploaded.public_id, { resource_type: "image" }).catch(() => {});
      return;
    }

    resultStored = true;
    await cleanupTemporaryInputs(claimed);
    console.log("AI image job completed", { jobId, operation: claimed.operation });
  } catch (error) {
    const messageText = safeErrorMessage(error);

    if (uploadedPublicId && !resultStored) {
      // Protect against an ambiguous database response after the result update.
      const current = await AIImageJob.findById(jobId)
        .select("status resultPublicId")
        .lean()
        .catch(() => null);
      const resultWasPersisted =
        current?.status === "completed" && current.resultPublicId === uploadedPublicId;
      if (!resultWasPersisted) {
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: "image" }).catch(() => {});
      } else {
        resultStored = true;
      }
    }

    if (resultStored) {
      await cleanupTemporaryInputs(claimed);
      return;
    }

    const exhausted = Number(claimed.attempts || 0) >= MAX_ATTEMPTS;
    await AIImageJob.updateOne(
      { _id: jobId, status: "processing" },
      {
        $set: {
          status: exhausted ? "failed" : "queued",
          errorMessage: messageText,
          completedAt: exhausted ? new Date() : null,
        },
      },
    );

    if (exhausted) {
      await cleanupTemporaryInputs(claimed);
      console.error("AI image job failed after maximum attempts", { jobId, error: messageText });
      return;
    }
    throw error;
  }
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupPromise = (async () => {
    const child = botProcess;
    if (child && child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => {
        let settled = false;
        let timeout;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (timeout) clearTimeout(timeout);
          child.removeListener("exit", finish);
          child.removeListener("error", finish);
          resolve();
        };
        timeout = setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) {
            try { child.kill("SIGKILL"); } catch { /* already exited */ }
          }
          finish();
        }, 5000);
        child.once("exit", finish);
        child.once("error", finish);
        try { child.kill("SIGTERM"); } catch { finish(); }
      });
    }
    await mongoose.disconnect().catch(() => {});
    if (sessionFilePath) {
      await fs.rm(sessionFilePath, { force: true }).catch(() => {});
      sessionFilePath = null;
    }
  })();
  return cleanupPromise;
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`${signal} received; stop polling and drain the current job before cleanup.`);
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured for the Daemon.");
  }
  if (!process.env.VERCEL && !process.env.VERCEL_OIDC_TOKEN_FILE) {
    console.warn("Daemon is not running in a detected Vercel environment; Queue OIDC may be unavailable.");
  }

  const sessionPath = await materializeGeminiSession();
  configureCloudinary();
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });

  const internalKey = startBotServer(sessionPath);
  await waitForBotServer();

  const { PollingQueueClient } = await import("@vercel/queue");
  const queue = new PollingQueueClient({ region: QUEUE_REGION });

  console.log("Sohoj Hub Playwright Daemon is polling Vercel Queues", {
    region: QUEUE_REGION,
    topic: QUEUE_TOPIC,
    consumer: QUEUE_CONSUMER,
  });

  while (!stopping) {
    try {
      const result = await queue.receive(
        QUEUE_TOPIC,
        QUEUE_CONSUMER,
        async (message) => {
          if (stopping) {
            throw new Error("Daemon is shutting down; allow this message to be redelivered.");
          }
          await processJob(message, internalKey);
        },
        { limit: 1, visibilityTimeoutSeconds: VISIBILITY_TIMEOUT_SECONDS },
      );
      if (!result.ok && !stopping) await sleep(1500);
    } catch (error) {
      if (stopping) break;
      console.error("Queue polling error:", safeErrorMessage(error));
      await sleep(3000);
    }
  }

  await cleanup();
  if (fatalWorkerExit) throw fatalWorkerExit;
}

main().catch(async (error) => {
  stopping = true;
  console.error("Playwright Daemon startup failed:", safeErrorMessage(error));
  await cleanup();
  process.exitCode = 1;
});
