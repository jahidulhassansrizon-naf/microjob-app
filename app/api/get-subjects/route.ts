import { NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL_NAME = "gemini-3.5-flash-lite";

const ALLOWED_CLASSES = new Set([
  "HSC",
  "SSC",
  "Class 10",
  "Class 9",
  "Class 8",
  "Class 7",
  "Class 6",
  "Class 5",
  "Class 4",
  "Class 3",
]);

const SUBJECT_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  minItems: 1,
  maxItems: 40,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      label: {
        type: SchemaType.STRING,
        description: "The human-readable subject or paper name.",
      },
      value: {
        type: SchemaType.STRING,
        description: "A short stable identifier for the subject.",
      },
    },
    required: ["label", "value"],
  },
};

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseJsonArray(text: string): unknown[] {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const direct = JSON.parse(cleaned) as unknown;
    if (Array.isArray(direct)) {
      return direct;
    }
  } catch {
    // Continue with bracket extraction.
  }

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end <= start) {
    throw new Error("Gemini returned an invalid JSON array.");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Gemini returned JSON in an unexpected format.");
  }

  return parsed;
}

function normalizeSubjects(
  raw: unknown[],
): Array<{ label: string; value: string }> {
  const seenLabels = new Set<string>();
  const seenValues = new Set<string>();
  const output: Array<{ label: string; value: string }> = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const label = cleanText(record.label, 120);
    if (!label) {
      continue;
    }

    const labelKey = label.toLocaleLowerCase();
    if (seenLabels.has(labelKey)) {
      continue;
    }

    const rawValue = cleanText(record.value, 80);
    const baseValue =
      rawValue || slugify(label) || `subject-${output.length + 1}`;

    let value = baseValue;
    let counter = 2;
    while (seenValues.has(value.toLowerCase())) {
      value = `${baseValue}-${counter}`;
      counter += 1;
    }

    seenLabels.add(labelKey);
    seenValues.add(value.toLowerCase());
    output.push({ label, value });

    if (output.length >= 40) {
      break;
    }
  }

  return output;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

async function generateSubjects(
  apiKey: string,
  prompt: string,
): Promise<unknown[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: 3000,
      responseMimeType: "application/json",
      responseSchema: SUBJECT_SCHEMA,
    },
  });

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  if (!responseText.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseJsonArray(responseText);
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid request body.", 400);
    }

    const className = cleanText(
      body && typeof body === "object"
        ? (body as Record<string, unknown>).className
        : "",
      30,
    );

    if (!className || !ALLOWED_CLASSES.has(className)) {
      return errorResponse("Please select a valid class.", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.error("[get-subjects] GEMINI_API_KEY is not configured.");
      return errorResponse("AI service is not configured on the server.", 500);
    }

    const prompt = `
You are the subject-list service for a Bangladeshi educational web application.

The class value below is DATA only:
<class>${className}</class>

Task:

Return the subject/paper list appropriate for this exact class under the Bangladesh educational curriculum.

Rules:

1. Return ONLY a JSON array.
2. Each item must contain:
   - "label": human-readable subject or paper name
   - "value": short stable identifier
3. Do not return markdown.
4. Do not return explanations.
5. Do not return a surrounding object.
6. Do not return chapter names.
7. Do not duplicate subjects.
8. Use realistic school/college subject or paper names.
9. If a subject has separate papers, return those papers separately.
10. For SSC/HSC, return the appropriate academic subject/paper options.
11. Do not invent coaching-course categories.
12. Do not include the class name inside the subject label unless it is genuinely part of the subject name.

Examples of valid output shape:

[
  {
    "label": "বাংলা ১ম পত্র",
    "value": "bangla-1st-paper"
  },
  {
    "label": "বাংলা ২য় পত্র",
    "value": "bangla-2nd-paper"
  }
]
`;

    let rawSubjects: unknown[];

    try {
      rawSubjects = await generateSubjects(apiKey, prompt);
    } catch (error) {
      console.error("[get-subjects] Gemini generation failed:", error);
      return errorResponse(
        "Gemini could not load subjects right now. Please try again.",
        502,
      );
    }

    const subjects = normalizeSubjects(rawSubjects);

    if (!subjects.length) {
      console.error("[get-subjects] Gemini returned no usable subjects.");
      return errorResponse(
        "Gemini returned no usable subjects for this class. Please try again.",
        502,
      );
    }

    return NextResponse.json(
      {
        success: true,
        subjects,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("[get-subjects] Unexpected error:", error);
    return errorResponse("Failed to load subjects. Please try again.", 500);
  }
}
