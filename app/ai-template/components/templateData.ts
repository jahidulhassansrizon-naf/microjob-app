import { TEMPLATE_IMAGE_URLS } from "../templateImageUrls";

export type Gender = "All" | "Male" | "Female" | "Children" | "Product";
/** 3 means "3 or more images". */
export type ImageCount = 1 | 2 | 3;
export type Orientation = "Portrait" | "Landscape" | "Square";
/** "All" = orientation is not known from the source data. */
export type TemplateOrientation = Orientation | "All";
export type ColorKey =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "dark";
export type SortType = "Newest" | "Oldest" | "Popular" | "ASC" | "DESC";

export type ImageCountFilter = "All" | ImageCount;
export type OrientationFilter = "All" | Orientation;
export type ColorFilter = "All" | ColorKey;

export type Template = {
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

export type FilterCriteria = {
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

export const HASHTAGS = [
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
 * Optional, authoritative metadata keyed by the local image path. Anything
 * listed here wins over values derived from the cleaned local filename slug.
 * Use this when the filename alone is not enough, e.g. for orientation/color.
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

function getSlug(imagePathOrUrl: string): string {
  let pathname = imagePathOrUrl;

  // Strip query/hash first. For absolute URLs remove only the protocol and host;
  // no original source URLs are stored in this project.
  pathname = pathname.split(/[?#]/, 1)[0].replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, "");

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "ai-template";

  const parent = segments.length >= 2 ? segments[segments.length - 2] : "";
  // Legacy remote URLs used the parent directory as the template slug. Local
  // files instead use /ai-template-images/<slug>jpg-clean.jpg.
  if (parent && parent.toLowerCase() !== "ai-template-images") {
    try {
      return decodeURIComponent(parent);
    } catch {
      return parent;
    }
  }

  let fileName = segments[segments.length - 1];
  try {
    fileName = decodeURIComponent(fileName);
  } catch {
    // Keep the literal filename when URI decoding is not possible.
  }

  return fileName
    .replace(/\.(?:jpe?g|png|webp|gif|avif)$/i, "")
    .replace(/(?:jpe?g|png|webp)-clean$/i, "")
    .replace(/[-_]+$/g, "");
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

function buildTemplate(
  image: string,
  index: number,
  total: number,
): Template {
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

export const templates: Template[] = TEMPLATE_IMAGE_URLS.map((image, index) =>
  buildTemplate(image, index, TEMPLATE_IMAGE_URLS.length),
);

export const TEMPLATES_BY_ID = new Map<number, Template>(
  templates.map((template) => [template.id, template]),
);

/** Exact local paths are preferred; slugs also migrate favorites saved with old source URLs. */
export const TEMPLATE_IDS_BY_IMAGE = new Map<string, number>(
  templates.map((template) => [template.image, template.id]),
);

const TEMPLATE_IDS_BY_SLUG = (() => {
  const map = new Map<string, number>();
  templates.forEach((template) => {
    const slug = getSlug(template.image).toLowerCase();
    if (!map.has(slug)) map.set(slug, template.id);
  });
  return map;
})();

/** Resolve current local image paths and legacy remote image URLs without retaining source URLs. */
export function getTemplateIdByImage(imageUrl: string): number | undefined {
  const exactMatch = TEMPLATE_IDS_BY_IMAGE.get(imageUrl);
  if (exactMatch !== undefined) return exactMatch;
  return TEMPLATE_IDS_BY_SLUG.get(getSlug(imageUrl).toLowerCase());
}

/** Favorites are stored by image URL so they survive changes to the list order. */
export const FAVORITES_STORAGE_KEY = "sohozkaj:template-favorites";

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
export const CATEGORY_COUNTS: Record<string, number> = (() => {
  const counts: Record<string, number> = {
    All: templates.length,
  };

  templates.forEach((template) => {
    counts[template.category] = (counts[template.category] || 0) + 1;
  });

  return counts;
})();

export const CATEGORY_OPTIONS: string[] = [
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

export function filterTemplates(
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

export function sortTemplates(list: readonly Template[], sortType: SortType) {
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

export const COLOR_OPTIONS: ReadonlyArray<{
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

export const IMAGE_COUNT_OPTIONS: ReadonlyArray<{
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

export const SIDE_SORT_OPTIONS: ReadonlyArray<{
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

export function imageCountLabel(count: ImageCount) {
  return count === 1 ? "1 image" : count === 2 ? "2 images" : "3+ images";
}

