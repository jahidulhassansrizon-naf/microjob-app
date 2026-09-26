"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  FileText,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCcw,
  RefreshCw,
  Download,
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
  Loader2,
  Minus,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  DISTRICTS,
  upazilasForDistrict,
  districtBnById,
  upazilaBnById,
} from "./bd-geo-data";

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

// Print-only typography. The on-screen preview keeps its existing sizing,
// while printed output gets a modest size increase for clearer Bengali text.
const PRINT_TYPOGRAPHY_CSS = `
  .print-page.print-output-page {
    font-size: 12.5px !important;
    line-height: 1.6 !important;
    text-rendering: geometricPrecision !important;
  }

  .print-page.print-output-page [class~="text-[9px]"] {
    font-size: 10.5px !important;
    line-height: 1.5 !important;
  }

  .print-page.print-output-page [class~="text-[10px]"] {
    font-size: 11.75px !important;
    line-height: 1.55 !important;
  }

  .print-page.print-output-page [class~="text-[11px]"] {
    font-size: 12.5px !important;
    line-height: 1.6 !important;
  }

  .print-page.print-output-page [class~="text-xs"] {
    font-size: 13px !important;
    line-height: 1.55 !important;
  }
`;

const relatedTools = [
  {
    title: "Family Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/family-card-form",
    icon: CreditCard,
  },
  {
    title: "Allowance Application Tracking",
    description:
      "Check status of Department of Social Services allowance application status, — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/allowance-application-tracking",
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
  return `${toBn(pad2(date.getDate()))}-${toBn(
    pad2(date.getMonth() + 1),
  )}-${toBn(date.getFullYear())}`;
}

function formatDateEn(date: Date): string {
  return `${pad2(date.getDate())}-${pad2(
    date.getMonth() + 1,
  )}-${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function calcAge(dob: Date, ref: Date = new Date()): number {
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
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

function GeoCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
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
    if (!q) return options;
    return options.filter((o) => o.bn.includes(q));
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
          disabled
            ? "border-gray-100 bg-gray-50 cursor-not-allowed"
            : "border-gray-200 cursor-text focus-within:border-indigo-500"
        }`}
      >
        {selected ? (
          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-md pl-1.5 pr-1 py-0.5 font-semibold max-w-full">
            <span className="truncate">{selected.bn}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                  setQuery("");
                }}
                className="text-indigo-400 hover:text-indigo-700 shrink-0"
              >
                <X size={11} />
              </button>
            )}
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={selected ? "" : placeholder}
          className="flex-1 min-w-[2rem] outline-none bg-transparent text-xs text-gray-800 placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
        <ChevronDown
          size={13}
          className={`text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-gray-400 px-2 py-2 text-center">
              No results found
            </p>
          ) : (
            <div
              className={
                filtered.length > 12
                  ? "grid grid-cols-2 gap-x-2"
                  : "flex flex-col"
              }
            >
              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`text-left text-xs px-2 py-1.5 rounded-md hover:bg-indigo-50 transition-colors truncate ${
                    o.id === value
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {o.bn}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-600">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-red-500 font-medium">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      maxLength={maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
    />
  );
}

function DobPicker({
  value,
  onPick,
  placeholder,
}: {
  value: Date | null;
  onPick: (d: Date | null) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(value ?? new Date(1995, 0, 1));
  const rootRef = useRef<HTMLDivElement>(null);

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
  const yearOptions = useMemo(
    () =>
      Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i),
    [currentYear],
  );

  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer focus-within:border-indigo-500"
      >
        <CalendarIcon size={13} className="text-gray-400 shrink-0" />
        {value ? (
          <span className="flex-1 text-gray-800 font-semibold">
            {formatDateBn(value)}
          </span>
        ) : (
          <span className="flex-1 text-gray-400">{placeholder}</span>
        )}
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPick(null);
            }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-800">
                {EN_MONTHS[month]}
              </span>
              <select
                value={year}
                onChange={(e) =>
                  setViewDate(new Date(Number(e.target.value), month, 1))
                }
                className="text-[11px] font-bold text-gray-800 border border-gray-200 rounded px-1 py-0.5 outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span
                key={i}
                className="text-[10px] text-center font-semibold text-gray-400"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const thisDate = new Date(year, month, day);
              const selected = value && isSameDay(value, thisDate);
              const isFuture = thisDate > new Date();
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  onClick={() => {
                    onPick(thisDate);
                    setOpen(false);
                  }}
                  className={`text-[11px] rounded-md py-1 transition-colors ${
                    selected
                      ? "bg-indigo-600 text-white font-bold"
                      : isFuture
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-indigo-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthYearPicker({
  month,
  year,
  onPick,
  placeholder,
}: {
  month: number | null;
  year: number | null;
  onPick: (month: number, year: number) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(
    year ?? new Date().getFullYear(),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const display =
    month !== null && year !== null ? `${BN_MONTHS[month]}, ${toBn(year)}` : "";

  return (
    <div ref={rootRef} className="relative">
      <div
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer focus-within:border-indigo-500"
      >
        <CalendarIcon size={13} className="text-gray-400 shrink-0" />
        {display ? (
          <span className="flex-1 text-gray-800 font-semibold">{display}</span>
        ) : (
          <span className="flex-1 text-gray-400">{placeholder}</span>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 right-0 w-60 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-gray-800">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              disabled={viewYear >= new Date().getFullYear()}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-500 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {BN_MONTHS.map((m, i) => {
              const disabled =
                viewYear === new Date().getFullYear() &&
                i > new Date().getMonth();
              const selected = month === i && year === viewYear;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onPick(i, viewYear);
                    setOpen(false);
                  }}
                  className={`text-[10.5px] rounded-md py-1.5 px-1 transition-colors ${
                    selected
                      ? "bg-indigo-600 text-white font-bold"
                      : disabled
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-700 hover:bg-indigo-50"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AgeWarningModal({
  age,
  turns18On,
  onFixDate,
  onContinue,
}: {
  age: number;
  turns18On: Date;
  onFixDate: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="print-hide fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative">
        <button
          onClick={onFixDate}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        <div className="w-11 h-11 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
          <AlertTriangle size={20} />
        </div>
        <h3 className="text-sm font-bold text-gray-900 text-center">
          Age {age} — not yet 18
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1">
          The electoral roll requires an age of at least 18.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-4 text-left text-[11px] text-gray-600 space-y-1.5 leading-relaxed">
          <p>
            • But under 18 the name is not added to the voter list — the office
            may return this form.
          </p>
          <p className="text-amber-700 font-bold">
            • Turns 18 on: {formatDateEn(turns18On)}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={onFixDate}
            className="flex-1 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
          >
            Fix the date
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VoterMigrationForm() {
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
  const [isProcessing, setIsProcessing] = useState<"print" | "download" | null>(
    null,
  );
  const [usageCount, setUsageCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USAGE_KEY);
      if (raw) setUsageCount(Number(raw) || 0);
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const container = previewScrollRef.current;
    const p1 = page1Ref.current;
    const p2 = page2Ref.current;
    if (!container || !p1 || !p2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setActivePage(visible.target === p2 ? 2 : 1);
      },
      { root: container, threshold: [0.3, 0.6, 0.9] },
    );

    observer.observe(p1);
    observer.observe(p2);
    return () => observer.disconnect();
  }, []);

  const regUpazilaOptions = useMemo(
    () => upazilasForDistrict(regDistrict),
    [regDistrict],
  );
  const currentUpazilaOptions = useMemo(
    () => upazilasForDistrict(currentDistrict),
    [currentDistrict],
  );
  const newUpazilaOptions = useMemo(
    () => upazilasForDistrict(newDistrict),
    [newDistrict],
  );

  const regDistrictBn = districtBnById(regDistrict);
  const regUpazilaBn = upazilaBnById(regUpazila);
  const currentDistrictBn = districtBnById(currentDistrict);
  const currentUpazilaBn = upazilaBnById(currentUpazila);
  const newDistrictBn = districtBnById(newDistrict);
  const newUpazilaBn = upazilaBnById(newUpazila);

  const residingDateLabel =
    residingMonth !== null && residingYear !== null
      ? `${BN_MONTHS[residingMonth]}, ${toBn(residingYear)}`
      : "";

  const requiredFields = [
    regDistrict,
    regUpazila,
    applicantName,
    nationalId,
    dob ? "x" : "",
    newDistrict,
    newUpazila,
    newPhone,
    residingDateLabel,
    migrationReason,
  ];

  const filledRequired = requiredFields.filter((v) => v.trim() !== "").length;

  const anyFieldFilled =
    filledRequired > 0 ||
    [
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

  function handleDobPick(d: Date | null) {
    if (!d) {
      setDob(null);
      return;
    }
    const age = calcAge(d);
    if (age < 18) setPendingDob(d);
    else setDob(d);
  }

  function currentFormState(): FormState {
    return {
      regDistrict,
      regUpazila,
      applicantName,
      nationalId,
      dobISO: dob ? dob.toISOString() : null,
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

  function applyFormState(s: FormState) {
    setRegDistrict(s.regDistrict);
    setRegUpazila(s.regUpazila);
    setApplicantName(s.applicantName);
    setNationalId(s.nationalId);
    setDob(s.dobISO ? new Date(s.dobISO) : null);
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
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(currentFormState()),
      );
    } catch {
      // Ignore storage errors.
    }
  }

  function bumpUsageCount() {
    try {
      const next = usageCount + 1;
      window.localStorage.setItem(USAGE_KEY, String(next));
      setUsageCount(next);
    } catch {
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
      const parsed = JSON.parse(raw) as FormState;
      applyFormState(parsed);
      setToast("Last application restored.");
    } catch {
      setToast("Couldn't restore the last application.");
    }
  }

  function handleClear() {
    applyFormState(EMPTY_STATE);
  }

  async function waitForPrintAssets(doc: Document): Promise<void> {
    if (doc.fonts?.ready) {
      try {
        await doc.fonts.ready;
      } catch {
        // Font readiness is best-effort.
      }
    }

    const images = Array.from(doc.images);
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  }

  async function handlePrint() {
    if (!page1Ref.current || !page2Ref.current) return;

    setIsProcessing("print");
    saveLastApplication();

    const printWindow = window.open("", "_blank", "width=900,height=1200");

    if (!printWindow) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      window.print();
      bumpUsageCount();
      setIsProcessing(null);
      return;
    }

    const page1 = page1Ref.current.cloneNode(true) as HTMLDivElement;
    const page2 = page2Ref.current.cloneNode(true) as HTMLDivElement;

    page1.classList.remove("mt-6");
    page2.classList.remove("mt-6");
    page1.classList.add("print-output-page");
    page2.classList.add("print-output-page");

    const styleBlocks = Array.from(
      document.head.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
        'link[rel="stylesheet"], style',
      ),
    );

    const printStyles = `
      @page {
        size: A4 portrait;
        margin: 0;
      }

      html,
      body {
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box !important;
      }

      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #print-root {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      .print-page {
        box-sizing: border-box !important;
        width: 210mm !important;
        min-width: 210mm !important;
        max-width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 6mm !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        overflow: hidden !important;
        background: #ffffff !important;
        transform: none !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: page !important;
        page-break-after: always !important;
        position: relative !important;
      }

      .print-page:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      ${PRINT_TYPOGRAPHY_CSS}

      .print-page > div,
      .print-page p,
      .print-page .grid,
      .print-page span {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    `;

    printWindow.document.open();
    printWindow.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Form-13</title>`,
    );

    for (const styleNode of styleBlocks) {
      printWindow.document.head.appendChild(
        printWindow.document.importNode(styleNode, true),
      );
    }

    const styleElement = printWindow.document.createElement("style");
    styleElement.textContent = printStyles;
    printWindow.document.head.appendChild(styleElement);
    printWindow.document.write(
      `</head><body><main id="print-root"></main></body></html>`,
    );
    printWindow.document.close();

    printWindow.document.getElementById("print-root")?.append(page1, page2);

    await waitForPrintAssets(printWindow.document);

    printWindow.onafterprint = () => {
      printWindow.close();
    };

    printWindow.focus();
    printWindow.print();

    bumpUsageCount();
    setIsProcessing(null);
  }

  async function handleDownloadPdf() {
    if (!page1Ref.current || !page2Ref.current) return;

    setIsProcessing("download");

    let pdfHost: HTMLDivElement | null = null;
    let pdfTypographyStyle: HTMLStyleElement | null = null;

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      pdfHost = document.createElement("div");
      pdfHost.setAttribute("aria-hidden", "true");
      pdfHost.style.position = "fixed";
      pdfHost.style.left = "-100000px";
      pdfHost.style.top = "0";
      pdfHost.style.width = "210mm";
      pdfHost.style.margin = "0";
      pdfHost.style.padding = "0";
      pdfHost.style.background = "#ffffff";
      pdfHost.style.overflow = "visible";
      pdfHost.style.pointerEvents = "none";
      pdfHost.style.zIndex = "-1";

      const sourcePages = [page1Ref.current, page2Ref.current];
      const pdfPages = sourcePages.map((sourcePage) => {
        const clone = sourcePage.cloneNode(true) as HTMLDivElement;
        clone.classList.remove("mt-6");
        clone.classList.add("print-output-page");
        clone.style.width = "210mm";
        clone.style.minWidth = "210mm";
        clone.style.maxWidth = "210mm";
        clone.style.height = "297mm";
        clone.style.minHeight = "297mm";
        clone.style.maxHeight = "297mm";
        clone.style.margin = "0";
        clone.style.padding = "6mm";
        clone.style.boxSizing = "border-box";
        clone.style.overflow = "hidden";
        clone.style.transform = "none";
        clone.style.border = "0";
        clone.style.borderRadius = "0";
        clone.style.boxShadow = "none";
        clone.style.background = "#ffffff";
        clone.style.breakInside = "avoid";
        clone.style.pageBreakInside = "avoid";
        return clone;
      });

      pdfHost.append(...pdfPages);
      document.body.appendChild(pdfHost);

      // Reuse the same print-only typography for the downloaded PDF so its
      // text is as readable as the browser print output.
      pdfTypographyStyle = document.createElement("style");
      pdfTypographyStyle.setAttribute(
        "data-voter-migration-print-typography",
        "true",
      );
      pdfTypographyStyle.textContent = PRINT_TYPOGRAPHY_CSS;
      document.head.appendChild(pdfTypographyStyle);

      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Font readiness is best-effort.
        }
      }

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pdfPages.length; i++) {
        const canvas = await html2canvas(pdfPages[i], {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          width: pdfPages[i].scrollWidth,
          height: pdfPages[i].scrollHeight,
          windowWidth: pdfPages[i].scrollWidth,
          windowHeight: pdfPages[i].scrollHeight,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        if (i > 0) pdf.addPage("a4", "portrait");

        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          pageWidth,
          pageHeight,
          undefined,
          "FAST",
        );
      }

      const safeName = applicantName
        .trim()
        .replace(/[^a-zA-Z0-9\s-_]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      const fileName = safeName
        ? `form-13-${safeName}.pdf`
        : "form-13-voter-migration.pdf";

      pdf.save(fileName);
      saveLastApplication();
      bumpUsageCount();
      setToast("PDF downloaded.");
    } catch (err) {
      console.error(err);
      setToast("Couldn't generate the PDF. Please try again.");
    } finally {
      if (pdfTypographyStyle?.parentNode) {
        pdfTypographyStyle.parentNode.removeChild(pdfTypographyStyle);
      }
      if (pdfHost?.parentNode) pdfHost.parentNode.removeChild(pdfHost);
      setIsProcessing(null);
    }
  }

  function scrollToPage(page: 1 | 2) {
    const target = page === 1 ? page1Ref.current : page2Ref.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setPageMenuOpen(false);
  }

  const phoneHint =
    newPhone && !/^01[3-9]\d{8}$/.test(newPhone)
      ? "Should be 11 digits, starting with 01"
      : undefined;

  const postalHint =
    newPostalCode && !/^\d{4}$/.test(newPostalCode)
      ? "4 digit postal code"
      : undefined;

  return (
    <div className="voter-migration-root w-full text-gray-800 font-sans pb-16">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            box-sizing: border-box !important;
          }

          .print-hide {
            display: none !important;
            visibility: hidden !important;
          }

          .voter-migration-root > * {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          .voter-migration-root {
            display: block !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          .print-workspace {
            display: block !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .print-preview-column {
            display: block !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .print-preview-shell {
            display: block !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          .print-preview-scroll {
            display: block !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            height: auto !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          #voter-migration-print-area {
            display: block !important;
            position: static !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            transform: none !important;
            transform-origin: initial !important;
            background: #ffffff !important;
          }

          #voter-migration-print-area .print-page {
            box-sizing: border-box !important;
            display: block !important;
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 6mm !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: hidden !important;
            transform: none !important;
            position: relative !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            page-break-after: always !important;
          }

          #voter-migration-print-area .print-page + .print-page {
            margin-top: 0 !important;
          }

          #voter-migration-print-area .print-page:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }

          #voter-migration-print-area .print-page {
            font-size: 12.5px !important;
            line-height: 1.6 !important;
            text-rendering: geometricPrecision !important;
          }

          #voter-migration-print-area .print-page [class~="text-[9px]"] {
            font-size: 10.5px !important;
            line-height: 1.5 !important;
          }

          #voter-migration-print-area .print-page [class~="text-[10px]"] {
            font-size: 11.75px !important;
            line-height: 1.55 !important;
          }

          #voter-migration-print-area .print-page [class~="text-[11px]"] {
            font-size: 12.5px !important;
            line-height: 1.6 !important;
          }

          #voter-migration-print-area .print-page [class~="text-xs"] {
            font-size: 13px !important;
            line-height: 1.55 !important;
          }

          #voter-migration-print-area .print-page,
          #voter-migration-print-area .print-page * {
            visibility: visible !important;
          }

          #voter-migration-print-area .print-page > div,
          #voter-migration-print-area .print-page p,
          #voter-migration-print-area .print-page .grid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {pendingDob && (
        <AgeWarningModal
          age={calcAge(pendingDob)}
          turns18On={dateTurning18(pendingDob)}
          onFixDate={() => setPendingDob(null)}
          onContinue={() => {
            setDob(pendingDob);
            setPendingDob(null);
          }}
        />
      )}

      {toast && (
        <div className="print-hide fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="w-full space-y-6">
        <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                General Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                Voter Migration Form
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <FileText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Voter Migration Form
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                <CheckCircle2 size={12} className="text-gray-300" />
                Used {toBn(usageCount)} times
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Fill in your details on the left — see a live Form-13 on the right
              and download it as PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-indigo-400 text-indigo-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        <div className="print-workspace grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="print-hide lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Settings
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Fill in all fields. Preview updates as you type.
                </span>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  1. Recipient (election office)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="District (election office)">
                    <GeoCombobox
                      value={regDistrict}
                      onChange={(id) => {
                        setRegDistrict(id);
                        setRegUpazila("");
                      }}
                      options={DISTRICTS}
                      placeholder="District name"
                    />
                  </Field>
                  <Field label="Upazila / thana (election office)">
                    <GeoCombobox
                      value={regUpazila}
                      onChange={setRegUpazila}
                      options={regUpazilaOptions}
                      placeholder="Upazila / thana name"
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  2. Applicant details
                </h3>
                <Field label="Applicant name">
                  <TextInput
                    value={applicantName}
                    onChange={setApplicantName}
                    placeholder="Applicant name"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="National ID (NID) number">
                    <TextInput
                      value={nationalId}
                      onChange={(v) =>
                        setNationalId(v.replace(/[^\d]/g, "").slice(0, 17))
                      }
                      placeholder="National ID number"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Date of birth">
                    <DobPicker
                      value={dob}
                      onPick={handleDobPick}
                      placeholder="e.g. 01-01-1990"
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  3. Current enrolment
                </h3>
                <Field label="Voter number">
                  <TextInput
                    value={voterNumber}
                    onChange={setVoterNumber}
                    placeholder="Current voter number"
                    inputMode="numeric"
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Voter area name">
                    <TextInput
                      value={voterAreaName}
                      onChange={setVoterAreaName}
                      placeholder="Voter area name"
                    />
                  </Field>
                  <Field label="Voter area code">
                    <TextInput
                      value={voterAreaCode}
                      onChange={setVoterAreaCode}
                      placeholder="e.g. 0512"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="District">
                    <GeoCombobox
                      value={currentDistrict}
                      onChange={(id) => {
                        setCurrentDistrict(id);
                        setCurrentUpazila("");
                      }}
                      options={DISTRICTS}
                      placeholder="District name"
                    />
                  </Field>
                  <Field label="Upazila / thana">
                    <GeoCombobox
                      value={currentUpazila}
                      onChange={setCurrentUpazila}
                      options={currentUpazilaOptions}
                      placeholder="Upazila / thana name"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Village / road name and number">
                    <TextInput
                      value={currentVillage}
                      onChange={setCurrentVillage}
                      placeholder="Village / road name"
                    />
                  </Field>
                  <Field label="House / holding number">
                    <TextInput
                      value={currentHouseNo}
                      onChange={setCurrentHouseNo}
                      placeholder="House / holding number"
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  4. Area you want to move to
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="District (new)">
                    <GeoCombobox
                      value={newDistrict}
                      onChange={(id) => {
                        setNewDistrict(id);
                        setNewUpazila("");
                      }}
                      options={DISTRICTS}
                      placeholder="District name"
                    />
                  </Field>
                  <Field label="Upazila / Thana (new)">
                    <GeoCombobox
                      value={newUpazila}
                      onChange={setNewUpazila}
                      options={newUpazilaOptions}
                      placeholder="Upazila / thana name"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="City corporation / municipality / union / cantonment board">
                    <TextInput
                      value={newCityCorp}
                      onChange={setNewCityCorp}
                      placeholder="e.g. Union Parishad No."
                    />
                  </Field>
                  <Field label="Ward number">
                    <TextInput
                      value={newWardNo}
                      onChange={setNewWardNo}
                      placeholder="e.g. 05"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Voter area name (new)">
                    <TextInput
                      value={newAreaName}
                      onChange={setNewAreaName}
                      placeholder="Voter area name"
                    />
                  </Field>
                  <Field label="Voter area number (new)">
                    <TextInput
                      value={newAreaCode}
                      onChange={setNewAreaCode}
                      placeholder="e.g. 0731"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Village / road name and number (new)">
                    <TextInput
                      value={newVillage}
                      onChange={setNewVillage}
                      placeholder="Village / road name"
                    />
                  </Field>
                  <Field label="House / holding number (new)">
                    <TextInput
                      value={newHouseNo}
                      onChange={setNewHouseNo}
                      placeholder="House / holding number"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Telephone / mobile number" hint={phoneHint}>
                    <TextInput
                      value={newPhone}
                      onChange={(v) =>
                        setNewPhone(v.replace(/[^\d]/g, "").slice(0, 11))
                      }
                      placeholder="01712345678"
                      inputMode="tel"
                    />
                  </Field>
                  <Field label="Post office">
                    <TextInput
                      value={newPostOffice}
                      onChange={setNewPostOffice}
                      placeholder="Post office name"
                    />
                  </Field>
                </div>
                <Field label="Post code" hint={postalHint}>
                  <TextInput
                    value={newPostalCode}
                    onChange={(v) =>
                      setNewPostalCode(v.replace(/[^\d]/g, "").slice(0, 4))
                    }
                    placeholder="e.g. 1230"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  5. Residence period and reason
                </h3>
                <Field label="Living at the new address since">
                  <MonthYearPicker
                    month={residingMonth}
                    year={residingYear}
                    onPick={(m, y) => {
                      setResidingMonth(m);
                      setResidingYear(y);
                    }}
                    placeholder="e.g. since January 2023"
                  />
                </Field>
                <Field label="Reason for migration">
                  <TextInput
                    value={migrationReason}
                    onChange={setMigrationReason}
                    placeholder="e.g. Job / marriage / permanent residence"
                  />
                </Field>
              </div>

              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  6. Identifier details (optional)
                </h3>
                <Field label="Identifier name">
                  <TextInput
                    value={identifierName}
                    onChange={setIdentifierName}
                    placeholder="Identifier name"
                  />
                </Field>
                <Field label="Identifier NID number">
                  <TextInput
                    value={identifierNid}
                    onChange={(v) =>
                      setIdentifierNid(v.replace(/[^\d]/g, "").slice(0, 17))
                    }
                    placeholder="Identifier NID number"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Identifier address">
                  <TextInput
                    value={identifierAddress}
                    onChange={setIdentifierAddress}
                    placeholder="Identifier address"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  disabled={isProcessing !== null}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {isProcessing === "print" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Printer size={14} />
                  )}
                  <span>
                    {isProcessing === "print" ? "Processing..." : "Print"}
                  </span>
                </button>
                <button
                  onClick={handleClear}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>

          <div className="print-preview-column lg:col-span-7 space-y-4">
            <div className="print-preview-shell bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[900px]">
              <div>
                <div className="print-hide flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Live preview</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-0.5">
                      <button
                        onClick={() => setZoom((z) => Math.max(60, z - 10))}
                        className="p-1 hover:bg-white rounded-md text-gray-500"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-[11px] font-bold text-gray-600 w-9 text-center">
                        {zoom}%
                      </span>
                      <button
                        onClick={() => setZoom((z) => Math.min(150, z + 10))}
                        className="p-1 hover:bg-white rounded-md text-gray-500"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setPageMenuOpen((o) => !o)}
                        className="text-[11px] font-semibold text-white bg-gray-900 px-2.5 py-1 rounded-md flex items-center gap-1"
                      >
                        Page {activePage} of 2
                        <ChevronDown size={11} />
                      </button>
                      {pageMenuOpen && (
                        <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => scrollToPage(1)}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                          >
                            Page 1
                          </button>
                          <button
                            onClick={() => scrollToPage(2)}
                            className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                          >
                            Page 2
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                      {anyFieldFilled ? "Preview" : "Empty"}
                    </span>
                  </div>
                </div>

                <div
                  ref={previewScrollRef}
                  className="print-preview-scroll mt-4 max-h-[900px] overflow-y-auto"
                >
                  <div
                    id="voter-migration-print-area"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                    }}
                  >
                    <div
                      ref={page1Ref}
                      className="print-page bg-white border border-gray-300 rounded-lg p-6 shadow-sm text-gray-800 font-serif text-[11px] space-y-3 leading-relaxed relative"
                    >
                      <div className="text-right font-bold text-[10px]">
                        ফরম-১৩
                      </div>
                      <div className="text-center text-[10px]">
                        [বিধি ২৬(৭) দ্রষ্টব্য]
                      </div>
                      <div className="text-center font-bold text-xs">
                        এক ভোটার এলাকা হইতে অন্য ভোটার এলাকায় ভোটার
                        স্থানান্তরের আবেদন
                      </div>

                      <div className="space-y-1 pt-1">
                        <p className="font-bold">বরাবর,</p>
                        <p className="font-semibold">
                          উপজেলা/থানা নির্বাচন অফিসার
                        </p>
                        <p>
                          উপজেলা/থানাঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[120px]">
                            {regUpazilaBn}
                          </span>
                        </p>
                        <p>
                          জেলাঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[120px]">
                            {regDistrictBn}
                          </span>
                        </p>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">১।</span>
                          <span className="col-span-4 font-semibold">
                            আবেদনকারীর নামঃ
                          </span>
                          <span className="col-span-7 border-b border-dotted border-gray-400">
                            {applicantName}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">২।</span>
                          <span className="col-span-4 font-semibold">
                            জাতীয় পরিচয়পত্র নম্বর (NID) :
                          </span>
                          <span className="col-span-7 border-b border-dotted border-gray-400">
                            {nationalId}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500 pl-[8.5%]">
                          (জাতীয় পরিচয়পত্রের ফটোকপি সংযুক্ত করিতে হইবে)
                        </p>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">৩।</span>
                          <span className="col-span-4 font-semibold">
                            জন্ম তারিখঃ
                          </span>
                          <span className="col-span-7 border-b border-dotted border-gray-400">
                            {dob ? formatDateBn(dob) : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">৪।</span>
                          <span className="col-span-11 font-semibold">
                            বর্তমান তালিকাভুক্তি সংক্রান্ত তথ্যাদি-
                          </span>
                        </div>
                        <div className="pl-[8.5%] space-y-1.5">
                          <p>
                            ভোটার নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[160px]">
                              {voterNumber}
                            </span>
                          </p>
                          <p>
                            ভোটার এলাকার নামঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {voterAreaName}
                            </span>{" "}
                            ভোটার এলাকার নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[70px]">
                              {voterAreaCode}
                            </span>
                          </p>
                          <p>
                            উপজেলা/থানাঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {currentUpazilaBn}
                            </span>{" "}
                            জেলাঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {currentDistrictBn}
                            </span>
                          </p>
                          <p>
                            গ্রাম/রাস্তার নাম ও নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {currentVillage}
                            </span>{" "}
                            বাসা/হোল্ডিং নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[90px]">
                              {currentHouseNo}
                            </span>
                          </p>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">৫।</span>
                          <span className="col-span-11 font-semibold">
                            যে এলাকায় স্থানান্তর হইতে ইচ্ছুক-
                          </span>
                        </div>
                        <div className="pl-[8.5%] space-y-1.5">
                          <p>
                            জেলাঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {newDistrictBn}
                            </span>{" "}
                            উপজেলা/থানাঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {newUpazilaBn}
                            </span>
                          </p>
                          <p>
                            সিটি কর্পোরেশন/পৌরসভা/ইউনিয়ন/ক্যান্টঃ বোর্ডঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[90px]">
                              {newCityCorp}
                            </span>{" "}
                            ওয়ার্ড নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[50px]">
                              {newWardNo}
                            </span>
                          </p>
                          <p>
                            ভোটার এলাকার নামঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {newAreaName}
                            </span>{" "}
                            ভোটার এলাকার নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[70px]">
                              {newAreaCode}
                            </span>
                          </p>
                          <p>
                            গ্রাম/রাস্তার নাম ও নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[110px]">
                              {newVillage}
                            </span>{" "}
                            বাসা/হোল্ডিং নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[90px]">
                              {newHouseNo}
                            </span>
                          </p>
                          <p>
                            টেলিফোন/মোবাইল ফোন নম্বরঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[130px]">
                              {newPhone}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span>
                              ডাকঘরঃ{" "}
                              <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[140px]">
                                {newPostOffice}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              পোস্ট কোডঃ
                              {Array.from({ length: 4 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="w-4 h-4 border border-gray-400 inline-flex items-center justify-center text-[9px]"
                                >
                                  {newPostalCode[i] ?? ""}
                                </span>
                              ))}
                            </span>
                          </p>
                        </div>
                        <div className="grid grid-cols-12 gap-1 pt-1">
                          <span className="col-span-1 font-bold">৬।</span>
                          <span className="col-span-11">
                            ৫ নম্বর ক্রমিকে বর্ণিত ঠিকানায় যে সময় হইতে অবস্থান
                            করিতেছেনঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1">
                              {residingDateLabel}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">৭।</span>
                          <span className="col-span-11">
                            স্থানান্তরের কারণঃ{" "}
                            <span className="border-b border-dotted border-gray-400 inline-block px-1">
                              {migrationReason}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      ref={page2Ref}
                      className="print-page mt-6 bg-white border border-gray-300 rounded-lg p-6 shadow-sm text-gray-800 font-serif text-[11px] space-y-3 leading-relaxed relative"
                    >
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-1 font-bold">৮।</span>
                          <span className="col-span-11">
                            ৫ নম্বর ক্রমিকে বর্ণিত ঠিকানায় অবস্থানের সমর্থনে
                            নিম্নের দলিলাদি সংযুক্ত করিতে হইবেঃ
                          </span>
                        </div>
                        <p className="pl-[8.5%]">
                          (ক) প্রথম শ্রেণীর কর্মকর্তা/ ক্যান্টনমেন্ট বোর্ডের
                          এক্সিকিউটিভ অফিসার/ সিটি কর্পোরেশন/পৌরসভার মেয়র
                          /ওয়ার্ড কাউন্সিলর/ইউনিয়ন পরিষদ চেয়ারম্যান কর্তৃক
                          প্রদত্ত প্রত্যয়ন পত্র।
                        </p>
                        <p className="pl-[8.5%]">
                          (খ) ইউটিলিটি বিলের অনুলিপি (যদি থাকে)
                        </p>
                        <p className="pl-[8.5%]">
                          (গ) বাড়ী ভাড়া রশিদ/চৌকিদারী কর রশিদ/পৌরকর
                          রশিদ/অন্যান্য
                        </p>
                      </div>

                      <div className="pt-10 flex justify-end text-center">
                        <div>
                          <div className="w-40 border-b border-black mb-1"></div>
                          <p className="text-[9px] font-bold">
                            আবেদনকারীর স্বাক্ষর বা টিপসহি
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 space-y-1">
                        <p className="font-bold text-[10px]">
                          আবেদনকারীকে সনাক্তকারীর স্বাক্ষরঃ
                        </p>
                        <p>
                          নামঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[200px]">
                            {identifierName}
                          </span>
                        </p>
                        <p>
                          জাতীয় পরিচয়পত্র নম্বরঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[170px]">
                            {identifierNid}
                          </span>
                        </p>
                        <p>
                          ঠিকানাঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[200px]">
                            {identifierAddress}
                          </span>
                        </p>
                      </div>

                      <div className="pt-6">
                        <p className="font-bold text-center underline text-[10px]">
                          [কেবলমাত্র অফিসে ব্যবহারের জন্য]
                        </p>
                        <p className="text-[10px] mt-2 text-justify">
                          দাখিলকৃত দলিলাদি পরীক্ষান্তে
                          ..................................... ভোটার এলাকার
                          জন্য প্রণীত ভোটার তালিকা হইতে নাম কর্তন এবং
                          ..................................... ভোটার এলাকায়
                          নাম অন্তর্ভুক্ত করা হইল।
                        </p>
                      </div>

                      <div className="pt-8 flex justify-end text-center">
                        <div>
                          <div className="w-40 border-b border-black mb-1"></div>
                          <p className="text-[9px] font-bold">
                            উপজেলা/থানা নির্বাচন কর্মকর্তা
                          </p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-dashed border-gray-300">
                        <p className="font-bold text-center text-[10px] pt-3">
                          প্রাপ্তীকার পত্র
                        </p>
                        <p className="text-[10px] mt-1">
                          জনাব/বেগম{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[160px] font-semibold">
                            {applicantName}
                          </span>{" "}
                          এর আবেদন ফরম গৃহীত হইল।
                        </p>
                        <p className="text-[10px]">
                          আবেদন ফরম নম্বরঃ{" "}
                          <span className="border-b border-dotted border-gray-400 inline-block px-1 min-w-[140px]" />
                        </p>
                      </div>

                      <div className="pt-10 flex justify-end text-center">
                        <div>
                          <div className="w-40 border-b border-black mb-1"></div>
                          <p className="text-[9px] font-bold">
                            গ্রহণকারীর স্বাক্ষর
                          </p>
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
            <span
              className={`w-2 h-2 rounded-full ${
                isComplete
                  ? "bg-emerald-500"
                  : anyFieldFilled
                    ? "bg-amber-500"
                    : "bg-indigo-500"
              }`}
            ></span>
            <span>
              {isComplete
                ? "Form complete — download or print your application."
                : anyFieldFilled
                  ? `${toBn(filledRequired)}/${toBn(requiredFields.length)} required fields completed`
                  : "Add an input to get started"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={handleRestoreLastApplication}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Restore last application</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isProcessing !== null}
              className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {isProcessing === "print" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Printer size={14} />
              )}
              <span>
                {isProcessing === "print" ? "Processing..." : "Print"}
              </span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isProcessing !== null}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              {isProcessing === "download" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>
                {isProcessing === "download" ? "Processing..." : "Download PDF"}
              </span>
            </button>
          </div>
        </div>

        <div className="print-hide bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
            Important Information and Instructions:
          </h3>
          <p className="text-xs text-gray-700 font-medium">
            Attach the following documents with the application:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li>A photocopy of the National ID (NID) must be attached.</li>
            <li>
              A certificate from a first-class officer / mayor / councillor /
              union chairman proving you live at the new address.
            </li>
            <li>A copy of a utility bill (if available).</li>
            <li>
              House rent receipt / chowkidari tax receipt / municipal tax
              receipt or other proof.
            </li>
          </ul>
          <p className="text-[11px] font-bold text-red-600 pt-1">
            Fill in every field accurately. Wrong information can get the
            application rejected.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            Print the completed Form-13, sign it, and submit it to your upazila
            / thana election office.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            You do not need a broker or any payment to migrate your vote — this
            service is free of charge.
          </p>
        </div>

        <div className="print-hide bg-indigo-50/60 border border-indigo-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
          <span>
            Your files are processed in the browser — they are not uploaded to
            any server.
          </span>
        </div>

        <div className="print-hide bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Fill in your personal details, election office name, current
                and new address on the left panel.
              </p>
              <p>
                2. Watch the official Form-13 update live on the right panel.
              </p>
              <p>3. Print or download the 2-page form as a PDF to submit.</p>
            </div>
          )}
        </div>

        <div className="print-hide pt-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
