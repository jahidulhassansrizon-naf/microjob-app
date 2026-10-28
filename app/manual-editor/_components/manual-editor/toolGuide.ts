/*
 * Plain-language description of every tool in the AI Tools panel.
 *
 * Each entry says three things, in this order:
 *   summary  - what the tool does
 *   useWhen  - the situation it is meant for
 *   limits   - what it will NOT do (so nobody expects magic)
 *
 * The wording follows what the code really does (see photoEnhance.ts,
 * photoTools.ts, aiEnhancement.ts). If a tool's behaviour changes, change
 * its text here too.
 */

export type ToolGuideId =
  | "face"
  | "object"
  | "transparent"
  | "upscale"
  | "cutout"
  | "retouch"
  | "auto"
  | "clean"
  | "relight"
  | "restore";

export type GuideText = {
  name: string;
  summary: string;
  useWhen: string;
  limits: string;
};

export const TOOL_GUIDE_ORDER: ToolGuideId[] = [
  "face",
  "object",
  "transparent",
  "upscale",
  "cutout",
  "retouch",
  "auto",
  "clean",
  "relight",
  "restore",
];

export const TOOL_GUIDE: Record<ToolGuideId, { en: GuideText; bn: GuideText }> = {
  face: {
    en: {
      name: "AI Face Enhance",
      summary:
        "Finds the face in your photo and gently improves its brightness, contrast and sharpness - on the face only. One click, no settings.",
      useWhen:
        "Dull, flat or slightly soft faces in passport, visa and ID photos.",
      limits:
        "It does not change facial features, remove spots or fix heavy blur (use Retouch for spots). If no face is found, it tells you.",
    },
    bn: {
      name: "এআই মুখ উন্নত করুন",
      summary:
        "ছবিতে মুখ খুঁজে বের করে শুধু মুখের অংশের উজ্জ্বলতা, কনট্রাস্ট ও শার্পনেস হালকাভাবে বাড়ায়। এক ক্লিকেই কাজ হয়, কোনো সেটিং লাগে না।",
      useWhen:
        "পাসপোর্ট, ভিসা বা আইডি ছবিতে মুখ মলিন, ফ্ল্যাট বা সামান্য নরম দেখালে।",
      limits:
        "মুখের গড়ন বদলায় না, দাগ-ছোপ সরায় না এবং বেশি ঝাপসা ছবি ঠিক করতে পারে না (দাগের জন্য রিটাচ ব্যবহার করুন)। মুখ শনাক্ত না হলে জানিয়ে দেয়।",
    },
  },
  object: {
    en: {
      name: "Object Adjust",
      summary:
        "AI selects the Face, Skin, Hair or Shadow area for you. Then change Brightness, Contrast, Saturation and Hue only inside that selection (Shadow: lighten dark patches). Brush and Erase fix the selection.",
      useWhen:
        "Brighten a dark face without washing out the background, fix dull hair colour, or soften a shadow on the face.",
      limits:
        "Shadow is found from brightness differences on skin, so check it with the Eye button. Apply saves the photo at up to 3200 px on the longest side.",
    },
    bn: {
      name: "বস্তু সমন্বয়",
      summary:
        "এআই নিজে থেকে মুখ, ত্বক, চুল বা ছায়ার অংশ নির্বাচন করে। তারপর শুধু সেই অংশের উজ্জ্বলতা, কনট্রাস্ট, রঙের তীব্রতা ও টোন বদলাতে পারবেন (ছায়ার ক্ষেত্রে অন্ধকার অংশ হালকা হয়)। ব্রাশ ও ইরেজ দিয়ে নির্বাচন ঠিক করা যায়।",
      useWhen:
        "ব্যাকগ্রাউন্ড ফ্যাকাশে না করে অন্ধকার মুখ উজ্জ্বল করতে, চুলের মলিন রঙ ঠিক করতে বা মুখের ছায়া নরম করতে।",
      limits:
        "ছায়া ত্বকের উপর আলোর পার্থক্য দেখে শনাক্ত হয়, তাই চোখের বোতাম দিয়ে নির্বাচনটি দেখে নিন। প্রয়োগ করলে ছবি সর্বোচ্চ ৩২০০ পিক্সেল (লম্বা দিক) আকারে সংরক্ষিত হয়।",
    },
  },
  transparent: {
    en: {
      name: "Transparent",
      summary:
        "Removes the background with AI so only the person remains on a transparent background. Pick a new background colour in the Background panel. Same as the Remove BG button.",
      useWhen:
        "Changing the background of a passport, visa or ID photo to white, blue or any colour.",
      limits:
        "Very fine hair or loose clothing edges may need touching up in Cutout Editor. Download as PNG to keep transparency; JPG is flattened on white.",
    },
    bn: {
      name: "ব্যাকগ্রাউন্ড স্বচ্ছ করুন",
      summary:
        "এআই দিয়ে ব্যাকগ্রাউন্ড সরিয়ে শুধু ব্যক্তিকে স্বচ্ছ ব্যাকগ্রাউন্ডে রাখে। নতুন ব্যাকগ্রাউন্ডের রঙ ব্যাকগ্রাউন্ড প্যানেল থেকে বেছে নিন। এটি Remove BG বোতামের মতোই কাজ করে।",
      useWhen:
        "পাসপোর্ট, ভিসা বা আইডি ছবির ব্যাকগ্রাউন্ড সাদা, নীল বা অন্য রঙে বদলাতে।",
      limits:
        "খুব সূক্ষ্ম চুল বা ঢিলা কাপড়ের কিনারা কাটআউট এডিটরে ঠিক করা লাগতে পারে। স্বচ্ছতা রাখতে PNG ফরম্যাটে ডাউনলোড করুন; JPG-তে ব্যাকগ্রাউন্ড সাদা হয়ে যায়।",
    },
  },
  upscale: {
    en: {
      name: "Upscale",
      summary:
        "AI super-resolution: makes a small or low-resolution photo twice as wide and tall, with cleaner edges and detail than simple enlarging.",
      useWhen:
        "Small photos (for example from a messaging app or an old phone) that look pixelated when printed or enlarged.",
      limits:
        "Made for small photos (up to about 1280 px on the longest side with GPU, 640 px without). A photo that is already large is not upscaled. It cannot recover detail that was never in the photo, and it does not fix heavy blur.",
    },
    bn: {
      name: "ছবির মান ও আকার বাড়ান",
      summary:
        "এআই সুপার-রেজোলিউশন: ছোট বা কম রেজোলিউশনের ছবির দৈর্ঘ্য-প্রস্থ দ্বিগুণ করে, সাধারণ বড় করার চেয়ে পরিষ্কার কিনারা ও ডিটেইল দিয়ে।",
      useWhen:
        "মেসেজিং অ্যাপ বা পুরনো ফোনের ছোট ছবি, যা প্রিন্ট বা বড় করলে ভেঙে (পিক্সেলেটেড) দেখায়।",
      limits:
        "ছোট ছবির জন্য তৈরি (GPU থাকলে লম্বা দিকে প্রায় ১২৮০ পিক্সেল পর্যন্ত, না থাকলে ৬৪০)। যে ছবি আগে থেকেই বড় তাতে কাজ করে না। ছবিতে যে ডিটেইল ছিলই না তা ফিরিয়ে আনতে পারে না এবং বেশি ঝাপসা ছবি ঠিক করে না।",
    },
  },
  cutout: {
    en: {
      name: "Cutout Editor",
      summary:
        "AI separates the person from the background, then you fix the edges with Erase and Restore brushes, set edge softness, zoom up to 600 % and preview on different backgrounds.",
      useWhen:
        "Automatic background removal left some background around hair, ears or shoulders, or cut away part of the person.",
      limits:
        "The preview backdrop is only for checking. The real background colour is still chosen in the Background panel.",
    },
    bn: {
      name: "কাটআউট এডিটর",
      summary:
        "এআই ব্যক্তিকে ব্যাকগ্রাউন্ড থেকে আলাদা করে, তারপর ইরেজ ও রিস্টোর ব্রাশ দিয়ে কিনারা ঠিক করা, কিনারা নরম করা, ৬০০% পর্যন্ত জুম এবং বিভিন্ন ব্যাকগ্রাউন্ডে পূর্বরূপ দেখা যায়।",
      useWhen:
        "স্বয়ংক্রিয় ব্যাকগ্রাউন্ড রিমুভ চুল, কান বা কাঁধের চারপাশে ব্যাকগ্রাউন্ড রেখে দিলে অথবা ব্যক্তির কিছু অংশ কেটে ফেললে।",
      limits:
        "পূর্বরূপের ব্যাকগ্রাউন্ড শুধু দেখার জন্য। আসল ব্যাকগ্রাউন্ডের রঙ আগের মতোই ব্যাকগ্রাউন্ড প্যানেল থেকে বাছতে হবে।",
    },
  },
  retouch: {
    en: {
      name: "Retouch",
      summary:
        "Paint over a problem area. Tools: Remove (dust, spots, small objects), Clone / Heal, Red-eye, Skin smooth, Blur and Pixelate. Works at full resolution, only on the painted area.",
      useWhen:
        "Pimples, dust, a stray hair, small marks on clothes, red-eye, or hiding private details.",
      limits:
        "Remove rebuilds the area from its surroundings (it is not generative AI), so it suits small spots, not large objects.",
    },
    bn: {
      name: "রিটাচ",
      summary:
        "সমস্যার জায়গার উপর ব্রাশ করুন। টুল: রিমুভ (ধুলো, দাগ, ছোট বস্তু), ক্লোন/হিল, রেড-আই, ত্বক মসৃণ, ব্লার ও পিক্সেলেট। পূর্ণ রেজোলিউশনে শুধু ব্রাশ করা অংশেই কাজ করে।",
      useWhen:
        "ব্রণ, ধুলো, এলোমেলো একটা চুল, কাপড়ের ছোট দাগ, রেড-আই অথবা ব্যক্তিগত তথ্য ঢাকতে।",
      limits:
        "রিমুভ আশপাশ দেখে জায়গাটা ভরে (এটি জেনারেটিভ এআই নয়), তাই ছোট দাগের জন্য ভালো, বড় বস্তুর জন্য নয়।",
    },
  },
  auto: {
    en: {
      name: "Auto Enhance",
      summary:
        "One click. Checks the photo (exposure, colour cast, contrast, noise, softness) and fixes only what it finds. Live preview, compare with the original, and a strength slider.",
      useWhen:
        "A quick first fix for any photo that looks dark, dull, yellowish or slightly grainy.",
      limits:
        "Standard image processing, not generative AI. Bright white-background photos are left alone on purpose, so they do not turn grey.",
    },
    bn: {
      name: "অটো ইনহ্যান্স",
      summary:
        "এক ক্লিকে কাজ। ছবির আলো, রঙের ঝোঁক, কনট্রাস্ট, নয়েজ ও নরমভাব যাচাই করে শুধু যেটুকু দরকার সেটুকু ঠিক করে। লাইভ পূর্বরূপ, মূল ছবির সাথে তুলনা এবং শক্তি নিয়ন্ত্রণের স্লাইডার আছে।",
      useWhen:
        "যে ছবি অন্ধকার, মলিন, হলদেটে বা সামান্য দানাদার দেখায় তার দ্রুত প্রথম সংশোধনে।",
      limits:
        "এটি সাধারণ ইমেজ প্রসেসিং, জেনারেটিভ এআই নয়। সাদা ব্যাকগ্রাউন্ডের উজ্জ্বল ছবি ইচ্ছা করেই বদলানো হয় না, যাতে ধূসর না হয়ে যায়।",
    },
  },
  clean: {
    en: {
      name: "Denoise & Deblur",
      summary:
        "Denoise removes grain and keeps edges (Weak / Medium / Strong). Deblur brings back mild softness by sharpening.",
      useWhen:
        "Grainy photos from low light or an old phone camera, or photos that are only a little soft.",
      limits:
        "Deblur cannot undo heavy blur or motion blur, and neither tool is an AI model. Too much sharpening looks harsh, so compare with the original.",
    },
    bn: {
      name: "ডিনয়েজ ও ডিব্লার",
      summary:
        "ডিনয়েজ কিনারা ঠিক রেখে দানা বা নয়েজ কমায় (হালকা / মাঝারি / বেশি)। ডিব্লার শার্পনিং দিয়ে সামান্য নরম ভাব কমিয়ে ডিটেইল ফেরায়।",
      useWhen:
        "কম আলোয় বা পুরনো ফোন ক্যামেরায় তোলা দানাদার ছবি, অথবা যে ছবি শুধু একটু নরম।",
      limits:
        "ডিব্লার বেশি ঝাপসা বা নড়ে যাওয়া ছবি ঠিক করতে পারে না, আর দুটির কোনোটাই এআই মডেল নয়। বেশি শার্পনিং কড়া দেখায়, তাই মূল ছবির সাথে তুলনা করে নিন।",
    },
  },
  relight: {
    en: {
      name: "Relight",
      summary:
        "Lifts only the dark areas of the photo and protects the bright parts. Optional extra fill light on the face.",
      useWhen:
        "Underexposed photos, faces in shade, or strong shadows on one side.",
      limits:
        "It is a tone correction, not 3-D relighting. Very dark areas can show more noise after they are lifted.",
    },
    bn: {
      name: "রিলাইট",
      summary:
        "ছবির শুধু অন্ধকার অংশগুলো হালকা করে এবং উজ্জ্বল অংশ অপরিবর্তিত রাখে। চাইলে মুখে বাড়তি আলো দেওয়া যায়।",
      useWhen:
        "কম আলোর ছবি, ছায়ায় থাকা মুখ, অথবা এক পাশে গাঢ় ছায়া পড়লে।",
      limits:
        "এটি আলোর টোন ঠিক করে, ত্রিমাত্রিক রিলাইটিং নয়। খুব অন্ধকার অংশ হালকা করলে সেখানে নয়েজ বেশি দেখা যেতে পারে।",
    },
  },
  restore: {
    en: {
      name: "Old Photo",
      summary:
        "Repairs dust and thin scratches (up to about 5 px wide), restores faded tones, reduces noise and recovers detail.",
      useWhen:
        "Scanned or photographed old prints that look faded, speckled or scratched.",
      limits:
        "It does not fill tears or missing areas, and it does not add colour to black-and-white photos.",
    },
    bn: {
      name: "পুরনো ছবি",
      summary:
        "ধুলো ও সরু আঁচড় (প্রায় ৫ পিক্সেল চওড়া পর্যন্ত) মেরামত করে, ফ্যাকাশে রঙ ফিরিয়ে আনে, নয়েজ কমায় এবং ডিটেইল ফেরায়।",
      useWhen:
        "স্ক্যান করা বা ক্যামেরায় তোলা পুরনো প্রিন্ট, যা ফ্যাকাশে, ছিটছিট দাগযুক্ত বা আঁচড় লাগা।",
      limits:
        "ছেঁড়া বা হারিয়ে যাওয়া অংশ ভরাট করে না এবং সাদাকালো ছবিতে রঙ যোগ করে না।",
    },
  },
};
