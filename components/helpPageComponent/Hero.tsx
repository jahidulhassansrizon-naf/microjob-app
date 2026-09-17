import React from "react";
import { Play, Mail, Phone } from "lucide-react";

type Tutorial = {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  videoUrl?: string;
};

const tutorials: Tutorial[] = [
  {
    id: 1,
    title: "Easy task photo editing tutorial",
    description:
      "Learn how to edit photos, remove backgrounds, resize images, and complete essential design work quickly.",
    thumbnail: "https://img.youtube.com/vi/OI8e8DwkpqA/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=OI8e8DwkpqA&t=17s",
  },
  {
    id: 2,
    title: "Easy photo editing with AI Photo Editor",
    description:
      "Learn the complete process of creating and editing photos quickly with the AI Photo Editor.",
    thumbnail: "https://img.youtube.com/vi/IqYV4Iy20aA/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=IqYV4Iy20aA&t=2s",
  },
  {
    id: 3,
    title: "Manually remove photo backgrounds",
    description:
      "Select the required area manually and remove the background from your image with ease.",
    thumbnail: "https://img.youtube.com/vi/SP4rmgzusm8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=SP4rmgzusm8",
  },
  {
    id: 4,
    title: "How to remove photo backgrounds",
    description:
      "Remove image backgrounds easily and prepare your photos for a clean new design.",
    thumbnail: "https://img.youtube.com/vi/wE_KgtnDZ9E/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=wE_KgtnDZ9E",
  },
  {
    id: 5,
    title: "Create an AI photo from your image",
    description:
      "Use AI tools to turn an existing image into a fresh visual with just a few simple steps.",
    thumbnail: "https://img.youtube.com/vi/nEtJn7sUhEw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=nEtJn7sUhEw",
  },
  {
    id: 6,
    title: "Add text and design elements to photos",
    description:
      "Add text, logos, shapes, and other useful design elements to your images.",
    thumbnail: "https://img.youtube.com/vi/HLQ6xiBaS4A/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HLQ6xiBaS4A",
  },
  {
    id: 7,
    title: "Convert PDF pages into images",
    description:
      "Convert PDF files into JPG or PNG images whenever you need them for editing or sharing.",
    thumbnail: "https://img.youtube.com/vi/0VQY9ouJdVI/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=0VQY9ouJdVI",
  },
  {
    id: 8,
    title: "Compress images and reduce file size",
    description:
      "Reduce image file size while keeping the visual quality as clean as possible.",
    thumbnail: "https://img.youtube.com/vi/pDYi7fYvqaM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=pDYi7fYvqaM",
  },
  {
    id: 9,
    title: "Change colors with the Color Picker",
    description:
      "Pick exact colors from an image and work with HEX, RGB, HSL, and other useful color values.",
    thumbnail: "https://img.youtube.com/vi/3afc3gHjjh0/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=3afc3gHjjh0",
  },
  {
    id: 10,
    title: "Add a watermark to your image",
    description:
      "Protect and brand your images by adding a custom text or logo watermark.",
    thumbnail: "https://img.youtube.com/vi/4uYb18czeqw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=4uYb18czeqw",
  },
  {
    id: 11,
    title: "Use the Image Color Picker",
    description:
      "Pick a color directly from any image and quickly copy the corresponding color code.",
    thumbnail: "https://img.youtube.com/vi/gGNudCXKJX8/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=gGNudCXKJX8",
  },
  {
    id: 12,
    title: "Compress videos and reduce file size",
    description:
      "Make video files smaller and easier to upload or share while preserving useful quality.",
    thumbnail: "https://img.youtube.com/vi/HX9zkaks4Hw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=HX9zkaks4Hw",
  },
  {
    id: 13,
    title: "PDF থেকে টেক্সট বের করার সহজ পদ্ধতি",
    description:
      "PDF ফাইল থেকে প্রয়োজনীয় লেখা দ্রুত বের করে কপি, এডিট বা অন্য জায়গায় ব্যবহার করুন।",
    thumbnail: "https://img.youtube.com/vi/uHw0YEMWhCI/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=uHw0YEMWhCI",
  },
  {
    id: 14,
    title: "PDF ফাইল থেকে নির্দিষ্ট পেজ আলাদা করুন",
    description:
      "বড় PDF থেকে প্রয়োজনীয় পেজগুলো আলাদা করে নতুন PDF ফাইল হিসেবে সংরক্ষণ করার নিয়ম।",
    thumbnail: "https://img.youtube.com/vi/yTYGDHLquWc/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=yTYGDHLquWc",
  },
  {
    id: 15,
    title: "PDF একসাথে Merge করার নিয়ম",
    description:
      "একাধিক PDF ফাইলকে একটি মাত্র PDF-এ একত্র করে সুন্দরভাবে সাজানোর পদ্ধতি দেখুন।",
    thumbnail: "https://img.youtube.com/vi/5_kE3Dchw4M/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=5_kE3Dchw4M",
  },
  {
    id: 16,
    title: "PDF ফাইল Split করার সহজ নিয়ম",
    description:
      "একটি PDF-কে প্রয়োজন অনুযায়ী কয়েকটি ছোট অংশে ভাগ করে আলাদা ফাইল তৈরি করুন।",
    thumbnail: "https://img.youtube.com/vi/nkKSFiE7Z24/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=nkKSFiE7Z24",
  },
  {
    id: 17,
    title: "PDF Lock ও Unlock করার পদ্ধতি",
    description:
      "প্রয়োজন অনুযায়ী PDF-এ password protection যোগ করা বা নিরাপদভাবে remove করার নিয়ম।",
    thumbnail: "https://img.youtube.com/vi/MTS-jYhm8bM/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=MTS-jYhm8bM",
  },
  {
    id: 18,
    title: "PDF ফাইলের Page Permission পরিবর্তন",
    description:
      "PDF কে print, copy বা edit করার অনুমতি নিয়ন্ত্রণ করে ফাইলকে আরও সুরক্ষিত রাখুন।",
    thumbnail: "https://img.youtube.com/vi/faw5CGPyiDE/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=faw5CGPyiDE",
  },
  {
    id: 19,
    title: "ছবি থেকে Text বের করার সহজ পদ্ধতি",
    description:
      "একটি ছবির ভেতরের লেখা শনাক্ত করে দ্রুত text হিসেবে বের করার পদ্ধতি শিখুন।",
    thumbnail: "https://img.youtube.com/vi/TzohXeN5PEY/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=TzohXeN5PEY",
  },
  {
    id: 20,
    title: "Image Resize করার সহজ নিয়ম",
    description:
      "ছবির width ও height প্রয়োজন অনুযায়ী পরিবর্তন করে নির্দিষ্ট সাইজে প্রস্তুত করুন।",
    thumbnail: "https://img.youtube.com/vi/UhuT1Vjtjpw/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=UhuT1Vjtjpw",
  },
  {
    id: 21,
    title: "ছবির Format Convert করার পদ্ধতি",
    description:
      "JPG, PNG, WEBP এবং অন্যান্য image format-এর মধ্যে প্রয়োজন অনুযায়ী convert করুন।",
    thumbnail: "https://img.youtube.com/vi/fesFQTTYS8k/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=fesFQTTYS8k",
  },
  {
    id: 22,
    title: "ছবির Quality ঠিক রেখে Compress করুন",
    description:
      "ওয়েব বা সোশ্যাল মিডিয়ার জন্য প্রয়োজন অনুযায়ী image quality ও file size balance করার নিয়ম।",
    thumbnail: "https://img.youtube.com/vi/5YNXwklMv38/hqdefault.jpg",
    videoUrl: "https://www.youtube.com/watch?v=5YNXwklMv38",
  },
];

function VideoPreview({
  videoUrl,
  large = false,
}: {
  thumbnail?: string;
  videoUrl?: string;
  large?: boolean;
}) {
  const getYouTubeId = (url?: string) => {
    if (!url) return "";
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
    );
    return match?.[1] ?? "";
  };

  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div
        className={[
          "relative flex w-full items-center justify-center overflow-hidden rounded-[6px]",
          "aspect-video bg-gradient-to-br from-[#eeeeee] via-[#d9d9d9] to-[#cfcfcf]",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-black/[0.035]" />
        <div
          className={[
            "relative z-10 grid place-items-center rounded-full bg-[#ff1744] text-white",
            "shadow-[0_10px_25px_rgba(255,23,68,0.30)]",
            large ? "h-[62px] w-[62px]" : "h-[46px] w-[46px]",
          ].join(" ")}
        >
          <Play size={large ? 28 : 21} className="ml-1 fill-current" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-black">
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title={`Tutorial video ${videoId}`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  return (
    <article className="rounded-[7px] border border-gray-200 bg-white p-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
      <div className="mb-[4px] text-[9px] font-medium text-gray-400">
        Video {tutorial.id}
      </div>

      <h3 className="min-h-[34px] text-[13px] font-bold leading-[1.35] text-[#111111]">
        {tutorial.title}
      </h3>

      <p className="mt-[7px] min-h-[44px] text-[9px] leading-[1.55] text-gray-500">
        {tutorial.description}
      </p>

      <div className="mt-[10px]">
        <VideoPreview
          thumbnail={tutorial.thumbnail}
          videoUrl={tutorial.videoUrl}
        />
      </div>
    </article>
  );
}

export default function Hero() {
  return (
    <main className="min-h-screen bg-[#f2f2f2] text-[#111111]">
      {/* Large intro area — intentionally tall so the page matches the
          reference screenshot at normal 100% browser zoom. */}
      <section className="relative h-[470px] overflow-hidden border-b border-[#ece7e5] bg-[linear-gradient(180deg,#fffafa_0%,#fbf6f5_55%,#f5f0f0_100%)]">
        <div className="mx-auto flex h-full max-w-[980px] flex-col items-center px-5 pt-[101px] text-center sm:px-6">
          <span className="rounded-full border border-[#ff8b00] bg-white/80 px-[14px] py-[6px] text-[11px] font-medium text-[#e86f00]">
            Our specialty
          </span>

          <h1 className="mt-[28px] font-extrabold leading-none tracking-[-0.045em] text-[#080808]">
            <span className="text-[50px] text-[#ff8100] sm:text-[52px]">
              Easy task
            </span>
            <span className="text-[50px] sm:text-[52px]"> Introduction</span>
          </h1>

          <p className="mt-[34px] max-w-[570px] text-[16px] font-normal leading-7 text-[#26344a]">
            Watch the video tutorials below to learn how to use Easy Tasks.
          </p>
        </div>
      </section>

      {/* Main white content panel */}
      <section className="relative z-10 px-4 pb-16 sm:px-5">
        <div className="mx-auto -mt-[99px] max-w-[1050px] rounded-[11px] bg-white px-[47px] pb-[42px] pt-[45px] shadow-[0_4px_18px_rgba(0,0,0,0.06)] sm:px-[48px]">
          {/* Featured tutorial */}
          <div>
            <div className="mb-[10px] text-[11px] font-medium text-gray-400">
              Video 1
            </div>

            <h2 className="text-[16px] font-bold leading-6 text-[#101010]">
              Easy job introduction
            </h2>

            <p className="mt-[4px] text-[11px] leading-5 text-[#24344d]">
              Use various digital tools to help computer operators complete
              their daily tasks of images, documents, applications, and other
              necessary tasks easily and quickly.
            </p>

            <div className="mt-[15px]">
              <div className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-black">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/NyGp0RiWXmM?rel=0"
                  title="সহজ কাজ পরিচিতি"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          {/* Tutorial cards */}
          <div
            id="tutorials"
            className="mt-[18px] grid grid-cols-1 gap-[12px] md:grid-cols-3"
          >
            {tutorials.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>

          {/* Contact */}
          <div
            id="contact"
            className="mt-[36px] border-t border-gray-200 pt-[24px]"
          >
            <h2 className="text-[15px] font-bold">Contact</h2>

            <div className="mt-[10px] rounded-[7px] border border-blue-100 bg-[#f3f8ff] px-[16px] py-[14px]">
              <p className="text-[10px] leading-5 text-gray-600">
                Contact us for any Easy Task support or information.
              </p>

              <div className="mt-[9px] flex flex-wrap items-center gap-x-[24px] gap-y-[7px] text-[10px] font-semibold text-[#1769aa]">
                <a
                  href="mailto:hello@sohozkaj.com"
                  className="inline-flex items-center gap-[6px] hover:underline"
                >
                  <Mail size={13} />
                  hello@sohozkaj.com
                </a>

                <a
                  href="tel:+8801700000000"
                  className="inline-flex items-center gap-[6px] hover:underline"
                >
                  <Phone size={13} />
                  +88 01700-000000
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/8801700000000"
        target="_blank"
        rel="noreferrer"
        aria-label="Contact us on WhatsApp"
        className="fixed bottom-[22px] right-[22px] z-50 grid h-[56px] w-[56px] place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(37,211,102,0.30)] transition hover:scale-105"
      >
        <span className="text-[28px] leading-none">◔</span>
      </a>
    </main>
  );
}
