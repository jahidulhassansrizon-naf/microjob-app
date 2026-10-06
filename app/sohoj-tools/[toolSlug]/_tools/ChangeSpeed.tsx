"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock3,
  Download,
  FileVideo,
  Home,
  Play,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useVideoSpeed } from "./useVideoSpeed";
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_SIZE,
  MAX_SPEED,
  MIN_SPEED,
  SPEED_PRESETS,
  clampSpeed,
  formatSize,
} from "./utils";

export default function ChangeSpeed() {
  const {
    file,
    sourceUrl,
    result,
    status,
    progress,
    message,
    isBusy,
    selectFile,
    process,
    cancel,
    reset,
  } = useVideoSpeed();

  const [speed, setSpeed] = useState(1);
  const [speedDraft, setSpeedDraft] = useState("1"); // raw text so "1." / "" can be typed without fighting the clamp
  const [customEnabled, setCustomEnabled] = useState(true);
  const [notice, setNotice] = useState(""); // transient UI messages (share / favorite), separate from job state
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = result?.url ?? sourceUrl;
  const hasFile = Boolean(file);
  const statusText = notice || message;

  useEffect(() => {
    setNotice("");
  }, [status]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const videoItem = items.find(
        (item) => item.kind === "file" && item.type.startsWith("video/"),
      );
      const pastedFile = videoItem?.getAsFile();
      if (pastedFile) {
        event.preventDefault();
        selectFile(pastedFile);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectFile]);

  const openPicker = () => inputRef.current?.click();

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) selectFile(selected);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) selectFile(dropped);
  };

  const applySpeed = (value: number) => {
    const next = clampSpeed(value);
    setSpeed(next);
    setSpeedDraft(String(next));
  };

  const handleSpeedInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeedDraft(event.target.value);
    const parsed = Number.parseFloat(event.target.value);
    if (Number.isFinite(parsed) && parsed >= MIN_SPEED && parsed <= MAX_SPEED)
      setSpeed(parsed);
  };

  const commitSpeedDraft = () => {
    const parsed = Number.parseFloat(speedDraft);
    applySpeed(Number.isFinite(parsed) ? parsed : speed);
  };

  const handleReset = () => {
    reset();
    applySpeed(1);
    setCustomEnabled(true);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Change Speed",
          text: "Change video playback speed in your browser.",
          url,
        });
      } catch {
        // User dismissed the share sheet.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setNotice("Tool link copied to clipboard.");
    } catch {
      setNotice("Copy the page link from your browser to share this tool.");
    }
  };

  return (
    <div
      id="change-speed-tool"
      className="min-h-[calc(100vh-64px)] w-full bg-white text-[#1F2937] font-sans"
    >
      {/* Pointer cursor on every clickable element of this tool */}
      <style>{`
        :where(#change-speed-tool) a[href],
        :where(#change-speed-tool) button:not(:disabled),
        :where(#change-speed-tool) label:has(input[type="file"]),
        :where(#change-speed-tool) summary,
        :where(#change-speed-tool) select,
        :where(#change-speed-tool) input[type="color"],
        :where(#change-speed-tool) input[type="range"],
        :where(#change-speed-tool) input[type="checkbox"],
        :where(#change-speed-tool) input[type="radio"],
        :where(#change-speed-tool) input[type="file"] {
          cursor: pointer;
        }

        :where(#change-speed-tool) button:disabled {
          cursor: not-allowed;
        }
      `}</style>

      <main className="mx-auto w-full max-w-[1320px] px-4 py-3.5 sm:px-6 lg:px-0 lg:py-4">
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
          <Link
            href="/sohoj-tools"
            className="inline-flex items-center gap-1 hover:text-[#111827] transition-colors"
          >
            <Home size={13} />
          </Link>
          <span>/</span>
          <Link
            href="/sohoj-tools"
            className="hover:text-[#111827] transition-colors"
          >
            Sohoj Tools
          </Link>
          <span>/</span>
          <span>Video Tools</span>
          <span>/</span>
          <span className="font-semibold text-[#1F2937]">Change Speed</span>
        </div>

        <section className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#9945F5] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <FileVideo size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#111827]">
                  Change Speed
                </h1>
                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-bold text-[#15803D]">
                  Free
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF]">
                  <Check size={12} /> Used 0 times
                </span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-[#6B7280]">
                Speed up or slow down a video in your browser — presets from
                0.5x to 2x or a custom value.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotice("Added to favorites.")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#9945F5] transition-all"
              aria-label="Favorite"
            >
              <Star size={17} />
            </button>
            <button
              type="button"
              onClick={share}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#9945F5] transition-all"
              aria-label="Share"
            >
              <Share2 size={17} />
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <div className="text-[13px] font-bold text-[#1F2937]">
                Files ({file ? 1 : 0})
              </div>
              <button
                type="button"
                disabled={isBusy}
                onClick={openPicker}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`mt-3 flex min-h-[170px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition-all ${
                  isDragging
                    ? "border-[#9945F5] bg-[#FAF5FF]"
                    : "border-[#D8B4FE] bg-white hover:bg-[#FAF5FF]"
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF5FF] text-[#9945F5] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <Upload size={19} />
                </span>
                <span className="mt-3 text-sm font-bold text-[#1F2937]">
                  Drop a video here or click to upload
                </span>
                <span className="mt-1.5 text-[11px] font-medium text-[#9CA3AF]">
                  One video file (MP4, MOV, WebM, MKV, AVI), max{" "}
                  {formatSize(MAX_FILE_SIZE)}
                </span>
                <span className="mt-1 text-[11px] font-medium text-[#9CA3AF]">
                  Or press Ctrl+V to paste a copied video
                </span>
              </button>
              <input
                ref={inputRef}
                onChange={handleInput}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
              />

              {file && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#9945F5]">
                    <FileVideo size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-[#374151]">
                      {file.name}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-[#9CA3AF]">
                      {formatSize(file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    aria-label="Remove video"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {hasFile && (
              <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                <div className="text-[13px] font-bold text-[#1F2937]">
                  Playback speed
                </div>
                <div className="mt-2 text-[11px] font-medium text-[#9CA3AF]">
                  Speed presets
                </div>

                <div className="mt-2 grid grid-cols-6 gap-1.5 rounded-xl bg-[#F9FAFB] p-2.5">
                  {SPEED_PRESETS.map((preset) => {
                    const active =
                      !customEnabled && Math.abs(speed - preset) < 0.001;
                    return (
                      <button
                        type="button"
                        key={preset}
                        disabled={isBusy}
                        onClick={() => {
                          applySpeed(preset);
                          setCustomEnabled(false);
                        }}
                        className={`flex flex-col items-center rounded-lg px-1 py-2 transition-all ${active ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
                      >
                        <Clock3
                          size={17}
                          className={
                            active ? "text-[#7D5C99]" : "text-[#4B5563]"
                          }
                        />
                        <span
                          className={`mt-1 text-[10px] font-bold ${active ? "text-[#6B3E9C]" : "text-[#4B5563]"}`}
                        >
                          {preset}x
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-[#1F2937]">
                    Custom speed
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomEnabled((current) => !current)}
                    className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition-all ${customEnabled ? "border-[#9945F5] bg-[#FAF5FF] text-[#8B3DE0]" : "border-[#D1D5DB] bg-white text-[#6B7280]"}`}
                  >
                    Custom {customEnabled ? "on" : "off"}
                  </button>
                </div>

                <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-white p-2">
                  <input
                    aria-label="Custom playback speed"
                    type="number"
                    inputMode="decimal"
                    min={MIN_SPEED}
                    max={MAX_SPEED}
                    step={0.05}
                    disabled={!customEnabled || isBusy}
                    value={speedDraft}
                    onChange={handleSpeedInput}
                    onBlur={commitSpeedDraft}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitSpeedDraft();
                    }}
                    className="w-full bg-transparent px-1 py-1 text-sm font-bold text-[#111827] outline-none disabled:opacity-50"
                  />
                </div>
                <div className="mt-2 text-[10px] font-medium leading-relaxed text-[#9CA3AF]">
                  1x is normal. Below 1x is slower; above 1x is faster. Range:
                  0.25x–4x.
                </div>
              </div>
            )}
          </aside>

          <section className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:min-h-[660px]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-[#1F2937]">
                Video preview
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${previewUrl ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}
              >
                {previewUrl ? "Preview" : "Empty"}
              </span>
            </div>

            <div className="mt-3 flex min-h-[625px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-3">
              {previewUrl ? (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-black">
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="max-h-[590px] w-full rounded-xl bg-black object-contain"
                  />
                </div>
              ) : (
                <div className="max-w-[330px] text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#9945F5]">
                    <Play size={22} />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-[#1F2937]">
                    Add a video to get started
                  </h2>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#9CA3AF]">
                    Choose a preset or custom speed, then apply the change.
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div className="mt-3 flex items-center justify-between gap-4 px-1">
                <div className="min-w-0 truncate text-[11px] font-medium text-[#4B5563]">
                  {result ? "Changed speed result" : file.name}
                </div>
                <div className="shrink-0 text-[11px] font-semibold text-[#9CA3AF]">
                  {result ? result.speed : speed}x
                </div>
              </div>
            )}

            <div className="mt-3 text-center text-[11px] font-medium text-[#9CA3AF]">
              {result
                ? "Preview the processed result above, then download it."
                : "Press Change speed below."}
            </div>
          </section>
        </section>

        <section className="mt-5 flex flex-col gap-3 rounded-[18px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#4B5563]">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${status === "error" ? "bg-[#E34A24]" : isBusy ? "bg-[#F59E0B]" : status === "done" ? "bg-[#26A35A]" : "bg-[#9CA3AF]"}`}
            />
            <span className="truncate" role="status" aria-live="polite">
              {statusText ||
                (hasFile ? "Ready to process" : "Add an input to get started")}
            </span>
            {status === "processing" && (
              <span className="shrink-0 text-[#9CA3AF]">{progress}%</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {result && (
              <a
                href={result.url}
                download={`change-speed-${result.speed}x.mp4`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] transition-all"
              >
                <Download size={13} />
                Download
              </a>
            )}
            {isBusy && (
              <button
                type="button"
                onClick={cancel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-white transition-all"
              >
                <X size={13} /> Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:bg-white transition-all"
            >
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw size={13} /> Reset
              </span>
            </button>
            <button
              type="button"
              onClick={() => void process(speed)}
              disabled={!hasFile || isBusy}
              className="inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl bg-[#FF860B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#EA7600] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isBusy ? (
                <Sparkles size={13} className="animate-pulse" />
              ) : (
                <Zap size={13} />
              )}
              {isBusy
                ? status === "loading"
                  ? "Loading engine..."
                  : "Processing..."
                : "Change speed"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
