"use client";

import { T } from "@/components/i18n/I18nProvider";
import { type ReactNode, type ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  Clock3,
  Heart,
  LayoutGrid,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { getClientSession } from "@/lib/clientAuth";
import {
  PRINT_MEDIA_CATEGORIES,
  PRINT_MEDIA_TEMPLATES,
  type PrintMediaTemplate,
} from "./templateCatalog";

// Templates that rotate in the small featured strip at the top of the default (unfiltered) view.
const SPOTLIGHT_TEMPLATE_IDS = [9, 16, 7, 8, 6, 12, 2, 1];
const SPOTLIGHT_ROTATE_MS = 2800;

const FAVORITES_STORAGE_KEY = "sebalagbe-print-media-favorites-v1";

type SortOption = "Featured order" | "Newest first" | "Oldest first" | "By name";

// /print-media?category=... (from the navbar hover menu) selects that category, even when the page is already open.
function CategoryFromUrl({ onCategory }: { onCategory: (category: string) => void }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  useEffect(() => {
    if (category && PRINT_MEDIA_CATEGORIES.some((item) => item.name === category)) onCategory(category);
  }, [category, onCategory]);
  return null;
}

export default function PrintMediaPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPricing, setSelectedPricing] = useState("All");
  const [selectedSort, setSelectedSort] = useState<SortOption>("Featured order");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [spotIndex, setSpotIndex] = useState(0);
  const [spotPaused, setSpotPaused] = useState(false);

  useEffect(() => {
    let mounted = true;
    void getClientSession().then((session) => {
      if (!mounted) return;
      if (!session.authenticated) {
        router.replace("/login?callbackUrl=%2Fprint-media");
      }
    });
    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed.filter((value): value is number => Number.isInteger(value)));
        }
      }
    } catch {
      // Ignore unavailable or malformed local browser storage.
    } finally {
      setFavoritesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!favoritesLoaded) return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Favorites remain available for the current session if storage is disabled.
    }
  }, [favoriteIds, favoritesLoaded]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const template of PRINT_MEDIA_TEMPLATES) {
      counts.set(template.category, (counts.get(template.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const visibleTemplates = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const filtered = PRINT_MEDIA_TEMPLATES.filter((template) => {
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
      const matchesPricing =
        selectedPricing === "All" ||
        (selectedPricing === "Free" && template.isFree) ||
        (selectedPricing === "Paid" && !template.isFree);
      const matchesFavorite = !favoritesOnly || favoriteIds.includes(template.id);
      const searchable = `${template.title} ${template.category} ${template.categoryLabel} ${template.printSize}`.toLocaleLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesCategory && matchesPricing && matchesFavorite && matchesSearch;
    });

    switch (selectedSort) {
      case "Newest first":
        return [...filtered].sort((a, b) => b.id - a.id);
      case "Oldest first":
        return [...filtered].sort((a, b) => a.id - b.id);
      case "By name":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "bn"));
      default:
        return filtered;
    }
  }, [favoriteIds, favoritesOnly, searchQuery, selectedCategory, selectedPricing, selectedSort]);

  const handleResetFilter = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPricing("All");
    setSelectedSort("Featured order");
    setFavoritesOnly(false);
  };

  const toggleFavorite = (templateId: number) => {
    setFavoriteIds((current) =>
      current.includes(templateId)
        ? current.filter((id) => id !== templateId)
        : [...current, templateId],
    );
  };

  const openTemplate = (template: PrintMediaTemplate) => {
    router.push(`/print-media/editor/${template.id}`);
  };

  // Preview popup: browse the currently visible (filtered) templates with the arrows / keyboard.
  const previewIndex = previewId === null ? -1 : visibleTemplates.findIndex((template) => template.id === previewId);
  const previewTemplate = previewIndex >= 0 ? visibleTemplates[previewIndex] : null;
  const previewPrev = previewIndex > 0 ? visibleTemplates[previewIndex - 1] : null;
  const previewNext = previewIndex >= 0 && previewIndex < visibleTemplates.length - 1 ? visibleTemplates[previewIndex + 1] : null;

  const previewOpen = previewTemplate !== null;
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewId(null);
      else if (event.key === "ArrowLeft" && previewPrev) setPreviewId(previewPrev.id);
      else if (event.key === "ArrowRight" && previewNext) setPreviewId(previewNext.id);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [previewOpen, previewPrev, previewNext]);

  const categoryItems = [
    { name: "All", label: "সব", count: PRINT_MEDIA_TEMPLATES.length },
    ...PRINT_MEDIA_CATEGORIES.map((category) => ({
      ...category,
      count: categoryCounts.get(category.name) ?? 0,
    })),
  ];

  const sortOptions: { name: SortOption; icon: ReactNode }[] = [
    { name: "Featured order", icon: <Star size={15} /> },
    { name: "Newest first", icon: <Clock3 size={15} /> },
    { name: "Oldest first", icon: <Clock3 size={15} /> },
    { name: "By name", icon: <ArrowDownUp size={15} /> },
  ];

  const pricingOptions: { name: string; label: string }[] = [
    { name: "All", label: "All" },
    { name: "Free", label: "Free" },
    { name: "Paid", label: "Paid" },
  ];
  const freeCount = PRINT_MEDIA_TEMPLATES.filter((template) => template.isFree).length;
  const filtersActive =
    selectedCategory !== "All" || selectedPricing !== "All" || favoritesOnly || searchQuery.trim() !== "";

  const spotlightList = useMemo(
    () =>
      SPOTLIGHT_TEMPLATE_IDS.map((id) => PRINT_MEDIA_TEMPLATES.find((template) => template.id === id)).filter(
        (template): template is PrintMediaTemplate => Boolean(template),
      ),
    [],
  );
  const showSpotlight = spotlightList.length > 0 && !filtersActive;
  const spotlight = spotlightList.length > 0 ? spotlightList[spotIndex % spotlightList.length] : null;

  // Rotate the featured templates one after another (paused while the mouse is over the strip,
  // while a keyboard user is focused inside it, and while a popup is open).
  // With "reduce motion" the templates still change, just without the fade (see .pm-spot-in).
  useEffect(() => {
    if (!showSpotlight || spotPaused || previewOpen || spotlightList.length < 2) return;
    const timer = window.setInterval(() => setSpotIndex((index) => (index + 1) % spotlightList.length), SPOTLIGHT_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [showSpotlight, spotPaused, previewOpen, spotlightList.length]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F1E8D3]">
      <DashboardNavbar />
      <Suspense fallback={null}>
        <CategoryFromUrl onCategory={setSelectedCategory} />
      </Suspense>

      <div className="pm-page flex-1 w-full">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          .pm-page, .pm-page *:not(.font-mono):not(svg):not(svg *) {
            font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          .pm-page .pm-display { font-family: "Fraunces", "Hind Siliguri", "Noto Serif Bengali", Georgia, serif; letter-spacing: -0.025em; }
          .pm-page h1, .pm-page h2, .pm-page h3 { letter-spacing: -0.015em; }
          .pm-scroll { scrollbar-width: none; }
          .pm-scroll::-webkit-scrollbar { display: none; }
          .pm-stage { background: radial-gradient(ellipse at 50% 30%, #FBF4E0 0%, #EADDBE 62%, #E3D3AE 100%); }
          .pm-paper { filter: drop-shadow(0 1px 1px rgba(59,47,30,.25)) drop-shadow(0 14px 18px rgba(59,47,30,.22)); }
          .pm-card .pm-paper { transition: transform .55s cubic-bezier(.22,1,.36,1); }
          .pm-card:hover .pm-paper { transform: translateY(-4px) scale(1.025); }
          .pm-spot {
            background:
              radial-gradient(520px 260px at 100% 0%, rgba(255,226,170,.40), transparent 70%),
              radial-gradient(420px 220px at 0% 100%, rgba(153,27,27,.45), transparent 70%),
              linear-gradient(110deg, #DC2626 0%, #EA4A1F 50%, #F97316 100%);
          }
          /* soft diagonal shine that sweeps across the banner on every slide change */
          .pm-spot::after {
            content: ""; position: absolute; inset: 0; pointer-events: none;
            background: linear-gradient(105deg, transparent 35%, rgba(255,244,214,.22) 50%, transparent 65%);
            transform: translateX(-120%);
            animation: pmSpotShine .55s .02s cubic-bezier(.22,1,.36,1) both;
          }
          .pm-spot[data-k="1"]::after { animation-name: pmSpotShine2; }
          @keyframes pmSpotShine { to { transform: translateX(120%); } }
          @keyframes pmSpotShine2 { to { transform: translateX(120%); } }
          @keyframes pmSpotIn { from { opacity: 0; transform: translate3d(14px,0,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes pmSpotPaper { from { opacity: 0; transform: translate3d(0,6px,0) scale(.94); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
          @keyframes pmSpotText { from { opacity: 0; transform: translate3d(0,8px,0); } to { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes pmSpotBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          @keyframes pmSpotFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
          .pm-spot-in { animation: pmSpotIn .2s cubic-bezier(.16,1,.3,1) both; will-change: transform, opacity; }
          .pm-spot-in .pm-spot-paper { animation: pmSpotPaper .22s cubic-bezier(.16,1,.3,1) both; }
          .pm-spot-in .pm-spot-t1 { animation: pmSpotText .2s .015s cubic-bezier(.16,1,.3,1) both; }
          .pm-spot-in .pm-spot-t2 { animation: pmSpotText .2s .03s cubic-bezier(.16,1,.3,1) both; }
          .pm-spot-in .pm-spot-t3 { animation: pmSpotText .2s .045s cubic-bezier(.16,1,.3,1) both; }
          .pm-spot-in .pm-spot-cta { animation: pmSpotText .2s .06s cubic-bezier(.16,1,.3,1) both; }
          .pm-spot-bar { transform-origin: left; animation: pmSpotBar linear both; }
          .pm-spot[data-paused="1"] .pm-spot-bar { animation-play-state: paused; }
          .pm-spot-badge { animation: pmSpotFloat 2.4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .pm-spot-in, .pm-spot-in *, .pm-spot::after, .pm-spot-bar, .pm-spot-badge { animation: none !important; }
            .pm-card .pm-paper { transition: none; }
            .pm-card:hover .pm-paper { transform: none; }
          }
        `}</style>

        <div className="mx-auto w-full max-w-[1680px] px-4 sm:px-6 lg:px-10 pt-3 sm:pt-4 pb-10">
          {/* ---------- Header ---------- */}
          <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="flex flex-wrap items-center gap-x-2 text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#B8741F]">
                <span className="h-px w-8 bg-[#B8741F]" />
                <T>Original editable designs</T>
                <span className="ml-2 text-[12px] font-semibold normal-case tracking-normal text-[#8B7656]">
                  {PRINT_MEDIA_TEMPLATES.length} <T>original templates</T>
                  <span className="mx-2 text-[#C6B894]">•</span>
                  {freeCount} <T>Free</T>
                </span>
              </p>
              <h1 className="pm-display mt-1 text-[34px] sm:text-[44px] leading-[1.05] font-bold text-[#2B2113]">
                <T>Print Media</T>
              </h1>
              <p className="mt-1.5 text-[14px] sm:text-[15px] leading-6 font-medium text-[#6B5A40]">
                <T>বাংলাদেশের ব্যবসা, দোকান ও প্রতিষ্ঠানের জন্য নিজের মতো করে ডিজাইন তৈরি করুন।</T>
              </p>
            </div>

            <div className="w-full lg:max-w-[460px] lg:shrink-0">
              <div className="flex items-center gap-2 rounded-full bg-[#FFFBF0] py-1.5 pl-5 pr-1.5 shadow-[0_12px_30px_-18px_rgba(59,47,30,0.55)] ring-1 ring-[#DCCDA7] transition focus-within:ring-2 focus-within:ring-[#2B2113]">
                <Search size={18} className="shrink-0 text-[#8B7656]" />
                <input
                  type="search"
                  placeholder="টেমপ্লেটের নাম, ক্যাটাগরি বা কাজ লিখে খুঁজুন..."
                  value={searchQuery}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-2 text-[14px] font-semibold text-[#3B2F1E] placeholder:text-[#A99776] outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8B7656] hover:bg-[#EFE3C8] hover:text-[#3B2F1E] transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* ---------- Featured strip (rotates through a few templates) ---------- */}
          {showSpotlight && spotlight && (
            <section
              aria-label="Featured templates"
              aria-roledescription="carousel"
              onMouseEnter={() => setSpotPaused(true)}
              onMouseLeave={() => setSpotPaused(false)}
              onFocus={(event) => {
                // A mouse click also focuses a button; only keyboard focus should pause the rotation.
                if (event.target.matches?.(":focus-visible")) setSpotPaused(true);
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSpotPaused(false);
              }}
              data-paused={spotPaused ? "1" : "0"}
              data-k={spotIndex % 2}
              className="pm-spot relative mt-4 overflow-hidden rounded-[20px] border border-[#EA580C] shadow-[0_26px_50px_-26px_rgba(234,88,12,0.75)]"
            >
              <div key={spotlight.id} className="pm-spot-in flex flex-wrap items-center gap-x-3 gap-y-3 p-3 sm:gap-x-4 sm:px-5 sm:py-3.5 lg:flex-nowrap lg:gap-5">
                <button
                  type="button"
                  onClick={() => setPreviewId(spotlight.id)}
                  aria-label={`${spotlight.title} — preview`}
                  className="pm-stage group flex h-[76px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-xl p-1.5 opacity-90 ring-1 ring-[#FFF4D6]/40 sm:h-[84px] sm:w-[96px] sm:p-2 lg:w-[112px] focus-visible:outline-none focus-visible:ring-[#FFF4D6]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={spotlight.previewUrl}
                    alt={spotlight.title}
                    className="pm-paper pm-spot-paper max-h-full max-w-full rounded-[2px] bg-white object-contain transition-transform duration-300 group-hover:scale-[1.06]"
                  />
                </button>

                <div className="min-w-0 flex-1 basis-[55%] lg:basis-0">
                  <p className="pm-spot-t1 pm-spot-badge inline-flex items-center gap-2 rounded-full bg-[#FFF4D6] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#C2410C] shadow-sm">
                    <Sparkles size={13} />
                    <T>আজকের বাছাই</T>
                  </p>
                  <h2 className="pm-spot-t2 pm-display mt-1.5 truncate text-[22px] sm:text-[30px] lg:text-[34px] leading-[1.15] font-bold text-white drop-shadow-[0_2px_6px_rgba(80,10,10,0.35)]">{spotlight.title}</h2>
                  <p className="pm-spot-t3 mt-0.5 line-clamp-2 sm:line-clamp-1 text-[13px] sm:text-[15px] font-semibold text-white/95">
                    {spotlight.englishTitle} · {spotlight.categoryLabel} · {spotlight.printSize}
                  </p>
                </div>

                <div className="pm-spot-cta flex w-full shrink-0 items-center gap-2.5 lg:w-auto">
                  <button
                    type="button"
                    onClick={() => openTemplate(spotlight)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FFF4D6] px-5 py-2.5 text-[13px] lg:flex-none font-extrabold text-[#C2410C] shadow-[0_10px_20px_-10px_rgba(124,45,18,0.7)] transition duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#EA4A1F]"
                  >
                    <FileImage size={15} />
                    <T>Open template</T>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewId(spotlight.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#FFF4D6]/60 px-5 py-2.5 lg:flex-none text-[13px] font-bold text-[#FFF4D6] transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF4D6]"
                  >
                    <Eye size={15} />
                    <T>প্রিভিউ দেখুন</T>
                  </button>
                </div>
              </div>

              {spotlightList.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pb-3 lg:absolute lg:bottom-2.5 lg:right-5 lg:pb-0">
                  {spotlightList.map((item, index) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSpotIndex(index)}
                      aria-label={`${index + 1} / ${spotlightList.length}: ${item.title}`}
                      aria-current={index === spotIndex % spotlightList.length}
                      className="flex h-4 items-center px-0.5"
                    >
                      <span className={`block h-1.5 rounded-full transition-all duration-200 ${index === spotIndex % spotlightList.length ? "w-6 bg-[#FFF4D6]" : "w-1.5 bg-[#FFF4D6]/45 hover:bg-[#FFF4D6]/80"}`} />
                    </button>
                  ))}
                </div>
              )}

              {spotlightList.length > 1 && (
                <span
                  key={`bar-${spotIndex}-${spotPaused ? "p" : "r"}`}
                  aria-hidden="true"
                  className="pm-spot-bar pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-[#FFF4D6]/85"
                  style={{ animationDuration: `${SPOTLIGHT_ROTATE_MS}ms` }}
                />
              )}
            </section>
          )}

          {/* ---------- Category tabs ---------- */}
          <nav aria-label="Template categories" className="pm-scroll mt-3 flex items-end gap-1 overflow-x-auto border-b border-[#D6C7A2]">
            {categoryItems.map((category) => {
              const selected = selectedCategory === category.name;
              return (
                <button
                  type="button"
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  aria-pressed={selected}
                  className={`relative shrink-0 whitespace-nowrap px-4 pb-2 pt-1.5 text-[14px] sm:text-[15px] font-bold transition-colors ${selected ? "text-[#2B2113]" : "text-[#8B7656] hover:text-[#3B2F1E]"}`}
                >
                  {category.label}
                  <sup className={`ml-1 text-[11px] font-extrabold ${selected ? "text-[#DC2626]" : "text-[#A99776]"}`}>{category.count}</sup>
                  <span className={`absolute inset-x-3 -bottom-px h-[3px] rounded-full transition-all ${selected ? "bg-[#DC2626]" : "bg-transparent"}`} />
                </button>
              );
            })}
          </nav>

          {/* ---------- Toolbar ---------- */}
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div role="group" aria-label="Pricing" className="inline-flex rounded-full bg-[#E4D7B8]/70 p-1">
                {pricingOptions.map((option) => (
                  <button
                    type="button"
                    key={option.name}
                    onClick={() => setSelectedPricing(option.name)}
                    aria-pressed={selectedPricing === option.name}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition ${selectedPricing === option.name ? "bg-[#2B2113] text-[#FFF4D6] shadow-sm" : "text-[#6B5A40] hover:text-[#3B2F1E]"}`}
                  >
                    <T>{option.label}</T>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFavoritesOnly((value) => !value)}
                aria-pressed={favoritesOnly}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold transition ${favoritesOnly ? "bg-[#DC2626] text-white shadow-sm" : "bg-[#FFFBF0] text-[#5A4A32] ring-1 ring-inset ring-[#DCCDA7] hover:bg-[#F8EFD6]"}`}
              >
                <Heart size={15} className={favoritesOnly ? "fill-current" : "text-[#DC2626]"} />
                <T>My Favorites</T>
                <span>({favoriteIds.length})</span>
              </button>

              {filtersActive && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-[#6B5A40] hover:text-[#DC2626] transition-colors"
                >
                  <RotateCcw size={14} /> <T>Reset</T>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 md:justify-end">
              <span className="text-[13px] font-semibold text-[#6B5A40] whitespace-nowrap" aria-live="polite">
                <strong className="text-[#2B2113]">{visibleTemplates.length}</strong> <T>templates found</T>
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={isSortDropdownOpen}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FFFBF0] px-4 py-2 text-[13px] font-bold text-[#5A4A32] ring-1 ring-inset ring-[#DCCDA7] hover:bg-[#F8EFD6] transition"
                >
                  <SlidersHorizontal size={15} className="text-[#DC2626]" />
                  <T>Sort</T>
                  <ChevronDown size={14} className={`transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isSortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsSortDropdownOpen(false)} aria-hidden="true" />
                    <div role="listbox" className="absolute right-0 top-full z-30 mt-2 w-52 rounded-2xl border border-[#D8C9A6] bg-[#FFFBF0] p-1.5 shadow-xl">
                      {sortOptions.map((option) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedSort === option.name}
                          key={option.name}
                          onClick={() => {
                            setSelectedSort(option.name);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold ${selectedSort === option.name ? "bg-[#F6D9A8] text-[#B91C1C]" : "text-[#5A4A32] hover:bg-[#F3E9CF]"}`}
                        >
                          {option.icon}
                          <span><T>{option.name}</T></span>
                          {selectedSort === option.name && <Check size={14} className="ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Gallery: uniform cards, every design "sits" on the same studio mat ---------- */}
          {visibleTemplates.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1700px]:grid-cols-6">
              {visibleTemplates.map((template) => {
                const isFavorite = favoriteIds.includes(template.id);
                return (
                  <article key={template.id} className="pm-card group relative flex min-w-0 flex-col">
                    <div className="pm-stage relative aspect-[4/5] xl:aspect-[5/4] overflow-hidden rounded-[16px] ring-1 ring-[#D9C9A3] sm:rounded-[22px] shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_16px_34px_-24px_rgba(59,47,30,0.7)] transition-shadow duration-300 group-hover:shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_34px_52px_-28px_rgba(59,47,30,0.8)]">
                      <button
                        type="button"
                        onClick={() => setPreviewId(template.id)}
                        aria-label={`${template.title} — ${template.printSize}`}
                        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#DC2626]"
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 sm:p-6 xl:p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={template.previewUrl}
                          alt={template.title}
                          loading={template.id > 10 ? "lazy" : "eager"}
                          className="pm-paper max-h-full max-w-full rounded-[2px] bg-white object-contain"
                        />
                      </div>

                      <span className="pointer-events-none absolute left-2.5 top-2.5 sm:left-3.5 sm:top-3.5 z-10 rounded-full bg-[#2B2113]/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#F6D9A8]">
                        {template.isFree ? <T>Free</T> : <T>Paid</T>}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(template.id)}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={isFavorite}
                        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-[#E3D6B8] backdrop-blur transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                      >
                        <Heart size={16} className={isFavorite ? "fill-[#DC2626] text-[#DC2626]" : "text-[#7B6A4D]"} />
                      </button>

                      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex max-sm:hidden translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                        <button
                          type="button"
                          onClick={() => setPreviewId(template.id)}
                          className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FFFBF0]/95 py-2.5 text-[13px] font-extrabold text-[#2B2113] shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                        >
                          <Eye size={14} className="text-[#DC2626]" />
                          <T>প্রিভিউ</T>
                        </button>
                        <button
                          type="button"
                          onClick={() => openTemplate(template)}
                          className="pointer-events-auto inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#2B2113] py-2.5 text-[13px] font-extrabold text-[#FFF4D6] shadow-md transition hover:bg-[#3B2F1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-1"
                        >
                          <FileImage size={14} />
                          <T>Open template</T>
                        </button>
                      </div>
                    </div>

                    <div className="px-1 pt-2.5">
                      <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#B8741F]">
                        {template.categoryLabel}
                        <span className="mx-1.5 text-[#C6B894]">·</span>
                        <span className="normal-case tracking-normal text-[#8B7656]">{template.printSize}</span>
                      </p>
                      <h3 className="mt-0.5 line-clamp-1 text-[13px] sm:text-[15px] font-bold leading-6 text-[#2B2113]" title={template.title}>{template.title}</h3>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-[#D2C29B] bg-[#FFFBF0] px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F2E8D2] text-[#A58C62]">
                <LayoutGrid size={24} />
              </div>
              <h3 className="text-lg font-extrabold text-[#2B2113]"><T>No templates found</T></h3>
              <p className="mt-1 text-sm text-[#8B7656]"><T>Try another search or reset the filters.</T></p>
              <button type="button" onClick={handleResetFilter} className="mt-5 rounded-full bg-[#2B2113] px-6 py-2.5 text-sm font-bold text-[#FFF4D6] transition hover:bg-[#3B2F1E]">
                <T>Reset filters</T>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Template preview popup ---------- */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2B2113]/80 p-3 sm:p-6 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-label={previewTemplate.title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewId(null);
          }}
        >
          <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] bg-[#F6EEDB] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.8)] md:flex-row">
            <button
              type="button"
              onClick={() => setPreviewId(null)}
              aria-label="Close preview"
              className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#5A4A32] shadow ring-1 ring-[#E3D6B8] transition hover:bg-white hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
            >
              <X size={18} />
            </button>

            {/* big preview */}
            <div className="relative flex min-h-[260px] flex-1 items-center justify-center bg-[#E4D7B8]/60 p-4 sm:p-8 md:min-h-0">
              {previewPrev && (
                <button
                  type="button"
                  onClick={() => setPreviewId(previewPrev.id)}
                  aria-label="Previous template"
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#3B2F1E] shadow-md ring-1 ring-[#E3D6B8] transition hover:scale-105 hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previewTemplate.id}
                src={previewTemplate.previewUrl}
                alt={previewTemplate.title}
                className="max-h-[56vh] w-auto max-w-full rounded-lg bg-white object-contain shadow-[0_18px_40px_-18px_rgba(59,47,30,0.7)] ring-1 ring-[#D8C9A6] md:max-h-[82vh]"
              />
              {previewNext && (
                <button
                  type="button"
                  onClick={() => setPreviewId(previewNext.id)}
                  aria-label="Next template"
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#3B2F1E] shadow-md ring-1 ring-[#E3D6B8] transition hover:scale-105 hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* details */}
            <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto p-5 sm:p-6 md:w-[320px]">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#A06A32]">{previewTemplate.categoryLabel}</p>
                <h2 className="mt-1 pr-10 text-[22px] font-extrabold leading-8 text-[#3B2F1E] md:pr-0">{previewTemplate.title}</h2>
                <p className="mt-0.5 text-[13px] font-semibold text-[#8B7656]">{previewTemplate.englishTitle}</p>
              </div>

              <p className="text-[13px] leading-6 text-[#6B5A40]">{previewTemplate.description}</p>

              <dl className="grid grid-cols-2 gap-2">
                {[
                  { label: "প্রিন্ট সাইজ", value: previewTemplate.printSize },
                  { label: "অনুপাত", value: previewTemplate.aspectRatio },
                  { label: "এডিট করা যায়", value: `${previewTemplate.objectCount} টি অংশ` },
                  { label: "মূল্য", value: previewTemplate.isFree ? "ফ্রি" : "পেইড" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[#FBF6E8] px-3 py-2.5 ring-1 ring-inset ring-[#E3D6B8]">
                    <dt className="text-[11px] font-semibold text-[#8B7656]">{item.label}</dt>
                    <dd className="mt-0.5 text-[13px] font-bold text-[#3B2F1E]">{item.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openTemplate(previewTemplate)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E86618] px-4 py-3 text-[14px] font-extrabold text-white shadow-sm transition hover:bg-[#D9570C] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
                >
                  <FileImage size={16} />
                  <T>Open template</T>
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(previewTemplate.id)}
                  aria-pressed={favoriteIds.includes(previewTemplate.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FBF6E8] px-4 py-2.5 text-[13px] font-bold text-[#5A4A32] ring-1 ring-inset ring-[#E3D6B8] transition hover:bg-[#F1E6CB]"
                >
                  <Heart size={15} className={favoriteIds.includes(previewTemplate.id) ? "fill-[#DC2626] text-[#DC2626]" : "text-[#DC2626]"} />
                  {favoriteIds.includes(previewTemplate.id) ? "ফেভারিট থেকে সরান" : "ফেভারিটে রাখুন"}
                </button>
                <p className="pt-1 text-center text-[11px] font-medium text-[#8B7656]">
                  {previewIndex + 1} / {visibleTemplates.length} · ← → <T>দিয়ে অন্য টেমপ্লেট দেখুন</T>
                </p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
