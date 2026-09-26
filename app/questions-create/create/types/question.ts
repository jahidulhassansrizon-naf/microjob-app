export type QuestionType = "MCQ" | "Short" | "CQ" | "Descriptive";

export interface CreativeSubQuestion {
  label: string;
  question: string;
  marks: number;
  answer?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  answer?: string;
  marks: number;
  stimulus?: string;
  subQuestions?: CreativeSubQuestion[];
  creativeFormat?: "traditional_cq" | "contextual_structured";
}

export interface FilterOption {
  label: string;
  value: string;
}

export type FilterKey = "class" | "subject" | "chapter" | "type" | null;
export type JointPage = "left" | "right";
export type PrintPageVariant = "A4" | "A5" | "Joint";

export type QuestionLayout = {
  fontScale: number;
  spacing: number;
  /**
   * Per-question visual resize scale. 100 = the normal size.
   * The preview uses this value to resize the question block while
   * proportionally adjusting its typography and internal spacing.
   */
  boxScale: number;
  /**
   * Horizontal position offset as a percentage of the question-area width.
   * 0 keeps the question centered; negative/positive values move it left/right.
   */
  offsetX: number;
};

export type RegionTextAlign = "left" | "center" | "right";

export type PaperAnnotation = {
  id: string;
  pageIndex: number;
  type: "regionText";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontScale: number;
  fontWeight: 400 | 600 | 700;
  fontStyle: "normal" | "italic";
  textAlign: RegionTextAlign;
  textColor: string;
  backgroundColor: string;
  borderRadius: number;
  padding: number;
};

export type MeasurementMode =
  | "none"
  | "header"
  | "header-no-footer"
  | "no-header"
  | "no-header-footer"
  | "rows";

export type SectionGroup = {
  type: QuestionType;
  questions: Question[];
};

export type JointPrintPage = {
  start: number;
  end: number;
};

export type JointPrintRowMetric = {
  id: string;
  type: QuestionType;
  height: number;
};

export type JointPrintSectionMetric = {
  fixedOverhead: number;
  rowGap: number;
  marginBottom: number;
};

export type PaperRenderRequest = {
  pageIndex: number;
  groups: SectionGroup[];
  pagePart: "left" | "right" | "single";
  showHeader?: boolean;
  showFooter?: boolean;
  measurementMode?: MeasurementMode;
};

export const CLASS_OPTIONS: FilterOption[] = [
  { label: "HSC", value: "HSC" },
  { label: "SSC", value: "SSC" },
  { label: "Class 10", value: "Class 10" },
  { label: "Class 9", value: "Class 9" },
  { label: "Class 8", value: "Class 8" },
  { label: "Class 7", value: "Class 7" },
  { label: "Class 6", value: "Class 6" },
  { label: "Class 5", value: "Class 5" },
  { label: "Class 4", value: "Class 4" },
  { label: "Class 3", value: "Class 3" },
];

export const QUESTION_TYPE_OPTIONS: FilterOption[] = [
  { label: "All question types", value: "All question types" },
  { label: "MCQ", value: "MCQ" },
  { label: "Short Questions", value: "Short Questions" },
  { label: "Creative / CQ", value: "Creative / CQ" },
  { label: "Descriptive Questions", value: "Descriptive Questions" },
];

export const DEFAULT_SECTION_MARKS: Record<QuestionType, number> = {
  MCQ: 1,
  Short: 2,
  CQ: 10,
  Descriptive: 5,
};

export const BENGALI_OPTION_LABELS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ"];
export const REQUEST_TIMEOUT_MS = 45_000;

export const DELIMITED_MATH_REGEX =
  /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g;

export const RAW_LATEX_COMMAND_REGEX =
  /\\(?:frac|dfrac|tfrac|sqrt|leq?|geq?|neq|ineq|times|cdot|div|pm|mp|approx|sim|equiv|infty|pi|theta|alpha|beta|gamma|delta|Delta|Omega|sum|prod|int|partial|to|rightarrow|Rightarrow|leftarrow|subset|subseteq|supset|supseteq|in|notin|forall|exists)\b/g;

export const DEFAULT_QUESTION_LAYOUT: QuestionLayout = {
  fontScale: 100,
  spacing: 4,
  boxScale: 100,
  offsetX: 0,
};

export function getOptionLabel(index: number): string {
  return BENGALI_OPTION_LABELS[index] || String(index + 1);
}

export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case "MCQ":
      return "MCQ";
    case "Short":
      return "Short Questions";
    case "CQ":
      return "Creative / CQ";
    default:
      return "Descriptive Questions";
  }
}

export function buildSectionGroups(items: Question[]): SectionGroup[] {
  const order: QuestionType[] = [];
  const groups: Partial<Record<QuestionType, Question[]>> = {};

  items.forEach((question) => {
    if (!groups[question.type]) {
      groups[question.type] = [];
      order.push(question.type);
    }

    groups[question.type]!.push(question);
  });

  return order.map((type) => ({
    type,
    questions: groups[type] || [],
  }));
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function cleanMultilineText(value: unknown, maxLength = 3000): string {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}
