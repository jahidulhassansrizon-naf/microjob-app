"use client";
import { useAiTemplateText } from "./aiTemplateI18n";
import React from "react";
import { RotateCcw, UserRound, VenusAndMars, Baby, Package, } from "lucide-react";
import { CATEGORY_COUNTS, CATEGORY_OPTIONS, COLOR_OPTIONS, IMAGE_COUNT_OPTIONS, SIDE_SORT_OPTIONS, } from "./templateData";
import type { Gender, ImageCountFilter, OrientationFilter, ColorFilter, SortType } from "./templateData";
type Props = {
    category: string;
    setCategory: (v: string) => void;
    gender: Gender;
    setGender: (v: Gender) => void;
    imageCount: ImageCountFilter;
    setImageCount: (v: ImageCountFilter) => void;
    orientation: OrientationFilter;
    setOrientation: (v: OrientationFilter) => void;
    selectedColor: ColorFilter;
    setSelectedColor: (v: ColorFilter) => void;
    sortType: SortType;
    setSortType: (v: SortType) => void;
    resetFilters: () => void;
};
export function TemplateSidebar(props: Props) {
    const { category, setCategory, gender, setGender, imageCount, setImageCount, orientation, setOrientation, selectedColor, setSelectedColor, sortType, setSortType, resetFilters, } = props;
    const { t } = useAiTemplateText();
    return (<aside className="sidebar scroll">
      <div className="sidebar-heading">
        <span>{t("Filter")}</span>
        <button type="button" onClick={resetFilters}>
          <RotateCcw size={13}/>{t("Reset")}</button>
      </div>

      <div className="filter-section-title">{t("CATEGORY")}</div>
      <div className="category-list scroll">
        {CATEGORY_OPTIONS.map((item) => (<button type="button" key={item} onClick={() => setCategory(item)} className={`category-row ${category === item ? "active" : ""}`}>
            <span>{t(item)}</span>
            <b>{(CATEGORY_COUNTS[item] || 0).toLocaleString("en-US")}</b>
          </button>))}
      </div>

      <div className="filter-group">
        <div className="filter-section-title">{t("GENDER")}</div>
        <div className="gender-grid">
          {([
            ["All", <VenusAndMars key="all" size={14}/>],
            ["Male", <UserRound key="male" size={14}/>],
            ["Female", <VenusAndMars key="female" size={14}/>],
            ["Children", <Baby key="children" size={14}/>],
            ["Product", <Package key="product" size={14}/>],
        ] as Array<[
            Gender,
            React.ReactNode
        ]>).map(([item, icon]) => (<button type="button" key={item} className={`gender-card ${gender === item ? "active" : ""}`} onClick={() => setGender(item)}>
              {icon}<span>{t(item)}</span>
            </button>))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-section-title">{t("IMAGE COUNT")}</div>
        <div className="radio-list">
          {IMAGE_COUNT_OPTIONS.map(({ value, label, hint }) => (<button type="button" key={label} className={`radio-row ${imageCount === value ? "active" : ""}`} onClick={() => setImageCount(value)}>
              <span className={`radio-dot ${imageCount === value ? "checked" : ""}`}/>
              <span><strong>{t(label)}</strong><small>{t(hint)}</small></span>
            </button>))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-section-title">{t("ORIENTATION")}</div>
        <div className="orientation-grid">
          {(["All", "Portrait", "Landscape", "Square"] as OrientationFilter[]).map((item) => (<button type="button" key={item} className={`orientation-card ${orientation === item ? "active" : ""}`} onClick={() => setOrientation(item)}>
              <span className={`orientation-icon orientation-${item.toLowerCase()}`}/>
              {t(item)}
            </button>))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-section-title">{t("COLOR")}</div>
        <div className="color-grid">
          {COLOR_OPTIONS.map(({ value, label, background }) => (<button type="button" key={value} className={`color-dot-wrap ${selectedColor === value ? "active" : ""}`} onClick={() => setSelectedColor(value)} aria-label={`${t("Color: ")}${t(label)}`} aria-pressed={selectedColor === value} title={t(label)}>
              <span className="color-dot" style={{ background }}/>
            </button>))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-section-title">{t("SORT")}</div>
        <div className="sort-side-list">
          {SIDE_SORT_OPTIONS.map(({ label, value }) => {
            const isActive = value === "ASC"
                ? sortType === "ASC" || sortType === "DESC"
                : sortType === value;
            return (<button type="button" key={label} className={`sort-side-row ${isActive ? "active" : ""}`} onClick={() => setSortType(value)}>
                <span>{t(label)}</span>
              </button>);
        })}
        </div>
      </div>
    </aside>);
}
