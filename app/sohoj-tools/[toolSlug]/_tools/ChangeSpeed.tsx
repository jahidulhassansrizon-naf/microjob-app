"use client";
import { T as BaseT, useSohozI18n } from "@/app/sohoj-tools/_i18n";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Clock3, Download, FileVideo, Home, Play, RotateCcw, Share2, Sparkles, Star, Upload, X, Zap, } from "lucide-react";
import { useVideoSpeed } from "./useVideoSpeed";
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE, MAX_SPEED, MIN_SPEED, SPEED_PRESETS, clampSpeed, formatSize, } from "./utils";
type ChangeSpeedTextProps = {
    children: React.ReactNode;
    locale: string;
};

const CHANGE_SPEED_BN: Record<string, string> = {
    "/": "/",
    "sohoj tools": "সহজ টুলস",
    "video tools": "ভিডিও টুলস",
    "change speed": "ভিডিওর গতি পরিবর্তন",
    "free": "বিনামূল্যে",
    "used 0 times": "০ বার ব্যবহার করা হয়েছে",
    "speed up or slow down a video in your browser — presets from 0.5x to 2x or a custom value.": "আপনার ব্রাউজারেই ভিডিওর গতি বাড়ান বা কমান—০.৫x থেকে ২x পর্যন্ত নির্ধারিত বিকল্প অথবা নিজের মতো গতি বেছে নিন।",
    "files (": "ফাইল (",
    ")": ")",
    "drop a video here or click to upload": "এখানে ভিডিও টেনে আনুন অথবা আপলোড করতে ক্লিক করুন",
    "one video file (mp4, mov, webm, mkv, avi), max": "একটি ভিডিও ফাইল (MP4, MOV, WebM, MKV, AVI), সর্বোচ্চ",
    "or press ctrl+v to paste a copied video": "অথবা কপি করা ভিডিও পেস্ট করতে Ctrl+V চাপুন",
    "playback speed": "ভিডিও চালানোর গতি",
    "speed presets": "নির্ধারিত গতির বিকল্প",
    "x": "x",
    "custom speed": "নিজস্ব গতি",
    "custom": "নিজস্ব",
    "on": "চালু",
    "off": "বন্ধ",
    "1x is normal. below 1x is slower; above 1x is faster. range: 0.25x–4x.": "১x হলো স্বাভাবিক গতি। ১x-এর কম হলে ভিডিও ধীরে চলে, আর ১x-এর বেশি হলে দ্রুত চলে। সীমা: ০.২৫x–৪x।",
    "video preview": "ভিডিওর প্রিভিউ",
    "preview": "প্রিভিউ",
    "empty": "খালি",
    "add a video to get started": "শুরু করতে একটি ভিডিও যোগ করুন",
    "choose a preset or custom speed, then apply the change.": "একটি নির্ধারিত বা নিজস্ব গতি বেছে নিয়ে পরিবর্তনটি প্রয়োগ করুন।",
    "changed speed result": "গতি পরিবর্তিত ভিডিও",
    "preview the processed result above, then download it.": "উপরে গতি পরিবর্তন করা ভিডিওটি দেখে নিন, তারপর ডাউনলোড করুন।",
    "press change speed below.": "নিচের ‘গতি পরিবর্তন করুন’ বোতামে ক্লিক করুন।",
    "%": "%",
    "download": "ডাউনলোড",
    "cancel": "বাতিল",
    "reset": "রিসেট",
    "added to favorites.": "পছন্দের তালিকায় যোগ করা হয়েছে।",
    "tool link copied to clipboard.": "টুলটির লিংক ক্লিপবোর্ডে কপি হয়েছে।",
    "copy the page link from your browser to share this tool.": "টুলটি শেয়ার করতে ব্রাউজার থেকে পেজের লিংক কপি করুন।",
    "ready to process": "প্রক্রিয়াকরণের জন্য প্রস্তুত",
    "add an input to get started": "শুরু করতে একটি ভিডিও যোগ করুন",
    "loading engine...": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে…",
    "loading engine…": "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে…",
    "processing...": "ভিডিওর গতি পরিবর্তন হচ্ছে…",
    "processing…": "ভিডিওর গতি পরিবর্তন হচ্ছে…",
    "favorite": "পছন্দের তালিকায় যোগ করুন",
    "share": "শেয়ার করুন",
    "remove video": "ভিডিও সরান",
    "custom playback speed": "নিজস্ব ভিডিও চালানোর গতি",
    "sohoj tools home": "সহজ টুলসের মূল পৃষ্ঠা",
    "change video playback speed in your browser.": "আপনার ব্রাউজারেই ভিডিও চালানোর গতি পরিবর্তন করুন।",
    "no video selected.": "কোনো ভিডিও নির্বাচন করা হয়নি।",
    "please select a video.": "অনুগ্রহ করে একটি ভিডিও নির্বাচন করুন।",
    "select a video first.": "প্রথমে একটি ভিডিও নির্বাচন করুন।",
    "video processing failed.": "ভিডিও প্রক্রিয়াকরণ করা যায়নি। আবার চেষ্টা করুন।",
    "video speed changed successfully.": "ভিডিওর গতি সফলভাবে পরিবর্তন করা হয়েছে।",
    "processing cancelled.": "প্রক্রিয়াকরণ বাতিল করা হয়েছে।",
    "operation cancelled.": "কাজটি বাতিল করা হয়েছে।",
    "the video is ready to download.": "ভিডিওটি ডাউনলোডের জন্য প্রস্তুত।",
};

function normalizeChangeSpeedText(value: string): string {
    return value
        .replace(/&apos;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();
}

function translateChangeSpeedText(value: string, locale: string): string | null {
    if (!locale.toLowerCase().startsWith("bn")) return null;
    const normalized = normalizeChangeSpeedText(value);
    if (!normalized) return value;
    // Keep action wording distinct from the page heading: the lower-case
    // button label is an instruction, while the title names the tool.
    if (normalized === "Change speed") {
        const leading = value.match(/^\s*/)?.[0] ?? "";
        const trailing = value.match(/\s*$/)?.[0] ?? "";
        return `${leading}গতি পরিবর্তন করুন${trailing}`;
    }
    const translated = CHANGE_SPEED_BN[normalized.toLowerCase()];
    if (translated === undefined) return null;
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    return `${leading}${translated}${trailing}`;
}

function ChangeSpeedText({ children, locale }: ChangeSpeedTextProps) {
    if (typeof children === "string") {
        const translated = translateChangeSpeedText(children, locale);
        if (translated !== null) return <>{translated}</>;
    }
    return <BaseT>{children}</BaseT>;
}

function translateChangeSpeedStatus(message: string, status: string, hasFile: boolean, locale: string, fallback: (value: string) => string): string {
    if (!locale.toLowerCase().startsWith("bn")) {
        return message || (hasFile ? "Ready to process" : "Add an input to get started");
    }
    const exact = message ? translateChangeSpeedText(message, locale) : null;
    if (exact !== null) return exact;
    const normalized = normalizeChangeSpeedText(message).toLowerCase();
    if (/cancel(?:led|ed|ation)?/.test(normalized)) return "প্রক্রিয়াকরণ বাতিল করা হয়েছে।";
    if (/failed|failure|error|could not|unable to/.test(normalized)) return "ভিডিওর গতি পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।";
    if (/loading.*(engine|ffmpeg)|(?:engine|ffmpeg).*loading/.test(normalized) || status === "loading") return "ভিডিও প্রক্রিয়াকরণ ব্যবস্থা লোড হচ্ছে…";
    if (/processing|changing speed|changing video speed/.test(normalized) || status === "processing") return "ভিডিওর গতি পরিবর্তন হচ্ছে…";
    if (/success|complete|finished|ready to download/.test(normalized) || status === "done") return "ভিডিওর গতি পরিবর্তন সম্পন্ন হয়েছে।";
    if (status === "error") return "ভিডিওর গতি পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।";
    if (hasFile) return "ভিডিওটি প্রক্রিয়াকরণের জন্য প্রস্তুত।";
    if (!message || /add an input|add a video|select a video/.test(normalized)) return "শুরু করতে একটি ভিডিও যোগ করুন।";
    return fallback(message);
}

export default function ChangeSpeed() {
    const { locale, L: baseL } = useSohozI18n();
    const L = (value: string) => translateChangeSpeedText(value, locale) ?? baseL(value);
    const { file, sourceUrl, result, status, progress, message, isBusy, selectFile, process, cancel, reset, } = useVideoSpeed();
    const [speed, setSpeed] = useState(1);
    const [speedDraft, setSpeedDraft] = useState("1"); // raw text so "1." / "" can be typed without fighting the clamp
    const [customEnabled, setCustomEnabled] = useState(true);
    const [notice, setNotice] = useState(""); // transient UI messages (share / favorite), separate from job state
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const previewUrl = result?.url ?? sourceUrl;
    const hasFile = Boolean(file);
    const statusText = notice || message;
    const localizedStatusText = translateChangeSpeedStatus(statusText, status, hasFile, locale, L);
    useEffect(() => {
        setNotice("");
    }, [status]);
    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = Array.from(event.clipboardData?.items ?? []);
            const videoItem = items.find((item) => item.kind === "file" && item.type.startsWith("video/"));
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
        if (selected)
            selectFile(selected);
        event.target.value = "";
    };
    const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped)
            selectFile(dropped);
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
                    title: L("Change Speed"),
                    text: L("Change video playback speed in your browser."),
                    url,
                });
            }
            catch {
                // User dismissed the share sheet.
            }
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            setNotice("Tool link copied to clipboard.");
        }
        catch {
            setNotice("Copy the page link from your browser to share this tool.");
        }
    };
    return (<div id="change-speed-tool" className="min-h-[calc(100vh-64px)] w-full bg-white text-[#1F2937] font-sans">
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
          <Link href="/sohoj-tools" aria-label={L("Sohoj Tools home")} title={L("Sohoj Tools home")} className="inline-flex items-center gap-1 hover:text-[#111827] transition-colors">
            <Home size={13}/>
          </Link>
          <span><ChangeSpeedText locale={locale}>{"/"}</ChangeSpeedText></span>
          <Link href="/sohoj-tools" className="hover:text-[#111827] transition-colors"><ChangeSpeedText locale={locale}>{"Sohoj Tools\n          "}</ChangeSpeedText></Link>
          <span><ChangeSpeedText locale={locale}>{"/"}</ChangeSpeedText></span>
          <span><ChangeSpeedText locale={locale}>{"Video Tools"}</ChangeSpeedText></span>
          <span><ChangeSpeedText locale={locale}>{"/"}</ChangeSpeedText></span>
          <span className="font-semibold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Change Speed"}</ChangeSpeedText></span>
        </div>

        <section className="mt-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#9945F5] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <FileVideo size={20}/>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em] text-[#111827]"><ChangeSpeedText locale={locale}>{"Change Speed\n                "}</ChangeSpeedText></h1>
                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[11px] font-bold text-[#15803D]"><ChangeSpeedText locale={locale}>{"Free\n                "}</ChangeSpeedText></span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9CA3AF]">
                  <Check size={12}/><ChangeSpeedText locale={locale}>{"Used 0 times\n                "}</ChangeSpeedText></span>
              </div>
              <p className="mt-0.5 text-sm font-medium text-[#6B7280]"><ChangeSpeedText locale={locale}>{"Speed up or slow down a video in your browser \u2014 presets from\n                0.5x to 2x or a custom value.\n              "}</ChangeSpeedText></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setNotice("Added to favorites.")} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#9945F5] transition-all" aria-label={L("Favorite")}>
              <Star size={17}/>
            </button>
            <button type="button" onClick={share} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#9945F5] transition-all" aria-label={L("Share")}>
              <Share2 size={17}/>
            </button>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <div className="text-[13px] font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Files ("}</ChangeSpeedText>{file ? 1 : 0}<ChangeSpeedText locale={locale}>{")\n              "}</ChangeSpeedText></div>
              <button type="button" disabled={isBusy} onClick={openPicker} onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
        }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`mt-3 flex min-h-[170px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center transition-all ${isDragging
            ? "border-[#9945F5] bg-[#FAF5FF]"
            : "border-[#D8B4FE] bg-white hover:bg-[#FAF5FF]"}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF5FF] text-[#9945F5] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                  <Upload size={19}/>
                </span>
                <span className="mt-3 text-sm font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Drop a video here or click to upload\n                "}</ChangeSpeedText></span>
                <span className="mt-1.5 text-[11px] font-medium text-[#9CA3AF]"><ChangeSpeedText locale={locale}>{"One video file (MP4, MOV, WebM, MKV, AVI), max"}</ChangeSpeedText>{<ChangeSpeedText locale={locale}>{" "}</ChangeSpeedText>}
                  {formatSize(MAX_FILE_SIZE)}
                </span>
                <span className="mt-1 text-[11px] font-medium text-[#9CA3AF]"><ChangeSpeedText locale={locale}>{"Or press Ctrl+V to paste a copied video\n                "}</ChangeSpeedText></span>
              </button>
              <input ref={inputRef} onChange={handleInput} type="file" accept={ACCEPT_ATTRIBUTE} className="hidden"/>

              {file && (<div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#9945F5]">
                    <FileVideo size={16}/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-[#374151]">
                      {file.name}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-[#9CA3AF]">
                      {formatSize(file.size)}
                    </div>
                  </div>
                  <button type="button" onClick={handleReset} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]" aria-label={L("Remove video")}>
                    <X size={16}/>
                  </button>
                </div>)}
            </div>

            {hasFile && (<div className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
                <div className="text-[13px] font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Playback speed\n                "}</ChangeSpeedText></div>
                <div className="mt-2 text-[11px] font-medium text-[#9CA3AF]"><ChangeSpeedText locale={locale}>{"Speed presets\n                "}</ChangeSpeedText></div>

                <div className="mt-2 grid grid-cols-6 gap-1.5 rounded-xl bg-[#F9FAFB] p-2.5">
                  {SPEED_PRESETS.map((preset) => {
                const active = !customEnabled && Math.abs(speed - preset) < 0.001;
                return (<button type="button" key={preset} disabled={isBusy} onClick={() => {
                        applySpeed(preset);
                        setCustomEnabled(false);
                    }} className={`flex flex-col items-center rounded-lg px-1 py-2 transition-all ${active ? "bg-white shadow-sm" : "hover:bg-white/70"}`}>
                        <Clock3 size={17} className={active ? "text-[#7D5C99]" : "text-[#4B5563]"}/>
                        <span className={`mt-1 text-[10px] font-bold ${active ? "text-[#6B3E9C]" : "text-[#4B5563]"}`}>
                          {preset}<ChangeSpeedText locale={locale}>{"x\n                        "}</ChangeSpeedText></span>
                      </button>);
            })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-[13px] font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Custom speed\n                  "}</ChangeSpeedText></span>
                  <button type="button" onClick={() => setCustomEnabled((current) => !current)} className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition-all ${customEnabled ? "border-[#9945F5] bg-[#FAF5FF] text-[#8B3DE0]" : "border-[#D1D5DB] bg-white text-[#6B7280]"}`}><ChangeSpeedText locale={locale}>{"Custom "}</ChangeSpeedText>{customEnabled ? <ChangeSpeedText locale={locale}>{"on"}</ChangeSpeedText> : <ChangeSpeedText locale={locale}>{"off"}</ChangeSpeedText>}
                  </button>
                </div>

                <div className="mt-2 rounded-xl border border-[#E5E7EB] bg-white p-2">
                  <input aria-label={L("Custom playback speed")} type="number" inputMode="decimal" min={MIN_SPEED} max={MAX_SPEED} step={0.05} disabled={!customEnabled || isBusy} value={speedDraft} onChange={handleSpeedInput} onBlur={commitSpeedDraft} onKeyDown={(event) => {
                if (event.key === "Enter")
                    commitSpeedDraft();
            }} className="w-full bg-transparent px-1 py-1 text-sm font-bold text-[#111827] outline-none disabled:opacity-50"/>
                </div>
                <div className="mt-2 text-[10px] font-medium leading-relaxed text-[#9CA3AF]"><ChangeSpeedText locale={locale}>{"1x is normal. Below 1x is slower; above 1x is faster. Range:\n                  0.25x\u20134x.\n                "}</ChangeSpeedText></div>
              </div>)}
          </aside>

          <section className="rounded-[22px] border border-[#E5E7EB] bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)] lg:min-h-[660px]">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Video preview\n              "}</ChangeSpeedText></div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${previewUrl ? "bg-[#FFF7ED] text-[#EA580C]" : "bg-[#F3F4F6] text-[#9CA3AF]"}`}>
                {previewUrl ? <ChangeSpeedText locale={locale}>{"Preview"}</ChangeSpeedText> : <ChangeSpeedText locale={locale}>{"Empty"}</ChangeSpeedText>}
              </span>
            </div>

            <div className="mt-3 flex min-h-[625px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-3">
              {previewUrl ? (<div className="flex h-full w-full items-center justify-center rounded-xl bg-black">
                  <video src={previewUrl} controls playsInline className="max-h-[590px] w-full rounded-xl bg-black object-contain"/>
                </div>) : (<div className="max-w-[330px] text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF5FF] text-[#9945F5]">
                    <Play size={22}/>
                  </div>
                  <h2 className="mt-4 text-base font-bold text-[#1F2937]"><ChangeSpeedText locale={locale}>{"Add a video to get started\n                  "}</ChangeSpeedText></h2>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#9CA3AF]"><ChangeSpeedText locale={locale}>{"Choose a preset or custom speed, then apply the change.\n                  "}</ChangeSpeedText></p>
                </div>)}
            </div>

            {file && (<div className="mt-3 flex items-center justify-between gap-4 px-1">
                <div className="min-w-0 truncate text-[11px] font-medium text-[#4B5563]">
                  {result ? <ChangeSpeedText locale={locale}>{"Changed speed result"}</ChangeSpeedText> : file.name}
                </div>
                <div className="shrink-0 text-[11px] font-semibold text-[#9CA3AF]">
                  {result ? result.speed : speed}<ChangeSpeedText locale={locale}>{"x\n                "}</ChangeSpeedText></div>
              </div>)}

            <div className="mt-3 text-center text-[11px] font-medium text-[#9CA3AF]">
              {result
        ? <ChangeSpeedText locale={locale}>{"Preview the processed result above, then download it."}</ChangeSpeedText> : <ChangeSpeedText locale={locale}>{"Press Change speed below."}</ChangeSpeedText>}
            </div>
          </section>
        </section>

        <section className="mt-5 flex flex-col gap-3 rounded-[18px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#4B5563]">
            <span className={`h-2 w-2 shrink-0 rounded-full ${status === "error" ? "bg-[#E34A24]" : isBusy ? "bg-[#F59E0B]" : status === "done" ? "bg-[#26A35A]" : "bg-[#9CA3AF]"}`}/>
            <span className="truncate" role="status" aria-live="polite">
              {statusText ||
            (hasFile ? "Ready to process" : "Add an input to get started")}
            </span>
            {status === "processing" && (<span className="shrink-0 text-[#9CA3AF]">{progress}<ChangeSpeedText locale={locale}>{"%"}</ChangeSpeedText></span>)}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {result && (<a href={result.url} download={`change-speed-${result.speed}x.mp4`} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-xs font-bold text-[#374151] hover:bg-[#F9FAFB] transition-all">
                <Download size={13}/><ChangeSpeedText locale={locale}>{"Download\n              "}</ChangeSpeedText></a>)}
            {isBusy && (<button type="button" onClick={cancel} className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-white transition-all">
                <X size={13}/><ChangeSpeedText locale={locale}>{"Cancel\n              "}</ChangeSpeedText></button>)}
            <button type="button" onClick={handleReset} className="rounded-xl border border-[#E5E7EB] bg-[#FFFFFF] px-4 py-2.5 text-xs font-bold text-[#4B5563] hover:bg-white transition-all">
              <span className="inline-flex items-center gap-1.5">
                <RotateCcw size={13}/><ChangeSpeedText locale={locale}>{"Reset\n              "}</ChangeSpeedText></span>
            </button>
            <button type="button" onClick={() => void process(speed)} disabled={!hasFile || isBusy} className="inline-flex min-w-[160px] items-center justify-center gap-1.5 rounded-xl bg-[#FF860B] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#EA7600] disabled:cursor-not-allowed disabled:opacity-45">
              {isBusy ? (<Sparkles size={13} className="animate-pulse"/>) : (<Zap size={13}/>)}
              {isBusy
        ? status === "loading"
            ? "Loading engine..."
            : "Processing..."
        : <ChangeSpeedText locale={locale}>{"Change speed"}</ChangeSpeedText>}
            </button>
          </div>
        </section>
      </main>
    </div>);
}
