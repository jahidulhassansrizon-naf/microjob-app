"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  FileDown,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Share2,
  Star,
  X,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { createPortal, flushSync } from "react-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

/* -------------------------------------------------------------------------- */
/*  State / constants                                                          */
/* -------------------------------------------------------------------------- */

type SpecialInformationFormState = {
  form2Number: string;
  nameBn: string;
  fatherHusbandName: string;

  fatherAddressDivision: string;
  fatherAddressDistrict: string;
  fatherAddressUpazila: string;
  fatherAddressWard: string;
  fatherAddressCity: string;
  fatherAddressMouza: string;
  fatherAddressVillage: string;
  fatherAddressHouse: string;
  fatherAddressPostOffice: string;
  fatherAddressPostCode: string;

  guardianName: string;
  guardianNid: string;
  guardianRelation: string;
  guardianDob: string;

  grandfatherName: string;
  grandfatherNid: string;
  grandfatherNidNotApplicable: boolean;

  grandfatherAddressDivision: string;
  grandfatherAddressDistrict: string;
  grandfatherAddressUpazila: string;
  grandfatherAddressWard: string;
  grandfatherAddressCity: string;
  grandfatherAddressMouza: string;
  grandfatherAddressVillage: string;
  grandfatherAddressHouse: string;
  grandfatherAddressPostOffice: string;
  grandfatherAddressPostCode: string;

  firstRelativeName: string;
  firstRelativeNid: string;
  firstRelativeRelation: string;
  firstRelativeDob: string;
  firstRelativeMobile: string;
  secondRelativeName: string;
  secondRelativeNid: string;
  secondRelativeRelation: string;
  secondRelativeDob: string;
  secondRelativeMobile: string;
  thirdRelativeName: string;
  thirdRelativeNid: string;
  thirdRelativeRelation: string;
  thirdRelativeDob: string;
  thirdRelativeMobile: string;

  presentHoldingType: "Own property" | "Rented" | "Other" | "";
  ownerOtherName: string;
  ownerOtherNid: string;
  residenceStartDate: string;
  residenceEndDate: string;

  abroadArrivalDate: string;
  passportIssueDate: string;
  passportIssuePlace: string;
  passportExpiryDate: string;

  occupationJoinDate: string;
  employerName: string;
  employerAddress: string;
  employerAddress2: string;
  employerMobile: string;

  firstInstitutionNameAddress: string;
  firstStudyFrom: string;
  firstStudyTo: string;
  firstQualification: string;
  secondInstitutionNameAddress: string;
  secondStudyFrom: string;
  secondStudyTo: string;
  secondQualification: string;

  dataCollectorNid: string;
};

type FormKey = keyof SpecialInformationFormState;
type StringKey = {
  [K in FormKey]: SpecialInformationFormState[K] extends string ? K : never;
}[FormKey];

type ToastKind = "success" | "info" | "error";
type Toast = { id: number; kind: ToastKind; title: string; message: string };
type RenderMode = "print" | "pdf" | null;

const STORAGE_KEY = "sohoj-special-information-form";
const LAST_KEY = "sohoj-special-information-form-last";
const FAVORITE_KEY = "sohoj-special-information-form-favorite";
const USED_KEY = "sohoj-special-information-form-used";
const FONT_LINK_ID = "special-information-bengali-fonts";

const EMPTY_FORM: SpecialInformationFormState = {
  form2Number: "",
  nameBn: "",
  fatherHusbandName: "",

  fatherAddressDivision: "",
  fatherAddressDistrict: "",
  fatherAddressUpazila: "",
  fatherAddressWard: "",
  fatherAddressCity: "",
  fatherAddressMouza: "",
  fatherAddressVillage: "",
  fatherAddressHouse: "",
  fatherAddressPostOffice: "",
  fatherAddressPostCode: "",

  guardianName: "",
  guardianNid: "",
  guardianRelation: "",
  guardianDob: "",

  grandfatherName: "",
  grandfatherNid: "",
  grandfatherNidNotApplicable: false,

  grandfatherAddressDivision: "",
  grandfatherAddressDistrict: "",
  grandfatherAddressUpazila: "",
  grandfatherAddressWard: "",
  grandfatherAddressCity: "",
  grandfatherAddressMouza: "",
  grandfatherAddressVillage: "",
  grandfatherAddressHouse: "",
  grandfatherAddressPostOffice: "",
  grandfatherAddressPostCode: "",

  firstRelativeName: "",
  firstRelativeNid: "",
  firstRelativeRelation: "",
  firstRelativeDob: "",
  firstRelativeMobile: "",
  secondRelativeName: "",
  secondRelativeNid: "",
  secondRelativeRelation: "",
  secondRelativeDob: "",
  secondRelativeMobile: "",
  thirdRelativeName: "",
  thirdRelativeNid: "",
  thirdRelativeRelation: "",
  thirdRelativeDob: "",
  thirdRelativeMobile: "",

  presentHoldingType: "",
  ownerOtherName: "",
  ownerOtherNid: "",
  residenceStartDate: "",
  residenceEndDate: "",

  abroadArrivalDate: "",
  passportIssueDate: "",
  passportIssuePlace: "",
  passportExpiryDate: "",

  occupationJoinDate: "",
  employerName: "",
  employerAddress: "",
  employerAddress2: "",
  employerMobile: "",

  firstInstitutionNameAddress: "",
  firstStudyFrom: "",
  firstStudyTo: "",
  firstQualification: "",
  secondInstitutionNameAddress: "",
  secondStudyFrom: "",
  secondStudyTo: "",
  secondQualification: "",

  dataCollectorNid: "",
};

const DISTRICTS: Array<[string, string]> = [
  ["বরিশাল", "Barishal"],
  ["বরগুনা", "Barguna"],
  ["ভোলা", "Bhola"],
  ["ঝালকাঠি", "Jhalokathi"],
  ["পটুয়াখালী", "Patuakhali"],
  ["পিরোজপুর", "Pirojpur"],
  ["চট্টগ্রাম", "Chattogram"],
  ["কক্সবাজার", "Cox's Bazar"],
  ["কুমিল্লা", "Cumilla"],
  ["ফেনী", "Feni"],
  ["ব্রাহ্মণবাড়িয়া", "Brahmanbaria"],
  ["রাঙ্গামাটি", "Rangamati"],
  ["নোয়াখালী", "Noakhali"],
  ["চাঁদপুর", "Chandpur"],
  ["লক্ষ্মীপুর", "Lakshmipur"],
  ["খাগড়াছড়ি", "Khagrachhari"],
  ["বান্দরবান", "Bandarban"],
  ["ঢাকা", "Dhaka"],
  ["গাজীপুর", "Gazipur"],
  ["কিশোরগঞ্জ", "Kishoreganj"],
  ["মাদারীপুর", "Madaripur"],
  ["মুন্সীগঞ্জ", "Munshiganj"],
  ["নরসিংদী", "Narsingdi"],
  ["নারায়ণগঞ্জ", "Narayanganj"],
  ["রাজবাড়ী", "Rajbari"],
  ["শরীয়তপুর", "Shariatpur"],
  ["টাঙ্গাইল", "Tangail"],
  ["ফরিদপুর", "Faridpur"],
  ["গোপালগঞ্জ", "Gopalganj"],
  ["মানিকগঞ্জ", "Manikganj"],
  ["খুলনা", "Khulna"],
  ["বাগেরহাট", "Bagerhat"],
  ["চুয়াডাঙ্গা", "Chuadanga"],
  ["যশোর", "Jashore"],
  ["ঝিনাইদহ", "Jhenaidah"],
  ["কুষ্টিয়া", "Kushtia"],
  ["মাগুরা", "Magura"],
  ["মেহেরপুর", "Meherpur"],
  ["নড়াইল", "Narail"],
  ["সাতক্ষীরা", "Satkhira"],
  ["ময়মনসিংহ", "Mymensingh"],
  ["জামালপুর", "Jamalpur"],
  ["নেত্রকোণা", "Netrokona"],
  ["শেরপুর", "Sherpur"],
  ["রাজশাহী", "Rajshahi"],
  ["বগুড়া", "Bogura"],
  ["জয়পুরহাট", "Joypurhat"],
  ["নওগাঁ", "Naogaon"],
  ["নাটোর", "Natore"],
  ["চাঁপাইনবাবগঞ্জ", "Chapainawabganj"],
  ["পাবনা", "Pabna"],
  ["সিরাজগঞ্জ", "Sirajganj"],
  ["রংপুর", "Rangpur"],
  ["দিনাজপুর", "Dinajpur"],
  ["গাইবান্ধা", "Gaibandha"],
  ["কুড়িগ্রাম", "Kurigram"],
  ["লালমনিরহাট", "Lalmonirhat"],
  ["নীলফামারী", "Nilphamari"],
  ["পঞ্চগড়", "Panchagarh"],
  ["ঠাকুরগাঁও", "Thakurgaon"],
  ["সিলেট", "Sylhet"],
  ["হবিগঞ্জ", "Habiganj"],
  ["মৌলভীবাজার", "Moulvibazar"],
  ["সুনামগঞ্জ", "Sunamganj"],
];

const HOLDING_OPTIONS = ["Own property", "Rented", "Other"] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}
function digitString(value: string, max = 17) {
  return toAsciiDigits(value).replace(/\D/g, "").slice(0, max);
}
function formatDateInput(raw: string) {
  const d = digitString(raw, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}
function parseDateValue(value: string): Date | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function dateToIso(value: string) {
  const date = parseDateValue(value);
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function isFormEmpty(form: SpecialInformationFormState) {
  return (Object.keys(EMPTY_FORM) as FormKey[]).every((key) => {
    const value = form[key];
    if (typeof value === "boolean") return value === false;
    return String(value ?? "").trim() === "";
  });
}
function sanitizeForm(raw: unknown): SpecialInformationFormState {
  const result: SpecialInformationFormState = { ...EMPTY_FORM };
  if (!raw || typeof raw !== "object") return result;
  const source = raw as Record<string, unknown>;
  const target = result as unknown as Record<string, unknown>;
  (Object.keys(EMPTY_FORM) as FormKey[]).forEach((key) => {
    const fallback = EMPTY_FORM[key];
    const value = source[key];
    if (typeof fallback === "boolean") {
      target[key] = typeof value === "boolean" ? value : false;
    } else {
      target[key] = typeof value === "string" ? value : fallback;
    }
  });
  if (
    !(HOLDING_OPTIONS as readonly string[]).includes(result.presentHoldingType)
  ) {
    result.presentHoldingType = "";
  }
  return result;
}
function safeReadJson(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? sanitizeForm(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
function nextFrames(count: number) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

const validateNid = (v: string) =>
  v && ![10, 13, 17].includes(v.length)
    ? "NID must be 10, 13 or 17 digits."
    : "";
const validatePostCode = (v: string) =>
  v && v.length !== 4 ? "Post code must be 4 digits." : "";
const validateMobile = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v) ? "Enter a valid 11-digit mobile number." : "";
const validateDate = (v: string) => {
  if (!v) return "";
  if (v.length < 10) return "Enter the full date as DD-MM-YYYY.";
  if (!parseDateValue(v)) return "This is not a valid date.";
  return "";
};

const PAPER_W = 478;
const PAPER_H = 676;
const INK = "#0F172A";
const PAPER = "#FFFFFF";
const FORM_FONT =
  '"SolaimanLipi","Kalpurush","Noto Serif Bengali","Noto Sans Bengali","Nirmala UI","Vrinda","Siyam Rupali",serif';

async function waitForFonts() {
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await Promise.race([
        Promise.all([
          document.fonts.load('400 12px "Noto Serif Bengali"', "অআকখ০১২"),
          document.fonts.load('700 12px "Noto Serif Bengali"', "অআকখ০১২"),
        ]).then(() => document.fonts.ready),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }
  } catch {
    // Fallback fonts are fine.
  }
  await nextFrames(2);
}

/* -------------------------------------------------------------------------- */
/*  Left UI building blocks                                                    */
/* -------------------------------------------------------------------------- */

function FieldLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-[#0F172A]">
      <span>{children}</span>
      {hint ? (
        <span className="font-normal text-[10px] text-[#64748B]">{hint}</span>
      ) : null}
    </div>
  );
}

const INPUT_CLASS =
  "h-9 w-full rounded-md border bg-white/60 px-3 text-[11px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
const INPUT_OK = "border-[#CBD5E1] focus:border-[#2563EB] focus:ring-[#BFDBFE]";
const INPUT_BAD =
  "border-[#FCA5A5] focus:border-[#DC2626] focus:ring-[#FECACA]";

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-1 text-[9.5px] leading-3 text-[#B91C1C]">
      {message}
    </p>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  maxLength,
  hint,
  className,
  disabled,
  validate,
  inputMode,
  list,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  maxLength?: number;
  hint?: string;
  className?: string;
  disabled?: boolean;
  validate?: (value: string) => string;
  inputMode?: "text" | "numeric" | "tel";
  list?: string;
}) {
  const [touched, setTouched] = useState(false);
  const message = validate && !disabled ? validate(value) : "";
  const showError =
    Boolean(message) &&
    (touched || (maxLength !== undefined && value.length >= maxLength));
  return (
    <label className={cx("block", className)}>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        list={list}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showError}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
        className={cx(INPUT_CLASS, showError ? INPUT_BAD : INPUT_OK)}
      />
      {showError ? <FieldError message={message} /> : null}
    </label>
  );
}

function DateField({
  label,
  value,
  placeholder = "01-01-1990",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const [touched, setTouched] = useState(false);
  const message = validateDate(value);
  const showError = Boolean(message) && (touched || value.length === 10);
  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
        return;
      }
    } catch {}
    el.focus();
    el.click();
  };
  return (
    <div className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          aria-label="Open calendar"
          className="absolute left-2 top-2 z-10 text-[#94A3B8] hover:text-[#2563EB]"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          aria-label={label}
          aria-invalid={showError}
          onBlur={() => setTouched(true)}
          onChange={(event) => onChange(formatDateInput(event.target.value))}
          className={cx(INPUT_CLASS, "pl-8", showError ? INPUT_BAD : INPUT_OK)}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          min="1900-01-01"
          max={todayIso()}
          value={dateToIso(value)}
          onChange={(event) => {
            const iso = event.target.value;
            if (!iso) return;
            const [y, m, d] = iso.split("-");
            onChange(`${d}-${m}-${y}`);
          }}
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0"
        />
      </div>
      {showError ? <FieldError message={message} /> : null}
    </div>
  );
}

function ChoicePill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "rounded-md border px-3 py-2 text-[10px] font-medium transition",
        active
          ? "border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]"
          : "border-[#CBD5E1] bg-white/60 text-[#334155] hover:border-[#94A3B8] hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}

function CheckBox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-left text-[10px] text-[#334155]"
    >
      <span
        className={cx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border bg-white transition",
          checked ? "border-[#2563EB] bg-[#DBEAFE]" : "border-[#CBD5E1]",
        )}
      >
        {checked ? <Check className="h-3 w-3 text-[#2563EB]" /> : null}
      </span>
      {label}
    </button>
  );
}

function SectionCard({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_3px_12px_rgba(15,23,42,0.06)]">
      <div className="mb-3">
        <h2 className="text-[12px] font-bold text-[#2563EB]">
          {number}. {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[9.5px] leading-4 text-[#475569]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function AddressInputs({
  prefix,
  form,
  setText,
}: {
  prefix: "fatherAddress" | "grandfatherAddress";
  form: SpecialInformationFormState;
  setText: (key: StringKey, value: string) => void;
}) {
  const label =
    prefix === "fatherAddress" ? "father's address" : "grandfather's address";
  const key = (name: string) => `${prefix}${name}` as StringKey;
  const get = (name: string) => String(form[key(name)] ?? "");
  return (
    <div className="space-y-3">
      <FieldRow>
        <TextField
          label={`Division (${label})`}
          placeholder={`Division (${label})`}
          maxLength={30}
          list="special-district-list"
          value={get("Division")}
          onChange={(v) => setText(key("Division"), v)}
        />
        <TextField
          label={`District (${label})`}
          placeholder={`District (${label})`}
          maxLength={30}
          list="special-district-list"
          value={get("District")}
          onChange={(v) => setText(key("District"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={`Upazila / thana (${label})`}
          placeholder={`Upazila / thana (${label})`}
          maxLength={30}
          value={get("Upazila")}
          onChange={(v) => setText(key("Upazila"), v)}
        />
        <TextField
          label="Ward number"
          placeholder="e.g. 05"
          maxLength={2}
          inputMode="numeric"
          value={get("Ward")}
          onChange={(v) => setText(key("Ward"), digitString(v, 2))}
        />
      </FieldRow>
      <TextField
        label={`City corporation / municipality / union / cantonment board (${label})`}
        placeholder="City corporation / municipality / union / cantonment board"
        maxLength={70}
        value={get("City")}
        onChange={(v) => setText(key("City"), v)}
      />
      <FieldRow>
        <TextField
          label={`Mouza (${label})`}
          placeholder="Mouza"
          maxLength={40}
          value={get("Mouza")}
          onChange={(v) => setText(key("Mouza"), v)}
        />
        <TextField
          label={`Village / mahalla / road name and number (${label})`}
          placeholder="Village / mahalla / road"
          maxLength={60}
          value={get("Village")}
          onChange={(v) => setText(key("Village"), v)}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          label={`House / holding number (${label})`}
          placeholder="House / holding number"
          maxLength={30}
          value={get("House")}
          onChange={(v) => setText(key("House"), v)}
        />
        <TextField
          label={`Post office (${label})`}
          placeholder="Post office"
          maxLength={30}
          value={get("PostOffice")}
          onChange={(v) => setText(key("PostOffice"), v)}
        />
      </FieldRow>
      <TextField
        label={`Post code (${label})`}
        placeholder="e.g. 1230"
        maxLength={4}
        inputMode="numeric"
        validate={validatePostCode}
        value={get("PostCode")}
        onChange={(v) => setText(key("PostCode"), digitString(v, 4))}
      />
    </div>
  );
}

function RelativeInputs({
  title,
  prefix,
  form,
  setText,
}: {
  title: string;
  prefix: "first" | "second" | "third";
  form: SpecialInformationFormState;
  setText: (key: StringKey, value: string) => void;
}) {
  const key = (name: string) => `${prefix}Relative${name}` as StringKey;
  const get = (name: string) => String(form[key(name)] ?? "");
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-[#475569]">{title}</p>
      <TextField
        label={`${title} — name`}
        placeholder={`${title} — name`}
        maxLength={60}
        value={get("Name")}
        onChange={(v) => setText(key("Name"), v)}
      />
      <FieldRow>
        <TextField
          label={`${title} — NID number`}
          placeholder="10, 13 or 17-digit NID"
          maxLength={17}
          inputMode="numeric"
          validate={validateNid}
          value={get("Nid")}
          onChange={(v) => setText(key("Nid"), digitString(v, 17))}
        />
        <TextField
          label={`${title} — relation`}
          placeholder={`${title} — relation`}
          maxLength={30}
          value={get("Relation")}
          onChange={(v) => setText(key("Relation"), v)}
        />
      </FieldRow>
      <FieldRow>
        <DateField
          label={`${title} — date of birth`}
          value={get("Dob")}
          onChange={(v) => setText(key("Dob"), v)}
        />
        <TextField
          label={`${title} — mobile`}
          placeholder="01783666743"
          maxLength={11}
          inputMode="tel"
          validate={validateMobile}
          value={get("Mobile")}
          onChange={(v) => setText(key("Mobile"), digitString(v, 11))}
        />
      </FieldRow>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*  Paper layout                                                                */
/* -------------------------------------------------------------------------- */

let measureCtx: CanvasRenderingContext2D | null | undefined;
const measureCache = new Map<string, number>();

function measureBold(text: string, size: number) {
  const key = `${text}|${size}`;
  let measured = measureCache.get(key);
  if (measured === undefined) {
    if (measureCtx === undefined) {
      measureCtx =
        typeof document !== "undefined"
          ? document.createElement("canvas").getContext("2d")
          : null;
    }

    if (measureCtx) {
      measureCtx.font = `700 ${size * 100}px ${FORM_FONT}`;
      measured = Math.max(measureCtx.measureText(text).width / 100, 0.01);
    } else {
      measured = Math.max(Array.from(text).length * size * 0.62, 0.01);
    }

    measureCache.set(key, measured);
  }
  return measured;
}

function fitSize(text: string, width: number, base: number, min = 0.45 * base) {
  if (!text) return base;
  const safeWidth = Math.max(width, 1);
  const measured = measureBold(text, base);
  if (measured <= safeWidth) return base;
  return Math.max(min, base * (safeWidth / measured));
}

const PAPER_CONTENT_WIDTH = PAPER_W - 70;

function PaperValue({
  text,
  width,
  size = 7.2,
  align = "left",
}: {
  text: string;
  width: number;
  size?: number;
  align?: "left" | "center" | "right";
}) {
  const value = text.trim();
  const fontSize = fitSize(value, Math.max(width - 4, 1), size);

  return (
    <span
      style={{
        display: "block",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "clip",
        textAlign: align,
        fontSize: `${fontSize}em`,
        fontWeight: 700,
        lineHeight: 1.1,
        padding: "0 2em 0.25em",
        boxSizing: "border-box",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
}

function PaperLine({
  label,
  value = "",
  labelSize = 7.2,
  valueSize = 7.2,
  height = 16.5,
  gap = 3,
}: {
  label: string;
  value?: string;
  labelSize?: number;
  valueSize?: number;
  height?: number;
  gap?: number;
}) {
  const labelWidth = label ? measureBold(label, labelSize) : 0;
  const valueWidth = Math.max(PAPER_CONTENT_WIDTH - labelWidth - gap, 1);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "max-content minmax(0, 1fr)",
        alignItems: "end",
        columnGap: `${gap}em`,
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          minWidth: 0,
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>

      <div
        style={{
          minWidth: 0,
          width: "100%",
          overflow: "hidden",
          borderBottom: `0.8px dotted ${INK}`,
          boxSizing: "border-box",
        }}
      >
        <PaperValue text={value} width={valueWidth} size={valueSize} />
      </div>
    </div>
  );
}

function PaperInlineFields({
  columns,
  height = 16.5,
}: {
  columns: Array<
    | { type: "label"; text: string; size?: number }
    | { type: "value"; text: string; width?: number; size?: number }
  >;
  height?: number;
}) {
  const template = columns
    .map((column) =>
      column.type === "label"
        ? "max-content"
        : column.width
          ? `minmax(0, ${column.width}em)`
          : "minmax(0, 1fr)",
    )
    .join(" ");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: template,
        alignItems: "end",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {columns.map((column, index) => {
        if (column.type === "label") {
          return (
            <span
              key={`${column.text}-${index}`}
              style={{
                whiteSpace: "nowrap",
                fontSize: `${column.size ?? 7}em`,
                lineHeight: 1.1,
              }}
            >
              {column.text}
            </span>
          );
        }

        return (
          <div
            key={`value-${index}`}
            style={{
              minWidth: 0,
              width: "100%",
              overflow: "hidden",
              borderBottom: `0.8px dotted ${INK}`,
              boxSizing: "border-box",
            }}
          >
            <PaperValue
              text={column.text}
              width={column.width ?? 100}
              size={column.size ?? 7}
            />
          </div>
        );
      })}
    </div>
  );
}

function PaperBoxes({
  value = "",
  count,
  width,
  height = 12.5,
  fontSize = 8.1,
}: {
  value?: string;
  count: number;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const chars = Array.from(value).slice(0, count);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        width: width ? `${width}em` : "100%",
        maxWidth: "100%",
        height: `${height}em`,
        minWidth: 0,
        border: `0.8px solid ${INK}`,
        boxSizing: "border-box",
        overflow: "hidden",
        background: PAPER,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            overflow: "hidden",
            borderLeft: index === 0 ? undefined : `0.8px solid ${INK}`,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              display: "block",
              maxWidth: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontSize: `${fontSize}em`,
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {chars[index] ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function PaperWideField({
  text,
  width = 112,
  height = 12,
  fontSize = 7,
}: {
  text: string;
  width?: number;
  height?: number;
  fontSize?: number;
}) {
  const value = text.trim();
  const size = fitSize(value, Math.max(width - 6, 1), fontSize);

  return (
    <div
      style={{
        width: `${width}em`,
        maxWidth: "100%",
        height: `${height}em`,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        padding: "0 3em",
        border: `0.8px solid ${INK}`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          display: "block",
          minWidth: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "clip",
          fontSize: `${size}em`,
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PaperCheckBox({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4em",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "13em",
          height: "13em",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `0.8px solid ${INK}`,
          boxSizing: "border-box",
        }}
      >
        {checked ? (
          <span
            style={{
              fontSize: "10em",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            ✓
          </span>
        ) : null}
      </span>

      <span
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "clip",
          fontSize: "6.6em",
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PaperBoxField({
  label,
  value,
  count,
  width,
  labelSize = 7,
  boxFontSize = 8,
  height = 16.5,
  trailing,
}: {
  label: string;
  value: string;
  count: number;
  width: number;
  labelSize?: number;
  boxFontSize?: number;
  height?: number;
  trailing?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `max-content minmax(0, ${width}em) minmax(0, 1fr)`,
        alignItems: "center",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>

      <PaperBoxes
        value={value}
        count={count}
        width={width}
        height={12.5}
        fontSize={boxFontSize}
      />

      <div
        style={{
          minWidth: 0,
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {trailing}
      </div>
    </div>
  );
}

function PaperDateRow({
  label,
  value,
  width = 66,
  labelSize = 7.0,
  boxFontSize = 8,
  height = 16.5,
}: {
  label: string;
  value: string;
  width?: number;
  labelSize?: number;
  boxFontSize?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `max-content minmax(0, ${width}em)`,
        alignItems: "center",
        columnGap: "3em",
        height: `${height}em`,
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: `${labelSize}em`,
          lineHeight: 1.1,
        }}
      >
        {label}
      </span>
      <PaperBoxes
        value={digitString(value, 8)}
        count={8}
        width={width}
        height={12}
        fontSize={boxFontSize}
      />
    </div>
  );
}

function PaperSpacer({ height }: { height: number }) {
  return <div aria-hidden style={{ height: `${height}em` }} />;
}

function PaperSignatureLine({
  label,
  width = 110,
  align = "left",
}: {
  label: string;
  width?: number;
  align?: "left" | "center";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: `${width}em`,
        maxWidth: "100%",
        gap: "4em",
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "10em",
          borderBottom: `0.8px dotted ${INK}`,
        }}
      />
      <span
        style={{
          fontSize: "6.6em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function AddressPaperBlock({
  title,
  data,
  prefix,
}: {
  title: string;
  data: SpecialInformationFormState;
  prefix: "fatherAddress" | "grandfatherAddress";
}) {
  const get = (name: string) =>
    String(data[`${prefix}${name}` as FormKey] ?? "").trim();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: `${title} বিভাগঃ`, size: 7.2 },
          { type: "value", text: get("Division"), width: 60, size: 7 },
          { type: "label", text: "জেলাঃ", size: 7.2 },
          { type: "value", text: get("District"), width: 63, size: 7 },
          { type: "label", text: "উপজেলা/থানাঃ", size: 7.2 },
          { type: "value", text: get("Upazila"), size: 7 },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          {
            type: "label",
            text: "সিটি কর্পোরেশন/পৌরসভা/ইউনিয়ন/ক্যান্টঃ বোর্ডঃ",
            size: 6.5,
          },
          { type: "value", text: get("City"), width: 166, size: 6.8 },
          { type: "label", text: "ওয়ার্ড নম্বরঃ", size: 6.8 },
          {
            type: "value",
            text: digitString(get("Ward"), 2),
            width: 45,
            size: 8,
          },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "মৌজাঃ", size: 6.9 },
          { type: "value", text: get("Mouza"), width: 118, size: 6.9 },
          {
            type: "label",
            text: "গ্রাম/মহল্লা/রাস্তার নাম ও নম্বরঃ",
            size: 6.5,
          },
          { type: "value", text: get("Village"), size: 6.8 },
        ]}
      />

      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "বাসা/হোল্ডিং নংঃ", size: 6.8 },
          { type: "value", text: get("House"), width: 86, size: 6.8 },
          { type: "label", text: "ডাকঘরঃ", size: 6.8 },
          { type: "value", text: get("PostOffice"), width: 95, size: 6.8 },
          { type: "label", text: "পোস্ট কোডঃ", size: 6.8 },
          {
            type: "value",
            text: digitString(get("PostCode"), 4),
            width: 81,
            size: 8.1,
          },
        ]}
      />
    </div>
  );
}

function PageHeader({ form2Number }: { form2Number: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "35em",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          textAlign: "center",
          fontSize: "7.7em",
          fontWeight: 700,
          lineHeight: 1.35,
          whiteSpace: "nowrap",
        }}
      >
        আবেদনকারীর বিশেষ তথ্য ফরম (ফরম-২ এর অতিরিক্ত তথ্য)
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "4em",
          minWidth: 0,
          marginTop: "5em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "7.2em", whiteSpace: "nowrap" }}>
          ফরম-২ এর নম্বরঃ
        </span>
        <PaperWideField
          text={form2Number}
          width={112}
          height={12}
          fontSize={6.8}
        />
      </div>
    </div>
  );
}

function RelativePaperBlock({
  keyLabel,
  relative,
}: {
  keyLabel: string;
  relative: {
    name: string;
    nid: string;
    relation: string;
    dob: string;
    mobile: string;
  };
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <PaperLine
        label={`(${keyLabel}) নামঃ`}
        value={relative.name}
        labelSize={7}
        valueSize={7}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "max-content minmax(0, 1fr) max-content minmax(0, 60em)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "6.6em" }}>
          NID নম্বরঃ
        </span>
        <PaperBoxes
          value={digitString(relative.nid, 17)}
          count={17}
          height={12}
          fontSize={7.9}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "6.6em" }}>
          সম্পর্কঃ
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={relative.relation} width={60} size={7} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 85em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "6.5em" }}>
          জন্ম তারিখঃ
        </span>
        <PaperBoxes
          value={relative.dob}
          count={8}
          width={85}
          height={12}
          fontSize={7.9}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "6.5em" }}>
          মোবাইল (ব্যক্তির নামেঃ)
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={relative.mobile} width={150} size={7} />
        </div>
      </div>
    </div>
  );
}

function SpecialPage1({ d }: { d: SpecialInformationFormState }) {
  const relatives = [
    {
      keyLabel: "ক",
      name: d.firstRelativeName.trim(),
      nid: d.firstRelativeNid,
      relation: d.firstRelativeRelation.trim(),
      dob: String(d.firstRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.firstRelativeMobile.trim(),
    },
    {
      keyLabel: "খ",
      name: d.secondRelativeName.trim(),
      nid: d.secondRelativeNid,
      relation: d.secondRelativeRelation.trim(),
      dob: String(d.secondRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.secondRelativeMobile.trim(),
    },
    {
      keyLabel: "গ",
      name: d.thirdRelativeName.trim(),
      nid: d.thirdRelativeNid,
      relation: d.thirdRelativeRelation.trim(),
      dob: String(d.thirdRelativeDob ?? "").replace(/\D/g, ""),
      mobile: d.thirdRelativeMobile.trim(),
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "10em 35em 10em",
      }}
    >
      <PageHeader form2Number={d.form2Number} />
      <PaperSpacer height={25} />

      <PaperLine
        label="১। নাম (বাংলায়):"
        value={d.nameBn}
        labelSize={7.7}
        valueSize={8}
      />
      <PaperLine
        label="২। পিতা/স্বামীর নাম:"
        value={d.fatherHusbandName}
        labelSize={7.7}
        valueSize={8}
      />

      <PaperSpacer height={2} />
      <AddressPaperBlock
        title="৩। পিতা/স্বামীর স্থায়ী ঠিকানা:"
        data={d}
        prefix="fatherAddress"
      />

      <PaperSpacer height={1.5} />
      <PaperLine
        label="৪। পিতা/স্বামী/মাতা জীবিত না থাকিলে অভিভাবকের তথ্য দিন: অভিভাবকের নামঃ"
        value={d.guardianName}
        labelSize={7.2}
        valueSize={7.4}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "max-content minmax(0, 247em) max-content minmax(0, 64em)",
          alignItems: "center",
          columnGap: "3em",
          height: "16.5em",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.1em" }}>
          NID নম্বরঃ
        </span>
        <PaperBoxes
          value={digitString(d.guardianNid, 17)}
          count={17}
          width={247}
          height={12.5}
          fontSize={8.2}
        />
        <span style={{ whiteSpace: "nowrap", fontSize: "7em" }}>সম্পর্কঃ</span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.guardianRelation} width={64} size={7.5} />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 66em",
          alignItems: "center",
          gap: "3em",
          height: "16.5em",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.1em" }}>
          জন্ম তারিখঃ
        </span>
        <PaperBoxes
          value={digitString(d.guardianDob.replace(/\D/g, ""), 8)}
          count={8}
          width={66}
          height={12}
          fontSize={8.1}
        />
      </div>

      <PaperSpacer height={5} />
      <PaperLine
        label="৫। পিতামহের নামঃ"
        value={d.grandfatherName}
        labelSize={7.5}
        valueSize={7.8}
      />

      <PaperBoxField
        label="৬। পিতামহের NID নম্বরঃ"
        value={
          d.grandfatherNidNotApplicable ? "" : digitString(d.grandfatherNid, 17)
        }
        count={17}
        width={238}
        labelSize={7.5}
        boxFontSize={8.1}
        trailing={
          <PaperCheckBox
            checked={d.grandfatherNidNotApplicable}
            label="প্রযোজ্য নয়ঃ"
          />
        }
      />

      <PaperSpacer height={2} />
      <AddressPaperBlock
        title="৭। পিতামহের স্থায়ী ঠিকানা:"
        data={d}
        prefix="grandfatherAddress"
      />

      <PaperSpacer height={2.5} />
      <div style={{ fontSize: "6.9em", lineHeight: 1.2 }}>
        ৮। জাতীয় পরিচয়পত্র প্রাপ্ত আপন তিন জনের (ভাই/বোন/চাচা/ফুফু এই
        ক্রমানুসারে) বিবরণ দিনঃ
      </div>
      <PaperSpacer height={1.5} />

      {relatives.map((relative) => (
        <RelativePaperBlock
          key={relative.keyLabel}
          keyLabel={relative.keyLabel}
          relative={relative}
        />
      ))}

      <PaperSpacer height={3} />
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12em",
          minHeight: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ whiteSpace: "nowrap", fontSize: "7.2em" }}>
          ৯। বর্তমান ঠিকানার বিবরণঃ
        </span>
        <PaperCheckBox
          checked={d.presentHoldingType === "Own property"}
          label="নিজস্ব মালিকানাধীন"
        />
        <PaperCheckBox
          checked={d.presentHoldingType === "Rented"}
          label="ভাড়া"
        />
        <PaperCheckBox
          checked={d.presentHoldingType === "Other"}
          label="অন্যান্য"
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          minHeight: "18em",
          gap: "4em",
          fontSize: "6.3em",
          overflow: "hidden",
        }}
      >
        (ক) নিজস্ব মালিকানার ক্ষেত্রে: জমির দলিলের ফটোকপি সংযুক্ত করিতে হইবেঃ
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 82em max-content 82em max-content",
          alignItems: "center",
          columnGap: "5em",
          minHeight: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          (খ) ভাড়ার ক্ষেত্রে: অবস্থানের মেয়াদ:
        </span>
        <PaperBoxes
          value={digitString(d.residenceStartDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>হইতে</span>
        <PaperBoxes
          value={digitString(d.residenceEndDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>পর্যন্ত</span>
      </div>

      <PaperSpacer height={17} />
      <div
        style={{
          fontSize: "5.8em",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        }}
      >
        বিশেষ তথ্য ফরমের পরবর্তী অংশের তথ্য পরবর্তী পৃষ্ঠায় প্রদান করতে হবে।
      </div>
    </div>
  );
}

function SpecialPage2({ d }: { d: SpecialInformationFormState }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "10em 35em 10em",
      }}
    >
      <PaperSpacer height={8} />

      <PaperLine
        label="(গ) অন্যান্য ক্ষেত্রে: বাড়ির মালিকের নামঃ"
        value={d.ownerOtherName}
        labelSize={6.6}
        valueSize={7}
      />

      <PaperBoxField
        label="বাড়ির মালিকের NID নম্বরঃ"
        value={digitString(d.ownerOtherNid, 17)}
        count={17}
        width={264}
        labelSize={6.6}
        boxFontSize={8}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 82em max-content 82em",
          alignItems: "center",
          columnGap: "6em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          অবস্থানকাল:
        </span>
        <PaperBoxes
          value={digitString(d.residenceStartDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.3em", whiteSpace: "nowrap" }}>হইতে</span>
        <PaperBoxes
          value={digitString(d.residenceEndDate.replace(/\D/g, ""), 8)}
          count={8}
          width={82}
          height={11.8}
          fontSize={7.7}
        />
      </div>

      <PaperSpacer height={2} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 87em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "5em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.6em", whiteSpace: "nowrap" }}>
          বাংলাদেশে আগমনের তারিখঃ
        </span>
        <PaperBoxes
          value={digitString(d.abroadArrivalDate.replace(/\D/g, ""), 8)}
          count={8}
          width={87}
          height={12}
          fontSize={7.8}
        />
        <span
          style={{
            fontSize: "6.2em",
            whiteSpace: "nowrap",
          }}
        >
          পাসপোর্টের বিবরণ: প্রদানের তারিখঃ
        </span>
        <PaperBoxes
          value={digitString(d.passportIssueDate.replace(/\D/g, ""), 8)}
          count={8}
          width={76}
          height={12}
          fontSize={7.5}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content minmax(0, 1fr) max-content 79em",
          alignItems: "center",
          columnGap: "5em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.6em", whiteSpace: "nowrap" }}>
          প্রদানের স্থানঃ
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.passportIssuePlace} width={159} size={7} />
        </div>
        <span style={{ fontSize: "6.5em", whiteSpace: "nowrap" }}>
          মেয়াদ উত্তীর্ণের তারিখঃ
        </span>
        <PaperBoxes
          value={digitString(d.passportExpiryDate.replace(/\D/g, ""), 8)}
          count={8}
          width={79}
          height={12}
          fontSize={7.5}
        />
      </div>

      <PaperSpacer height={3} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 87em max-content minmax(0, 1fr)",
          alignItems: "center",
          columnGap: "4em",
          height: "18em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "7em", whiteSpace: "nowrap" }}>
          ১১। বর্তমান পেশা গ্রহণের তারিখঃ
        </span>
        <PaperBoxes
          value={digitString(d.occupationJoinDate.replace(/\D/g, ""), 8)}
          count={8}
          width={87}
          height={12}
          fontSize={7.7}
        />
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          নিয়োগকারীর নামঃ
        </span>
        <div
          style={{
            minWidth: 0,
            overflow: "hidden",
            borderBottom: `0.8px dotted ${INK}`,
          }}
        >
          <PaperValue text={d.employerName} width={80} size={6.9} />
        </div>
      </div>

      <PaperLine
        label="নিয়োগকারীর ঠিকানাঃ"
        value={d.employerAddress}
        labelSize={6.6}
        valueSize={7}
      />
      <PaperInlineFields
        height={16.5}
        columns={[
          { type: "label", text: "", size: 6.6 },
          { type: "value", text: d.employerAddress2, width: 208, size: 7 },
          { type: "label", text: "মোবাইলঃ", size: 6.3 },
          { type: "value", text: d.employerMobile, width: 63, size: 6.8 },
        ]}
      />

      <PaperSpacer height={4} />

      <div style={{ fontSize: "6.9em", lineHeight: 1.2 }}>
        ১২। সর্বশেষ দুইটি শিক্ষা প্রতিষ্ঠানের বিবরণঃ
      </div>

      <PaperSpacer height={2} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperLine
          label="(ক) শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানাঃ"
          value={d.firstInstitutionNameAddress}
          labelSize={6.4}
          valueSize={6.9}
        />
        <PaperInlineFields
          height={16.5}
          columns={[
            { type: "label", text: "অধ্যয়নকালঃ", size: 6.2 },
            { type: "value", text: d.firstStudyFrom, width: 84, size: 6.7 },
            { type: "label", text: "হইতে", size: 6.1 },
            { type: "value", text: d.firstStudyTo, width: 83, size: 6.7 },
            {
              type: "label",
              text: "পর্যন্ত, অর্জিত শিক্ষাগত যোগ্যতাঃ",
              size: 6,
            },
          ]}
        />
        <PaperLine
          label=""
          value={d.firstQualification}
          labelSize={6.2}
          valueSize={6.8}
        />
      </div>

      <PaperSpacer height={2} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperLine
          label="(খ) শিক্ষা প্রতিষ্ঠানের নাম ও ঠিকানাঃ"
          value={d.secondInstitutionNameAddress}
          labelSize={6.4}
          valueSize={6.9}
        />
        <PaperInlineFields
          height={16.5}
          columns={[
            { type: "label", text: "অধ্যয়নকালঃ", size: 6.2 },
            { type: "value", text: d.secondStudyFrom, width: 84, size: 6.7 },
            { type: "label", text: "হইতে", size: 6.1 },
            { type: "value", text: d.secondStudyTo, width: 83, size: 6.7 },
            {
              type: "label",
              text: "পর্যন্ত, অর্জিত শিক্ষাগত যোগ্যতাঃ",
              size: 6,
            },
          ]}
        />
        <PaperLine
          label=""
          value={d.secondQualification}
          labelSize={6.2}
          valueSize={6.8}
        />
      </div>

      <PaperSpacer height={5} />

      <div
        style={{
          fontSize: "6.7em",
          lineHeight: 1.25,
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        ১৩। আবেদনকারীর প্রত্যয়নঃ আমি বাংলাদেশের নাগরিক এবং এই ফরমে বর্ণিত তথ্য
        আমার জ্ঞান ও বিশ্বাস মতে সম্পূর্ণ সত্য;
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 90em",
          alignItems: "end",
          columnGap: "4em",
          height: "22em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "5em", whiteSpace: "nowrap" }}>
          স্বাক্ষর/টিপসহিঃ
        </span>
        <div
          style={{
            width: "100%",
            minWidth: 0,
            borderBottom: `0.8px dotted ${INK}`,
          }}
        />
      </div>

      <PaperBoxField
        label="১৪। তথ্য সংগ্রহকারীর NID নম্বরঃ"
        value={digitString(d.dataCollectorNid, 17)}
        count={17}
        width={252}
        labelSize={7}
        boxFontSize={8.1}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 111em",
          alignItems: "end",
          columnGap: "4em",
          height: "22em",
          overflow: "hidden",
        }}
      >
        <span style={{ fontSize: "6.7em", whiteSpace: "nowrap" }}>
          স্বাক্ষরঃ
        </span>
        <div
          style={{
            width: "100%",
            minWidth: 0,
            borderBottom: `0.8px dotted ${INK}`,
          }}
        />
      </div>

      <PaperSpacer height={6} />

      <div style={{ fontSize: "7em", lineHeight: 1.2 }}>
        ১৫। বিশেষ কমিটির সিদ্ধান্তঃ
      </div>

      <PaperSpacer height={28} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30em",
          alignItems: "end",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <PaperSignatureLine
          label="সদস্য সচিবের স্বাক্ষর ও তারিখঃ"
          width={161}
          align="center"
        />
        <PaperSignatureLine
          label="আহ্বায়কের স্বাক্ষর ও তারিখঃ"
          width={161}
          align="center"
        />
      </div>
    </div>
  );
}

function FormPage({
  page,
  data,
  unit,
}: {
  page: 1 | 2;
  data: SpecialInformationFormState;
  unit: string;
}) {
  return (
    <div
      data-form-page={page}
      style={{
        width: `${PAPER_W}em`,
        height: `${PAPER_H}em`,
        fontSize: unit,
        background: PAPER,
        color: INK,
        fontFamily: FORM_FONT,
        overflow: "hidden",
        lineHeight: 1,
        boxSizing: "border-box",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {page === 1 ? <SpecialPage1 d={data} /> : <SpecialPage2 d={data} />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Preview                                                                    */
/* -------------------------------------------------------------------------- */

function useElementWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function ScaledPaper({
  page,
  data,
}: {
  page: 1 | 2;
  data: SpecialInformationFormState;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(ref);
  return (
    <div
      ref={ref}
      data-special-paper={`page-${page}`}
      className="w-full overflow-hidden rounded-[2px] shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
      style={{ aspectRatio: `${PAPER_W}/${PAPER_H}`, background: PAPER }}
    >
      {width > 0 ? (
        <FormPage page={page} data={data} unit={`${width / PAPER_W}px`} />
      ) : null}
    </div>
  );
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 10;

function PreviewFrame({
  data,
  hasData,
}: {
  data: SpecialInformationFormState;
  hasData: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(100);
  const [panning, setPanning] = useState(false);
  const panRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    id: number;
  } | null>(null);

  const onPanStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const node = scrollRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (
      event.clientX - rect.left >= node.clientWidth ||
      event.clientY - rect.top >= node.clientHeight
    )
      return;
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: node.scrollLeft,
      top: node.scrollTop,
      id: event.pointerId,
    };
    node.setPointerCapture(event.pointerId);
    setPanning(true);
  };
  const onPanMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = panRef.current;
    const node = scrollRef.current;
    if (!start || !node) return;
    node.scrollLeft = start.left - (event.clientX - start.x);
    node.scrollTop = start.top - (event.clientY - start.y);
  };
  const onPanEnd = () => {
    const start = panRef.current;
    if (!start) return;
    panRef.current = null;
    setPanning(false);
    try {
      scrollRef.current?.releasePointerCapture(start.id);
    } catch {}
  };
  const updatePageFromScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    const viewport = node.getBoundingClientRect();
    const papers = Array.from(
      node.querySelectorAll<HTMLElement>("[data-special-paper]"),
    );
    let bestPage: 1 | 2 = 1;
    let bestVisible = -Infinity;
    papers.forEach((paper) => {
      const rect = paper.getBoundingClientRect();
      const visible =
        Math.min(rect.bottom, viewport.bottom) -
        Math.max(rect.top, viewport.top);
      if (visible > bestVisible) {
        bestVisible = visible;
        bestPage = paper.dataset.specialPaper === "page-2" ? 2 : 1;
      }
    });
    setPage(bestPage);
  }, []);
  useEffect(() => {
    updatePageFromScroll();
  }, [updatePageFromScroll, zoom]);
  const nudgeZoom = (delta: number) =>
    setZoom((current) =>
      Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current + delta)),
    );
  const jumpToPage = (target: 1 | 2) => {
    const node = scrollRef.current;
    if (!node) return;
    const paper = node.querySelector<HTMLElement>(
      `[data-special-paper="page-${target}"]`,
    );
    if (!paper) return;
    const top =
      paper.getBoundingClientRect().top -
      node.getBoundingClientRect().top +
      node.scrollTop -
      14;
    node.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    setPage(target);
  };
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-[0_5px_20px_rgba(15,23,42,0.08)]">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold text-[#0F172A]">
          Preview
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center overflow-hidden rounded-md border border-[#CBD5E1] bg-white/70">
            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              disabled={zoom <= ZOOM_MIN}
              onClick={() => nudgeZoom(-ZOOM_STEP)}
              className="h-full px-2 text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-11 text-center text-[10px] font-semibold text-[#475569]">
              {zoom}%
            </span>
            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              disabled={zoom >= ZOOM_MAX}
              onClick={() => nudgeZoom(ZOOM_STEP)}
              className="h-full px-2 text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Reset zoom"
              aria-label="Reset zoom to 100%"
              disabled={zoom === 100}
              onClick={() => setZoom(100)}
              className="h-full border-l border-[#CBD5E1] px-2 text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
          <span
            className={cx(
              "rounded-md px-2.5 py-1.5 text-[9px] font-semibold",
              hasData
                ? "bg-[#DBEAFE] text-[#1D4ED8]"
                : "bg-white text-[#475569]",
            )}
          >
            {hasData ? "Preview" : "Empty"}
          </span>
        </div>
      </div>
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] text-[#475569]">
        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-[#CBD5E1] bg-white">
          <Check className="h-2.5 w-2.5 text-[#64748B]" />
        </span>
        Live preview
      </div>
      <div className="relative rounded-lg bg-[#1E293B] p-3.5 shadow-inner">
        <div className="absolute right-6 top-6 z-20">
          <button
            type="button"
            onClick={() => jumpToPage(page === 1 ? 2 : 1)}
            title={page === 1 ? "Go to page 2" : "Go to page 1"}
            className="flex items-center gap-1 rounded-full bg-[#0F172A] px-2.5 py-1.5 text-[9px] font-semibold text-white shadow-lg"
          >
            Page {page} of 2 <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div
          ref={scrollRef}
          onScroll={updatePageFromScroll}
          onPointerDown={onPanStart}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
          onPointerCancel={onPanEnd}
          onDragStart={(event) => event.preventDefault()}
          className={cx(
            "relative max-h-[calc(100vh-250px)] min-h-[420px] select-none overflow-auto rounded-md bg-[#334155] px-3 py-3.5 sm:min-h-[620px] sm:px-8",
            panning ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <div
            className="mx-auto"
            style={{
              width: `${zoom}%`,
              maxWidth: zoom <= 100 ? "640px" : undefined,
            }}
          >
            <div className="space-y-4">
              <ScaledPaper page={1} data={data} />
              <ScaledPaper page={2} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Print / PDF                                                                */
/* -------------------------------------------------------------------------- */

const PRINT_CSS = `
#special-print-root { position: fixed; left: -10000px; top: 0; width: 210mm; background: #fff; pointer-events: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(#special-print-root) { display: none !important; }
  #special-print-root { position: static !important; left: auto !important; top: auto !important; width: 210mm !important; }
  #special-print-root .special-print-page { break-after: page; page-break-after: always; }
  #special-print-root .special-print-page:last-child { break-after: auto; page-break-after: auto; }
  #special-print-root, #special-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

function PrintRoot({
  data,
  mode,
}: {
  data: SpecialInformationFormState;
  mode: "print" | "pdf";
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div id="special-print-root" aria-hidden="true">
      {([1, 2] as const).map((page) => (
        <div
          key={page}
          id={`special-print-page-${page}`}
          className="special-print-page"
          style={{
            position: "relative",
            width: "210mm",
            height: mode === "pdf" ? "297mm" : "296.5mm",
            overflow: "hidden",
            background: PAPER,
          }}
        >
          <FormPage page={page} data={data} unit={`${210 / PAPER_W}mm`} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function SpecialInformationForm() {
  const [form, setForm] = useState<SpecialInformationFormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [mode, setMode] = useState<RenderMode>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pdfBusy = mode === "pdf";
  const hasData = useMemo(() => !isFormEmpty(form), [form]);

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const pushToast = useCallback(
    (kind: ToastKind, title: string, message: string) => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((current) => [
        ...current.slice(-3),
        { id, kind, title, message },
      ]);
      toastTimers.current.set(
        id,
        setTimeout(() => dismissToast(id), 4000),
      );
    },
    [dismissToast],
  );
  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const saved = safeReadJson(STORAGE_KEY);
    if (saved) setForm(saved);
    try {
      setFavorite(window.localStorage.getItem(FAVORITE_KEY) === "1");
      setUsedCount(
        Math.max(0, Number(window.localStorage.getItem(USED_KEY)) || 0),
      );
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (isFormEmpty(form)) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        const json = JSON.stringify(form);
        window.localStorage.setItem(STORAGE_KEY, json);
        window.localStorage.setItem(LAST_KEY, json);
      }
    } catch {}
  }, [form, hydrated]);

  const setField = useCallback(
    <K extends FormKey>(key: K, value: SpecialInformationFormState[K]) => {
      setForm(
        (current) =>
          ({ ...current, [key]: value }) as SpecialInformationFormState,
      );
    },
    [],
  );
  const setText = useCallback(
    (key: StringKey, value: string) => setField(key, value),
    [setField],
  );
  const setHoldingType = (
    value: SpecialInformationFormState["presentHoldingType"],
  ) =>
    setField(
      "presentHoldingType",
      form.presentHoldingType === value ? "" : value,
    );

  const clearAll = () => {
    if (!hasData) return;
    try {
      window.localStorage.setItem(LAST_KEY, JSON.stringify(form));
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setForm({ ...EMPTY_FORM });
    pushToast("info", "Cleared", "All fields have been reset.");
  };
  const restoreLast = () => {
    const saved = safeReadJson(LAST_KEY);
    if (!saved || isFormEmpty(saved)) {
      pushToast(
        "info",
        "Nothing to restore",
        "There is no previously saved form on this device.",
      );
      return;
    }
    setForm(saved);
    pushToast("success", "Restored", "Your last form has been loaded.");
  };
  const toggleFavorite = () => {
    setFavorite((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(FAVORITE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };
  const bumpUsage = () => {
    setUsedCount((count) => {
      const next = count + 1;
      try {
        window.localStorage.setItem(USED_KEY, String(next));
      } catch {}
      return next;
    });
  };
  const share = async () => {
    const url = window.location.href;
    const payload = {
      title: "Special Information Form",
      text: "Fill in the Special Information Form online.",
      url,
    };
    try {
      if (typeof navigator.share === "function") await navigator.share(payload);
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        pushToast(
          "success",
          "Link copied",
          "The page link is on your clipboard.",
        );
      } else
        pushToast(
          "error",
          "Could not share",
          "Sharing is not supported in this browser.",
        );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      pushToast(
        "error",
        "Could not share",
        "Sharing was blocked by the browser.",
      );
    }
  };

  useEffect(() => {
    const before = () =>
      flushSync(() => setMode((current) => current ?? "print"));
    const after = () =>
      flushSync(() =>
        setMode((current) => (current === "print" ? null : current)),
      );
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  const print = async () => {
    if (mode === "pdf") return;
    flushSync(() => setMode("print"));
    await waitForFonts();
    bumpUsage();
    window.print();
  };
  const downloadPdf = async () => {
    if (mode) return;
    flushSync(() => setMode("pdf"));
    try {
      await waitForFonts();
      const pages = [1, 2].map((n) =>
        document.getElementById(`special-print-page-${n}`),
      );
      if (pages.some((node) => !node))
        throw new Error("Printable pages were not found.");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      pdf.setProperties({
        title: "Special Information Form",
        subject: "Form-2 additional information",
      });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index] as HTMLElement, {
          backgroundColor: PAPER,
          scale: 3,
          useCORS: true,
          logging: false,
          onclone: (clonedDocument) => {
            const root = clonedDocument.getElementById("special-print-root");
            if (root) {
              root.style.left = "0";
              root.style.top = "0";
            }
          },
        });
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST",
        );
      }
      const slug = form.nameBn
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      pdf.save(
        slug
          ? `special-information-form-${slug}.pdf`
          : "special-information-form.pdf",
      );
      bumpUsage();
      pushToast(
        "success",
        "PDF ready",
        "Your 2-page Special Information Form has been downloaded.",
      );
    } catch {
      pushToast(
        "error",
        "PDF failed",
        "The PDF could not be created. Please try again or use Print → Save as PDF.",
      );
    } finally {
      setMode(null);
    }
  };

  return (
    <div
      className="relative -mx-4 -mt-6 min-h-[calc(100vh-72px)] px-4 pb-28 pt-5 text-[#0F172A] [clip-path:inset(0_-100vmax)] print:bg-white print:shadow-none"
      style={{ backgroundColor: "#F8FAFC", boxShadow: "0 0 0 100vmax #F8FAFC" }}
    >
      <style>
        {PRINT_CSS +
          `
html, body { background: #F8FAFC; }
`}
      </style>
      <datalist id="special-district-list">
        {DISTRICTS.map(([bn, en]) => (
          <option key={en} value={bn} label={en} />
        ))}
      </datalist>
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[9px] text-[#64748B]">
          <span>⌂</span>
          <span>/</span>
          <span>Sohoz Tools</span>
          <span>/</span>
          <span>General Tools</span>
          <span>/</span>
          <span className="font-semibold text-[#475569]">
            Special Information Form
          </span>
        </div>
        <div className="mb-4 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                <ClipboardList className="h-4 w-4" />
              </span>
              <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#0F172A]">
                Special Information Form
              </h1>
              <span className="rounded-full bg-[#D1FAE5] px-2 py-1 text-[9px] font-bold text-[#047857]">
                Free
              </span>
              <span className="text-[9px] text-[#64748B]">
                ✓ Used {usedCount} {usedCount === 1 ? "time" : "times"}
              </span>
            </div>
            <p className="mt-1 pl-10 text-[10px] text-[#475569]">
              Fill in your details on the left — see the live form on the right
              and download it as PDF.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-lg border bg-white/60 transition",
                favorite
                  ? "border-[#93C5FD] text-[#2563EB]"
                  : "border-[#CBD5E1] text-[#64748B] hover:bg-white",
              )}
            >
              <Star className={cx("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              title="Share"
              aria-label="Share"
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white/60 text-[#64748B] transition hover:bg-white"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-3.5 lg:grid-cols-[295px_minmax(0,1fr)]">
          <div className="space-y-3.5">
            <SectionCard number={1} title="Applicant">
              <div className="space-y-3">
                <TextField
                  label="Form-2 number"
                  placeholder="Form-2 number"
                  maxLength={24}
                  value={form.form2Number}
                  onChange={(v) => setText("form2Number", v)}
                />
                <TextField
                  label="Name (in Bangla)"
                  placeholder="Name (in Bangla)"
                  maxLength={60}
                  value={form.nameBn}
                  onChange={(v) => setText("nameBn", v)}
                />
                <TextField
                  label="Father's / husband's name"
                  placeholder="Father's / husband's name"
                  maxLength={60}
                  value={form.fatherHusbandName}
                  onChange={(v) => setText("fatherHusbandName", v)}
                />
              </div>
            </SectionCard>

            <SectionCard
              number={2}
              title="Father's / husband's permanent address"
            >
              <AddressInputs
                prefix="fatherAddress"
                form={form}
                setText={setText}
              />
            </SectionCard>

            <SectionCard
              number={3}
              title="Guardian"
              description="Fill this in only when the parents or husband are no longer living."
            >
              <div className="space-y-3">
                <TextField
                  label="Guardian's name"
                  placeholder="Guardian's name"
                  maxLength={60}
                  value={form.guardianName}
                  onChange={(v) => setText("guardianName", v)}
                />
                <FieldRow>
                  <TextField
                    label="Guardian's NID number"
                    placeholder="10, 13 or 17-digit NID"
                    maxLength={17}
                    inputMode="numeric"
                    validate={validateNid}
                    value={form.guardianNid}
                    onChange={(v) => setText("guardianNid", digitString(v, 17))}
                  />
                  <TextField
                    label="Relation to guardian"
                    placeholder="Relation to guardian"
                    maxLength={30}
                    value={form.guardianRelation}
                    onChange={(v) => setText("guardianRelation", v)}
                  />
                </FieldRow>
                <DateField
                  label="Guardian's date of birth"
                  value={form.guardianDob}
                  onChange={(v) => setText("guardianDob", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number={4} title="Paternal grandfather">
              <div className="space-y-3">
                <TextField
                  label="Paternal grandfather's name"
                  placeholder="Paternal grandfather's name"
                  maxLength={60}
                  value={form.grandfatherName}
                  onChange={(v) => setText("grandfatherName", v)}
                />
                <TextField
                  label="Grandfather's NID number"
                  placeholder="10, 13 or 17-digit NID"
                  maxLength={17}
                  inputMode="numeric"
                  disabled={form.grandfatherNidNotApplicable}
                  validate={validateNid}
                  value={form.grandfatherNid}
                  onChange={(v) =>
                    setText("grandfatherNid", digitString(v, 17))
                  }
                />
                <CheckBox
                  checked={form.grandfatherNidNotApplicable}
                  label="Grandfather's NID not applicable"
                  onChange={(v) => setField("grandfatherNidNotApplicable", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number={5} title="Grandfather's permanent address">
              <AddressInputs
                prefix="grandfatherAddress"
                form={form}
                setText={setText}
              />
            </SectionCard>

            <SectionCard
              number={6}
              title="Three NID-holding relatives"
              description="Brother / sister / uncle / aunt, in that order."
            >
              <div className="space-y-5">
                <RelativeInputs
                  title="First relative"
                  prefix="first"
                  form={form}
                  setText={setText}
                />
                <RelativeInputs
                  title="Second relative"
                  prefix="second"
                  form={form}
                  setText={setText}
                />
                <RelativeInputs
                  title="Third relative"
                  prefix="third"
                  form={form}
                  setText={setText}
                />
              </div>
            </SectionCard>

            <SectionCard number={7} title="Present address">
              <div className="space-y-3">
                <div>
                  <FieldLabel>How the present address is held</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {HOLDING_OPTIONS.map((option) => (
                      <ChoicePill
                        key={option}
                        active={form.presentHoldingType === option}
                        onClick={() => setHoldingType(option)}
                      >
                        {option}
                      </ChoicePill>
                    ))}
                  </div>
                </div>
                {form.presentHoldingType === "Other" ? (
                  <>
                    <TextField
                      label="Owner's name (other)"
                      placeholder="Owner's name (other)"
                      maxLength={60}
                      value={form.ownerOtherName}
                      onChange={(v) => setText("ownerOtherName", v)}
                    />
                    <TextField
                      label="Owner's NID (other)"
                      placeholder="10, 13 or 17-digit NID"
                      maxLength={17}
                      inputMode="numeric"
                      validate={validateNid}
                      value={form.ownerOtherNid}
                      onChange={(v) =>
                        setText("ownerOtherNid", digitString(v, 17))
                      }
                    />
                  </>
                ) : null}
                {form.presentHoldingType === "Rented" ||
                form.presentHoldingType === "Other" ? (
                  <FieldRow>
                    <DateField
                      label={`Residence start date (${form.presentHoldingType.toLowerCase()})`}
                      value={form.residenceStartDate}
                      onChange={(v) => setText("residenceStartDate", v)}
                    />
                    <DateField
                      label={`Residence end date (${form.presentHoldingType.toLowerCase()})`}
                      value={form.residenceEndDate}
                      onChange={(v) => setText("residenceEndDate", v)}
                    />
                  </FieldRow>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard
              number={8}
              title="Applicants born abroad"
              description="Born outside Bangladesh? Add passport and arrival details."
            >
              <div className="space-y-3">
                <FieldRow>
                  <DateField
                    label="Date of arrival in Bangladesh"
                    value={form.abroadArrivalDate}
                    onChange={(v) => setText("abroadArrivalDate", v)}
                  />
                  <DateField
                    label="Passport issue date"
                    value={form.passportIssueDate}
                    onChange={(v) => setText("passportIssueDate", v)}
                  />
                </FieldRow>
                <FieldRow>
                  <TextField
                    label="Passport issue place"
                    placeholder="Passport issue place"
                    maxLength={50}
                    value={form.passportIssuePlace}
                    onChange={(v) => setText("passportIssuePlace", v)}
                  />
                  <DateField
                    label="Passport expiry date"
                    value={form.passportExpiryDate}
                    onChange={(v) => setText("passportExpiryDate", v)}
                  />
                </FieldRow>
              </div>
            </SectionCard>

            <SectionCard number={9} title="Present occupation">
              <div className="space-y-3">
                <FieldRow>
                  <DateField
                    label="Date joined present occupation"
                    value={form.occupationJoinDate}
                    onChange={(v) => setText("occupationJoinDate", v)}
                  />
                  <TextField
                    label="Employer's name"
                    placeholder="Employer's name"
                    maxLength={60}
                    value={form.employerName}
                    onChange={(v) => setText("employerName", v)}
                  />
                </FieldRow>
                <TextField
                  label="Employer's address"
                  placeholder="Employer's address"
                  maxLength={100}
                  value={form.employerAddress}
                  onChange={(v) => setText("employerAddress", v)}
                />
                <TextField
                  label="Employer's address (second line)"
                  placeholder="Employer's address (second line)"
                  maxLength={100}
                  value={form.employerAddress2}
                  onChange={(v) => setText("employerAddress2", v)}
                />
                <TextField
                  label="Employer's mobile"
                  placeholder="01783666743"
                  maxLength={11}
                  inputMode="tel"
                  validate={validateMobile}
                  value={form.employerMobile}
                  onChange={(v) =>
                    setText("employerMobile", digitString(v, 11))
                  }
                />
              </div>
            </SectionCard>

            <SectionCard number={10} title="Last two institutions">
              <div className="space-y-5">
                <div className="space-y-3">
                  <TextField
                    label="First institution — name and address"
                    placeholder="First institution — name and address"
                    maxLength={120}
                    value={form.firstInstitutionNameAddress}
                    onChange={(v) => setText("firstInstitutionNameAddress", v)}
                  />
                  <FieldRow>
                    <TextField
                      label="Study period from (first)"
                      placeholder="e.g. 2010"
                      maxLength={4}
                      inputMode="numeric"
                      value={form.firstStudyFrom}
                      onChange={(v) =>
                        setText("firstStudyFrom", digitString(v, 4))
                      }
                    />
                    <TextField
                      label="Study period to (first)"
                      placeholder="e.g. 2010"
                      maxLength={4}
                      inputMode="numeric"
                      value={form.firstStudyTo}
                      onChange={(v) =>
                        setText("firstStudyTo", digitString(v, 4))
                      }
                    />
                  </FieldRow>
                  <TextField
                    label="Qualification earned (first)"
                    placeholder="e.g. SSC"
                    maxLength={50}
                    value={form.firstQualification}
                    onChange={(v) => setText("firstQualification", v)}
                  />
                </div>
                <div className="space-y-3">
                  <TextField
                    label="Second institution — name and address"
                    placeholder="Second institution — name and address"
                    maxLength={120}
                    value={form.secondInstitutionNameAddress}
                    onChange={(v) => setText("secondInstitutionNameAddress", v)}
                  />
                  <FieldRow>
                    <TextField
                      label="Study period from (second)"
                      placeholder="e.g. 2010"
                      maxLength={4}
                      inputMode="numeric"
                      value={form.secondStudyFrom}
                      onChange={(v) =>
                        setText("secondStudyFrom", digitString(v, 4))
                      }
                    />
                    <TextField
                      label="Study period to (second)"
                      placeholder="e.g. 2010"
                      maxLength={4}
                      inputMode="numeric"
                      value={form.secondStudyTo}
                      onChange={(v) =>
                        setText("secondStudyTo", digitString(v, 4))
                      }
                    />
                  </FieldRow>
                  <TextField
                    label="Qualification earned (second)"
                    placeholder="e.g. SSC"
                    maxLength={50}
                    value={form.secondQualification}
                    onChange={(v) => setText("secondQualification", v)}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              number={11}
              title="Data collector"
              description="The NID of the person who collected the information."
            >
              <TextField
                label="Data collector's NID number"
                placeholder="10, 13 or 17-digit NID"
                maxLength={17}
                inputMode="numeric"
                validate={validateNid}
                value={form.dataCollectorNid}
                onChange={(v) =>
                  setText("dataCollectorNid", digitString(v, 17))
                }
              />
            </SectionCard>
          </div>

          <div className="lg:sticky lg:top-5">
            <PreviewFrame data={form} hasData={hasData} />
          </div>
        </div>

        <section
          className="mt-5 rounded-xl border border-[#93C5FD] bg-[#F8FAFC] px-5 py-5 shadow-[0_3px_12px_rgba(37,99,235,0.06)] print:hidden"
          aria-labelledby="special-information-important-notes"
        >
          <h2
            id="special-information-important-notes"
            className="text-[13px] font-bold text-[#2563EB]"
          >
            Important notes:
          </h2>
          <div className="my-4 border-t border-[#BFDBFE]" />
          <div className="space-y-3 text-[10px] leading-5 text-[#0F172A]">
            <p>Attach the following with the form:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>A photocopy of the land deed, when the address is owned.</li>
              <li>
                The landlord's NID and proof of tenancy, for rented or other
                tenures.
              </li>
              <li>
                A copy of the Home Ministry citizenship certificate, if born
                abroad.
              </li>
              <li>Photocopies of educational certificates, if any.</li>
            </ul>
            <p className="pt-1 font-medium text-[#DC2626]">
              Fill everything in accurately — wrong information can get the
              application rejected.
            </p>
            <p className="pt-1 text-[#475569]">
              Print the filled form, sign it, and submit it with Form-2 at your
              upazila / thana election office.
            </p>
          </div>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-[#CBD5E1] bg-white/95 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur print:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5">
          <div className="flex items-center gap-2 text-[9px] font-medium text-[#0F172A]">
            <span
              className={cx(
                "h-2 w-2 rounded-full",
                hasData ? "bg-[#10B981]" : "bg-[#94A3B8]",
              )}
            />
            {hasData
              ? "Form complete — download or print it."
              : "Add an input to get started"}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={!hasData}
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#E2E8F0] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
            <button
              type="button"
              onClick={restoreLast}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore last form
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={print}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] disabled:cursor-wait disabled:opacity-60"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={downloadPdf}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#10B981] px-3.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#059669] disabled:cursor-wait disabled:opacity-70"
            >
              <FileDown className="h-3.5 w-3.5" />
              {pdfBusy ? "Processing..." : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(320px,calc(100vw-2rem))] flex-col gap-2 print:hidden"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cx(
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg",
              toast.kind === "success" && "border-[#A7F3D0] bg-[#ECFDF5]",
              toast.kind === "info" && "border-[#CBD5E1] bg-[#F8FAFC]",
              toast.kind === "error" && "border-[#FCA5A5] bg-[#FEF2F2]",
            )}
          >
            {toast.kind === "success" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#059669]" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p
                className={cx(
                  "text-[10px] font-bold",
                  toast.kind === "success"
                    ? "text-[#047857]"
                    : toast.kind === "error"
                      ? "text-[#B91C1C]"
                      : "text-[#4B5563]",
                )}
              >
                {toast.title}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-4 text-[#475569]">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              className="text-[#64748B] hover:text-[#4B5563]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {mode ? <PrintRoot data={form} mode={mode} /> : null}
    </div>
  );
}
