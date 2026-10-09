import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import AIGeneration from "@/models/AIGeneration";
import ScannedDocument from "@/models/ScannedDocument";
import SavedForm from "@/models/SavedForm";
import QuestionPaper from "@/models/QuestionPaper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

type FileWorkspace = "creative" | "sohoz-tools";

const CREATIVE_FILE_CATEGORIES = new Set([
  "ai-template-generated",
  "bulk-photo-edit",
  "ai-photo-edit",
  "manually-edited",
]);

const UserFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    category: { type: String, required: true },
    toolName: { type: String, required: true },
    group: { type: String, default: "image" },
    workspace: {
      type: String,
      enum: ["creative", "sohoz-tools"],
      default: "sohoz-tools",
      index: true,
    },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { timestamps: true, collection: "userfiles" },
);
const UserFile = mongoose.models.UserFile || mongoose.model("UserFile", UserFileSchema);

function getWorkspace(item: { workspace?: unknown; category?: unknown }): FileWorkspace {
  const workspace = clean(item.workspace).toLowerCase();

  if (workspace === "creative" || workspace === "sohoz-tools") {
    return workspace;
  }

  // Existing UserFile rows were created before workspace was introduced.
  // Their category is enough to keep the old AI/editor files on the left side
  // while keeping SohozTools-only records on the right.
  return CREATIVE_FILE_CATEGORIES.has(clean(item.category))
    ? "creative"
    : "sohoz-tools";
}

function getUserId(request: Request) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  const token = bearer || (match ? decodeURIComponent(match[1]) : "");
  if (!token) throw new Error("AUTH_REQUIRED");
  const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
  if (!decoded.userId || !mongoose.isValidObjectId(decoded.userId)) throw new Error("INVALID_USER_ID");
  return decoded.userId;
}
function authError(error: unknown) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  if (error instanceof Error && error.message === "INVALID_USER_ID") return NextResponse.json({ success: false, error: "Invalid user session." }, { status: 401 });
  if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) return NextResponse.json({ success: false, error: "Invalid or expired token." }, { status: 401 });
  return null;
}
function clean(value: unknown, fallback = "") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }

function configureCloudinary() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function publicIdFromCloudinaryUrl(fileUrl: string): string {
  if (!fileUrl) return "";

  let url: URL;
  try {
    url = new URL(fileUrl);
  } catch {
    return "";
  }

  const validHost =
    url.hostname === "res.cloudinary.com" ||
    url.hostname.endsWith(".res.cloudinary.com");
  if (!validHost) return "";

  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return "";

  let assetParts = parts.slice(uploadIndex + 1);
  const versionIndex = assetParts.findIndex((part) => /^v\d+$/.test(part));

  if (versionIndex >= 0) {
    assetParts = assetParts.slice(versionIndex + 1);
  } else {
    while (assetParts.length > 0) {
      const first = assetParts[0];
      const looksLikeTransformation =
        first.includes(",") ||
        first.includes(":") ||
        /(^|_)(w|h|c|g|q|f|e|ar|dpr|r|bo|b|fl)_/.test(first);
      if (!looksLikeTransformation) break;
      assetParts.shift();
    }
  }

  if (assetParts.length === 0) return "";

  const last = assetParts[assetParts.length - 1];
  const dotIndex = last.lastIndexOf(".");
  if (dotIndex > 0) {
    assetParts[assetParts.length - 1] = last.slice(0, dotIndex);
  }

  return assetParts.join("/");
}

async function deleteCloudinaryAsset(publicId: string) {
  if (!publicId) return "skipped";

  configureCloudinary();

  const resourceTypes = ["image", "video", "raw"] as const;
  let lastResult = "not found";

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      type: "upload",
      invalidate: true,
    });

    const status = String(result?.result || "unknown");
    lastResult = status;

    if (status === "ok" || status === "not found") {
      if (status === "ok") return status;
      continue;
    }
  }

  if (lastResult !== "not found") {
    throw new Error(`Cloudinary delete returned: ${lastResult}`);
  }

  return lastResult;
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    await connectDB();
    const objectId = new mongoose.Types.ObjectId(userId);
    const [generations, scannedDocuments, savedForms, questionPapers, userFiles] = await Promise.all([
      // Fetch only fields displayed by My Files. Image payloads and other
      // generation metadata are not needed to render the listing.
      AIGeneration.find({ userId: objectId })
        .select("_id source createdAt url")
        .sort({ createdAt: -1 })
        .lean(),
      ScannedDocument.find({ userId: objectId })
        .select("_id title createdAt imageUrl")
        .sort({ createdAt: -1 })
        .lean(),
      SavedForm.find({ userId })
        .select("_id createdAt formData.toolName formData.tool formData.source formData.fileName formData.title formData.name formData.url formData.imageUrl formData.fileUrl")
        .sort({ createdAt: -1 })
        .lean(),
      QuestionPaper.find({ userId })
        .select("_id title createdAt updatedAt")
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean(),
      UserFile.find({ userId: objectId })
        .select("_id name category toolName group workspace url createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const creativeUserFiles = userFiles.filter(
      (item: any) =>
        getWorkspace(item) === "creative" &&
        CREATIVE_FILE_CATEGORIES.has(clean(item.category)),
    );

    const sohozToolUserFiles = userFiles.filter(
      (item: any) => getWorkspace(item) === "sohoz-tools",
    );

    const files = [
      ...generations.map((item: any) => ({
        id: `generation:${String(item._id)}`,
        name: `${item.source === "manual-editor" ? "Manual Edit" : "AI Edit"} · ${String(item._id).slice(-6)}`,
        category: item.source === "manual-editor" ? "manually-edited" : "ai-photo-edit",
        createdAt: item.createdAt,
        url: item.url || "",
      })),
      ...questionPapers.map((item: any) => ({
        id: `question-paper:${String(item._id)}`,
        name: clean(item.title, "Question Paper"),
        category: "question-papers",
        createdAt: item.updatedAt || item.createdAt,
        url: "",
      })),
      ...creativeUserFiles.map((item: any) => ({
        id: `user-file:${String(item._id)}`,
        name: clean(item.name, "Saved file"),
        category: item.category,
        createdAt: item.createdAt,
        url: item.url || "",
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const toolFiles = [
      ...scannedDocuments.map((item: any) => ({
        id: `scan:${String(item._id)}`,
        name: clean(item.title, "Scanned Document"),
        toolName: "Document Scanner",
        group: "image",
        createdAt: item.createdAt,
        url: item.imageUrl || "",
      })),
      ...savedForms.map((item: any) => {
        const data =
          item.formData && typeof item.formData === "object"
            ? item.formData
            : {};
        const toolName = clean(
          data.toolName || data.tool || data.source,
          "SohozTools",
        );
        const name = clean(
          data.fileName || data.title || data.name,
          `${toolName} file`,
        );
        return {
          id: `saved-form:${String(item._id)}`,
          name,
          toolName,
          group: "general",
          createdAt: item.createdAt,
          url: clean(data.url || data.imageUrl || data.fileUrl),
        };
      }),
      ...sohozToolUserFiles.map((item: any) => ({
        id: `user-file:${String(item._id)}`,
        name: clean(item.name, "Saved file"),
        toolName: clean(item.toolName, "SohozTools"),
        group: clean(item.group, "image"),
        createdAt: item.createdAt,
        url: item.url || "",
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ success: true, data: { files, toolFiles } });
  } catch (error) {
    const response = authError(error);
    if (response) return response;
    console.error("[my-files] GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load saved files." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    const body = await request.json().catch(() => ({}));
    const name = clean(body?.name, "Saved file").slice(0, 180);
    const category = clean(body?.category, "generated-images");
    const toolName = clean(body?.toolName, "SohozTools").slice(0, 120);
    const group = clean(body?.group, "image").slice(0, 40);
    const url = clean(body?.url);
    const publicId = clean(body?.publicId);
    const requestedWorkspace = clean(body?.workspace).toLowerCase();
    const workspace: FileWorkspace =
      requestedWorkspace === "creative" || requestedWorkspace === "sohoz-tools"
        ? requestedWorkspace
        : CREATIVE_FILE_CATEGORIES.has(category)
          ? "creative"
          : "sohoz-tools";

    if (!url)
      return NextResponse.json(
        { success: false, error: "A file URL is required." },
        { status: 400 },
      );

    if (
      workspace === "creative" &&
      !CREATIVE_FILE_CATEGORIES.has(category)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid creative file category." },
        { status: 400 },
      );
    }

    if (
      workspace === "sohoz-tools" &&
      CREATIVE_FILE_CATEGORIES.has(category)
    ) {
      return NextResponse.json(
        { success: false, error: "Creative files cannot be saved in SohozTools Files." },
        { status: 400 },
      );
    }

    await connectDB();
    const created = await UserFile.create({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      category,
      toolName,
      group,
      workspace,
      url,
      publicId,
    });
    return NextResponse.json(
      {
        success: true,
        data: {
          id: `user-file:${String(created._id)}`,
          name: created.name,
          category: created.category,
          toolName: created.toolName,
          group: created.group,
          workspace: created.workspace,
          createdAt: created.createdAt,
          url: created.url,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const response = authError(error);
    if (response) return response;
    console.error("[my-files] POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to save file." }, { status: 500 });
  }
}


export async function DELETE(request: Request) {
  try {
    const userId = getUserId(request);
    const body = await request.json().catch(() => ({}));
    const rawId = clean(body?.id);

    const separatorIndex = rawId.indexOf(":");
    const source = separatorIndex > 0 ? rawId.slice(0, separatorIndex) : "";
    const id = separatorIndex > 0 ? rawId.slice(separatorIndex + 1) : "";

    if (!source || !id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Valid My Files item ID is required." },
        { status: 400 },
      );
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    if (source === "generation") {
      const generation = await AIGeneration.findOne({
        _id: id,
        userId: userObjectId,
      });

      if (!generation) {
        return NextResponse.json(
          { success: false, error: "File not found." },
          { status: 404 },
        );
      }

      const publicId =
        clean(generation.publicId) ||
        publicIdFromCloudinaryUrl(clean(generation.url));

      let cloudinaryStatus = "skipped";
      if (publicId) {
        cloudinaryStatus = await deleteCloudinaryAsset(publicId);
      }

      await AIGeneration.deleteOne({ _id: generation._id });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully.",
        cloudinary: cloudinaryStatus,
      });
    }

    if (source === "scan") {
      const document = await ScannedDocument.findOne({
        _id: id,
        userId: userObjectId,
      });

      if (!document) {
        return NextResponse.json(
          { success: false, error: "File not found." },
          { status: 404 },
        );
      }

      const publicId =
        clean(document.publicId) ||
        publicIdFromCloudinaryUrl(clean(document.imageUrl));

      let cloudinaryStatus = "skipped";
      if (publicId) {
        cloudinaryStatus = await deleteCloudinaryAsset(publicId);
      }

      await ScannedDocument.deleteOne({ _id: document._id });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully.",
        cloudinary: cloudinaryStatus,
      });
    }

    if (source === "saved-form") {
      const form = await SavedForm.findOne({ _id: id, userId });

      if (!form) {
        return NextResponse.json(
          { success: false, error: "File not found." },
          { status: 404 },
        );
      }

      const formData =
        form.formData && typeof form.formData === "object" ? form.formData : {};
      const publicId = clean(
        (formData as any)?.publicId ||
          (formData as any)?.cloudinaryPublicId ||
          (formData as any)?.uploadedPublicId,
      );

      let cloudinaryStatus = "skipped";
      if (publicId) {
        cloudinaryStatus = await deleteCloudinaryAsset(publicId);
      }

      await SavedForm.deleteOne({ _id: form._id });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully.",
        cloudinary: cloudinaryStatus,
      });
    }

    if (source === "question-paper") {
      const paper = await QuestionPaper.findOne({ _id: id, userId });

      if (!paper) {
        return NextResponse.json(
          { success: false, error: "File not found." },
          { status: 404 },
        );
      }

      await QuestionPaper.deleteOne({ _id: paper._id });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully.",
      });
    }

    if (source === "user-file") {
      const userFile = await UserFile.findOne({
        _id: id,
        userId: userObjectId,
      });

      if (!userFile) {
        return NextResponse.json(
          { success: false, error: "File not found." },
          { status: 404 },
        );
      }

      const publicId =
        clean(userFile.publicId) ||
        publicIdFromCloudinaryUrl(clean(userFile.url));

      let cloudinaryStatus = "skipped";
      if (publicId) {
        cloudinaryStatus = await deleteCloudinaryAsset(publicId);
      }

      await UserFile.deleteOne({ _id: userFile._id });

      return NextResponse.json({
        success: true,
        message: "File deleted successfully.",
        cloudinary: cloudinaryStatus,
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported My Files item." },
      { status: 400 },
    );
  } catch (error) {
    const response = authError(error);
    if (response) return response;

    console.error("[my-files] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete saved file.",
      },
      { status: 500 },
    );
  }
}
