"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { toolsData, ToolTile } from "@/app/_components/toolsData";
import { getClientSession } from "@/lib/clientAuth";
import { Search, LayoutGrid, Star, FileText, Image as ImageIcon, Type, Wrench, GraduationCap, Video, Loader2, X, ChevronDown, Check } from "lucide-react";
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
// জুম-আউট / বড় স্ক্রিনে কন্টেন্ট ও ন্যাভবার একই অনুপাতে বড় হয় — এখন পুরোটা CSS দিয়ে
// (globals.css: html[data-nav-scaled] .page-zoom), মান বসায় PrePaintScript + DashboardNavbar,
// তাই রিলোডে প্রথম ফ্রেমেই সঠিক মাপ; JS state-এর জন্য অপেক্ষা নেই।
// মোবাইল/ট্যাবলেটে আইকন বক্স ঘরের কত % নেবে: ToolTile-এ (touchCompact) আছে
type SearchParamsLike = { get(name: string): string | null } | null;
function SohojToolsContent({ searchParams }: { searchParams: SearchParamsLike }) {
    // subscribe to language changes so L("...") placeholders re-render (as the old page wrapper did)
    useSohozI18n();
    const router = useRouter();
    // Keep the tools UI immediately visible; auth is verified in the background.
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<"All" | "Free" | "Paid">("All");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    // SohozTools পেজের নিজস্ব সার্চ বার সবসময় দৃশ্যমান থাকে
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const isInitialLoadDone = useRef(false);
    const gridRef = useRef<HTMLDivElement | null>(null);
    // ক্যাটাগরি ড্রপডাউন
    const [categoryOpen, setCategoryOpen] = useState<boolean>(false);
    const categoryRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!categoryOpen)
            return;
        const onDown = (e: MouseEvent | TouchEvent) => {
            if (categoryRef.current &&
                !categoryRef.current.contains(e.target as Node)) {
                setCategoryOpen(false);
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape")
                setCategoryOpen(false);
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
    const selectedCategoryItem = categories.find((c) => c.name === selectedCategory) ?? categories[0];
    // ১. ইনিশিয়াল লোড ও টাইপিং অ্যানিমেশন (শুধু প্রথমবার চলার জন্য)
    useEffect(() => {
        let mounted = true;
        let typingTimer: ReturnType<typeof setInterval> | null = null;
        const searchFromUrl = searchParams?.get("search") ?? null;
        void getClientSession().then((session) => {
            if (!mounted)
                return;
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
                    if (!mounted)
                        return;
                    if (currentIndex < searchFromUrl.length) {
                        setSearchQuery(searchFromUrl.slice(0, currentIndex + 1));
                        currentIndex++;
                    }
                    else if (typingTimer) {
                        clearInterval(typingTimer);
                        typingTimer = null;
                    }
                }, 70);
            }
            else {
                isInitialLoadDone.current = true;
            }
        });
        return () => {
            mounted = false;
            if (typingTimer)
                clearInterval(typingTimer);
        };
    }, [router, searchParams]);
    // ২. টাইপ করলে কোনো ল্যাগ ছাড়াই স্মুথ সার্চ হ্যান্ডলার
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        // URL আপডেট (ব্রাউজার রিলোড বা রিকম্পোনেন্ট রেন্ডার রি-ট্রিগার বন্ধ রাখতে)
        const params = new URLSearchParams(window.location.search);
        if (value.trim()) {
            params.set("search", value);
        }
        else {
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
        if (!matchesSearch)
            return false;
        const matchesAccess = activeTab === "All"
            ? true
            : activeTab === "Paid"
                ? tool.access === "paid"
                : tool.access !== "paid";
        if (!matchesAccess)
            return false;
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
    if (!isAuthenticated) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-[#0F172A] font-sans">
            <main className="flex items-center justify-center px-4">
              <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
                <Loader2 size={18} className="animate-spin text-[#2563EB]" />
                <T>{"Verifying your login..."}</T>
              </div>
            </main>
          </div>
        );
    }
    return (<div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      <DashboardNavbar scaleWithZoom/>

      <main className="page-zoom mx-auto w-full max-w-[1800px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {/* Premium centered search experience */}
        <section
          aria-labelledby="tool-search-heading"
          className="relative isolate overflow-hidden rounded-[28px] border border-white bg-[radial-gradient(ellipse_at_top_left,rgba(219,234,254,0.78),transparent_44%),radial-gradient(ellipse_at_bottom_right,rgba(224,231,255,0.72),transparent_42%),linear-gradient(135deg,#FFFFFF_0%,#F8FAFF_52%,#EFF6FF_100%)] px-4 py-7 shadow-[0_12px_40px_-28px_rgba(37,99,235,0.34)] sm:px-8 sm:py-9"
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-200/35 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100/90 bg-white/85 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-[#2563EB] shadow-sm shadow-blue-900/[0.04] sm:text-[11px]">
              <T>{"Your everyday toolkit"}</T>
            </div>

            <h1 id="tool-search-heading" className="mt-4 text-balance text-[25px] font-extrabold leading-tight tracking-[-0.035em] text-[#0F172A] sm:text-3xl lg:text-[2.35rem]">
              <T>{"Find the right tool for every task"}</T>
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
              <T>{"Search images, PDFs, documents and more in seconds."}</T>
            </p>

            <div className="group relative mt-6 w-full max-w-[760px] sm:mt-7">
              <div aria-hidden="true" className="pointer-events-none absolute -inset-[3px] rounded-[23px] bg-gradient-to-r from-blue-300/20 via-indigo-300/15 to-cyan-200/20 opacity-30 blur-[6px] transition-opacity duration-300 group-focus-within:opacity-45" />
              <div className="relative flex min-h-[62px] items-center gap-3 rounded-[20px] border border-slate-200/90 bg-white p-2 pl-2.5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.28)] transition-all duration-300 group-focus-within:border-blue-200 group-focus-within:shadow-[0_14px_32px_-22px_rgba(37,99,235,0.20)] sm:min-h-[68px] sm:gap-3 sm:p-2.5 sm:pl-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 sm:h-11 sm:w-11">
                  <Search size={19} strokeWidth={2.3} />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label={L("Search tools")}
                  autoComplete="off"
                  placeholder={L("What would you like to find today?")}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent py-3 text-[14px] font-medium text-[#0F172A] outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-[15px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label={L("Clear search")}
                    onClick={() => {
                      handleSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="mr-0.5 text-[11px] font-semibold text-slate-400 sm:text-xs">
                <T>{"Popular searches"}</T>
              </span>
              {["PDF", "Image", "Document Scanner", "Remove Background"].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    handleSearchChange(suggestion);
                    searchInputRef.current?.focus();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm shadow-slate-900/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:text-[#2563EB] hover:shadow-md hover:shadow-blue-900/[0.06] active:translate-y-0 sm:text-xs"
                >
                  <Search size={11} className="text-slate-400" />
                  <T>{suggestion}</T>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Access and category filters */}
        <section className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 sm:flex">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
            <T>{"Explore all tools"}</T>
          </div>

          <div className="ml-auto inline-flex max-w-full items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/90 p-1 shadow-sm shadow-slate-900/[0.025]">
            <div role="tablist" aria-label={L("Filter tools by access")} className="inline-flex shrink-0 items-center gap-0.5">
              {([
                { key: "All", label: "All Tools" },
                { key: "Free", label: "Free" },
                { key: "Paid", label: "Paid" },
              ] as const).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.key)}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-center text-[12px] font-semibold transition-all sm:px-3.5 sm:text-[13px] ${isActive
                      ? "bg-[#2563EB] text-white shadow-sm shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <T>{tab.label}</T>
                  </button>
                );
              })}
            </div>

            <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-slate-200" />

            <div ref={categoryRef} className="relative shrink-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                onClick={() => setCategoryOpen((v) => !v)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 sm:px-3.5 sm:text-[13px] ${selectedCategory !== "All"
                  ? "bg-blue-50 text-[#2563EB]"
                  : categoryOpen
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
              >
                <span className="max-w-[7rem] truncate sm:max-w-[9rem]">
                  {selectedCategory === "All" ? <T>{"Category"}</T> : <T>{selectedCategoryItem.name}</T>}
                </span>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`} />
              </button>

              {categoryOpen && (
                <div role="listbox" aria-label={L("Filter tools by category")} className="absolute right-0 top-full z-40 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_32px_-10px_rgba(15,23,42,0.20)] animate-in fade-in duration-150">
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
                        className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium transition-colors ${isSelected
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        <Icon size={15} className={`shrink-0 ${isSelected ? "text-[#2563EB]" : "text-slate-400"}`} />
                        <span className="flex-1 truncate">
                          {cat.name === "All" ? <T>{"All Categories"}</T> : <T>{cat.name}</T>}
                        </span>
                        {isSelected && <Check size={15} className="shrink-0 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tools Grid Section */}
        {filteredTools.length > 0 ? (<div ref={gridRef} className="grid pt-3 grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 fit:grid-cols-2 fit:gap-x-5 fit:gap-y-7 fit:sm:grid-cols-3 fit:md:grid-cols-4 fit:lg:grid-cols-6 fit:xl:grid-cols-8">
            {filteredTools.map((tool) => (<ToolTile key={tool.id} tool={tool} touchCompact/>))}
          </div>) : (
        /* No tools found - Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-dashed border-gray-200 my-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
              <Search size={22}/>
            </div>
            <h3 className="text-sm font-bold text-[#0F172A]"><T>{"No tools found"}</T></h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs"><T>{"We couldn't find any tool matching \""}</T>{searchQuery}<T>{"\". Try searching\n              for something else.\n            "}</T></p>
          </div>)}
      </main>
    </div>);
}
// useSearchParams() makes Next bail out to client-only rendering up to the nearest <Suspense>, and
// the old fallback was a "Loading tools..." spinner - so every reload showed a spinner page until
// JS ran. The fallback is now the REAL page (rendered without search params), so the server HTML
// is the final UI; the bridge below swaps in the live search params without changing the markup.
function SearchParamsBridge() {
    const searchParams = useSearchParams();
    return <SohojToolsContent searchParams={searchParams}/>;
}
export default function SohojToolsPage() {
    return (<Suspense fallback={<SohojToolsContent searchParams={null}/>}>
      <SearchParamsBridge />
    </Suspense>);
}
