"use client";
import { T } from "@/components/i18n/I18nProvider";
import React from "react";
import { Heart, Search } from "lucide-react";
import { LazyTemplateImage } from "./LazyTemplateImage";
import type { Template } from "./templateData";
import { imageCountLabel } from "./templateData";
type Props = {
    filteredTemplates: Template[];
    favoriteIds: ReadonlySet<number>;
    showFavorites: boolean;
    onToggleFavorite: (id: number) => void;
    onOpenTemplate: (template: Template) => void;
    onResetFilters: () => void;
};
export function TemplateGrid({ filteredTemplates, favoriteIds, showFavorites, onToggleFavorite, onOpenTemplate, onResetFilters, }: Props) {
    return (filteredTemplates.length === 0 ? (<div className="empty-state">
        <div className="empty-heart">
          <Search size={28}/>
        </div>

        <p>
          {showFavorites
        ? <T>{"No favorite templates yet."}</T> : <T>{"No template found for your current filters."}</T>}
        </p>

        <button type="button" className="reset-empty" onClick={onResetFilters}><T>{"Reset filters\n        "}</T></button>
      </div>) : (<div className="masonry-grid">
        {filteredTemplates.map((template) => {
            const isFavorite = favoriteIds.has(template.id);
            return (<article className="template-card" key={template.id} role="button" tabIndex={0} onClick={() => onOpenTemplate(template)} onKeyDown={(e) => {
                    if (e.target !== e.currentTarget)
                        return;
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenTemplate(template);
                    }
                }}>
              <LazyTemplateImage src={template.image} alt={template.title} orientation={template.orientation}/>

              <div className="image-overlay"/>

              <div className="uses-badge">{imageCountLabel(template.imageCount)}</div>

              <button type="button" className={`card-heart ${isFavorite ? "card-heart-active" : ""}`} onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(template.id);
                }} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"}/>
              </button>

              <div className="template-hover">
                <div>
                  <strong>{<T>{template.title}</T>}</strong>
                  <span>{template.category}</span>
                </div>

                <button type="button" onClick={(e) => {
                    e.stopPropagation();
                    onOpenTemplate(template);
                }}><T>{"View template\n                "}</T></button>
              </div>
            </article>);
        })}
      </div>));
}
