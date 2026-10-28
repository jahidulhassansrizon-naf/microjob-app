"use client";
import { T, useI18n } from "@/components/i18n/I18nProvider";
import Link from "next/link";
import { ArrowLeft, Clock3, PlayCircle, Sparkles } from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
const topics = [
    "AI Editor ও AI Photo Edit",
    "Seba Lagbe Tools: PDF, Image, Text and Video tools",
    "Bulk Photo Edit এবং AI Template",
    "Question Papers ও Print Media",
    "Profile, Subscription ও Account features",
];
export default function TutorialVideoPage() {
    const { locale } = useI18n();
    const topicsForLocale = topics.map((topic) => topic.startsWith("Seba Lagbe Tools:") && locale === "bn" ? "সেবা লাগবে টুলসের PDF, Image, Text ও Video tools" : topic);
    return (<div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/dashboard" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#2563EB]">
          <ArrowLeft size={14}/><T>{"Back to dashboard\n        "}</T></Link>

        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3158D8] to-[#4338CA] px-6 py-12 text-white sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"/>
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-indigo-900/20 blur-3xl"/>

            <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]">
                <Clock3 size={13}/><T>{"Coming soon\n              "}</T></span>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl"><T>{"Tutorial Videos\n              "}</T></h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-blue-50 sm:text-base"><T>{"Soon, you will be able to watch step-by-step videos here to learn\n                how to use the tools and features of this website easily.\n              "}</T></p>
            </div>

            <div className="relative mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {["Learn faster", "Follow along", "Get more done"].map((item) => (<div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                  <PlayCircle size={18} className="mb-2"/>
                  <p className="text-sm font-bold">{item}</p>
                </div>))}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] ring-1 ring-inset ring-blue-100">
                <Sparkles size={18}/>
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900"><T>{"Videos will be available here\n                "}</T></h2>
                <p className="mt-1 text-xs font-medium leading-6 text-slate-500"><T>{"We are preparing simple tutorials so you can learn each tool without\n                  any confusion.\n                "}</T></p>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topicsForLocale.map((topic, index) => (<div key={topic} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2563EB]"><T>{"Tutorial "}</T>{String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                    {topic}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-400 ring-1 ring-inset ring-slate-200">
                    <Clock3 size={11}/><T>{"Coming soon\n                  "}</T></span>
                </div>))}
            </div>
          </div>
        </section>
      </main>
    </div>);
}
