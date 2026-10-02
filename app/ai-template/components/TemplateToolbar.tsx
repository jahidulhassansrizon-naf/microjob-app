"use client";

import React from "react";
import { Search, SlidersHorizontal, Clock3, TrendingUp, ArrowDownAZ, Heart, X } from "lucide-react";
import { HASHTAGS } from "./templateData";
import type { SortType } from "./templateData";

type Props = {
  search: string; setSearch: (v: string) => void;
  sortType: SortType; setSortType: (v: SortType) => void;
  showFavorites: boolean; setShowFavorites: (v: boolean | ((prev: boolean) => boolean)) => void;
  onHashtagClick: (tag: string) => void;
  filteredCount: number;
};

export function TemplateToolbar({ search, setSearch, sortType, setSortType, showFavorites, setShowFavorites, onHashtagClick, filteredCount }: Props) {
  return (
    <>
      <section className="page-header">
        <div>
          <h1>AI Template</h1>
          <p>Pick a style you like, upload your photo, and we'll generate the same look for you in seconds.</p>
        </div>

        <div className="page-actions">
          <button type="button" className={`sort-pill ${sortType === "Newest" ? "selected" : ""}`} onClick={() => setSortType("Newest")}>
            <Clock3 size={14} /> Newest first
          </button>
          <button type="button" className={`sort-pill ${sortType === "Popular" ? "selected-light" : ""}`} onClick={() => setSortType("Popular")}>
            <TrendingUp size={14} /> Popular
          </button>
          <button type="button" className={`sort-pill ${sortType === "ASC" || sortType === "DESC" ? "selected-light" : ""}`} onClick={() => setSortType(sortType === "ASC" ? "DESC" : "ASC")}>
            <ArrowDownAZ size={14} /> Sort: {sortType === "DESC" ? "DESC" : "ASC"}
          </button>
          <button type="button" className={`sort-pill favorites-btn ${showFavorites ? "favorite-active" : ""}`} onClick={() => setShowFavorites((prev: boolean) => !prev)}>
            <Heart size={14} fill={showFavorites ? "currentColor" : "none"} /> My Favorites
          </button>
        </div>
      </section>

      <div className="search-row">
        <div className="search-box">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or category..." />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear"><X size={15} /></button>
          )}
        </div>
      </div>

      <div className="tag-row">
        {HASHTAGS.map((tag) => (
          <button type="button" key={tag} className="tag-chip" onClick={() => onHashtagClick(tag)}>{tag}</button>
        ))}
        <button type="button" className="small-sort"><SlidersHorizontal size={13} /> Sort <span>⌄</span></button>
      </div>

      <div className="result-row">
        <span>{filteredCount.toLocaleString("en-US")} templates found</span>
      </div>
    </>
  );
}
