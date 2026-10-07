"use client";

import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Printer,
  ClipboardList,
  Sparkles,
  SlidersHorizontal,
  LayoutTemplate,
  Layers,
  LayoutGrid,
  Search,
  X,
  ArrowRight,
  Download,
  Wrench,
  FileText,
  Type,
  Video,
  GraduationCap,
  PanelRightClose,
  PanelRightOpen,
  type LucideIcon,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

type CategoryId =
  | "generated-images"
  | "ai-photo-edit"
  | "manually-edited"
  | "ai-template-generated"
  | "bulk-photo-edit"
  | "print-media"
  | "question-papers";
type SortOrder = "newest" | "oldest";

// মাঝখানের My Files-এর একটা সেভ করা ফাইল। category = কোন টুল থেকে এসেছে।
interface FileItem {
  id: string;
  name: string;
  category: Exclude<CategoryId, "generated-images">;
  createdAt: string; // ISO date string
  url?: string; // ছবি/ফাইলের লিংক (ডাউনলোডের জন্যও)
}

type ToolGroupId =
  | "all"
  | "pdf"
  | "image"
  | "text"
  | "video"
  | "general"
  | "educational";

// SohozTools-এ সেভ হওয়া একটা ফাইল (যেমন Document Scanner থেকে স্ক্যান করা ডকুমেন্ট)
interface ToolFile {
  id: string;
  name: string;
  toolName: string; // যেমন "Document Scanner"
  group: Exclude<ToolGroupId, "all">;
  createdAt: string;
  url?: string;
}

const TOOL_GROUPS: { id: ToolGroupId; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All types", icon: LayoutGrid },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "video", label: "Video", icon: Video },
  { id: "general", label: "General", icon: Wrench },
  { id: "educational", label: "Educational", icon: GraduationCap },
];

interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
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
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText: "Your edited and generated images will appear here.",
  },
  {
    id: "ai-photo-edit",
    label: "AI Photo Edit",
    icon: Sparkles,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from AI Photo Edit will appear here once you create them.",
    ctaLabel: "Open AI Editor",
    ctaHref: "/ai-editor",
  },
  {
    id: "manually-edited",
    label: "Manually Edited",
    icon: SlidersHorizontal,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from the Manual Editor will appear here once you create them.",
    ctaLabel: "Open Manual Editor",
    ctaHref: "/manual-editor",
  },
  {
    id: "ai-template-generated",
    label: "AI Template Generated",
    icon: LayoutTemplate,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images made from AI templates will appear here once you create them.",
    ctaLabel: "Browse AI Templates",
    ctaHref: "/ai-template",
  },
  {
    id: "bulk-photo-edit",
    label: "Bulk Photo Edit",
    icon: Layers,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from Bulk Photo Edit will appear here once you create them.",
  },
  {
    id: "print-media",
    label: "Print Media",
    icon: Printer,
    searchPlaceholder: "Search print media by name",
    emptyTitle: "No print media yet",
    emptyText:
      "Posters, cards and other print designs you create will be saved here.",
    ctaLabel: "Browse Print Media",
    ctaHref: "/print-media",
  },
  {
    id: "question-papers",
    label: "Question Papers",
    icon: ClipboardList,
    searchPlaceholder: "Search question papers by name",
    emptyTitle: "No question papers yet",
    emptyText: "Question papers you create will be saved here.",
    ctaLabel: "Create Question Paper",
    ctaHref: "/questions-create/create",
  },
];

// "Generated Images" ট্যাবে এই চারটা টুলের সব ছবি একসাথে দেখাবে
const IMAGE_CATEGORY_IDS: CategoryId[] = [
  "ai-photo-edit",
  "manually-edited",
  "ai-template-generated",
  "bulk-photo-edit",
];

function belongsToTab(item: FileItem, tabId: CategoryId): boolean {
  if (tabId === "generated-images")
    return IMAGE_CATEGORY_IDS.includes(item.category);
  return item.category === tabId;
}

function matchesQuery(name: string, query: string): boolean {
  return name.toLowerCase().includes(query);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortByDate<T extends { createdAt: string }>(
  list: T[],
  order: SortOrder,
): T[] {
  const dir = order === "newest" ? -1 : 1;
  return [...list].sort(
    (a, b) =>
      dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  );
}

/* ------------------------------------------------------------------ */
/* Shared styles & small pieces                                        */
/* ------------------------------------------------------------------ */

const fieldBase =
  "h-9 rounded-md border border-slate-300 bg-white text-sm text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const primaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";

const secondaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30";

function SearchBox({
  value,
  onChange,
  onClear,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldBase} w-full pl-9 pr-8 placeholder:text-slate-400`}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-slate-400 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function SortSelect({
  value,
  onChange,
  className = "",
}: {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
  className?: string;
}) {
  return (
    <select
      aria-label="Sort files"
      value={value}
      onChange={(e) => onChange(e.target.value as SortOrder)}
      className={`${fieldBase} cursor-pointer px-2.5 ${className}`}
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Scan animation (লোডিং-এর সময়) + zoom scale                          */
/* ------------------------------------------------------------------ */

const MIN_SCAN_MS = 1000; // ডাটা দ্রুত এলেও স্ক্যান অ্যানিমেশনটা কমপক্ষে এতক্ষণ দেখাবে

const SCAN_CSS = `
@keyframes mf-scan { 0% { left: -200px; } 100% { left: 100%; } }
@keyframes mf-wipe {
  from { clip-path: inset(0 100% 0 0); opacity: 0.35; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
@keyframes mf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .mf-scan-bar { animation: none !important; opacity: 0; }
  .mf-wipe { animation: none !important; }
}
`;

function ScanOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
    >
      <div
        className="mf-scan-bar absolute inset-y-0 w-[200px]"
        style={{
          left: -200,
          background:
            "linear-gradient(to right, rgba(37,99,235,0) 0%, rgba(37,99,235,0.08) 65%, rgba(37,99,235,0.22) 100%)",
          borderRight: "2px solid rgba(37,99,235,0.8)",
          boxShadow: "6px 0 20px rgba(37,99,235,0.25)",
          animation: "mf-scan 1.6s cubic-bezier(0.45, 0, 0.25, 1) infinite",
        }}
      />
    </div>
  );
}

function ScanSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading your files" className="relative">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div
              className="flex aspect-[4/3] items-center justify-center bg-slate-100"
              style={{ animation: "mf-pulse 1.8s ease-in-out infinite" }}
            >
              <ImageIcon
                size={26}
                strokeWidth={1.4}
                className="text-slate-300"
              />
            </div>
            <div className="space-y-1.5 px-3 py-3">
              <div className="h-3 w-3/4 rounded bg-slate-100" />
              <div className="h-2.5 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <ScanOverlay />
    </div>
  );
}

function ScanSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading tool files" className="relative">
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="h-9 w-9 shrink-0 rounded-md bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-2/3 rounded bg-slate-100" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100" />
            </div>
            <span className="h-6 w-6 shrink-0 rounded bg-slate-100" />
          </li>
        ))}
      </ul>
      <ScanOverlay />
    </div>
  );
}

// জুম-আউট / বড় স্ক্রিনে ন্যাভবারের সাথে মিলিয়ে কন্টেন্ট আনুপাতিক বড় হবে
// DashboardNavbar-এর NAV_BASE_WIDTH / NAV_MAX_SCALE / NAV_BASE_HEIGHT-এর সাথে একই মান
const ZOOM_BASE_WIDTH = 1920;
const ZOOM_MAX_SCALE = 5;
const NAV_BASE_HEIGHT = 64;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useZoomScale(): { scale: number; viewH: number } {
  const [state, setState] = useState<{ scale: number; viewH: number }>({
    scale: 1,
    viewH: 0,
  });

  useIsoLayoutEffect(() => {
    // শুধু মাউসওয়ালা (ডেস্কটপ/ল্যাপটপ) ডিভাইসে; টাচ ডিভাইসে আগের মতো রেসপন্সিভ
    const mq = window.matchMedia("(pointer: fine)");

    const update = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const scale = mq.matches
        ? Math.min(ZOOM_MAX_SCALE, Math.max(1, w / ZOOM_BASE_WIDTH))
        : 1;

      setState((prev) =>
        Math.abs(prev.scale - scale) < 0.001 && prev.viewH === h
          ? prev
          : { scale, viewH: h },
      );
    };

    update();
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MyFilesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // মাঝখান: My Files
  const [activeTab, setActiveTab] = useState<CategoryId>("generated-images");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [switchNotice, setSwitchNotice] = useState<string>("");

  // ডান সাইডবার: SohozTools
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true); // ডেস্কটপে ডান পাশের প্যানেল
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false); // মোবাইলে ড্রয়ার
  const { scale: zoomScale, viewH } = useZoomScale();
  const [toolGroup, setToolGroup] = useState<ToolGroupId>("all");
  const [toolSearch, setToolSearch] = useState<string>("");
  const [toolSort, setToolSort] = useState<SortOrder>("newest");

  const [files, setFiles] = useState<FileItem[]>([]);
  const [toolFiles, setToolFiles] = useState<ToolFile[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);

  // Authentication and saved-file hydration run in the background so the
  // My Files shell never blocks navigation.
  useEffect(() => {
    let mounted = true;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();

    // স্ক্যান অ্যানিমেশন যেন অন্তত একবার পুরোটা দেখা যায়
    const finishLoading = () => {
      const wait = Math.max(0, MIN_SCAN_MS - (Date.now() - startedAt));
      finishTimer = setTimeout(() => {
        if (mounted) setFilesLoading(false);
      }, wait);
    };

    void getClientSession()
      .then(async (session) => {
        if (!mounted) return;
        if (!session.authenticated) {
          window.location.replace("/login?callbackUrl=%2Fmy-files");
          return;
        }

        setIsAuthenticated(true);
        try {
          const response = await fetch("/api/my-files", {
            credentials: "include",
            cache: "no-store",
          });
          const result = await response.json().catch(() => null);
          if (!mounted || !response.ok || !result?.success) return;

          const data = result.data || {};
          setFiles(Array.isArray(data.files) ? data.files : []);
          setToolFiles(Array.isArray(data.toolFiles) ? data.toolFiles : []);
        } catch (error) {
          console.error("Failed to load My Files:", error);
        } finally {
          finishLoading();
        }
      })
      .catch((error) => {
        console.error("My Files authentication error:", error);
        finishLoading();
      });

    return () => {
      mounted = false;
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, []);

  // সার্চ করলে: বর্তমান ট্যাবে না পেলে, যে ট্যাবে ফাইলটা আছে সেখানে অটো চলে যাবে
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    const hasMatch = (tabId: CategoryId) =>
      files.some((f) => belongsToTab(f, tabId) && matchesQuery(f.name, q));

    if (hasMatch(activeTab)) return;

    const target = CATEGORY_TABS.find(
      (t) => t.id !== "generated-images" && hasMatch(t.id),
    );
    if (target) {
      setActiveTab(target.id);
      setSwitchNotice(`Showing results from ${target.label}`);
    }
    // শুধু সার্চ লেখা বদলালেই চালাতে চাই, ট্যাব বদলালে না
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const currentTab =
    CATEGORY_TABS.find((t) => t.id === activeTab) ?? CATEGORY_TABS[0];
  const hasSearch = searchQuery.trim() !== "";
  const hasToolSearch = toolSearch.trim() !== "";

  // প্রতিটা ট্যাবে কয়টা ফাইল আছে (ট্যাবের পাশে ছোট করে দেখাবে)
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_TABS.forEach((t) => {
      counts[t.id] = files.filter((f) => belongsToTab(f, t.id)).length;
    });
    return counts;
  }, [files]);

  const visibleFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortByDate(
      files.filter(
        (f) => belongsToTab(f, activeTab) && (!q || matchesQuery(f.name, q)),
      ),
      sort,
    );
  }, [files, activeTab, searchQuery, sort]);

  const visibleToolFiles = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return sortByDate(
      toolFiles.filter(
        (f) =>
          (toolGroup === "all" || f.group === toolGroup) &&
          (!q || matchesQuery(f.name, q) || matchesQuery(f.toolName, q)),
      ),
      toolSort,
    );
  }, [toolFiles, toolGroup, toolSearch, toolSort]);

  const resetSearch = () => {
    setSearchQuery("");
    setSwitchNotice("");
  };

  const handleCategoryChange = (id: CategoryId) => {
    setActiveTab(id);
    resetSearch();
  };

  // মাঝখানের empty state-এর লেখা
  const EmptyIcon = hasSearch ? Search : currentTab.icon;
  const emptyTitle = hasSearch ? "No matching results" : currentTab.emptyTitle;
  const emptyText = hasSearch
    ? "We couldn't find any file with that name. Try a different word."
    : currentTab.emptyText;

  // সাইডবারের empty state-এর লেখা
  const currentGroup =
    TOOL_GROUPS.find((g) => g.id === toolGroup) ?? TOOL_GROUPS[0];
  const ToolEmptyIcon = hasToolSearch ? Search : currentGroup.icon;
  let toolEmptyTitle = "No tool files yet";
  let toolEmptyText =
    "Use any SohozTools tool and press Save. Your file will show up here.";
  if (hasToolSearch) {
    toolEmptyTitle = "No matching results";
    toolEmptyText = "We couldn't find any file with that name.";
  } else if (toolGroup !== "all") {
    toolEmptyTitle = `No ${currentGroup.label} files yet`;
    toolEmptyText = `Files you save from ${currentGroup.label} tools will appear here.`;
  }

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setSidebarOpen((v) => !v);
    else setMobileSidebarOpen((v) => !v);
  };

  const closeSidebar = () => {
    setMobileSidebarOpen(false);
    if (window.innerWidth >= 1024) setSidebarOpen(false);
  };

  // জুম-আউটে main অংশ আনুপাতিক বড় হবে; উচ্চতা হাতে হিসাব করে দিচ্ছি যাতে ভিতরের স্ক্রল ঠিক থাকে
  const isZoomed = zoomScale > 1.001 && viewH > 0;
  const mainStyle = isZoomed
    ? {
        zoom: zoomScale,
        flex: "none",
        height: Math.max(0, (viewH - NAV_BASE_HEIGHT * zoomScale) / zoomScale),
      }
    : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 lg:h-dvh">
      <style>{SCAN_CSS}</style>
      <DashboardNavbar scaleWithZoom />

      <main
        style={mainStyle}
        className="flex w-full flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:min-h-0 lg:px-8 2xl:px-12"
      >
        {/* Page header */}
        <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              My Files
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">
              Everything you make with Sohozkaj — edited photos, templates,
              print designs and question papers — is saved here.
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-slate-500 sm:text-sm">
              Files are deleted automatically after 30 days, so download what
              you need before then.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen || mobileSidebarOpen}
            aria-controls="sohoztools-sidebar"
            className={`${secondaryBtn} w-full justify-center sm:w-auto ${
              sidebarOpen ? "lg:bg-slate-100" : ""
            } ${mobileSidebarOpen ? "bg-slate-100" : ""}`}
          >
            <Wrench size={15} className="text-slate-500" />
            SohozTools Files
            {sidebarOpen ? (
              <PanelRightClose
                size={15}
                className="hidden text-slate-400 lg:block"
              />
            ) : (
              <PanelRightOpen
                size={15}
                className="hidden text-slate-400 lg:block"
              />
            )}
            <PanelRightOpen size={15} className="text-slate-400 lg:hidden" />
          </button>
        </header>

        <div
          className={`grid items-start gap-4 sm:gap-6 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch ${
            sidebarOpen ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"
          }`}
        >
          {/* ======================= My Files ======================= */}
          <section
            aria-label="My files"
            className="flex min-h-[480px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white sm:min-h-[560px] lg:min-h-0 lg:overflow-hidden"
          >
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="File categories"
              className="flex shrink-0 gap-5 overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:gap-6 sm:px-5 [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = tab.id === activeTab;
                const count = tabCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={(e) => {
                      handleCategoryChange(tab.id);
                      e.currentTarget.scrollIntoView({
                        inline: "center",
                        block: "nearest",
                        behavior: "smooth",
                      });
                    }}
                    className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 py-3 text-sm font-medium outline-none transition-colors focus-visible:text-blue-700 ${
                      active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + sort */}
            <div className="flex shrink-0 gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <SearchBox
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  setSwitchNotice("");
                }}
                onClear={resetSearch}
                placeholder={currentTab.searchPlaceholder}
                label="Search files"
              />
              <SortSelect
                value={sort}
                onChange={setSort}
                className="shrink-0"
              />
            </div>

            {/* Results */}
            <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5 lg:min-h-0 lg:overflow-y-auto">
              {!filesLoading && switchNotice && (
                <p role="status" className="mb-3 text-sm text-blue-700">
                  {switchNotice}
                </p>
              )}

              {filesLoading ? (
                <ScanSkeletonGrid />
              ) : visibleFiles.length > 0 ? (
                <div
                  aria-live="polite"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4"
                >
                  {visibleFiles.map((file, index) => {
                    const isImage =
                      Boolean(file.url) &&
                      IMAGE_CATEGORY_IDS.includes(file.category);
                    const PlaceholderIcon =
                      CATEGORY_TABS.find((t) => t.id === file.category)?.icon ??
                      ImageIcon;
                    return (
                      <article
                        key={file.id}
                        className="mf-wipe overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-400"
                        style={{
                          animation: "mf-wipe 0.65s ease-out both",
                          animationDelay: `${Math.min(index, 14) * 45}ms`,
                        }}
                      >
                        <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-full w-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <PlaceholderIcon
                              size={28}
                              strokeWidth={1.5}
                              className="text-slate-400"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[13px] font-medium text-slate-900 sm:text-sm"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(file.createdAt)}
                            </p>
                          </div>
                          {file.url && (
                            <a
                              href={file.url}
                              download={file.name}
                              aria-label={`Download ${file.name}`}
                              title="Download"
                              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  aria-live="polite"
                  className="flex flex-1 items-center justify-center py-6"
                >
                  <div className="w-full max-w-md rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
                    <EmptyIcon
                      size={28}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-400"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      {emptyTitle}
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                      {emptyText}
                    </p>

                    {hasSearch ? (
                      <button
                        type="button"
                        onClick={resetSearch}
                        className={`${secondaryBtn} mt-5`}
                      >
                        Clear search
                      </button>
                    ) : (
                      currentTab.ctaLabel &&
                      currentTab.ctaHref && (
                        <Link
                          href={currentTab.ctaHref}
                          className={`${primaryBtn} mt-5`}
                        >
                          {currentTab.ctaLabel}
                          <ArrowRight size={14} />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===================== SohozTools sidebar ===================== */}
          {mobileSidebarOpen && (
            <div
              aria-hidden="true"
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-[55] bg-slate-900/40 lg:hidden"
            />
          )}

          {(sidebarOpen || mobileSidebarOpen) && (
            <aside
              id="sohoztools-sidebar"
              aria-label="SohozTools files"
              className={`flex-col border border-slate-200 bg-white lg:min-h-0 lg:overflow-hidden lg:rounded-lg ${
                mobileSidebarOpen
                  ? "fixed inset-y-0 right-0 z-[60] flex w-[90vw] max-w-sm overflow-hidden rounded-l-xl shadow-2xl"
                  : "hidden"
              } ${
                sidebarOpen
                  ? "lg:static lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:shadow-none"
                  : "lg:hidden"
              }`}
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">
                    SohozTools Files
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filesLoading
                      ? "Loading…"
                      : `${toolFiles.length} ${
                          toolFiles.length === 1 ? "file" : "files"
                        }`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSidebar}
                  aria-label="Close SohozTools sidebar"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="shrink-0 space-y-2.5 px-4 pt-3">
                <p className="text-xs leading-5 text-slate-500">
                  Anything you save from a SohozTools tool — a scanned document,
                  a compressed PDF, a resized photo — is stored here.
                </p>
                <SearchBox
                  value={toolSearch}
                  onChange={setToolSearch}
                  onClear={() => setToolSearch("")}
                  placeholder="Search by file or tool name"
                  label="Search tool files"
                />
                <div className="flex gap-2">
                  <select
                    aria-label="Filter by file type"
                    value={toolGroup}
                    onChange={(e) =>
                      setToolGroup(e.target.value as ToolGroupId)
                    }
                    className={`${fieldBase} min-w-0 flex-1 cursor-pointer px-2.5`}
                  >
                    {TOOL_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <SortSelect value={toolSort} onChange={setToolSort} />
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-slate-200">
                {filesLoading ? (
                  <ScanSkeletonList />
                ) : visibleToolFiles.length > 0 ? (
                  <ul className="divide-y divide-slate-100" aria-live="polite">
                    {visibleToolFiles.map((file) => {
                      const GroupIcon = (
                        TOOL_GROUPS.find((g) => g.id === file.group) ??
                        TOOL_GROUPS[0]
                      ).icon;
                      return (
                        <li
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                            <GroupIcon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-medium text-slate-900"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {file.toolName} · {formatDate(file.createdAt)}
                            </p>
                          </div>
                          {file.url && (
                            <a
                              href={file.url}
                              download={file.name}
                              aria-label={`Download ${file.name}`}
                              title="Download"
                              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div aria-live="polite" className="px-6 py-10 text-center">
                    <ToolEmptyIcon
                      size={26}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-400"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      {toolEmptyTitle}
                    </h3>
                    <p className="mx-auto mt-1 max-w-[240px] text-sm text-slate-500">
                      {toolEmptyText}
                    </p>
                    {hasToolSearch ? (
                      <button
                        type="button"
                        onClick={() => setToolSearch("")}
                        className={`${secondaryBtn} mt-4`}
                      >
                        Clear search
                      </button>
                    ) : (
                      <Link
                        href="/sohoj-tools"
                        className={`${primaryBtn} mt-4`}
                      >
                        Browse SohozTools
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
