"use client";

import { useState, useEffect, useMemo } from "react";
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
}: {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
}) {
  return (
    <select
      aria-label="Sort files"
      value={value}
      onChange={(e) => onChange(e.target.value as SortOrder)}
      className={`${fieldBase} cursor-pointer px-2.5`}
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MyFilesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // মাঝখান: My Files
  const [activeTab, setActiveTab] = useState<CategoryId>("generated-images");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [switchNotice, setSwitchNotice] = useState<string>("");

  // ডান সাইডবার: SohozTools
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [toolGroup, setToolGroup] = useState<ToolGroupId>("all");
  const [toolSearch, setToolSearch] = useState<string>("");
  const [toolSort, setToolSort] = useState<SortOrder>("newest");

  // TODO: এখানে আপনার API/ডাটাবেস থেকে ফাইল লোড করে set করতে হবে।
  const [files] = useState<FileItem[]>([]);
  const [toolFiles] = useState<ToolFile[]>([]);

  // সিকিউরিটি ও অথেনটিকেশন চেক
  useEffect(() => {
    let mounted = true;
    void getClientSession().then((session) => {
      if (!mounted) return;
      if (!session.authenticated) {
        window.location.replace("/login?callbackUrl=%2Fmy-files");
        return;
      }
      setIsAuthenticated(true);
      setLoading(false);
    });
    return () => {
      mounted = false;
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-600">যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <DashboardNavbar />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900">My Files</h1>
            <p className="mt-1 text-sm text-slate-600">
              Everything you make with Sohozkaj — edited photos, templates,
              print designs and question papers — is saved here.
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              Files are deleted automatically after 30 days, so download what
              you need before then.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-expanded={sidebarOpen}
            aria-controls="sohoztools-sidebar"
            className={`${secondaryBtn} ${sidebarOpen ? "bg-slate-100" : ""}`}
          >
            <Wrench size={15} className="text-slate-500" />
            SohozTools Files
            {sidebarOpen ? (
              <PanelRightClose size={15} className="text-slate-400" />
            ) : (
              <PanelRightOpen size={15} className="text-slate-400" />
            )}
          </button>
        </header>

        <div
          className={`grid items-start gap-6 ${
            sidebarOpen ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"
          }`}
        >
          {/* ======================= My Files ======================= */}
          <section
            aria-label="My files"
            className="flex min-h-[560px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white"
          >
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="File categories"
              className="flex gap-6 overflow-x-auto border-b border-slate-200 px-5"
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
                    onClick={() => handleCategoryChange(tab.id)}
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
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row">
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
              <SortSelect value={sort} onChange={setSort} />
            </div>

            {/* Results */}
            <div className="flex flex-1 flex-col px-5 pb-5">
              {switchNotice && (
                <p role="status" className="mb-3 text-sm text-blue-700">
                  {switchNotice}
                </p>
              )}

              {visibleFiles.length > 0 ? (
                <div
                  aria-live="polite"
                  className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
                >
                  {visibleFiles.map((file) => {
                    const isImage =
                      Boolean(file.url) &&
                      IMAGE_CATEGORY_IDS.includes(file.category);
                    const PlaceholderIcon =
                      CATEGORY_TABS.find((t) => t.id === file.category)?.icon ??
                      ImageIcon;
                    return (
                      <article
                        key={file.id}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-400"
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
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-sm font-medium text-slate-900"
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
          {sidebarOpen && (
            <aside
              id="sohoztools-sidebar"
              aria-label="SohozTools files"
              className="rounded-lg border border-slate-200 bg-white lg:sticky lg:top-6"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">
                    SohozTools Files
                  </h2>
                  <p className="text-xs text-slate-500">
                    {toolFiles.length}{" "}
                    {toolFiles.length === 1 ? "file" : "files"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close SohozTools sidebar"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 px-4 pt-3">
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

              <div className="mt-3 max-h-[440px] min-h-[220px] overflow-y-auto border-t border-slate-200">
                {visibleToolFiles.length > 0 ? (
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
