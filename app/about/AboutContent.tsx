"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Compass,
  Handshake,
  Heart,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

const copy = {
  en: {
    eyebrow: "A personal project with a bigger purpose",
    titleA: "Built independently.",
    titleB: "Growing with every step.",
    intro:
      "I’m an independent full-stack developer building Seba Lagbe hands-on. Over the last two months, I’ve been turning an idea into a working platform for everyday digital tasks—and improving it one feature at a time.",
    introNote:
      "This is a living project, built piece by piece, with plenty of room to improve and grow.",
    aboutLabel: "THE PERSON BEHIND Seba Lagbe",
    aboutTitle: "One developer, from idea to implementation",
    aboutBody:
      "I plan, design, code, connect the front end with the back end, and keep testing the experience myself. The goal is simple: make useful digital work feel more straightforward and accessible in one place.",
    fact1Value: "2 months",
    fact1Label: "of focused building",
    fact2Value: "1 builder",
    fact2Label: "hands-on across the stack",
    fact3Value: "One goal",
    fact3Label: "make everyday tasks easier",
    journeyEyebrow: "THE JOURNEY SO FAR",
    journeyTitle: "A small start, built with intention",
    journeyIntro:
      "Seba Lagbe is still growing. Here’s the journey in three honest chapters—not a story about a big team or years of company history.",
    step1Title: "The idea",
    step1Body:
      "Create a practical home for everyday digital tasks, so people can get useful work done without jumping between too many disconnected tools.",
    step2Title: "Two months of hands-on building",
    step2Body:
      "Shape the pages, build full-stack features, connect workflows, test what works, and keep refining the details as the platform takes form.",
    step3Title: "The next chapter",
    step3Body:
      "Improve what’s already here, listen to feedback, add useful capabilities, and find the right people to help the platform grow responsibly.",
    valuesEyebrow: "WHAT GUIDES THE WORK",
    valuesTitle: "Principles behind the product",
    value1Title: "Useful before flashy",
    value1Body:
      "Prioritise features that solve real tasks and make the experience easier to understand.",
    value2Title: "Build, test, improve",
    value2Body:
      "Keep learning, testing, and polishing instead of pretending the product is already finished.",
    value3Title: "Grow transparently",
    value3Body:
      "Be open about what’s ready, what’s still in progress, and where collaboration can help.",
    openLabel: "OPEN INVITATION",
    openTitle: "Seba Lagbe is a solo build today. The next chapter can be shared.",
    openBody:
      "If you’re a developer, designer, creator, marketer, or simply someone with ideas and energy to contribute, I’d love to talk. You can help improve the platform, bring new skills to the project, or discuss a possible long-term collaboration or business partnership. We can talk openly about the role and terms before making any commitment.",
    primaryCta: "Let’s talk about collaborating",
    secondaryCta: "Explore the tools",
    smallNote: "Built independently. Open to thoughtful collaboration.",
  },
  bn: {
    eyebrow: "বড় লক্ষ্য নিয়ে একটি ব্যক্তিগত উদ্যোগ",
    titleA: "নিজের হাতে তৈরি।",
    titleB: "প্রতিটি ধাপে এগিয়ে চলা।",
    intro:
      "আমি একজন স্বতন্ত্র ফুল-স্ট্যাক ডেভেলপার; নিজের হাতে ‘সেবা লাগবে’ তৈরি করছি। গত দুই মাস ধরে একটি ধারণাকে দৈনন্দিন ডিজিটাল কাজের ব্যবহারযোগ্য প্ল্যাটফর্মে রূপ দিচ্ছি এবং ধাপে ধাপে নতুন ফিচার যোগ করে উন্নত করছি।",
    introNote:
      "এটি ধাপে ধাপে গড়ে ওঠা একটি চলমান প্রকল্প—উন্নতি ও বড় হয়ে ওঠার অনেক সুযোগ রয়েছে।",
    aboutLabel: "‘সেবা লাগবে’-এর পেছনের মানুষটি",
    aboutTitle: "একজন ডেভেলপার—ধারণা থেকে বাস্তবায়ন",
    aboutBody:
      "আমি নিজেই পরিকল্পনা করি, ডিজাইন করি, কোড লিখি, ফ্রন্টএন্ড ও ব্যাকএন্ড যুক্ত করি এবং ব্যবহার করার অভিজ্ঞতা পরীক্ষা করি। লক্ষ্যটি সহজ: দরকারি ডিজিটাল কাজগুলোকে এক জায়গায় আরও সহজ ও সবার নাগালে নিয়ে আসা।",
    fact1Value: "২ মাস",
    fact1Label: "একটানা নির্মাণের সময়",
    fact2Value: "একজন নির্মাতা",
    fact2Label: "ফুল-স্ট্যাক কাজ নিজের হাতে",
    fact3Value: "একটি লক্ষ্য",
    fact3Label: "দৈনন্দিন কাজ আরও সহজ করা",
    journeyEyebrow: "এ পর্যন্ত যাত্রা",
    journeyTitle: "ছোট শুরু, উদ্দেশ্য স্পষ্ট",
    journeyIntro:
      "‘সেবা লাগবে’ এখনো গড়ে উঠছে। এখানে তিনটি বাস্তব ধাপে যাত্রাটা তুলে ধরা হলো—এটি কোনো বড় দলের বা বহু বছরের প্রতিষ্ঠানের সাজানো গল্প নয়।",
    step1Title: "ভাবনার শুরু",
    step1Body:
      "দৈনন্দিন ডিজিটাল কাজের জন্য একটি ব্যবহারিক জায়গা তৈরি করা, যাতে মানুষ অনেকগুলো বিচ্ছিন্ন টুলের মধ্যে ঘুরে না বেড়িয়ে প্রয়োজনীয় কাজ করতে পারেন।",
    step2Title: "দুই মাসের হাতে-কলমে নির্মাণ",
    step2Body:
      "পেজ সাজানো, ফুল-স্ট্যাক ফিচার তৈরি, বিভিন্ন কাজের ধাপ যুক্ত করা, কী ঠিকমতো কাজ করছে তা পরীক্ষা করা এবং প্ল্যাটফর্মটিকে ধীরে ধীরে আরও উন্নত করা।",
    step3Title: "আগামীর অধ্যায়",
    step3Body:
      "এখনকার ফিচারগুলো উন্নত করা, ব্যবহারকারীদের মতামত শোনা, দরকারি সুবিধা যোগ করা এবং দায়িত্বশীলভাবে প্ল্যাটফর্মটিকে এগিয়ে নিতে উপযুক্ত সহযোগী খুঁজে নেওয়া।",
    valuesEyebrow: "যে নীতিগুলো কাজকে পথ দেখায়",
    valuesTitle: "প্ল্যাটফর্ম তৈরির মূল ভাবনা",
    value1Title: "দেখনদারির আগে কার্যকারিতা",
    value1Body:
      "এমন ফিচারকে অগ্রাধিকার দেওয়া, যা বাস্তব কাজে লাগে এবং ব্যবহারকে সহজ করে।",
    value2Title: "তৈরি, পরীক্ষা, উন্নতি",
    value2Body:
      "পণ্যটি সম্পূর্ণ—এমন ভান না করে নিয়মিত শেখা, পরীক্ষা করা ও খুঁটিনাটি ঠিক করা।",
    value3Title: "স্বচ্ছভাবে এগিয়ে চলা",
    value3Body:
      "কোনটি প্রস্তুত, কোনটি এখনো তৈরি হচ্ছে এবং কোথায় সহযোগিতা কাজে লাগবে—তা পরিষ্কার রাখা।",
    openLabel: "সবার জন্য আমন্ত্রণ",
    openTitle: "আজ ‘সেবা লাগবে’ একার হাতে তৈরি হচ্ছে। আগামী পথটা একসঙ্গে এগিয়ে নেওয়া যায়।",
    openBody:
      "আপনি ডেভেলপার, ডিজাইনার, কনটেন্ট নির্মাতা, মার্কেটার—অথবা নতুন ভাবনা ও কাজের আগ্রহ নিয়ে যুক্ত হতে চান, তাহলে কথা বলতে চাই। আপনি প্ল্যাটফর্ম উন্নত করতে, নিজের দক্ষতা দিয়ে প্রকল্পে অবদান রাখতে, কিংবা দীর্ঘমেয়াদি সহযোগিতা বা ব্যবসায়িক অংশীদারত্বের সম্ভাবনা নিয়ে আলোচনা করতে পারেন। কোনো সিদ্ধান্তের আগে কাজের ধরন ও শর্ত খোলাখুলিভাবে আলোচনা করে নেওয়া হবে।",
    primaryCta: "সহযোগিতা নিয়ে কথা বলুন",
    secondaryCta: "টুলগুলো দেখুন",
    smallNote: "নিজের হাতে তৈরি। আন্তরিক সহযোগিতার জন্য উন্মুক্ত।",
  },
} as const;

const milestones = [
  { number: "01", icon: Lightbulb, title: "step1Title", body: "step1Body" },
  { number: "02", icon: Code2, title: "step2Title", body: "step2Body" },
  { number: "03", icon: Rocket, title: "step3Title", body: "step3Body" },
] as const;

const principles = [
  { icon: Target, title: "value1Title", body: "value1Body" },
  { icon: Compass, title: "value2Title", body: "value2Body" },
  { icon: Heart, title: "value3Title", body: "value3Body" },
] as const;

export default function AboutContent() {
  const { locale } = useI18n();
  const t = copy[locale === "bn" ? "bn" : "en"];

  return (
    <div className="min-h-screen overflow-hidden bg-[#FFFDF3] text-slate-900">
      <section className="relative isolate overflow-hidden border-b border-amber-100/80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(96,100,240,0.13),transparent_55%),linear-gradient(180deg,#FFFBE6_0%,#FFFDF5_72%,#FFFFFF_100%)]">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-44 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/75 px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm shadow-indigo-900/5 backdrop-blur">
              <Sparkles size={14} /> {t.eyebrow}
            </span>
            <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">{t.titleA}</span>
              <span className="mt-1 block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text pb-1 text-transparent">
                {t.titleB}
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">
              {t.intro}
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              {t.introNote}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:jahidulhassansrizon@gmail.com?subject=Let%27s%20collaborate%20on%20Sohoj%20Hub"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {t.primaryCta}
                <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                href="/sohoj-tools"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {t.secondaryCta}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
            {[
              { value: t.fact1Value, label: t.fact1Label, icon: Rocket },
              { value: t.fact2Value, label: t.fact2Label, icon: Code2 },
              { value: t.fact3Value, label: t.fact3Label, icon: Target },
            ].map((fact) => {
              const Icon = fact.icon;
              return (
                <div key={fact.value} className="group flex items-center gap-4 rounded-2xl border border-white/90 bg-white/75 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(59,75,160,0.10)] sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-black tracking-tight text-slate-900 sm:text-2xl">{fact.value}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-500">{fact.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">{t.aboutLabel}</p>
          <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{t.aboutTitle}</h2>
          <div className="mt-5 h-1 w-16 rounded-full bg-gradient-to-r from-blue-600 to-violet-600" />
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.045)] sm:p-8 lg:p-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-indigo-600/20">
            <Code2 size={23} />
          </div>
          <p className="text-base leading-8 text-slate-600 sm:text-lg sm:leading-9">{t.aboutBody}</p>
          <div className="mt-7 flex items-start gap-3 rounded-2xl bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-900 ring-1 ring-inset ring-emerald-100">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            <span>{t.smallNote}</span>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/75">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-100">
              <Compass size={14} /> {t.journeyEyebrow}
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.journeyTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">{t.journeyIntro}</p>
          </div>

          <div className="relative mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-blue-200 via-violet-200 to-amber-200 md:block" />
            {milestones.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number} className="relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-[0.15em] text-slate-300">{item.number}</span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-inset ring-indigo-100"><Icon size={22} /></span>
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold leading-7 text-slate-900">{t[item.title]}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{t[item.body]}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">{t.valuesEyebrow}</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.valuesTitle}</h2>
          </div>
          <Sparkles className="hidden text-violet-300 sm:block" size={34} />
        </div>
        <div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {principles.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.035)] sm:p-7">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? "bg-blue-50 text-blue-600" : index === 1 ? "bg-violet-50 text-violet-600" : "bg-amber-50 text-amber-600"}`}><Icon size={22} /></span>
                <h3 className="mt-5 text-lg font-extrabold text-slate-900">{t[item.title]}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{t[item.body]}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[#070B1C] px-6 py-10 text-white shadow-[0_28px_80px_rgba(9,13,35,0.22)] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-indigo-200">
                <Handshake size={15} /> {t.openLabel}
              </span>
              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.7rem]">{t.openTitle}</h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">{t.openBody}</p>
            </div>
            <div className="flex flex-col items-start gap-3 lg:min-w-[225px] lg:items-stretch">
              <a
                href="mailto:jahidulhassansrizon@gmail.com?subject=Let%27s%20collaborate%20on%20Sohoj%20Hub"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                {t.primaryCta}<ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link href="/sohoj-tools" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/[0.07]">
                {t.secondaryCta}<ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className="relative mt-10 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-400">
            <Users size={14} className="text-indigo-300" />
            {t.smallNote}
            <ArrowDownRight className="ml-auto hidden text-indigo-300 sm:block" size={20} />
          </div>
        </div>
      </section>
    </div>
  );
}
