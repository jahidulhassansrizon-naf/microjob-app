"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowLeft, Megaphone, Printer } from "lucide-react";

export interface AdvertisementPostersProps {
  onBack: () => void;
}

type Poster = {
  id: number;
  title: string;
  subtitle: string;
  published: string;
  deadline: string;
  vacancies: string;
  qualification: string;
  age: string;
  color: "green" | "red";
};

const posters: Poster[] = [
  {
    id: 1,
    title: "কর কমিশনারের কার্যালয়, কর অঞ্চল-১৬, ঢাকা",
    subtitle: "৬ ক্যাটাগরির বিভিন্ন পদ",
    published: "১৪ সেপ্টেম্বর",
    deadline: "১০ অক্টোবর",
    vacancies: "৬৯",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 2,
    title: "জেলা প্রশাসকের কার্যালয়, নওগাঁ",
    subtitle: "বিভিন্ন পদ নিয়োগ",
    published: "১৪ সেপ্টেম্বর",
    deadline: "১১ অক্টোবর",
    vacancies: "২৬",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 3,
    title: "ধুনট, বগুড়া উপজেলা নির্বাহী অফিসারের কার্যালয়",
    subtitle: "পদ ক্যাটাগরি ০৩ টি",
    published: "১৬ সেপ্টেম্বর",
    deadline: "২৭ সেপ্টেম্বর",
    vacancies: "১১",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 4,
    title: "চট্টগ্রাম বন্দর কর্তৃপক্ষ (সিপিএ)",
    subtitle: "বিভিন্ন পদ নিয়োগ",
    published: "১০ সেপ্টেম্বর",
    deadline: "১৪ অক্টোবর",
    vacancies: "১৯",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 5,
    title: "বর্ডার গার্ড বাংলাদেশ (বিজিবি)",
    subtitle: "সিপাহী (জিডি)",
    published: "১২ সেপ্টেম্বর",
    deadline: "১৪ সেপ্টেম্বর",
    vacancies: "৫০০",
    qualification: "—",
    age: "—",
    color: "red",
  },
  {
    id: 6,
    title: "প্রাণিসম্পদ অধিদপ্তর (ডিএলএস)",
    subtitle: "বিভিন্ন পদ",
    published: "১০ সেপ্টেম্বর",
    deadline: "৩০ সেপ্টেম্বর",
    vacancies: "৫৬৮",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 7,
    title: "শ্রমী কল্যাণ ফাউন্ডেশন (বিআইডব্লিউটিএ)",
    subtitle: "পদ ক্যাটাগরি ০৬ টি",
    published: "০৮ সেপ্টেম্বর",
    deadline: "২৮ সেপ্টেম্বর",
    vacancies: "১১",
    qualification: "—",
    age: "—",
    color: "red",
  },
  {
    id: 8,
    title: "বাংলাদেশ জাহাজ পুনঃপ্রক্রিয়াজাতকরণ বোর্ড",
    subtitle: "বিভিন্ন পদ",
    published: "০৮ সেপ্টেম্বর",
    deadline: "০৫ অক্টোবর",
    vacancies: "৪২",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 9,
    title: "বাংলাদেশ সমরাস্ত্র কারখানা",
    subtitle: "বিভিন্ন পদ",
    published: "০৭ সেপ্টেম্বর",
    deadline: "০৩ অক্টোবর",
    vacancies: "৩৮",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 10,
    title: "বাংলাদেশ হাই-টেক পার্ক কর্তৃপক্ষ",
    subtitle: "বিভিন্ন পদ",
    published: "২৮ আগস্ট",
    deadline: "২৬ সেপ্টেম্বর",
    vacancies: "৪২",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 11,
    title: "কারিগরি ও মাদরাসা শিক্ষা বিভাগ (টিএমইডি)",
    subtitle: "বিভিন্ন পদ",
    published: "২৭ আগস্ট",
    deadline: "২৭ সেপ্টেম্বর",
    vacancies: "২৬",
    qualification: "—",
    age: "—",
    color: "green",
  },
  {
    id: 12,
    title: "বিভাগীয় কমিশনারের কার্যালয়, ঢাকা",
    subtitle: "বিভিন্ন পদ",
    published: "২৬ আগস্ট",
    deadline: "২৭ সেপ্টেম্বর",
    vacancies: "২০",
    qualification: "—",
    age: "—",
    color: "green",
  },
];

function PosterLogo({ color }: { color: Poster["color"] }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 bg-white text-xs font-black ${
        color === "red"
          ? "border-red-200 text-red-600"
          : "border-emerald-100 text-[#0B8F62]"
      }`}
    >
      বাংলা
    </div>
  );
}

function downloadPoster(poster: Poster) {
  const titleLines = poster.title.match(/.{1,20}/g)?.slice(0, 4) || [
    poster.title,
  ];

  const titleSvg = titleLines
    .map(
      (line, index) =>
        `<text x="360" y="${138 + index * 28}" text-anchor="middle" font-size="25" font-weight="900" fill="#F4D24D">${line}</text>`,
    )
    .join("");

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1040" viewBox="0 0 720 1040">
    <rect width="720" height="1040" fill="#0A4432"/>
    <rect x="16" y="16" width="688" height="1008" rx="22" fill="none" stroke="#D4C44A" stroke-width="5"/>
    <rect x="28" y="28" width="664" height="984" rx="18" fill="none" stroke="#507A61" stroke-width="2"/>

    <rect x="45" y="45" width="84" height="84" rx="16" fill="#FFFFFF"/>
    <text x="87" y="94" text-anchor="middle" font-size="20" font-weight="900" fill="#09855C">বাংলা</text>

    <rect x="544" y="45" width="128" height="70" rx="15" fill="#D1493D"/>
    <text x="608" y="75" text-anchor="middle" font-size="15" font-weight="900" fill="#FFFFFF">Recruitment</text>
    <text x="608" y="96" text-anchor="middle" font-size="15" font-weight="900" fill="#FFFFFF">Notice</text>

    ${titleSvg}

    <text x="360" y="256" text-anchor="middle" font-size="19" font-weight="700" fill="#FFFFFF">${poster.subtitle}</text>

    <rect x="45" y="285" width="300" height="44" rx="22" fill="#062E22"/>
    <rect x="375" y="285" width="300" height="44" rx="22" fill="#062E22"/>

    <text x="65" y="313" font-size="15" font-weight="900" fill="#FFFFFF">Start:</text>
    <text x="120" y="313" font-size="15" font-weight="900" fill="#F4D24D">${poster.published}</text>

    <text x="395" y="313" font-size="15" font-weight="900" fill="#FFFFFF">Deadline:</text>
    <text x="490" y="313" font-size="15" font-weight="900" fill="#F4D24D">${poster.deadline}</text>

    <rect x="45" y="355" width="200" height="115" rx="15" fill="#F7F2E7"/>
    <rect x="260" y="355" width="200" height="115" rx="15" fill="#F7F2E7"/>
    <rect x="475" y="355" width="200" height="115" rx="15" fill="#F7F2E7"/>

    <text x="145" y="387" text-anchor="middle" font-size="14" font-weight="800" fill="#0A6D51">Qualification</text>
    <text x="145" y="430" text-anchor="middle" font-size="29" font-weight="900" fill="#253A31">${poster.qualification}</text>

    <text x="360" y="387" text-anchor="middle" font-size="14" font-weight="800" fill="#0A6D51">Vacancies</text>
    <text x="360" y="430" text-anchor="middle" font-size="31" font-weight="900" fill="#B84439">${poster.vacancies} posts</text>

    <text x="575" y="387" text-anchor="middle" font-size="14" font-weight="800" fill="#0A6D51">Age Limit</text>
    <text x="575" y="430" text-anchor="middle" font-size="29" font-weight="900" fill="#253A31">${poster.age}</text>

    <text x="360" y="505" text-anchor="middle" font-size="17" font-weight="700" fill="#FFFFFF">✓ A trusted provider for all kinds of online services.</text>

    <rect x="45" y="540" width="630" height="66" rx="14" fill="#0A9D68" stroke="#D6C54C" stroke-width="3"/>
    <text x="360" y="582" text-anchor="middle" font-size="28" font-weight="900" fill="#FFFFFF">Contact for application</text>

    <line x1="45" y1="638" x2="675" y2="638" stroke="#537662" stroke-width="2"/>

    <text x="360" y="714" text-anchor="middle" font-size="43" font-weight="900" fill="#F4D24D">Dokan Name</text>
    <text x="360" y="754" text-anchor="middle" font-size="20" fill="#B5C4BC">Set address from the button above</text>
    <text x="360" y="800" text-anchor="middle" font-size="29" font-weight="900" fill="#FFFFFF">01783666743</text>

    <text x="360" y="935" text-anchor="middle" font-size="16" font-weight="700" fill="#A5BEB3">SOHOJKAI • JOBS</text>
  </svg>`;

  const blob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `advertisement-${poster.id}.svg`;
  anchor.click();

  URL.revokeObjectURL(url);
}

export default function AdvertisementPosters({
  onBack,
}: AdvertisementPostersProps) {
  const [theme, setTheme] = useState("সবুজ ও সোনালী");

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            Back to jobs
          </button>

          <div className="flex items-center gap-2">
            <Megaphone size={19} className="text-[#C78B00]" />

            <h2 className="text-[23px] font-black">Advertisement Posters</h2>
          </div>

          <p className="mt-1 text-xs font-medium text-gray-500">
            Ready-made recruitment posters — add your shop details and download.
          </p>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
          <span className="text-[#C89515]">◉</span>
          Poster theme:
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            className="bg-transparent font-bold outline-none"
          >
            <option>সবুজ ও সোনালী</option>
            <option>সবুজ ও লাল</option>
            <option>নীল ও সোনালী</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posters.map((poster) => (
          <article
            key={poster.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_14px_rgba(16,24,40,.05)]"
          >
            <div
              className={`p-2.5 ${
                theme === "নীল ও সোনালী" ? "bg-[#083349]" : "bg-[#0B4635]"
              }`}
            >
              <div className="relative overflow-hidden rounded-xl border-2 border-[#CFC050] p-2.5">
                <div className="absolute inset-0 opacity-[0.08]">
                  <div className="grid h-full grid-cols-7 gap-5">
                    {Array.from({ length: 40 }).map((_, index) => (
                      <div
                        key={index}
                        className="border-r border-t border-white"
                      />
                    ))}
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <PosterLogo color={poster.color} />

                    <div className="rounded-lg bg-[#D44C3F] px-3 py-2 text-center text-[9px] font-black leading-3 text-white shadow-md">
                      📢
                      <br />
                      Recruitment
                      <br />
                      Notice
                    </div>
                  </div>

                  <h3 className="mt-3 text-center text-[25px] font-black leading-[1.13] text-[#F4D24D]">
                    {poster.title}
                  </h3>

                  <p className="mt-2 text-center text-[11px] font-bold text-white">
                    {poster.subtitle}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-black text-white">
                    <div className="flex items-center gap-1 rounded-full bg-[#062E22] px-3 py-2">
                      <span>Start:</span>

                      <span className="rounded-full bg-[#F4D24D] px-2 py-1 text-[#26372F]">
                        {poster.published}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-[#062E22] px-3 py-2">
                      <span>Deadline:</span>

                      <span className="rounded-full bg-[#F4D24D] px-2 py-1 text-[#26372F]">
                        {poster.deadline}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#F6F2E8] p-2 text-center">
                      <div className="text-[9px] font-bold text-[#0B6B51]">
                        Qualification:
                      </div>

                      <div className="mt-2 text-lg font-black text-gray-800">
                        {poster.qualification}
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#F6F2E8] p-2 text-center">
                      <div className="text-[9px] font-bold text-[#0B6B51]">
                        Vacancies:
                      </div>

                      <div className="mt-1 text-[27px] font-black leading-none text-[#BB4339]">
                        {poster.vacancies}
                      </div>

                      <div className="text-[10px] font-bold text-gray-700">
                        posts
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#F6F2E8] p-2 text-center">
                      <div className="text-[9px] font-bold text-[#0B6B51]">
                        Age Limit:
                      </div>

                      <div className="mt-2 text-lg font-black text-gray-800">
                        {poster.age}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[9px] font-semibold text-white">
                    ✓ A trusted provider for all kinds of online services.
                  </p>

                  <div className="mt-3 rounded-lg border-2 border-[#D6C74F] bg-[#0A9D68] py-2.5 text-center text-[15px] font-black text-white shadow-sm">
                    Contact for application
                  </div>

                  <div className="mt-3 border-t border-[#466C59] pt-4 text-center">
                    <div className="text-[24px] font-black text-[#F4D24D]">
                      Dokan Name
                    </div>

                    <div className="mt-1 text-[11px] text-[#B8C5BE]">
                      Set address from the button above
                    </div>

                    <div className="mt-1 text-[17px] font-black text-white">
                      01783666743
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 p-3">
              <button
                type="button"
                onClick={() => downloadPoster(poster)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#F19A00] py-2.5 text-[11px] font-black text-white hover:bg-[#DD8E00]"
              >
                <ArrowDownToLine size={14} />
                Download
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[11px] font-black text-gray-700 hover:bg-gray-50"
              >
                <Printer size={14} />
                Print
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
