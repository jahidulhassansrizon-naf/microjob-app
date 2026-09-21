"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Link2, Search } from "lucide-react";

export interface UsefulLinksProps {
  onBack: () => void;
}

type UsefulLink = {
  name: string;
  short: string;
  url: string;
};

const usefulLinks: UsefulLink[] = [
  {
    name: "Bangladesh National Portal",
    short: "BD",
    url: "https://bangladesh.gov.bd",
  },
  {
    name: "Teletalk Jobs",
    short: "T",
    url: "https://alljobs.teletalk.com.bd",
  },
  {
    name: "Education Board Results",
    short: "EB",
    url: "https://educationboardresults.gov.bd",
  },
  {
    name: "National University",
    short: "NU",
    url: "https://www.nu.ac.bd",
  },
  {
    name: "Bangladesh Public Service Commission",
    short: "BPSC",
    url: "https://bpsc.gov.bd",
  },
  {
    name: "NTRCA",
    short: "NTR",
    url: "https://ntrca.gov.bd",
  },
  {
    name: "Directorate of Secondary & Higher Education",
    short: "DSHE",
    url: "https://dshe.gov.bd",
  },
  {
    name: "Directorate of Primary Education",
    short: "DPE",
    url: "https://dpe.gov.bd",
  },
  {
    name: "Ministry of Education",
    short: "MOE",
    url: "https://moedu.gov.bd",
  },
  {
    name: "Technical Education Board",
    short: "BTEB",
    url: "https://bteb.gov.bd",
  },
  {
    name: "Bangladesh Army",
    short: "BA",
    url: "https://join.army.mil.bd",
  },
  {
    name: "Bangladesh Navy",
    short: "BN",
    url: "https://joinnavy.mil.bd",
  },
  {
    name: "Bangladesh Air Force",
    short: "BAF",
    url: "https://joinairforce.baf.mil.bd",
  },
  {
    name: "Bangladesh Police",
    short: "BP",
    url: "https://police.gov.bd",
  },
  {
    name: "Bangladesh Railway",
    short: "BR",
    url: "https://railway.gov.bd",
  },
  {
    name: "Bangladesh Bank",
    short: "BB",
    url: "https://www.bb.org.bd",
  },
  {
    name: "Bankers Selection Committee",
    short: "BSC",
    url: "https://erecruitment.bb.org.bd",
  },
  {
    name: "Sonali Bank",
    short: "SB",
    url: "https://www.sonalibank.com.bd",
  },
  {
    name: "Janata Bank",
    short: "JB",
    url: "https://www.jb.com.bd",
  },
  {
    name: "Agrani Bank",
    short: "AB",
    url: "https://www.agranibank.org",
  },
  {
    name: "Rupali Bank",
    short: "RB",
    url: "https://www.rupalibank.org",
  },
  {
    name: "BEPZA",
    short: "BEPZA",
    url: "https://bepza.gov.bd",
  },
  {
    name: "BHTPA",
    short: "BHTPA",
    url: "https://bhtpa.gov.bd",
  },
  {
    name: "Department of Technical Education",
    short: "DTE",
    url: "https://dte.gov.bd",
  },
  {
    name: "NID Services",
    short: "NID",
    url: "https://services.nidw.gov.bd",
  },
  {
    name: "e-Passport",
    short: "PP",
    url: "https://www.epassport.gov.bd",
  },
  {
    name: "Dhaka University",
    short: "DU",
    url: "https://www.du.ac.bd",
  },
  {
    name: "Bangladesh Open University",
    short: "BOU",
    url: "https://bou.ac.bd",
  },
  {
    name: "National Skills Development Authority",
    short: "NSDA",
    url: "https://nsda.gov.bd",
  },
  {
    name: "Health Services",
    short: "DGHS",
    url: "https://dghs.gov.bd",
  },
];

const backgrounds = [
  "bg-emerald-50 text-emerald-700",
  "bg-blue-50 text-blue-700",
  "bg-yellow-50 text-yellow-700",
  "bg-violet-50 text-violet-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-700",
  "bg-orange-50 text-orange-700",
  "bg-lime-50 text-lime-700",
];

function getFavicon(url: string) {
  try {
    const host = new URL(url).hostname;

    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return "";
  }
}

export default function UsefulLinks({ onBack }: UsefulLinksProps) {
  const [query, setQuery] = useState("");

  const filteredLinks = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return usefulLinks;
    }

    return usefulLinks.filter((link) => {
      return (
        link.name.toLowerCase().includes(search) ||
        link.short.toLowerCase().includes(search)
      );
    });
  }, [query]);

  return (
    <section>
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={14} />
            Back to Jobs
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF1F9] text-[#356EAA]">
              <Link2 size={17} />
            </div>

            <h2 className="text-[23px] font-black text-gray-950">
              Useful Links
            </h2>
          </div>

          <p className="mt-1 text-xs font-medium text-gray-500">
            Official and frequently-used websites in one place.
          </p>
        </div>

        <div className="text-[11px] font-medium text-gray-400">
          {filteredLinks.length} links
        </div>
      </div>

      {/* SEARCH */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search useful links..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-xs font-semibold text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#D6A11E]"
          />
        </div>
      </div>

      {/* LINKS */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredLinks.map((link, index) => {
          const favicon = getFavicon(link.url);
          const tone = backgrounds[index % backgrounds.length];

          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group relative flex min-h-[138px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center shadow-[0_2px_8px_rgba(16,24,40,.04)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#6AC7A4]" />

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-[11px] font-black ${tone}`}
              >
                {favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    className="h-9 w-9 rounded-xl object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  link.short
                )}
              </div>

              <div className="mt-3 line-clamp-2 text-[11px] font-black leading-4 text-gray-800">
                {link.name}
              </div>

              <div className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-gray-300 transition group-hover:text-gray-500">
                <ExternalLink size={11} />
                Open
              </div>
            </a>
          );
        })}
      </div>

      {filteredLinks.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm font-black text-gray-700">
            No useful links found.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Try another search keyword.
          </p>
        </div>
      )}

      {/* DISCLAIMER */}
      <div className="mt-6 rounded-2xl border border-[#F1D7A7] bg-[#FFF9E7] p-5">
        <p className="text-xs font-black text-[#B8790C]">
          Warning &amp; Disclaimer
        </p>

        <p className="mt-2 text-[11px] leading-5 text-gray-600">
          Always verify a notice, payment request, form, or personal-data
          submission on the official organization website before proceeding.
          Links are provided for convenience and may change over time.
        </p>
      </div>
    </section>
  );
}
