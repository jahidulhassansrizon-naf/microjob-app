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

export const EDITING_GUIDE_CATEGORIES = [
  { id: "all", label: "All categories" },
  { id: "portrait-skin", label: "Portrait & Skin" },
  { id: "eyes-details", label: "Eyes & Facial Details" },
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
  "Glow & Makeup": WandSparkles,
  "Smooth Skin": Droplets,
  "Remove Blemishes": Eraser,
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
  "Straighten Head": ScanFace,
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

export const EDITING_GUIDES: EditingGuidePreset[] = [
  // Portrait & Skin (12)
  { label: "Glow & Makeup", category: "portrait-skin", prompt: "Add a subtle, polished grooming touch and a healthy natural glow: even-looking skin and soft, natural-looking makeup where it suits the person. Keep it realistic, age-appropriate, and consistent with the person's identity; do not change facial structure, eye shape, or skin color." },
  { label: "Smooth Skin", category: "portrait-skin", prompt: "Reduce temporary blemishes and unevenness while preserving pores, natural skin texture, fine detail, and the person's real complexion. Avoid plastic or airbrushed skin." },
  { label: "Remove Blemishes", category: "portrait-skin", prompt: "Remove temporary pimples and small transient blemishes only. Preserve freckles, moles, scars, birthmarks, and other stable identifying marks." },
  { label: "Even Skin Tone", category: "portrait-skin", prompt: "Gently even out patchy skin tone without changing the person's natural complexion, ethnicity, undertones, or facial structure." },
  { label: "Reduce Dark Circles", category: "portrait-skin", prompt: "Subtly reduce under-eye darkness and tired-looking shadows while keeping natural eye contours and realistic skin texture." },
  { label: "Reduce Facial Shine", category: "portrait-skin", prompt: "Reduce distracting oily shine on the forehead, nose, and cheeks while retaining natural skin highlights and realistic texture." },
  { label: "Preserve Skin Texture", category: "portrait-skin", prompt: "Retain realistic pores, fine lines, and skin texture. Avoid excessive smoothing, waxy skin, or artificial beauty-filter effects." },
  { label: "Reduce Temporary Redness", category: "portrait-skin", prompt: "Gently reduce temporary irritation or blotchy redness while preserving natural lip color, undertones, and any meaningful skin marks." },
  { label: "Soften Fine Lines", category: "portrait-skin", prompt: "Slightly soften temporary-looking fine lines without changing age, facial shape, expression, or natural skin character." },
  { label: "Refine Makeup", category: "portrait-skin", prompt: "Refine existing makeup with subtle, clean blending and natural color balance. Do not add dramatic makeup or change facial identity." },
  { label: "Remove Makeup", category: "portrait-skin", prompt: "Reduce visible cosmetic makeup (lipstick, eye makeup, heavy foundation) to a natural, minimally made-up appearance while keeping the person's face, lip shape, complexion, and features unchanged." },
  { label: "Lipstick", category: "portrait-skin", prompt: "Apply subtle, natural-looking lipstick in a flattering shade that suits the person's skin tone. Preserve the original lip shape, teeth, expression, facial identity, and realistic lip texture." },

  // Eyes & Facial Details (12)
  { label: "Straighten Head", category: "eyes-details", prompt: "Correct the head angle so the face is naturally upright and looking toward the camera, preserving facial proportions and a realistic neck and shoulder position." },
  { label: "Keep Marks", category: "eyes-details", prompt: "Preserve natural identifying marks such as freckles, moles, scars, birthmarks, and other stable facial details." },
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
  { label: "Passport Photo Polish", category: "id-studio", prompt: "Polish the portrait for passport-style presentation: natural facial detail, even exposure, centered framing, clear edges, and no beautification that changes identity." },
  { label: "Neutral Background Cleanup", category: "id-studio", prompt: "Make sure the background is a clean, evenly colored area ({background}) with no leftover scenery, fragments, or edge contamination around the subject." },
  { label: "Even Face Lighting", category: "id-studio", prompt: "Balance illumination across the face for a clear formal portrait, keeping natural facial depth and avoiding an unnaturally flat or overlit appearance." },
  { label: "Align Eye Line", category: "id-studio", prompt: "Gently align the eye line for a level, camera-facing portrait if the source angle permits, preserving the original eye shape and facial proportions." },
  { label: "Keep Original Glasses", category: "id-studio", prompt: "Preserve the person's existing glasses, including frame shape, color, placement, and lenses. Do not remove or replace them." },
  { label: "Reduce Glasses Glare", category: "id-studio", prompt: "Reduce reflections on eyeglass lenses where possible while preserving the original frames, lens transparency, eye shape, and gaze." },
  { label: "Natural Professional Retouch", category: "id-studio", prompt: "Apply restrained professional retouching only: correct minor lighting and temporary distractions while preserving skin texture, age, expression, and identity." },
  { label: "Clean Clothing Edges", category: "id-studio", prompt: "Neaten stray fibers and edge artifacts on the visible clothing without changing its selected style, color, fit, or fabric texture." },
  { label: "Refine Collar & Tie", category: "id-studio", prompt: "Neatly refine an existing shirt collar or tie so it looks tidy and realistic. Do not add a tie or change the selected clothing unless requested elsewhere." },
  { label: "Improve ID Photo Clarity", category: "id-studio", prompt: "Improve the clarity of the face, hair edges, and clothing for a formal identification-style portrait with realistic detail and balanced exposure. Keep the facial identity unchanged." },
  { label: "Consistent Dual Portraits", category: "id-studio", prompt: "Give this portrait a neutral, standard exposure, color balance, and professional finish so it matches other portraits edited the same way. Keep this person's own features unchanged." },

  // Creative Finish (12)
  { label: "Soft Vintage Film Look", category: "creative-finish", prompt: "Apply a subtle vintage film treatment with gentle contrast and restrained warm tones while keeping facial features and skin texture realistic." },
  { label: "Black & White Portrait", category: "creative-finish", prompt: "Convert the whole image to tasteful black and white with balanced tonal separation and detailed highlights and shadows. Keep the person recognizable and the facial details natural." },
  { label: "Cinematic Color Grade", category: "creative-finish", prompt: "Apply a restrained cinematic color grade with intentional tonal contrast while preserving believable skin tones and avoiding an artificial color cast." },
  { label: "Warm Classic Portrait", category: "creative-finish", prompt: "Apply a gentle warm color treatment reminiscent of a classic studio portrait while preserving natural complexion and realistic whites." },
  { label: "Cool Modern Portrait", category: "creative-finish", prompt: "Apply a subtle cool, contemporary color balance without turning skin gray or blue and without changing facial identity." },
  { label: "Matte Finish", category: "creative-finish", prompt: "Use a restrained matte tonal finish with slightly softened contrast, keeping details clear and avoiding washed-out skin or crushed shadows." },
  { label: "Subtle Film Grain", category: "creative-finish", prompt: "Add very fine, subtle film grain for a photographic finish. Keep it even and unobtrusive, with no coarse noise on the face." },
  { label: "High-Key Studio Look", category: "creative-finish", prompt: "Create a bright, high-key studio lighting look with soft shadows and clean highlights while preserving skin detail and natural facial contours." },
  { label: "Low-Key Studio Look", category: "creative-finish", prompt: "Create a controlled low-key studio look with deeper but detailed shadows and gentle directional light, keeping the face clearly visible." },
  { label: "Soft Glow Finish", category: "creative-finish", prompt: "Add a restrained soft glow to bright areas while preserving edge clarity, skin texture, natural contrast, and realistic facial details." },
  { label: "Rich Natural Colors", category: "creative-finish", prompt: "Give colors a little more richness and depth while keeping skin tones believable and avoiding neon saturation or color clipping." },
  { label: "Minimalist Portrait Finish", category: "creative-finish", prompt: "Use a clean, restrained, distraction-free portrait finish with simple tones and realistic detail, avoiding decorative effects or added objects." },
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
  "Keep Marks": { constraint: true },
  "Preserve Skin Texture": { constraint: true },
  "Preserve Natural Expression": { constraint: true },
  "Keep Original Glasses": { constraint: true },

  // Makeup: removing it cannot be combined with adding/refining it
  "Remove Makeup": { conflictsWith: ["Glow & Makeup", "Refine Makeup", "Lipstick"] },
  "Refine Makeup": { conflictsWith: ["Remove Makeup"] },
  "Glow & Makeup": { conflictsWith: ["Remove Makeup"] },
  "Lipstick": { conflictsWith: ["Remove Makeup"] },

  // Pose
  "Straighten Head": { changesPose: true },
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

/** Applies to the whole image (not just the face), so "keep the background untouched" must be relaxed. */
const GLOBAL_CATEGORIES = new Set(["lighting-color", "image-quality", "old-photo", "creative-finish"]);

/** Order in which edits are applied: repair first, stylistic finish last. */
const CATEGORY_ORDER: Record<string, number> = {
  "old-photo": 0,
  "image-quality": 1,
  "lighting-color": 2,
  "portrait-skin": 3,
  "eyes-details": 4,
  "background-composition": 5,
  "id-studio": 6,
  "creative-finish": 7,
};

const CUSTOM_PREFIX = "Custom Instruction:";
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
  const presets: string[] = [];
  for (const entry of selected) {
    if (typeof entry !== "string") continue;
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
    text = text.replace(/\{background\}/g, context.backgroundRef);
    (meta.constraint ? constraints : edits).push(`${label}: ${text}`);
  }

  const has = (predicate: (meta: EditingGuideMeta, preset: EditingGuidePreset) => boolean) =>
    ordered.some((label) => predicate(EDITING_GUIDE_META[label] ?? {}, GUIDE_BY_LABEL[label]));

  return {
    edits,
    constraints,
    customInstruction,
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
