import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import QuestionBank from "@/models/QuestionBank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_YEAR = Number(process.env.NCTB_CURRICULUM_YEAR || 2026);

const TYPE_MAP: Record<string, string | undefined> = {
  all: undefined,
  "All question types": undefined,

  MCQ: "MCQ",

  "Short Questions": "Short",
  Short: "Short",

  "Descriptive Questions": "Descriptive",
  Descriptive: "Descriptive",

  CQ: "CQ",
  Creative: "Creative",
  Written: "Written",
  Practical: "Practical",
};

function clean(value: string | null, max = 200): string {
  return (value || "").trim().slice(0, max);
}

function clampInt(
  value: string | null,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const classKey = clean(searchParams.get("className"), 50);

    const subjectKey = clean(searchParams.get("subject"), 120);

    const chapterKey = clean(searchParams.get("chapter"), 120);

    const requestedType = clean(searchParams.get("type"), 50);

    const search = clean(searchParams.get("search"), 300);

    const limit = clampInt(searchParams.get("limit"), 1, 500, 250);

    if (!classKey || !subjectKey || !chapterKey) {
      return NextResponse.json(
        {
          success: false,
          error: "className, subject and chapter are required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize requested type
    |--------------------------------------------------------------------------
    */

    const normalizedType = TYPE_MAP[requestedType];

    if (
      requestedType &&
      !Object.prototype.hasOwnProperty.call(TYPE_MAP, requestedType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid question type.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | NCTBench imported questions are currently marked `needs-review`.
    | They are textbook-based practice records and therefore must remain
    | visible to the question-paper builder until/if a future review
    | workflow changes their status.
    |
    |--------------------------------------------------------------------------
    */

    const query: Record<string, unknown> = {
      curriculumYear: ACTIVE_YEAR,

      classKey,

      subjectKey,

      chapterKey,

      isActive: true,

      verificationStatus: {
        $in: ["verified", "reviewed", "needs-review"],
      },
    };

    /*
    |--------------------------------------------------------------------------
    | Question type
    |--------------------------------------------------------------------------
    */

    if (normalizedType) {
      query.type = normalizedType;
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (search) {
      const escaped = escapeRegex(search);

      query.$or = [
        {
          question: {
            $regex: escaped,
            $options: "i",
          },
        },

        {
          answer: {
            $regex: escaped,
            $options: "i",
          },
        },

        {
          tags: {
            $regex: escaped,
            $options: "i",
          },
        },
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Query database
    |--------------------------------------------------------------------------
    */

    const questions = await QuestionBank.find(query)
      .sort({
        createdAt: 1,
      })
      .limit(limit)
      .lean();

    /*
    |--------------------------------------------------------------------------
    | Serialize response
    |--------------------------------------------------------------------------
    */

    const serialized = questions.map((item) => ({
      id: String(item._id),

      type: item.type,

      question: String(item.question || ""),

      options: Array.isArray(item.options)
        ? item.options
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
        : [],

      answer: item.answer ? String(item.answer) : undefined,

      marks: Number(item.marks) > 0 ? Number(item.marks) : 1,

      sourceType: item.sourceType,

      sourceYear: item.sourceYear,

      sourceBoard: item.sourceBoard,

      verificationStatus: item.verificationStatus,
    }));

    return NextResponse.json(
      {
        success: true,

        curriculumYear: ACTIVE_YEAR,

        count: serialized.length,

        questions: serialized,
      },
      {
        status: 200,

        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: unknown) {
    console.error("[question-bank] GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load questions from database.",
      },
      {
        status: 500,
      },
    );
  }
}
