import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import QuestionPaper from "@/models/QuestionPaper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_super_secret_key_here";

function tokenFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer "))
    return authorization.slice(7).trim();
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function userIdFromRequest(request: Request) {
  const token = tokenFromRequest(request);
  if (!token) throw new Error("AUTH_REQUIRED");
  const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
  if (!decoded.userId || !mongoose.isValidObjectId(decoded.userId)) {
    throw new Error("INVALID_USER_ID");
  }
  return decoded.userId;
}

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 },
    );
  }
  if (error instanceof Error && error.message === "INVALID_USER_ID") {
    return NextResponse.json(
      { success: false, error: "Invalid user session." },
      { status: 401 },
    );
  }
  if (
    error instanceof jwt.TokenExpiredError ||
    error instanceof jwt.JsonWebTokenError
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired token." },
      { status: 401 },
    );
  }
  return null;
}

function serialize(paper: any) {
  return {
    id: String(paper._id),
    title: paper.title,
    className: paper.className,
    subjectName: paper.subjectName,
    chapterName: paper.chapterName,
    selectedQuestions: paper.selectedQuestions,
    settings: paper.settings || {},
    isDraft: paper.isDraft,
    createdAt: paper.createdAt,
    updatedAt: paper.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    const userId = userIdFromRequest(request);
    await connectDB();

    const papers = await QuestionPaper.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, data: papers.map(serialize) });
  } catch (error) {
    const auth = handleAuthError(error);
    if (auth) return auth;
    console.error("[question-papers] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load saved papers." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = userIdFromRequest(request);
    const body = await request.json().catch(() => ({}));

    if (!Array.isArray(body?.selectedQuestions)) {
      return NextResponse.json(
        { success: false, error: "selectedQuestions must be an array." },
        { status: 400 },
      );
    }

    const selectedQuestions = body.selectedQuestions
      .filter((item: unknown) => item && typeof item === "object")
      .slice(0, 500)
      .map((item: any, index: number) => ({
        id: String(item.id || `q-${index + 1}`),
        type: String(item.type || "Descriptive"),
        question: String(item.question || "").trim(),
        options: Array.isArray(item.options)
          ? item.options.map((value: unknown) => String(value)).slice(0, 8)
          : [],
        answer: item.answer ? String(item.answer) : "",
        marks: Math.max(1, Math.min(100, Number(item.marks) || 1)),
      }))
      .filter((item: { question: string }) => item.question);

    if (!selectedQuestions.length) {
      return NextResponse.json(
        { success: false, error: "At least one valid question is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const created = await QuestionPaper.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: String(body?.title || "Question Paper")
        .trim()
        .slice(0, 160),
      className: String(body?.className || "")
        .trim()
        .slice(0, 80),
      subjectName: String(body?.subjectName || "")
        .trim()
        .slice(0, 200),
      chapterName: String(body?.chapterName || "")
        .trim()
        .slice(0, 200),
      selectedQuestions,
      settings:
        body?.settings && typeof body.settings === "object"
          ? body.settings
          : {},
      isDraft: body?.isDraft !== false,
    });

    return NextResponse.json(
      { success: true, data: serialize(created) },
      { status: 201 },
    );
  } catch (error) {
    const auth = handleAuthError(error);
    if (auth) return auth;
    console.error("[question-papers] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save question paper." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = userIdFromRequest(request);
    const id = new URL(request.url).searchParams.get("id") || "";

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, error: "Valid paper ID is required." },
        { status: 400 },
      );
    }

    await connectDB();

    const deleted = await QuestionPaper.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Question paper not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question paper deleted.",
    });
  } catch (error) {
    const auth = handleAuthError(error);
    if (auth) return auth;
    console.error("[question-papers] DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete question paper." },
      { status: 500 },
    );
  }
}
