"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  CreditCard,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  RotateCcw,
  RefreshCw,
  Download,
  X,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  DISTRICTS,
  upazilasForDistrict,
  districtBnById,
  upazilaBnById,
} from "./bd-geo-data";

const STORAGE_KEY = "sohojkaj:family-card-form:last-application";
const USAGE_KEY = "sohojkaj:family-card-form:usage-count";

const relatedTools = [
  {
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
  {
    title: "Allowance Application Tracking",
    description:
      "Check status of Department of Social Services allowance application status — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/allowance-application-tracking",
    icon: FileText,
  },
];

interface FormState {
  recipient: string;
  unionName: string;
  applicantName: string;
  fatherHusband: string;
  motherName: string;
  nidNumber: string;
  mobileNumber: string;
  village: string;
  postOffice: string;
  wardNo: string;
  upazila: string;
  district: string;
  numSons: string;
  numDaughters: string;
}

const EMPTY_STATE: FormState = {
  recipient: "Ward Member",
  unionName: "",
  applicantName: "",
  fatherHusband: "",
  motherName: "",
  nidNumber: "",
  mobileNumber: "",
  village: "",
  postOffice: "",
  wardNo: "",
  upazila: "",
  district: "",
  numSons: "",
  numDaughters: "",
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
  disabled = false,
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

  React.useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.find((option) => option.id === value);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((option) => option.bn.includes(q));
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
            : "border-gray-200 cursor-text focus-within:border-blue-500"
        }`}
      >
        {selected ? (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-md pl-1.5 pr-1 py-0.5 font-semibold max-w-full">
            <span className="truncate">{selected.bn}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange("");
                  setQuery("");
                }}
                className="text-blue-400 hover:text-blue-700 shrink-0"
                aria-label={`Clear ${placeholder}`}
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
          onChange={(event) => {
            setQuery(event.target.value);
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
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
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
              {filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`text-left text-xs px-2 py-1.5 rounded-md hover:bg-blue-50 transition-colors truncate ${
                    option.id === value
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {option.bn}
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
      {hint ? (
        <p className="text-[10px] text-red-600 font-semibold leading-snug">
          {hint}
        </p>
      ) : null}
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
  onChange: (value: string) => void;
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
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
    />
  );
}

function FamilyCardPreview({
  recipient,
  unionName,
  applicantName,
  fatherHusband,
  motherName,
  nidNumber,
  mobileNumber,
  village,
  postOffice,
  wardNo,
  upazila,
  district,
  districtLabel,
  upazilaLabel,
  numSons,
  numDaughters,
  documentRef,
}: {
  recipient: string;
  unionName: string;
  applicantName: string;
  fatherHusband: string;
  motherName: string;
  nidNumber: string;
  mobileNumber: string;
  village: string;
  postOffice: string;
  wardNo: string;
  upazila: string;
  district: string;
  districtLabel: string;
  upazilaLabel: string;
  numSons: string;
  numDaughters: string;
  documentRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const valueOrDots = (value: string) =>
    value || "......................................";

  return (
    <div
      ref={documentRef}
      id="family-card-print-page"
      className="family-card-print-document relative w-[210mm] h-[297mm] shrink-0 bg-white text-gray-900 font-serif overflow-hidden"
      style={{
        boxSizing: "border-box",
        padding: "17mm",
        boxShadow: "0 10px 26px -8px rgba(20,20,30,.28)",
      }}
    >
      <div className="family-card-print-heading text-center font-bold underline uppercase tracking-wide mb-7 text-[15px]">
        Family Card Application
      </div>

      <div className="family-card-print-stamp absolute top-[17mm] right-[17mm] w-[31mm] h-[35mm] border-2 border-dashed border-gray-500 flex items-center justify-center text-center text-gray-500 p-2 text-[9.5px] leading-tight">
        Passport-size photo
        <br />
        (attach with stapler)
      </div>

      <div className="family-card-print-body text-[13.5px] leading-[1.58] space-y-4">
        <div className="space-y-1.5 pr-[40mm]">
          <p className="font-bold">To,</p>
          <p className="font-semibold">{valueOrDots(recipient)}</p>
          <p>{valueOrDots(unionName)}</p>
        </div>

        <div className="pt-1">
          <p className="font-bold">
            Subject: Regarding Family Card / application for Family Card.
          </p>
        </div>

        <div className="pt-1">
          <p className="font-bold">Sir,</p>
          <p className="mt-1 text-justify">
            I hereby certify that I am a permanent resident of the said
            ward/union/municipality area. Due to socio-economic reasons and to
            receive government benefits and VGF/ration-related services, I need
            a family card. Detailed information about me and my family is
            provided below:
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">১.</span>
            <span className="col-span-3 font-semibold">Applicant name:</span>
            <span className="col-span-8 border-b border-dotted border-gray-500 min-w-0">
              {applicantName}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">২.</span>
            <span className="col-span-3 font-semibold">
              Father/husband name:
            </span>
            <span className="col-span-8 border-b border-dotted border-gray-500 min-w-0">
              {fatherHusband}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">৩.</span>
            <span className="col-span-3 font-semibold">Mother name:</span>
            <span className="col-span-8 border-b border-dotted border-gray-500 min-w-0">
              {motherName}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">৪.</span>
            <span className="col-span-3 font-semibold">
              National ID number:
            </span>
            <span className="col-span-8 border-b border-dotted border-gray-500 min-w-0">
              {nidNumber}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">৫.</span>
            <span className="col-span-3 font-semibold">Mobile number:</span>
            <span className="col-span-8 border-b border-dotted border-gray-500 min-w-0">
              {mobileNumber}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2">
            <span className="col-span-1 font-bold">৬.</span>
            <span className="col-span-3 font-semibold">
              Current and permanent address:
            </span>
            <span className="col-span-8 min-w-0">
              Village/neighbourhood:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[24mm] px-1">
                {village}
              </span>
              , Post office:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[24mm] px-1">
                {postOffice}
              </span>
              <br />
              Ward no.:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[16mm] px-1">
                {wardNo}
              </span>
              , Upazila:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[22mm] px-1">
                {upazila || upazilaLabel}
              </span>
              <br />
              District:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[32mm] px-1">
                {district || districtLabel}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-12 gap-x-2 pt-0.5">
            <span className="col-span-1 font-bold">৭.</span>
            <span className="col-span-3 font-semibold">
              Family member details:
            </span>
            <span className="col-span-8 min-w-0">
              ছেলে সন্তান:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[13mm] px-2">
                {numSons}
              </span>{" "}
              জন&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; মেয়ে সন্তান:{" "}
              <span className="border-b border-dotted border-gray-500 inline-block min-w-[13mm] px-2">
                {numDaughters}
              </span>{" "}
              জন
            </span>
          </div>
        </div>

        <div className="pt-3">
          <p className="text-justify">
            Therefore, after verifying the above information, I kindly request
            you to take the necessary steps to issue me a Family Card.
          </p>
        </div>
      </div>

      <div className="absolute left-[17mm] right-[17mm] bottom-[17mm] flex justify-between items-end text-center text-[11px]">
        <div className="w-[52mm]">
          <div className="border-b border-black mb-1.5" />
          <p className="font-bold">
            Signature (recipient / ward
            <br />
            representative)
          </p>
        </div>

        <div className="w-[52mm]">
          <div className="border-b border-black mb-1.5" />
          <p className="font-bold">Applicant signature</p>
        </div>
      </div>
    </div>
  );
}

export default function FamilyCardForm() {
  const router = useRouter();

  const [recipient, setRecipient] = useState(EMPTY_STATE.recipient);
  const [unionName, setUnionName] = useState(EMPTY_STATE.unionName);
  const [applicantName, setApplicantName] = useState(EMPTY_STATE.applicantName);
  const [fatherHusband, setFatherHusband] = useState(
    EMPTY_STATE.fatherHusband,
  );
  const [motherName, setMotherName] = useState(EMPTY_STATE.motherName);
  const [nidNumber, setNidNumber] = useState(EMPTY_STATE.nidNumber);
  const [mobileNumber, setMobileNumber] = useState(EMPTY_STATE.mobileNumber);

  const [village, setVillage] = useState(EMPTY_STATE.village);
  const [postOffice, setPostOffice] = useState(EMPTY_STATE.postOffice);
  const [wardNo, setWardNo] = useState(EMPTY_STATE.wardNo);
  const [upazila, setUpazila] = useState(EMPTY_STATE.upazila);
  const [district, setDistrict] = useState(EMPTY_STATE.district);

  const [numSons, setNumSons] = useState(EMPTY_STATE.numSons);
  const [numDaughters, setNumDaughters] = useState(EMPTY_STATE.numDaughters);

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isProcessing, setIsProcessing] = useState<
    "print" | "download" | null
  >(null);
  const [usageCount, setUsageCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const previewScrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [previewFitScale, setPreviewFitScale] = useState(0.62);

  React.useEffect(() => {
    const container = previewScrollRef.current;
    if (!container) return;

    const updateFitScale = () => {
      // Fit the complete A4 sheet inside the preview viewport at 100% zoom.
      // The zoom control then scales this fitted sheet up/down from that base.
      const availableWidth = Math.max(280, container.clientWidth - 40);
      const availableHeight = Math.max(420, container.clientHeight - 40);
      const a4CssWidth = (210 / 25.4) * 96;
      const a4CssHeight = (297 / 25.4) * 96;
      const widthScale = availableWidth / a4CssWidth;
      const heightScale = availableHeight / a4CssHeight;
      const nextScale = Math.min(1, widthScale, heightScale);
      setPreviewFitScale(nextScale);
    };

    updateFitScale();

    const observer = new ResizeObserver(updateFitScale);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    try {
      const rawUsage = window.localStorage.getItem(USAGE_KEY);
      if (rawUsage) {
        setUsageCount(Number(rawUsage) || 0);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const allUpazilaOptions = useMemo<GeoOption[]>(() => {
    const seen = new Set<string>();
    const result: GeoOption[] = [];

    for (const districtOption of DISTRICTS) {
      const options = upazilasForDistrict(districtOption.id);
      for (const option of options) {
        if (seen.has(option.id)) continue;
        seen.add(option.id);
        result.push(option);
      }
    }

    return result;
  }, []);

  const upazilaOptions = useMemo(
    () => (district ? upazilasForDistrict(district) : allUpazilaOptions),
    [allUpazilaOptions, district],
  );

  const districtLabel = district ? districtBnById(district) : "";
  const upazilaLabel = upazila ? upazilaBnById(upazila) : "";

  const phoneHint =
    mobileNumber && !/^01[3-9]\d{8}$/.test(mobileNumber)
      ? "Enter a valid Bangladesh mobile number (starts with 01, e.g. 01712345678)."
      : undefined;

  const requiredFields = [
    recipient,
    unionName,
    applicantName,
    fatherHusband,
    motherName,
    nidNumber,
    mobileNumber,
    village,
    postOffice,
    wardNo,
    district,
    upazila,
    numSons,
    numDaughters,
  ];

  const filledRequired = requiredFields.filter(
    (value) => value.trim() !== "",
  ).length;

  const anyFieldFilled =
    filledRequired > 0 ||
    [
      unionName,
      applicantName,
      fatherHusband,
      motherName,
      nidNumber,
      mobileNumber,
      village,
      postOffice,
      wardNo,
      upazila,
      district,
      numSons,
      numDaughters,
    ].some((value) => value.trim() !== "");

  const isComplete =
    filledRequired === requiredFields.length && !phoneHint;

  const currentFormState = (): FormState => ({
    recipient,
    unionName,
    applicantName,
    fatherHusband,
    motherName,
    nidNumber,
    mobileNumber,
    village,
    postOffice,
    wardNo,
    upazila,
    district,
    numSons,
    numDaughters,
  });

  const applyFormState = (state: FormState) => {
    setRecipient(state.recipient || EMPTY_STATE.recipient);
    setUnionName(state.unionName || "");
    setApplicantName(state.applicantName || "");
    setFatherHusband(state.fatherHusband || "");
    setMotherName(state.motherName || "");
    setNidNumber(state.nidNumber || "");
    setMobileNumber(state.mobileNumber || "");
    setVillage(state.village || "");
    setPostOffice(state.postOffice || "");
    setWardNo(state.wardNo || "");
    setUpazila(state.upazila || "");
    setDistrict(state.district || "");
    setNumSons(state.numSons || "");
    setNumDaughters(state.numDaughters || "");
  };

  const saveLastApplication = () => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(currentFormState()),
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const bumpUsageCount = () => {
    try {
      const next = usageCount + 1;
      window.localStorage.setItem(USAGE_KEY, String(next));
      setUsageCount(next);
    } catch {
      // Ignore storage errors.
    }
  };

  const handleRestoreLastApplication = () => {
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
  };

  const handleClear = () => {
    applyFormState(EMPTY_STATE);
    setToast("All fields cleared.");
  };

  const waitForPrintAssets = async (doc: Document): Promise<void> => {
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
  };

  const getPrintableClone = () => {
    if (!pageRef.current) return null;

    const clone = pageRef.current.cloneNode(true) as HTMLDivElement;
    clone.classList.add("family-card-print-page");
    clone.style.width = "210mm";
    clone.style.minWidth = "210mm";
    clone.style.maxWidth = "210mm";
    clone.style.height = "297mm";
    clone.style.minHeight = "297mm";
    clone.style.maxHeight = "297mm";
    clone.style.margin = "0";
    clone.style.padding = "17mm";
    clone.style.boxSizing = "border-box";
    clone.style.overflow = "hidden";
    clone.style.transform = "none";
    clone.style.transformOrigin = "initial";
    clone.style.boxShadow = "none";
    clone.style.border = "0";
    clone.style.borderRadius = "0";
    clone.style.background = "#ffffff";

    return clone;
  };

  const validateForOutput = () => {
    if (!isComplete) {
      setToast(
        phoneHint
          ? "Please fix the mobile number before printing or downloading."
          : "Please complete all required fields before printing or downloading.",
      );
      return false;
    }

    return true;
  };

  const handlePrint = async () => {
    if (!validateForOutput()) return;

    const printable = getPrintableClone();
    if (!printable) return;

    setIsProcessing("print");
    saveLastApplication();

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=1200",
      );

    if (!printWindow) {
      setIsProcessing(null);
      window.print();
      bumpUsageCount();
      return;
    }

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
        background: #ffffff !important;
        overflow: visible !important;
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
      }

      .family-card-print-page {
        width: 210mm !important;
        height: 297mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        padding: 17mm !important;
        margin: 0 !important;
        overflow: hidden !important;
        box-shadow: none !important;
        border: 0 !important;
        background: #ffffff !important;
        break-after: auto !important;
        page-break-after: auto !important;
      }

      .family-card-print-body {
        font-size: 14px !important;
        line-height: 1.58 !important;
      }

      .family-card-print-heading {
        font-size: 16px !important;
        margin-bottom: 7mm !important;
      }

      .family-card-print-stamp {
        font-size: 10px !important;
      }

      .family-card-print-page .text-\\[11px\\] {
        font-size: 11px !important;
      }

      .family-card-print-page .text-\\[9\\.5px\\] {
        font-size: 9.5px !important;
      }
    `;

    try {
      printWindow.document.open();
      printWindow.document.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>Family Card Application</title>`,
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

      printWindow.document
        .getElementById("print-root")
        ?.appendChild(printable);

      await waitForPrintAssets(printWindow.document);

      printWindow.onafterprint = () => {
        printWindow.close();
      };

      printWindow.focus();
      printWindow.print();

      bumpUsageCount();
    } catch (error) {
      console.error(error);
      printWindow.close();
      setToast("Couldn't open the print dialog. Please try again.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validateForOutput()) return;

    setIsProcessing("download");
    saveLastApplication();

    let pdfHost: HTMLDivElement | null = null;

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const printable = getPrintableClone();
      if (!printable) {
        throw new Error("Printable page is not available.");
      }

      pdfHost = document.createElement("div");
      pdfHost.setAttribute("aria-hidden", "true");
      pdfHost.style.position = "fixed";
      pdfHost.style.left = "-100000px";
      pdfHost.style.top = "0";
      pdfHost.style.width = "210mm";
      pdfHost.style.height = "297mm";
      pdfHost.style.margin = "0";
      pdfHost.style.padding = "0";
      pdfHost.style.background = "#ffffff";
      pdfHost.style.overflow = "hidden";
      pdfHost.style.pointerEvents = "none";
      pdfHost.style.zIndex = "-1";

      pdfHost.appendChild(printable);
      document.body.appendChild(pdfHost);

      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // Font readiness is best-effort.
        }
      }

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve()),
        ),
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(printable, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: printable.scrollWidth,
        height: printable.scrollHeight,
        windowWidth: printable.scrollWidth,
        windowHeight: printable.scrollHeight,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

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

      const safeName = applicantName
        .trim()
        .replace(/[^a-zA-Z0-9\s-_]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      const fileName = safeName
        ? `family-card-${safeName}.pdf`
        : "family-card-application.pdf";

      pdf.save(fileName);
      bumpUsageCount();
      setToast("PDF downloaded.");
    } catch (error) {
      console.error(error);
      setToast("Couldn't generate the PDF. Please try again.");
    } finally {
      if (pdfHost?.parentNode) {
        pdfHost.parentNode.removeChild(pdfHost);
      }

      setIsProcessing(null);
    }
  };

  const zoomFactor = zoom / 100;
  const previewScale = previewFitScale * zoomFactor;
  const scaledPreviewWidth = 210 * previewScale;
  const scaledPreviewHeight = 297 * previewScale;
  const isZoomedBeyondFit = zoomFactor > 1.001;

  return (
    <div className="family-card-root w-full text-gray-800 font-sans pb-28">
      <style>{`
        .family-card-print-only {
          display: none;
        }

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
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .family-card-screen {
            display: none !important;
          }

          .family-card-print-only {
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }

          .family-card-print-page {
            display: block !important;
            position: relative !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 17mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }

          .family-card-print-body {
            font-size: 14px !important;
            line-height: 1.58 !important;
          }

          .family-card-print-heading {
            font-size: 16px !important;
          }

          .family-card-print-stamp {
            font-size: 10px !important;
          }
        }
      `}</style>

      {toast ? (
        <div className="print-hide fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          {toast}
        </div>
      ) : null}

      <div className="family-card-screen w-full space-y-6">
        <div className="print-hide flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
                title="Go back"
                type="button"
              >
                <ArrowLeft size={16} />
              </button>

              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>

              <span>/</span>
              <span>General Tools</span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                Family Card Form
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <CreditCard size={18} />
              </div>

              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Family Card Form
              </h1>

              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>

              <span className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                <CheckCircle2 size={12} className="text-gray-300" />
                Used {usageCount} times
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium mt-1">
              Fill in your details on the left — see a live application letter
              on the right and download as PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite((favorite) => !favorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-all shadow-2xs"
              type="button"
              aria-label="Favorite"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-blue-400 text-blue-400" : ""}
              />
            </button>

            <button
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs"
              type="button"
              aria-label="Share"
            >
              <Share size={16} />
            </button>
          </div>
        </div>

        <div className="print-hide grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Settings
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Fill in all fields. Preview updates as you type.
                </span>
              </div>

              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  1. General information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Select recipient">
                    <select
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Ward Member">Ward Member</option>
                      <option value="Ward Representative">
                        Ward Representative
                      </option>
                      <option value="Chairman">Chairman</option>
                      <option value="Mayor">Mayor</option>
                    </select>
                  </Field>

                  <Field label="Union / municipality name">
                    <TextInput
                      value={unionName}
                      onChange={setUnionName}
                      placeholder="e.g. 1st Union Parishad"
                    />
                  </Field>
                </div>

                <Field label="Applicant full name">
                  <TextInput
                    value={applicantName}
                    onChange={setApplicantName}
                    placeholder="Applicant name"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Father / husband name">
                    <TextInput
                      value={fatherHusband}
                      onChange={setFatherHusband}
                      placeholder="Father / husband name"
                    />
                  </Field>

                  <Field label="Mother name">
                    <TextInput
                      value={motherName}
                      onChange={setMotherName}
                      placeholder="Mother name"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="National ID (NID) number">
                    <TextInput
                      value={nidNumber}
                      onChange={(value) =>
                        setNidNumber(value.replace(/[^0-9]/g, "").slice(0, 17))
                      }
                      placeholder="National ID number"
                      inputMode="numeric"
                      maxLength={17}
                    />
                  </Field>

                  <Field label="Mobile number" hint={phoneHint}>
                    <TextInput
                      value={mobileNumber}
                      onChange={(value) =>
                        setMobileNumber(value.replace(/[^0-9]/g, "").slice(0, 11))
                      }
                      placeholder="01712345678"
                      inputMode="tel"
                      maxLength={11}
                    />
                  </Field>
                </div>
              </div>

              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  2. Full address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Village / neighbourhood">
                    <TextInput
                      value={village}
                      onChange={setVillage}
                      placeholder="Village name"
                    />
                  </Field>

                  <Field label="Post office">
                    <TextInput
                      value={postOffice}
                      onChange={setPostOffice}
                      placeholder="Post office name"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Field label="Ward number">
                    <TextInput
                      value={wardNo}
                      onChange={setWardNo}
                      placeholder="e.g. 05"
                      inputMode="numeric"
                      maxLength={3}
                    />
                  </Field>

                  <Field label="District">
                    <GeoCombobox
                      value={district}
                      onChange={(id) => {
                        setDistrict(id);
                        setUpazila("");
                      }}
                      options={DISTRICTS}
                      placeholder="District name"
                    />
                  </Field>
                </div>

                <Field label="Upazila">
                  <GeoCombobox
                    value={upazila}
                    onChange={setUpazila}
                    options={upazilaOptions}
                    placeholder="Upazila name"
                  />
                </Field>
              </div>

              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  3. Family details (children)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Number of sons">
                    <TextInput
                      value={numSons}
                      onChange={(value) =>
                        setNumSons(value.replace(/[^0-9]/g, "").slice(0, 2))
                      }
                      placeholder="e.g. 2"
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </Field>

                  <Field label="Number of daughters">
                    <TextInput
                      value={numDaughters}
                      onChange={(value) =>
                        setNumDaughters(
                          value.replace(/[^0-9]/g, "").slice(0, 2),
                        )
                      }
                      placeholder="e.g. 1"
                      inputMode="numeric"
                      maxLength={2}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleClear}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <RotateCcw size={14} />
                  <span>Clear all</span>
                </button>

                <button
                  onClick={handlePrint}
                  disabled={isProcessing !== null}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                  type="button"
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
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Preview</span>
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-1 py-0.5 border border-gray-200">
                    <button
                      onClick={() =>
                        setZoom((currentZoom) => Math.max(60, currentZoom - 10))
                      }
                      className="p-1 hover:bg-white rounded-md text-gray-500"
                      type="button"
                      aria-label="Zoom out"
                    >
                      <Minus size={12} />
                    </button>

                    <span className="text-[11px] font-bold text-gray-600 w-9 text-center">
                      {zoom}%
                    </span>

                    <button
                      onClick={() =>
                        setZoom((currentZoom) => Math.min(150, currentZoom + 10))
                      }
                      className="p-1 hover:bg-white rounded-md text-gray-500"
                      type="button"
                      aria-label="Zoom in"
                    >
                      <Plus size={12} />
                    </button>

                    <button
                      onClick={() => setZoom(100)}
                      className="p-1 hover:bg-white rounded-md text-gray-400 hover:text-gray-700"
                      type="button"
                      aria-label="Reset zoom"
                    >
                      <RotateCcw size={11} />
                    </button>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${
                      anyFieldFilled
                        ? "text-orange-600 bg-orange-50"
                        : "text-gray-400 bg-gray-100"
                    }`}
                  >
                    {anyFieldFilled ? "Preview" : "Empty"}
                  </span>
                </div>
              </div>

              <div className="mt-3 mb-2 text-[11px] text-gray-500 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-gray-300 bg-white">
                  ▣
                </span>
                <span>Live preview</span>
              </div>

              <div
                ref={previewScrollRef}
                className={`bg-[#3d3934] rounded-xl overflow-auto max-h-[730px] min-h-[580px] p-4 sm:p-5 flex items-start ${
                  isZoomedBeyondFit ? "justify-start" : "justify-center"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="shrink-0"
                  style={{
                    width: `${scaledPreviewWidth}mm`,
                    height: `${scaledPreviewHeight}mm`,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <FamilyCardPreview
                      recipient={recipient}
                      unionName={unionName}
                      applicantName={applicantName}
                      fatherHusband={fatherHusband}
                      motherName={motherName}
                      nidNumber={nidNumber}
                      mobileNumber={mobileNumber}
                      village={village}
                      postOffice={postOffice}
                      wardNo={wardNo}
                      upazila={upazila}
                      district={district}
                      districtLabel={districtLabel ?? ""}
                      upazilaLabel={upazilaLabel ?? ""}
                      numSons={numSons}
                      numDaughters={numDaughters}
                      documentRef={pageRef}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-hide bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
            Important Information and Instructions:
          </h3>

          <p className="text-xs text-gray-700 font-medium">
            The following documents must be attached:
          </p>

          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li>
              Attach one colour passport-size photo to the application form with
              a stapler.
            </li>
            <li>
              Submit a photocopy of the National ID (NID) with the application
              form.
            </li>
            <li>
              Submit photocopies of National IDs of other family members (if
              any).
            </li>
            <li>An active mobile number must be provided.</li>
          </ul>

          <p className="text-[11px] font-bold text-red-600 pt-1">
            Fill in all information correctly and accurately. The application
            may be cancelled for incorrect information.
          </p>

          <p className="text-[11px] font-medium text-gray-600">
            Submit this form to a respectable person in your area — Member,
            Chairman, Councillor or Mayor. There is no online system to apply
            for a Family Card.
          </p>

          <p className="text-[11px] font-medium text-gray-600">
            You do not need to pay anyone or use a broker to get this government
            benefit — the Family Card is distributed free of charge by the
            government.
          </p>
        </div>

        <div className="print-hide bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
          <span>
            Your files are processed in the browser — they are not uploaded to
            any server.
          </span>
        </div>

        <div className="print-hide bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse((open) => !open)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>How to use</span>
            </div>

            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse ? (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Fill in your personal details, address, and family
                information on the left panel.
              </p>
              <p>
                2. Watch the application letter update live on the right panel.
              </p>
              <p>3. Print or download the form as a PDF to submit.</p>
            </div>
          ) : null}
        </div>

        <div className="print-hide pt-4 space-y-3">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool) => {
              const ToolIcon = tool.icon;

              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
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

        <div className="print-hide fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-4 pb-3 pointer-events-none">
          <div className="w-full pointer-events-auto bg-[#fffdf1]/95 backdrop-blur-md border border-gray-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-8px_28px_rgba(30,30,30,.12)]">
            <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isComplete ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span>
                {isComplete
                  ? "Form complete — download or print your application."
                  : anyFieldFilled
                    ? "Complete all required fields to print or download."
                    : "Add an input to get started"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                type="button"
              >
                Clear all
              </button>

              <button
                onClick={handleRestoreLastApplication}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                type="button"
              >
                <RefreshCw size={13} />
                <span>Restore last application</span>
              </button>

              <button
                onClick={handlePrint}
                disabled={isProcessing !== null}
                className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-60"
                type="button"
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
                type="button"
              >
                {isProcessing === "download" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}

                <span>
                  {isProcessing === "download"
                    ? "Processing..."
                    : "Download PDF"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="family-card-print-only" aria-hidden="true">
        <FamilyCardPreview
          recipient={recipient}
          unionName={unionName}
          applicantName={applicantName}
          fatherHusband={fatherHusband}
          motherName={motherName}
          nidNumber={nidNumber}
          mobileNumber={mobileNumber}
          village={village}
          postOffice={postOffice}
          wardNo={wardNo}
          upazila={upazila}
          district={district}
          districtLabel={districtLabel ?? ""}
          upazilaLabel={upazilaLabel ?? ""}
          numSons={numSons}
          numDaughters={numDaughters}
        />
      </div>
    </div>
  );
}
