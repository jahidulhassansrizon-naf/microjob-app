import { NextResponse } from "next/server";
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

const UserFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    category: { type: String, required: true },
    toolName: { type: String, required: true },
    group: { type: String, default: "image" },
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { timestamps: true, collection: "userfiles" },
);
const UserFile = mongoose.models.UserFile || mongoose.model("UserFile", UserFileSchema);

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

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    await connectDB();
    const objectId = new mongoose.Types.ObjectId(userId);
    const [generations, scannedDocuments, savedForms, questionPapers, userFiles] = await Promise.all([
      AIGeneration.find({ userId: objectId }).sort({ createdAt: -1 }).lean(),
      ScannedDocument.find({ userId: objectId }).sort({ createdAt: -1 }).lean(),
      SavedForm.find({ userId }).sort({ createdAt: -1 }).lean(),
      QuestionPaper.find({ userId }).sort({ updatedAt: -1 }).limit(50).lean(),
      UserFile.find({ userId: objectId }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

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
      ...userFiles.filter((item: any) => ["ai-template-generated", "bulk-photo-edit", "ai-photo-edit", "manually-edited"].includes(item.category)).map((item: any) => ({
        id: `user-file:${String(item._id)}`,
        name: clean(item.name, "Saved file"),
        category: item.category,
        createdAt: item.createdAt,
        url: item.url || "",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
        const data = item.formData && typeof item.formData === "object" ? item.formData : {};
        const toolName = clean(data.toolName || data.tool || data.source, "SohozTools");
        const name = clean(data.fileName || data.title || data.name, `${toolName} file`);
        return { id: `saved-form:${String(item._id)}`, name, toolName, group: "general", createdAt: item.createdAt, url: clean(data.url || data.imageUrl || data.fileUrl) };
      }),
      ...userFiles.map((item: any) => ({
        id: `user-file:${String(item._id)}`,
        name: clean(item.name, "Saved file"),
        toolName: clean(item.toolName, "SohozTools"),
        group: clean(item.group, "image"),
        createdAt: item.createdAt,
        url: item.url || "",
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
    if (!url) return NextResponse.json({ success: false, error: "A file URL is required." }, { status: 400 });
    await connectDB();
    const created = await UserFile.create({ userId: new mongoose.Types.ObjectId(userId), name, category, toolName, group, url, publicId });
    return NextResponse.json({ success: true, data: { id: `user-file:${String(created._id)}`, name: created.name, category: created.category, toolName: created.toolName, group: created.group, createdAt: created.createdAt, url: created.url } }, { status: 201 });
  } catch (error) {
    const response = authError(error);
    if (response) return response;
    console.error("[my-files] POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to save file." }, { status: 500 });
  }
}
