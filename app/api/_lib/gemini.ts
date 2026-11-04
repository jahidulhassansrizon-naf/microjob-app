/**
 * Shared Gemini helper (no SDK needed - calls the REST generateContent API).
 *
 * Why: the old "@google/generative-ai" SDK is deprecated and Gemini 3.5+ models
 * dropped temperature/topP/topK. This helper:
 *  - sends only supported parameters
 *  - falls back to other models if one fails (404 / 429 / 5xx / empty)
 *  - throws an error that contains the REAL reason from Google, so it is
 *    visible in the server console (not just "could not load").
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// First one is tried first. Override with GEMINI_MODEL in .env.local if you like.
// (gemini-2.5-flash was retired by Google on 20 Oct 2026, so it is no longer a fallback.)
const DEFAULT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];

export class GeminiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

type GenerateJsonOptions = {
  apiKey: string;
  prompt: string;
  maxOutputTokens: number;
  /** Plain JSON-schema-like object (Gemini REST format, UPPERCASE types). */
  responseSchema?: Record<string, unknown>;
  /** Per-attempt timeout in ms. */
  timeoutMs?: number;
};

function getModelList(): string[] {
  const custom = process.env.GEMINI_MODEL?.trim();
  const list = custom ? [custom, ...DEFAULT_MODELS] : DEFAULT_MODELS;
  return Array.from(new Set(list));
}

function extractText(data: any): string {
  const candidate = data?.candidates?.[0];
  const parts: any[] = candidate?.content?.parts ?? [];
  const text = parts
    .filter((part) => typeof part?.text === "string" && !part?.thought)
    .map((part) => part.text as string)
    .join("");

  if (text.trim()) {
    return text;
  }

  const blockReason = data?.promptFeedback?.blockReason;
  if (blockReason) {
    throw new GeminiError(`Prompt blocked by Gemini: ${blockReason}`);
  }

  throw new GeminiError(
    `Gemini returned an empty response (finishReason=${candidate?.finishReason ?? "unknown"}).`,
  );
}

async function callModel(
  model: string,
  options: GenerateJsonOptions,
): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: options.maxOutputTokens,
    responseMimeType: "application/json",
  };

  if (options.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 40000);

  try {
    const response = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const raw = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // keep raw for the error message
    }

    if (!response.ok) {
      const reason = data?.error?.message || raw.slice(0, 400) || response.statusText;
      throw new GeminiError(`[${model}] HTTP ${response.status}: ${reason}`, response.status);
    }

    return extractText(data);
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }
    if ((error as Error)?.name === "AbortError") {
      throw new GeminiError(`[${model}] request timed out.`, 408);
    }
    throw new GeminiError(`[${model}] network error: ${(error as Error)?.message ?? error}`);
  } finally {
    clearTimeout(timer);
  }
}

/** Fatal for every model (bad key etc.) - no point trying the next model. */
function isFatal(status?: number): boolean {
  return status === 401 || status === 403;
}

export async function generateJsonText(options: GenerateJsonOptions): Promise<string> {
  const errors: string[] = [];

  for (const model of getModelList()) {
    // one quick retry per model for transient errors
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await callModel(model, options);
      } catch (error) {
        const err = error instanceof GeminiError ? error : new GeminiError(String(error));
        errors.push(err.message);
        console.error(`[gemini] ${err.message} (attempt ${attempt})`);

        if (err.status === 400 && /API key/i.test(err.message)) {
          throw new GeminiError(errors.join(" | "), 401);
        }
        if (isFatal(err.status)) {
          throw new GeminiError(errors.join(" | "), err.status);
        }

        const transient = !err.status || err.status === 429 || err.status >= 500 || err.status === 408;
        if (!transient) {
          break; // 400/404 etc: go to next model
        }
        if (attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }
    }
  }

  throw new GeminiError(errors.join(" | "));
}

/** True when the failure was Google rate-limiting / quota (HTTP 429), so routes can answer "busy" instead of "broken". */
export function isGeminiRateLimited(error: unknown): boolean {
  return error instanceof GeminiError && (error.status === 429 || /\b429\b/.test(error.message));
}
