// Strong, detailed prompt builder for the AI Template page.
// Goal: (1) the generated person must be the EXACT same real person as in the user's photo,
//       (2) everything else (outfit, pose, camera, background, light, colour) comes from the template,
//       (3) the output must be ultra sharp, clean, HD, photographic quality.

export type TemplatePromptInfo = {
  title: string;
  category: string;
  gender: string;
  imageCount: number;
  orientation: string;
};

const QUALITY_BLOCK = [
  "OUTPUT QUALITY (non-negotiable):",
  "- Produce the highest resolution and sharpness you can, like a professional 50-megapixel camera shot with a prime lens. The face, eyes, eyelashes, eyebrows, lips, skin pores, hair strands, beard/stubble, fabric weave, stitching, buttons, jewellery and background foliage must stay crisp and detailed even when zoomed in.",
  "- Absolutely no blur, no soft or smudged face, no noise or grain, no compression artifacts, no pixelation, no banding, no jagged edges or halos around hair and shoulders, no warped or melted shapes.",
  "- Natural, believable real-photo skin with visible fine texture. Never plastic, waxy, airbrushed, over-smoothed, over-sharpened or cartoonish.",
  "- Correct anatomy: well-formed hands with exactly five fingers each, natural ears, neck, shoulders and proportions, no extra or missing limbs, no distorted teeth or eyes.",
  "- Clean frame: no text, captions, logos, watermarks, borders, frames, UI elements or extra objects that are not in the template.",
].join("\n");

const FORMAT_RULE = (orientation: string) =>
  `OUTPUT FORMAT: return exactly ONE finished image, ${orientation.toLowerCase()} orientation, with the same aspect ratio, framing and crop as IMAGE 1. Do not return a collage, a split screen, a before/after, or the attached images themselves. Return only the image, with no explanation text.`;

function templateFacts(t: TemplatePromptInfo, couple: boolean): string {
  const lines = [
    `Template title: ${t.title}`,
    `Template category: ${t.category}`,
    `Template orientation: ${t.orientation}`,
  ];
  if (!couple) lines.push(`Template gender classification: ${t.gender}`);
  lines.push(
    `Number of people in the template: ${couple ? "2" : t.imageCount === 1 ? "1" : String(t.imageCount)}`,
  );
  return lines.join("\n");
}

export function buildSingleTemplatePrompt(t: TemplatePromptInfo): string {
  return [
    "You are an expert photo compositor and portrait retoucher. Create ONE new photorealistic image using the two attached images.",
    "",
    "INPUT ROLES",
    "- IMAGE 1 = the TEMPLATE (style, scene and design reference only). The person in IMAGE 1 is a stand-in model whose identity must be completely discarded.",
    "- IMAGE 2 = the USER'S OWN PHOTO. This is the ONLY identity source. The person in the final image must be this exact real person.",
    "",
    "TASK",
    "Re-create IMAGE 1 as faithfully as possible, but with the real person from IMAGE 2 in place of the template model, so that it looks like a genuine photograph of the person from IMAGE 2 actually sitting/standing in that exact scene.",
    "",
    "1) IDENTITY LOCK (HIGHEST PRIORITY - overrides every other instruction)",
    "- The result must be instantly recognizable as the same real person as IMAGE 2, to the point that a friend or family member would say \"that is definitely him/her\".",
    "- Copy exactly from IMAGE 2: face shape, jawline, chin, cheekbones, forehead size, eye shape, eye colour and spacing, eyelids, eyebrows (shape, thickness), nose (bridge, width, tip), nostrils, lips (shape, fullness), teeth/smile style, ears, dimples, moles, scars and birthmarks, apparent age, and the exact skin tone and undertone.",
    "- Hair: keep the user's own hair colour, texture, density, hairline, parting and general hairstyle from IMAGE 2. Do not copy the template model's hair.",
    "- Facial hair: follow IMAGE 2 only. If the user is clean-shaven, do NOT add a beard or moustache even if the template model has one; if the user has a beard/moustache, keep the same style and density even if the template model has none.",
    "- Glasses: follow IMAGE 2 only. Do not add glasses the user is not wearing, and do not remove glasses the user always wears.",
    "- Body type, build and weight should match what is visible of the user in IMAGE 2 and stay natural and well proportioned. Do not copy the template model's body shape, height or skin tone.",
    "- Do NOT beautify, slim, age, de-age, lighten, darken, reshape, symmetrize or \"idealize\" the face. Do NOT blend, average or mix features with the template model. If the template model resembles the user in any way, still use the user's own features.",
    "- The face must be re-lit and rotated to the template's head angle and expression direction, but its underlying structure must remain 100% the user's. Use the user's natural expression and smile character rather than the template model's.",
    "- If IMAGE 2 is a selfie or low-angle/wide-lens photo, correct the lens distortion so the face looks natural and in correct proportion, without changing who the person is.",
    "",
    "2) TAKE FROM THE TEMPLATE (IMAGE 1) - replicate faithfully",
    "- Composition, framing, crop, subject size and placement, camera angle, camera height, lens look and depth of field.",
    "- Pose: head tilt, gaze direction, shoulders, torso, arms, hands, legs and how the subject sits or stands, including any prop interaction.",
    "- Clothing and accessories: the same garments, colours, fabric, fit, layers, collar, folds, buttons, watches, jewellery and similar items as the template model wears (the user's original clothes in IMAGE 2 must NOT be used).",
    "- Background and environment: the same location, objects, furniture, plants, architecture, props and depth layers, with the same blur level (bokeh).",
    "- Lighting and colour: the same light direction, softness, colour temperature, shadows, highlights, contrast, grading, mood and time of day. The user's face and skin must be lit by this exact light so it blends naturally, while keeping the user's real skin tone.",
    "- Any graphic design elements of the template (borders, shapes, typography-free layout) when they are part of the design.",
    "",
    "3) REALISM AND INTEGRATION",
    "- The person must look physically present in the scene: matching shadows on the face and body, correct contact shadows where the body touches the seat/ground/props, matching colour reflections from clothes and surroundings, consistent grain and sharpness between the person and the background.",
    "- Neck, ears, hairline and collar must connect naturally with no visible seams, masks, cut-out edges or pasted-on look.",
    "- Keep it photorealistic when the template is photorealistic, and keep the template's artistic style when it is stylized.",
    "- Do not add extra people, animals, random objects, logos or watermarks. Exactly one person must appear in the result.",
    "",
    QUALITY_BLOCK,
    "",
    "BEFORE YOU ANSWER, SELF-CHECK:",
    "(a) Does the face match IMAGE 2's person, not the template model? (b) Are the outfit, pose, background, light and framing the same as IMAGE 1? (c) Is the image sharp, clean and high resolution with natural skin and correct hands? If any answer is no, fix it before returning.",
    "",
    FORMAT_RULE(t.orientation),
    "",
    templateFacts(t, false),
  ].join("\n");
}

export function buildCoupleTemplatePrompt(t: TemplatePromptInfo): string {
  return [
    "You are an expert photo compositor and portrait retoucher. Create ONE new photorealistic image using the three attached images.",
    "",
    "INPUT ROLES",
    "- IMAGE 1 = the TEMPLATE (style, scene and design reference only). It shows two stand-in models whose identities must be completely discarded.",
    "- IMAGE 2 = PERSON A, a real person's own photo (identity source).",
    "- IMAGE 3 = PERSON B, a different real person's own photo (identity source).",
    "- PERSON A and PERSON B are the ONLY identity sources. They are two different people and must never look alike or be blended.",
    "",
    "TASK",
    "Re-create IMAGE 1 as faithfully as possible, with PERSON A and PERSON B in place of the two template models, so that it looks like a genuine photograph of these two real people together in that exact scene.",
    "",
    "1) POSITION ASSIGNMENT",
    "- Match by apparent gender and age first (man replaces man, woman replaces woman, child replaces child).",
    "- If that does not decide it, PERSON A takes the left position and PERSON B takes the right position.",
    "",
    "2) IDENTITY LOCK FOR BOTH PEOPLE (HIGHEST PRIORITY - overrides every other instruction)",
    "- Each person must be instantly recognizable as their own real self from their own photo, with equal care and equal accuracy for both. Check PERSON B as carefully as PERSON A.",
    "- Copy exactly for each person: face shape, jawline, chin, cheekbones, forehead, eye shape/colour/spacing, eyebrows, nose, lips, smile and teeth style, ears, moles/scars/birthmarks, apparent age and exact skin tone and undertone.",
    "- Keep each person's own hair colour, texture, hairline and hairstyle; own facial hair (add none that is not in their photo, remove none that is); own glasses status. Do not copy the template models' hair, beard or glasses.",
    "- Body type and build must stay natural and consistent with each person's photo. Do not copy the template models' bodies or skin tones.",
    "- Do NOT beautify, slim, age, de-age, lighten, reshape, symmetrize or idealize either face. Do NOT swap, average or mix features between the two people or with the template models.",
    "- Re-light and rotate each face to the template's head angle, but keep the underlying facial structure 100% the real person's. Correct selfie/wide-lens distortion without changing identity.",
    "",
    "3) TAKE FROM THE TEMPLATE (IMAGE 1) - replicate faithfully",
    "- Composition, framing, crop, camera angle, lens look, depth of field, and the relative size and placement of both people.",
    "- Poses, closeness, hand placement, gaze, interaction and chemistry between the two people exactly as in the template.",
    "- Clothing, scarf/veil/dupatta, jewellery and accessories for each position exactly as in the template (the users' own clothes from their photos must NOT be used).",
    "- Background, environment, props, blur, lighting direction, colour temperature, shadows, colour grading and mood.",
    "",
    "4) REALISM AND INTEGRATION",
    "- Both people must look physically present in the scene: consistent lighting and shadows on both faces and bodies, correct contact shadows, matching colour reflections, consistent sharpness and grain, natural hand contact between them where the template shows it.",
    "- No visible seams, cut-out edges or pasted-on look around hair, necks, ears or shoulders.",
    "- Exactly two people in the result, both fully visible exactly as in the template framing. No extra people, objects, logos or watermarks.",
    "",
    QUALITY_BLOCK,
    "",
    "BEFORE YOU ANSWER, SELF-CHECK:",
    "(a) Does each face match its own real person and not a template model? (b) Is PERSON B as accurate as PERSON A and are the two faces clearly different people? (c) Do outfits, poses, background, light and framing match IMAGE 1? (d) Is it sharp, clean and high resolution with natural skin and correct hands? Fix any \"no\" before returning.",
    "",
    FORMAT_RULE(t.orientation),
    "",
    templateFacts(t, true),
  ].join("\n");
}
