import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GenerationLock from "@/models/GenerationLock";

// A little longer than the routes' maxDuration (300s) so a lock can never expire
// while its own generation is still legitimately running.
const LOCK_LIFETIME_MS = 330_000;

let indexesReady: Promise<unknown> | null = null;

export type GenerationRelease = () => Promise<void>;

/**
 * Try to take the user's single "generating an image" slot.
 * Returns a release function on success, or null when this user already has
 * an image being generated. Never blocks generation because of a database hiccup.
 */
export async function acquireGenerationLock(userId: string): Promise<GenerationRelease | null> {
  const noop: GenerationRelease = async () => {};
  try {
    await connectDB();
    if (!indexesReady) indexesReady = GenerationLock.init().catch(() => undefined);
    await indexesReady;

    const token = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_LIFETIME_MS);

    // 1) Take over a lock that has already expired but was not cleaned up yet.
    const takenOver = await GenerationLock.findOneAndUpdate(
      { userId, expiresAt: { $lte: now } },
      { $set: { token, expiresAt } },
      { new: true },
    );

    // 2) Otherwise create one. The unique userId index rejects a second live lock.
    if (!takenOver) {
      try {
        await GenerationLock.create({ userId, token, expiresAt });
      } catch (error: any) {
        if (error?.code === 11000) return null;
        throw error;
      }
    }

    return async () => {
      try {
        await GenerationLock.deleteOne({ userId, token });
      } catch {
        // The TTL index clears it shortly anyway.
      }
    };
  } catch (error) {
    console.error("Generation lock error (continuing without lock):", error);
    return noop;
  }
}

export function generationBusyResponse() {
  return NextResponse.json(
    {
      success: false,
      code: "GENERATION_IN_PROGRESS",
      error:
        "আপনার আগের একটি ছবি এখনও তৈরি হচ্ছে। সেটি শেষ হলে আবার চেষ্টা করুন। (Your previous image is still being generated - please try again when it finishes.)",
    },
    { status: 429, headers: { "Retry-After": "10" } },
  );
}
