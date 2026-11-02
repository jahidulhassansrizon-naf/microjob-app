import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import AIGeneration from "@/models/AIGeneration";
import ScannedDocument from "@/models/ScannedDocument";
import SavedForm from "@/models/SavedForm";
import { FILE_RETENTION_DAYS, getRetentionCutoff } from "./retentionConfig";

export { FILE_RETENTION_DAYS, getRetentionCutoff };

/**
 * Automatic deletion of user photos/files after FILE_RETENTION_DAYS.
 *
 * Runs from the daily cron route (app/api/cron/cleanup-files). For every expired
 * record it deletes the Cloudinary asset FIRST and the MongoDB record only after
 * Cloudinary confirmed ("ok" / "not found"). If Cloudinary fails, the record is
 * kept so the next run retries it - no orphaned images, no lost references.
 *
 * A second pass sweeps Cloudinary itself for user photos older than the
 * retention period that no database record points to any more (e.g. uploaded
 * but never saved), so nothing stays in the cloud past 30 days.
 */

/** All user photos live under this Cloudinary folder (see api/upload, api/generate-photo). */
const USER_PHOTO_FOLDER = "sohozkaj-ai-photos";
const BATCH_SIZE = 100;

// Same collection as app/api/my-files/route.ts ("userfiles"). Registered under a
// DIFFERENT model name with a loose schema so it can never replace the strict
// "UserFile" model (enum/defaults) that the my-files route defines.
const UserFile =
  mongoose.models.UserFileRetention ||
  mongoose.model(
    "UserFileRetention",
    new mongoose.Schema({}, { strict: false, timestamps: true, collection: "userfiles" }),
  );

export type RetentionReport = {
  cutoff: string;
  deletedRecords: Record<string, number>;
  failedRecords: Record<string, number>;
  orphanAssetsDeleted: number;
  timedOut: boolean;
  errors: string[];
};

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function publicIdFromUrl(fileUrl: string): string {
  if (!fileUrl) return "";
  let url: URL;
  try {
    url = new URL(fileUrl);
  } catch {
    return "";
  }
  if (url.hostname !== "res.cloudinary.com" && !url.hostname.endsWith(".res.cloudinary.com")) {
    return "";
  }
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return "";
  let assetParts = parts.slice(uploadIndex + 1);
  const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));
  if (versionIndex >= 0) assetParts = assetParts.slice(versionIndex + 1);
  if (!assetParts.length) return "";
  const last = assetParts[assetParts.length - 1];
  const dot = last.lastIndexOf(".");
  if (dot > 0) assetParts[assetParts.length - 1] = last.slice(0, dot);
  return assetParts.join("/");
}

/** Returns true when the asset is gone from Cloudinary (deleted or never existed). */
async function destroyAsset(publicId: string): Promise<boolean> {
  if (!publicId) return true; // nothing in the cloud to remove
  for (const resourceType of ["image", "raw", "video"] as const) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "upload",
      invalidate: true,
    });
    if (result?.result === "ok") return true;
  }
  // Every resource type said "not found" -> already gone.
  return true;
}

type Target = {
  label: string;
  model: any;
  /** Mongo filter (besides the date) that selects records to expire. */
  extraFilter?: Record<string, unknown>;
  select: string;
  getPublicId: (doc: any) => string;
};

const TARGETS: Target[] = [
  {
    label: "aiGenerations", // AI Editor, Manual Editor, Bulk Photo Edit, AI Template results
    model: AIGeneration,
    select: "_id publicId url",
    getPublicId: (doc) => str(doc.publicId) || publicIdFromUrl(str(doc.url)),
  },
  {
    label: "scannedDocuments",
    model: ScannedDocument,
    select: "_id publicId imageUrl",
    getPublicId: (doc) => str(doc.publicId) || publicIdFromUrl(str(doc.imageUrl)),
  },
  {
    label: "userFiles", // files saved from tools / templates / bulk editor via /api/my-files
    model: UserFile,
    select: "_id publicId url",
    getPublicId: (doc) => str(doc.publicId) || publicIdFromUrl(str(doc.url)),
  },
  {
    // Saved forms only count as "photos" when they point at an uploaded image.
    label: "savedFormsWithImages",
    model: SavedForm,
    extraFilter: {
      $or: [
        { "formData.publicId": { $exists: true, $ne: "" } },
        { "formData.cloudinaryPublicId": { $exists: true, $ne: "" } },
        { "formData.uploadedPublicId": { $exists: true, $ne: "" } },
        { "formData.url": /res\.cloudinary\.com/ },
        { "formData.imageUrl": /res\.cloudinary\.com/ },
        { "formData.fileUrl": /res\.cloudinary\.com/ },
      ],
    },
    select: "_id formData.publicId formData.cloudinaryPublicId formData.uploadedPublicId formData.url formData.imageUrl formData.fileUrl",
    getPublicId: (doc) => {
      const data = doc.formData && typeof doc.formData === "object" ? doc.formData : {};
      return (
        str(data.publicId) ||
        str(data.cloudinaryPublicId) ||
        str(data.uploadedPublicId) ||
        publicIdFromUrl(str(data.url)) ||
        publicIdFromUrl(str(data.imageUrl)) ||
        publicIdFromUrl(str(data.fileUrl))
      );
    },
  },
];

async function purgeExpiredRecords(
  target: Target,
  cutoff: Date,
  deadline: number,
  report: RetentionReport,
) {
  report.deletedRecords[target.label] = 0;
  report.failedRecords[target.label] = 0;
  const skipIds: unknown[] = []; // records that failed this run, so we don't loop on them

  while (Date.now() < deadline) {
    const docs: any[] = await target.model
      .find({
        createdAt: { $lt: cutoff },
        ...(skipIds.length ? { _id: { $nin: skipIds } } : {}),
        ...(target.extraFilter || {}),
      })
      .select(target.select)
      .limit(BATCH_SIZE)
      .lean();

    if (!docs.length) return;

    const deletableIds: unknown[] = [];
    for (const doc of docs) {
      if (Date.now() >= deadline) {
        report.timedOut = true;
        break;
      }
      try {
        const gone = await destroyAsset(target.getPublicId(doc));
        if (gone) deletableIds.push(doc._id);
      } catch (error) {
        skipIds.push(doc._id);
        report.failedRecords[target.label] += 1;
        report.errors.push(
          `${target.label}:${String(doc._id)} ${error instanceof Error ? error.message : "cloudinary error"}`,
        );
      }
    }

    if (deletableIds.length) {
      await target.model.deleteMany({ _id: { $in: deletableIds } });
      report.deletedRecords[target.label] += deletableIds.length;
    }

    if (report.timedOut) return;
  }
  report.timedOut = true;
}

/** Cloudinary photos past the retention period that no live DB record references. */
async function sweepOrphanAssets(cutoff: Date, deadline: number, report: RetentionReport) {
  const retentionExpr = `created_at<${FILE_RETENTION_DAYS}d`;

  while (Date.now() < deadline) {
    const search: any = await cloudinary.search
      .expression(`(folder:${USER_PHOTO_FOLDER}/* OR public_id:${USER_PHOTO_FOLDER}/*) AND ${retentionExpr}`)
      .max_results(BATCH_SIZE)
      .execute();

    const resources: Array<{ public_id: string; created_at?: string }> = Array.isArray(search?.resources)
      ? search.resources
      : [];
    if (!resources.length) return;

    const ids = resources
      .filter((item) => item.public_id && (!item.created_at || new Date(item.created_at) < cutoff))
      .map((item) => item.public_id);
    if (!ids.length) return;

    // Never delete an asset a still-valid (<30 day) record uses.
    const stillReferenced = new Set<string>();
    for (const model of [AIGeneration, UserFile, ScannedDocument] as any[]) {
      const docs: any[] = await model
        .find({ publicId: { $in: ids }, createdAt: { $gte: cutoff } })
        .select("publicId")
        .lean();
      docs.forEach((doc) => stillReferenced.add(str(doc.publicId)));
    }

    const toDelete = ids.filter((id) => !stillReferenced.has(id));
    if (!toDelete.length) return; // everything left is protected; avoid an endless loop

    await cloudinary.api.delete_resources(toDelete, { type: "upload", resource_type: "image", invalidate: true });
    report.orphanAssetsDeleted += toDelete.length;
  }
  report.timedOut = true;
}

export async function runFileRetentionCleanup(options: { maxMs?: number } = {}): Promise<RetentionReport> {
  const cutoff = getRetentionCutoff();
  const deadline = Date.now() + (options.maxMs ?? 50_000);
  const report: RetentionReport = {
    cutoff: cutoff.toISOString(),
    deletedRecords: {},
    failedRecords: {},
    orphanAssetsDeleted: 0,
    timedOut: false,
    errors: [],
  };

  configureCloudinary();

  for (const target of TARGETS) {
    if (Date.now() >= deadline) {
      report.timedOut = true;
      break;
    }
    try {
      await purgeExpiredRecords(target, cutoff, deadline, report);
    } catch (error) {
      report.errors.push(`${target.label}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  if (Date.now() < deadline) {
    try {
      await sweepOrphanAssets(cutoff, deadline, report);
    } catch (error) {
      report.errors.push(`orphanSweep: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  report.errors = report.errors.slice(0, 20);
  return report;
}
