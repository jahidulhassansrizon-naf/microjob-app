"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Printer,
  FileText,
  ClipboardList,
  Search,
  LayoutGrid,
  List,
  ChevronDown,
  Clock,
  X,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Navbar-এর সাথে মেলানো icon টাইলের রং
const TONES = {
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  cyan: "bg-cyan-50 text-cyan-600 ring-cyan-100",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  slate: "bg-slate-100 text-slate-500 ring-slate-200",
} as const;

type Tone = keyof typeof TONES;
type CategoryId =
  | "generated-images"
  | "print-media"
  | "regular-documents"
  | "question-papers";
type ViewMode = "grid" | "list";

interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const CATEGORY_TABS: CategoryTab[] = [
  {
    id: "generated-images",
    label: "Generated Images",
    icon: ImageIcon,
    tone: "violet",
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText: "Your edited and generated images will appear here.",
  },
  {
    id: "print-media",
    label: "Print Media",
    icon: Printer,
    tone: "cyan",
    searchPlaceholder: "Search print media by name",
    emptyTitle: "No print media yet",
    emptyText:
      "Posters, cards and other print designs you create will be saved here.",
    ctaLabel: "Browse Print Media",
    ctaHref: "/print-media",
  },
  {
    id: "regular-documents",
    label: "Regular Documents",
    icon: FileText,
    tone: "blue",
    searchPlaceholder: "Search documents by name",
    emptyTitle: "No documents yet",
    emptyText: "Documents you create will be saved here.",
  },
  {
    id: "question-papers",
    label: "Question Papers",
    icon: ClipboardList,
    tone: "red",
    searchPlaceholder: "Search question papers by name",
    emptyTitle: "No question papers yet",
    emptyText: "Question papers you create will be saved here.",
    ctaLabel: "Create Question Paper",
    ctaHref: "/questions-create/create",
  },
];

const SUB_TABS = [
  {
    id: "ai-photo-edit",
    label: "AI Photo Edit",
    ctaLabel: "Open AI Editor",
    ctaHref: "/ai-editor",
  },
  {
    id: "manually-edited",
    label: "Manually Edited",
    ctaLabel: "Open Manual Editor",
    ctaHref: "/manual-editor",
  },
  {
    id: "ai-template-generated",
    label: "AI Template Generated",
    ctaLabel: "Browse AI Templates",
    ctaHref: "/ai-template",
  },
  {
    id: "bulk-photo-edit",
    label: "Bulk Photo Edit",
    ctaLabel: undefined,
    ctaHref: undefined,
  },
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const fieldBase =
  "h-10 w-full rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-500 hover:border-slate-300 focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10";

function SelectField({
  label,
  value,
  onChange,
  className = "",
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldBase} cursor-pointer appearance-none pl-3 pr-9`}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MyFilesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<CategoryId>("generated-images");
  const [subTab, setSubTab] = useState<string>("ai-photo-edit");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateQuery, setDateQuery] = useState<string>("");
  const [background, setBackground] = useState<string>("all");
  const [dress, setDress] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 🟢 সিকিউরিটি ও অথেনটিকেশন চেক
  useEffect(() => {
    try {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      const token = tokenCookie ? tokenCookie.split("=")[1] : null;

      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie =
          "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        window.location.href = "/login";
      } else {
        setIsAuthenticated(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setLoading(false);
    }
  }, []);

  // লোডিং হওয়ার সময় ক্লিন স্পিনার
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-600">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // অথেন্টিকেটেড না হলে পেজ রেন্ডার হবে না
  if (!isAuthenticated) return null;

  const currentTab =
    CATEGORY_TABS.find((tab) => tab.id === activeTab) ?? CATEGORY_TABS[0];
  const currentSub = SUB_TABS.find((tab) => tab.id === subTab) ?? SUB_TABS[0];
  const isImages = activeTab === "generated-images";

  const hasFilters =
    searchQuery.trim() !== "" ||
    dateQuery !== "" ||
    (isImages && (background !== "all" || dress !== "all"));

  const resetFilters = () => {
    setSearchQuery("");
    setDateQuery("");
    setBackground("all");
    setDress("all");
  };

  const handleCategoryChange = (id: CategoryId) => {
    setActiveTab(id);
    resetFilters();
  };

  // Empty state-এর লেখা (filter থাকলে এক রকম, না থাকলে আরেক রকম)
  let emptyTitle = currentTab.emptyTitle;
  let emptyText = currentTab.emptyText;
  let ctaLabel = currentTab.ctaLabel;
  let ctaHref = currentTab.ctaHref;

  if (isImages) {
    emptyText = `Images from ${currentSub.label} will appear here once you create them.`;
    ctaLabel = currentSub.ctaLabel;
    ctaHref = currentSub.ctaHref;
  }
  if (hasFilters) {
    emptyTitle = "No matching results";
    emptyText = "Try changing or clearing your filters to see more files.";
  }

  const EmptyIcon = hasFilters ? Search : currentTab.icon;
  const emptyTone: Tone = hasFilters ? "slate" : currentTab.tone;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Navbar */}
      <DashboardNavbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page header */}
        <header>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-[28px]">
            My Files
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            All your creations from across Sohozkaj, saved in one place.
          </p>
        </header>

        {/* Category tabs */}
        <div className="relative mt-6">
          <div
            role="tablist"
            aria-label="File categories"
            className="flex items-center gap-2.5 overflow-x-auto pb-3 pr-8"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#E2E8F0 transparent",
            }}
          >
            {CATEGORY_TABS.map((tab) => {
              const active = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleCategoryChange(tab.id)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-xl border py-1.5 pl-1.5 pr-4 text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-[#2563EB]/20 ${
                    active
                      ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)]"
                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset transition-colors ${
                      active
                        ? "bg-white/15 text-white ring-white/25"
                        : TONES[tab.tone]
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Right fade (mobile) */}
          <div className="pointer-events-none absolute bottom-3 right-0 top-0 w-10 bg-gradient-to-l from-[#F8FAFC] to-transparent sm:hidden"></div>
        </div>

        {/* Sub-tabs (শুধু Generated Images-এর জন্য) */}
        {isImages && (
          <div
            role="tablist"
            aria-label="Image types"
            className="mt-1 flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] sm:w-fit [&::-webkit-scrollbar]:hidden"
          >
            {SUB_TABS.map((tab) => {
              const active = tab.id === subTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSubTab(tab.id)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3.5 py-1.5 text-[13px] font-semibold outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 ${
                    active
                      ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-slate-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <section
          aria-label="Filters"
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-[260px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                aria-label="Search files"
                placeholder={currentTab.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${fieldBase} pl-10 pr-9`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date */}
            <input
              type="date"
              aria-label="Filter by date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className={`${fieldBase} cursor-pointer px-3 sm:w-[160px]`}
            />

            {/* শুধু ছবির ট্যাবে এই দুটো filter দরকার */}
            {isImages && (
              <>
                <SelectField
                  label="Filter by background"
                  value={background}
                  onChange={setBackground}
                  className="w-full sm:w-[170px]"
                >
                  <option value="all">All backgrounds</option>
                  <option value="white">White Background</option>
                  <option value="transparent">Transparent</option>
                </SelectField>

                <SelectField
                  label="Filter by dress"
                  value={dress}
                  onChange={setDress}
                  className="w-full sm:w-[140px]"
                >
                  <option value="all">All dress</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </SelectField>
              </>
            )}

            {/* Sort */}
            <SelectField
              label="Sort files"
              value={sort}
              onChange={setSort}
              className="w-full sm:w-[150px]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </SelectField>

            {/* View toggle */}
            <div
              role="group"
              aria-label="View mode"
              className="flex h-10 shrink-0 items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1"
            >
              {(
                [
                  ["grid", LayoutGrid, "Grid view"],
                  ["list", List, "List view"],
                ] as const
              ).map(([mode, Icon, label]) => {
                const active = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-label={label}
                    aria-pressed={active}
                    onClick={() => setViewMode(mode)}
                    className={`flex h-full w-8 cursor-pointer items-center justify-center rounded-lg transition-all duration-150 ${
                      active
                        ? "bg-white text-[#2563EB] shadow-sm ring-1 ring-slate-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-[#2563EB] transition-colors hover:bg-blue-50"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* Results */}
        {/* TODO: ফাইলের তালিকা এলে এখানে viewMode অনুযায়ী grid/list দেখাতে হবে। */}
        <section
          aria-live="polite"
          className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center sm:py-20"
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ${TONES[emptyTone]}`}
          >
            <EmptyIcon size={26} strokeWidth={1.8} />
          </span>
          <h2 className="mt-5 text-base font-bold text-slate-900">
            {emptyTitle}
          </h2>
          <p className="mt-1.5 max-w-sm text-[13px] font-medium leading-5 text-slate-500">
            {emptyText}
          </p>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <X size={14} />
              Clear filters
            </button>
          ) : (
            ctaLabel &&
            ctaHref && (
              <Link
                href={ctaHref}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25"
              >
                {ctaLabel}
                <ArrowRight size={15} />
              </Link>
            )
          )}
        </section>

        {/* Storage note */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TONES.blue}`}
          >
            <Clock size={14} strokeWidth={2.1} />
          </span>
          <p className="text-[13px] font-medium leading-5 text-slate-600">
            <span className="font-semibold text-slate-900">
              Saved for a limited time.
            </span>{" "}
            Everything you create across Sohozkaj appears here. Download
            anything you want to keep.
          </p>
        </div>
      </main>
    </div>
  );
}
