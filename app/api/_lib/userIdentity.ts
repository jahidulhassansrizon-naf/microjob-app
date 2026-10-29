import type { QueryFilter } from "mongoose";
import User from "@/models/User";

/** Canonical representation for strict, case-insensitive account-name uniqueness. */
export function normalizeFullName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ").toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function legacyNamePattern(normalizedName: string): RegExp {
  // Legacy records predate fullNameNormalized. Match the same words while
  // tolerating differences in whitespace and Latin-letter casing.
  const pieces = normalizedName.split(" ").filter(Boolean).map(escapeRegex);
  return new RegExp(`^\\s*${pieces.join("\\s+")}\\s*$`, "i");
}

type IndexCache = typeof globalThis & { __sebaUniqueFullNameIndex?: Promise<string> };

/**
 * Ensure the race-safe index exists before sending verification mail or creating
 * an account. The partial index safely excludes legacy documents until they are
 * updated; legacy names are still checked with the fallback query below.
 */
export async function ensureUniqueFullNameIndex(): Promise<void> {
  const globalCache = globalThis as IndexCache;
  if (!globalCache.__sebaUniqueFullNameIndex) {
    globalCache.__sebaUniqueFullNameIndex = User.collection.createIndex(
      { fullNameNormalized: 1 },
      {
        unique: true,
        name: "uniq_users_full_name_normalized",
        partialFilterExpression: { fullNameNormalized: { $type: "string" } },
      },
    ).catch((error: unknown) => {
      // Permit a clean retry after transient DB failures. Fail closed if the index
      // cannot be established; do not silently allow race-created duplicate names.
      delete globalCache.__sebaUniqueFullNameIndex;
      throw error;
    });
  }
  await globalCache.__sebaUniqueFullNameIndex;
}

/** Returns an existing account whose canonical name conflicts, optionally excluding one account. */
export async function findDuplicateFullName(
  fullName: string,
  exceptUserId?: string,
): Promise<{ _id: unknown; fullName?: string } | null> {
  const normalized = normalizeFullName(fullName);
  if (!normalized) return null;

  const legacyPattern = legacyNamePattern(normalized);
  const filter: QueryFilter<any> = {
    $or: [
      { fullNameNormalized: normalized },
      {
        $and: [
          { fullName: { $regex: legacyPattern } },
          {
            $or: [
              { fullNameNormalized: { $exists: false } },
              { fullNameNormalized: null },
            ],
          },
        ],
      },
    ],
  };
  if (exceptUserId) filter._id = { $ne: exceptUserId };

  const duplicate = await User.findOne(filter).select("_id fullName").lean().exec();
  return duplicate ? { _id: duplicate._id, fullName: duplicate.fullName } : null;
}
