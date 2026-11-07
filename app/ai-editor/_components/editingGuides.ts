import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  BadgeCheck,
  Blend,
  Brush,
  Camera,
  Circle,
  CircleDot,
  Clapperboard,
  Cloud,
  CloudSun,
  Contrast,
  Droplet,
  Droplets,
  Eraser,
  Expand,
  Eye,
  FileImage,
  Film,
  Fingerprint,
  Focus,
  Frame,
  Glasses,
  Grid2X2,
  History,
  Image,
  LampDesk,
  Layers,
  Lightbulb,
  Maximize,
  Move,
  Palette,
  Paintbrush,
  PenLine,
  Pencil,
  RotateCw,
  Pipette,
  Printer,
  Ruler,
  Scan,
  ScanEye,
  ScanFace,
  ScanSearch,
  Scissors,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Smile,
  Snowflake,
  Sparkles,
  Sun,
  SunDim,
  Users,
  UserCheck,
  UserRound,
  WandSparkles,
  Waves,
  Moon,
  Wrench,
} from "lucide-react";

/**
 * Curated prompt presets for the AI Editor's Extra Editing Guide.
 * Keep labels in English as stable IDs; the UI translates them separately.
 */
export interface EditingGuidePreset {
  label: string;
  category: string;
  prompt: string;
}

/**
 * Behaviour hints used only when the final AI prompt is assembled.
 * They never change labels, icons or what the user sees in the UI.
 */
export interface EditingGuideMeta {
  /** A rule to honour (not an edit to perform), e.g. "Keep Marks". */
  constraint?: boolean;
  /** Intentionally cleans or rebuilds parts of the background. */
  altersBackground?: boolean;
  /** Intentionally changes the photo's colors/tint (so "keep skin tone" must be softened). */
  changesColor?: boolean;
  /** Final photo is black & white. */
  monochrome?: boolean;
  /** Intentionally changes head angle / eye line. */
  changesPose?: boolean;
  /** Presets that cannot be applied together with this one. */
  conflictsWith?: string[];
  /** Prompt to use when the photo is one half of a dual (two-person) generation. */
  dualPrompt?: string;
}

/**
 * Categories are listed in the order they appear on a person, from the top of
 * the head down to the chin, then whole-face / whole-photo edits.
 * (The library, the category filter and the quick grid all follow this order.)
 */
export const EDITING_GUIDE_CATEGORIES = [
  { id: "all", label: "All categories" },
  { id: "hair-style", label: "Hair Style" },
  { id: "hair-color", label: "Hair Color" },
  { id: "forehead", label: "Forehead & Hairline" },
  { id: "eyebrows", label: "Eyebrows" },
  { id: "eyes-details", label: "Eyes" },
  { id: "ears", label: "Ears" },
  { id: "nose", label: "Nose" },
  { id: "cheeks", label: "Cheeks" },
  { id: "lips-teeth", label: "Lips & Teeth" },
  { id: "beard-style", label: "Beard & Mustache" },
  { id: "beard-color", label: "Beard Color" },
  { id: "portrait-skin", label: "Skin & Complexion" },
  { id: "head-pose", label: "Head & Pose" },
  { id: "lighting-color", label: "Lighting & Color" },
  { id: "image-quality", label: "Image Quality" },
  { id: "old-photo", label: "Old Photo Restoration" },
  { id: "background-composition", label: "Background & Composition" },
  { id: "id-studio", label: "ID & Studio Portrait" },
  { id: "creative-finish", label: "Creative Finish" },
] as const;

/**
 * Consistent, semantic Lucide icons for each editing preset.
 * These are presentation-only; guide labels and AI prompts remain unchanged.
 */
export const EDITING_GUIDE_ICONS: Record<string, LucideIcon> = {
  // Portrait & Skin
  "Fair & Bright Skin": Sun,
  "Glow & Makeup": WandSparkles,
  "Smooth Skin": Droplets,
  "Remove Blemishes": Eraser,
  "Remove All Facial Marks": Sparkles,
  "Even Skin Tone": Blend,
  "Reduce Dark Circles": Eye,
  "Reduce Facial Shine": Sparkles,
  "Preserve Skin Texture": Fingerprint,
  "Reduce Temporary Redness": Droplet,
  "Soften Fine Lines": Waves,
  "Refine Makeup": Brush,
  "Remove Makeup": Eraser,
  "Lipstick": Paintbrush,

  // Eyes & Facial Details
  "Studio Straight Pose": ScanFace,
  "Straighten Head": ScanFace,
  "Straighten Tilted Photo": RotateCw,
  "Keep Marks": ShieldCheck,
  "Brighten Eyes": Eye,
  "Sharpen Eye Details": ScanEye,
  "Reduce Red Eyes": Eye,
  "Whiten Teeth Naturally": Smile,
  "Enhance Eyebrows": Pencil,
  "Tidy Facial Hair": Scissors,
  "Define Beard & Mustache": UserRound,
  "Tame Stray Hair": Scissors,
  "Restore Facial Details": ScanFace,
  "Preserve Natural Expression": Smile,

  // Hair Style
  "Neat Short Haircut": Scissors,
  "Side Part Hair": Scissors,
  "Slick Back Hair": Scissors,
  "Crew Cut": Scissors,
  "Buzz Cut": Scissors,
  "Textured Quiff": Scissors,
  "Taper Fade": Scissors,
  "Long Straight Hair": Scissors,
  "Long Wavy Hair": Scissors,
  "Shoulder-Length Bob": Scissors,
  "Pixie Cut": Scissors,
  "Low Bun": Scissors,
  "High Ponytail": Scissors,
  "Side Braid": Scissors,
  "Curtain Bangs": Scissors,
  "Curly Hair": Scissors,
  "Black Hair Color": Scissors,
  "Cover Gray Hair": Scissors,

  // Lighting & Color
  "Brighten Image": Sun,
  "Studio Lighting": LampDesk,
  "Fix Underexposure": SunDim,
  "Recover Highlights": Sun,
  "Correct White Balance": Pipette,
  "Natural Color Correction": Palette,
  "Improve Contrast": Contrast,
  "Remove Color Cast": Blend,
  "Reduce Harsh Shadows": Moon,
  "Brighten Face Shadows": Sun,
  "Correct Backlighting": CloudSun,
  "Reduce Flash Glare": Camera,

  // Image Quality
  "Sharpen Details": ScanSearch,
  "Reduce Image Noise": SlidersHorizontal,
  "Deblur Image": Focus,
  "Upscale Image Detail": Maximize,
  "Reduce Pixelation": Grid2X2,
  "Fix Compression Artifacts": FileImage,
  "Improve Low-Light Photo": Moon,
  "Recover Fine Details": Scan,
  "Remove Lens Haze": Cloud,
  "Correct Soft Focus": Focus,
  "Improve Print Clarity": Printer,
  "Balance HDR Highlights": SlidersHorizontal,

  // Old Photo Restoration
  "Restore Old Photo": History,
  "Repair Scratches": PenLine,
  "Repair Tears & Creases": Wrench,
  "Remove Dust & Spots": Sparkles,
  "Restore Faded Photo": Image,
  "Colorize Black & White Photo": Palette,
  "Improve Black & White Contrast": Contrast,
  "Repair Water Damage": Droplet,
  "Rebuild Damaged Edges": Scan,
  "Recover Faded Faces": ScanFace,
  "Remove Yellowing": Eraser,
  "Restore Vintage Portrait": Film,

  // Background & Composition
  "Clean Background": Paintbrush,
  "Remove Background Distractions": Eraser,
  "Smooth Background": Layers,
  "Remove Edge Halos": Circle,
  "Refine Hair Edges": Scissors,
  "Separate Subject from Background": Layers,
  "Center Subject": AlignCenter,
  "Balance Headroom": Ruler,
  "Correct Perspective": Move,
  "Refine Photo Framing": Frame,
  "Extend Image Edges": Expand,
  "Clean ID Photo Background": Image,

  // ID & Studio Portrait
  "Formal Portrait Finish": UserCheck,
  "Passport Photo Polish": BadgeCheck,
  "Neutral Background Cleanup": Circle,
  "Even Face Lighting": Lightbulb,
  "Align Eye Line": Eye,
  "Keep Original Glasses": Glasses,
  "Reduce Glasses Glare": Glasses,
  "Natural Professional Retouch": UserRound,
  "Clean Clothing Edges": Scissors,
  "Refine Collar & Tie": Shirt,
  "Improve ID Photo Clarity": ScanFace,
  "Consistent Dual Portraits": Users,

  // Creative Finish
  "Soft Vintage Film Look": Film,
  "Black & White Portrait": Contrast,
  "Cinematic Color Grade": Clapperboard,
  "Warm Classic Portrait": Sun,
  "Cool Modern Portrait": Snowflake,
  "Matte Finish": Circle,
  "Subtle Film Grain": Film,
  "High-Key Studio Look": Sun,
  "Low-Key Studio Look": Moon,
  "Soft Glow Finish": Sparkles,
  "Rich Natural Colors": Palette,
  "Minimalist Portrait Finish": CircleDot,
};

const HAIR_RULE = "Change only the visible hair on the head. Keep the face, forehead shape, eyebrows, ears, facial hair, skin and expression exactly unchanged, keep both eyes and eyebrows fully visible, and keep the hair photorealistic with natural individual strands, neat and studio-ready for an ID photo with no flyaway hairs. Keep the natural hair color and density unless a color is stated. If the person wears a hijab, headscarf, cap or turban, leave that head covering exactly as it is and ignore this hair edit.";

// ---------------------------------------------------------------------------
// Shared rules for the face-part presets (hair color, eyebrows, beard).
// Each rule says exactly WHAT may change and WHAT must stay untouched, so the
// AI never "leaks" an edit into a neighbouring part of the face.
// ---------------------------------------------------------------------------
const HAIR_COLOR_RULE = "Recolor ONLY the visible hair on the head. Recolor every strand evenly and completely from root to tip, including gray, white, faded or sun-bleached strands, the temples and the hairline, leaving no gray patches, no two-tone roots and no uneven spots. Keep the original hairstyle, hair shape, volume, parting and natural individual strands with realistic soft highlights and shadows (never flat, painted, plastic or wig-like). Keep the face, skin, ears, forehead, eyebrows, eyelashes, beard and mustache unchanged, with no color bleeding onto the skin, forehead, ears, neck or clothing. If a hair style edit is also requested, apply this color to that new hairstyle. If the person wears a hijab, headscarf, cap or turban, leave that head covering exactly as it is and ignore this edit. If the person is bald or has very little hair, color only the hair that exists and never add hair.";

const BROW_RULE = "Change ONLY the eyebrows. Keep the eyes, eyelids, eyelashes, forehead, nose, hair, skin tone and face shape exactly unchanged. The eyebrows must be photorealistic, made of fine natural individual hairs (never drawn-on, tattooed, stenciled, blocky or cartoonish), sit in their natural position above the eyes, and be symmetrical in length, height, thickness and angle between left and right. Unless an eyebrow color edit is requested, keep the natural eyebrow color.";

const BROW_COLOR_RULE = "Recolor ONLY the eyebrow hairs, evenly and completely including any gray or white hairs, keeping the original eyebrow shape, thickness, density and natural individual hairs with realistic depth (not flat or painted). Keep the eyes, eyelashes, eyelids, forehead, skin, hair on the head and any beard unchanged, with no color bleeding onto the skin or eyelids.";

const BEARD_RULE = "Change ONLY the beard, mustache and beard-side sideburns. Keep the face shape, jawline, chin shape, lips, teeth, skin tone, the hair on the head, the eyebrows and the expression exactly unchanged, and keep the lips and mouth fully visible and undistorted. The facial hair must be photorealistic: natural individual hair strands, a natural density gradient (denser at the chin and mustache, lighter toward the cheeks), neat clean groomed edges and cheek line, symmetrical left and right, never pasted-on, painted, blurry or patchy. Unless a beard color edit is requested, use the person's existing facial-hair color; if the person has no facial hair, use the natural color of the hair on their head (matching any hair color edit requested), using a natural dark shade of the same family if that hair is gray or white. If the person wears a niqab or other face covering, ignore this edit.";

const BEARD_COLOR_RULE = "Recolor ONLY the existing beard, mustache and beard-side sideburn hair. If no facial hair is visible, make no change and never add a beard. Recolor every strand evenly and completely from root to tip, including all gray and white strands and patches, keeping the original beard shape, length, density, edges and realistic strand texture with soft natural highlights and shadows (never flat or painted). Keep the skin underneath, lips, teeth, eyebrows and the hair on the head unchanged, with no color bleeding onto the skin, lips or clothing.";

/** DEFAULT skin retouch for every photo: very clean face, but the person's own skin color stays exactly the same. */
export const KEEP_SKIN_COLOR_RETOUCH_RULE = "PROFESSIONAL CLEAN-SKIN RETOUCH (always apply, exactly like a skilled human retoucher preparing a clean studio ID photo): the whole face, neck and ears must look completely clean, clear, even and healthy, like a real DSLR photograph and NOT like an AI image. (1) SKIN COLOR LOCK (highest priority for skin): keep the person's skin color exactly as it is in the original photo, with the same shade, depth and undertone. Do NOT lighten, whiten, brighten, darken, tan, tint, or change the complexion in any way; a dusky, wheatish, brown or dark complexion stays exactly that. (2) CLEANLINESS: remove dark patches, blotchy or uneven pigmentation, stains, dust specks, pimples, acne marks, dirty-looking spots, oily shine and muddy shadows so the forehead, cheeks, nose, chin, eye area, mouth area, neck and ears all share one smooth, consistent, clean tone of that same skin color. (3) NATURAL FINISH: keep realistic fine skin texture and pores exactly like the original photo, with NO glow, NO shine, NO gloss and no added highlights, and no plastic, waxy, airbrushed or over-smoothed look and no beauty-filter or AI look. (4) LIMITS: never change face structure, expression or identity. If the final photo is black and white, apply the same evenness and spot removal as tones only.";

/**
 * Optional skin color chosen by the user. It travels in the same selected-guides list as an entry like
 * "Skin Tone: Brown"; it is never a tile of its own. "Original" (no entry) keeps the photo's own color.
 */
export const SKIN_TONE_PREFIX = "Skin Tone:";
export const SKIN_TONES: { name: string; bn: string; hex: string; prompt: string }[] = [
  { name: "Very Fair", bn: "খুব ফর্সা", hex: "#F7DDC9", prompt: "a very fair, light ivory-beige" },
  { name: "Light Fair", bn: "হালকা ফর্সা", hex: "#F3D3B8", prompt: "a light fair, soft peachy-beige" },
  { name: "Fair", bn: "ফর্সা", hex: "#EFC8A6", prompt: "a fair, light warm-beige" },
  { name: "Rosy Fair", bn: "গোলাপি আভার ফর্সা", hex: "#EDBBA6", prompt: "a fair skin with a soft natural rosy-pink undertone" },
  { name: "Medium Fair", bn: "মাঝারি ফর্সা", hex: "#E4B58F", prompt: "a medium fair, warm light-honey" },
  { name: "Light Wheatish", bn: "হালকা শ্যামলা", hex: "#DDAE84", prompt: "a light wheatish, golden-beige" },
  { name: "Wheatish", bn: "উজ্জ্বল শ্যামলা", hex: "#C99468", prompt: "a medium wheatish, warm golden-brown" },
  { name: "Olive", bn: "জলপাই রং", hex: "#B58A5C", prompt: "a medium olive, slightly greenish-golden" },
  { name: "Tan", bn: "তামাটে", hex: "#A06F47", prompt: "a tan, warm bronze-brown" },
  { name: "Brown", bn: "শ্যামলা বাদামি", hex: "#8A5A3A", prompt: "a medium-deep natural brown" },
  { name: "Dark Brown", bn: "গাঢ় শ্যামলা", hex: "#6B4129", prompt: "a deep dark brown" },
  { name: "Deep Dark", bn: "ঘন কালো-বাদামি", hex: "#4A2C1C", prompt: "a very deep, dark espresso-brown" },
  { name: "Very Dark", bn: "গাঢ় কালো", hex: "#33200F", prompt: "an extremely deep, rich dark ebony-brown" },
];

/**
 * Optional facial expression chosen by the user (quick wizard, last step). It travels in the same selected-guides
 * list as an entry like "Expression: Soft Smile"; it is never a tile of its own. No entry = keep the photo's expression.
 */
export const EXPRESSION_PREFIX = "Expression:";
export const EXPRESSIONS: { name: string; bn: string; hint: string; prompt: string; changes: boolean }[] = [
  {
    name: "Original",
    bn: "যেমন আছে তেমন",
    hint: "ছবিতে যেরকম মুখের ভাব আছে, ঠিক সেরকমই থাকবে।",
    changes: false,
    prompt:
      "EXPRESSION LOCK (requested by the user): keep the person's facial expression exactly as it is in the original photo: the same mouth shape, the same amount of smile (or no smile), teeth visible only if they are visible in the original, and the same relaxed look in the eyes. Do not make the person smile more or less than in the original and do not change the mouth.",
  },
  {
    name: "Big Smile",
    bn: "হাসিমুখ",
    hint: "স্বাভাবিক, আন্তরিক হাসি। দাঁত হালকা দেখা যাবে।",
    changes: true,
    prompt:
      "EXPRESSION OVERRIDE (requested by the user, it beats every other mention of expression in this request, including any calm, neutral or closed-mouth wording): give the person a natural, warm, friendly, genuine smile. The lips are gently parted with the upper teeth naturally visible, the mouth corners are lifted evenly on both sides, the cheeks are lightly raised, and the eyes look relaxed and happy without squinting. It must be a believable real smile, never a wide grin, never forced, never exaggerated. Teeth must be real-looking, natural in shape and size, evenly spaced, naturally clean (not artificially white) and not too many, and the lips keep their original shape and color. Only the mouth, cheeks and eye-area expression change; the face shape, features, skin color, age and identity stay exactly the same real person.",
  },
  {
    name: "Soft Smile",
    bn: "হালকা হাসি",
    hint: "ঠোঁট বন্ধ রেখে খুব হালকা, ভদ্র হাসি।",
    changes: true,
    prompt:
      "EXPRESSION OVERRIDE (requested by the user, it beats every other mention of expression in this request): give the person a slight, soft, pleasant closed-mouth smile. The lips stay together with NO teeth visible, the mouth corners are lifted only a little and evenly on both sides, and the eyes look calm, friendly and relaxed. It must look natural and real, never a grin, never forced. Only the mouth and the area around the eyes change slightly; the face shape, features, skin color, age and identity stay exactly the same real person.",
  },
  {
    name: "Neutral",
    bn: "স্বাভাবিক / নরমাল",
    hint: "শান্ত, সাধারণ মুখ। হাসি নেই, রাগ বা মন খারাপের ভাবও নেই।",
    changes: true,
    prompt:
      "EXPRESSION OVERRIDE (requested by the user, it beats every other mention of expression in this request): give the person a calm, natural, relaxed neutral expression. The mouth is closed with the lips resting together and relaxed, the mouth corners are level (no smile, no frown), no teeth are visible, the jaw and cheeks are relaxed, and both eyes are open, relaxed and looking straight into the camera. It must not look stern, angry, sad or tense. Only the mouth and the area around the eyes change; the face shape, features, skin color, age and identity stay exactly the same real person.",
  },
];
/** Prompt rule for the chosen expression ("" or an unknown name = no expression rule at all). */
export function buildExpressionRule(name: string): string {
  return EXPRESSIONS.find((item) => item.name === name)?.prompt ?? "";
}
/** True when the chosen expression really changes the face (so "keep the expression" rules must step aside). */
export const expressionChangesFace = (name: string) => EXPRESSIONS.some((item) => item.name === name && item.changes);

/**
 * Optional necktie for suit-like clothing. It travels in the same selected-guides list as an entry like
 * "Tie: Red" or "Tie: None"; it is never a tile of its own and only applies when the clothing can carry a tie.
 */
export const TIE_PREFIX = "Tie:";
export const TIE_STYLES = ["Shirt", "Suit", "Blazer", "Shirt & Tie", "Three-Piece Suit", "Waistcoat", "Overcoat"];
export const TIE_COLORS: { name: string; bn: string; hex: string }[] = [
  { name: "Black", bn: "কালো", hex: "#1E1E1E" },
  { name: "Navy", bn: "নেভি নীল", hex: "#1E3A8A" },
  { name: "Blue", bn: "নীল", hex: "#2563EB" },
  { name: "Red", bn: "লাল", hex: "#DC2626" },
  { name: "Maroon", bn: "মেরুন", hex: "#7F1D1D" },
  { name: "Gray", bn: "ধূসর", hex: "#6B7280" },
  { name: "Green", bn: "সবুজ", hex: "#166534" },
  { name: "Gold", bn: "সোনালি", hex: "#CA8A04" },
  { name: "Purple", bn: "বেগুনি", hex: "#6D28D9" },
];
/** True for every "option" entry that is not a tile of its own (lipstick colour, skin tone, tie). */
export const isOptionEntry = (entry: string) =>
  entry.startsWith("Lipstick Color:") || entry.startsWith(SKIN_TONE_PREFIX) || entry.startsWith(EXPRESSION_PREFIX) || entry.startsWith(TIE_PREFIX);

/** Prompt rule used instead of the default skin retouch when the user picks a specific skin color. */
export function buildSkinToneRule(toneName: string): string {
  const tone = SKIN_TONES.find((item) => item.name === toneName);
  if (!tone) return KEEP_SKIN_COLOR_RETOUCH_RULE;
  return `PROFESSIONAL CLEAN-SKIN RETOUCH WITH A CHOSEN SKIN COLOR (always apply, exactly like a skilled human retoucher): give the person ${tone.prompt} skin color (about ${tone.hex}) over the whole face, neck, ears and any visible skin, as a natural real-photo complexion. The chosen skin color applies to the SKIN ONLY: never recolor the eyes, teeth, lips, hair, eyebrows, beard, clothing or background, and keep the white of the eyes and the teeth naturally white. The skin must match on the face, neck and ears and look like real lit skin of that complexion, with natural shading, and it must stay clearly believable for the same person (same face structure, undertone family and identity; no gray, orange, plastic or painted look). Make the whole face completely clean and even: remove dark patches, blotches, uneven pigmentation, stains, dust specks, pimples, acne marks, oily shine and muddy shadows so the face looks perfectly clean at first glance, while keeping realistic fine skin texture and pores (no waxy, airbrushed, glossy or AI look). If the final photo is black and white, apply the same evenness, cleanliness and tonal depth as tones only.`;
}

const RAW_GUIDES: EditingGuidePreset[] = [
  // Portrait & Skin (13)
  { label: "Fair & Bright Skin", category: "portrait-skin", prompt: "Make the skin visibly fairer, brighter and cleaner, like a high-quality professional Photoshop skin retouch. Clearly lift the skin brightness and luminosity of the face, neck and ears by a noticeable medium-to-strong amount (a clearly fairer, fresher, clearer complexion, but still natural). Remove dullness, dark or dusky tone, grayish or muddy cast, sun-tan patches, dark blotches, uneven pigmentation, dark marks, dirty-looking spots, stains, pimple marks, dark under-eye circles and oily shine, so the whole face has one smooth, even, radiant tone. Keep realistic skin texture and pores (no plastic or airbrushed look). Keep the person's natural undertone: never make the skin chalky, pale-white, gray, orange or pink. Face, neck and ears must match in color. Keep face structure, expression, moles, birthmarks and scars unchanged so it is clearly the same person." },
  { label: "Glow & Makeup", category: "portrait-skin", prompt: "Add a subtle, polished grooming touch and a healthy natural glow: even-looking skin and soft, natural-looking makeup where it suits the person. Keep the skin clean, bright and even. Keep it realistic, age-appropriate, and consistent with the person's identity; do not change facial structure or eye shape." },
  { label: "Smooth Skin", category: "portrait-skin", prompt: "Smooth out blemishes, dark spots, patchy dullness and unevenness so the skin looks clean, clear and bright, while preserving pores, natural skin texture, fine detail, and the person's natural undertone. Avoid plastic or airbrushed skin." },
  { label: "Remove All Facial Marks", category: "portrait-skin", prompt: "Remove every small mark from the facial skin so it looks completely clean and clear: moles, dark spots, freckles, age spots, pigmentation patches, pimples, acne marks, scars and other small skin marks on the forehead, cheeks, nose, chin, jaw and neck. Rebuild the skin underneath naturally with realistic pores and fine skin texture, matching the surrounding skin tone (never blurry, smeared, waxy or plastic). Do not change the face shape, eyes, eyebrows, lips, teeth, hair, beard, expression or identity." },
  { label: "Remove Blemishes", category: "portrait-skin", prompt: "Remove pimples, acne marks, dark spots, dirty-looking specks, stains and other small transient blemishes completely so the skin looks clean. Preserve moles, scars, birthmarks, and other stable identifying marks." },
  { label: "Even Skin Tone", category: "portrait-skin", prompt: "Even out patchy, blotchy or dark-and-light skin tone across the forehead, cheeks, nose, chin, neck and ears into one smooth, consistent, clean tone. Keep the person's natural undertone, ethnicity and facial structure." },
  { label: "Reduce Dark Circles", category: "portrait-skin", prompt: "Clearly reduce under-eye darkness, dark rings and tired-looking shadows so the eye area matches the rest of the face, while keeping natural eye contours and realistic skin texture." },
  { label: "Reduce Facial Shine", category: "portrait-skin", prompt: "Reduce distracting oily shine on the forehead, nose, and cheeks while retaining natural skin highlights and realistic texture." },
  { label: "Preserve Skin Texture", category: "portrait-skin", prompt: "Retain realistic pores, fine lines, and skin texture. Avoid excessive smoothing, waxy skin, or artificial beauty-filter effects." },
  { label: "Reduce Temporary Redness", category: "portrait-skin", prompt: "Gently reduce temporary irritation or blotchy redness while preserving natural lip color, undertones, and any meaningful skin marks." },
  { label: "Soften Fine Lines", category: "portrait-skin", prompt: "Slightly soften temporary-looking fine lines without changing age, facial shape, expression, or natural skin character." },
  { label: "Refine Makeup", category: "portrait-skin", prompt: "Refine existing makeup with subtle, clean blending and natural color balance. Do not add dramatic makeup or change facial identity." },
  { label: "Remove Makeup", category: "portrait-skin", prompt: "Reduce visible cosmetic makeup (lipstick, eye makeup, heavy foundation) to a natural, minimally made-up appearance while keeping the person's face, lip shape, complexion, and features unchanged." },
  { label: "Lipstick", category: "portrait-skin", prompt: "Apply subtle, natural-looking lipstick in a flattering shade that suits the person's skin tone. Preserve the original lip shape, teeth, expression, facial identity, and realistic lip texture." },

  // Eyes & Facial Details (12)
  { label: "Straighten Tilted Photo", category: "eyes-details", prompt: "The photo was taken at a tilt (crooked phone, leaning head or neck, slanted shoulders). Rotate and level the whole subject so the head, neck and shoulders sit naturally upright and symmetrical, facing the camera, with level shoulders and a vertical spine/neck line. Keep the person's identity, facial features, expression, hair and clothing exactly the same; do not change face shape or proportions, and rebuild any edge areas revealed by the rotation naturally." },
  { label: "Straighten Head", category: "eyes-details", prompt: "Correct the head angle so the face is naturally upright and looking toward the camera, preserving facial proportions and a realistic neck and shoulder position." },
  { label: "Studio Straight Pose", category: "eyes-details", prompt: "STUDIO PORTRAIT POSE (mandatory, the output must visibly differ from the input in head angle and shoulder line; do not just rotate the picture, redraw the head, neck and shoulders upright and frontal). Re-pose the person exactly as if they had sat down in front of a professional passport-studio photographer and been photographed straight-on: the head is perfectly upright and centered with NO tilt, NO lean, NO turn and NO nod; the neck is straight and vertical; both shoulders are level, square to the camera and symmetrical (no slanting, no one shoulder raised or pushed forward, no body turned sideways); the chest and torso face the camera directly; the chin is level (not raised, not lowered); both eyes are open, on the same horizontal line, and look straight into the camera lens with a calm, natural expression. If the original photo is crooked, tilted, rotated, shot from the side or three-quarter angle, from above or below, or the person looks away or leans, rebuild the head angle, neck and shoulders into this straight frontal pose. While re-posing, the face must stay the identical real person: same facial features, face shape, skin color, eyebrows, hairstyle, and the same clothing (any head covering is handled by the separate HEAD COVERING rule of this request); only the orientation of the head and body changes, so render the same person seen straight-on, never a different, generic or idealized face. The camera is at eye level with a long portrait lens (about 85mm equivalent) and no wide-angle distortion." },
  { label: "Keep Marks", category: "eyes-details", prompt: "Preserve natural identifying marks such as moles, scars, birthmarks, freckles, and other stable facial details exactly where they are. Overall skin brightening, even tone and removal of temporary spots still apply, but never erase these permanent marks." },
  { label: "Brighten Eyes", category: "eyes-details", prompt: "Make the eyes appear a little clearer and more lively with subtle, realistic brightness. Preserve the original eye shape, iris color, gaze, and expression." },
  { label: "Sharpen Eye Details", category: "eyes-details", prompt: "Improve clarity around the eyes, eyelashes, and brows without enlarging, reshaping, recoloring, or artificially redrawing the eyes." },
  { label: "Reduce Red Eyes", category: "eyes-details", prompt: "Correct camera-flash red-eye artifacts only, preserving the natural iris color, pupil, eye shape, and gaze." },
  { label: "Whiten Teeth Naturally", category: "eyes-details", prompt: "If teeth are visible, gently reduce yellow discoloration while preserving natural tooth color, tooth shape, and the original expression. Do not invent or add teeth." },
  { label: "Enhance Eyebrows", category: "eyes-details", prompt: "Improve eyebrow clarity and tidy stray hairs subtly while preserving the person's natural brow shape, density, and asymmetry." },
  { label: "Tidy Facial Hair", category: "eyes-details", prompt: "Neatly refine existing facial hair and stray hairs while preserving the original beard or moustache style, density, and face shape." },
  { label: "Define Beard & Mustache", category: "eyes-details", prompt: "Improve the clarity and grooming of existing beard or moustache hair without inventing a new style, changing age, or altering the jawline." },
  { label: "Tame Stray Hair", category: "eyes-details", prompt: "Tidy a small number of distracting flyaway hairs while preserving the hairstyle, hairline, volume, texture, and natural hair strands." },
  { label: "Restore Facial Details", category: "eyes-details", prompt: "Carefully recover plausible facial detail obscured by mild fading or softness. Do not invent distinctive features or alter the person's identity." },
  { label: "Preserve Natural Expression", category: "eyes-details", prompt: "Keep the original expression and gaze natural. Do not force a smile, change the mouth, or make the expression unnaturally symmetrical." },

  // Hair Style (18)
  { label: "Neat Short Haircut", category: "hair-style", prompt: `Give the person a neat, short, well-groomed haircut with clean tapered sides, a tidy natural hairline and a smooth, even top. ${HAIR_RULE}` },
  { label: "Side Part Hair", category: "hair-style", prompt: `Style the hair into a neat classic side part, combed smoothly to one side with natural volume on top and short, tidy sides. ${HAIR_RULE}` },
  { label: "Slick Back Hair", category: "hair-style", prompt: `Style the hair combed neatly straight back from the forehead with a smooth, tidy finish that shows the full forehead, with short neat sides. ${HAIR_RULE}` },
  { label: "Crew Cut", category: "hair-style", prompt: `Give the person a short, even crew cut, slightly longer on top than on the sides, with clean sharp edges. ${HAIR_RULE}` },
  { label: "Buzz Cut", category: "hair-style", prompt: `Give the person a very short, uniform buzz cut across the whole head (close-cropped stubble length) with a clean, neat hairline. ${HAIR_RULE}` },
  { label: "Textured Quiff", category: "hair-style", prompt: `Give the person short sides with a textured, slightly raised quiff on top swept up and back, neat and natural, with modest height so the top of the head stays inside the frame. ${HAIR_RULE}` },
  { label: "Taper Fade", category: "hair-style", prompt: `Give the person a clean taper fade: sides and back fading gradually from short to very short, with slightly longer neat hair on top. ${HAIR_RULE}` },
  { label: "Long Straight Hair", category: "hair-style", prompt: `Style the hair as long, straight, smooth and glossy, falling neatly past the shoulders and combed with no flyaways, keeping the whole face clearly visible. ${HAIR_RULE}` },
  { label: "Long Wavy Hair", category: "hair-style", prompt: `Style the hair as long with soft, natural, even waves, falling neatly past the shoulders, tidy and glossy, keeping the whole face clearly visible. ${HAIR_RULE}` },
  { label: "Shoulder-Length Bob", category: "hair-style", prompt: `Style the hair as a smooth, neat shoulder-length bob with tidy even ends and a clean parting, keeping the whole face clearly visible. ${HAIR_RULE}` },
  { label: "Pixie Cut", category: "hair-style", prompt: `Give the person a short, neat pixie cut with soft tapered sides and a short, lightly textured top. ${HAIR_RULE}` },
  { label: "Low Bun", category: "hair-style", prompt: `Style the hair pulled back smoothly into a neat low bun at the back of the neck, with a clean parting and no loose strands. ${HAIR_RULE}` },
  { label: "High Ponytail", category: "hair-style", prompt: `Style the hair pulled up smoothly into a neat high ponytail with no loose strands; the ponytail may be partly visible behind the head. ${HAIR_RULE}` },
  { label: "Side Braid", category: "hair-style", prompt: `Style the hair into a neat single braid resting over one shoulder, with a smooth, tidy top and no loose strands. ${HAIR_RULE}` },
  { label: "Curtain Bangs", category: "hair-style", prompt: `Style long hair with soft center-parted curtain bangs sweeping to both sides, keeping the eyes and eyebrows fully visible. ${HAIR_RULE}` },
  { label: "Curly Hair", category: "hair-style", prompt: `Style the hair as soft, defined, natural-looking curls with neat, controlled volume that stays inside the frame. ${HAIR_RULE}` },
  { label: "Black Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a natural deep black with realistic shine and natural strand variation, keeping the original hairstyle, hair shape and hairline. Do not change the eyebrows or any beard or mustache. ${HAIR_RULE}` },
  { label: "Cover Gray Hair", category: "hair-style", prompt: `Naturally cover gray and white hair on the head with a rich natural black (or very dark brown) color with realistic shine, keeping the original hairstyle, hair shape and hairline. Leave the eyebrows and any beard or mustache unchanged. ${HAIR_RULE}` },

  // Lighting & Color (12)
  { label: "Brighten Image", category: "lighting-color", prompt: "Correct exposure and brighten the portrait gently without washing out skin tones, losing highlights, or flattening facial depth." },
  { label: "Studio Lighting", category: "lighting-color", prompt: "Use clean, soft professional studio lighting with natural facial shading, balanced highlights, and no harsh artificial hotspots." },
  { label: "Fix Underexposure", category: "lighting-color", prompt: "Lift overly dark exposure while recovering shadow detail carefully and keeping skin tones, blacks, and contrast believable." },
  { label: "Recover Highlights", category: "lighting-color", prompt: "Reduce clipped bright areas and recover plausible highlight detail without making the image muddy or dull." },
  { label: "Correct White Balance", category: "lighting-color", prompt: "Correct the white balance so neutral whites and grays look natural, with realistic skin tone and no unwanted color tint." },
  { label: "Natural Color Correction", category: "lighting-color", prompt: "Correct color balance for a clean, lifelike result. Avoid oversaturation and retain the original scene's believable colors." },
  { label: "Improve Contrast", category: "lighting-color", prompt: "Improve tonal contrast gently so facial details remain clear, highlights are not clipped, and shadows retain visible detail." },
  { label: "Remove Color Cast", category: "lighting-color", prompt: "Remove unwanted green, magenta, yellow, or blue color casts while preserving natural complexion and realistic colors." },
  { label: "Reduce Harsh Shadows", category: "lighting-color", prompt: "Soften harsh, distracting shadows while maintaining natural facial shape and enough directional light to preserve depth." },
  { label: "Brighten Face Shadows", category: "lighting-color", prompt: "Gently lift overly dark facial shadows, especially around the eyes and cheeks, while keeping natural contours and realistic lighting." },
  { label: "Correct Backlighting", category: "lighting-color", prompt: "Balance a brightly lit background and a dark subject so the face is properly exposed without creating halos or unnatural edge brightness." },
  { label: "Reduce Flash Glare", category: "lighting-color", prompt: "Reduce harsh camera-flash hotspots and glare on skin while preserving realistic facial highlights and texture." },

  // Image Quality (12)
  { label: "Sharpen Details", category: "image-quality", prompt: "Apply restrained, natural sharpening to important details without creating halos, jagged edges, crunchy textures, or artificial features." },
  { label: "Reduce Image Noise", category: "image-quality", prompt: "Reduce distracting digital color and luminance noise while preserving fine details, hair strands, pores, and edges." },
  { label: "Deblur Image", category: "image-quality", prompt: "Reduce mild blur and improve perceived clarity where possible. Do not fabricate uncertain details or change facial features to compensate for blur." },
  { label: "Upscale Image Detail", category: "image-quality", prompt: "Improve apparent detail and resolution with realistic textures and clean edges. Avoid invented micro-details, ringing, and oversharpening." },
  { label: "Reduce Pixelation", category: "image-quality", prompt: "Reduce blocky pixelation and jagged edges, reconstructing smooth transitions conservatively while preserving the original subject." },
  { label: "Fix Compression Artifacts", category: "image-quality", prompt: "Reduce JPEG blocking, ringing, mosquito noise, and other compression artifacts without smearing facial or clothing details." },
  { label: "Improve Low-Light Photo", category: "image-quality", prompt: "Improve a low-light photo by balancing exposure, reducing noise, and restoring visible detail while retaining a natural night or indoor appearance." },
  { label: "Recover Fine Details", category: "image-quality", prompt: "Bring out plausible fine details in hair, clothing, and facial contours without creating false texture or altering identifying features." },
  { label: "Remove Lens Haze", category: "image-quality", prompt: "Reduce mild lens haze or veiling glare to improve clarity and contrast while retaining natural colors and realistic tonal transitions." },
  { label: "Correct Soft Focus", category: "image-quality", prompt: "Improve a slightly soft-focus image with moderate local clarity and edge definition. Do not create fake eyelashes, hair strands, or facial detail." },
  { label: "Improve Print Clarity", category: "image-quality", prompt: "Prepare the image for clearer printing by improving tonal definition and reducing visible artifacts without adding borders, labels, or text." },
  { label: "Balance HDR Highlights", category: "image-quality", prompt: "Balance overly bright and dark areas for a natural high-dynamic-range appearance, avoiding halos, flat lighting, and an overprocessed HDR look." },

  // Old Photo Restoration (12)
  { label: "Restore Old Photo", category: "old-photo", prompt: "Restore this aged photograph: repair scratches, creases, tears, dust, stains, and fading, recover natural contrast and clarity, and reduce yellowing and noise. Keep every person's identity, facial features, expression, pose, clothing, period-appropriate look, and the original composition exactly. Repair only damage that is actually present; do not add, remove, or invent people, objects, or text, and do not over-smooth faces into a modern, plastic look. Do not colorize or modernize the photo unless a colorization edit is also requested." },
  { label: "Repair Scratches", category: "old-photo", prompt: "Repair visible scratches and thin scrape marks using surrounding image information. Keep original facial features and avoid smoothing unaffected areas." },
  { label: "Repair Tears & Creases", category: "old-photo", prompt: "Repair tears, folds, and crease lines in the photograph, blending damaged areas with nearby tones and textures while preserving the original scene." },
  { label: "Remove Dust & Spots", category: "old-photo", prompt: "Remove dust specks, small stains, and scanning spots from the photo without erasing meaningful details, freckles, moles, or intentional texture." },
  { label: "Restore Faded Photo", category: "old-photo", prompt: "Recover contrast and detail in a faded photo while keeping its original tonal character and avoiding overly modern colors unless specifically requested." },
  { label: "Colorize Black & White Photo", category: "old-photo", prompt: "Colorize the monochrome photograph with restrained, historically plausible colors and realistic skin tones. Preserve the original composition and identity, and do not add objects." },
  { label: "Improve Black & White Contrast", category: "old-photo", prompt: "Improve tonal separation in the black-and-white photograph with natural highlights, midtones, and shadows while keeping it monochrome." },
  { label: "Repair Water Damage", category: "old-photo", prompt: "Reduce water stains, tide marks, and water-related discoloration, reconstructing damaged patches conservatively from nearby image context." },
  { label: "Rebuild Damaged Edges", category: "old-photo", prompt: "Repair small torn or missing edge areas by extending nearby background and texture naturally. Do not invent new people, limbs, or important scene content." },
  { label: "Recover Faded Faces", category: "old-photo", prompt: "Carefully improve visibility of faded faces in an old photograph using only plausible information. Preserve each person's identity and avoid overconfident reconstruction." },
  { label: "Remove Yellowing", category: "old-photo", prompt: "Reduce age-related yellow or brown color shifts while maintaining a natural, period-appropriate photographic tone and preserving original details." },
  { label: "Restore Vintage Portrait", category: "old-photo", prompt: "Clean and restore the vintage portrait with restrained repair, realistic detail, and period-appropriate tonal character. Do not modernize clothing or facial features." },

  // Background & Composition (12)
  { label: "Clean Background", category: "background-composition", prompt: "Clean up the background so it is smooth, even, and free of distracting irregularities, stains, blotches, and clutter, keeping {background} and a clean natural separation from the subject." },
  { label: "Remove Background Distractions", category: "background-composition", prompt: "Remove distracting background clutter, objects, and stray fragments while keeping the person completely intact and keeping {background}." },
  { label: "Smooth Background", category: "background-composition", prompt: "Reduce unwanted background texture, blotches, and banding for a smooth, even backdrop, keeping {background}. Do not smooth or soften the subject." },
  { label: "Remove Edge Halos", category: "background-composition", prompt: "Remove light or dark halos and colored fringes around the subject's outline and blend the edges cleanly into the background without cutting into hair, ears, or shoulders." },
  { label: "Refine Hair Edges", category: "background-composition", prompt: "Refine fine hair edges against the background, preserving natural individual strands and avoiding hard cutout edges or colored fringes." },
  { label: "Separate Subject from Background", category: "background-composition", prompt: "Improve separation between the person and the background with clean, realistic contours while keeping hair, ears, shoulders, and clothing intact." },
  { label: "Center Subject", category: "background-composition", prompt: "Place the subject neatly in the center of the frame while preserving natural anatomy and avoiding unnecessary changes to the face or body." },
  { label: "Balance Headroom", category: "background-composition", prompt: "Balance the empty space above the head so the framing looks intentional and professional. Do not crop hair or stretch the head." },
  { label: "Correct Perspective", category: "background-composition", prompt: "Correct mild photographic perspective distortion where possible while preserving natural facial proportions and straight, believable geometry." },
  { label: "Refine Photo Framing", category: "background-composition", prompt: "Improve the framing around the subject with balanced margins and a professional crop, keeping all important facial and shoulder details visible." },
  { label: "Extend Image Edges", category: "background-composition", prompt: "Extend only the outer image edges as needed using matching background and nearby context. Do not stretch the person or invent important scene content." },
  { label: "Clean ID Photo Background", category: "background-composition", prompt: "Make the background a clean, uniform, plain ID-photo backdrop: {background}, with no scenery, patterns, gradients, shadows, or objects, and clean edges around the subject." },

  // ID & Studio Portrait (12)
  { label: "Formal Portrait Finish", category: "id-studio", prompt: "Give the portrait a polished, professional finish suitable for formal use while retaining a realistic appearance and the person's original identity." },
  { label: "Passport Photo Polish", category: "id-studio", prompt: "Polish the portrait for passport-style presentation: clean bright even skin, natural facial detail, even exposure, centered framing, clear edges, and no change to face structure or identity." },
  { label: "Neutral Background Cleanup", category: "id-studio", prompt: "Make sure the background is a clean, evenly colored area ({background}) with no leftover scenery, fragments, or edge contamination around the subject." },
  { label: "Even Face Lighting", category: "id-studio", prompt: "Balance illumination across the face for a clear formal portrait, keeping natural facial depth, clean bright skin, and avoiding an unnaturally flat or overlit appearance." },
  { label: "Align Eye Line", category: "id-studio", prompt: "Gently align the eye line for a level, camera-facing portrait if the source angle permits, preserving the original eye shape and facial proportions." },
  { label: "Keep Original Glasses", category: "id-studio", prompt: "Preserve the person's existing glasses, including frame shape, color, placement, and lenses. Do not remove or replace them." },
  { label: "Reduce Glasses Glare", category: "id-studio", prompt: "Reduce reflections on eyeglass lenses where possible while preserving the original frames, lens transparency, eye shape, and gaze." },
  { label: "Natural Professional Retouch", category: "id-studio", prompt: "Apply professional retouching: correct lighting, clean and brighten the skin, remove temporary distractions and spots, while preserving skin texture, age, expression, and identity." },
  { label: "Clean Clothing Edges", category: "id-studio", prompt: "Neaten stray fibers and edge artifacts on the visible clothing without changing its selected style, color, fit, or fabric texture." },
  { label: "Refine Collar & Tie", category: "id-studio", prompt: "Neatly refine an existing shirt collar or tie so it looks tidy and realistic. Do not add a tie or change the selected clothing unless requested elsewhere." },
  { label: "Improve ID Photo Clarity", category: "id-studio", prompt: "Improve the clarity of the face, hair edges, and clothing for a formal identification-style portrait with realistic detail and balanced exposure. Keep the facial identity unchanged." },
  { label: "Consistent Dual Portraits", category: "id-studio", prompt: "Give this portrait a neutral, standard exposure, color balance, and professional finish so it matches other portraits edited the same way. Keep this person's own features unchanged." },

  // Creative Finish (12)
  { label: "Soft Vintage Film Look", category: "creative-finish", prompt: "Apply a subtle vintage film treatment with gentle contrast and restrained warm tones while keeping facial features and skin texture realistic." },
  { label: "Black & White Portrait", category: "creative-finish", prompt: "Convert the whole image to tasteful black and white with balanced tonal separation and detailed highlights and shadows. Keep the person recognizable and the facial details natural." },
  { label: "Cinematic Color Grade", category: "creative-finish", prompt: "Apply a restrained cinematic color grade with intentional tonal contrast while preserving believable skin tones and avoiding an artificial color cast." },
  { label: "Warm Classic Portrait", category: "creative-finish", prompt: "Apply a gentle warm color treatment reminiscent of a classic studio portrait while preserving natural complexion and realistic whites." },
  { label: "Cool Modern Portrait", category: "creative-finish", prompt: "Apply a subtle cool, contemporary color balance without turning skin gray, dark or blue, keeping the skin clean and bright, and without changing facial identity." },
  { label: "Matte Finish", category: "creative-finish", prompt: "Use a restrained matte tonal finish with slightly softened contrast, keeping details clear and avoiding washed-out skin or crushed shadows." },
  { label: "Subtle Film Grain", category: "creative-finish", prompt: "Add very fine, subtle film grain for a photographic finish. Keep it even and unobtrusive, with no coarse noise on the face." },
  { label: "High-Key Studio Look", category: "creative-finish", prompt: "Create a bright, high-key studio lighting look with soft shadows and clean highlights while preserving skin detail and natural facial contours." },
  { label: "Low-Key Studio Look", category: "creative-finish", prompt: "Create a controlled low-key studio look with deeper but detailed shadows and gentle directional light, keeping the face clearly visible and the skin clean, bright and even (do not let the face turn dark or muddy)." },
  { label: "Soft Glow Finish", category: "creative-finish", prompt: "Add a restrained soft glow to bright areas while preserving edge clarity, skin texture, natural contrast, and realistic facial details." },
  { label: "Rich Natural Colors", category: "creative-finish", prompt: "Give colors a little more richness and depth while keeping skin tones believable and avoiding neon saturation or color clipping." },
  { label: "Minimalist Portrait Finish", category: "creative-finish", prompt: "Use a clean, restrained, distraction-free portrait finish with simple tones and realistic detail, avoiding decorative effects or added objects." },

  // ===== Hair Color (new) =====
  { label: "Dark Brown Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a natural deep dark brown (espresso brown, clearly brown rather than black) with subtle warm highlights and natural strand variation. ${HAIR_COLOR_RULE}` },
  { label: "Brown Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a natural medium chestnut brown with soft natural highlights and natural strand variation. ${HAIR_COLOR_RULE}` },
  { label: "Auburn Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a natural reddish-brown auburn with soft warm highlights and natural strand variation. ${HAIR_COLOR_RULE}` },
  { label: "Dark Blonde Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a natural dark blonde / golden brown with soft natural highlights and natural strand variation, subtle and realistic rather than bright or bleached. ${HAIR_COLOR_RULE}` },
  { label: "Silver Gray Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to a clean, natural silver-gray with soft light-gray and white highlights and natural strand variation, looking like real mature gray hair. ${HAIR_COLOR_RULE}` },
  { label: "White Hair Color", category: "hair-style", prompt: `Recolor the hair on the head to natural white with very soft light-gray shading so it keeps depth and strand detail, looking like real white hair and not a flat white shape. ${HAIR_COLOR_RULE}` },
  { label: "Cover Gray Hair Brown", category: "hair-style", prompt: `Naturally cover all gray and white hair on the head with a rich natural dark brown color with realistic shine, so no gray strands remain visible. ${HAIR_COLOR_RULE}` },
  { label: "Even Hair Color", category: "hair-style", prompt: `Make the hair color on the head even and consistent from root to tip by removing patchy, faded, sun-bleached, two-tone or uneven areas, while keeping the person's overall natural hair shade (do not change it to a different color). ${HAIR_COLOR_RULE}` },

  // ===== Forehead & Hairline (new) =====
  { label: "Remove Forehead Wrinkles", category: "portrait-skin", prompt: "Remove the forehead wrinkles: the horizontal creases across the forehead and the vertical frown lines between the eyebrows, so the forehead looks clean, smooth and relaxed. Keep realistic fine skin pores and natural skin texture (never airbrushed, waxy or plastic), the natural forehead shape, the original hairline and eyebrows, and the same skin tone. Keep moles, scars and birthmarks unchanged." },
  { label: "Reduce Forehead Shine", category: "portrait-skin", prompt: "Reduce oily shine and hotspots on the forehead so it matches the rest of the face, while keeping natural skin highlights, texture and the original forehead shape and hairline." },
  { label: "Clean Hairline", category: "portrait-skin", prompt: "Neaten the hairline along the forehead and temples by removing fuzz, stray and flyaway hairs while keeping the original hairline shape, position and density natural. Do not move the hairline or change the hairstyle." },

  // ===== Eyebrows (new) =====
  { label: "Thick Eyebrows", category: "eyes-details", prompt: `Make the eyebrows naturally fuller and thicker, with dense, well-groomed, neatly shaped hairs, keeping the person's natural brow position and a natural arch. ${BROW_RULE}` },
  { label: "Thin Eyebrows", category: "eyes-details", prompt: `Make the eyebrows naturally slimmer and finer, neatly groomed with clean edges, keeping the person's natural brow position and a natural arch, and not over-thin or pencil-drawn. ${BROW_RULE}` },
  { label: "Arched Eyebrows", category: "eyes-details", prompt: `Shape the eyebrows with a soft, elegant, natural arch, with the highest point about two-thirds along the brow and a gently tapering tail, at a medium thickness. ${BROW_RULE}` },
  { label: "Straight Eyebrows", category: "eyes-details", prompt: `Shape the eyebrows as soft, flat, nearly straight brows with only a very slight natural angle, at a medium thickness with a gently tapered end. ${BROW_RULE}` },
  { label: "Soft Curved Eyebrows", category: "eyes-details", prompt: `Shape the eyebrows as softly rounded, gently curved brows with no sharp corner or angle, at a medium thickness with a gently tapered end. ${BROW_RULE}` },
  { label: "Fill Sparse Eyebrows", category: "eyes-details", prompt: `Fill in thin, sparse, patchy or faded eyebrow areas with fine, natural-looking individual hairs in the same color, so the brows look complete and even while keeping the person's own brow shape and position. ${BROW_RULE}` },
  { label: "Even Eyebrows", category: "eyes-details", prompt: `Make the two eyebrows symmetrical and balanced: equal height, length, thickness and angle on the left and right, with tidy edges, while keeping the person's natural brow style and color. ${BROW_RULE}` },
  { label: "Trim Bushy Eyebrows", category: "eyes-details", prompt: `Neatly trim and tidy bushy, overgrown or unruly eyebrows into a clean, well-groomed shape by removing stray hairs above and below the brow line, keeping the natural brow shape, thickness and color. ${BROW_RULE}` },
  { label: "Black Eyebrow Color", category: "eyes-details", prompt: `Recolor the eyebrows to a natural deep black with fine natural hair detail. ${BROW_COLOR_RULE}` },
  { label: "Dark Brown Eyebrow Color", category: "eyes-details", prompt: `Recolor the eyebrows to a natural deep dark brown with fine natural hair detail. ${BROW_COLOR_RULE}` },
  { label: "Cover Gray Eyebrows", category: "eyes-details", prompt: `Naturally cover gray and white eyebrow hairs with a natural black or very dark brown color so the brows look uniformly dark. ${BROW_COLOR_RULE}` },
  { label: "Match Eyebrows to Hair", category: "eyes-details", prompt: `Recolor the eyebrows to match the final color of the hair on the head (including any hair color edit requested), keeping a natural, slightly softer tone than the hair. ${BROW_COLOR_RULE}` },

  // ===== Eyes (new) =====
  { label: "Soften Eye Bags", category: "eyes-details", prompt: "Gently soften puffiness and bags under the eyes and the shadow they cast, so the eye area looks fresh and rested, while keeping natural eye contours, the eye shape, realistic skin texture and the person's apparent age." },

  // ===== Ears (new) =====
  { label: "Match Ear Skin Tone", category: "portrait-skin", prompt: "Make the skin color and brightness of both ears match the face and neck, removing dark, dull or uneven patches on the ears, while keeping the exact ear shape, size and position and realistic skin texture." },
  { label: "Reduce Ear Redness", category: "portrait-skin", prompt: "Gently reduce temporary redness or irritation on the ears so they blend naturally with the face and neck, keeping the exact ear shape and size, natural skin texture and any piercings or marks unchanged." },
  { label: "Tidy Ear Hair", category: "portrait-skin", prompt: "Neatly remove stray fuzz and fine hairs on and around the ears so they look clean, while keeping the ear shape and size, the hairstyle and the sideburns unchanged." },

  // ===== Nose (new) =====
  { label: "Reduce Nose Shine", category: "portrait-skin", prompt: "Reduce oily shine on the nose and nose tip while keeping natural skin highlights, texture and the exact nose shape and size." },
  { label: "Reduce Nose Redness", category: "portrait-skin", prompt: "Gently reduce temporary redness or irritation around the nose and nostrils so it blends with the rest of the face, keeping the exact nose shape and size and natural skin texture." },

  // ===== Cheeks (new) =====
  { label: "Natural Cheek Blush", category: "portrait-skin", prompt: "Add a very subtle, healthy natural warmth to the cheeks that suits the person's skin tone, soft and evenly blended, without visible makeup, while keeping the cheek shape, face structure and realistic skin texture unchanged." },
  { label: "Reduce Cheek Redness", category: "portrait-skin", prompt: "Gently reduce blotchy or excessive redness on the cheeks so the cheek color is even and healthy, while keeping the cheek shape, natural skin texture and any freckles, moles or marks unchanged." },

  // ===== Lips (new) =====
  { label: "Natural Lip Color", category: "portrait-skin", prompt: "Even out the lip color into a healthy, natural tone that suits the person's skin, removing dryness, dark patches and uneven pigmentation, while keeping the exact lip shape, teeth and expression unchanged. Do not add visible lipstick." },

  // ===== Beard & Mustache style / size (new) =====
  { label: "Clean Shave", category: "eyes-details", prompt: "Make the person clean-shaven: completely remove all beard, mustache, stubble and beard-side sideburn growth, leaving smooth, natural, evenly lit skin with realistic skin texture on the cheeks, jaw, chin and upper lip, and no gray stubble shadow. Keep the jawline, chin shape, lips, teeth, hair on the head, eyebrows and expression exactly unchanged. If the person wears a niqab or other face covering, ignore this edit." },
  { label: "Light Stubble", category: "eyes-details", prompt: `Give the person a very short, even light stubble (about 1 to 2 mm long, a faint five-o'clock shadow) over the cheeks, jaw, chin and upper lip with a clean natural cheek line and neck line, and visible skin showing through. ${BEARD_RULE}` },
  { label: "Short Beard", category: "eyes-details", prompt: `Give the person a short, neatly trimmed full beard about 5 mm long (close to the face), covering the cheeks, jaw, chin and upper lip evenly with a clean sharp cheek line and a clean neck line. ${BEARD_RULE}` },
  { label: "Medium Beard", category: "eyes-details", prompt: `Give the person a medium-length, well-groomed full beard about 1.5 cm long, covering the cheeks, jaw, chin and upper lip, with soft natural volume, a defined cheek line and a clean neck line. ${BEARD_RULE}` },
  { label: "Full Beard", category: "eyes-details", prompt: `Give the person a thick, full, well-groomed beard about 3 cm long with a full mustache joining the beard, dense and even over the cheeks, jaw and chin, with a neat defined cheek line and the beard ending at the jaw and chin area (not hanging onto the chest). ${BEARD_RULE}` },
  { label: "Long Beard", category: "eyes-details", prompt: `Give the person a long, full, neatly combed beard extending clearly below the chin (about 8 to 10 cm), with a full mustache, natural soft strands and a tidy shape, keeping the mouth visible and the beard inside the frame. ${BEARD_RULE}` },
  { label: "Goatee", category: "eyes-details", prompt: `Give the person a neat goatee: a mustache joined with a beard patch on the chin only, with clean-shaven cheeks and jaw. ${BEARD_RULE}` },
  { label: "Chin Strap Beard", category: "eyes-details", prompt: `Give the person a thin, sharply lined chin-strap beard: a narrow, neat band of facial hair following the jawline from the sideburns to the chin, with clean-shaven cheeks and no mustache. ${BEARD_RULE}` },
  { label: "Circle Beard", category: "eyes-details", prompt: `Give the person a neat circle beard: a mustache connected to a rounded chin beard forming a closed ring around the mouth, with clean-shaven cheeks and jaw. ${BEARD_RULE}` },
  { label: "Van Dyke Beard", category: "eyes-details", prompt: `Give the person a Van Dyke beard: a groomed mustache that is separate from a pointed chin beard, with clean-shaven cheeks and jaw. ${BEARD_RULE}` },
  { label: "Mustache Only", category: "eyes-details", prompt: `Give the person a neat, well-groomed mustache only (natural medium thickness, tidy ends, not covering the lips), with a completely clean-shaven chin, cheeks and jaw. ${BEARD_RULE}` },

  // ===== Beard Color (new) =====
  { label: "Black Beard Color", category: "eyes-details", prompt: `Recolor the beard and mustache to a natural deep black with realistic shine and natural strand variation. ${BEARD_COLOR_RULE}` },
  { label: "Dark Brown Beard Color", category: "eyes-details", prompt: `Recolor the beard and mustache to a natural deep dark brown with realistic shine and natural strand variation. ${BEARD_COLOR_RULE}` },
  { label: "Brown Beard Color", category: "eyes-details", prompt: `Recolor the beard and mustache to a natural medium chestnut brown with soft natural highlights and strand variation. ${BEARD_COLOR_RULE}` },
  { label: "Cover Gray Beard", category: "eyes-details", prompt: `Naturally cover all gray and white hair in the beard and mustache with a rich natural black (or very dark brown) color with realistic shine, so no gray or white strands remain visible. ${BEARD_COLOR_RULE}` },
  { label: "Silver Gray Beard Color", category: "eyes-details", prompt: `Recolor the beard and mustache to a clean, natural silver-gray with soft light-gray and white highlights, looking like real mature gray facial hair. ${BEARD_COLOR_RULE}` },
  { label: "White Beard Color", category: "eyes-details", prompt: `Recolor the beard and mustache to natural white with very soft light-gray shading so it keeps depth and strand detail and does not look like a flat white shape. ${BEARD_COLOR_RULE}` },
  { label: "Match Beard to Hair Color", category: "eyes-details", prompt: `Recolor the beard and mustache to match the final color of the hair on the head (including any hair color edit requested), with a natural, very slightly lighter or softer tone, so the head hair and the facial hair look consistent. ${BEARD_COLOR_RULE}` },
  { label: "Even Beard Color", category: "eyes-details", prompt: `Make the beard and mustache color even and consistent by removing patchy gray, faded, two-tone or uneven areas, while keeping the person's overall natural facial-hair shade (do not change it to a different color). ${BEARD_COLOR_RULE}` },
];

/**
 * Display order, top of the head -> chin. Edit these lists to re-order the UI.
 * Anything not listed here (lighting, quality, restoration, background, ID,
 * creative finish) keeps its original order and follows after these groups.
 */
const FACE_ORDER: Array<[string, string[]]> = [
  ["hair-style", [
    "Neat Short Haircut", "Side Part Hair", "Slick Back Hair", "Crew Cut", "Buzz Cut", "Textured Quiff", "Taper Fade",
    "Long Straight Hair", "Long Wavy Hair", "Shoulder-Length Bob", "Pixie Cut", "Low Bun", "High Ponytail", "Side Braid",
    "Curtain Bangs", "Curly Hair", "Tame Stray Hair",
  ]],
  ["hair-color", [
    "Black Hair Color", "Dark Brown Hair Color", "Brown Hair Color", "Auburn Hair Color", "Dark Blonde Hair Color",
    "Silver Gray Hair Color", "White Hair Color", "Cover Gray Hair", "Cover Gray Hair Brown", "Even Hair Color",
  ]],
  ["forehead", ["Clean Hairline", "Remove Forehead Wrinkles", "Reduce Forehead Shine"]],
  ["eyebrows", [
    "Enhance Eyebrows", "Thick Eyebrows", "Thin Eyebrows", "Arched Eyebrows", "Straight Eyebrows", "Soft Curved Eyebrows",
    "Fill Sparse Eyebrows", "Even Eyebrows", "Trim Bushy Eyebrows", "Black Eyebrow Color", "Dark Brown Eyebrow Color",
    "Cover Gray Eyebrows", "Match Eyebrows to Hair",
  ]],
  ["eyes-details", [
    "Brighten Eyes", "Sharpen Eye Details", "Reduce Red Eyes", "Reduce Dark Circles", "Soften Eye Bags", "Align Eye Line",
    "Keep Original Glasses", "Reduce Glasses Glare",
  ]],
  ["ears", ["Match Ear Skin Tone", "Reduce Ear Redness", "Tidy Ear Hair"]],
  ["nose", ["Reduce Nose Shine", "Reduce Nose Redness"]],
  ["cheeks", ["Natural Cheek Blush", "Reduce Cheek Redness"]],
  ["lips-teeth", ["Lipstick", "Natural Lip Color", "Whiten Teeth Naturally", "Preserve Natural Expression"]],
  ["beard-style", [
    "Clean Shave", "Light Stubble", "Short Beard", "Medium Beard", "Full Beard", "Long Beard", "Goatee", "Chin Strap Beard",
    "Circle Beard", "Van Dyke Beard", "Mustache Only", "Tidy Facial Hair", "Define Beard & Mustache",
  ]],
  ["beard-color", [
    "Black Beard Color", "Dark Brown Beard Color", "Brown Beard Color", "Cover Gray Beard", "Silver Gray Beard Color",
    "White Beard Color", "Match Beard to Hair Color", "Even Beard Color",
  ]],
  ["portrait-skin", [
    "Fair & Bright Skin", "Glow & Makeup", "Smooth Skin", "Remove Blemishes", "Remove All Facial Marks", "Even Skin Tone", "Reduce Facial Shine",
    "Reduce Temporary Redness", "Soften Fine Lines", "Preserve Skin Texture", "Keep Marks", "Refine Makeup", "Remove Makeup",
    "Restore Facial Details",
  ]],
  ["head-pose", ["Studio Straight Pose", "Straighten Tilted Photo", "Straighten Head"]],
];

const RAW_BY_LABEL: Record<string, EditingGuidePreset> = Object.fromEntries(
  RAW_GUIDES.map((guide) => [guide.label, guide]),
);
const PLACED_LABELS = new Set<string>();
const FACE_GUIDES: EditingGuidePreset[] = FACE_ORDER.flatMap(([category, labels]) =>
  labels.flatMap((label) => {
    const guide = RAW_BY_LABEL[label];
    if (!guide || PLACED_LABELS.has(label)) return [];
    PLACED_LABELS.add(label);
    return [{ ...guide, category }];
  }),
);

export const EDITING_GUIDES: EditingGuidePreset[] = [
  ...FACE_GUIDES,
  ...RAW_GUIDES.filter((guide) => !PLACED_LABELS.has(guide.label)),
];

export const EDITING_GUIDE_PROMPTS: Record<string, string> = Object.fromEntries(
  EDITING_GUIDES.map(({ label, prompt }) => [label, prompt]),
);

const LOOK_GROUP = [
  "Soft Vintage Film Look",
  "Black & White Portrait",
  "Cinematic Color Grade",
  "Warm Classic Portrait",
  "Cool Modern Portrait",
  "Rich Natural Colors",
  "Colorize Black & White Photo",
];

export const EDITING_GUIDE_META: Record<string, EditingGuideMeta> = {
  // Rules to honour, not edits
  "Keep Marks": { constraint: true, conflictsWith: ["Remove All Facial Marks"] },
  "Remove All Facial Marks": { conflictsWith: ["Keep Marks", "Remove Blemishes"] },
  "Preserve Skin Texture": { constraint: true },
  "Preserve Natural Expression": { constraint: true },
  "Keep Original Glasses": { constraint: true },

  // Makeup: removing it cannot be combined with adding/refining it
  "Remove Makeup": { conflictsWith: ["Glow & Makeup", "Refine Makeup", "Lipstick"] },
  "Refine Makeup": { conflictsWith: ["Remove Makeup"] },
  "Glow & Makeup": { conflictsWith: ["Remove Makeup"] },
  "Lipstick": { conflictsWith: ["Remove Makeup"] },

  // Pose
  "Studio Straight Pose": { changesPose: true, conflictsWith: ["Straighten Head", "Straighten Tilted Photo", "Align Eye Line"] },
  "Straighten Head": { changesPose: true },
  "Straighten Tilted Photo": { changesPose: true },
  "Align Eye Line": { changesPose: true },

  // Background-touching presets
  "Clean Background": { altersBackground: true },
  "Remove Background Distractions": { altersBackground: true },
  "Smooth Background": { altersBackground: true },
  "Clean ID Photo Background": { altersBackground: true },
  "Neutral Background Cleanup": { altersBackground: true },
  "Extend Image Edges": { altersBackground: true },
  "Rebuild Damaged Edges": { altersBackground: true },

  // Color / tone looks (only one "look" at a time; the latest selection wins)
  "Soft Vintage Film Look": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast", "Remove Yellowing"] },
  "Black & White Portrait": { changesColor: true, monochrome: true, conflictsWith: LOOK_GROUP },
  "Cinematic Color Grade": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast"] },
  "Warm Classic Portrait": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast"] },
  "Cool Modern Portrait": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast"] },
  "Rich Natural Colors": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast"] },
  "Colorize Black & White Photo": { changesColor: true, conflictsWith: [...LOOK_GROUP, "Improve Black & White Contrast"] },
  "Improve Black & White Contrast": { monochrome: true, conflictsWith: LOOK_GROUP.filter((l) => l !== "Black & White Portrait") },
  "Correct White Balance": { changesColor: true },
  "Natural Color Correction": { changesColor: true },
  "Remove Color Cast": { changesColor: true },
  "Remove Yellowing": { changesColor: true, conflictsWith: ["Soft Vintage Film Look"] },
  "Restore Faded Photo": { changesColor: true },

  // Light / texture opposites
  "High-Key Studio Look": { conflictsWith: ["Low-Key Studio Look"] },
  "Low-Key Studio Look": {
    conflictsWith: ["High-Key Studio Look", "Brighten Image", "Fix Underexposure", "Brighten Face Shadows", "Even Face Lighting", "Reduce Harsh Shadows"],
  },
  "Brighten Image": { conflictsWith: ["Low-Key Studio Look"] },
  "Fix Underexposure": { conflictsWith: ["Low-Key Studio Look"] },
  "Brighten Face Shadows": { conflictsWith: ["Low-Key Studio Look"] },
  "Even Face Lighting": { conflictsWith: ["Low-Key Studio Look"] },
  "Reduce Harsh Shadows": { conflictsWith: ["Low-Key Studio Look"] },
  "Subtle Film Grain": { conflictsWith: ["Reduce Image Noise"] },
  "Reduce Image Noise": { conflictsWith: ["Subtle Film Grain"] },
};

/**
 * Marks a group of presets as mutually exclusive: only one of them can be
 * active at a time (the one selected LAST wins, see planEditingGuides).
 */
function exclusive(labels: string[]) {
  for (const label of labels) {
    const previous = EDITING_GUIDE_META[label]?.conflictsWith ?? [];
    EDITING_GUIDE_META[label] = {
      ...EDITING_GUIDE_META[label],
      conflictsWith: Array.from(new Set([...previous, ...labels.filter((other) => other !== label)])),
    };
  }
}
/** Every label in `a` conflicts with every label in `b`. */
function crossConflict(a: string[], b: string[]) {
  for (const label of a) {
    const previous = EDITING_GUIDE_META[label]?.conflictsWith ?? [];
    EDITING_GUIDE_META[label] = {
      ...EDITING_GUIDE_META[label],
      conflictsWith: Array.from(new Set([...previous, ...b.filter((other) => other !== label)])),
    };
  }
}

// Hair styles: only one hair style at a time (the latest selection wins).
const HAIR_STYLE_LABELS = ["Neat Short Haircut", "Side Part Hair", "Slick Back Hair", "Crew Cut", "Buzz Cut", "Textured Quiff", "Taper Fade", "Long Straight Hair", "Long Wavy Hair", "Shoulder-Length Bob", "Pixie Cut", "Low Bun", "High Ponytail", "Side Braid", "Curtain Bangs", "Curly Hair"];
exclusive(HAIR_STYLE_LABELS);

// Hair colors: only one hair color at a time; any hair color can combine with any hair style.
const HAIR_COLOR_LABELS = ["Black Hair Color", "Dark Brown Hair Color", "Brown Hair Color", "Auburn Hair Color", "Dark Blonde Hair Color", "Silver Gray Hair Color", "White Hair Color", "Cover Gray Hair", "Cover Gray Hair Brown", "Even Hair Color"];
exclusive(HAIR_COLOR_LABELS);

// Eyebrows: one shape at a time, one color at a time; shape and color can combine.
const BROW_SHAPE_LABELS = ["Enhance Eyebrows", "Thick Eyebrows", "Thin Eyebrows", "Arched Eyebrows", "Straight Eyebrows", "Soft Curved Eyebrows", "Fill Sparse Eyebrows", "Even Eyebrows", "Trim Bushy Eyebrows"];
const BROW_COLOR_LABELS = ["Black Eyebrow Color", "Dark Brown Eyebrow Color", "Cover Gray Eyebrows", "Match Eyebrows to Hair"];
exclusive(BROW_SHAPE_LABELS);
exclusive(BROW_COLOR_LABELS);

// Beard: one style/size at a time, one color at a time; style and color can combine.
const BEARD_STYLE_LABELS = ["Clean Shave", "Light Stubble", "Short Beard", "Medium Beard", "Full Beard", "Long Beard", "Goatee", "Chin Strap Beard", "Circle Beard", "Van Dyke Beard", "Mustache Only"];
const BEARD_COLOR_LABELS = ["Black Beard Color", "Dark Brown Beard Color", "Brown Beard Color", "Cover Gray Beard", "Silver Gray Beard Color", "White Beard Color", "Match Beard to Hair Color", "Even Beard Color"];
const BEARD_TIDY_LABELS = ["Tidy Facial Hair", "Define Beard & Mustache"];
exclusive(BEARD_STYLE_LABELS);
exclusive(BEARD_COLOR_LABELS);
// Tidying keeps the current style, so it cannot be combined with choosing a new style.
crossConflict(BEARD_TIDY_LABELS, BEARD_STYLE_LABELS);
crossConflict(BEARD_STYLE_LABELS, BEARD_TIDY_LABELS);
// A clean shave leaves no beard to recolor or tidy.
crossConflict(["Clean Shave"], [...BEARD_COLOR_LABELS, ...BEARD_TIDY_LABELS]);
crossConflict([...BEARD_COLOR_LABELS, ...BEARD_TIDY_LABELS], ["Clean Shave"]);

/** Applies to the whole image (not just the face), so "keep the background untouched" must be relaxed. */
const GLOBAL_CATEGORIES = new Set(["lighting-color", "image-quality", "old-photo", "creative-finish"]);

/** Order in which edits are applied: repair first, stylistic finish last. */
const CATEGORY_ORDER: Record<string, number> = {
  "old-photo": 0,
  "image-quality": 1,
  "lighting-color": 2,
  "portrait-skin": 3,
  forehead: 3.1,
  cheeks: 3.2,
  nose: 3.3,
  ears: 3.4,
  "lips-teeth": 3.5,
  "eyes-details": 4,
  eyebrows: 4.1,
  "head-pose": 4.2,
  // The beard shape is built first, then recolored.
  "beard-style": 4.3,
  "beard-color": 4.35,
  // The hairstyle is built first, then recolored.
  "hair-style": 4.5,
  "hair-color": 4.6,
  "background-composition": 5,
  "id-studio": 6,
  "creative-finish": 7,
};

/**
 * Edits that are already applied to EVERY photo by the backend prompt (see buildStandardFinishRule), because
 * they are right for ~90% of portraits. They are not offered as tiles / wizard options any more; the full
 * library still lists them. Only situational edits (hair, beard, fairer skin, marks...) stay as choices.
 */
export const AUTO_APPLIED_GUIDES: string[] = [
  "Smooth Skin", "Remove Blemishes", "Even Skin Tone", "Reduce Dark Circles", "Reduce Facial Shine",
  "Natural Professional Retouch", "Brighten Eyes", "Tame Stray Hair", "Whiten Teeth Naturally",
  "Straighten Tilted Photo", "Straighten Head", "Brighten Image", "Remove All Facial Marks",
];

/**
 * The standard finish added to every request. `skip*` flags stop it fighting a look the user picked on purpose.
 */
export function buildStandardFinishRule(plan: EditingGuidePlan, opts: { sized: boolean }): string {
  const labels = new Set(plan.appliedLabels);
  const marksRule = labels.has("Keep Marks")
    ? ""
    : " The face must be completely free of marks: remove moles, dark spots, freckles, age spots, pigmentation patches, scars and any rough or uneven patches from the forehead, cheeks, nose, chin, jaw, neck and ears, rebuilding the skin underneath with realistic pores and the same skin color, so there is not a single visible mark and the face looks perfectly clean at first glance (the face structure, beard and eyebrows themselves never change).";
  const parts = [
    `STANDARD FINISH (always applied, no need to be asked): (a) the whole face, neck and ears are completely clean, clear and even (no dirt-looking patches, spots, acne marks, oily shine or dark circles under the eyes), ${plan.skinTone ? "in the chosen skin color described in the skin rule" : "in the person's own skin color"};${marksRule}`+" (b) the eyes are clear, bright and sharp with natural whites, and the eye color is unchanged; (c) stray, flyaway and fuzzy hairs around the head are neatly tidied without changing the hairstyle; (d) teeth, if visible, look natural and clean, never artificially white"+(plan.expression === "Big Smile" ? " (the requested smile may show them)" : "")+"; (e) the face is evenly lit and sharp with natural, realistic detail.",
  ];
  const customSkin = Boolean(plan.skinTone) || labels.has("Fair & Bright Skin");
  parts.push(
    customSkin
      ? "SKIN (important): apply the requested skin color or brightness edit below exactly as described, with no greasy shine, no gloss and no plastic or AI look; keep real pores and natural skin texture."
      : "SKIN AND FACE LOCK (important): keep the skin color, skin tone, brightness and the whole face EXACTLY the same as in the original photo. Do NOT lighten, brighten, whiten, darken, tan or tint the skin, and add NO glow, NO shine, NO gloss, NO glossy highlights and NO beauty-filter look. The skin must look natural and real, exactly like the original photo, only cleaner (spotless and even). Never make it fairer, glossy, airbrushed, waxy, plastic or AI-like.",
  );
  if (!labels.has("Low-Key Studio Look") && !plan.flags.monochrome) {
    parts.push(`Exposure: correct dull or underexposed lighting so the face is clearly and evenly lit, without making it flat or overexposed${plan.skinTone ? "" : ", and without changing the skin color"}.`);
  }
  if (opts.sized && !plan.flags.posePreset) {
    parts.push("Pose: if the head or photo is tilted, straighten it so the head is upright and the eyes are level, keeping the face identical.");
  }
  return parts.join(" ");
}

const CUSTOM_PREFIX = "Custom Instruction:";

/**
 * Optional colour for the "Lipstick" preset. It travels in the same selected-guides list as an entry
 * like "Lipstick Color: Red"; it is never a tile of its own and is ignored unless "Lipstick" is selected.
 */
export const LIPSTICK_COLOR_PREFIX = "Lipstick Color:";
export const LIPSTICK_COLORS: { name: string; bn: string; hex: string; prompt: string }[] = [
  { name: "Natural Pink", bn: "হালকা গোলাপি", hex: "#E7A1A9", prompt: "soft natural pink" },
  { name: "Nude", bn: "নিউড", hex: "#D4A08A", prompt: "natural nude beige-pink" },
  { name: "Peach", bn: "পিচ", hex: "#F2A488", prompt: "soft peach" },
  { name: "Coral", bn: "কোরাল", hex: "#F26B5B", prompt: "coral" },
  { name: "Rose", bn: "রোজ", hex: "#D6567A", prompt: "rose pink" },
  { name: "Red", bn: "লাল", hex: "#C8102E", prompt: "classic red" },
  { name: "Dark Red", bn: "গাঢ় লাল", hex: "#8B1A2B", prompt: "deep dark red" },
  { name: "Maroon", bn: "মেরুন", hex: "#6D1F2F", prompt: "maroon" },
  { name: "Brown", bn: "বাদামি", hex: "#8B4A3A", prompt: "warm brown" },
  { name: "Plum", bn: "প্লাম", hex: "#7E2F6B", prompt: "plum purple" },
];
const GUIDE_BY_LABEL: Record<string, EditingGuidePreset> = Object.fromEntries(
  EDITING_GUIDES.map((guide) => [guide.label, guide]),
);

export interface EditingGuidePlanContext {
  /** Text that replaces {background} inside presets that talk about the backdrop. */
  backgroundRef: string;
  /** "left" / "right" when this image is half of a dual generation. */
  side?: string;
}

export interface EditingGuidePlan {
  edits: string[];
  constraints: string[];
  customInstruction: string;
  /** Skin color picked by the user ("" = keep the photo's own color). */
  skinTone: string;
  /** Necktie choice: "" = style default, "None" = no tie, otherwise a TIE_COLORS name. */
  tie: string;
  /** Expression picked by the user ("" = no choice, otherwise an EXPRESSIONS name). */
  expression: string;
  /** Presets that survived conflict resolution, in application order. */
  appliedLabels: string[];
  flags: {
    restoration: boolean;
    colorChange: boolean;
    monochrome: boolean;
    alteringBackground: boolean;
    wholeImage: boolean;
    posePreset: boolean;
  };
}

/**
 * Turns the user's selected guide labels into clean, non-conflicting prompt text.
 * - unknown/duplicate labels are ignored
 * - if two presets cannot coexist, the one selected LAST wins
 * - edits are ordered: restoration -> quality -> lighting -> retouch -> composition -> finish
 */
export function planEditingGuides(
  selected: string[],
  context: EditingGuidePlanContext,
): EditingGuidePlan {
  let customInstruction = "";
  let lipstickColor = "";
  let skinTone = "";
  let tie = "";
  let expression = "";
  const presets: string[] = [];
  for (const entry of selected) {
    if (typeof entry !== "string") continue;
    if (entry.startsWith(LIPSTICK_COLOR_PREFIX)) {
      lipstickColor = entry.slice(LIPSTICK_COLOR_PREFIX.length).trim();
      continue;
    }
    if (entry.startsWith(TIE_PREFIX)) {
      const name = entry.slice(TIE_PREFIX.length).trim();
      tie = name === "None" || TIE_COLORS.some((c) => c.name === name) ? name : "";
      continue;
    }
    if (entry.startsWith(SKIN_TONE_PREFIX)) {
      const name = entry.slice(SKIN_TONE_PREFIX.length).trim();
      skinTone = SKIN_TONES.some((tone) => tone.name === name) ? name : "";
      continue;
    }
    if (entry.startsWith(EXPRESSION_PREFIX)) {
      const name = entry.slice(EXPRESSION_PREFIX.length).trim();
      expression = EXPRESSIONS.some((item) => item.name === name) ? name : "";
      continue;
    }
    if (entry.startsWith(CUSTOM_PREFIX)) {
      const text = entry.slice(CUSTOM_PREFIX.length).trim();
      if (text) customInstruction = text;
      continue;
    }
    if (!GUIDE_BY_LABEL[entry]) continue;
    const existing = presets.indexOf(entry);
    if (existing !== -1) presets.splice(existing, 1);
    presets.push(entry);
  }

  // Conflict resolution: walk from the newest selection backwards.
  const kept: string[] = [];
  for (let i = presets.length - 1; i >= 0; i--) {
    const label = presets[i];
    const clashes = kept.some((other) => {
      return (
        EDITING_GUIDE_META[label]?.conflictsWith?.includes(other) ||
        EDITING_GUIDE_META[other]?.conflictsWith?.includes(label)
      );
    });
    if (!clashes) kept.unshift(label);
  }
  // A chosen skin color decides the complexion, so the generic "make fairer" preset cannot also apply.
  if (skinTone) {
    const index = kept.indexOf("Fair & Bright Skin");
    if (index !== -1) kept.splice(index, 1);
  }

  // A chosen expression decides the face's expression, so the generic "keep the original expression" rule cannot also apply.
  if (expressionChangesFace(expression)) {
    const index = kept.indexOf("Preserve Natural Expression");
    if (index !== -1) kept.splice(index, 1);
  }

  const ordered = kept
    .map((label, index) => ({ label, index }))
    .sort((a, b) => {
      const ra = CATEGORY_ORDER[GUIDE_BY_LABEL[a.label].category] ?? 99;
      const rb = CATEGORY_ORDER[GUIDE_BY_LABEL[b.label].category] ?? 99;
      return ra - rb || a.index - b.index;
    })
    .map((item) => item.label);

  const isDual = context.side === "left" || context.side === "right";
  const edits: string[] = [];
  const constraints: string[] = [];
  for (const label of ordered) {
    const preset = GUIDE_BY_LABEL[label];
    const meta = EDITING_GUIDE_META[label] ?? {};
    let text = isDual && meta.dualPrompt ? meta.dualPrompt : preset.prompt;
    if (label === "Lipstick") {
      const chosen = LIPSTICK_COLORS.find((c) => c.name === lipstickColor);
      if (chosen) {
        text = `Apply neat, natural-looking ${chosen.prompt} lipstick evenly and cleanly within the natural lip line, with a realistic soft finish. Preserve the original lip shape, teeth, expression, facial identity, and realistic lip texture.`;
      }
    }
    text = text.replace(/\{background\}/g, context.backgroundRef);
    (meta.constraint ? constraints : edits).push(`${label}: ${text}`);
  }

  const has = (predicate: (meta: EditingGuideMeta, preset: EditingGuidePreset) => boolean) =>
    ordered.some((label) => predicate(EDITING_GUIDE_META[label] ?? {}, GUIDE_BY_LABEL[label]));

  return {
    edits,
    constraints,
    customInstruction,
    skinTone,
    tie,
    expression,
    appliedLabels: ordered,
    flags: {
      restoration: has((_, preset) => preset.category === "old-photo"),
      colorChange: has((meta) => Boolean(meta.changesColor)),
      monochrome: has((meta) => Boolean(meta.monochrome)),
      alteringBackground: has((meta) => Boolean(meta.altersBackground)),
      wholeImage: has((_, preset) => GLOBAL_CATEGORIES.has(preset.category)),
      posePreset: has((meta) => Boolean(meta.changesPose)),
    },
  };
}
