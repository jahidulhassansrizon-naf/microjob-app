import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

type TempSourceFile = {
  filePath: string;
  tempDirectory: string;
};

type BotProcessResult = {
  outputPath: string;
  stdout: string;
  stderr: string;
};

let geminiQueue: Promise<void> = Promise.resolve();

function getMimeTypeFromExtension(extension: string): string {
  const normalized = extension.toLowerCase();

  if (normalized === ".jpg" || normalized === ".jpeg") {
    return "image/jpeg";
  }

  if (normalized === ".webp") {
    return "image/webp";
  }

  if (normalized === ".gif") {
    return "image/gif";
  }

  return "image/png";
}

function getExtensionFromMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return ".jpg";
  }

  if (normalized.includes("webp")) {
    return ".webp";
  }

  if (normalized.includes("gif")) {
    return ".gif";
  }

  return ".png";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Gemini image generation failed.";
}

async function withGeminiQueue<T>(job: () => Promise<T>): Promise<T> {
  const previousJob = geminiQueue;

  let release!: () => void;

  geminiQueue = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previousJob;

  try {
    return await job();
  } finally {
    release();
  }
}

async function createTemporarySourceFile(
  formData: FormData,
): Promise<TempSourceFile> {
  const uploadedImage = formData.get("image");

  if (
    uploadedImage &&
    typeof uploadedImage === "object" &&
    "arrayBuffer" in uploadedImage &&
    typeof (
      uploadedImage as {
        arrayBuffer?: unknown;
      }
    ).arrayBuffer === "function"
  ) {
    const file = uploadedImage as File;

    if (file.type && !file.type.toLowerCase().startsWith("image/")) {
      throw new Error("Uploaded source file is not an image.");
    }

    const arrayBuffer = await file.arrayBuffer();

    if (!arrayBuffer.byteLength) {
      throw new Error("Uploaded source image is empty.");
    }

    const extension =
      path.extname(file.name || "") ||
      getExtensionFromMimeType(file.type || "image/jpeg");

    const tempDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "sohozkaj-gemini-"),
    );

    const filePath = path.join(
      tempDirectory,
      `source-${randomUUID()}${extension}`,
    );

    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    return {
      filePath,
      tempDirectory,
    };
  }

  const imageUrlValue = formData.get("imageUrl");

  const imageUrl =
    typeof imageUrlValue === "string" ? imageUrlValue.trim() : "";

  if (!imageUrl) {
    throw new Error("No source image was provided.");
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error("The provided image URL is invalid.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("The provided image URL must use HTTP or HTTPS.");
  }

  const response = await fetch(parsedUrl.toString(), {
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Could not fetch source image (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer.byteLength) {
    throw new Error("Fetched source image is empty.");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";

  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("The provided URL does not point to an image.");
  }

  const extension = getExtensionFromMimeType(contentType);

  const tempDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "sohozkaj-gemini-"),
  );

  const filePath = path.join(
    tempDirectory,
    `source-${randomUUID()}${extension}`,
  );

  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  return {
    filePath,
    tempDirectory,
  };
}

async function cleanupDirectory(directoryPath: string | null): Promise<void> {
  if (!directoryPath) {
    return;
  }

  await fs
    .rm(directoryPath, {
      recursive: true,
      force: true,
    })
    .catch(() => {});
}

async function runGeminiBotProcess(
  imagePath: string,
  prompt: string,
): Promise<BotProcessResult> {
  const botPath = path.join(process.cwd(), "bot", "record.js");

  try {
    await fs.access(botPath);
  } catch {
    throw new Error(`Gemini bot file was not found at: ${botPath}`);
  }

  return await new Promise<BotProcessResult>((resolve, reject) => {
    const child = spawn(process.execPath, [botPath, imagePath, prompt], {
      cwd: process.cwd(),
      env: {
        ...process.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Could not start Gemini bot process: ${getErrorMessage(error)}`,
        ),
      );
    });

    child.on("close", async (exitCode) => {
      const outputLines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const outputLine = [...outputLines]
        .reverse()
        .find((line) => line.startsWith("OUTPUT_IMAGE="));

      if (exitCode !== 0 || !outputLine) {
        const combinedError =
          stderr.trim() ||
          stdout.trim() ||
          `Gemini bot exited with code ${exitCode}.`;

        reject(new Error(combinedError));

        return;
      }

      const outputPath = outputLine.slice("OUTPUT_IMAGE=".length).trim();

      if (!outputPath) {
        reject(
          new Error(
            "Gemini bot completed without returning an output image path.",
          ),
        );

        return;
      }

      try {
        const resolvedOutputPath = path.resolve(outputPath);

        const expectedOutputDirectory = path.resolve(
          process.cwd(),
          "bot",
          "generated",
        );

        const relativeToGenerated = path.relative(
          expectedOutputDirectory,
          resolvedOutputPath,
        );

        const isInsideGeneratedDirectory =
          relativeToGenerated !== "" &&
          !relativeToGenerated.startsWith(`..${path.sep}`) &&
          relativeToGenerated !== ".." &&
          !path.isAbsolute(relativeToGenerated);

        if (!isInsideGeneratedDirectory) {
          reject(
            new Error("Gemini bot returned an invalid output image path."),
          );

          return;
        }

        await fs.access(resolvedOutputPath);

        resolve({
          outputPath: resolvedOutputPath,
          stdout,
          stderr,
        });
      } catch {
        reject(
          new Error(
            "Gemini bot reported an output image, but the generated file could not be found.",
          ),
        );
      }
    });
  });
}

export async function POST(req: Request) {
  let sourceFilePath: string | null = null;

  let sourceTempDirectory: string | null = null;

  let generatedImagePath: string | null = null;

  try {
    const formData = await req.formData();

    const promptValue = formData.get("prompt");

    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "No editing prompt was provided.",
        },
        { status: 400 },
      );
    }

    const sourceFile = await createTemporarySourceFile(formData);

    sourceFilePath = sourceFile.filePath;

    sourceTempDirectory = sourceFile.tempDirectory;

    const botResult = await withGeminiQueue(() =>
      runGeminiBotProcess(sourceFilePath!, prompt),
    );

    generatedImagePath = botResult.outputPath;

    const generatedBuffer = await fs.readFile(generatedImagePath);

    if (!generatedBuffer.length) {
      throw new Error("Gemini bot returned an empty generated image.");
    }

    const extension = path.extname(generatedImagePath) || ".jpg";

    const mimeType = getMimeTypeFromExtension(extension);

    const base64 = generatedBuffer.toString("base64");

    const image = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      provider: "gemini-playwright-local",
      image,
    });
  } catch (error) {
    console.error("Local Gemini image-generation route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  } finally {
    await cleanupDirectory(sourceTempDirectory);

    if (generatedImagePath) {
      await fs.unlink(generatedImagePath).catch(() => {});
    }
  }
}
