"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { toolsData, ToolTile } from "@/app/_components/toolsData";
import { getClientSession } from "@/lib/clientAuth";

import {
  Search,
  LayoutGrid,
  Star,
  FileText,
  Image as ImageIcon,
  Type,
  Wrench,
  GraduationCap,
  Video,
  Loader2,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

const categories = [
  { name: "All", icon: LayoutGrid },
  { name: "Favorites", icon: Star },
  { name: "PDF Tools", icon: FileText },
  { name: "Image Tools", icon: ImageIcon },
  { name: "Text Tools", icon: Type },
  { name: "Video Tools", icon: Video },
  { name: "General Tools", icon: Wrench },
  { name: "Educational Tools", icon: GraduationCap },
];

// জুম-আউট / বড় স্ক্রিনে কন্টেন্ট ও ন্যাভবার একই অনুপাতে বড় হবে (ড্যাশবোর্ডের মতো)
// DashboardNavbar-এর NAV_BASE_WIDTH / NAV_MAX_SCALE-এর সাথে একই মান রাখো
const ZOOM_BASE_WIDTH = 1920; // px — এর চেয়ে চওড়া ভিউপোর্টে কন্টেন্ট আনুপাতিক বড় হবে
const ZOOM_MAX_SCALE = 5; // সর্বোচ্চ কতগুণ বড় হবে

// মোবাইল/ট্যাবলেটে আইকন বক্স ঘরের কত % নেবে (ড্যাশবোর্ডের সাথে একই)
const TOUCH_TILE_SIZE_PERCENT = 88;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useZoomScale(): { scale: number; touch: boolean } {
  const [scale, setScale] = useState<number>(1);
  // মোবাইল/ট্যাবলেট (টাচ ডিভাইস) হলে true — তখন ড্যাশবোর্ডের মতো ছোট কার্ড ও ৩ কলাম
  const [touch, setTouch] = useState<boolean>(false);

  useIsoLayoutEffect(() => {
    // শুধু মাউসওয়ালা (ডেস্কটপ/ল্যাপটপ) ডিভাইসে; টাচ ডিভাইসে আগের মতো রেসপন্সিভ
    const mq = window.matchMedia("(pointer: fine)");

    const update = () => {
      setTouch(!mq.matches);

      if (!mq.matches) {
        setScale(1);
        return;
      }

      const w = document.documentElement.clientWidth;
      const next = Math.min(ZOOM_MAX_SCALE, Math.max(1, w / ZOOM_BASE_WIDTH));

      setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
    };

    update();
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);

    return () => {
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  return { scale, touch };
}

function SohojToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scale: zoomScale, touch: isTouch } = useZoomScale();

  // Keep the tools UI immediately visible; auth is verified in the background.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"All" | "Free" | "Paid">("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialLoadDone = useRef(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // ক্যাটাগরি ড্রপডাউন
  const [categoryOpen, setCategoryOpen] = useState<boolean>(false);
  const categoryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categoryOpen) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setCategoryOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoryOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [categoryOpen]);

  const selectedCategoryItem =
    categories.find((c) => c.name === selectedCategory) ?? categories[0];
  const SelectedCategoryIcon = selectedCategoryItem.icon;

  // ১. ইনিশিয়াল লোড ও টাইপিং অ্যানিমেশন (শুধু প্রথমবার চলার জন্য)
  useEffect(() => {
    let mounted = true;
    let typingTimer: ReturnType<typeof setInterval> | null = null;
    const searchFromUrl = searchParams.get("search");

    void getClientSession().then((session) => {
      if (!mounted) return;

      if (!session.authenticated) {
        const targetPath = searchFromUrl
          ? `/sohoj-tools?search=${encodeURIComponent(searchFromUrl)}`
          : "/sohoj-tools";
        router.replace(`/login?redirect=${encodeURIComponent(targetPath)}`);
        return;
      }

      setIsAuthenticated(true);

      // প্রথমবার পেজে আসার পর URL-এ কোনো সার্চ থাকলে অ্যানিমেশন চালাবে
      if (!isInitialLoadDone.current && searchFromUrl) {
        isInitialLoadDone.current = true;
        let currentIndex = 0;
        setSearchQuery("");

        typingTimer = setInterval(() => {
          if (!mounted) return;

          if (currentIndex < searchFromUrl.length) {
            setSearchQuery(searchFromUrl.slice(0, currentIndex + 1));
            currentIndex++;
          } else if (typingTimer) {
            clearInterval(typingTimer);
            typingTimer = null;
          }
        }, 70);
      } else {
        isInitialLoadDone.current = true;
      }
    });

    return () => {
      mounted = false;
      if (typingTimer) clearInterval(typingTimer);
    };
  }, [router, searchParams]);

  // ২. টাইপ করলে কোনো ল্যাগ ছাড়াই স্মুথ সার্চ হ্যান্ডলার
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // URL আপডেট (ব্রাউজার রিলোড বা রিকম্পোনেন্ট রেন্ডার রি-ট্রিগার বন্ধ রাখতে)
    const params = new URLSearchParams(window.location.search);
    if (value.trim()) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const newQuery = params.toString();
    const newPath = newQuery ? `/sohoj-tools?${newQuery}` : "/sohoj-tools";
    window.history.replaceState(null, "", newPath);
  };

  const filteredTools = toolsData.filter((tool) => {
    const matchesSearch = tool.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const matchesAccess =
      activeTab === "All"
        ? true
        : activeTab === "Paid"
          ? tool.access === "paid"
          : tool.access !== "paid";
    if (!matchesAccess) return false;

    switch (selectedCategory) {
      case "PDF Tools":
        return tool.category === "PDF";
      case "Image Tools":
        return tool.category === "Image";
      case "Text Tools":
        return tool.category === "Text";
      case "Video Tools":
        return tool.category === "Video";
      case "General Tools":
        return tool.category === "General";
      case "Educational Tools":
        return tool.category === "Educational";
      default:
        return true;
    }
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar scaleWithZoom />

      <main
        className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5"
        style={zoomScale > 1.001 ? { zoom: zoomScale } : undefined}
      >
        {/* Unified header card: title + access tabs, search, categories */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Row 1: Title + Free/Paid segmented control */}
          <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="grid h-9 w-9 shrink-0 grid-cols-2 gap-[3px] rounded-xl border border-slate-200 bg-white p-[5px] shadow-sm"
              >
                <span className="rounded-[5px] bg-[#2563EB]" />
                <span className="rounded-[5px] bg-[#F59E0B]" />
                <span className="rounded-[5px] bg-[#10B981]" />
                <span className="rounded-[5px] bg-[#F43F5E]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
                    Tools
                  </h1>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {filteredTools.length} available
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] font-medium leading-snug text-slate-500 sm:text-xs">
                  Powerful tools to speed up your daily work.
                </p>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Filter tools by access"
              className="flex w-full rounded-xl bg-slate-100 p-1 md:inline-flex md:w-auto md:self-auto"
            >
              {(
                [
                  { key: "All", label: "All Tools" },
                  { key: "Free", label: "Free" },
                  { key: "Paid", label: "Paid" },
                ] as const
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 cursor-pointer rounded-lg px-4 py-1.5 text-center text-xs font-semibold transition-all md:flex-none ${
                      isActive
                        ? "bg-white text-[#2563EB] shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Search + Category dropdown */}
          <div className="rounded-b-2xl border-t border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-3">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search tools... e.g. PDF, image, video"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-11 text-sm font-medium text-[#0F172A] transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB]/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Category dropdown */}
              <div
                ref={categoryRef}
                className="relative w-full md:w-64 md:shrink-0"
              >
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={categoryOpen}
                  onClick={() => setCategoryOpen((v) => !v)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-slate-800 shadow-sm outline-none transition-all hover:border-slate-300 focus-visible:ring-4 focus-visible:ring-[#2563EB]/10 ${
                    categoryOpen
                      ? "border-[#2563EB]/60 ring-4 ring-[#2563EB]/10"
                      : "border-slate-200"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
                    <SelectedCategoryIcon size={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {selectedCategoryItem.name}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      categoryOpen ? "rotate-180 text-[#2563EB]" : ""
                    }`}
                  />
                </button>

                {categoryOpen && (
                  <div
                    role="listbox"
                    aria-label="Filter tools by category"
                    className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.25)] animate-in fade-in duration-150"
                  >
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setCategoryOpen(false);
                          }}
                          className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-50 text-[#1D4ED8]"
                              : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isSelected
                                ? "bg-white text-[#2563EB] ring-1 ring-blue-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={15} />
                          </span>
                          <span className="flex-1 truncate">{cat.name}</span>
                          {isSelected && (
                            <Check
                              size={16}
                              className="shrink-0 text-[#2563EB]"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid Section */}
        {filteredTools.length > 0 ? (
          <div
            ref={gridRef}
            className={`grid pt-3 ${
              isTouch
                ? "grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-5 gap-y-7"
            }`}
          >
            {filteredTools.map((tool) => (
              <ToolTile
                key={tool.id}
                tool={tool}
                boxPercent={isTouch ? TOUCH_TILE_SIZE_PERCENT : undefined}
              />
            ))}
          </div>
        ) : (
          /* No tools found - Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200 my-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]">No tools found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              We couldn't find any tool matching "{searchQuery}". Try searching
              for something else.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SohojToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
            <Loader2 size={16} className="animate-spin text-[#2563EB]" />
            Loading tools...
          </div>
        </div>
      }
    >
      <SohojToolsContent />
    </Suspense>
  );
}
