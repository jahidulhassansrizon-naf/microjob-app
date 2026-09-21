"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";

import JobsToolButtons from "./_components/JobsToolButtons";
import AdvertisementPosters from "./_components/AdvertisementPosters";
import UsefulLinks from "./_components/UsefulLinks";

import {
  Bookmark,
  Calendar,
  CalendarDays,
  ChevronDown,
  Filter,
  Globe,
  Loader2,
  Search,
  Users,
  X,
  ArrowLeft,
  ArrowRight,
  Accessibility,
  Play,
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  category: string;
  type: string;
  tags: string[];
  posts: string;
  published: string;
  deadlineText: string;
  deadlineDate: string;
  expired?: boolean;
  accent: "green" | "yellow" | "red";
}

type ActiveView = "jobs" | "advertisements" | "useful-links";

const jobsData: Job[] = [
  {
    id: 1,
    title: "কারিগরি শিক্ষা অধিদপ্তর (ডিটিই)",
    category: "ভার্চুয়াল অ্যাসিস্ট্যান্ট (প্রোডাকশনাল)",
    type: "Government",
    tags: ["Government", "ভার্চুয়াল অ্যাসিস্ট্যান্ট"],
    posts: "৫ জন",
    published: "২১ আগস্ট",
    deadlineText: "১৯ দিন বাকি",
    deadlineDate: "২১ সেপ্টেম্বর, ২০২৬",
    accent: "green",
  },
  {
    id: 2,
    title: "মেঘনা পেট্রোলিয়াম পিএলসি",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government", "৬টি ক্যাটাগরি"],
    posts: "১৫ জন",
    published: "৩০ আগস্ট",
    deadlineText: "২৫ দিন বাকি",
    deadlineDate: "৩০ সেপ্টেম্বর, ২০২৬",
    accent: "green",
  },
  {
    id: 3,
    title: "বাংলাদেশ হাই-টেক পার্ক কর্তৃপক্ষ",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government", "৯ম-১০ম গ্রেড"],
    posts: "৪২ জন",
    published: "২৬ আগস্ট",
    deadlineText: "২১ দিন বাকি",
    deadlineDate: "২৬ সেপ্টেম্বর, ২০২৬",
    accent: "green",
  },
  {
    id: 4,
    title: "জাতীয় জনসংখ্যা গবেষণা ও প্রশিক্ষণ ইনস্টিটিউট (নিপোর্ট)",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government", "বিভিন্ন পদ"],
    posts: "৮৬ জন",
    published: "২৯ আগস্ট",
    deadlineText: "৩ দিন বাকি",
    deadlineDate: "৮ সেপ্টেম্বর, ২০২৬",
    expired: true,
    accent: "red",
  },
  {
    id: 5,
    title: "কারিগরি ও মাদরাসা শিক্ষা বিভাগ (টিএমইডি)",
    category: "বিভিন্ন পদ",
    type: "Education",
    tags: ["Government", "৫ ক্যাটাগরি"],
    posts: "২৬ জন",
    published: "২৭ আগস্ট",
    deadlineText: "২২ দিন বাকি",
    deadlineDate: "২৭ সেপ্টেম্বর, ২০২৬",
    accent: "yellow",
  },
  {
    id: 6,
    title: "বিভাগীয় কমিশনারের কার্যালয়, ঢাকা",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government", "৯ম-২০তম গ্রেড"],
    posts: "২০ জন",
    published: "২৬ আগস্ট",
    deadlineText: "২২ দিন বাকি",
    deadlineDate: "২৭ সেপ্টেম্বর, ২০২৬",
    accent: "yellow",
  },
  {
    id: 7,
    title: "কর কমিশনারের কার্যালয়, কর অঞ্চল-২, চট্টগ্রাম",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government"],
    posts: "৪২ জন",
    published: "২৫ আগস্ট",
    deadlineText: "১৩ দিন বাকি",
    deadlineDate: "১৮ সেপ্টেম্বর, ২০২৬",
    accent: "yellow",
  },
  {
    id: 8,
    title:
      "বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ, চট্টগ্রাম ইপিজেড হাসপাতাল",
    category: "বিভিন্ন পদ",
    type: "Government",
    tags: ["Government", "মেডিকেল অফিসার"],
    posts: "২০ জন",
    published: "২৪ আগস্ট",
    deadlineText: "২৫ দিন বাকি",
    deadlineDate: "৩০ সেপ্টেম্বর, ২০২৬",
    accent: "green",
  },
  {
    id: 9,
    title: "মাদকদ্রব্য নিয়ন্ত্রণ অধিদপ্তর",
    category: "সহকারী প্রসিকিউটর",
    type: "Government",
    tags: ["Government", "সহকারী প্রসিকিউটর"],
    posts: "৪১ জন",
    published: "১৭ আগস্ট",
    deadlineText: "সময় শেষ",
    deadlineDate: "২০ সেপ্টেম্বর, ২০২৬",
    expired: true,
    accent: "red",
  },
  {
    id: 10,
    title: "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (বিএমইবি)",
    category: "বিভিন্ন পদ",
    type: "Education",
    tags: ["Government", "৬টি ক্যাটাগরি"],
    posts: "৪৬ জন",
    published: "৯ আগস্ট",
    deadlineText: "সময় শেষ",
    deadlineDate: "৯ সেপ্টেম্বর, ২০২৬",
    expired: true,
    accent: "red",
  },
  {
    id: 11,
    title: "বাংলাদেশ জুডিসিয়াল সার্ভিস কমিশন (বিজেএসসি)",
    category: "সহকারী জজ (সিভিল জজ - প্রবেশ পদ)",
    type: "Government",
    tags: ["Government", "সহকারী জজ"],
    posts: "২৫০ জন",
    published: "২৪ জুলাই",
    deadlineText: "সময় শেষ",
    deadlineDate: "৬ সেপ্টেম্বর, ২০২৬",
    expired: true,
    accent: "red",
  },
];

const filters = [
  { key: "all", label: "All" },
  { key: "Government", label: "Government" },
  { key: "Defense", label: "Defense" },
  { key: "Bank", label: "Bank" },
  { key: "Education", label: "Education" },
  { key: "Private", label: "Private" },
  { key: "expired", label: "Expired" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function bengaliNumber(value: number) {
  const digits = "০১২৩৪৫৬৭৮৯";

  return String(value).replace(/\d/g, (digit) => digits[Number(digit)]);
}

function JobLogo({ accent }: { accent: Job["accent"] }) {
  const colors =
    accent === "red"
      ? "border-red-100 bg-red-50 text-red-600"
      : accent === "yellow"
        ? "border-amber-100 bg-amber-50 text-amber-700"
        : "border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${colors}`}
    >
      বাংলা
    </div>
  );
}

export default function JobsPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>("jobs");

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  const [sortMode, setSortMode] = useState<"newest" | "deadline" | "posts">(
    "newest",
  );

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 9;

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = jobsData.filter((job) => {
      const matchesFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "expired"
            ? Boolean(job.expired)
            : job.type === activeFilter;

      const matchesSearch =
        !query ||
        `${job.title} ${job.category} ${job.type} ${job.tags.join(" ")}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      if (sortMode === "posts") {
        return (
          Number(b.posts.replace(/\D/g, "")) -
          Number(a.posts.replace(/\D/g, ""))
        );
      }

      if (sortMode === "deadline") {
        if (a.expired && !b.expired) return 1;
        if (!a.expired && b.expired) return -1;

        return a.id - b.id;
      }

      return a.id - b.id;
    });

    return result;
  }, [activeFilter, searchQuery, sortMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, sortMode]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / pageSize));

  const visibleJobs = filteredJobs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      all: jobsData.length,
      Government: 0,
      Defense: 0,
      Bank: 0,
      Education: 0,
      Private: 0,
      expired: 0,
    };

    jobsData.forEach((job) => {
      result[job.type] = (result[job.type] || 0) + 1;

      if (job.expired) {
        result.expired += 1;
      }
    });

    return result;
  }, []);

  const toggleSavedJob = (id: number) => {
    setSavedJobs((current) =>
      current.includes(id)
        ? current.filter((jobId) => jobId !== id)
        : [...current, id],
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBF3EE]">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-semibold text-gray-600 shadow-sm">
          <Loader2 size={16} className="animate-spin text-[#FF8A00]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF3EE] text-gray-900">
      <DashboardNavbar />

      <main className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-8 md:px-6">
        {/* ========================================= */}
        {/* JOBS MAIN PAGE */}
        {/* ========================================= */}

        {activeView === "jobs" && (
          <>
            {/* HEADER */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-[24px] font-black leading-none tracking-tight text-gray-950">
                  Government &amp; Private Jobs
                </h1>

                <p className="mt-2 text-[12px] font-medium text-gray-500">
                  Ongoing recruitment notices — apply in one click, never miss a
                  deadline.
                </p>
              </div>

              <div className="pb-1 text-[11px] font-medium text-gray-500">
                Sunday, 28 June 2026
              </div>
            </div>

            {/* TOP TOOLS + TOTAL */}
            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <JobsToolButtons
                onCreateAdvertisement={() => setActiveView("advertisements")}
                onUsefulLinks={() => setActiveView("useful-links")}
              />

              <div className="flex items-center gap-2 px-1 text-[11px] font-semibold text-gray-500">
                <span className="text-[#54728C]">▣</span>

                <span className="font-black text-gray-800">
                  {bengaliNumber(jobsData.length)}
                </span>

                <span>Total jobs listed</span>
              </div>
            </div>

            {/* SEARCH / SORT BAR */}
            <section className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by organization or position..."
                  className="h-[40px] w-full rounded-xl border border-gray-200 bg-white px-11 pr-10 text-[11px] font-medium text-gray-700 shadow-sm outline-none placeholder:text-gray-400 focus:border-[#E7A31C]"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setSavedJobs([])}
                  className="flex h-[40px] items-center gap-1.5 px-4 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
                >
                  <Bookmark size={13} />
                  Saved
                  <span className="rounded-full bg-gray-100 px-1.5 text-[9px] text-gray-500">
                    {savedJobs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSortMode("deadline")}
                  className={`h-[40px] border-l border-gray-200 px-4 text-[11px] font-bold ${
                    sortMode === "deadline"
                      ? "bg-[#FFF7E7] text-[#C47B00]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Deadline
                </button>

                <button
                  type="button"
                  onClick={() => setSortMode("posts")}
                  className={`h-[40px] border-l border-gray-200 px-4 text-[11px] font-bold ${
                    sortMode === "posts"
                      ? "bg-[#FFF7E7] text-[#C47B00]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  More posts
                </button>

                <button
                  type="button"
                  onClick={() => setSortMode("newest")}
                  className={`h-[40px] border-l border-gray-200 px-4 text-[11px] font-bold ${
                    sortMode === "newest"
                      ? "bg-[#FFF7E7] text-[#C47B00]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Newest
                </button>
              </div>
            </section>

            {/* FILTER PILLS */}
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.key;

                return (
                  <button
                    type="button"
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-bold transition ${
                      isActive
                        ? filter.key === "expired"
                          ? "border-red-200 bg-[#FFF5F5] text-red-500"
                          : "border-[#E7A31C] bg-white text-[#C27800]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {filter.label}

                    <span className="rounded-full bg-gray-100 px-1.5 text-[9px] font-black text-gray-500">
                      {bengaliNumber(counts[filter.key] || 0)}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                className="ml-auto hidden items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-[10px] font-bold text-gray-500 md:flex"
              >
                <Filter size={12} />
                Filters
                <ChevronDown size={12} />
              </button>
            </div>

            {/* NOTICE COUNT */}
            <div className="mt-3 text-[11px] font-medium text-gray-500">
              {bengaliNumber(filteredJobs.length)} notices found
            </div>

            {/* CARDS */}
            <section className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleJobs.map((job) => {
                const saved = savedJobs.includes(job.id);

                const borderColor =
                  job.accent === "green"
                    ? "#4AA47A"
                    : job.accent === "yellow"
                      ? "#D8AA2B"
                      : "#D25B51";

                return (
                  <article
                    key={job.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(16,24,40,.04)] transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: borderColor,
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <JobLogo accent={job.accent} />

                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-[13px] font-black leading-[1.35] text-gray-950">
                            {job.title}
                          </h2>

                          <p className="mt-1 line-clamp-1 text-[10px] font-medium text-gray-400">
                            {job.category}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSavedJob(job.id)}
                          className={`rounded-lg border p-2 ${
                            saved
                              ? "border-amber-200 bg-amber-50 text-amber-600"
                              : "border-gray-200 text-gray-400"
                          }`}
                        >
                          <Bookmark
                            size={14}
                            fill={saved ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.tags.map((tag, index) => (
                          <span
                            key={`${job.id}-${index}`}
                            className={`rounded-md px-2 py-1 text-[9px] font-black ${
                              index === 0
                                ? "bg-orange-50 text-[#C26C20]"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                        <div className="flex items-start gap-1.5">
                          <Users size={12} className="mt-0.5 text-gray-400" />

                          <div className="text-[9px] text-gray-400">
                            Posts
                            <div className="font-black text-gray-700">
                              {job.posts}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <Calendar
                            size={12}
                            className="mt-0.5 text-gray-400"
                          />

                          <div className="text-[9px] text-gray-400">
                            Published
                            <div className="font-black text-gray-700">
                              {job.published}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <Globe size={12} className="mt-0.5 text-gray-400" />

                          <div className="text-[9px] text-gray-400">
                            Online
                            <div className="font-black text-gray-700">
                              আবেদন
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
                      <div>
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black ${
                            job.expired
                              ? "bg-red-50 text-red-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {job.expired ? "◷ সময় শেষ" : `◷ ${job.deadlineText}`}
                        </span>

                        <p className="mt-1 text-[9px] text-gray-400">
                          Deadline {job.deadlineDate}
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black text-gray-700 hover:bg-gray-50"
                        >
                          Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            window.alert(`Apply clicked for: ${job.title}`)
                          }
                          className="rounded-xl bg-[#F19A00] px-3.5 py-2 text-[10px] font-black text-white hover:bg-[#DE8E00]"
                        >
                          Apply →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* MAIN PAGE PAGINATION */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-[10px] font-medium text-gray-400">
                Showing{" "}
                {filteredJobs.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
                –{Math.min(currentPage * pageSize, filteredJobs.length)} of{" "}
                {filteredJobs.length}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={13} />
                </button>

                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`h-8 min-w-8 rounded-lg px-2.5 text-[10px] font-black ${
                        pageNumber === currentPage
                          ? "bg-[#E79A00] text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {bengaliNumber(pageNumber)}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(pageCount, page + 1))
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ADVERTISEMENT */}
        {activeView === "advertisements" && (
          <AdvertisementPosters onBack={() => setActiveView("jobs")} />
        )}

        {/* USEFUL LINKS */}
        {activeView === "useful-links" && (
          <UsefulLinks onBack={() => setActiveView("jobs")} />
        )}
      </main>

      {/* DETAILS MODAL */}
      {selectedJob && activeView === "jobs" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#CC8700]">
                  Job Details
                </p>

                <h3 className="mt-2 text-lg font-black text-gray-950">
                  {selectedJob.title}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {selectedJob.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#FFF8E9] p-4">
                <div className="text-[10px] text-gray-400">Posts</div>

                <div className="mt-1 font-black text-gray-900">
                  {selectedJob.posts}
                </div>
              </div>

              <div className="rounded-2xl bg-[#F2FAF6] p-4">
                <div className="text-[10px] text-gray-400">Published</div>

                <div className="mt-1 font-black text-gray-900">
                  {selectedJob.published}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-[10px] text-gray-400">Deadline</div>

                <div className="mt-1 font-black text-gray-900">
                  {selectedJob.deadlineDate}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="text-[10px] text-gray-400">Type</div>

                <div className="mt-1 font-black text-gray-900">
                  {selectedJob.type}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                window.alert(`Apply clicked for: ${selectedJob.title}`)
              }
              className="mt-5 w-full rounded-2xl bg-[#F19A00] py-3 text-xs font-black text-white hover:bg-[#DE8E00]"
            >
              Apply Now →
            </button>
          </div>
        </div>
      )}

      {/* VIDEO-LIKE FLOATING CONTROLS */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5A000] text-white shadow-lg"
        >
          <Accessibility size={18} />
        </button>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E33930] text-white shadow-lg"
        >
          <Play size={16} fill="currentColor" />
        </button>
      </div>

      <a
        href="https://wa.me/8801783666743"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#22C866] text-white shadow-[0_10px_28px_rgba(34,200,102,.35)]"
      >
        <span className="text-xs font-black">WA</span>
      </a>
    </div>
  );
}
