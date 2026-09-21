"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  ExternalLink,
  X,
} from "lucide-react";

export interface GenerationItem {
  id?: string | number;
  url: string;
  bgColor?: string;
  size?: string;
  clothingStyle?: string;
  createdAt?: unknown;
  sizeType?: string;
  widthPx?: number;
  heightPx?: number;
  dpi?: number;
  [key: string]: unknown;
}

export interface RecentGenerationsProps {
  generations?: GenerationItem[];
  onImageClick?: (item: GenerationItem) => void;
  isLoading?: boolean;
}

const TRANSPARENT_THUMBNAIL_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #d1d5db 25%, transparent 25%), linear-gradient(-45deg, #d1d5db 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d1d5db 75%), linear-gradient(-45deg, transparent 75%, #d1d5db 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
  backgroundColor: "#ffffff",
};

function displayDate(value: unknown) {
  if (!value) return "";
  if (typeof (value as { toDate?: unknown })?.toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    } catch {
      return "";
    }
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export default function RecentGenerations({
  generations = [],
  onImageClick = () => {},
  isLoading = false,
}: RecentGenerationsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  const scroll = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -520 : 520,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section className="mt-4 w-full max-w-[1400px] rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-orange-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              RECENT GENERATIONS
            </h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {generations.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="cursor-pointer rounded-lg border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-50"
              aria-label="Previous generations"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="cursor-pointer rounded-lg border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-50"
              aria-label="Next generations"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-orange-600"
            >
              <ExternalLink size={14} /> View all images
            </button>
            <button
              type="button"
              onClick={() => setShowMeta((previous) => !previous)}
              className={`cursor-pointer rounded-lg border p-1.5 transition ${showMeta ? "border-orange-200 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              aria-label="Toggle generation details"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-[150px] gap-4 overflow-x-auto pb-2 scrollbar-thin"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-36 w-28 shrink-0 animate-pulse rounded-xl border border-gray-100 bg-gray-200"
              />
            ))
          ) : generations.length === 0 ? (
            <div className="flex min-h-[150px] w-full items-center justify-center">
              <p className="text-xs italic text-gray-400">
                No recent generations yet. Click “Generate Photo” to add images
                here.
              </p>
            </div>
          ) : (
            generations.map((item, index) => (
              <button
                type="button"
                key={item.id ?? index}
                onClick={() => onImageClick(item)}
                className="group relative flex h-36 w-28 shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition hover:border-orange-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                style={
                  item.bgColor === "transparent"
                    ? TRANSPARENT_THUMBNAIL_STYLE
                    : undefined
                }
              >
                <img
                  src={item.url}
                  alt="Generated photo"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  View
                </span>
                {showMeta && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 px-1.5 py-1 text-[8px] leading-tight text-white">
                    {item.size || "Photo"}{" "}
                    {displayDate(item.createdAt)
                      ? `• ${displayDate(item.createdAt)}`
                      : ""}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {showAll && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.currentTarget === event.target && setShowAll(false)
          }
        >
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  All generated images
                </h2>
                <p className="text-xs text-gray-400">
                  {generations.length} image(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                aria-label="Close gallery"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid overflow-y-auto p-4 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
              {generations.map((item, index) => (
                <button
                  type="button"
                  key={item.id ?? index}
                  onClick={() => {
                    onImageClick(item);
                    setShowAll(false);
                  }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-gray-200 bg-gray-50 cursor-pointer"
                  style={
                    item.bgColor === "transparent"
                      ? TRANSPARENT_THUMBNAIL_STYLE
                      : undefined
                  }
                >
                  <img
                    src={item.url}
                    alt="Generated photo"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left text-[9px] text-white opacity-0 transition group-hover:opacity-100">
                    {item.size || "Photo"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
