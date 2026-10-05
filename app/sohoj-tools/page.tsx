"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
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

function SohojToolsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Free" | "Paid">("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialLoadDone = useRef(false);

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

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 size={16} className="animate-spin text-[#2563EB]" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">
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
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  Powerful tools to speed up your daily work.
                </p>
              </div>
            </div>

            <div
              role="tablist"
              aria-label="Filter tools by access"
              className="inline-flex self-start rounded-xl bg-slate-100 p-1 md:self-auto"
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
                    className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
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

          {/* Row 2: Search */}
          <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search tools... e.g. PDF, image, video"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-11 text-sm font-medium text-[#0F172A] transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-[#2563EB]/60 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10"
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
          </div>

          {/* Row 3: Category pills */}
          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-4 py-2 sm:px-5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-[#2563EB] bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/25"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#2563EB]/40 hover:bg-blue-50 hover:text-[#2563EB]"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isSelected ? "text-white" : "text-slate-400"}
                    />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tools Grid Section */}
        {filteredTools.length > 0 ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-5 gap-y-7 pt-3"
          >
            {filteredTools.map((tool) => (
              <ToolTile key={tool.id} tool={tool} />
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
