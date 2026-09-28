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
      <section className="mt-4 w-full max-w-[1400px] rounded-2xl bg-[#F8FAFC] p-4 shadow-sm sm:p-6 text-[#0F172A]">
        <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#2563EB]" />
            <h3 className="text-sm font-semibold text-[#0F172A]">
              RECENT GENERATIONS
            </h3>
            <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
              {generations.length}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="cursor-pointer rounded-lg border border-[#E2E8F0] p-1.5 text-[#0F172A] transition hover:bg-[#E2E8F0]"
              aria-label="Previous generations"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="cursor-pointer rounded-lg border border-[#E2E8F0] p-1.5 text-[#0F172A] transition hover:bg-[#E2E8F0]"
              aria-label="Next generations"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#1d4ed8]"
            >
              <ExternalLink size={14} /> View all images
            </button>
            <button
              type="button"
              onClick={() => setShowMeta((previous) => !previous)}
              className={`cursor-pointer rounded-lg border p-1.5 transition ${
                showMeta
                  ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                  : "border-[#E2E8F0] text-[#0F172A] hover:bg-[#E2E8F0]"
              }`}
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
                className="h-36 w-28 shrink-0 animate-pulse rounded-xl border border-[#E2E8F0] bg-[#E2E8F0]"
              />
            ))
          ) : generations.length === 0 ? (
            <div className="flex min-h-[150px] w-full items-center justify-center">
              <p className="text-xs italic text-[#0F172A]/60">
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
                className="group relative flex h-36 w-28 shrink-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-left transition hover:border-[#2563EB] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#F8FAFC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
              <div>
                <h2 className="text-sm font-semibold text-[#0F172A]">
                  All generated images
                </h2>
                <p className="text-xs text-[#0F172A]/60">
                  {generations.length} image(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="cursor-pointer rounded-lg p-2 text-[#0F172A] transition hover:bg-[#E2E8F0]"
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
                  className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-[#2563EB] transition"
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
