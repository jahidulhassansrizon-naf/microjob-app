"use client";
import { useI18n } from "@/components/i18n/I18nProvider";
import { translateText } from "@/lib/i18n";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ImageIcon,
  Printer,
  ClipboardList,
  Sparkles,
  SlidersHorizontal,
  LayoutTemplate,
  Layers,
  LayoutGrid,
  Search,
  X,
  ArrowRight,
  Download,
  Wrench,
  FileText,
  Type,
  Video,
  GraduationCap,
  PanelRightClose,
  Eye,
  Trash2,
  Loader2,
  PanelRightOpen,
  type LucideIcon,
} from "lucide-react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import { getClientSession } from "@/lib/clientAuth";
import {
  getCachedMyFilesData,
  getMyFilesThumbnailUrl,
  refreshMyFilesData,
  removeCachedMyFilesItem,
} from "./myFilesData";

/* ------------------------------------------------------------------ */
/* Page-specific, context-aware English ↔ Bangla translations       */
/* ------------------------------------------------------------------ */
const PAGE_BN: Record<string, string> = {
  "· ": "· ",
  "All types": "সব ধরনের",
  Image: "ছবি",
  Text: "লেখা",
  Video: "ভিডিও",
  General: "সাধারণ",
  Educational: "শিক্ষামূলক",
  "Generated Images": "তৈরি করা ছবি",
  "Search images by filename": "ফাইলের নাম দিয়ে ছবি খুঁজুন",
  "No images yet": "এখনও কোনো ছবি নেই",
  "Your edited and generated images will appear here.":
    "আপনার সম্পাদিত ও তৈরি করা ছবিগুলো এখানে দেখা যাবে।",
  "AI Photo Edit": "এআই ছবি সম্পাদনা",
  "Images from AI Photo Edit will appear here once you create them.":
    "এআই ছবি সম্পাদনা থেকে তৈরি করা ছবিগুলো তৈরি করার পর এখানে দেখা যাবে।",
  "Open AI Editor": "এআই এডিটর খুলুন",
  "Manually Edited": "ম্যানুয়ালি সম্পাদিত",
  "Images from the Manual Editor will appear here once you create them.":
    "ম্যানুয়াল এডিটর থেকে তৈরি করা ছবিগুলো তৈরি করার পর এখানে দেখা যাবে।",
  "Open Manual Editor": "ম্যানুয়াল এডিটর খুলুন",
  "AI Template Generated": "এআই টেমপ্লেট থেকে তৈরি",
  "Images made from AI templates will appear here once you create them.":
    "এআই টেমপ্লেট থেকে তৈরি করা ছবিগুলো তৈরি করার পর এখানে দেখা যাবে।",
  "Browse AI Templates": "এআই টেমপ্লেট দেখুন",
  "Bulk Photo Edit": "একসঙ্গে অনেক ছবি সম্পাদনা",
  "Images from Bulk Photo Edit will appear here once you create them.":
    "একসঙ্গে অনেক ছবি সম্পাদনা করে তৈরি করা ছবিগুলো এখানে দেখা যাবে।",
  "Print Media": "প্রিন্ট ডিজাইন",
  "Search print media by name": "নাম দিয়ে প্রিন্ট ডিজাইন খুঁজুন",
  "No print media yet": "এখনও কোনো প্রিন্ট ডিজাইন নেই",
  "Posters, cards and other print designs you create will be saved here.":
    "আপনার তৈরি পোস্টার, কার্ড ও অন্যান্য প্রিন্ট ডিজাইন এখানে সংরক্ষিত হবে।",
  "Browse Print Media": "প্রিন্ট ডিজাইন দেখুন",
  "Question Papers": "প্রশ্নপত্র",
  "Search question papers by name": "নাম দিয়ে প্রশ্নপত্র খুঁজুন",
  "No question papers yet": "এখনও কোনো প্রশ্নপত্র নেই",
  "Question papers you create will be saved here.":
    "আপনার তৈরি প্রশ্নপত্র এখানে সংরক্ষিত হবে।",
  "Create Question Paper": "প্রশ্নপত্র তৈরি করুন",
  "Clear search": "সার্চ পরিষ্কার করুন",
  "Search files": "ফাইল খুঁজুন",
  "Sort files": "ফাইল সাজান",
  "Newest first": "নতুনগুলো আগে",
  "Oldest first": "পুরোনোগুলো আগে",
  Download: "ডাউনলোড",
  "Close preview": "প্রিভিউ বন্ধ করুন",
  Close: "বন্ধ করুন",
  "Preview not available": "প্রিভিউ দেখা যাচ্ছে না",
  "This file type cannot be displayed directly in the browser.":
    "এই ধরনের ফাইল সরাসরি ব্রাউজারে দেখানো যায় না।",
  "Open file": "ফাইল খুলুন",
  "Loading your files": "আপনার ফাইলগুলো লোড হচ্ছে",
  "Loading tool files": "টুলের ফাইলগুলো লোড হচ্ছে",
  "My Files": "আমার ফাইল",
  "Everything you make with Sohozkaj — edited photos, templates, print designs and question papers — is saved here.":
    "Sohozkaj-এ আপনার তৈরি করা সবকিছু—সম্পাদিত ছবি, টেমপ্লেট, প্রিন্ট ডিজাইন ও প্রশ্নপত্র—এখানে সংরক্ষিত থাকে।",
  "Files are deleted automatically after 30 days, so download what you need before then.":
    "৩০ দিন পর ফাইলগুলো স্বয়ংক্রিয়ভাবে মুছে যায়। তাই প্রয়োজনীয় ফাইল তার আগেই ডাউনলোড করে নিন।",
  "SohozTools Files": "সহজটুলসের ফাইল",
  "File categories": "ফাইলের ধরনসমূহ",
  "My files": "আমার ফাইল",
  "Showing results from": "ফলাফল দেখানো হচ্ছে",
  "No matching results": "কোনো মিল পাওয়া যায়নি",
  "We couldn't find any file with that name. Try a different word.":
    "ওই নামে কোনো ফাইল পাওয়া যায়নি। অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন।",
  "No tool files yet": "এখনও কোনো টুল ফাইল নেই",
  "Use any SohozTools tool and press Save. Your file will show up here.":
    "যেকোনো সহজটুলস ব্যবহার করে সেভ করুন। আপনার ফাইল এখানে দেখা যাবে।",
  "Search by file or tool name": "ফাইল বা টুলের নাম দিয়ে খুঁজুন",
  "Search tool files": "টুলের ফাইল খুঁজুন",
  "Filter by file type": "ফাইলের ধরন দিয়ে ফিল্টার করুন",
  "Anything you save from a SohozTools tool — a scanned document, a compressed PDF, a resized photo — is stored here.":
    "সহজটুলসের কোনো টুল থেকে আপনি যা সেভ করেন—স্ক্যান করা ডকুমেন্ট, কমপ্রেস করা PDF বা সাইজ পরিবর্তন করা ছবি—সব এখানে সংরক্ষিত হয়।",
  "Close SohozTools sidebar": "সহজটুলসের পাশের প্যানেল বন্ধ করুন",
  "Browse SohozTools": "সহজটুলস দেখুন",
  Delete: "মুছুন",
  View: "দেখুন",
  "Delete this file?": "এই ফাইলটি মুছে ফেলবেন?",
  "This action will permanently remove the saved file.":
    "এই কাজটি করলে সংরক্ষিত ফাইলটি স্থায়ীভাবে মুছে যাবে।",
  Cancel: "বাতিল",
  "Deleting…": "মুছে ফেলা হচ্ছে…",
  "Loading…": "লোড হচ্ছে…",
  "Failed to delete the file. Please try again.":
    "ফাইলটি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।",
  "Failed to load My Files:": "আমার ফাইল লোড করা যায়নি:",
  "My Files authentication error:": "আমার ফাইলের অথেনটিকেশন ত্রুটি:",
  "Authentication required.": "অথেনটিকেশন প্রয়োজন।",
  "Invalid user session.": "ইউজার সেশন সঠিক নয়।",
  "Invalid or expired token.": "টোকেনটি সঠিক নয় বা এর মেয়াদ শেষ হয়েছে।",
  "A file URL is required.": "ফাইলের URL প্রয়োজন।",
  "Valid My Files item ID is required.": "সঠিক My Files আইডি প্রয়োজন।",
  "File not found.": "ফাইলটি পাওয়া যায়নি।",
  "Failed to load saved files.": "সংরক্ষিত ফাইলগুলো লোড করা যায়নি।",
  "Failed to save file.": "ফাইলটি সেভ করা যায়নি।",
  "File deleted successfully.": "ফাইলটি সফলভাবে মুছে ফেলা হয়েছে।",
  "Couldn't find any file with that name.": "ওই নামে কোনো ফাইল পাওয়া যায়নি।",
  Save: "সেভ করুন",
};

function translatePageText(value: unknown, locale: "en" | "bn"): string {
  const text = String(value ?? "").trim();
  const normalized = text.replace(/\s+/g, " ").trim();
  if (locale !== "bn") return normalized;
  if (PAGE_BN[normalized]) return PAGE_BN[normalized];
  if (/^Showing results from /i.test(normalized)) {
    const label = normalized.replace(/^Showing results from /i, "");
    return `ফলাফল দেখানো হচ্ছে: ${translatePageText(label, locale)}`;
  }
  if (/^No (.+) files yet$/i.test(normalized)) {
    const label = normalized.replace(/^No (.+) files yet$/i, "$1");
    return `${translatePageText(label, locale)}-এর কোনো ফাইল নেই`;
  }
  if (/^Files you save from (.+) tools will appear here\.$/i.test(normalized)) {
    const label = normalized.replace(
      /^Files you save from (.+) tools will appear here\.$/i,
      "$1",
    );
    return `${translatePageText(label, locale)} টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।`;
  }
  if (/^Preview (.+)$/i.test(normalized))
    return `প্রিভিউ: ${normalized.slice(8)}`;
  if (/^View (.+)$/i.test(normalized)) return `দেখুন: ${normalized.slice(5)}`;
  if (/^Download (.+)$/i.test(normalized))
    return `ডাউনলোড: ${normalized.slice(9)}`;
  if (/^Delete (.+)$/i.test(normalized)) return `মুছুন: ${normalized.slice(7)}`;
  if (/^\d+ file$/i.test(normalized) || /^\d+ files$/i.test(normalized)) {
    return `${normalized.split(" ")[0]}টি ফাইল`;
  }
  if (/^\d+%$/.test(normalized)) return normalized;
  const shared = translateText(normalized, locale);
  return shared || normalized;
}

function T({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  if (typeof children === "string" || typeof children === "number") {
    return <>{translatePageText(children, locale)}</>;
  }
  return <>{children}</>;
}
/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
type CategoryId =
  | "generated-images"
  | "ai-photo-edit"
  | "manually-edited"
  | "ai-template-generated"
  | "bulk-photo-edit"
  | "print-media"
  | "question-papers";
type SortOrder = "newest" | "oldest";
// মাঝখানের My Files-এর একটা সেভ করা ফাইল। category = কোন টুল থেকে এসেছে।
interface FileItem {
  id: string;
  name: string;
  category: Exclude<CategoryId, "generated-images">;
  createdAt: string; // ISO date string
  url?: string; // ছবি/ফাইলের লিংক (ডাউনলোডের জন্যও)
}
type ToolGroupId =
  | "all"
  | "pdf"
  | "image"
  | "text"
  | "video"
  | "general"
  | "educational";
// SohozTools-এ সেভ হওয়া একটা ফাইল (যেমন Document Scanner থেকে স্ক্যান করা ডকুমেন্ট)
interface ToolFile {
  id: string;
  name: string;
  toolName: string; // যেমন "Document Scanner"
  group: Exclude<ToolGroupId, "all">;
  createdAt: string;
  url?: string;
}
const TOOL_GROUPS: {
  id: ToolGroupId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: "All types", icon: LayoutGrid },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "video", label: "Video", icon: Video },
  { id: "general", label: "General", icon: Wrench },
  { id: "educational", label: "Educational", icon: GraduationCap },
];
interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyText: string;
  ctaLabel?: string;
  ctaHref?: string;
}
const CATEGORY_TABS: CategoryTab[] = [
  {
    id: "generated-images",
    label: "Generated Images",
    icon: ImageIcon,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText: "Your edited and generated images will appear here.",
  },
  {
    id: "ai-photo-edit",
    label: "AI Photo Edit",
    icon: Sparkles,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from AI Photo Edit will appear here once you create them.",
    ctaLabel: "Open AI Editor",
    ctaHref: "/ai-editor",
  },
  {
    id: "manually-edited",
    label: "Manually Edited",
    icon: SlidersHorizontal,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from the Manual Editor will appear here once you create them.",
    ctaLabel: "Open Manual Editor",
    ctaHref: "/manual-editor",
  },
  {
    id: "ai-template-generated",
    label: "AI Template Generated",
    icon: LayoutTemplate,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images made from AI templates will appear here once you create them.",
    ctaLabel: "Browse AI Templates",
    ctaHref: "/ai-template",
  },
  {
    id: "bulk-photo-edit",
    label: "Bulk Photo Edit",
    icon: Layers,
    searchPlaceholder: "Search images by filename",
    emptyTitle: "No images yet",
    emptyText:
      "Images from Bulk Photo Edit will appear here once you create them.",
  },
  {
    id: "print-media",
    label: "Print Media",
    icon: Printer,
    searchPlaceholder: "Search print media by name",
    emptyTitle: "No print media yet",
    emptyText:
      "Posters, cards and other print designs you create will be saved here.",
    ctaLabel: "Browse Print Media",
    ctaHref: "/print-media",
  },
  {
    id: "question-papers",
    label: "Question Papers",
    icon: ClipboardList,
    searchPlaceholder: "Search question papers by name",
    emptyTitle: "No question papers yet",
    emptyText: "Question papers you create will be saved here.",
    ctaLabel: "Create Question Paper",
    ctaHref: "/questions-create/create",
  },
];
// "Generated Images" ট্যাবে এই চারটা টুলের সব ছবি একসাথে দেখাবে
const IMAGE_CATEGORY_IDS: CategoryId[] = [
  "ai-photo-edit",
  "manually-edited",
  "ai-template-generated",
  "bulk-photo-edit",
];
function belongsToTab(item: FileItem, tabId: CategoryId): boolean {
  if (tabId === "generated-images")
    return IMAGE_CATEGORY_IDS.includes(item.category);
  return item.category === tabId;
}
function matchesQuery(name: string, query: string): boolean {
  return name.toLowerCase().includes(query);
}
function formatDate(iso: string, locale: "en" | "bn" = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function sortByDate<
  T extends {
    createdAt: string;
  },
>(list: T[], order: SortOrder): T[] {
  const dir = order === "newest" ? -1 : 1;
  return [...list].sort(
    (a, b) =>
      dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  );
}
/* ------------------------------------------------------------------ */
/* Shared styles & small pieces                                        */
/* ------------------------------------------------------------------ */
const fieldBase =
  "h-9 rounded-md border border-slate-300 bg-white text-sm text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const primaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40";
const secondaryBtn =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30";
function SearchBox({
  value,
  onChange,
  onClear,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="text"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldBase} w-full pl-9 pr-8 placeholder:text-slate-400`}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="সার্চ পরিষ্কার করুন"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-slate-400 hover:text-slate-700"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
function getToolFilePreviewKind(
  file: ToolFile,
): "image" | "pdf" | "video" | "text" | "other" {
  const value = `${file.name} ${file.url || ""}`.toLowerCase();
  if (value.includes("data:application/pdf") || /\.pdf(?:$|[?#])/.test(value)) {
    return "pdf";
  }
  if (
    value.includes("data:image/") ||
    /\.(?:png|jpe?g|webp|gif|bmp|svg)(?:$|[?#])/.test(value)
  ) {
    return "image";
  }
  if (
    value.includes("data:video/") ||
    /\.(?:mp4|webm|mov|m4v|ogg)(?:$|[?#])/.test(value)
  ) {
    return "video";
  }
  if (
    value.includes("data:text/") ||
    /\.(?:txt|csv|json|xml|html)(?:$|[?#])/.test(value)
  ) {
    return "text";
  }
  return "other";
}
function ToolFilePreviewModal({
  file,
  onClose,
}: {
  file: ToolFile;
  onClose: () => void;
}) {
  const kind = getToolFilePreviewKind(file);
  const { locale } = useI18n();
  const previewable = ["image", "pdf", "video", "text"].includes(kind);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={translatePageText(`Preview ${file.name}`, locale)}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-slate-900"
              title={file.name}
            >
              {file.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              <T>{file.toolName}</T>
              <T>{"\u00B7 "}</T>
              {formatDate(file.createdAt, locale)}
            </p>
          </div>

          <a
            href={file.url}
            download={file.name}
            className={`${secondaryBtn} shrink-0`}
          >
            <Download size={15} />
            <span className="hidden sm:inline">
              <T>{"Download"}</T>
            </span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
            aria-label={translatePageText("Close preview", locale)}
            title={translatePageText("Close", locale)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-3 sm:p-6">
          {kind === "image" && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[calc(92vh-110px)] max-w-full object-contain"
            />
          )}

          {kind === "pdf" && (
            <iframe
              src={file.url}
              title={file.name}
              className="h-[calc(92vh-110px)] w-full rounded-md border border-slate-200 bg-white"
            />
          )}

          {kind === "video" && (
            <video
              src={file.url}
              controls
              playsInline
              className="max-h-[calc(92vh-110px)] max-w-full rounded-md bg-black"
            />
          )}

          {kind === "text" && (
            <iframe
              src={file.url}
              title={file.name}
              className="h-[calc(92vh-110px)] w-full rounded-md border border-slate-200 bg-white"
            />
          )}

          {!previewable && (
            <div className="w-full max-w-md rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <FileText
                size={28}
                strokeWidth={1.5}
                className="mx-auto text-slate-400"
              />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">
                <T>{"Preview not available\n              "}</T>
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                <T>
                  {
                    "This file type cannot be displayed directly in the browser.\n              "
                  }
                </T>
              </p>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className={`${primaryBtn} mt-4`}
              >
                <T>{"Open file\n                "}</T>
                <ArrowRight size={14} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function SortSelect({
  value,
  onChange,
  className = "",
}: {
  value: SortOrder;
  onChange: (v: SortOrder) => void;
  className?: string;
}) {
  const { locale } = useI18n();
  return (
    <select
      aria-label={translatePageText("Sort files", locale)}
      value={value}
      onChange={(e) => onChange(e.target.value as SortOrder)}
      className={`${fieldBase} cursor-pointer px-2.5 ${className}`}
    >
      <option value="newest">
        <T>{"Newest first"}</T>
      </option>
      <option value="oldest">
        <T>{"Oldest first"}</T>
      </option>
    </select>
  );
}
/* ------------------------------------------------------------------ */
/* Scan animation (লোডিং-এর সময়) + zoom scale                          */
/* ------------------------------------------------------------------ */
const SCAN_CSS = `
@keyframes mf-scan { 0% { left: -200px; } 100% { left: 100%; } }
@keyframes mf-wipe {
  from { clip-path: inset(0 100% 0 0); opacity: 0.35; }
  to { clip-path: inset(0 0 0 0); opacity: 1; }
}
@keyframes mf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@media (prefers-reduced-motion: reduce) {
  .mf-scan-bar { animation: none !important; opacity: 0; }
  .mf-wipe { animation: none !important; }
}
`;
function ScanOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg"
    >
      <div
        className="mf-scan-bar absolute inset-y-0 w-[200px]"
        style={{
          left: -200,
          background:
            "linear-gradient(to right, rgba(37,99,235,0) 0%, rgba(37,99,235,0.08) 65%, rgba(37,99,235,0.22) 100%)",
          borderRight: "2px solid rgba(37,99,235,0.8)",
          boxShadow: "6px 0 20px rgba(37,99,235,0.25)",
          animation: "mf-scan 1.6s cubic-bezier(0.45, 0, 0.25, 1) infinite",
        }}
      />
    </div>
  );
}
function ScanSkeletonGrid({ count = 12 }: { count?: number }) {
  const { locale } = useI18n();
  return (
    <div
      role="status"
      aria-label={translatePageText("Loading your files", locale)}
      className="relative"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white"
          >
            <div
              className="flex aspect-[4/3] items-center justify-center bg-slate-100"
              style={{ animation: "mf-pulse 1.8s ease-in-out infinite" }}
            >
              <ImageIcon
                size={26}
                strokeWidth={1.4}
                className="text-slate-300"
              />
            </div>
            <div className="space-y-1.5 px-3 py-3">
              <div className="h-3 w-3/4 rounded bg-slate-100" />
              <div className="h-2.5 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
      <ScanOverlay />
    </div>
  );
}
function ScanSkeletonList({ count = 6 }: { count?: number }) {
  const { locale } = useI18n();
  return (
    <div
      role="status"
      aria-label={translatePageText("Loading tool files", locale)}
      className="relative"
    >
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="h-9 w-9 shrink-0 rounded-md bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-2/3 rounded bg-slate-100" />
              <div className="h-2.5 w-1/2 rounded bg-slate-100" />
            </div>
            <span className="h-6 w-6 shrink-0 rounded bg-slate-100" />
          </li>
        ))}
      </ul>
      <ScanOverlay />
    </div>
  );
}
// জুম-আউট / বড় স্ক্রিনে ন্যাভবারের সাথে মিলিয়ে কন্টেন্ট আনুপাতিক বড় হয় — এখন CSS দিয়ে
// (globals.css: html[data-nav-scaled] .page-zoom / .page-zoom-fill). মান বসায় PrePaintScript +
// DashboardNavbar, তাই রিলোডে প্রথম ফ্রেমেই সঠিক মাপ, কোনো state/JS-এর জন্য অপেক্ষা নেই।
/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function MyFilesPage() {
  const { locale } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  // মাঝখান: My Files
  const [activeTab, setActiveTab] = useState<CategoryId>("generated-images");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [switchNotice, setSwitchNotice] = useState<CategoryId | "">("");
  // ডান সাইডবার: SohozTools
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true); // ডেস্কটপে ডান পাশের প্যানেল
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false); // মোবাইলে ড্রয়ার
  const [toolGroup, setToolGroup] = useState<ToolGroupId>("all");
  const [toolSearch, setToolSearch] = useState<string>("");
  const [toolSort, setToolSort] = useState<SortOrder>("newest");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [toolFiles, setToolFiles] = useState<ToolFile[]>([]);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  // Image preview + delete state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");
  const [previewToolFile, setPreviewToolFile] = useState<ToolFile | null>(null);
  // Check auth first, then hydrate instantly from the in-memory cache when the
  // navbar has already prefetched the user's files. Revalidate quietly in the
  // background so recent uploads/deletions still appear without stale UI delay.
  useEffect(() => {
    let mounted = true;
    const applyData = (data: { files: unknown[]; toolFiles: unknown[] }) => {
      if (!mounted) return;
      setFiles(Array.isArray(data.files) ? (data.files as FileItem[]) : []);
      setToolFiles(Array.isArray(data.toolFiles) ? (data.toolFiles as ToolFile[]) : []);
      setFilesLoading(false);
    };

    void getClientSession()
      .then(async (session) => {
        if (!mounted) return;
        if (!session.authenticated) {
          window.location.replace("/login?callbackUrl=%2Fmy-files");
          return;
        }
        setIsAuthenticated(true);

        const cachedData = getCachedMyFilesData();
        if (cachedData) {
          applyData(cachedData);
          // Show cached thumbnails immediately, then refresh in the background.
          void refreshMyFilesData()
            .then((freshData) => applyData(freshData))
            .catch((error) => console.error("Failed to refresh My Files:", error));
          return;
        }

        try {
          const data = await refreshMyFilesData();
          applyData(data);
        } catch (error) {
          console.error("Failed to load My Files:", error);
          if (mounted) setFilesLoading(false);
        }
      })
      .catch((error) => {
        console.error("My Files authentication error:", error);
        if (mounted) setFilesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);
  // সার্চ করলে: বর্তমান ট্যাবে না পেলে, যে ট্যাবে ফাইলটা আছে সেখানে অটো চলে যাবে
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const hasMatch = (tabId: CategoryId) =>
      files.some((f) => belongsToTab(f, tabId) && matchesQuery(f.name, q));
    if (hasMatch(activeTab)) return;
    const target = CATEGORY_TABS.find(
      (t) => t.id !== "generated-images" && hasMatch(t.id),
    );
    if (target) {
      setActiveTab(target.id);
      setSwitchNotice(target.id);
    }
    // শুধু সার্চ লেখা বদলালেই চালাতে চাই, ট্যাব বদলালে না
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);
  const currentTab =
    CATEGORY_TABS.find((t) => t.id === activeTab) ?? CATEGORY_TABS[0];
  const hasSearch = searchQuery.trim() !== "";
  const hasToolSearch = toolSearch.trim() !== "";
  // প্রতিটা ট্যাবে কয়টা ফাইল আছে (ট্যাবের পাশে ছোট করে দেখাবে)
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_TABS.forEach((t) => {
      counts[t.id] = files.filter((f) => belongsToTab(f, t.id)).length;
    });
    return counts;
  }, [files]);
  const visibleFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortByDate(
      files.filter(
        (f) => belongsToTab(f, activeTab) && (!q || matchesQuery(f.name, q)),
      ),
      sort,
    );
  }, [files, activeTab, searchQuery, sort]);
  const visibleToolFiles = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return sortByDate(
      toolFiles.filter(
        (f) =>
          (toolGroup === "all" || f.group === toolGroup) &&
          (!q || matchesQuery(f.name, q) || matchesQuery(f.toolName, q)),
      ),
      toolSort,
    );
  }, [toolFiles, toolGroup, toolSearch, toolSort]);
  const resetSearch = () => {
    setSearchQuery("");
    setSwitchNotice("");
  };
  const handlePreview = (file: FileItem) => {
    if (!file.url) return;
    setDeleteError("");
    setPreviewFile(file);
  };
  const handleToolPreview = (file: ToolFile) => {
    if (!file.url) return;
    setPreviewToolFile(file);
  };
  const openDeleteConfirm = (file: FileItem) => {
    setDeleteError("");
    setDeleteTarget(file);
  };
  const closeDeleteConfirm = () => {
    if (deletingFileId) return;
    setDeleteTarget(null);
    setDeleteError("");
  };
  const handleDeleteFile = async () => {
    if (!deleteTarget || deletingFileId) return;
    const file = deleteTarget;
    setDeletingFileId(file.id);
    setDeleteError("");
    try {
      const response = await fetch("/api/my-files", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: file.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success === false) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : typeof result?.message === "string"
              ? result.message
              : "Failed to delete the file. Please try again.",
        );
      }
      setFiles((current) => current.filter((item) => item.id !== file.id));
      removeCachedMyFilesItem(file.id);
      setPreviewFile((current) => (current?.id === file.id ? null : current));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete My Files item:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete the file. Please try again.",
      );
    } finally {
      setDeletingFileId(null);
    }
  };
  const handleCategoryChange = (id: CategoryId) => {
    setActiveTab(id);
    resetSearch();
  };
  // মাঝখানের empty state-এর লেখা
  const EmptyIcon = hasSearch ? Search : currentTab.icon;
  const emptyTitle = hasSearch ? "No matching results" : currentTab.emptyTitle;
  const emptyText = hasSearch
    ? "We couldn't find any file with that name. Try a different word."
    : currentTab.emptyText;
  // সাইডবারের empty state-এর লেখা
  const currentGroup =
    TOOL_GROUPS.find((g) => g.id === toolGroup) ?? TOOL_GROUPS[0];
  const ToolEmptyIcon = hasToolSearch ? Search : currentGroup.icon;
  let toolEmptyTitle = "No tool files yet";
  let toolEmptyText =
    "Use any SohozTools tool and press Save. Your file will show up here.";
  if (hasToolSearch) {
    toolEmptyTitle = "No matching results";
    toolEmptyText = "We couldn't find any file with that name.";
  } else if (toolGroup !== "all") {
    if (locale === "bn") {
      const names: Record<
        Exclude<ToolGroupId, "all">,
        { name: string; text: string }
      > = {
        pdf: {
          name: "PDF",
          text: "PDF টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
        image: {
          name: "ছবি",
          text: "ছবির টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
        text: {
          name: "লেখা",
          text: "লেখার টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
        video: {
          name: "ভিডিও",
          text: "ভিডিওর টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
        general: {
          name: "সাধারণ",
          text: "সাধারণ টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
        educational: {
          name: "শিক্ষামূলক",
          text: "শিক্ষামূলক টুল থেকে সেভ করা ফাইলগুলো এখানে দেখা যাবে।",
        },
      };
      const info = names[toolGroup as Exclude<ToolGroupId, "all">];
      toolEmptyTitle = `এখনও কোনো ${info.name} ফাইল নেই`;
      toolEmptyText = info.text;
    } else {
      toolEmptyTitle = `No ${currentGroup.label} files yet`;
      toolEmptyText = `Files you save from ${currentGroup.label} tools will appear here.`;
    }
  }
  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setSidebarOpen((v) => !v);
    else setMobileSidebarOpen((v) => !v);
  };
  const closeSidebar = () => {
    setMobileSidebarOpen(false);
    if (window.innerWidth >= 1024) setSidebarOpen(false);
  };
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-slate-900">
        <main className="flex items-center justify-center px-4">
          <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
            <Loader2 size={18} className="animate-spin text-[#2563EB]" />
            <T>{"Verifying your login..."}</T>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900 lg:h-dvh">
      <style>{SCAN_CSS}</style>
      <DashboardNavbar scaleWithZoom />

      <main
        className="page-zoom page-zoom-fill flex w-full flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:min-h-0 lg:px-8 2xl:px-12"
      >
        {/* Page header */}
        <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 sm:mb-6 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              <T>{"My Files\n            "}</T>
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-slate-600 sm:text-sm">
              <T>
                {
                  "Everything you make with Sohozkaj \u2014 edited photos, templates,\n              print designs and question papers \u2014 is saved here.\n            "
                }
              </T>
            </p>
            <p className="mt-0.5 text-[13px] leading-5 text-slate-500 sm:text-sm">
              <T>
                {
                  "Files are deleted automatically after 30 days, so download what\n              you need before then.\n            "
                }
              </T>
            </p>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen || mobileSidebarOpen}
            aria-controls="sohoztools-sidebar"
            className={`${secondaryBtn} w-full justify-center sm:w-auto ${sidebarOpen ? "lg:bg-slate-100" : ""} ${mobileSidebarOpen ? "bg-slate-100" : ""}`}
          >
            <Wrench size={15} className="text-slate-500" />
            <T>{"SohozTools Files\n            "}</T>
            {sidebarOpen ? (
              <PanelRightClose
                size={15}
                className="hidden text-slate-400 lg:block"
              />
            ) : (
              <PanelRightOpen
                size={15}
                className="hidden text-slate-400 lg:block"
              />
            )}
            <PanelRightOpen size={15} className="text-slate-400 lg:hidden" />
          </button>
        </header>

        <div
          className={`grid items-start gap-4 sm:gap-6 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch ${sidebarOpen ? "lg:grid-cols-[minmax(0,1fr)_340px]" : "grid-cols-1"}`}
        >
          {/* ======================= My Files ======================= */}
          <section
            aria-label={translatePageText("My files", locale)}
            className="flex min-h-[480px] min-w-0 flex-col rounded-lg border border-slate-200 bg-white sm:min-h-[560px] lg:min-h-0 lg:overflow-hidden"
          >
            {/* Tabs */}
            <div
              role="tablist"
              aria-label={translatePageText("File categories", locale)}
              className="flex shrink-0 gap-5 overflow-x-auto border-b border-slate-200 px-4 [scrollbar-width:none] sm:gap-6 sm:px-5 [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORY_TABS.map((tab) => {
                const active = tab.id === activeTab;
                const count = tabCounts[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={(e) => {
                      handleCategoryChange(tab.id);
                      e.currentTarget.scrollIntoView({
                        inline: "center",
                        block: "nearest",
                        behavior: "smooth",
                      });
                    }}
                    className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 py-3 text-sm font-medium outline-none transition-colors focus-visible:text-blue-700 ${
                      active
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    {<T>{tab.label}</T>}
                    {count > 0 && (
                      <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + sort */}
            <div className="flex shrink-0 gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <SearchBox
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  setSwitchNotice("");
                }}
                onClear={resetSearch}
                placeholder={translatePageText(
                  currentTab.searchPlaceholder,
                  locale,
                )}
                label={translatePageText("Search files", locale)}
              />
              <SortSelect
                value={sort}
                onChange={setSort}
                className="shrink-0"
              />
            </div>

            {/* Results */}
            <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5 lg:min-h-0 lg:overflow-y-auto">
              {!filesLoading && switchNotice && (
                <p role="status" className="mb-3 text-sm text-blue-700">
                  <T>{`Showing results from ${CATEGORY_TABS.find((t) => t.id === switchNotice)?.label ?? ""}`}</T>
                </p>
              )}

              {filesLoading ? (
                <ScanSkeletonGrid />
              ) : visibleFiles.length > 0 ? (
                <div
                  aria-live="polite"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-4"
                >
                  {visibleFiles.map((file, index) => {
                    const isImage =
                      Boolean(file.url) &&
                      IMAGE_CATEGORY_IDS.includes(file.category);
                    const PlaceholderIcon =
                      CATEGORY_TABS.find((t) => t.id === file.category)?.icon ??
                      ImageIcon;
                    return (
                      <article
                        key={file.id}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-400"
                      >
                        <button
                          type="button"
                          onClick={() => handlePreview(file)}
                          disabled={!isImage}
                          aria-label={
                            isImage
                              ? translatePageText(`View ${file.name}`, locale)
                              : undefined
                          }
                          title={
                            isImage
                              ? translatePageText("View", locale)
                              : undefined
                          }
                          className={`group relative flex aspect-[4/3] w-full items-center justify-center bg-slate-100 ${
                            isImage
                              ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                              : "cursor-default"
                          }`}
                        >
                          {isImage ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getMyFilesThumbnailUrl(file.url || "")}
                                alt={file.name}
                                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                loading={index < 8 ? "eager" : "lazy"}
                              />
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-200 group-hover:bg-slate-900/20">
                                <span className="flex h-10 w-10 scale-95 items-center justify-center rounded-full bg-white/95 text-slate-700 opacity-0 shadow-md transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                                  <Eye size={18} />
                                </span>
                              </span>
                            </>
                          ) : (
                            <PlaceholderIcon
                              size={28}
                              strokeWidth={1.5}
                              className="text-slate-400"
                            />
                          )}
                        </button>
                        <div className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3 sm:py-2.5">
                          <button
                            type="button"
                            onClick={() => handlePreview(file)}
                            disabled={!isImage}
                            aria-label={
                              isImage
                                ? translatePageText(`View ${file.name}`, locale)
                                : undefined
                            }
                            title={
                              isImage
                                ? translatePageText("View", locale)
                                : undefined
                            }
                            className={`min-w-0 flex-1 text-left outline-none ${
                              isImage
                                ? "cursor-pointer focus-visible:underline focus-visible:underline-offset-2"
                                : "cursor-default"
                            }`}
                          >
                            <p
                              className="truncate text-[13px] font-medium text-slate-900 sm:text-sm"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(file.createdAt, locale)}
                            </p>
                          </button>
                          {file.url && (
                            <a
                              href={file.url}
                              download={file.name}
                              aria-label={translatePageText(
                                `Download ${file.name}`,
                                locale,
                              )}
                              title={translatePageText("Download", locale)}
                              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                            >
                              <Download size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(file)}
                            disabled={deletingFileId === file.id}
                            aria-label={translatePageText(
                              `Delete ${file.name}`,
                              locale,
                            )}
                            title={translatePageText("Delete", locale)}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 disabled:cursor-wait disabled:opacity-60"
                          >
                            {deletingFileId === file.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div
                  aria-live="polite"
                  className="flex flex-1 items-center justify-center py-6"
                >
                  <div className="w-full max-w-md rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center">
                    <EmptyIcon
                      size={28}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-400"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      <T>{emptyTitle}</T>
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                      <T>{emptyText}</T>
                    </p>

                    {hasSearch ? (
                      <button
                        type="button"
                        onClick={resetSearch}
                        className={`${secondaryBtn} mt-5`}
                      >
                        <T>{"Clear search\n                      "}</T>
                      </button>
                    ) : (
                      currentTab.ctaLabel &&
                      currentTab.ctaHref && (
                        <Link
                          href={currentTab.ctaHref}
                          className={`${primaryBtn} mt-5`}
                        >
                          <T>{currentTab.ctaLabel}</T>
                          <ArrowRight size={14} />
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ===================== SohozTools sidebar ===================== */}
          {mobileSidebarOpen && (
            <div
              aria-hidden="true"
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-[55] bg-slate-900/40 lg:hidden"
            />
          )}

          {(sidebarOpen || mobileSidebarOpen) && (
            <aside
              id="sohoztools-sidebar"
              aria-label={translatePageText("SohozTools files", locale)}
              className={`flex-col border border-slate-200 bg-white lg:min-h-0 lg:overflow-hidden lg:rounded-lg ${
                mobileSidebarOpen
                  ? "fixed inset-y-0 right-0 z-[60] flex w-[90vw] max-w-sm overflow-hidden rounded-l-xl shadow-2xl"
                  : "hidden"
              } ${
                sidebarOpen
                  ? "lg:static lg:z-auto lg:flex lg:w-auto lg:max-w-none lg:shadow-none"
                  : "lg:hidden"
              }`}
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">
                    <T>{"SohozTools Files\n                  "}</T>
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filesLoading ? (
                      <T>{"Loading…"}</T>
                    ) : (
                      <T>{`${toolFiles.length} ${toolFiles.length === 1 ? "file" : "files"}`}</T>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSidebar}
                  aria-label={translatePageText(
                    "Close SohozTools sidebar",
                    locale,
                  )}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="shrink-0 space-y-2.5 px-4 pt-3">
                <p className="text-xs leading-5 text-slate-500">
                  <T>
                    {
                      "Anything you save from a SohozTools tool \u2014 a scanned document,\n                  a compressed PDF, a resized photo \u2014 is stored here.\n                "
                    }
                  </T>
                </p>
                <SearchBox
                  value={toolSearch}
                  onChange={setToolSearch}
                  onClear={() => setToolSearch("")}
                  placeholder={translatePageText(
                    "Search by file or tool name",
                    locale,
                  )}
                  label={translatePageText("Search tool files", locale)}
                />
                <div className="flex gap-2">
                  <select
                    aria-label={translatePageText(
                      "Filter by file type",
                      locale,
                    )}
                    value={toolGroup}
                    onChange={(e) =>
                      setToolGroup(e.target.value as ToolGroupId)
                    }
                    className={`${fieldBase} min-w-0 flex-1 cursor-pointer px-2.5`}
                  >
                    {TOOL_GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        <T>{g.label}</T>
                      </option>
                    ))}
                  </select>
                  <SortSelect value={toolSort} onChange={setToolSort} />
                </div>
              </div>

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-slate-200">
                {filesLoading ? (
                  <ScanSkeletonList />
                ) : visibleToolFiles.length > 0 ? (
                  <ul className="divide-y divide-slate-100" aria-live="polite">
                    {visibleToolFiles.map((file) => {
                      const GroupIcon = (
                        TOOL_GROUPS.find((g) => g.id === file.group) ??
                        TOOL_GROUPS[0]
                      ).icon;
                      return (
                        <li
                          key={file.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                        >
                          <button
                            type="button"
                            onClick={() => handleToolPreview(file)}
                            disabled={!file.url}
                            aria-label={
                              file.url
                                ? translatePageText(`View ${file.name}`, locale)
                                : undefined
                            }
                            title={
                              file.url
                                ? translatePageText("View", locale)
                                : undefined
                            }
                            className={`flex min-w-0 flex-1 items-center gap-3 text-left outline-none ${
                              file.url
                                ? "cursor-pointer focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                                : "cursor-default"
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                              <GroupIcon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-sm font-medium text-slate-900"
                                title={file.name}
                              >
                                {file.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                <T>{file.toolName}</T>
                                <T>{"\u00B7 "}</T>
                                {formatDate(file.createdAt, locale)}
                              </p>
                            </div>
                          </button>
                          {file.url && (
                            <a
                              href={file.url}
                              download={file.name}
                              aria-label={translatePageText(
                                `Download ${file.name}`,
                                locale,
                              )}
                              title={translatePageText("Download", locale)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Download size={16} />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div aria-live="polite" className="px-6 py-10 text-center">
                    <ToolEmptyIcon
                      size={26}
                      strokeWidth={1.5}
                      className="mx-auto text-slate-400"
                    />
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">
                      <T>{toolEmptyTitle}</T>
                    </h3>
                    <p className="mx-auto mt-1 max-w-[240px] text-sm text-slate-500">
                      <T>{toolEmptyText}</T>
                    </p>
                    {hasToolSearch ? (
                      <button
                        type="button"
                        onClick={() => setToolSearch("")}
                        className={`${secondaryBtn} mt-4`}
                      >
                        <T>{"Clear search\n                      "}</T>
                      </button>
                    ) : (
                      <Link
                        href="/sohoj-tools"
                        className={`${primaryBtn} mt-4`}
                      >
                        <T>{"Browse SohozTools\n                        "}</T>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* ===================== Image preview ===================== */}
      {previewFile?.url && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={translatePageText(`Preview ${previewFile.name}`, locale)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPreviewFile(null);
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold text-slate-900"
                  title={previewFile.name}
                >
                  {previewFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(previewFile.createdAt, locale)}
                </p>
              </div>

              <a
                href={previewFile.url}
                download={previewFile.name}
                className={`${secondaryBtn} shrink-0`}
              >
                <Download size={15} />
                <span className="hidden sm:inline">
                  <T>{"Download"}</T>
                </span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setPreviewFile(null);
                  openDeleteConfirm(previewFile);
                }}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"
                aria-label={translatePageText(
                  `Delete ${previewFile.name}`,
                  locale,
                )}
                title={translatePageText("Delete", locale)}
              >
                <Trash2 size={17} />
              </button>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                aria-label={translatePageText("Close preview", locale)}
                title={translatePageText("Close", locale)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 p-3 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[calc(92vh-110px)] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== SohozTools file preview ===================== */}
      {previewToolFile?.url && (
        <ToolFilePreviewModal
          file={previewToolFile}
          onClose={() => setPreviewToolFile(null)}
        />
      )}

      {/* ===================== Delete confirmation ===================== */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-file-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={19} />
              </div>
              <div className="min-w-0">
                <h2
                  id="delete-file-title"
                  className="text-base font-semibold text-slate-900"
                >
                  <T>{"Delete this file?\n                "}</T>
                </h2>
                <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                  <span className="font-medium text-slate-800">
                    {deleteTarget.name}
                  </span>
                  <br />
                  <T>
                    {
                      "This action will permanently remove the saved file.\n                "
                    }
                  </T>
                </p>
              </div>
            </div>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={Boolean(deletingFileId)}
                className={secondaryBtn}
              >
                <T>{"Cancel\n              "}</T>
              </button>
              <button
                type="button"
                onClick={handleDeleteFile}
                disabled={Boolean(deletingFileId)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-red-600 px-3.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/40 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingFileId ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <T>{"Deleting\u2026\n                  "}</T>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <T>{"Delete\n                  "}</T>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
