"use client";
import { T, useSohozI18n, L } from "@/app/sohoj-tools/_i18n";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Share, FileText, CreditCard, ShieldCheck, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Printer, RotateCcw, RefreshCw, Download, X, Calendar as CalendarIcon, AlertTriangle, Loader2, Minus, Plus, CheckCircle2, } from "lucide-react";
import { DISTRICTS, upazilasForDistrict, districtBnById, upazilaBnById, } from "./bd-geo-data";
const STORAGE_KEY = "sohojkaj:voter-migration-form:last-application";
const USAGE_KEY = "sohojkaj:voter-migration-form:usage-count";
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const BN_MONTHS = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
];
const EN_MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
// ---------------------------------------------------------------------------
// Form-13 paper: ONE source of truth for the live preview, Print and PDF.
// The preview pages are real A4 pages (210mm x 297mm), so what you see on the
// right is exactly what gets printed / exported. Nothing is re-scaled or
// re-typeset at print time, which is what used to clip text.
// ---------------------------------------------------------------------------
const PAGE_W_PX = 794; // 210mm @ 96dpi
const PAGE_H_PX = 1123; // 297mm @ 96dpi
const PAGE_GAP_PX = 24;
const PAPER_FONT_HREF = "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap";
const PAPER_FONT_STACK = `"Noto Serif Bengali", "Kalpurush", "SolaimanLipi", "Siyam Rupali", "Nirmala UI", "Vrinda", "Noto Sans Bengali", serif`;
const PAPER_CSS = `
  .f13-page {
    box-sizing: border-box;
    width: 210mm;
    height: 297mm;
    padding: 15mm 16mm 14mm;
    background: #ffffff;
    color: #111827;
    font-family: ${PAPER_FONT_STACK};
    font-size: 13.5px;
    line-height: 1.7;
    position: relative;
    overflow: hidden;
    text-rendering: geometricPrecision;
    -webkit-font-smoothing: antialiased;
  }
  .f13-page *, .f13-page *::before, .f13-page *::after { box-sizing: border-box; }
  .f13-page p { margin: 0; }
  .f13-right { text-align: right; font-weight: 700; }
  .f13-center { text-align: center; }
  .f13-title { text-align: center; font-weight: 700; font-size: 16.5px; line-height: 1.6; margin-top: 6px; }
  .f13-sec { margin-top: 16px; }
  .f13-row { display: flex; align-items: flex-start; gap: 6px; margin-top: 9px; }
  .f13-row.f13-sec { margin-top: 16px; }
  .f13-num { flex: 0 0 28px; font-weight: 700; }
  .f13-body { flex: 1 1 auto; min-width: 0; }
  .f13-flow { line-height: 2; }
  .f13-sub { margin-left: 34px; margin-top: 9px; }
  .f13-cols { display: flex; align-items: flex-end; gap: 14px; margin-top: 9px; }
  .f13-cols:first-child { margin-top: 0; }
  .f13-fld { display: flex; align-items: flex-end; gap: 6px; min-width: 0; }
  .f13-lbl { white-space: nowrap; flex: 0 0 auto; }
  .f13-fill {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 1.75em;
    padding: 0 4px;
    border-bottom: 1.5px dotted #374151;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .f13-dots {
    display: inline-block;
    min-width: 120px;
    max-width: 100%;
    padding: 0 4px;
    border-bottom: 1.5px dotted #374151;
    font-weight: 600;
    line-height: 1.7;
    vertical-align: bottom;
    overflow-wrap: anywhere;
  }
  .f13-note { margin-left: 34px; font-size: 11.5px; color: #4b5563; line-height: 1.5; }
  .f13-pc { display: inline-flex; }
  .f13-pcb {
    width: 24px;
    height: 26px;
    margin-left: -1px;
    border: 1px solid #374151;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
  }
  .f13-item { margin-top: 5px; margin-left: 34px; }
  .f13-sign { display: flex; justify-content: flex-end; margin-top: 46px; }
  .f13-sign > div { width: 58mm; border-top: 1px solid #111827; text-align: center; font-weight: 700; font-size: 12px; padding-top: 4px; }
  .f13-p2 { display: flex; flex-direction: column; }
  .f13-receipt { margin-top: auto; padding-top: 14px; border-top: 1.5px dashed #6b7280; }
  .f13-h { font-weight: 700; }
  .f13-ul { text-decoration: underline; text-underline-offset: 3px; }
`;
// Extra CSS for the isolated print / PDF frame (pages sit directly in <body>).
const FRAME_CSS = `
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @media print {
    .f13-page { height: 296mm; break-after: page; page-break-after: always; }
    .f13-page:last-child { break-after: auto; page-break-after: auto; }
  }
`;
function buildPaperDocument(pages: string[]): string {
    return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>Form-13</title><link rel="stylesheet" href="${PAPER_FONT_HREF}"><style>${PAPER_CSS}${FRAME_CSS}</style></head><body>${pages.join("")}</body></html>`;
}
function ensurePaperFont() {
    if (typeof document === "undefined")
        return;
    if (document.getElementById("f13-paper-font"))
        return;
    const link = document.createElement("link");
    link.id = "f13-paper-font";
    link.rel = "stylesheet";
    link.href = PAPER_FONT_HREF;
    document.head.appendChild(link);
}
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | void> {
    return Promise.race([
        p,
        new Promise<void>((resolve) => window.setTimeout(resolve, ms)),
    ]);
}
const relatedTools = [
    {
        title: "Family Card Form",
        description: "Fill in your details on the left — see a live application letter on the right and download as PDF.",
        href: "/sohoj-tools/family-card-form",
        icon: CreditCard,
    },
    {
        title: "Reduce Video File Size",
        description: "Check status of Department of Social Services allowance application status, — by tracking id or NID — and print the result.",
        href: "/sohoj-tools/reduce-video-file-size",
        icon: FileText,
    },
];
function toBn(input: number | string): string {
    return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
function pad2(n: number): string {
    return String(n).padStart(2, "0");
}
function formatDateBn(date: Date): string {
    return `${toBn(pad2(date.getDate()))}-${toBn(pad2(date.getMonth() + 1))}-${toBn(date.getFullYear())}`;
}
function formatDateEn(date: Date): string {
    return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}
function isSameDay(a: Date, b: Date): boolean {
    return (a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate());
}
function calcAge(dob: Date, ref: Date = new Date()): number {
    let age = ref.getFullYear() - dob.getFullYear();
    const m = ref.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < dob.getDate()))
        age--;
    return age;
}
function dateTurning18(dob: Date): Date {
    return new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
}
interface FormState {
    regDistrict: string;
    regUpazila: string;
    applicantName: string;
    nationalId: string;
    dobISO: string | null;
    voterNumber: string;
    voterAreaName: string;
    voterAreaCode: string;
    currentDistrict: string;
    currentUpazila: string;
    currentVillage: string;
    currentHouseNo: string;
    newDistrict: string;
    newUpazila: string;
    newCityCorp: string;
    newWardNo: string;
    newAreaName: string;
    newAreaCode: string;
    newVillage: string;
    newHouseNo: string;
    newPhone: string;
    newPostOffice: string;
    newPostalCode: string;
    residingMonth: number | null;
    residingYear: number | null;
    migrationReason: string;
    identifierName: string;
    identifierNid: string;
    identifierAddress: string;
}
const EMPTY_STATE: FormState = {
    regDistrict: "",
    regUpazila: "",
    applicantName: "",
    nationalId: "",
    dobISO: null,
    voterNumber: "",
    voterAreaName: "",
    voterAreaCode: "",
    currentDistrict: "",
    currentUpazila: "",
    currentVillage: "",
    currentHouseNo: "",
    newDistrict: "",
    newUpazila: "",
    newCityCorp: "",
    newWardNo: "",
    newAreaName: "",
    newAreaCode: "",
    newVillage: "",
    newHouseNo: "",
    newPhone: "",
    newPostOffice: "",
    newPostalCode: "",
    residingMonth: null,
    residingYear: null,
    migrationReason: "",
    identifierName: "",
    identifierNid: "",
    identifierAddress: "",
};
interface GeoOption {
    id: string;
    bn: string;
}
function GeoCombobox({ value, onChange, options, placeholder, disabled, }: {
    value: string;
    onChange: (id: string) => void;
    options: GeoOption[];
    placeholder: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    const selected = options.find((o) => o.id === value);
    const filtered = useMemo(() => {
        const q = query.trim();
        if (!q)
            return options;
        return options.filter((o) => o.bn.includes(q));
    }, [options, query]);
    return (<div ref={rootRef} className="relative">
      <div onClick={() => {
            if (disabled)
                return;
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
        }} className={`w-full bg-white border rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors ${disabled
            ? "border-gray-100 bg-gray-50 cursor-not-allowed"
            : "border-gray-200 cursor-text focus-within:border-indigo-500"}`}>
        {selected ? (<span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-md pl-1.5 pr-1 py-0.5 font-semibold max-w-full">
            <span className="truncate">{selected.bn}</span>
            {!disabled && (<button type="button" onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                    setQuery("");
                }} className="text-indigo-400 hover:text-indigo-700 shrink-0">
                <X size={11}/>
              </button>)}
          </span>) : null}
        <input ref={inputRef} type="text" disabled={disabled} value={query} onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
        }} onFocus={() => !disabled && setOpen(true)} placeholder={selected ? "" : placeholder} className="flex-1 min-w-[2rem] outline-none bg-transparent text-xs text-[#0F172A] placeholder:text-gray-400 disabled:cursor-not-allowed"/>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}/>
      </div>

      {open && !disabled && (<div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          {filtered.length === 0 ? (<p className="text-[11px] text-gray-400 px-2 py-2 text-center"><T>{"No results found\n            "}</T></p>) : (<div className={filtered.length > 12
                    ? "grid grid-cols-2 gap-x-2"
                    : "flex flex-col"}>
              {filtered.map((o) => (<button key={o.id} type="button" onClick={() => {
                        onChange(o.id);
                        setOpen(false);
                        setQuery("");
                    }} className={`text-left text-xs px-2 py-1.5 rounded-md hover:bg-indigo-50 transition-colors truncate ${o.id === value
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-[#0F172A]"}`}>
                  {o.bn}
                </button>))}
            </div>)}
        </div>)}
    </div>);
}
function fromBn(input: string): string {
    return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}
// Accepts Bengali or English digits, keeps digits only, and enforces a limit.
function digitsOnly(input: string, max: number): string {
    return fromBn(input).replace(/\D/g, "").slice(0, max);
}
function toLocalISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseStoredDate(s: string | null | undefined): Date | null {
    if (!s)
        return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const d = m
        ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        : new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}
const GRID2 = "grid grid-cols-1 sm:grid-cols-2 gap-2";
function Section({ title, children, }: {
    title: string;
    children: React.ReactNode;
}) {
    return (<div className="space-y-2 border border-indigo-200/80 rounded-xl p-3 bg-indigo-50/20">
      <h3 className="text-[11.5px] font-bold text-indigo-900">{title}</h3>
      {children}
    </div>);
}
function Field({ label, children, hint, counter, }: {
    label: string;
    children: React.ReactNode;
    hint?: string;
    counter?: string;
}) {
    return (<div className="space-y-0.5 min-w-0">
      <div className="flex items-end justify-between gap-2">
        <label className="text-[11px] font-semibold text-gray-600 leading-tight">
          {label}
        </label>
        {counter && (<span className="text-[10px] font-medium text-gray-400 shrink-0">
            {counter}
          </span>)}
      </div>
      {children}
      {hint && <p className="text-[10px] text-red-500 font-medium">{hint}</p>}
    </div>);
}
function TextInput({ value, onChange, placeholder, inputMode, maxLength, }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    inputMode?: "text" | "numeric" | "tel";
    maxLength?: number;
}) {
    return (<input type="text" inputMode={inputMode} maxLength={maxLength} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-[#0F172A] focus:outline-none focus:border-indigo-500"/>);
}
// 4 separate boxes for the postal code (digits only, auto-advance, paste-able).
function PostCodeBoxes({ value, onChange, }: {
    value: string;
    onChange: (v: string) => void;
}) {
    const refs = useRef<Array<HTMLInputElement | null>>([]);
    function focusBox(i: number) {
        const el = refs.current[Math.max(0, Math.min(3, i))];
        el?.focus();
        el?.select();
    }
    return (<div className="flex items-center gap-1.5">
      {Array.from({ length: 4 }).map((_, i) => (<input key={i} ref={(el) => {
                refs.current[i] = el;
            }} type="text" inputMode="numeric" autoComplete="off" aria-label={`Post code digit ${i + 1}`} value={value[i] ?? ""} onFocus={(e) => e.target.select()} onChange={(e) => {
                const d = digitsOnly(e.target.value, 8).slice(-1);
                if (!d)
                    return;
                const at = Math.min(i, value.length);
                onChange((value.slice(0, at) + d + value.slice(at + 1)).slice(0, 4));
                focusBox(at + 1);
            }} onKeyDown={(e) => {
                if (e.key === "Backspace") {
                    e.preventDefault();
                    if (value[i]) {
                        onChange(value.slice(0, i) + value.slice(i + 1));
                    }
                    else if (i > 0) {
                        onChange(value.slice(0, i - 1) + value.slice(i));
                        focusBox(i - 1);
                    }
                }
                else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    focusBox(i - 1);
                }
                else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    focusBox(i + 1);
                }
            }} onPaste={(e) => {
                e.preventDefault();
                const pasted = digitsOnly(e.clipboardData.getData("text"), 4);
                if (!pasted)
                    return;
                onChange(pasted);
                focusBox(pasted.length);
            }} className="w-8 h-8 text-center text-xs font-bold text-[#0F172A] bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"/>))}
    </div>);
}
// ---- Form-13 paper primitives (plain CSS classes from PAPER_CSS) ----------
function P13Field({ label, value, grow = 1, lblWidth, }: {
    label: string;
    value?: string;
    grow?: number;
    lblWidth?: number;
}) {
    return (<div className="f13-fld" style={{ flex: `${grow} 1 0px` }}>
      <span className="f13-lbl" style={lblWidth ? { minWidth: lblWidth } : undefined}>
        {label}
      </span>
      <span className="f13-fill">{value}</span>
    </div>);
}
function P13Dots({ children, min, }: {
    children?: React.ReactNode;
    min?: number;
}) {
    return (<span className="f13-dots" style={min ? { minWidth: min } : undefined}>
      {children}
    </span>);
}
function DobPicker({ value, onPick, placeholder, }: {
    value: Date | null;
    onPick: (d: Date | null) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(value ?? new Date(1995, 0, 1));
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (value)
            setViewDate(value);
    }, [value]);
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const currentYear = new Date().getFullYear();
    const yearOptions = useMemo(() => Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i), [currentYear]);
    return (<div ref={rootRef} className="relative">
      <div onClick={() => setOpen((o) => !o)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer focus-within:border-indigo-500">
        <CalendarIcon size={13} className="text-gray-400 shrink-0"/>
        {value ? (<span className="flex-1 text-[#0F172A] font-semibold">
            {formatDateBn(value)}
          </span>) : (<span className="flex-1 text-gray-400">{placeholder}</span>)}
        {value && (<button type="button" onClick={(e) => {
                e.stopPropagation();
                onPick(null);
            }} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={12}/>
          </button>)}
      </div>

      {open && (<div className="absolute z-20 mt-1 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
              <ChevronLeft size={14}/>
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[#0F172A]">
                {EN_MONTHS[month]}
              </span>
              <select value={year} onChange={(e) => setViewDate(new Date(Number(e.target.value), month, 1))} className="text-[11px] font-bold text-[#0F172A] border border-gray-200 rounded px-1 py-0.5 outline-none">
                {yearOptions.map((y) => (<option key={y} value={y}>
                    {y}
                  </option>))}
              </select>
            </div>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
              <ChevronRight size={14}/>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (<span key={i} className="text-[10px] text-center font-semibold text-gray-400">
                {d}
              </span>))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (<span key={`empty-${i}`}/>))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const thisDate = new Date(year, month, day);
                const selected = value && isSameDay(value, thisDate);
                const isFuture = thisDate > new Date();
                return (<button key={day} type="button" disabled={isFuture} onClick={() => {
                        onPick(thisDate);
                        setOpen(false);
                    }} className={`text-[11px] rounded-md py-1 transition-colors ${selected
                        ? "bg-indigo-600 text-white font-bold"
                        : isFuture
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#0F172A] hover:bg-indigo-50"}`}>
                  {day}
                </button>);
            })}
          </div>
        </div>)}
    </div>);
}
function MonthYearPicker({ month, year, onPick, placeholder, }: {
    month: number | null;
    year: number | null;
    onPick: (month: number, year: number) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState<number>(year ?? new Date().getFullYear());
    const rootRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (year !== null)
            setViewYear(year);
    }, [year]);
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    const display = month !== null && year !== null ? `${BN_MONTHS[month]}, ${toBn(year)}` : "";
    return (<div ref={rootRef} className="relative">
      <div onClick={() => setOpen((o) => !o)} className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer focus-within:border-indigo-500">
        <CalendarIcon size={13} className="text-gray-400 shrink-0"/>
        {display ? (<span className="flex-1 text-[#0F172A] font-semibold">{display}</span>) : (<span className="flex-1 text-gray-400">{placeholder}</span>)}
      </div>

      {open && (<div className="absolute z-20 mt-1 right-0 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setViewYear((y) => y - 1)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
              <ChevronLeft size={14}/>
            </button>
            <span className="text-xs font-bold text-[#0F172A]">{viewYear}</span>
            <button type="button" onClick={() => setViewYear((y) => y + 1)} disabled={viewYear >= new Date().getFullYear()} className="p-1 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-30">
              <ChevronRight size={14}/>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {BN_MONTHS.map((m, i) => {
                const disabled = viewYear === new Date().getFullYear() &&
                    i > new Date().getMonth();
                const selected = month === i && year === viewYear;
                return (<button key={m} type="button" disabled={disabled} onClick={() => {
                        onPick(i, viewYear);
                        setOpen(false);
                    }} className={`text-[10.5px] rounded-md py-1.5 px-1 transition-colors ${selected
                        ? "bg-indigo-600 text-white font-bold"
                        : disabled
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#0F172A] hover:bg-indigo-50"}`}>
                  {m}
                </button>);
            })}
          </div>
        </div>)}
    </div>);
}
function AgeWarningModal({ age, turns18On, onFixDate, onContinue, }: {
    age: number;
    turns18On: Date;
    onFixDate: () => void;
    onContinue: () => void;
}) {
    return (<div className="print-hide fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
        <button onClick={onFixDate} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={16}/>
        </button>
        <div className="w-11 h-11 mx-auto rounded-full bg-[#E2E8F0] text-[#2563EB] flex items-center justify-center mb-3">
          <AlertTriangle size={20}/>
        </div>
        <h3 className="text-sm font-bold text-[#0F172A] text-center"><T>{"Age "}</T>{age}<T>{"\u2014 not yet 18\n        "}</T></h3>
        <p className="text-xs text-gray-500 text-center mt-1"><T>{"The electoral roll requires an age of at least 18.\n        "}</T></p>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mt-4 text-left text-[11px] text-gray-600 space-y-1.5 leading-relaxed">
          <p><T>{"\u2022 But under 18 the name is not added to the voter list \u2014 the office\n            may return this form.\n          "}</T></p>
          <p className="text-[#2563EB] font-bold"><T>{"\u2022 Turns 18 on: "}</T>{formatDateEn(turns18On)}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={onFixDate} className="flex-1 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"><T>{"Fix the date\n          "}</T></button>
          <button onClick={onContinue} className="flex-1 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#2563EB] rounded-xl transition-colors"><T>{"Continue anyway\n          "}</T></button>
        </div>
      </div>
    </div>);
}
export default function VoterMigrationForm() {
    const { L } = useSohozI18n();
    const router = useRouter();
    const [regDistrict, setRegDistrict] = useState("");
    const [regUpazila, setRegUpazila] = useState("");
    const [applicantName, setApplicantName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [dob, setDob] = useState<Date | null>(null);
    const [pendingDob, setPendingDob] = useState<Date | null>(null);
    const [voterNumber, setVoterNumber] = useState("");
    const [voterAreaName, setVoterAreaName] = useState("");
    const [voterAreaCode, setVoterAreaCode] = useState("");
    const [currentDistrict, setCurrentDistrict] = useState("");
    const [currentUpazila, setCurrentUpazila] = useState("");
    const [currentVillage, setCurrentVillage] = useState("");
    const [currentHouseNo, setCurrentHouseNo] = useState("");
    const [newDistrict, setNewDistrict] = useState("");
    const [newUpazila, setNewUpazila] = useState("");
    const [newCityCorp, setNewCityCorp] = useState("");
    const [newWardNo, setNewWardNo] = useState("");
    const [newAreaName, setNewAreaName] = useState("");
    const [newAreaCode, setNewAreaCode] = useState("");
    const [newVillage, setNewVillage] = useState("");
    const [newHouseNo, setNewHouseNo] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newPostOffice, setNewPostOffice] = useState("");
    const [newPostalCode, setNewPostalCode] = useState("");
    const [residingMonth, setResidingMonth] = useState<number | null>(null);
    const [residingYear, setResidingYear] = useState<number | null>(null);
    const [migrationReason, setMigrationReason] = useState("");
    const [identifierName, setIdentifierName] = useState("");
    const [identifierNid, setIdentifierNid] = useState("");
    const [identifierAddress, setIdentifierAddress] = useState("");
    const [isFavorite, setIsFavorite] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);
    const [zoom, setZoom] = useState(100);
    const [activePage, setActivePage] = useState<1 | 2>(1);
    const [pageMenuOpen, setPageMenuOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState<"print" | "download" | null>(null);
    const [usageCount, setUsageCount] = useState(0);
    const [toast, setToast] = useState<string | null>(null);
    const previewScrollRef = useRef<HTMLDivElement>(null);
    const page1Ref = useRef<HTMLDivElement>(null);
    const page2Ref = useRef<HTMLDivElement>(null);
    const isPanningRef = useRef(false);
    const panStartRef = useRef({
        x: 0,
        y: 0,
        scrollLeft: 0,
        scrollTop: 0,
    });
    const [isPanning, setIsPanning] = useState(false);
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(USAGE_KEY);
            if (raw)
                setUsageCount(Number(raw) || 0);
        }
        catch {
            // Ignore storage errors.
        }
    }, []);
    useEffect(() => {
        if (!toast)
            return;
        const t = window.setTimeout(() => setToast(null), 2800);
        return () => window.clearTimeout(t);
    }, [toast]);
    useEffect(() => {
        const container = previewScrollRef.current;
        const p1 = page1Ref.current;
        const p2 = page2Ref.current;
        if (!container || !p1 || !p2)
            return;
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((e) => e.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible)
                return;
            setActivePage(visible.target === p2 ? 2 : 1);
        }, { root: container, threshold: [0.3, 0.6, 0.9] });
        observer.observe(p1);
        observer.observe(p2);
        return () => observer.disconnect();
    }, []);
    const regUpazilaOptions = useMemo(() => upazilasForDistrict(regDistrict), [regDistrict]);
    const currentUpazilaOptions = useMemo(() => upazilasForDistrict(currentDistrict), [currentDistrict]);
    const newUpazilaOptions = useMemo(() => upazilasForDistrict(newDistrict), [newDistrict]);
    const regDistrictBn = districtBnById(regDistrict);
    const regUpazilaBn = upazilaBnById(regUpazila);
    const currentDistrictBn = districtBnById(currentDistrict);
    const currentUpazilaBn = upazilaBnById(currentUpazila);
    const newDistrictBn = districtBnById(newDistrict);
    const newUpazilaBn = upazilaBnById(newUpazila);
    const residingDateLabel = residingMonth !== null && residingYear !== null
        ? `${BN_MONTHS[residingMonth]}, ${toBn(residingYear)}`
        : "";
    const phoneValid = /^01[3-9]\d{8}$/.test(newPhone);
    const requiredFields = [
        regDistrict,
        regUpazila,
        applicantName,
        nationalId,
        dob ? "x" : "",
        newDistrict,
        newUpazila,
        phoneValid ? newPhone : "",
        residingDateLabel,
        migrationReason,
    ];
    const filledRequired = requiredFields.filter((v) => v.trim() !== "").length;
    const anyFieldFilled = filledRequired > 0 ||
        [
            newPhone,
            voterNumber,
            voterAreaName,
            voterAreaCode,
            currentDistrict,
            currentUpazila,
            currentVillage,
            currentHouseNo,
            newCityCorp,
            newWardNo,
            newAreaName,
            newAreaCode,
            newVillage,
            newHouseNo,
            newPostOffice,
            newPostalCode,
            identifierName,
            identifierNid,
            identifierAddress,
        ].some((v) => v.trim() !== "");
    const isComplete = filledRequired === requiredFields.length;
    // Live preview sizing: "100%" always means "fit the panel width".
    const [previewWidth, setPreviewWidth] = useState(680);
    useEffect(() => {
        ensurePaperFont();
    }, []);
    useEffect(() => {
        const el = previewScrollRef.current;
        if (!el)
            return;
        const update = () => setPreviewWidth(el.clientWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const previewScale = Math.min(1, Math.max(0.3, (previewWidth - 16) / PAGE_W_PX)) * (zoom / 100);
    function handleDobPick(d: Date | null) {
        if (!d) {
            setDob(null);
            return;
        }
        const age = calcAge(d);
        if (age < 18)
            setPendingDob(d);
        else
            setDob(d);
    }
    function currentFormState(): FormState {
        return {
            regDistrict,
            regUpazila,
            applicantName,
            nationalId,
            dobISO: dob ? toLocalISODate(dob) : null,
            voterNumber,
            voterAreaName,
            voterAreaCode,
            currentDistrict,
            currentUpazila,
            currentVillage,
            currentHouseNo,
            newDistrict,
            newUpazila,
            newCityCorp,
            newWardNo,
            newAreaName,
            newAreaCode,
            newVillage,
            newHouseNo,
            newPhone,
            newPostOffice,
            newPostalCode,
            residingMonth,
            residingYear,
            migrationReason,
            identifierName,
            identifierNid,
            identifierAddress,
        };
    }
    function applyFormState(input: Partial<FormState>) {
        const s: FormState = { ...EMPTY_STATE, ...input };
        setRegDistrict(s.regDistrict);
        setRegUpazila(s.regUpazila);
        setApplicantName(s.applicantName);
        setNationalId(s.nationalId);
        setDob(parseStoredDate(s.dobISO));
        setVoterNumber(s.voterNumber);
        setVoterAreaName(s.voterAreaName);
        setVoterAreaCode(s.voterAreaCode);
        setCurrentDistrict(s.currentDistrict);
        setCurrentUpazila(s.currentUpazila);
        setCurrentVillage(s.currentVillage);
        setCurrentHouseNo(s.currentHouseNo);
        setNewDistrict(s.newDistrict);
        setNewUpazila(s.newUpazila);
        setNewCityCorp(s.newCityCorp);
        setNewWardNo(s.newWardNo);
        setNewAreaName(s.newAreaName);
        setNewAreaCode(s.newAreaCode);
        setNewVillage(s.newVillage);
        setNewHouseNo(s.newHouseNo);
        setNewPhone(s.newPhone);
        setNewPostOffice(s.newPostOffice);
        setNewPostalCode(s.newPostalCode);
        setResidingMonth(s.residingMonth);
        setResidingYear(s.residingYear);
        setMigrationReason(s.migrationReason);
        setIdentifierName(s.identifierName);
        setIdentifierNid(s.identifierNid);
        setIdentifierAddress(s.identifierAddress);
    }
    function saveLastApplication() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentFormState()));
        }
        catch {
            // Ignore storage errors.
        }
    }
    function bumpUsageCount() {
        try {
            const current = Number(window.localStorage.getItem(USAGE_KEY)) || 0;
            const next = current + 1;
            window.localStorage.setItem(USAGE_KEY, String(next));
            setUsageCount(next);
        }
        catch {
            // Ignore storage errors.
        }
    }
    function handleRestoreLastApplication() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                setToast("No saved application found yet.");
                return;
            }
            const parsed = JSON.parse(raw) as Partial<FormState>;
            if (!parsed || typeof parsed !== "object")
                throw new Error("bad data");
            setPendingDob(null);
            applyFormState(parsed);
            setToast("Last application restored.");
        }
        catch {
            setToast("Couldn't restore the last application.");
        }
    }
    function handleClear() {
        setPendingDob(null);
        applyFormState(EMPTY_STATE);
        setToast("Form cleared.");
    }
    function collectPagesHtml(): string[] | null {
        if (!page1Ref.current || !page2Ref.current)
            return null;
        return [page1Ref.current.outerHTML, page2Ref.current.outerHTML];
    }
    // Renders the two A4 pages inside an isolated, off-screen iframe that only
    // carries the paper CSS + the Bengali web font. Print and PDF both use it,
    // so neither depends on app styles, zoom transforms or scrollbars.
    async function createPaperFrame(pages: string[]): Promise<HTMLIFrameElement> {
        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.tabIndex = -1;
        Object.assign(frame.style, {
            position: "fixed",
            left: "-10000px",
            top: "0",
            width: "210mm",
            height: "297mm",
            border: "0",
            pointerEvents: "none",
        });
        const loaded = new Promise<void>((resolve) => {
            frame.onload = () => resolve();
        });
        frame.srcdoc = buildPaperDocument(pages);
        document.body.appendChild(frame);
        await withTimeout(loaded, 10000);
        const doc = frame.contentDocument;
        if (doc?.fonts) {
            await withTimeout(Promise.all([
                doc.fonts.load('400 14px "Noto Serif Bengali"', "আবেদন"),
                doc.fonts.load('600 14px "Noto Serif Bengali"', "আবেদন"),
                doc.fonts.load('700 14px "Noto Serif Bengali"', "আবেদন"),
            ]).catch(() => undefined), 4000);
            await withTimeout(doc.fonts.ready, 4000);
        }
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        return frame;
    }
    async function handlePrint() {
        const pages = collectPagesHtml();
        if (!pages)
            return;
        setIsProcessing("print");
        saveLastApplication();
        let frame: HTMLIFrameElement | null = null;
        try {
            frame = await createPaperFrame(pages);
            const printFrame = frame;
            const win = printFrame.contentWindow;
            if (!win)
                throw new Error("Print frame unavailable");
            const cleanup = () => printFrame.remove();
            win.addEventListener("afterprint", () => window.setTimeout(cleanup, 500), { once: true });
            // Safety net for browsers that never fire afterprint.
            window.setTimeout(cleanup, 5 * 60 * 1000);
            win.focus();
            win.print();
            bumpUsageCount();
        }
        catch (err) {
            console.error(err);
            frame?.remove();
            // Last resort: print the page itself (see @media print rules below).
            window.print();
            bumpUsageCount();
        }
        finally {
            setIsProcessing(null);
        }
    }
    async function handleDownloadPdf() {
        const pages = collectPagesHtml();
        if (!pages)
            return;
        setIsProcessing("download");
        let frame: HTMLIFrameElement | null = null;
        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas"),
            ]);
            frame = await createPaperFrame(pages);
            const doc = frame.contentDocument;
            const sheets = doc
                ? Array.from(doc.querySelectorAll<HTMLElement>(".f13-page"))
                : [];
            if (sheets.length !== 2)
                throw new Error("Form pages not found");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });
            for (let i = 0; i < sheets.length; i++) {
                const el = sheets[i];
                const canvas = await html2canvas(el, {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    windowWidth: el.offsetWidth,
                    windowHeight: el.offsetHeight,
                    scrollX: 0,
                    scrollY: 0,
                });
                if (i > 0)
                    pdf.addPage("a4", "portrait");
                // Each page is a full-bleed A4 image: 210 x 297 mm, no extra margin
                // (the 15mm margins are already part of the page design).
                pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297, undefined, "FAST");
            }
            const safeName = applicantName
                .trim()
                .replace(new RegExp("[^\\p{L}\\p{M}\\p{N}\\s_-]", "gu"), "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();
            pdf.save(safeName ? `form-13-${safeName}.pdf` : "form-13-voter-migration.pdf");
            saveLastApplication();
            bumpUsageCount();
            setToast("PDF downloaded.");
        }
        catch (err) {
            console.error(err);
            setToast("Couldn't generate the PDF. Please try again.");
        }
        finally {
            frame?.remove();
            setIsProcessing(null);
        }
    }
    function handlePreviewPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (e.button !== 0)
            return;
        const container = previewScrollRef.current;
        if (!container)
            return;
        isPanningRef.current = true;
        setIsPanning(true);
        panStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
        };
        container.setPointerCapture(e.pointerId);
        e.preventDefault();
    }
    function handlePreviewPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!isPanningRef.current)
            return;
        const container = previewScrollRef.current;
        if (!container)
            return;
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        container.scrollLeft = panStartRef.current.scrollLeft - dx;
        container.scrollTop = panStartRef.current.scrollTop - dy;
        e.preventDefault();
    }
    function stopPreviewPan(e?: React.PointerEvent<HTMLDivElement>) {
        const container = previewScrollRef.current;
        if (e && container?.hasPointerCapture(e.pointerId)) {
            container.releasePointerCapture(e.pointerId);
        }
        isPanningRef.current = false;
        setIsPanning(false);
    }
    function scrollToPage(page: 1 | 2) {
        previewScrollRef.current?.scrollTo({
            top: page === 1 ? 0 : (PAGE_H_PX + PAGE_GAP_PX) * previewScale,
            behavior: "smooth",
        });
        setPageMenuOpen(false);
    }
    const phoneHint = newPhone && !phoneValid
        ? `Must be 11 digits starting with 01 (${newPhone.length}/11)`
        : undefined;
    const postalHint = newPostalCode && newPostalCode.length !== 4
        ? "Post code must be 4 digits"
        : undefined;
    return (<div className="voter-migration-root w-full text-[#0F172A] font-sans pb-16">
      <style>{`
        ${PAPER_CSS}

        .f13-sheet {
          width: 210mm;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18),
            0 8px 24px rgba(15, 23, 42, 0.08);
        }

        /* Fallback only: used if the isolated print frame can't be created. */
        @media print {
          @page { size: A4 portrait; margin: 0; }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-hide { display: none !important; }

          .voter-migration-root,
          .print-workspace,
          .print-preview-column,
          .print-preview-shell,
          .print-preview-scroll {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            max-width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .print-scale-wrap {
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
          }

          #voter-migration-print-area {
            width: 210mm !important;
            transform: none !important;
          }

          .f13-sheet {
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }

          .f13-sheet:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .f13-page { height: 296mm !important; }
        }
      `}</style>

      {pendingDob && (<AgeWarningModal age={calcAge(pendingDob)} turns18On={dateTurning18(pendingDob)} onFixDate={() => setPendingDob(null)} onContinue={() => {
                setDob(pendingDob);
                setPendingDob(null);
            }}/>)}

      {toast && (<div className="print-hide fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400"/>
          {toast}
        </div>)}

      <div className="w-full space-y-6">
        <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button onClick={() => router.back()} className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-[#0F172A] flex items-center justify-center -ml-1" title={L("Go back")}>
                <ArrowLeft size={16}/>
              </button>
              <Link href="/sohoj-tools" className="hover:text-[#0F172A]"><T>{"Sohoj Tools\n              "}</T></Link>
              <span><T>{"/"}</T></span>
              <span className="hover:text-[#0F172A] cursor-pointer"><T>{"General Tools\n              "}</T></span>
              <span><T>{"/"}</T></span>
              <span className="text-[#0F172A] font-semibold"><T>{"Voter Migration Form\n              "}</T></span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <FileText size={18}/>
              </div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight"><T>{"Voter Migration Form\n              "}</T></h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full"><T>{"Free\n              "}</T></span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                <CheckCircle2 size={12} className="text-gray-300"/><T>{"Used "}</T>{toBn(usageCount)}<T>{"times\n              "}</T></span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1"><T>{"Fill in your details on the left \u2014 see a live Form-13 on the right\n              and download it as PDF.\n            "}</T></p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-all shadow-2xs">
              <Star size={16} className={isFavorite ? "fill-indigo-400 text-indigo-400" : ""}/>
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-[#0F172A] transition-all shadow-2xs">
              <Share size={16}/>
            </button>
          </div>
        </div>

        <div className="print-workspace grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="print-hide lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-3 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider"><T>{"Settings\n                "}</T></span>
                <span className="text-[11px] text-gray-400 font-medium"><T>{"Preview updates as you type.\n                "}</T></span>
              </div>

              <Section title={L("1. Recipient (election office)")}>
                <div className={GRID2}>
                  <Field label="District (election office)">
                    <GeoCombobox value={regDistrict} onChange={(id) => {
            setRegDistrict(id);
            setRegUpazila("");
        }} options={DISTRICTS} placeholder={L("District name")}/>
                  </Field>
                  <Field label="Upazila / thana (election office)">
                    <GeoCombobox value={regUpazila} onChange={setRegUpazila} options={regUpazilaOptions} placeholder={L("Upazila / thana name")}/>
                  </Field>
                </div>
              </Section>

              <Section title={L("2. Applicant details")}>
                <Field label="Applicant name">
                  <TextInput value={applicantName} onChange={setApplicantName} placeholder={L("Applicant name")}/>
                </Field>
                <div className={GRID2}>
                  <Field label="National ID (NID) number" counter={`${nationalId.length}/17`}>
                    <TextInput value={nationalId} onChange={(v) => setNationalId(digitsOnly(v, 17))} placeholder={L("National ID number")} inputMode="numeric" maxLength={34}/>
                  </Field>
                  <Field label="Date of birth">
                    <DobPicker value={dob} onPick={handleDobPick} placeholder={L("e.g. 01-01-1990")}/>
                  </Field>
                </div>
              </Section>

              <Section title={L("3. Current enrolment")}>
                <Field label="Voter number">
                  <TextInput value={voterNumber} onChange={setVoterNumber} placeholder={L("Current voter number")} inputMode="numeric"/>
                </Field>
                <div className={GRID2}>
                  <Field label="Voter area name">
                    <TextInput value={voterAreaName} onChange={setVoterAreaName} placeholder={L("Voter area name")}/>
                  </Field>
                  <Field label="Voter area code">
                    <TextInput value={voterAreaCode} onChange={setVoterAreaCode} placeholder={L("e.g. 0512")} inputMode="numeric"/>
                  </Field>
                </div>
                <div className={GRID2}>
                  <Field label="District">
                    <GeoCombobox value={currentDistrict} onChange={(id) => {
            setCurrentDistrict(id);
            setCurrentUpazila("");
        }} options={DISTRICTS} placeholder={L("District name")}/>
                  </Field>
                  <Field label="Upazila / thana">
                    <GeoCombobox value={currentUpazila} onChange={setCurrentUpazila} options={currentUpazilaOptions} placeholder={L("Upazila / thana name")}/>
                  </Field>
                </div>
                <div className={GRID2}>
                  <Field label="Village / road name and number">
                    <TextInput value={currentVillage} onChange={setCurrentVillage} placeholder={L("Village / road name")}/>
                  </Field>
                  <Field label="House / holding number">
                    <TextInput value={currentHouseNo} onChange={setCurrentHouseNo} placeholder={L("House / holding number")}/>
                  </Field>
                </div>
              </Section>

              <Section title={L("4. Area you want to move to")}>
                <div className={GRID2}>
                  <Field label="District (new)">
                    <GeoCombobox value={newDistrict} onChange={(id) => {
            setNewDistrict(id);
            setNewUpazila("");
        }} options={DISTRICTS} placeholder={L("District name")}/>
                  </Field>
                  <Field label="Upazila / Thana (new)">
                    <GeoCombobox value={newUpazila} onChange={setNewUpazila} options={newUpazilaOptions} placeholder={L("Upazila / thana name")}/>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 min-w-0">
                    <Field label="City corporation / municipality / union / cantonment board">
                      <TextInput value={newCityCorp} onChange={setNewCityCorp} placeholder={L("e.g. Union Parishad name")}/>
                    </Field>
                  </div>
                  <Field label="Ward number">
                    <TextInput value={newWardNo} onChange={setNewWardNo} placeholder={L("e.g. 05")}/>
                  </Field>
                </div>
                <div className={GRID2}>
                  <Field label="Voter area name (new)">
                    <TextInput value={newAreaName} onChange={setNewAreaName} placeholder={L("Voter area name")}/>
                  </Field>
                  <Field label="Voter area code (new)">
                    <TextInput value={newAreaCode} onChange={setNewAreaCode} placeholder={L("e.g. 0731")} inputMode="numeric"/>
                  </Field>
                </div>
                <div className={GRID2}>
                  <Field label="Village / road name and number (new)">
                    <TextInput value={newVillage} onChange={setNewVillage} placeholder={L("Village / road name")}/>
                  </Field>
                  <Field label="House / holding number (new)">
                    <TextInput value={newHouseNo} onChange={setNewHouseNo} placeholder={L("House / holding number")}/>
                  </Field>
                </div>
                <Field label="Mobile number" hint={phoneHint} counter={`${newPhone.length}/11`}>
                  <TextInput value={newPhone} onChange={(v) => setNewPhone(digitsOnly(v, 11))} placeholder={L("01783666743")} inputMode="tel" maxLength={22}/>
                </Field>
                <div className={GRID2}>
                  <Field label="Post office">
                    <TextInput value={newPostOffice} onChange={setNewPostOffice} placeholder={L("Post office name")}/>
                  </Field>
                  <Field label="Post code (4 digits)" hint={postalHint}>
                    <PostCodeBoxes value={newPostalCode} onChange={setNewPostalCode}/>
                  </Field>
                </div>
              </Section>

              <Section title={L("5. Residence period and reason")}>
                <div className={GRID2}>
                  <Field label="Living at the new address since">
                    <MonthYearPicker month={residingMonth} year={residingYear} onPick={(m, y) => {
            setResidingMonth(m);
            setResidingYear(y);
        }} placeholder={L("e.g. January 2023")}/>
                  </Field>
                  <Field label="Reason for migration">
                    <TextInput value={migrationReason} onChange={setMigrationReason} placeholder={L("e.g. Job / marriage")}/>
                  </Field>
                </div>
              </Section>

              <Section title={L("6. Identifier details (optional)")}>
                <div className={GRID2}>
                  <Field label="Identifier name">
                    <TextInput value={identifierName} onChange={setIdentifierName} placeholder={L("Identifier name")}/>
                  </Field>
                  <Field label="Identifier NID number" counter={`${identifierNid.length}/17`}>
                    <TextInput value={identifierNid} onChange={(v) => setIdentifierNid(digitsOnly(v, 17))} placeholder={L("Identifier NID number")} inputMode="numeric" maxLength={34}/>
                  </Field>
                </div>
                <Field label="Identifier address">
                  <TextInput value={identifierAddress} onChange={setIdentifierAddress} placeholder={L("Identifier address")}/>
                </Field>
              </Section>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={handlePrint} disabled={isProcessing !== null} className="w-full py-2 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {isProcessing === "print" ? (<Loader2 size={14} className="animate-spin"/>) : (<Printer size={14}/>)}
                  <span>
                    {isProcessing === "print" ? <T>{"Processing..."}</T> : <T>{"Print"}</T>}
                  </span>
                </button>
                <button onClick={handleClear} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5">
                  <RotateCcw size={14}/>
                  <span><T>{"Clear all"}</T></span>
                </button>
              </div>
            </div>
          </div>

          <div className="print-preview-column lg:col-span-7 lg:sticky lg:top-4 space-y-4">
            <div className="print-preview-shell bg-white border border-gray-200/80 rounded-2xl p-3 shadow-2xs">
              <div className="print-hide flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span><T>{"Live preview"}</T></span>
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
                    <button onClick={() => setZoom((z) => Math.max(60, z - 10))} className="p-1 hover:bg-white rounded-md text-gray-500" aria-label={L("Zoom out")}>
                      <Minus size={12}/>
                    </button>
                    <span className="text-[11px] font-bold text-gray-600 w-9 text-center">
                      {zoom}<T>{"%\n                    "}</T></span>
                    <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className="p-1 hover:bg-white rounded-md text-gray-500" aria-label={L("Zoom in")}>
                      <Plus size={12}/>
                    </button>
                  </div>
                  <div className="relative">
                    <button onClick={() => setPageMenuOpen((o) => !o)} className="text-[11px] font-semibold text-white bg-gray-900 px-2.5 py-1 rounded-md flex items-center gap-1"><T>{"Page "}</T>{activePage}<T>{"of 2\n                      "}</T><ChevronDown size={11}/>
                    </button>
                    {pageMenuOpen && (<div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                        <button onClick={() => scrollToPage(1)} className="w-full text-left px-3 py-1.5 text-[11px] text-[#0F172A] hover:bg-gray-50"><T>{"Page 1\n                        "}</T></button>
                        <button onClick={() => scrollToPage(2)} className="w-full text-left px-3 py-1.5 text-[11px] text-[#0F172A] hover:bg-gray-50"><T>{"Page 2\n                        "}</T></button>
                      </div>)}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {anyFieldFilled ? <T>{"Preview"}</T> : <T>{"Empty"}</T>}
                  </span>
                </div>
              </div>

              <div ref={previewScrollRef} className={`print-preview-scroll mt-3 max-h-[85vh] overflow-auto rounded-lg bg-gray-100/70 p-2 select-none ${isPanning ? "cursor-grabbing" : "cursor-grab"}`} onPointerDown={handlePreviewPointerDown} onPointerMove={handlePreviewPointerMove} onPointerUp={stopPreviewPan} onPointerCancel={stopPreviewPan} style={{ touchAction: "none" }}>
                <div className="print-scale-wrap" style={{
            width: PAGE_W_PX * previewScale,
            height: (PAGE_H_PX * 2 + PAGE_GAP_PX) * previewScale,
            margin: "0 auto",
        }}>
                  <div id="voter-migration-print-area" style={{
            width: PAGE_W_PX,
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
        }}>
                    {/* ------------------------- PAGE 1 ------------------------- */}
                    <div className="f13-sheet">
                      <div ref={page1Ref} className="f13-page">
                        <div className="f13-right"><T>{"\u09AB\u09B0\u09AE-\u09E7\u09E9"}</T></div>
                        <div className="f13-center"><T>{"[\u09AC\u09BF\u09A7\u09BF \u09E8\u09EC(\u09ED) \u09A6\u09CD\u09B0\u09B7\u09CD\u099F\u09AC\u09CD\u09AF]"}</T></div>
                        <div className="f13-title"><T>{"\u098F\u0995 \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE \u09B9\u0987\u09A4\u09C7 \u0985\u09A8\u09CD\u09AF \u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09AF\u09BC \u09AD\u09CB\u099F\u09BE\u09B0\n                          \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0986\u09AC\u09C7\u09A6\u09A8\n                        "}</T></div>

                        <div className="f13-sec">
                          <p className="f13-h"><T>{"\u09AC\u09B0\u09BE\u09AC\u09B0,"}</T></p>
                          <p className="f13-h"><T>{"\u0989\u09AA\u099C\u09C7\u09B2\u09BE/\u09A5\u09BE\u09A8\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0985\u09AB\u09BF\u09B8\u09BE\u09B0"}</T></p>
                          <div className="f13-cols" style={{ width: "62%" }}>
                            <P13Field label="উপজেলা/থানাঃ" value={regUpazilaBn}/>
                          </div>
                          <div className="f13-cols" style={{ width: "62%" }}>
                            <P13Field label="জেলাঃ" value={regDistrictBn}/>
                          </div>
                        </div>

                        <div className="f13-row f13-sec">
                          <span className="f13-num"><T>{"\u09E7\u0964"}</T></span>
                          <div className="f13-body">
                            <div className="f13-cols">
                              <P13Field label="আবেদনকারীর নামঃ" value={applicantName} lblWidth={200}/>
                            </div>
                          </div>
                        </div>
                        <div className="f13-row">
                          <span className="f13-num"><T>{"\u09E8\u0964"}</T></span>
                          <div className="f13-body">
                            <div className="f13-cols">
                              <P13Field label="জাতীয় পরিচয়পত্র নম্বর (NID) :" value={toBn(nationalId)} lblWidth={200}/>
                            </div>
                            <p className="f13-note"><T>{"(\u099C\u09BE\u09A4\u09C0\u09AF\u09BC \u09AA\u09B0\u09BF\u099A\u09AF\u09BC\u09AA\u09A4\u09CD\u09B0\u09C7\u09B0 \u09AB\u099F\u09CB\u0995\u09AA\u09BF \u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BF\u09A4\u09C7 \u09B9\u0987\u09AC\u09C7)\n                            "}</T></p>
                          </div>
                        </div>
                        <div className="f13-row">
                          <span className="f13-num"><T>{"\u09E9\u0964"}</T></span>
                          <div className="f13-body">
                            <div className="f13-cols">
                              <P13Field label="জন্ম তারিখঃ" value={dob ? formatDateBn(dob) : ""} lblWidth={200}/>
                            </div>
                          </div>
                        </div>

                        <div className="f13-row f13-sec">
                          <span className="f13-num"><T>{"\u09EA\u0964"}</T></span>
                          <div className="f13-body f13-h"><T>{"\u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE\u09AD\u09C1\u0995\u09CD\u09A4\u09BF \u09B8\u0982\u0995\u09CD\u09B0\u09BE\u09A8\u09CD\u09A4 \u09A4\u09A5\u09CD\u09AF\u09BE\u09A6\u09BF-\n                          "}</T></div>
                        </div>
                        <div className="f13-sub">
                          <div className="f13-cols">
                            <P13Field label="ভোটার নম্বরঃ" value={toBn(voterNumber)}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="ভোটার এলাকার নামঃ" value={voterAreaName} grow={3}/>
                            <P13Field label="ভোটার এলাকার নম্বরঃ" value={toBn(voterAreaCode)} grow={2}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="উপজেলা/থানাঃ" value={currentUpazilaBn}/>
                            <P13Field label="জেলাঃ" value={currentDistrictBn}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="গ্রাম/রাস্তার নাম ও নম্বরঃ" value={toBn(currentVillage)} grow={3}/>
                            <P13Field label="বাসা/হোল্ডিং নম্বরঃ" value={toBn(currentHouseNo)} grow={2}/>
                          </div>
                        </div>

                        <div className="f13-row f13-sec">
                          <span className="f13-num"><T>{"\u09EB\u0964"}</T></span>
                          <div className="f13-body f13-h"><T>{"\u09AF\u09C7 \u098F\u09B2\u09BE\u0995\u09BE\u09AF\u09BC \u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09B0 \u09B9\u0987\u09A4\u09C7 \u0987\u099A\u09CD\u099B\u09C1\u0995-\n                          "}</T></div>
                        </div>
                        <div className="f13-sub">
                          <div className="f13-cols">
                            <P13Field label="জেলাঃ" value={newDistrictBn}/>
                            <P13Field label="উপজেলা/থানাঃ" value={newUpazilaBn}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="সিটি কর্পোরেশন/পৌরসভা/ইউনিয়ন/ক্যান্টঃ বোর্ডঃ" value={newCityCorp} grow={3}/>
                            <P13Field label="ওয়ার্ড নম্বরঃ" value={toBn(newWardNo)} grow={1}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="ভোটার এলাকার নামঃ" value={newAreaName} grow={3}/>
                            <P13Field label="ভোটার এলাকার নম্বরঃ" value={toBn(newAreaCode)} grow={2}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="গ্রাম/রাস্তার নাম ও নম্বরঃ" value={toBn(newVillage)} grow={3}/>
                            <P13Field label="বাসা/হোল্ডিং নম্বরঃ" value={toBn(newHouseNo)} grow={2}/>
                          </div>
                          <div className="f13-cols" style={{ width: "70%" }}>
                            <P13Field label="টেলিফোন/মোবাইল ফোন নম্বরঃ" value={toBn(newPhone)}/>
                          </div>
                          <div className="f13-cols">
                            <P13Field label="ডাকঘরঃ" value={newPostOffice} grow={3}/>
                            <div className="f13-fld" style={{ flex: "2 1 0px" }}>
                              <span className="f13-lbl"><T>{"\u09AA\u09CB\u09B8\u09CD\u099F \u0995\u09CB\u09A1\u0983"}</T></span>
                              <span className="f13-pc">
                                {Array.from({ length: 4 }).map((_, i) => (<span key={i} className="f13-pcb">
                                    {newPostalCode[i]
            ? toBn(newPostalCode[i])
            : <T>{""}</T>}
                                  </span>))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="f13-row f13-sec">
                          <span className="f13-num"><T>{"\u09EC\u0964"}</T></span>
                          <div className="f13-body f13-flow"><T>{"\u09EB \u09A8\u09AE\u09CD\u09AC\u09B0 \u0995\u09CD\u09B0\u09AE\u09BF\u0995\u09C7 \u09AC\u09B0\u09CD\u09A3\u09BF\u09A4 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE\u09AF\u09BC \u09AF\u09C7 \u09B8\u09AE\u09AF\u09BC \u09B9\u0987\u09A4\u09C7 \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8\n                            \u0995\u09B0\u09BF\u09A4\u09C7\u099B\u09C7\u09A8\u0983"}</T>{<T>{" "}</T>}
                            <P13Dots min={150}>{residingDateLabel}</P13Dots>
                          </div>
                        </div>
                        <div className="f13-row">
                          <span className="f13-num"><T>{"\u09ED\u0964"}</T></span>
                          <div className="f13-body f13-flow"><T>{"\u09B8\u09CD\u09A5\u09BE\u09A8\u09BE\u09A8\u09CD\u09A4\u09B0\u09C7\u09B0 \u0995\u09BE\u09B0\u09A3\u0983"}</T>{<T>{" "}</T>}
                            <P13Dots min={260}>{migrationReason}</P13Dots>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ------------------------- PAGE 2 ------------------------- */}
                    <div className="f13-sheet" style={{ marginTop: PAGE_GAP_PX }}>
                      <div ref={page2Ref} className="f13-page f13-p2">
                        <div>
                          <div className="f13-row" style={{ marginTop: 0 }}>
                            <span className="f13-num"><T>{"\u09EE\u0964"}</T></span>
                            <div className="f13-body"><T>{"\u09EB \u09A8\u09AE\u09CD\u09AC\u09B0 \u0995\u09CD\u09B0\u09AE\u09BF\u0995\u09C7 \u09AC\u09B0\u09CD\u09A3\u09BF\u09A4 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE\u09AF\u09BC \u0985\u09AC\u09B8\u09CD\u09A5\u09BE\u09A8\u09C7\u09B0 \u09B8\u09AE\u09B0\u09CD\u09A5\u09A8\u09C7\n                              \u09A8\u09BF\u09AE\u09CD\u09A8\u09C7\u09B0 \u09A6\u09B2\u09BF\u09B2\u09BE\u09A6\u09BF \u09B8\u0982\u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BF\u09A4\u09C7 \u09B9\u0987\u09AC\u09C7\u0983\n                            "}</T></div>
                          </div>
                          <p className="f13-item"><T>{"(\u0995) \u09AA\u09CD\u09B0\u09A5\u09AE \u09B6\u09CD\u09B0\u09C7\u09A3\u09C0\u09B0 \u0995\u09B0\u09CD\u09AE\u0995\u09B0\u09CD\u09A4\u09BE/ \u0995\u09CD\u09AF\u09BE\u09A8\u09CD\u099F\u09A8\u09AE\u09C7\u09A8\u09CD\u099F \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7\u09B0\n                            \u098F\u0995\u09CD\u09B8\u09BF\u0995\u09BF\u0989\u099F\u09BF\u09AD \u0985\u09AB\u09BF\u09B8\u09BE\u09B0/ \u09B8\u09BF\u099F\u09BF \u0995\u09B0\u09CD\u09AA\u09CB\u09B0\u09C7\u09B6\u09A8/\u09AA\u09CC\u09B0\u09B8\u09AD\u09BE\u09B0 \u09AE\u09C7\u09AF\u09BC\u09B0\n                            /\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1 \u0995\u09BE\u0989\u09A8\u09CD\u09B8\u09BF\u09B2\u09B0/\u0987\u0989\u09A8\u09BF\u09AF\u09BC\u09A8 \u09AA\u09B0\u09BF\u09B7\u09A6 \u099A\u09C7\u09AF\u09BC\u09BE\u09B0\u09AE\u09CD\u09AF\u09BE\u09A8 \u0995\u09B0\u09CD\u09A4\u09C3\u0995\n                            \u09AA\u09CD\u09B0\u09A6\u09A4\u09CD\u09A4 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09AF\u09BC\u09A8 \u09AA\u09A4\u09CD\u09B0\u0964\n                          "}</T></p>
                          <p className="f13-item"><T>{"(\u0996) \u0987\u0989\u099F\u09BF\u09B2\u09BF\u099F\u09BF \u09AC\u09BF\u09B2\u09C7\u09B0 \u0985\u09A8\u09C1\u09B2\u09BF\u09AA\u09BF (\u09AF\u09A6\u09BF \u09A5\u09BE\u0995\u09C7)\n                          "}</T></p>
                          <p className="f13-item"><T>{"(\u0997) \u09AC\u09BE\u09A1\u09BC\u09C0 \u09AD\u09BE\u09A1\u09BC\u09BE \u09B0\u09B6\u09BF\u09A6/\u099A\u09CC\u0995\u09BF\u09A6\u09BE\u09B0\u09C0 \u0995\u09B0 \u09B0\u09B6\u09BF\u09A6/\u09AA\u09CC\u09B0\u0995\u09B0\n                            \u09B0\u09B6\u09BF\u09A6/\u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF\n                          "}</T></p>

                          <div className="f13-sign">
                            <div><T>{"\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 \u09AC\u09BE \u099F\u09BF\u09AA\u09B8\u09B9\u09BF"}</T></div>
                          </div>

                          <div className="f13-sec">
                            <p className="f13-h"><T>{"\u0986\u09AC\u09C7\u09A6\u09A8\u0995\u09BE\u09B0\u09C0\u0995\u09C7 \u09B8\u09A8\u09BE\u0995\u09CD\u09A4\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0\u0983\n                            "}</T></p>
                            <div className="f13-cols" style={{ width: "88%" }}>
                              <P13Field label="নামঃ" value={identifierName} lblWidth={150}/>
                            </div>
                            <div className="f13-cols" style={{ width: "88%" }}>
                              <P13Field label="জাতীয় পরিচয়পত্র নম্বরঃ" value={toBn(identifierNid)} lblWidth={150}/>
                            </div>
                            <div className="f13-cols" style={{ width: "88%" }}>
                              <P13Field label="ঠিকানাঃ" value={identifierAddress} lblWidth={150}/>
                            </div>
                          </div>

                          <div className="f13-sec" style={{ marginTop: 30 }}>
                            <p className="f13-h f13-ul f13-center"><T>{"[\u0995\u09C7\u09AC\u09B2\u09AE\u09BE\u09A4\u09CD\u09B0 \u0985\u09AB\u09BF\u09B8\u09C7 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF]\n                            "}</T></p>
                            <p className="f13-flow" style={{ marginTop: 8, textAlign: "justify" }}><T>{"\u09A6\u09BE\u0996\u09BF\u09B2\u0995\u09C3\u09A4 \u09A6\u09B2\u09BF\u09B2\u09BE\u09A6\u09BF \u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE\u09A8\u09CD\u09A4\u09C7 "}</T><P13Dots min={190}/>{<T>{" "}</T>}<T>{"\u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u09AA\u09CD\u09B0\u09A3\u09C0\u09A4 \u09AD\u09CB\u099F\u09BE\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u09B9\u0987\u09A4\u09C7 \u09A8\u09BE\u09AE\n                              \u0995\u09B0\u09CD\u09A4\u09A8 \u098F\u09AC\u0982 "}</T><P13Dots min={190}/><T>{"\u09AD\u09CB\u099F\u09BE\u09B0 \u098F\u09B2\u09BE\u0995\u09BE\u09AF\u09BC \u09A8\u09BE\u09AE\n                              \u0985\u09A8\u09CD\u09A4\u09B0\u09CD\u09AD\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09BE \u09B9\u0987\u09B2\u0964\n                            "}</T></p>
                          </div>

                          <div className="f13-sign">
                            <div><T>{"\u0989\u09AA\u099C\u09C7\u09B2\u09BE/\u09A5\u09BE\u09A8\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09CD\u09AE\u0995\u09B0\u09CD\u09A4\u09BE"}</T></div>
                          </div>
                        </div>

                        <div className="f13-receipt">
                          <p className="f13-h f13-center"><T>{"\u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4\u09BF\u09B8\u09CD\u09AC\u09C0\u0995\u09BE\u09B0 \u09AA\u09A4\u09CD\u09B0\n                          "}</T></p>
                          <p className="f13-flow" style={{ marginTop: 6 }}><T>{"\u099C\u09A8\u09BE\u09AC/\u09AC\u09C7\u0997\u09AE"}</T>{<T>{" "}</T>}
                            <P13Dots min={220}>{applicantName}</P13Dots><T>{"\u098F\u09B0\n                            \u0986\u09AC\u09C7\u09A6\u09A8 \u09AB\u09B0\u09AE \u0997\u09C3\u09B9\u09C0\u09A4 \u09B9\u0987\u09B2\u0964\n                          "}</T></p>
                          <p className="f13-flow"><T>{"\u0986\u09AC\u09C7\u09A6\u09A8 \u09AB\u09B0\u09AE \u09A8\u09AE\u09CD\u09AC\u09B0\u0983 "}</T><P13Dots min={180}/>
                          </p>
                          <div className="f13-sign" style={{ marginTop: 34 }}>
                            <div><T>{"\u0997\u09CD\u09B0\u09B9\u09A3\u0995\u09BE\u09B0\u09C0\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0"}</T></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-hide bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isComplete
            ? "bg-emerald-500"
            : anyFieldFilled
                ? "bg-[#2563EB]"
                : "bg-indigo-500"}`}></span>
            <span>
              {isComplete
        ? <T>{"Form complete — download or print your application."}</T> : anyFieldFilled
        ? `${toBn(filledRequired)}/${toBn(requiredFields.length)} required fields completed`
        : "Add an input to get started"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <button onClick={handleClear} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0F172A] text-xs font-bold rounded-xl transition-colors"><T>{"Clear all\n            "}</T></button>
            <button onClick={handleRestoreLastApplication} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#0F172A] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
              <RefreshCw size={13}/>
              <span><T>{"Restore last application"}</T></span>
            </button>
            <button onClick={handlePrint} disabled={isProcessing !== null} className="px-5 py-2 bg-white hover:bg-gray-50 text-[#0F172A] border border-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60">
              {isProcessing === "print" ? (<Loader2 size={14} className="animate-spin"/>) : (<Printer size={14}/>)}
              <span>
                {isProcessing === "print" ? <T>{"Processing..."}</T> : <T>{"Print"}</T>}
              </span>
            </button>
            <button onClick={handleDownloadPdf} disabled={isProcessing !== null} className="px-5 py-2 bg-[#2563EB] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60">
              {isProcessing === "download" ? (<Loader2 size={14} className="animate-spin"/>) : (<Download size={14}/>)}
              <span>
                {isProcessing === "download" ? <T>{"Processing..."}</T> : <T>{"Download PDF"}</T>}
              </span>
            </button>
          </div>
        </div>

        <div className="print-hide bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide"><T>{"Important Information and Instructions:\n          "}</T></h3>
          <p className="text-xs text-[#0F172A] font-medium"><T>{"Attach the following documents with the application:\n          "}</T></p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li><T>{"A photocopy of the National ID (NID) must be attached."}</T></li>
            <li><T>{"A certificate from a first-class officer / mayor / councillor /\n              union chairman proving you live at the new address.\n            "}</T></li>
            <li><T>{"A copy of a utility bill (if available)."}</T></li>
            <li><T>{"House rent receipt / chowkidari tax receipt / municipal tax\n              receipt or other proof.\n            "}</T></li>
          </ul>
          <p className="text-[11px] font-bold text-red-600 pt-1"><T>{"Fill in every field accurately. Wrong information can get the\n            application rejected.\n          "}</T></p>
          <p className="text-[11px] font-medium text-gray-600"><T>{"Print the completed Form-13, sign it, and submit it to your upazila\n            / thana election office.\n          "}</T></p>
          <p className="text-[11px] font-medium text-gray-600"><T>{"You do not need a broker or any payment to migrate your vote \u2014 this\n            service is free of charge.\n          "}</T></p>
        </div>

        <div className="print-hide bg-indigo-50/60 border border-indigo-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0"/>
          <span><T>{"Your files are processed in the browser \u2014 they are not uploaded to\n            any server.\n          "}</T></span>
        </div>

        <div className="print-hide bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button onClick={() => setShowHowToUse(!showHowToUse)} className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-[#0F172A] hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span><T>{"How to use"}</T></span>
            </div>
            {showHowToUse ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>

          {showHowToUse && (<div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p><T>{"1. Fill in your personal details, election office name, current\n                and new address on the left panel.\n              "}</T></p>
              <p><T>{"2. Watch the official Form-13 update live on the right panel.\n              "}</T></p>
              <p><T>{"3. Print or download the 2-page form as a PDF to submit."}</T></p>
            </div>)}
        </div>

        <div className="print-hide pt-4 space-y-3">
          <h2 className="text-sm font-bold text-[#0F172A] tracking-tight"><T>{"Tools in the same category\n          "}</T></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
            const ToolIcon = tool.icon;
            return (<Link key={idx} href={tool.href} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <ToolIcon size={18}/>
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] mb-1 group-hover:text-indigo-600 transition-colors">
                      {<T>{tool.title}</T>}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {<T>{tool.description}</T>}
                    </p>
                  </div>
                </Link>);
        })}
          </div>
        </div>
      </div>
    </div>);
}
