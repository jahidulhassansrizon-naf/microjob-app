"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { toolsData, ToolTile } from "@/app/_components/toolsData";
import { getClientSession } from "@/lib/clientAuth";
import { Search, LayoutGrid, Star, FileText, Image as ImageIcon, Type, Wrench, GraduationCap, Video, Loader2, X, ChevronDown, Check, } from "lucide-react";
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

      <main className="page-zoom max-w-[1800px] mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* SohozTools search + filters */}
        <section className="flex flex-wrap items-stretch justify-between gap-2.5">
          {/* SohozTools-এর নিজস্ব সার্চ বার — ফিল্টার সারির একদম বামে সবসময় দৃশ্যমান */}
          <div className="relative min-h-[38px] w-full animate-in fade-in duration-150 sm:w-80">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2563EB]"/>
              <input ref={searchInputRef} type="text" placeholder={L("Search tools...")} value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="h-full min-h-[38px] w-full rounded-lg border border-slate-200 bg-white pl-10 pr-9 text-[13px] font-medium text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB]/60 focus:outline-none"/>
              {searchQuery && (<button type="button" aria-label={L("Clear search")} onClick={() => {
                handleSearchChange("");
                searchInputRef.current?.focus();
            }} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                  <X size={14}/>
                </button>)}
            </div>
        
          <div className="inline-flex max-w-full items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
            <div role="tablist" aria-label={L("Filter tools by access")} className="inline-flex shrink-0 items-center gap-0.5">
              {([
            { key: "All", label: "All Tools" },
            { key: "Free", label: "Free" },
            { key: "Paid", label: "Paid" },
        ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (<button key={tab.key} role="tab" aria-selected={isActive} onClick={() => setActiveTab(tab.key)} className={`cursor-pointer rounded-md px-3.5 py-1.5 text-center text-[13px] font-medium transition-colors ${isActive
                    ? "bg-[#2563EB] text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                    {<T>{tab.label}</T>}
                  </button>);
        })}
            </div>

            {/* Divider between access tabs and category */}
            <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-slate-200"/>

            {/* Category dropdown (part of the same group) */}
            <div ref={categoryRef} className="relative shrink-0">
              <button type="button" aria-haspopup="listbox" aria-expanded={categoryOpen} onClick={() => setCategoryOpen((v) => !v)} className={`flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 ${selectedCategory !== "All"
            ? "bg-blue-50 text-[#2563EB]"
            : categoryOpen
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                <span className="max-w-[9rem] truncate">
                  {selectedCategory === "All"
        ? <T>{"Category"}</T> : <T>{selectedCategoryItem.name}</T>}
                </span>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}/>
              </button>

              {categoryOpen && (<div role="listbox" aria-label={L("Filter tools by category")} className="absolute right-0 top-full z-40 mt-2 w-52 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.18)] animate-in fade-in duration-150">
                  {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (<button key={cat.name} type="button" role="option" aria-selected={isSelected} onClick={() => {
                        setSelectedCategory(cat.name);
                        setCategoryOpen(false);
                    }} className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${isSelected
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                        <Icon size={15} className={`shrink-0 ${isSelected ? "text-[#2563EB]" : "text-slate-400"}`}/>
                        <span className="flex-1 truncate">
                          {cat.name === "All" ? <T>{"All Categories"}</T> : <T>{cat.name}</T>}
                        </span>
                        {isSelected && (<Check size={15} className="shrink-0 text-[#2563EB]"/>)}
                      </button>);
            })}
                </div>)}
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
