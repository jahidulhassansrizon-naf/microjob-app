"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { ArrowLeft, Clock3, PlayCircle, Sparkles } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

const TEXT = {
    en: {
        back: "Back to dashboard",
        soon: "Coming soon",
        title: "Tutorial Videos",
        intro: "Soon, you will be able to watch step-by-step videos here to learn how to use the tools and features of this website easily.",
        chips: ["Learn faster", "Follow along", "Get more done"],
        sectionTitle: "Videos will be available here",
        sectionText: "We are preparing simple tutorials so you can learn each tool without any confusion.",
        tutorial: "Tutorial",
        topics: [
            "AI Editor & AI Photo Edit",
            "sebalagbe.com Tools: PDF, Image, Text & Video tools",
            "Bulk Photo Edit & AI Template",
            "Question Papers & Print Media",
            "Profile, Subscription & Account features",
        ],
    },
    bn: {
        back: "ড্যাশবোর্ডে ফিরে যান",
        soon: "শীঘ্রই আসছে",
        title: "টিউটোরিয়াল ভিডিও",
        intro: "খুব শীঘ্রই এখানে ধাপে ধাপে ভিডিও দেখে শিখতে পারবেন, কীভাবে এই ওয়েবসাইটের টুলস ও ফিচারগুলো সহজে ব্যবহার করবেন।",
        chips: ["দ্রুত শিখুন", "সাথে সাথে করুন", "আরও বেশি কাজ করুন"],
        sectionTitle: "ভিডিওগুলো এখানে পাওয়া যাবে",
        sectionText: "আমরা সহজ টিউটোরিয়াল তৈরি করছি, যাতে প্রতিটি টুল কোনো ঝামেলা ছাড়াই শিখতে পারেন।",
        tutorial: "টিউটোরিয়াল",
        topics: [
            "AI এডিটর ও AI ফটো এডিট",
            "sebalagbe.com টুলস: PDF, ইমেজ, টেক্সট ও ভিডিও টুলস",
            "বাল্ক ফটো এডিট ও AI টেমপ্লেট",
            "প্রশ্নপত্র ও প্রিন্ট মিডিয়া",
            "প্রোফাইল, সাবস্ক্রিপশন ও অ্যাকাউন্ট ফিচার",
        ],
    },
};

export default function TutorialVideoPage() {
    const { locale } = useI18n();
    const t = locale === "bn" ? TEXT.bn : TEXT.en;
    return (<div className="page-font min-h-screen bg-[#F0E6CF] font-sans text-[#2B2116]">
      <DashboardNavbar />

      <main className="font-bengali-ui mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/dashboard" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#6B5A40] transition-colors hover:text-[#DC2626]">
          <ArrowLeft size={14}/>{t.back}
        </Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-[0_10px_28px_-20px_rgba(59,47,30,0.45)]">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#DC2626] via-[#C81E1E] to-[#991B1B] px-6 py-12 text-white sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFE9A0]/15 blur-3xl"/>
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl"/>

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">
                <Clock3 size={13}/>{t.soon}
              </span>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{t.title}</h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-red-50 sm:text-base">{t.intro}</p>
            </div>

            <div className="relative mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {t.chips.map((item) => (<div key={item} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <PlayCircle size={18} className="mb-2"/>
                  <p className="text-sm font-bold">{item}</p>
                </div>))}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626] ring-1 ring-inset ring-[#FECACA]">
                <Sparkles size={18}/>
              </span>
              <div>
                <h2 className="text-base font-black text-[#2B2116]">{t.sectionTitle}</h2>
                <p className="mt-1 text-xs font-medium leading-6 text-[#6B5A40]">{t.sectionText}</p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {t.topics.map((topic, index) => (<div key={topic} className="rounded-2xl border border-[#E8DFCC] bg-[#FCFAF5] p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#DC2626]">
                    {t.tutorial} {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#2B2116]">
                    {topic}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#F3E9D2] px-2 py-1 text-[10px] font-bold text-[#7A6A50] ring-1 ring-inset ring-[#E3D6B8]">
                    <Clock3 size={11}/>{t.soon}
                  </span>
                </div>))}
            </div>
          </div>
        </section>
      </main>
    </div>);
}
