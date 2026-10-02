"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { TEMPLATE_IMAGE_URLS } from "./templateImageUrls";
import {
  Search,
  SlidersHorizontal,
  Clock3,
  TrendingUp,
  ArrowDownAZ,
  Heart,
  X,
  RotateCcw,
  UserRound,
  VenusAndMars,
  Baby,
  Package,
  Upload,
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* AI SCAN ANIMATION - same animation used by the AI Editor                  */
/* -------------------------------------------------------------------------- */

const SCAN_STYLES = `
@keyframes pp-scan-sweep {
  0%,
  1% {
    transform: translate3d(0, -120%, 0);
  }

  82% {
    transform: translate3d(0, 420%, 0);
  }

  /* Instantly reset to the top after reaching the bottom.
     There is no visible bottom-to-top sweep between scans. */
  82.01%,
  100% {
    transform: translate3d(0, -120%, 0);
  }
}

@keyframes pp-scan-grid {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.42;
  }
}

.pp-scan-beam {
  animation: pp-scan-sweep 1.9s linear infinite;
  will-change: transform;
  transform: translate3d(0, -120%, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  contain: layout paint;
}

.pp-scan-grid {
  animation: pp-scan-grid 3s ease-in-out infinite;
  will-change: opacity;
}

@media (prefers-reduced-motion: reduce) {
  .pp-scan-beam {
    animation-duration: 3.8s;
  }

  .pp-scan-grid {
    animation-duration: 5s;
  }
}
`;

function ScanOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pp-scan-overlay pointer-events-none absolute inset-0 z-[5] overflow-hidden"
    >
      <div
        className="pp-scan-grid absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="pp-scan-beam absolute left-0 right-0 top-0"
        style={{ height: "22%" }}
      >
        <div
          className="absolute inset-x-[8%] top-1/2 h-[18px] -translate-y-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.10) 32%, rgba(16,185,129,0.18) 50%, rgba(37,99,235,0.10) 68%, rgba(37,99,235,0) 100%)",
            boxShadow:
              "0 0 24px 8px rgba(37,99,235,0.12), 0 0 28px 6px rgba(16,185,129,0.10)",
          }}
        />

        <div
          className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.75) 18%, #10B981 50%, rgba(37,99,235,0.75) 82%, transparent 100%)",
            boxShadow:
              "0 0 10px 2px rgba(37,99,235,0.34), 0 0 16px 3px rgba(16,185,129,0.18)",
          }}
        />

        <div
          className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 18%, rgba(255,255,255,0.9) 50%, transparent 82%)",
          }}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 28px rgba(37,99,235,0.16)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Crop helpers                                                               */
/* -------------------------------------------------------------------------- */

async function getCroppedImage(
  pixelCrop: PixelCrop,
  displayedImage: HTMLImageElement | null,
): Promise<Blob> {
  if (!displayedImage || !displayedImage.naturalWidth) {
    throw new Error("Could not read the photo. Please try again.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not prepare the cropped image.");
  }

  // ReactCrop works in rendered (CSS) pixels. Use the actual on-screen
  // bounding box, including sub-pixel dimensions, so the exported image lines
  // up exactly with the selection the user sees.
  const renderedRect = displayedImage.getBoundingClientRect();
  const renderedWidth = renderedRect.width;
  const renderedHeight = renderedRect.height;

  if (!renderedWidth || !renderedHeight) {
    throw new Error("Could not determine the crop image size.");
  }

  const scaleX = displayedImage.naturalWidth / renderedWidth;
  const scaleY = displayedImage.naturalHeight / renderedHeight;

  const cropX = Math.min(
    Math.max(0, Math.round(pixelCrop.x * scaleX)),
    displayedImage.naturalWidth - 1,
  );
  const cropY = Math.min(
    Math.max(0, Math.round(pixelCrop.y * scaleY)),
    displayedImage.naturalHeight - 1,
  );
  const cropWidth = Math.min(
    Math.max(1, Math.round(pixelCrop.width * scaleX)),
    displayedImage.naturalWidth - cropX,
  );
  const cropHeight = Math.min(
    Math.max(1, Math.round(pixelCrop.height * scaleY)),
    displayedImage.naturalHeight - cropY,
  );

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    displayedImage,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.94),
  );

  if (!blob) {
    throw new Error("Could not create the cropped image.");
  }

  return blob;
}

type PhotoCropModalProps = {
  imageSrc: string;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
};

/*
 * The crop modal keeps its own crop state. Dragging the crop box updates state
 * on every mouse move, so this must NOT live in the big page component, or the
 * whole template grid re-renders on each move and the crop feels laggy.
 */
const PhotoCropModal = React.memo(function PhotoCropModal({
  imageSrc,
  onCancel,
  onApply,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Keep pointer-move updates outside React state until the next animation
  // frame. This prevents ReactCrop from forcing a render for every tiny mouse
  // event and makes dragging/resizing feel much smoother on slower machines.
  const cropRef = useRef<Crop | undefined>(undefined);
  const cropFrameRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleImageLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const image = event.currentTarget;

      // Free-form starting box: nearly the whole photo, resizable in any
      // direction with no aspect-ratio lock.
      const initialCrop: Crop = {
        unit: "%",
        x: 5,
        y: 5,
        width: 90,
        height: 90,
      };

      cropRef.current = initialCrop;
      setCrop(initialCrop);

      // The default crop must be usable immediately, even before the first
      // pointer interaction. Use the exact rendered dimensions at this moment.
      const rect = image.getBoundingClientRect();
      const width = rect.width || image.width;
      const height = rect.height || image.height;

      setCompletedCrop({
        unit: "px",
        x: width * 0.05,
        y: height * 0.05,
        width: width * 0.9,
        height: height * 0.9,
      });
    },
    [],
  );

  const handleApply = useCallback(async () => {
    if (!completedCrop || completedCrop.width < 1 || completedCrop.height < 1) {
      setErrorMessage("Please adjust the crop and try again.");
      return;
    }

    setIsCropping(true);
    setErrorMessage("");

    try {
      const blob = await getCroppedImage(completedCrop, imgRef.current);
      onApply(blob);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not crop the photo.",
      );
      setIsCropping(false);
    }
  }, [completedCrop, onApply]);

  const handleCropChange = useCallback((nextCrop: Crop) => {
    cropRef.current = nextCrop;

    // One React update per animation frame instead of one per pointer event.
    if (cropFrameRef.current !== null) return;

    cropFrameRef.current = window.requestAnimationFrame(() => {
      cropFrameRef.current = null;
      setCrop(cropRef.current);
    });
  }, []);

  const handleCropComplete = useCallback(
    (pixelCrop: PixelCrop, percentCrop: Crop) => {
      cropRef.current = percentCrop;

      if (cropFrameRef.current !== null) {
        window.cancelAnimationFrame(cropFrameRef.current);
        cropFrameRef.current = null;
      }

      setCrop(percentCrop);
      setCompletedCrop(pixelCrop);
    },
    [],
  );

  const handleCancel = useCallback(() => {
    if (isCropping) return;
    onCancel();
  }, [isCropping, onCancel]);

  useEffect(() => {
    return () => {
      if (cropFrameRef.current !== null) {
        window.cancelAnimationFrame(cropFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleCancel();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleCancel]);

  return (
    <div className="crop-backdrop">
      <div
        className="crop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Crop your photo"
      >
        <div className="crop-header">
          <div>
            <strong>Adjust your photo</strong>
            <span>
              Move and resize the crop area to select the part of the photo you
              want to use.
            </span>
          </div>

          <button
            type="button"
            className="crop-close"
            onClick={handleCancel}
            disabled={isCropping}
            aria-label="Cancel crop"
          >
            <X size={18} />
          </button>
        </div>

        <div className="crop-stage">
          <ReactCrop
            crop={crop}
            minWidth={24}
            minHeight={24}
            keepSelection
            ruleOfThirds
            onChange={(_, percentCrop) => handleCropChange(percentCrop)}
            onComplete={handleCropComplete}
            disabled={isCropping}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop your uploaded photo"
              onLoad={handleImageLoad}
              className="crop-source-image"
              draggable={false}
            />
          </ReactCrop>
        </div>

        <div className="crop-controls">
          <span>Crop</span>

          <span className="crop-controls-help">
            Drag inside the box to move it. Drag any corner or edge to resize
            freely.
          </span>

          <span>Free</span>
        </div>

        {errorMessage && <p className="crop-error">{errorMessage}</p>}

        <div className="crop-actions">
          <button
            type="button"
            className="crop-cancel-btn"
            onClick={handleCancel}
            disabled={isCropping}
          >
            Cancel
          </button>

          <button
            type="button"
            className="crop-apply-btn"
            onClick={handleApply}
            disabled={isCropping}
          >
            {isCropping ? "Preparing..." : "Use This Photo"}
          </button>
        </div>
      </div>
    </div>
  );
});

type Gender = "All" | "Male" | "Female" | "Children" | "Product";
/** 3 means "3 or more images". */
type ImageCount = 1 | 2 | 3;
type Orientation = "Portrait" | "Landscape" | "Square";
/** "All" = orientation is not known from the source data. */
type TemplateOrientation = Orientation | "All";
type ColorKey =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "dark";
type SortType = "Newest" | "Oldest" | "Popular" | "ASC" | "DESC";

type ImageCountFilter = "All" | ImageCount;
type OrientationFilter = "All" | Orientation;
type ColorFilter = "All" | ColorKey;

type Template = {
  id: number;
  title: string;
  category: string;
  gender: Gender;
  imageCount: ImageCount;
  orientation: TemplateOrientation;
  colors: ColorKey[];
  tags: string[];
  image: string;
  created: number;
};

type FilterCriteria = {
  search: string;
  category: string;
  gender: Gender;
  imageCount: ImageCountFilter;
  orientation: OrientationFilter;
  color: ColorFilter;
  favoritesOnly: boolean;
};

const FALLBACK_CATEGORIES = [
  "All",
  "80s Style Vintage",
  "Motivational",
  "Creative Shots",
  "Victory Day",
  "Photo restoration",
  "Wedding Photo",
  "Product Advertisement",
  "Baby and Kids",
  "Couple Portraits",
  "Father's Day",
  "Greeting card",
  "Birthday wishes",
  "Family photo",
];

const HASHTAGS = [
  "#3d character",
  "#3d illusion",
  "#3d typography",
  "#3rd birthday",
  "#80s",
  "#80s fashion",
  "#90s",
  "#abduction",
  "#abstract art",
  "#action",
  "#action portrait",
  "#adventure",
  "#advertisement",
  "#advertising",
  "#aesthetic",
  "#age",
  "#ai video",
  "#airplane",
  "#airport",
  "#alley",
  "#art",
  "#baby",
  "#bangladesh",
];

/* -------------------------------------------------------------------------- */
/*  Template metadata                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Optional, authoritative metadata keyed by image URL. Anything listed here
 * wins over the values derived from the file slug. Use this (or replace it
 * with real data from the backend) when the slug alone is not enough, e.g. for
 * orientation and color, which cannot be known from a file name.
 */
type TemplateMetadataOverride = Partial<
  Pick<
    Template,
    | "title"
    | "category"
    | "gender"
    | "imageCount"
    | "orientation"
    | "colors"
    | "tags"
  >
>;

const TEMPLATE_METADATA_OVERRIDES: Record<string, TemplateMetadataOverride> =
  {};

const DEFAULT_CATEGORY = "Creative Shots";

/** Ordered: the first rule whose words appear as a whole word in the slug wins. */
const CATEGORY_RULES: ReadonlyArray<{
  category: string;
  words: readonly string[];
}> = [
  {
    category: "Product Advertisement",
    words: [
      "product",
      "products",
      "campaign",
      "advertisement",
      "advertising",
      "ad",
      "ads",
    ],
  },
  {
    category: "Wedding Photo",
    words: ["wedding", "bride", "bridal", "groom", "marriage"],
  },
  {
    category: "Couple Portraits",
    words: ["couple", "couples", "romantic", "anniversary", "love"],
  },
  {
    category: "Birthday wishes",
    words: ["birthday", "bday"],
  },
  {
    category: "Father's Day",
    words: ["father", "fathers", "dad", "daddy"],
  },
  {
    category: "Baby and Kids",
    words: [
      "baby",
      "babies",
      "kid",
      "kids",
      "child",
      "children",
      "toddler",
      "newborn",
      "infant",
    ],
  },
  {
    category: "Family photo",
    words: ["family", "parents", "mother", "mom", "daughter", "siblings"],
  },
  {
    category: "80s Style Vintage",
    words: ["vintage", "retro", "80s", "90s", "heritage"],
  },
  {
    category: "Motivational",
    words: [
      "quote",
      "quotes",
      "wisdom",
      "mindset",
      "motivational",
      "motivation",
      "strength",
      "inspirational",
    ],
  },
  {
    category: "Victory Day",
    words: ["victory", "bangladesh", "flag", "independence"],
  },
  {
    category: "Photo restoration",
    words: ["restore", "restoration", "repair", "colorize"],
  },
  {
    category: "Greeting card",
    words: ["greeting", "card", "wishes", "congratulations"],
  },
];

const CHILD_WORDS = [
  "baby",
  "babies",
  "kid",
  "kids",
  "child",
  "children",
  "toddler",
  "newborn",
  "infant",
];

const FEMALE_WORDS = [
  "woman",
  "women",
  "girl",
  "girls",
  "lady",
  "ladies",
  "female",
  "saree",
  "sari",
  "bridal",
  "bride",
  "mother",
  "mom",
  "queen",
  "princess",
  "wife",
];

const MALE_WORDS = [
  "man",
  "men",
  "male",
  "boy",
  "boys",
  "gentleman",
  "guy",
  "groom",
  "father",
  "dad",
  "king",
  "husband",
  "businessman",
];

const THREE_PLUS_WORDS = ["triptych", "collage", "three", "triple", "trio"];

const TWO_WORDS = [
  "couple",
  "couples",
  "diptych",
  "double",
  "duo",
  "pair",
  "twins",
  "family",
  "parents",
];

const LANDSCAPE_WORDS = [
  "landscape",
  "wide",
  "widescreen",
  "banner",
  "panorama",
  "panoramic",
];

const PORTRAIT_WORDS = ["vertical", "tall", "poster"];

const COLOR_WORDS: Record<ColorKey, readonly string[]> = {
  red: ["red", "crimson", "scarlet", "maroon"],
  orange: ["orange", "amber"],
  yellow: ["yellow", "golden", "gold"],
  green: ["green", "emerald", "olive"],
  blue: ["blue", "navy", "cyan", "teal", "turquoise"],
  purple: ["purple", "violet", "lavender", "magenta"],
  dark: ["black", "dark", "noir", "charcoal"],
};

const TAG_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "to",
  "for",
  "with",
  "by",
  "from",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function hasAny(tokens: ReadonlySet<string>, words: readonly string[]) {
  return words.some((word) => tokens.has(word));
}

function getSlug(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);

    if (segments.length >= 2) {
      return segments[segments.length - 2];
    }

    if (segments.length === 1) {
      return segments[0].replace(/\.[a-z0-9]+$/i, "");
    }
  } catch {
    /* fall through to default */
  }

  return "ai-template";
}

function slugToTitle(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(tokens: ReadonlySet<string>): string {
  const rule = CATEGORY_RULES.find((item) => hasAny(tokens, item.words));

  return rule ? rule.category : DEFAULT_CATEGORY;
}

/**
 * Gender is only assigned when the slug clearly supports it. Mixed or
 * unspecified templates (couples, groups, abstract art...) stay "All" and are
 * therefore only listed under the "All" gender filter, never under a wrong one.
 */
function inferGender(tokens: ReadonlySet<string>, category: string): Gender {
  if (category === "Product Advertisement") {
    return "Product";
  }

  if (hasAny(tokens, CHILD_WORDS)) {
    return "Children";
  }

  const female = hasAny(tokens, FEMALE_WORDS);
  const male = hasAny(tokens, MALE_WORDS);

  if (female && !male) {
    return "Female";
  }

  if (male && !female) {
    return "Male";
  }

  return "All";
}

function inferImageCount(tokens: ReadonlySet<string>): ImageCount {
  if (hasAny(tokens, THREE_PLUS_WORDS)) {
    return 3;
  }

  if (tokens.has("contact") && tokens.has("sheet")) {
    return 3;
  }

  if (hasAny(tokens, TWO_WORDS)) {
    return 2;
  }

  return 1;
}

/** Orientation is only known when the slug says so; otherwise it is "All". */
function inferOrientation(tokens: ReadonlySet<string>): TemplateOrientation {
  if (tokens.has("square")) {
    return "Square";
  }

  if (hasAny(tokens, LANDSCAPE_WORDS)) {
    return "Landscape";
  }

  if (hasAny(tokens, PORTRAIT_WORDS)) {
    return "Portrait";
  }

  return "All";
}

function inferColors(tokens: ReadonlySet<string>): ColorKey[] {
  return (Object.keys(COLOR_WORDS) as ColorKey[]).filter((key) =>
    hasAny(tokens, COLOR_WORDS[key]),
  );
}

function inferTags(slug: string): string[] {
  const unique = new Set<string>();

  tokenize(slug).forEach((word) => {
    if (word.length < 2 || /^\d+$/.test(word) || TAG_STOP_WORDS.has(word)) {
      return;
    }

    unique.add(word);
  });

  return Array.from(unique);
}

function buildTemplate(image: string, index: number, total: number): Template {
  const slug = getSlug(image);
  const tokens = new Set(tokenize(slug));
  const category = inferCategory(tokens);
  const override = TEMPLATE_METADATA_OVERRIDES[image] ?? {};

  return {
    id: index + 1,
    title: override.title ?? slugToTitle(slug),
    category: override.category ?? category,
    gender: override.gender ?? inferGender(tokens, category),
    imageCount: override.imageCount ?? inferImageCount(tokens),
    orientation: override.orientation ?? inferOrientation(tokens),
    colors: override.colors ?? inferColors(tokens),
    tags: override.tags ?? inferTags(slug),
    image,
    created: total - index,
  };
}

const templates: Template[] = TEMPLATE_IMAGE_URLS.map((image, index) =>
  buildTemplate(image, index, TEMPLATE_IMAGE_URLS.length),
);

const TEMPLATES_BY_ID = new Map<number, Template>(
  templates.map((template) => [template.id, template]),
);

const TEMPLATE_IDS_BY_IMAGE = new Map<string, number>(
  templates.map((template) => [template.image, template.id]),
);

/** Favorites are stored by image URL so they survive changes to the list order. */
const FAVORITES_STORAGE_KEY = "sohozkaj:template-favorites";

/** Lower-cased search fields, computed once instead of on every keystroke. */
const SEARCH_INDEX = new Map<number, string[]>(
  templates.map((template) => [
    template.id,
    [
      template.title.toLowerCase(),
      template.category.toLowerCase(),
      ...template.tags.map((tag) => tag.toLowerCase()),
    ],
  ]),
);

/** Real counts from the underlying dataset (independent of active filters). */
const CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {
    All: templates.length,
  };

  templates.forEach((template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
  });

  return counts;
})();

const CATEGORY_OPTIONS: string[] = [
  ...FALLBACK_CATEGORIES.filter(
    (item) => item === "All" || CATEGORY_COUNTS[item],
  ),
  ...Object.keys(CATEGORY_COUNTS).filter(
    (item) => !FALLBACK_CATEGORIES.includes(item),
  ),
];

/* -------------------------------------------------------------------------- */
/*  Filtering + sorting pipeline (single source of truth)                     */
/* -------------------------------------------------------------------------- */

function parseSearchTerms(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .split(/\s+/)
    .filter(Boolean);
}

function matchesSearch(template: Template, terms: string[]) {
  if (terms.length === 0) {
    return true;
  }

  const fields = SEARCH_INDEX.get(template.id) ?? [];

  // Every typed word must appear in the title, the category or a tag.
  return terms.every((term) => fields.some((field) => field.includes(term)));
}

function matchesImageCount(template: Template, filter: ImageCountFilter) {
  if (filter === "All") {
    return true;
  }

  if (filter === 3) {
    return template.imageCount >= 3;
  }

  return template.imageCount === filter;
}

function filterTemplates(
  source: readonly Template[],
  criteria: FilterCriteria,
  favoriteIds: ReadonlySet<number>,
): Template[] {
  const terms = parseSearchTerms(criteria.search);

  return source.filter(
    (template) =>
      matchesSearch(template, terms) &&
      (criteria.category === "All" ||
        template.category === criteria.category) &&
      (criteria.gender === "All" || template.gender === criteria.gender) &&
      matchesImageCount(template, criteria.imageCount) &&
      (criteria.orientation === "All" ||
        template.orientation === criteria.orientation) &&
      (criteria.color === "All" || template.colors.includes(criteria.color)) &&
      (!criteria.favoritesOnly || favoriteIds.has(template.id)),
  );
}

/**
 * The source has no engagement data, so "Popular" keeps the original
 * deterministic placeholder score. Swap this for real usage counts later.
 */
function popularityScore(template: Template) {
  return Math.min(template.tags.length, 5) * 23 + (template.id % 41);
}

function sortTemplates(list: readonly Template[], sortType: SortType) {
  const copy = [...list];

  const byName = (a: Template, b: Template) =>
    a.title.localeCompare(b.title, undefined, {
      sensitivity: "base",
    }) || a.id - b.id;

  switch (sortType) {
    case "Popular":
      return copy.sort(
        (a, b) => popularityScore(b) - popularityScore(a) || a.id - b.id,
      );

    case "Oldest":
      return copy.sort((a, b) => a.created - b.created);

    case "ASC":
      return copy.sort(byName);

    case "DESC":
      return copy.sort((a, b) => byName(b, a));

    case "Newest":
    default:
      return copy.sort((a, b) => b.created - a.created);
  }
}

const COLOR_OPTIONS: ReadonlyArray<{
  value: ColorFilter;
  label: string;
  background: string;
}> = [
  {
    value: "All",
    label: "All colors",
    background: "linear-gradient(135deg,#ff3e3e,#ffd600,#23c96b,#3c74ff)",
  },
  {
    value: "red",
    label: "Red",
    background: "#ff4545",
  },
  {
    value: "orange",
    label: "Orange",
    background: "#ff9800",
  },
  {
    value: "yellow",
    label: "Yellow",
    background: "#ffd11a",
  },
  {
    value: "green",
    label: "Green",
    background: "#1fbc60",
  },
  {
    value: "blue",
    label: "Blue",
    background: "#3c74ff",
  },
  {
    value: "purple",
    label: "Purple",
    background: "#9b4cff",
  },
  {
    value: "dark",
    label: "Dark",
    background: "#4a4a53",
  },
];

const IMAGE_COUNT_OPTIONS: ReadonlyArray<{
  value: ImageCountFilter;
  label: string;
  hint: string;
}> = [
  {
    value: "All",
    label: "All",
    hint: "",
  },
  {
    value: 1,
    label: "1 image",
    hint: "Single portrait",
  },
  {
    value: 2,
    label: "2 images",
    hint: "Couple / family",
  },
  {
    value: 3,
    label: "3+ images",
    hint: "Group / more than 2 people",
  },
];

const SIDE_SORT_OPTIONS: ReadonlyArray<{
  label: string;
  value: SortType;
}> = [
  {
    label: "Popular",
    value: "Popular",
  },
  {
    label: "Newest first",
    value: "Newest",
  },
  {
    label: "Oldest first",
    value: "Oldest",
  },
  {
    label: "By name",
    value: "ASC",
  },
];

function imageCountLabel(count: ImageCount) {
  return count === 1 ? "1 image" : count === 2 ? "2 images" : "3+ images";
}

function IconButton({
  active,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        active
          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function LazyTemplateImage({
  src,
  alt,
  orientation,
  className = "",
}: {
  src: string;
  alt: string;
  orientation: TemplateOrientation;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [shouldLoad, setShouldLoad] = useState(false);

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const node = containerRef.current;

    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "350px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoad]);

  const aspectRatio =
    orientation === "Landscape"
      ? "4 / 3"
      : orientation === "Square"
        ? "1 / 1"
        : "4 / 5";

  return (
    <div
      ref={containerRef}
      className={`lazy-image-shell ${className}`}
      style={{ aspectRatio }}
    >
      {failed ? (
        <div
          className="lazy-image-placeholder lazy-image-failed"
          role="img"
          aria-label={alt}
        >
          <ImageIcon size={20} />
        </div>
      ) : shouldLoad ? (
        <img
          src={src}
          alt={alt}
          className="lazy-template-image"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="lazy-image-placeholder" aria-hidden="true">
          <div className="lazy-image-spinner" />
        </div>
      )}
    </div>
  );
}

export default function AITemplatePage() {
  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("All");

  const [gender, setGender] = useState<Gender>("All");

  const [imageCount, setImageCount] = useState<ImageCountFilter>("All");

  const [orientation, setOrientation] = useState<OrientationFilter>("All");

  const [selectedColor, setSelectedColor] = useState<ColorFilter>("All");

  const [sortType, setSortType] = useState<SortType>("Newest");

  const [showFavorites, setShowFavorites] = useState(false);

  const [favorites, setFavorites] = useState<number[]>([]);

  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // AI Template generation state
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userPhoto, setUserPhoto] = useState<File | null>(null);

  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  const [generationError, setGenerationError] = useState("");

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Crop modal visibility (the crop box state itself lives in PhotoCropModal)
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const generationAbortRef = useRef<AbortController | null>(null);

  const categoryCounts = CATEGORY_COUNTS;

  const categories = CATEGORY_OPTIONS;

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // Load saved favorites after mount (keeps server and client HTML identical).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(saved)) {
        setFavorites(
          saved
            .map((url) =>
              typeof url === "string"
                ? TEMPLATE_IDS_BY_IMAGE.get(url)
                : undefined,
            )
            .filter((id): id is number => id !== undefined),
        );
      }
    } catch {
      /* storage unavailable or corrupted: start with no favorites */
    }

    setFavoritesLoaded(true);
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;

    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(
          favorites
            .map((id) => TEMPLATES_BY_ID.get(id)?.image)
            .filter((image): image is string => Boolean(image)),
        ),
      );
    } catch {
      /* storage full or blocked: favorites just won't persist */
    }
  }, [favorites, favoritesLoaded]);

  // Blob URLs are released when they are replaced or the page unmounts.
  useEffect(() => {
    return () => {
      if (cropImage) URL.revokeObjectURL(cropImage);
    };
  }, [cropImage]);

  useEffect(() => {
    return () => {
      if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
    };
  }, [userPhotoPreview]);

  useEffect(() => {
    return () => generationAbortRef.current?.abort();
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
    setGender("All");
    setImageCount("All");
    setOrientation("All");
    setSelectedColor("All");
    setSortType("Newest");
    setShowFavorites(false);
  }, []);

  // Hashtags are quick-search buttons: they only touch the search text.
  const handleHashtagClick = useCallback((tag: string) => {
    setSearch(tag.replace(/^#+/, ""));
  }, []);

  // FILTER FIRST -> THEN SORT -> THEN RENDER.
  const filteredTemplates = useMemo(() => {
    const filtered = filterTemplates(
      templates,
      {
        search,
        category,
        gender,
        imageCount,
        orientation,
        color: selectedColor,
        favoritesOnly: showFavorites,
      },
      favoriteIds,
    );

    return sortTemplates(filtered, sortType);
  }, [
    search,
    category,
    gender,
    imageCount,
    orientation,
    selectedColor,
    showFavorites,
    favoriteIds,
    sortType,
  ]);

  // The modal tracks the template id, so it stays stable even if the list
  // changes underneath it (e.g. un-favoriting while "My Favorites" is on).
  const selectedTemplate =
    selectedId === null ? null : (TEMPLATES_BY_ID.get(selectedId) ?? null);

  const isSelectedFavorite =
    selectedTemplate !== null && favoriteIds.has(selectedTemplate.id);

  useEffect(() => {
    // A running generation belongs to the previous template: cancel it so its
    // result can never show up on another template.
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;

    setIsGenerating(false);
    setGenerationError("");
    setGeneratedImage(null);
    setUserPhoto(null);
    setIsCropOpen(false);
    setUserPhotoPreview(null);
    setCropImage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedId]);

  const openTemplate = useCallback((template: Template) => {
    setSelectedId(template.id);
  }, []);

  const closeModal = useCallback(() => setSelectedId(null), []);

  const handleUserPhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.toLowerCase().startsWith("image/")) {
        setGenerationError("Please choose an image file.");
        event.target.value = "";
        return;
      }

      if (file.size > 15 * 1024 * 1024) {
        setGenerationError("The photo must be 15 MB or smaller.");
        event.target.value = "";
        return;
      }

      setGenerationError("");
      setGeneratedImage(null);

      setCropImage(URL.createObjectURL(file));
      setIsCropOpen(true);

      // Allow choosing the same file again later.
      event.target.value = "";
    },
    [],
  );

  const handleCropCancel = useCallback(() => {
    setIsCropOpen(false);
    setCropImage(null);
  }, []);

  const handleCropApplied = useCallback((blob: Blob) => {
    const croppedFile = new File([blob], "sohozkaj-cropped-photo.jpg", {
      type: "image/jpeg",
    });

    // The cropped photo replaces the original and is what Generate Photo uses.
    setUserPhoto(croppedFile);
    setUserPhotoPreview(URL.createObjectURL(blob));
    setGenerationError("");

    setIsCropOpen(false);
    setCropImage(null);
  }, []);

  const handleGeneratePhoto = useCallback(async () => {
    if (!selectedTemplate) return;

    if (!userPhoto) {
      setGenerationError("Please upload your photo first.");
      return;
    }

    generationAbortRef.current?.abort();

    const controller = new AbortController();
    generationAbortRef.current = controller;

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 180_000);

    setIsGenerating(true);
    setGenerationError("");
    setGeneratedImage(null);

    try {
      const formData = new FormData();

      formData.append("image", userPhoto, userPhoto.name);

      formData.append("templateImage", selectedTemplate.image);

      const templatePrompt = [
        "Create a new image using the two attached images.",
        "",
        "IMAGE 1 is the AI template/reference image.",
        "IMAGE 2 is the user's own photo and is the identity source.",
        "",
        "Recreate the visual design of IMAGE 1 using the person from IMAGE 2.",
        "Preserve the user's identity and recognizable facial features.",
        "Do not copy or preserve the identity of the person shown in the template.",
        "Match the template's composition, pose, camera angle, framing, clothing style,",
        "background, lighting, shadows, color treatment, mood, depth, and overall visual style.",
        "Keep important graphic layout and design elements from the template when appropriate.",
        "Do not add extra people, random objects, logos, watermarks, or unrelated elements.",
        "Keep the result natural, photorealistic when the template is photorealistic,",
        "and faithful to the reference template's intended appearance.",
        "",
        `Template title: ${selectedTemplate.title}`,
        `Template category: ${selectedTemplate.category}`,
        `Template gender classification: ${selectedTemplate.gender}`,
        `Template image count classification: ${imageCountLabel(
          selectedTemplate.imageCount,
        )}`,
        `Template orientation: ${selectedTemplate.orientation}`,
        "",
        "Return only the finished generated image.",
      ].join("\n");

      formData.append("prompt", templatePrompt);

      const response = await fetch("/api/template-generate", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success || !data.image) {
        throw new Error(data?.error || "Template image generation failed.");
      }

      if (generationAbortRef.current !== controller) return;

      setGeneratedImage(data.image);
    } catch (error) {
      // Cancelled because another template was opened or the page closed.
      if (generationAbortRef.current !== controller) return;

      if (timedOut) {
        setGenerationError(
          "Generation took too long. Please try again in a moment.",
        );
      } else {
        setGenerationError(
          error instanceof Error
            ? error.message
            : "Template image generation failed.",
        );
      }
    } finally {
      window.clearTimeout(timeoutId);

      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null;
        setIsGenerating(false);
      }
    }
  }, [selectedTemplate, userPhoto]);

  const moveSelected = useCallback(
    (direction: 1 | -1) => {
      if (selectedId === null || filteredTemplates.length === 0) {
        return;
      }

      const length = filteredTemplates.length;

      const currentIndex = filteredTemplates.findIndex(
        (item) => item.id === selectedId,
      );

      const nextIndex =
        currentIndex === -1
          ? direction === 1
            ? 0
            : length - 1
          : (currentIndex + direction + length) % length;

      setSelectedId(filteredTemplates[nextIndex].id);
    },
    [filteredTemplates, selectedId],
  );

  const isAnyModalOpen = selectedId !== null || isCropOpen;

  // Lock page scroll behind the modals.
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAnyModalOpen]);

  // Esc closes the top-most modal; arrow keys browse templates.
  useEffect(() => {
    if (!isAnyModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // The crop modal handles its own Escape key.
        if (!isCropOpen) closeModal();

        return;
      }

      if (isCropOpen) return;

      if (event.key === "ArrowLeft") {
        moveSelected(-1);
      } else if (event.key === "ArrowRight") {
        moveSelected(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAnyModalOpen, isCropOpen, closeModal, moveSelected]);

  return (
    <div className="ai-page">
      <DashboardNavbar />

      <main className="main-content">
        <section className="page-header">
          <div>
            <h1>AI Template</h1>

            <p>
              Pick a style you like, upload your photo, and we'll generate the
              same look for you in seconds.
            </p>
          </div>

          <div className="page-actions">
            <button
              type="button"
              className={`sort-pill ${sortType === "Newest" ? "selected" : ""}`}
              onClick={() => setSortType("Newest")}
            >
              <Clock3 size={14} />
              Newest first
            </button>

            <button
              type="button"
              className={`sort-pill ${
                sortType === "Popular" ? "selected-light" : ""
              }`}
              onClick={() => setSortType("Popular")}
            >
              <TrendingUp size={14} />
              Popular
            </button>

            <button
              type="button"
              className={`sort-pill ${
                sortType === "ASC" || sortType === "DESC"
                  ? "selected-light"
                  : ""
              }`}
              onClick={() =>
                setSortType((prev) => (prev === "ASC" ? "DESC" : "ASC"))
              }
            >
              <ArrowDownAZ size={14} />
              Sort: {sortType === "DESC" ? "DESC" : "ASC"}
            </button>

            <button
              type="button"
              className={`sort-pill favorites-btn ${
                showFavorites ? "favorite-active" : ""
              }`}
              onClick={() => setShowFavorites((prev) => !prev)}
            >
              <Heart size={14} fill={showFavorites ? "currentColor" : "none"} />
              My Favorites
            </button>
          </div>
        </section>

        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-heading">
              <span>Filter</span>

              <button type="button" onClick={resetFilters}>
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            <div className="filter-section-title">CATEGORY</div>

            <div className="category-list">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`category-row ${
                    category === item ? "active" : ""
                  }`}
                >
                  <span>{item}</span>

                  <b>{(categoryCounts[item] || 0).toLocaleString("en-US")}</b>
                </button>
              ))}
            </div>

            <div className="filter-group">
              <div className="filter-section-title">GENDER</div>

              <div className="gender-grid">
                {(
                  [
                    ["All", <VenusAndMars key="all" size={14} />],
                    ["Male", <UserRound key="male" size={14} />],
                    ["Female", <VenusAndMars key="female" size={14} />],
                    ["Children", <Baby key="children" size={14} />],
                    ["Product", <Package key="product" size={14} />],
                  ] as Array<[Gender, React.ReactNode]>
                ).map(([item, icon]) => (
                  <button
                    type="button"
                    key={item}
                    className={`gender-card ${gender === item ? "active" : ""}`}
                    onClick={() => setGender(item)}
                  >
                    {icon}

                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">IMAGE COUNT</div>

              <div className="radio-list">
                {IMAGE_COUNT_OPTIONS.map(({ value, label, hint }) => (
                  <button
                    type="button"
                    key={label}
                    className={`radio-row ${
                      imageCount === value ? "active" : ""
                    }`}
                    onClick={() => setImageCount(value)}
                  >
                    <span
                      className={`radio-dot ${
                        imageCount === value ? "checked" : ""
                      }`}
                    />

                    <span>
                      <strong>{label}</strong>

                      <small>{hint}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">ORIENTATION</div>

              <div className="orientation-grid">
                {(
                  [
                    "All",
                    "Portrait",
                    "Landscape",
                    "Square",
                  ] as OrientationFilter[]
                ).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`orientation-card ${
                      orientation === item ? "active" : ""
                    }`}
                    onClick={() => setOrientation(item)}
                  >
                    <span
                      className={`orientation-icon orientation-${item.toLowerCase()}`}
                    />

                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">COLOR</div>

              <div className="color-grid">
                {COLOR_OPTIONS.map(({ value, label, background }) => (
                  <button
                    type="button"
                    key={value}
                    className={`color-dot-wrap ${
                      selectedColor === value ? "active" : ""
                    }`}
                    onClick={() => setSelectedColor(value)}
                    aria-label={`Color: ${label}`}
                    aria-pressed={selectedColor === value}
                    title={label}
                  >
                    <span
                      className="color-dot"
                      style={{
                        background,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">SORT</div>

              <div className="sort-side-list">
                {SIDE_SORT_OPTIONS.map(({ label, value }) => {
                  const isActive =
                    value === "ASC"
                      ? sortType === "ASC" || sortType === "DESC"
                      : sortType === value;

                  return (
                    <button
                      type="button"
                      key={label}
                      className={`sort-side-row ${isActive ? "active" : ""}`}
                      onClick={() => setSortType(value)}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="content-area">
            <div className="search-row">
              <div className="search-box">
                <Search size={16} />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or category..."
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="tag-row">
              {HASHTAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className="tag-chip"
                  onClick={() => handleHashtagClick(tag)}
                >
                  {tag}
                </button>
              ))}

              <button type="button" className="small-sort">
                <SlidersHorizontal size={13} />
                Sort
                <span>⌄</span>
              </button>
            </div>

            <div className="result-row">
              <span>
                {filteredTemplates.length.toLocaleString("en-US")} templates
                found
              </span>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-heart">
                  <Search size={28} />
                </div>

                <p>
                  {showFavorites
                    ? "No favorite templates yet."
                    : "No template found for your current filters."}
                </p>

                <button
                  type="button"
                  className="reset-empty"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="masonry-grid">
                {filteredTemplates.map((template) => {
                  const isFavorite = favoriteIds.has(template.id);

                  return (
                    <article
                      className="template-card"
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openTemplate(template)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) {
                          return;
                        }

                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();

                          openTemplate(template);
                        }
                      }}
                    >
                      <LazyTemplateImage
                        src={template.image}
                        alt={template.title}
                        orientation={template.orientation}
                      />

                      <div className="image-overlay" />

                      <div className="uses-badge">
                        {imageCountLabel(template.imageCount)}
                      </div>

                      <button
                        type="button"
                        className={`card-heart ${
                          isFavorite ? "card-heart-active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();

                          toggleFavorite(template.id);
                        }}
                        aria-label={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Heart
                          size={16}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>

                      <div className="template-hover">
                        <div>
                          <strong>{template.title}</strong>

                          <span>{template.category}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            openTemplate(template);
                          }}
                        >
                          View template
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="floating-tools">
        <button type="button" className="yellow-float">
          ↕
        </button>

        <button type="button" className="red-float">
          <span>▶</span>
        </button>
      </div>

      {selectedTemplate && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="template-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedTemplate.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeModal}
              aria-label="Close preview"
            >
              <X size={19} />
            </button>

            <button
              type="button"
              className="modal-nav modal-prev"
              onClick={() => moveSelected(-1)}
              aria-label="Previous template"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="modal-nav modal-next"
              onClick={() => moveSelected(1)}
              aria-label="Next template"
            >
              <ChevronRight size={20} />
            </button>

            <div
              className={`modal-image ${
                generatedImage ? "has-generated-image" : ""
              }`}
            >
              <img
                src={generatedImage || selectedTemplate.image}
                alt={
                  generatedImage
                    ? `Generated result for ${selectedTemplate.title}`
                    : selectedTemplate.title
                }
                decoding="async"
                fetchPriority="high"
              />

              {isGenerating && !generatedImage && (
                <>
                  <style>{SCAN_STYLES}</style>
                  <ScanOverlay />
                </>
              )}

              {generatedImage && (
                <div className="generated-image-overlay">
                  <span className="generated-image-badge">Generated</span>

                  <a
                    href={generatedImage}
                    download={`sohozkaj-template-${selectedTemplate.id}.png`}
                    className="generated-download-btn"
                    aria-label="Download generated image"
                    title="Download generated image"
                  >
                    <Download size={17} />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            <div className="modal-details">
              <span className="modal-category">
                {selectedTemplate.category}
              </span>

              <h2>{selectedTemplate.title}</h2>

              <p className="modal-lead">
                Upload your photo and recreate this template while keeping your
                own identity.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUserPhotoChange}
                className="template-file-input"
                aria-label="Upload your photo"
              />

              <div
                className={`template-upload-card ${
                  userPhoto ? "has-photo" : ""
                }`}
              >
                <div className="template-upload-icon">
                  <Upload size={18} />
                </div>

                <div className="template-upload-copy">
                  <strong>
                    {userPhoto ? "Photo selected" : "Upload your photo"}
                  </strong>

                  <span>
                    {userPhoto
                      ? userPhoto.name
                      : "Add the photo you want to use for this template."}
                  </span>
                </div>

                {userPhotoPreview && (
                  <div className="template-user-preview">
                    <img src={userPhotoPreview} alt="Your uploaded photo" />
                  </div>
                )}

                <button
                  type="button"
                  className="template-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating}
                >
                  {userPhoto ? "Change Photo" : "Choose Photo"}
                </button>

                <small>JPG, PNG or WEBP • Max 15 MB</small>
              </div>

              {generationError && (
                <div className="template-generation-error" role="alert">
                  {generationError}
                </div>
              )}

              <div className="template-how-it-works">
                <div className="template-how-step">
                  <span>1</span>
                  <p>Upload your photo</p>
                </div>

                <div className="template-step-line" />

                <div className="template-how-step">
                  <span>2</span>
                  <p>Generate your image</p>
                </div>
              </div>

              <button
                type="button"
                className="template-generate-btn"
                aria-label="Generate photo from this template"
                onClick={handleGeneratePhoto}
                disabled={!userPhoto || isGenerating}
              >
                <Sparkles size={17} />

                {isGenerating ? "Generating..." : "Generate Photo"}
              </button>

              <button
                type="button"
                className={`template-favorite-btn ${
                  isSelectedFavorite ? "active" : ""
                }`}
                onClick={() => toggleFavorite(selectedTemplate.id)}
                aria-pressed={isSelectedFavorite}
              >
                <Heart
                  size={15}
                  fill={isSelectedFavorite ? "currentColor" : "none"}
                />

                {isSelectedFavorite ? "Saved to favorites" : "Add to favorites"}
              </button>

              <div className="template-note">
                <ImageIcon size={14} />

                <span>Use this template style with your own photo.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCropOpen && cropImage && (
        <PhotoCropModal
          imageSrc={cropImage}
          onCancel={handleCropCancel}
          onApply={handleCropApplied}
        />
      )}

      <style jsx global>{`
        .ai-page,
        .ai-page * {
          box-sizing: border-box;
        }

        .ai-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
        }

        /* Make every genuinely interactive control on this page feel clickable. */
        .ai-page button,
        .ai-page a,
        .ai-page [role="button"] {
          cursor: pointer;
        }

        .main-content {
          padding: 4px 16px 30px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -0.6px;
          color: #0f172a;
        }

        .page-header p {
          margin: 5px 0 0;
          font-size: 11px;
          color: #64748b;
        }

        .page-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .sort-pill {
          height: 30px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .sort-pill.selected {
          color: #fff;
          border-color: #2563eb;
          background: #2563eb;
        }

        .sort-pill.selected-light,
        .sort-pill.favorite-active {
          border-color: #2563eb;
          background: #eff6ff;
          color: #2563eb;
        }

        .workspace {
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr);
          gap: 13px;
          align-items: start;
        }

        .sidebar {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          padding: 12px 10px;
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 140px);
          overflow: auto;
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 900;
          color: #0f172a;
        }

        .sidebar-heading button {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #94a3b8;
          font-size: 9px;
        }

        .filter-section-title {
          margin: 14px 0 7px;
          color: #64748b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .category-list {
          max-height: 245px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .category-row {
          width: 100%;
          min-height: 28px;
          padding: 0 8px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #475569;
          font-size: 9px;
          text-align: left;
        }

        .category-row b {
          min-width: 22px;
          padding: 3px 5px;
          border-radius: 10px;
          background: #e2e8f0;
          color: #475569;
          font-size: 8px;
          text-align: center;
        }

        .category-row.active {
          background: #eff6ff;
          color: #2563eb;
          font-weight: 900;
        }

        .category-row.active b {
          background: #2563eb;
          color: #fff;
        }

        .filter-group {
          margin-top: 5px;
        }

        .gender-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
        }

        .gender-card,
        .orientation-card {
          min-height: 50px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 700;
        }

        .gender-card.active,
        .orientation-card.active {
          color: #2563eb;
          border-color: #2563eb;
          background: #eff6ff;
        }

        .radio-list,
        .sort-side-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .radio-row,
        .sort-side-row {
          width: 100%;
          padding: 6px 7px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          color: #475569;
          font-size: 9px;
        }

        .radio-row.active,
        .sort-side-row.active {
          background: #eff6ff;
          color: #2563eb;
        }

        .radio-row strong {
          display: block;
          font-size: 9px;
        }

        .radio-row small {
          display: block;
          margin-top: 1px;
          color: #94a3b8;
          font-size: 7px;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 50%;
          flex: none;
        }

        .radio-dot.checked {
          border-color: #2563eb;
          box-shadow: inset 0 0 0 3px #fff;
          background: #2563eb;
        }

        .orientation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .orientation-card {
          min-height: 55px;
        }

        .orientation-icon {
          display: block;
          border: 1.5px solid currentColor;
          border-radius: 2px;
        }

        .orientation-all {
          width: 14px;
          height: 14px;
        }

        .orientation-portrait {
          width: 10px;
          height: 14px;
        }

        .orientation-landscape {
          width: 14px;
          height: 9px;
        }

        .orientation-square {
          width: 12px;
          height: 12px;
        }

        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .color-dot-wrap {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 2px solid transparent;
        }

        .color-dot-wrap.active {
          border-color: #2563eb;
        }

        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .sort-side-row {
          padding: 6px 7px;
        }

        .content-area {
          min-width: 0;
        }

        .search-row {
          display: flex;
          gap: 8px;
        }

        .search-box {
          flex: 1;
          height: 38px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font-size: 10px;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .search-box button {
          color: #94a3b8;
        }

        .tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          margin-top: 10px;
          padding-bottom: 2px;
        }

        .tag-chip {
          flex: none;
          padding: 6px 9px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 700;
        }

        .small-sort {
          margin-left: auto;
          flex: none;
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          color: #475569;
          font-size: 8px;
          font-weight: 800;
        }

        .small-sort span {
          color: #94a3b8;
        }

        .result-row {
          margin: 10px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #64748b;
          font-size: 9px;
        }

        .masonry-grid {
          column-count: 6;
          column-gap: 11px;
          width: 100%;
        }

        .template-card {
          position: relative;
          width: 100%;
          display: inline-block;
          margin: 0 0 11px;
          break-inside: avoid;
          overflow: hidden;
          border-radius: 11px;
          background: #e2e8f0;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
          transform: translateZ(0);
        }

        .lazy-image-shell {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #e2e8f0;
        }

        .lazy-template-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #e2e8f0;
          transition:
            transform 0.25s ease,
            filter 0.25s ease;
        }

        .lazy-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: linear-gradient(
            110deg,
            #e2e8f0 8%,
            #f1f5f9 18%,
            #e2e8f0 33%
          );
          background-size: 200% 100%;
          animation: lazy-template-shimmer 1.35s linear infinite;
        }

        .lazy-image-failed {
          animation: none;
          color: #94a3b8;
        }

        .lazy-image-spinner {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2px solid rgba(37, 99, 235, 0.18);
          border-top-color: #2563eb;
          animation: lazy-template-spin 0.8s linear infinite;
        }

        @keyframes lazy-template-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes lazy-template-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .template-card img {
          width: 100%;
          display: block;
        }

        .template-card:hover img {
          transform: scale(1.03);
          filter: brightness(0.97);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(15, 23, 42, 0.18), transparent 24%),
            linear-gradient(to top, rgba(15, 23, 42, 0.28), transparent 28%);
        }

        .uses-badge {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 2;
          padding: 4px 7px;
          border-radius: 10px;
          color: #fff;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(4px);
          font-size: 7px;
          font-weight: 900;
        }

        .card-heart {
          position: absolute;
          top: 7px;
          left: 7px;
          z-index: 3;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          color: #64748b;
          display: grid;
          place-items: center;
          opacity: 0;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
        }

        .template-card:hover .card-heart,
        .template-card:focus-within .card-heart,
        .card-heart-active {
          opacity: 1;
        }

        .template-card:focus-visible {
          outline: 2px solid #2563eb;
          outline-offset: 2px;
        }

        /* Touch screens have no hover: keep the favorite button reachable. */
        @media (hover: none) {
          .card-heart {
            opacity: 1;
          }
        }

        .card-heart-active {
          color: #ef4444;
        }

        .template-hover {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          z-index: 4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.2s ease;
        }

        .template-card:hover .template-hover {
          opacity: 1;
          transform: translateY(0);
        }

        .template-hover > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .template-hover strong {
          color: #fff;
          font-size: 8px;
          line-height: 1.2;
        }

        .template-hover span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 7px;
        }

        .template-hover button {
          flex: none;
          border-radius: 7px;
          padding: 6px 8px;
          background: #fff;
          color: #0f172a;
          font-size: 8px;
          font-weight: 900;
        }

        .empty-state {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
        }

        .empty-heart {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #e2e8f0;
          color: #94a3b8;
        }

        .empty-state p {
          margin: 12px 0 0;
          font-size: 11px;
        }

        .reset-empty {
          margin-top: 14px;
          height: 33px;
          padding: 0 13px;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
        }

        .floating-tools {
          position: fixed;
          left: 10px;
          bottom: 12px;
          z-index: 60;
          display: flex;
          gap: 7px;
        }

        .yellow-float,
        .red-float {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
        }

        .yellow-float {
          background: #10b981;
          color: #fff;
          font-size: 18px;
        }

        .red-float {
          background: #2563eb;
          color: #fff;
          border: 3px solid #fff;
          font-size: 12px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.62);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .template-modal {
          position: relative;
          width: min(1020px, 96vw);
          max-height: 92vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.28);
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 7;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #475569;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          z-index: 7;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #475569;
          transform: translateY(-50%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .modal-prev {
          left: 12px;
        }

        .modal-next {
          left: calc(100% - 394px);
        }

        .modal-image {
          position: relative;
          isolation: isolate;
          min-height: 560px;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e2e8f0;
        }

        .modal-image img {
          width: 100%;
          height: 100%;
          max-height: 92vh;
          display: block;
          object-fit: cover;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .modal-details {
          padding: 36px 30px 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .modal-category {
          display: inline-flex;
          width: max-content;
          padding: 5px 9px;
          border-radius: 9999px;
          background: #10b981;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.02em;
        }

        .modal-details h2 {
          margin: 11px 0 8px;
          font-size: 24px;
          line-height: 1.18;
          letter-spacing: -0.6px;
          color: #0f172a;
        }

        .modal-lead {
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.7;
        }

        .template-file-input {
          display: none;
        }

        .template-upload-card {
          margin-top: 20px;
          padding: 16px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 11px 12px;
          align-items: center;
        }

        .template-upload-icon {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }

        .template-upload-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .template-upload-copy strong {
          color: #0f172a;
          font-size: 11px;
          font-weight: 900;
        }

        .template-upload-copy span {
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .template-upload-card.has-photo {
          border-color: #bfdbfe;
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
        }

        .template-user-preview {
          grid-column: 1 / -1;
          width: 100%;
          height: 140px;
          overflow: hidden;
          border-radius: 10px;
          background: #e2e8f0;
          border: 1px solid #dbeafe;
        }

        .template-user-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center;
          background: #0f172a;
        }

        .template-upload-btn {
          grid-column: 1 / -1;
          height: 38px;
          border: 1px solid #2563eb;
          border-radius: 9px;
          background: #2563eb;
          color: #ffffff;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .template-upload-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .template-upload-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .template-upload-card small {
          grid-column: 1 / -1;
          color: #94a3b8;
          font-size: 8px;
          text-align: center;
        }

        .template-generation-error {
          margin-top: 10px;
          padding: 9px 10px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 8px;
          line-height: 1.5;
        }

        .template-how-it-works {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 34px 1fr;
          align-items: center;
          gap: 8px;
        }

        .template-how-step {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
        }

        .template-how-step span {
          width: 21px;
          height: 21px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          flex: none;
          background: #eff6ff;
          color: #2563eb;
          font-size: 8px;
          font-weight: 900;
        }

        .template-how-step p {
          margin: 0;
          color: #475569;
          font-size: 8px;
          line-height: 1.4;
          font-weight: 800;
        }

        .template-step-line {
          height: 1px;
          background: #e2e8f0;
        }

        .template-generate-btn {
          margin-top: 19px;
          width: 100%;
          height: 44px;
          border: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(37, 99, 235, 0.18);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .template-generate-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 11px 26px rgba(37, 99, 235, 0.24);
        }

        .template-generate-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          transform: none;
          box-shadow: none;
        }

        .modal-image.has-generated-image {
          background: #0f172a;
        }

        .modal-image.has-generated-image img {
          object-fit: contain;
        }

        .generated-image-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          background: linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.12) 0%,
            rgba(15, 23, 42, 0) 58%,
            rgba(15, 23, 42, 0.7) 100%
          );
          pointer-events: none;
        }

        .generated-image-badge {
          display: inline-flex;
          align-items: center;
          min-height: 29px;
          padding: 0 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.94);
          color: #fff;
          font-size: 9px;
          font-weight: 900;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
        }

        .generated-download-btn {
          min-height: 36px;
          padding: 0 13px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.96);
          color: #0f172a;
          font-size: 9px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 7px 20px rgba(15, 23, 42, 0.22);
          pointer-events: auto;
          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .generated-download-btn:hover {
          background: #fff;
          transform: translateY(-1px);
        }

        .crop-backdrop {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(15, 23, 42, 0.78);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .crop-modal {
          width: min(760px, 96vw);
          max-height: 94vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.35);
        }

        .crop-header {
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #e2e8f0;
        }

        .crop-header > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crop-header strong {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }

        .crop-header span {
          color: #64748b;
          font-size: 9px;
          line-height: 1.5;
        }

        .crop-close {
          width: 32px;
          height: 32px;
          flex: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .crop-close:hover {
          background: #f1f5f9;
        }

        .crop-close:disabled,
        .crop-cancel-btn:disabled,
        .crop-apply-btn:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .crop-stage {
          position: relative;
          width: 100%;
          height: min(62vh, 520px);
          min-height: 330px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0f172a;
          overscroll-behavior: contain;
        }

        .crop-stage .ReactCrop {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          margin: 0 auto;
          background: #0f172a;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .crop-stage .ReactCrop__crop-selection {
          cursor: move;
          touch-action: none;
          border: 2px solid #ffffff;
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.42),
            inset 0 0 0 1px rgba(255, 255, 255, 0.16);
        }

        .crop-stage .ReactCrop__drag-handle {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 3px;
          background: #2563eb;
          box-shadow:
            0 0 0 1px rgba(15, 23, 42, 0.35),
            0 2px 7px rgba(0, 0, 0, 0.22);
          z-index: 4;
          touch-action: none;
        }

        .crop-stage .ReactCrop__drag-handle.ord-n {
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-s {
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          cursor: ns-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-e {
          top: 50%;
          right: -8px;
          transform: translateY(-50%);
          cursor: ew-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-w {
          top: 50%;
          left: -8px;
          transform: translateY(-50%);
          cursor: ew-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-nw {
          top: -8px;
          left: -8px;
          cursor: nwse-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-ne {
          top: -8px;
          right: -8px;
          cursor: nesw-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-se {
          right: -8px;
          bottom: -8px;
          cursor: nwse-resize;
        }

        .crop-stage .ReactCrop__drag-handle.ord-sw {
          bottom: -8px;
          left: -8px;
          cursor: nesw-resize;
        }

        .crop-error {
          margin: 0;
          padding: 9px 18px;
          color: #b91c1c;
          background: #fef2f2;
          font-size: 9px;
          font-weight: 700;
        }

        .crop-stage .ReactCrop__child-wrapper {
          max-width: 100%;
          max-height: calc(min(62vh, 520px) - 28px);
        }

        .crop-stage .ReactCrop__child-wrapper img,
        .crop-source-image {
          display: block;
          max-width: 100%;
          max-height: calc(min(62vh, 520px) - 28px);
          width: auto;
          height: auto;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .crop-controls {
          padding: 11px 18px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .crop-controls > span {
          color: #475569;
          font-size: 9px;
          font-weight: 800;
        }

        .crop-controls-help {
          color: #64748b !important;
          font-size: 8px !important;
          font-weight: 600 !important;
          text-align: center;
        }

        .crop-actions {
          padding: 13px 18px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          background: #fff;
        }

        .crop-cancel-btn,
        .crop-apply-btn {
          min-height: 38px;
          padding: 0 15px;
          border-radius: 9px;
          font-size: 9px;
          font-weight: 900;
        }

        .crop-cancel-btn {
          background: #fff;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .crop-cancel-btn:hover {
          background: #f8fafc;
        }

        .crop-apply-btn {
          background: #2563eb;
          color: #fff;
          border: 1px solid #2563eb;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
        }

        .crop-apply-btn:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .template-favorite-btn {
          margin-top: 9px;
          width: 100%;
          height: 38px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          background: #ffffff;
          color: #475569;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            color 0.2s ease,
            background 0.2s ease;
        }

        .template-favorite-btn:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .template-favorite-btn.active {
          border-color: #fecaca;
          background: #fef2f2;
          color: #ef4444;
        }

        .template-note {
          margin-top: 11px;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f8fafc;
          color: #64748b;
          font-size: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          text-align: center;
        }

        @media (max-width: 1600px) {
          .masonry-grid {
            column-count: 6;
          }
        }

        @media (max-width: 1300px) {
          .masonry-grid {
            column-count: 5;
          }

          .workspace {
            grid-template-columns: 230px minmax(0, 1fr);
          }

          .modal-next {
            left: calc(100% - 374px);
          }
        }

        @media (max-width: 1050px) {
          .masonry-grid {
            column-count: 4;
          }

          .workspace {
            grid-template-columns: 215px minmax(0, 1fr);
          }

          .template-modal {
            grid-template-columns: 1fr 330px;
          }

          .modal-next {
            left: calc(100% - 344px);
          }
        }

        @media (max-width: 820px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .page-actions {
            width: 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .workspace {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
            max-height: none;
          }

          .category-list {
            max-height: 240px;
          }

          .masonry-grid {
            column-count: 3;
          }

          .template-modal {
            grid-template-columns: 1fr;
            max-height: 94vh;
            overflow-y: auto;
          }

          .modal-image {
            min-height: 390px;
            max-height: 56vh;
          }

          .modal-next {
            left: auto;
            right: 12px;
          }
        }

        @media (max-width: 620px) {
          .crop-backdrop {
            padding: 10px;
          }

          .crop-stage {
            height: 54vh;
            min-height: 280px;
            padding: 10px;
          }

          .crop-stage .ReactCrop__child-wrapper img,
          .crop-source-image {
            max-height: calc(54vh - 20px);
          }

          .crop-controls-help {
            font-size: 7px !important;
          }

          .main-content {
            padding: 0 11px 14px;
          }

          .page-header h1 {
            font-size: 20px;
          }

          .masonry-grid {
            column-count: 2;
            column-gap: 8px;
          }

          .template-card {
            margin-bottom: 8px;
            border-radius: 9px;
          }

          .page-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }

          .favorites-btn {
            grid-column: 1 / -1;
          }

          .modal-details {
            padding: 20px;
          }

          .modal-actions {
            grid-template-columns: 1fr 1fr;
          }

          .modal-primary {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
}
