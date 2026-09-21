"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { TEMPLATE_IMAGE_URLS } from "./templateImageUrls";
import {
  Search,
  SlidersHorizontal,
  Clock3,
  TrendingUp,
  ArrowDownAZ,
  Heart,
  X,
  RotateCcw,
  UserRound,
  VenusAndMars,
  Baby,
  Package,
  Upload,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

type Gender = "All" | "Male" | "Female" | "Children" | "Product";
type ImageCount = 1 | 2 | 3;
type Orientation = "Portrait" | "Landscape" | "Square";
type SortType = "Newest" | "Popular" | "ASC" | "DESC";

type Template = {
  id: number;
  title: string;
  category: string;
  gender: Gender;
  imageCount: ImageCount;
  orientation: Orientation;
  tags: string[];
  image: string;
  created: number;
};

const FALLBACK_CATEGORIES = [
  "All",
  "80s Style Vintage",
  "Motivational",
  "Creative Shots",
  "Victory Day",
  "Photo restoration",
  "Wedding Photo",
  "Product Advertisement",
  "Baby and Kids",
  "Couple Portraits",
  "Father's Day",
  "Greeting card",
  "Birthday wishes",
  "Family photo",
];

const HASHTAGS = [
  "#3d character",
  "#3d illusion",
  "#3d typography",
  "#3rd birthday",
  "#80s",
  "#80s fashion",
  "#90s",
  "#abduction",
  "#abstract art",
  "#action",
  "#action portrait",
  "#adventure",
  "#advertisement",
  "#advertising",
  "#aesthetic",
  "#age",
  "#ai video",
  "#airplane",
  "#airport",
  "#alley",
  "#art",
  "#baby",
  "#bangladesh",
];

function humanizeSlug(url: string) {
  const path = new URL(url).pathname;
  const slug =
    path.split("/").filter(Boolean).slice(-2, -1)[0] || "ai-template";
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(slug: string) {
  const s = slug.toLowerCase();

  if (/product|campaign|ad-|advertisement/.test(s))
    return "Product Advertisement";
  if (/wedding|couple|anniversary|romantic|love|bride|groom/.test(s))
    return "Wedding Photo";
  if (/baby|kid|child|daughter|mother|birthday/.test(s)) return "Baby and Kids";
  if (/vintage|80s|90s|retro|pub|heritage/.test(s)) return "80s Style Vintage";
  if (/quote|wisdom|mindset|motivational|strength|journey|dream/.test(s))
    return "Motivational";
  if (/victory|bangladesh|flag/.test(s)) return "Victory Day";
  if (/restore|restoration|repair/.test(s)) return "Photo restoration";
  if (/family|mother-daughter|father|parents/.test(s)) return "Family photo";
  return "Creative Shots";
}

function inferGender(slug: string): Gender {
  const s = slug.toLowerCase();

  if (/product|campaign|advertisement|ad-/.test(s)) return "Product";
  if (/baby|kid|child|daughter/.test(s)) return "Children";
  if (/woman|girl|saree|bridal|bride|female|lady/.test(s)) return "Female";
  if (/man|male|gentleman|boy|businessman|guy/.test(s)) return "Male";
  return "All";
}

function inferImageCount(slug: string): ImageCount {
  const s = slug.toLowerCase();

  if (/triptych|collage|contact-sheet|three|triple|3-/.test(s)) return 3;
  if (/couple|diptych|double|mother-daughter|family/.test(s)) return 2;
  return 1;
}

function inferOrientation(slug: string): Orientation {
  const s = slug.toLowerCase();

  if (/square/.test(s)) return "Square";
  if (
    /landscape|wide|banner|cover|triptych|collage|contact-sheet|diptych/.test(s)
  ) {
    return "Landscape";
  }
  return "Portrait";
}

function slugWords(url: string) {
  const raw = humanizeSlug(url).toLowerCase();
  return raw
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2)
    .slice(0, 5);
}

const templates: Template[] = TEMPLATE_IMAGE_URLS.map((image, index) => {
  const title = humanizeSlug(image);
  const slug = title.toLowerCase();

  return {
    id: index + 1,
    title,
    category: inferCategory(slug),
    gender: inferGender(slug),
    imageCount: inferImageCount(slug),
    orientation: inferOrientation(slug),
    tags: slugWords(image),
    image,
    created: TEMPLATE_IMAGE_URLS.length - index,
  };
});

function IconButton({
  active,
  children,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        active
          ? "border-[#ff6b49] bg-[#fff1e9] text-[#eb6841]"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function LazyTemplateImage({
  src,
  alt,
  orientation,
  className = "",
}: {
  src: string;
  alt: string;
  orientation: Orientation;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const node = containerRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "350px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoad]);

  const aspectRatio =
    orientation === "Landscape"
      ? "4 / 3"
      : orientation === "Square"
        ? "1 / 1"
        : "4 / 5";

  return (
    <div
      ref={containerRef}
      className={`lazy-image-shell ${className}`}
      style={{ aspectRatio }}
    >
      {shouldLoad ? (
        <img
          src={src}
          alt={alt}
          className="lazy-template-image"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
      ) : (
        <div className="lazy-image-placeholder" aria-hidden="true">
          <div className="lazy-image-spinner" />
        </div>
      )}
    </div>
  );
}

export default function AITemplatePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState<Gender>("All");
  const [imageCount, setImageCount] = useState("All");
  const [orientation, setOrientation] = useState<Orientation | "All">("All");
  const [sortType, setSortType] = useState<SortType>("Newest");
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [alertVisible, setAlertVisible] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState("All");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: templates.length };
    templates.forEach((template) => {
      counts[template.category] = (counts[template.category] || 0) + 1;
    });
    return counts;
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setGender("All");
    setImageCount("All");
    setOrientation("All");
    setSortType("Newest");
    setShowFavorites(false);
    setSelectedColor("All");
  };

  const filteredTemplates = useMemo(() => {
    const text = search.trim().toLowerCase();

    let list = templates.filter((template) => {
      const matchesSearch =
        !text ||
        template.title.toLowerCase().includes(text) ||
        template.category.toLowerCase().includes(text) ||
        template.tags.some((tag) => tag.includes(text));

      const matchesCategory =
        category === "All" || template.category === category;

      const matchesGender =
        gender === "All" ||
        template.gender === gender ||
        template.gender === "All";

      const matchesImageCount =
        imageCount === "All" || String(template.imageCount) === imageCount;

      const matchesOrientation =
        orientation === "All" || template.orientation === orientation;

      const matchesFavorite = !showFavorites || favorites.includes(template.id);

      const matchesColor =
        selectedColor === "All" || template.id % 8 === Number(selectedColor);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGender &&
        matchesImageCount &&
        matchesOrientation &&
        matchesFavorite &&
        matchesColor
      );
    });

    if (sortType === "Popular") {
      list = [...list].sort((a, b) => {
        const aScore = a.tags.length * 23 + (a.id % 41);
        const bScore = b.tags.length * 23 + (b.id % 41);
        return bScore - aScore;
      });
    }

    if (sortType === "ASC") {
      list = [...list].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        }),
      );
    }

    if (sortType === "DESC") {
      list = [...list].sort((a, b) =>
        b.title.localeCompare(a.title, undefined, {
          sensitivity: "base",
        }),
      );
    }

    if (sortType === "Newest") {
      list = [...list].sort((a, b) => b.created - a.created);
    }

    return list;
  }, [
    search,
    category,
    gender,
    imageCount,
    orientation,
    sortType,
    showFavorites,
    favorites,
    selectedColor,
  ]);

  const selectedTemplate =
    selectedIndex === null ? null : filteredTemplates[selectedIndex] || null;

  const openTemplate = (template: Template) => {
    const index = filteredTemplates.findIndex(
      (item) => item.id === template.id,
    );
    setSelectedIndex(index >= 0 ? index : 0);
  };

  const moveSelected = (direction: number) => {
    if (selectedIndex === null || filteredTemplates.length === 0) return;
    const next =
      (selectedIndex + direction + filteredTemplates.length) %
      filteredTemplates.length;
    setSelectedIndex(next);
  };

  const categories = [
    ...FALLBACK_CATEGORIES.filter(
      (item) => item === "All" || categoryCounts[item],
    ),
  ];

  return (
    <div className="ai-page">
      <DashboardNavbar />

      {alertVisible && (
        <div className="credit-alert">
          <div className="credit-left">
            <div className="credit-danger-icon">!</div>
            <div>
              <div className="credit-title">Your credit is running low!</div>
              <div className="credit-sub">
                Currently you have only <b>0</b> credits left.
              </div>
            </div>
          </div>

          <div className="credit-actions">
            <button className="buy-credit">Click here to buy credit →</button>
            <button
              className="close-alert"
              onClick={() => setAlertVisible(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="main-content">
        <section className="page-header">
          <div>
            <h1>AI Template</h1>
            <p>
              Pick a style you like, upload your photo, and we'll generate the
              same look for you in seconds.
            </p>
          </div>

          <div className="page-actions">
            <button
              className={`sort-pill ${sortType === "Newest" ? "selected" : ""}`}
              onClick={() => setSortType("Newest")}
            >
              <Clock3 size={14} />
              Newest first
            </button>

            <button
              className={`sort-pill ${sortType === "Popular" ? "selected-light" : ""}`}
              onClick={() => setSortType("Popular")}
            >
              <TrendingUp size={14} />
              Popular
            </button>

            <button
              className={`sort-pill ${sortType === "ASC" || sortType === "DESC" ? "selected-light" : ""}`}
              onClick={() =>
                setSortType((prev) => (prev === "ASC" ? "DESC" : "ASC"))
              }
            >
              <ArrowDownAZ size={14} />
              Sort: {sortType === "DESC" ? "DESC" : "ASC"}
            </button>

            <button
              className={`sort-pill favorites-btn ${showFavorites ? "favorite-active" : ""}`}
              onClick={() => setShowFavorites((prev) => !prev)}
            >
              <Heart size={14} fill={showFavorites ? "currentColor" : "none"} />
              My Favorites
            </button>
          </div>
        </section>

        <div className="workspace">
          <aside className="sidebar">
            <div className="sidebar-heading">
              <span>Filter</span>
              <button onClick={resetFilters}>
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            <div className="filter-section-title">CATEGORY</div>

            <div className="category-list">
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`category-row ${category === item ? "active" : ""}`}
                >
                  <span>{item}</span>
                  <b>{(categoryCounts[item] || 0).toLocaleString()}</b>
                </button>
              ))}
            </div>

            <div className="filter-group">
              <div className="filter-section-title">GENDER</div>

              <div className="gender-grid">
                {[
                  ["All", <VenusAndMars size={14} />],
                  ["Male", <UserRound size={14} />],
                  ["Female", <VenusAndMars size={14} />],
                  ["Children", <Baby size={14} />],
                  ["Product", <Package size={14} />],
                ].map(([item, icon]) => (
                  <button
                    type="button"
                    key={String(item)}
                    className={`gender-card ${gender === item ? "active" : ""}`}
                    onClick={() => setGender(item as Gender)}
                  >
                    {icon}
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">IMAGE COUNT</div>

              <div className="radio-list">
                {[
                  ["All", ""],
                  ["1 image", "1"],
                  ["2 images", "2"],
                  ["3+ images", "3"],
                ].map(([label, value]) => (
                  <button
                    type="button"
                    key={label}
                    className={`radio-row ${imageCount === (value || "All") ? "active" : ""}`}
                    onClick={() => setImageCount(value || "All")}
                  >
                    <span
                      className={`radio-dot ${imageCount === (value || "All") ? "checked" : ""}`}
                    />
                    <span>
                      <strong>{label}</strong>
                      <small>
                        {label === "All"
                          ? ""
                          : label === "1 image"
                            ? "Single portrait"
                            : label === "2 images"
                              ? "Couple / family"
                              : "Group / more than 2 people"}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">ORIENTATION</div>

              <div className="orientation-grid">
                {["All", "Portrait", "Landscape", "Square"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={`orientation-card ${orientation === item ? "active" : ""}`}
                    onClick={() => setOrientation(item as Orientation | "All")}
                  >
                    <span
                      className={`orientation-icon orientation-${item.toLowerCase()}`}
                    />
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">COLOR</div>

              <div className="color-grid">
                {[
                  [
                    "All",
                    "linear-gradient(135deg,#ff3e3e,#ffd600,#23c96b,#3c74ff)",
                  ],
                  ["1", "#ff4545"],
                  ["2", "#ff9800"],
                  ["3", "#ffd11a"],
                  ["4", "#1fbc60"],
                  ["5", "#ff9400"],
                  ["6", "#9b4cff"],
                  ["7", "#4a4a53"],
                ].map(([value, color]) => (
                  <button
                    type="button"
                    key={value}
                    className={`color-dot-wrap ${selectedColor === value ? "active" : ""}`}
                    onClick={() => setSelectedColor(value)}
                    aria-label={`Color ${value}`}
                  >
                    <span className="color-dot" style={{ background: color }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-section-title">SORT</div>

              <div className="sort-side-list">
                {[
                  ["Popular", "Popular"],
                  ["Newest first", "Newest"],
                  ["Oldest first", "Oldest"],
                  ["By name", "ASC"],
                ].map(([label, value]) => (
                  <button
                    type="button"
                    key={label}
                    className={`sort-side-row ${sortType === value ? "active" : ""}`}
                    onClick={() => {
                      if (value === "Oldest") {
                        setSortType("DESC");
                      } else {
                        setSortType(value as SortType);
                      }
                    }}
                  >
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="content-area">
            <div className="search-row">
              <div className="search-box">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or category..."
                />
                {search && (
                  <button onClick={() => setSearch("")} aria-label="Clear">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="tag-row">
              {HASHTAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className="tag-chip"
                  onClick={() => setSearch(tag.replace("#", ""))}
                >
                  {tag}
                </button>
              ))}

              <button className="small-sort">
                <SlidersHorizontal size={13} />
                Sort
                <span>⌄</span>
              </button>
            </div>

            <div className="result-row">
              <span>
                {filteredTemplates.length.toLocaleString()} templates found
              </span>

              <span>
                {TEMPLATE_IMAGE_URLS.length.toLocaleString()} source images
                loaded
              </span>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-heart">
                  <Search size={28} />
                </div>

                <p>
                  {showFavorites
                    ? "No favorite templates yet."
                    : "No template found for your current filters."}
                </p>

                <button className="reset-empty" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="masonry-grid">
                {filteredTemplates.map((template) => {
                  const isFavorite = favorites.includes(template.id);

                  return (
                    <article
                      className="template-card"
                      key={template.id}
                      onClick={() => openTemplate(template)}
                    >
                      <LazyTemplateImage
                        src={template.image}
                        alt={template.title}
                        orientation={template.orientation}
                      />

                      <div className="image-overlay" />

                      <div className="uses-badge">
                        {template.imageCount === 1
                          ? "1 image"
                          : `${template.imageCount}+ images`}
                      </div>

                      <button
                        className={`card-heart ${
                          isFavorite ? "card-heart-active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(template.id);
                        }}
                        aria-label="Favorite"
                      >
                        <Heart
                          size={16}
                          fill={isFavorite ? "currentColor" : "none"}
                        />
                      </button>

                      <div className="template-hover">
                        <div>
                          <strong>{template.title}</strong>
                          <span>{template.category}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTemplate(template);
                          }}
                        >
                          View template
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="floating-tools">
        <button className="yellow-float">↕</button>
        <button className="red-float">
          <span>▶</span>
        </button>
      </div>

      {selectedTemplate && selectedIndex !== null && (
        <div className="modal-backdrop" onClick={() => setSelectedIndex(null)}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close preview"
            >
              <X size={19} />
            </button>

            <button
              className="modal-nav modal-prev"
              onClick={() => moveSelected(-1)}
              aria-label="Previous template"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              className="modal-nav modal-next"
              onClick={() => moveSelected(1)}
              aria-label="Next template"
            >
              <ChevronRight size={20} />
            </button>

            <div className="modal-image">
              <img src={selectedTemplate.image} alt={selectedTemplate.title} />
            </div>

            <div className="modal-details">
              <span className="modal-category">
                {selectedTemplate.category}
              </span>

              <h2>{selectedTemplate.title}</h2>

              <p>
                Preview this exact template image. Upload your photo to use this
                visual style in your workflow.
              </p>

              <div className="modal-meta">
                <span>{selectedTemplate.orientation}</span>
                <span>
                  {selectedTemplate.imageCount === 1
                    ? "Single image"
                    : selectedTemplate.imageCount === 2
                      ? "2 images"
                      : "3+ images"}
                </span>
                <span>{selectedTemplate.gender}</span>
              </div>

              <div className="modal-tags">
                {selectedTemplate.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>

              <div className="modal-source">
                <ImageIcon size={14} />
                <span>Template image loaded from your supplied URL list</span>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-primary"
                  onClick={() =>
                    alert(`Using template: ${selectedTemplate.title}`)
                  }
                >
                  <Upload size={17} />
                  Upload photo
                </button>

                <button
                  className={`modal-secondary ${
                    favorites.includes(selectedTemplate.id)
                      ? "modal-favorite-active"
                      : ""
                  }`}
                  onClick={() => toggleFavorite(selectedTemplate.id)}
                >
                  <Heart
                    size={17}
                    fill={
                      favorites.includes(selectedTemplate.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {favorites.includes(selectedTemplate.id)
                    ? "Favorited"
                    : "Favorite"}
                </button>

                <a
                  className="modal-external"
                  href={selectedTemplate.image}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .ai-page {
          min-height: 100vh;
          background: #f7f0ec;
          color: #24211f;
        }

        .credit-alert {
          margin: 15px 18px 10px;
          min-height: 50px;
          border-radius: 10px;
          border: 1px solid #ffcbc9;
          background: #fff1f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
        }

        .credit-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .credit-danger-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          color: #fff;
          background: #ec4d49;
          font-weight: 900;
          font-size: 13px;
        }

        .credit-title {
          font-size: 10px;
          font-weight: 900;
          color: #cc4b47;
        }

        .credit-sub {
          margin-top: 2px;
          font-size: 9px;
          color: #ce7773;
        }

        .credit-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .buy-credit {
          height: 28px;
          padding: 0 11px;
          border-radius: 7px;
          background: #0aa873;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
        }

        .close-alert {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          color: #b6a9a5;
        }

        .main-content {
          padding: 4px 16px 30px;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
        }

        .page-header h1 {
          margin: 0;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -0.6px;
        }

        .page-header p {
          margin: 5px 0 0;
          font-size: 11px;
          color: #817873;
        }

        .page-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .sort-pill {
          height: 30px;
          padding: 0 10px;
          border: 1px solid #e5dfdb;
          border-radius: 8px;
          background: #fff;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #6d6764;
          font-size: 9px;
          font-weight: 800;
        }

        .sort-pill.selected {
          color: #fff;
          border-color: #df7830;
          background: #e78435;
        }

        .sort-pill.selected-light,
        .sort-pill.favorite-active {
          border-color: #f3d2b6;
          background: #fff8f1;
          color: #d97333;
        }

        .workspace {
          display: grid;
          grid-template-columns: 248px minmax(0, 1fr);
          gap: 13px;
          align-items: start;
        }

        .sidebar {
          background: #fff;
          border: 1px solid #e6dfdb;
          border-radius: 11px;
          padding: 12px 10px;
          position: sticky;
          top: 12px;
          max-height: calc(100vh - 140px);
          overflow: auto;
        }

        .sidebar-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 900;
          color: #4e4845;
        }

        .sidebar-heading button {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #b4aca8;
          font-size: 9px;
        }

        .filter-section-title {
          margin: 14px 0 7px;
          color: #a29995;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .category-list {
          max-height: 245px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .category-row {
          width: 100%;
          min-height: 28px;
          padding: 0 8px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: #615a57;
          font-size: 9px;
          text-align: left;
        }

        .category-row b {
          min-width: 22px;
          padding: 3px 5px;
          border-radius: 10px;
          background: #f3efed;
          color: #8a817d;
          font-size: 8px;
          text-align: center;
        }

        .category-row.active {
          background: #fff0e6;
          color: #dc6e32;
          font-weight: 900;
        }

        .category-row.active b {
          background: #fff;
          color: #e78946;
        }

        .filter-group {
          margin-top: 5px;
        }

        .gender-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 5px;
        }

        .gender-card,
        .orientation-card {
          min-height: 50px;
          border: 1px solid #e7e0dc;
          border-radius: 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #fff;
          color: #6a625f;
          font-size: 8px;
          font-weight: 700;
        }

        .gender-card.active,
        .orientation-card.active {
          color: #e96f32;
          border-color: #ff7c43;
          background: #fff9f5;
        }

        .radio-list,
        .sort-side-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .radio-row,
        .sort-side-row {
          width: 100%;
          padding: 6px 7px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          color: #6a625f;
          font-size: 9px;
        }

        .radio-row.active,
        .sort-side-row.active {
          background: #fff1e7;
          color: #d97333;
        }

        .radio-row strong {
          display: block;
          font-size: 9px;
        }

        .radio-row small {
          display: block;
          margin-top: 1px;
          color: #a79d98;
          font-size: 7px;
        }

        .radio-dot {
          width: 12px;
          height: 12px;
          border: 1px solid #c9c1bd;
          border-radius: 50%;
          flex: none;
        }

        .radio-dot.checked {
          border-color: #df7d34;
          box-shadow: inset 0 0 0 3px #fff;
          background: #df7d34;
        }

        .orientation-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .orientation-card {
          min-height: 55px;
        }

        .orientation-icon {
          display: block;
          border: 1.5px solid currentColor;
          border-radius: 2px;
        }

        .orientation-all {
          width: 14px;
          height: 14px;
        }
        .orientation-portrait {
          width: 10px;
          height: 14px;
        }
        .orientation-landscape {
          width: 14px;
          height: 9px;
        }
        .orientation-square {
          width: 12px;
          height: 12px;
        }

        .color-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .color-dot-wrap {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 2px solid transparent;
        }

        .color-dot-wrap.active {
          border-color: #e9773b;
        }

        .color-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .sort-side-row {
          padding: 6px 7px;
        }

        .content-area {
          min-width: 0;
        }

        .search-row {
          display: flex;
          gap: 8px;
        }

        .search-box {
          flex: 1;
          height: 38px;
          padding: 0 10px;
          border: 1px solid #e4ddda;
          border-radius: 8px;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #a39a96;
        }

        .search-box input {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #5e5854;
          font-size: 10px;
        }

        .search-box input::placeholder {
          color: #a9a19d;
        }

        .search-box button {
          color: #a49a96;
        }

        .tag-row {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          margin-top: 10px;
          padding-bottom: 2px;
        }

        .tag-chip {
          flex: none;
          padding: 6px 9px;
          border: 1px solid #e5dedb;
          border-radius: 14px;
          background: #fff;
          color: #6b6460;
          font-size: 8px;
          font-weight: 700;
        }

        .small-sort {
          margin-left: auto;
          flex: none;
          padding: 6px 9px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #e5dedb;
          border-radius: 14px;
          background: #fff;
          color: #6d6561;
          font-size: 8px;
          font-weight: 800;
        }

        .small-sort span {
          color: #8e8885;
        }

        .result-row {
          margin: 10px 0 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #8d8581;
          font-size: 9px;
        }

        .masonry-grid {
          column-count: 6;
          column-gap: 11px;
          width: 100%;
        }

        .template-card {
          position: relative;
          width: 100%;
          display: inline-block;
          margin: 0 0 11px;
          break-inside: avoid;
          overflow: hidden;
          border-radius: 11px;
          background: #ddd;
          cursor: pointer;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
          transform: translateZ(0);
        }

        .lazy-image-shell {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #ebe5e1;
        }

        .lazy-template-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #ece5e1;
          transition:
            transform 0.25s ease,
            filter 0.25s ease;
        }

        .lazy-image-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: linear-gradient(
            110deg,
            #eee7e3 8%,
            #f8f4f1 18%,
            #eee7e3 33%
          );
          background-size: 200% 100%;
          animation: lazy-template-shimmer 1.35s linear infinite;
        }

        .lazy-image-spinner {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          border: 2px solid rgba(112, 98, 91, 0.18);
          border-top-color: #de7b39;
          animation: lazy-template-spin 0.8s linear infinite;
        }

        @keyframes lazy-template-shimmer {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes lazy-template-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .template-card img {
          width: 100%;
          display: block;
        }

        .template-card:hover img {
          transform: scale(1.03);
          filter: brightness(0.97);
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to bottom, rgba(0, 0, 0, 0.18), transparent 24%),
            linear-gradient(to top, rgba(0, 0, 0, 0.28), transparent 28%);
        }

        .uses-badge {
          position: absolute;
          top: 7px;
          right: 7px;
          z-index: 2;
          padding: 4px 7px;
          border-radius: 10px;
          color: #fff;
          background: rgba(24, 24, 24, 0.72);
          backdrop-filter: blur(4px);
          font-size: 7px;
          font-weight: 900;
        }

        .card-heart {
          position: absolute;
          top: 7px;
          left: 7px;
          z-index: 3;
          width: 29px;
          height: 29px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          color: #7c7470;
          display: grid;
          place-items: center;
          opacity: 0;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.12);
        }

        .template-card:hover .card-heart,
        .card-heart-active {
          opacity: 1;
        }

        .card-heart-active {
          color: #ef4b4b;
        }

        .template-hover {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 8px;
          z-index: 4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          opacity: 0;
          transform: translateY(5px);
          transition: all 0.2s ease;
        }

        .template-card:hover .template-hover {
          opacity: 1;
          transform: translateY(0);
        }

        .template-hover > div {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .template-hover strong {
          color: #fff;
          font-size: 8px;
          line-height: 1.2;
        }

        .template-hover span {
          margin-top: 2px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 7px;
        }

        .template-hover button {
          flex: none;
          border-radius: 7px;
          padding: 6px 8px;
          background: #fff;
          color: #333;
          font-size: 8px;
          font-weight: 900;
        }

        .empty-state {
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #837a76;
        }

        .empty-heart {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #f1ebe8;
          color: #beb5b0;
        }

        .empty-state p {
          margin: 12px 0 0;
          font-size: 11px;
        }

        .reset-empty {
          margin-top: 14px;
          height: 33px;
          padding: 0 13px;
          border-radius: 8px;
          background: #e97f31;
          color: #fff;
          font-size: 9px;
          font-weight: 900;
        }

        .floating-tools {
          position: fixed;
          left: 10px;
          bottom: 12px;
          z-index: 60;
          display: flex;
          gap: 7px;
        }

        .yellow-float,
        .red-float {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
        }

        .yellow-float {
          background: #ff9d00;
          color: #fff;
          font-size: 18px;
        }

        .red-float {
          background: #eb3d3d;
          color: #fff;
          border: 3px solid #fff;
          font-size: 12px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(23, 19, 17, 0.62);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .template-modal {
          position: relative;
          width: min(1020px, 96vw);
          max-height: 92vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.28);
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 7;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #615b57;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          z-index: 7;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.94);
          color: #55504c;
          transform: translateY(-50%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .modal-prev {
          left: 12px;
        }
        .modal-next {
          left: calc(100% - 394px);
        }

        .modal-image {
          min-height: 560px;
          max-height: 92vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ece6e2;
        }

        .modal-image img {
          width: 100%;
          height: 100%;
          max-height: 92vh;
          display: block;
          object-fit: cover;
        }

        .modal-details {
          padding: 33px 28px;
          overflow-y: auto;
        }

        .modal-category {
          display: inline-flex;
          width: max-content;
          padding: 5px 9px;
          border-radius: 9px;
          background: #fff0e3;
          color: #dc7430;
          font-size: 8px;
          font-weight: 900;
        }

        .modal-details h2 {
          margin: 12px 0 8px;
          font-size: 23px;
          line-height: 1.2;
          letter-spacing: -0.5px;
          color: #24211f;
        }

        .modal-details p {
          margin: 0;
          color: #7d7470;
          font-size: 11px;
          line-height: 1.7;
        }

        .modal-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 17px 0 12px;
        }

        .modal-meta span,
        .modal-tags span {
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid #e9e1dd;
          color: #665f5b;
          font-size: 8px;
          font-weight: 800;
          background: #fff;
        }

        .modal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .modal-source {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f8f5f3;
          color: #8c837e;
          font-size: 8px;
        }

        .modal-actions {
          margin-top: 19px;
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 7px;
        }

        .modal-primary,
        .modal-secondary,
        .modal-external {
          height: 40px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 12px;
          font-size: 9px;
          font-weight: 900;
        }

        .modal-primary {
          background: #e98031;
          color: #fff;
        }

        .modal-secondary,
        .modal-external {
          border: 1px solid #ded7d3;
          background: #fff;
          color: #5c5551;
        }

        .modal-favorite-active {
          color: #eb4c4c;
          border-color: #ffc0c0;
          background: #fff5f5;
        }

        @media (max-width: 1600px) {
          .masonry-grid {
            column-count: 6;
          }
        }

        @media (max-width: 1300px) {
          .masonry-grid {
            column-count: 5;
          }
          .workspace {
            grid-template-columns: 230px minmax(0, 1fr);
          }
          .modal-next {
            left: calc(100% - 374px);
          }
        }

        @media (max-width: 1050px) {
          .masonry-grid {
            column-count: 4;
          }
          .workspace {
            grid-template-columns: 215px minmax(0, 1fr);
          }
          .template-modal {
            grid-template-columns: 1fr 330px;
          }
          .modal-next {
            left: calc(100% - 344px);
          }
        }

        @media (max-width: 820px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .page-actions {
            width: 100%;
            flex-wrap: wrap;
            justify-content: flex-start;
          }
          .workspace {
            grid-template-columns: 1fr;
          }
          .sidebar {
            position: static;
            max-height: none;
          }
          .category-list {
            max-height: 240px;
          }
          .masonry-grid {
            column-count: 3;
          }
          .template-modal {
            grid-template-columns: 1fr;
            max-height: 94vh;
            overflow-y: auto;
          }
          .modal-image {
            min-height: 390px;
            max-height: 56vh;
          }
          .modal-next {
            left: auto;
            right: 12px;
          }
        }

        @media (max-width: 620px) {
          .main-content {
            padding: 0 11px 14px;
          }
          .credit-alert {
            margin: 11px 11px 12px;
          }
          .page-header h1 {
            font-size: 20px;
          }
          .masonry-grid {
            column-count: 2;
            column-gap: 8px;
          }
          .template-card {
            margin-bottom: 8px;
            border-radius: 9px;
          }
          .page-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }
          .favorites-btn {
            grid-column: 1 / -1;
          }
          .modal-details {
            padding: 20px;
          }
          .modal-actions {
            grid-template-columns: 1fr 1fr;
          }
          .modal-primary {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
}
