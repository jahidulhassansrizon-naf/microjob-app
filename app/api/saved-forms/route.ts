import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import SavedForm from "@/models/SavedForm";
import { requireToolAccess } from "@/app/api/_lib/requireActiveSubscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "";

function getTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice(7).trim();
    if (token) return token;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getUserIdFromRequest(request: Request): string {
  const token = getTokenFromRequest(request);

  if (!token) throw new Error("AUTH_REQUIRED");

  const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
  const userId = typeof decoded.userId === "string" ? decoded.userId : "";

  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  return userId;
}

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "AUTH_REQUIRED") {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  if (
    error instanceof jwt.TokenExpiredError ||
    error instanceof jwt.JsonWebTokenError
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token." },
      { status: 401 },
    );
  }

  if (error instanceof Error && error.message === "INVALID_USER_ID") {
    return NextResponse.json(
      { success: false, message: "Invalid user session." },
      { status: 401 },
    );
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const toolAccess = await requireToolAccess(request);
    if (!toolAccess.ok) return toolAccess.response;
    const userId = getUserIdFromRequest(request);
    await connectDB();

    const forms = await SavedForm.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: forms }, { status: 200 });
  } catch (error: unknown) {
    const auth = handleAuthError(error);
    if (auth) return auth;

    console.error("[saved-forms] GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch forms" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const toolAccess = await requireToolAccess(request);
    if (!toolAccess.ok) return toolAccess.response;
    const userId = getUserIdFromRequest(request);
    const body = await request.json();

    await connectDB();

    const newForm = await SavedForm.create({
      userId,
      formData: body,
    });

    return NextResponse.json(
      { success: true, message: "Form saved successfully", data: newForm },
      { status: 201 },
    );
  } catch (error: unknown) {
    const auth = handleAuthError(error);
    if (auth) return auth;

    console.error("[saved-forms] POST error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save form" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const toolAccess = await requireToolAccess(request);
    if (!toolAccess.ok) return toolAccess.response;
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Valid form ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    await connectDB();

    const updatedForm = await SavedForm.findOneAndUpdate(
      { _id: id, userId },
      { formData: body },
      { new: true, runValidators: true },
    ).lean();

    if (!updatedForm) {
      return NextResponse.json(
        { success: false, message: "Form not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Form updated successfully", data: updatedForm },
      { status: 200 },
    );
  } catch (error: unknown) {
    const auth = handleAuthError(error);
    if (auth) return auth;

    console.error("[saved-forms] PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update form" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const toolAccess = await requireToolAccess(request);
    if (!toolAccess.ok) return toolAccess.response;
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")?.trim() || "";

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Valid form ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const deleted = await SavedForm.findOneAndDelete({ _id: id, userId });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Form not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error: unknown) {
    const auth = handleAuthError(error);
    if (auth) return auth;

    console.error("[saved-forms] DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete form" },
      { status: 500 },
    );
  }
}
