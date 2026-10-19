import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getUserIdFromToken } from "@/app/api/_lib/requireActiveSubscription";
import AIImageJob from "@/models/AIImageJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearer = authorization.slice(7).trim();
    if (bearer) return bearer;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const token = getTokenFromRequest(request);
  const userId = getUserIdFromToken(token);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Authentication required or session expired." },
      { status: 401 },
    );
  }

  const { jobId } = await context.params;
  if (!mongoose.isValidObjectId(jobId)) {
    return NextResponse.json(
      { success: false, error: "Invalid job ID." },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const job = await AIImageJob.findOne({
      _id: jobId,
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select("_id status resultUrl errorMessage updatedAt completedAt")
      .lean();

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        job: {
          id: String(job._id),
          status: job.status,
          resultUrl: job.status === "completed" ? job.resultUrl || null : null,
          error:
            job.status === "failed"
              ? "Image generation failed. Please try again."
              : null,
          updatedAt: job.updatedAt,
          completedAt: job.completedAt || null,
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("AI image job status error:", error);
    return NextResponse.json(
      { success: false, error: "Could not retrieve job status." },
      { status: 500 },
    );
  }
}
