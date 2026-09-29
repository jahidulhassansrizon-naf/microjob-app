"use client";

import {
  Check,
  ChevronDown,
  FileDown,
  FileText,
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
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

type FuelCardFormState = {
  applicantOrganization: string;
  fatherProprietor: string;
  nidLicenseNumber: string;
  mobileNumber: string;
  villageRoad: string;
  unionName: string;
  postOffice: string;
  district: string;
  thanaUpazila: string;
  pumpName: string;
  machineEquipment: string;
  fuelType: "Petrol" | "Octane" | "Diesel" | "";
  fuelQuantity: string;
  purposeOfUse: string;
};

type FormKey = keyof FuelCardFormState;
type StringKey = {
  [K in FormKey]: FuelCardFormState[K] extends string ? K : never;
}[FormKey];

type ToastKind = "success" | "info" | "error";
type Toast = { id: number; kind: ToastKind; title: string; message: string };
type RenderMode = "print" | "pdf" | null;

const STORAGE_KEY = "sohoj-fuel-card-form";
const LAST_KEY = "sohoj-fuel-card-form-last";
const FAVORITE_KEY = "sohoj-fuel-card-form-favorite";
const USED_KEY = "sohoj-fuel-card-form-used";

const EMPTY_FORM: FuelCardFormState = {
  applicantOrganization: "",
  fatherProprietor: "",
  nidLicenseNumber: "",
  mobileNumber: "",
  villageRoad: "",
  unionName: "",
  postOffice: "",
  district: "",
  thanaUpazila: "",
  pumpName: "",
  machineEquipment: "",
  fuelType: "Diesel",
  fuelQuantity: "",
  purposeOfUse: "",
};

const FUEL_TYPES: FuelCardFormState["fuelType"][] = [
  "Petrol",
  "Octane",
  "Diesel",
];

const DISTRICTS = [
  "Barishal",
  "Barguna",
  "Bhola",
  "Jhalokathi",
  "Patuakhali",
  "Pirojpur",
  "Chattogram",
  "Cox's Bazar",
  "Cumilla",
  "Feni",
  "Brahmanbaria",
  "Rangamati",
  "Noakhali",
  "Chandpur",
  "Lakshmipur",
  "Khagrachhari",
  "Bandarban",
  "Dhaka",
  "Gazipur",
  "Kishoreganj",
  "Madaripur",
  "Munshiganj",
  "Narsingdi",
  "Narayanganj",
  "Rajbari",
  "Shariatpur",
  "Tangail",
  "Faridpur",
  "Gopalganj",
  "Manikganj",
  "Khulna",
  "Bagerhat",
  "Chuadanga",
  "Jashore",
  "Jhenaidah",
  "Kushtia",
  "Magura",
  "Meherpur",
  "Narail",
  "Satkhira",
  "Mymensingh",
  "Jamalpur",
  "Netrokona",
  "Sherpur",
  "Rajshahi",
  "Bogura",
  "Joypurhat",
  "Naogaon",
  "Natore",
  "Chapainawabganj",
  "Pabna",
  "Sirajganj",
  "Rangpur",
  "Dinajpur",
  "Gaibandha",
  "Kurigram",
  "Lalmonirhat",
  "Nilphamari",
  "Panchagarh",
  "Thakurgaon",
  "Sylhet",
  "Habiganj",
  "Moulvibazar",
  "Sunamganj",
];

const INK = "#0F172A";
const PAPER = "#FFFFFF";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const digitString = (value: string, max = 32) =>
  value.replace(/[^\d]/g, "").slice(0, max);

const validateMobile = (v: string) =>
  v && !/^01[3-9]\d{8}$/.test(v)
    ? "Enter a valid 11-digit mobile number."
    : "";

function isFormEmpty(form: FuelCardFormState) {
  return (Object.keys(EMPTY_FORM) as FormKey[]).every((key) => {
    const value = form[key];
    return String(value ?? "").trim() === "" || key === "fuelType";
  });
}

function sanitizeForm(raw: unknown): FuelCardFormState {
  const result: FuelCardFormState = { ...EMPTY_FORM };
  if (!raw || typeof raw !== "object") return result;
  const source = raw as Record<string, unknown>;
  const target = result as Record<string, unknown>;

  (Object.keys(EMPTY_FORM) as FormKey[]).forEach((key) => {
    const fallback = EMPTY_FORM[key];
    const value = source[key];
    target[key] = typeof value === "string" ? value : fallback;
  });

  if (!(FUEL_TYPES as readonly string[]).includes(result.fuelType)) {
    result.fuelType = "Diesel";
  }
  return result;
}

function safeReadJson(key: string): FuelCardFormState | null {
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

async function waitForFonts() {
  try {
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }
  } catch {}
  await nextFrames(2);
}

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
        <span className="text-[10px] font-normal text-[#64748B]">{hint}</span>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  "h-9 w-full rounded-md border bg-white px-3 text-[11px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]";

function TextField({
  label,
  value,
  placeholder,
  onChange,
  inputMode,
  maxLength,
  validate,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  validate?: (value: string) => string;
}) {
  const [touched, setTouched] = useState(false);
  const message = validate ? validate(value) : "";
  const showError = Boolean(message) && touched;

  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={showError}
        onBlur={() => setTouched(true)}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          INPUT_BASE,
          showError
            ? "border-[#FCA5A5] focus:border-[#DC2626] focus:ring-[#FEE2E2]"
            : "border-[#CBD5E1]",
        )}
      />
      {showError ? (
        <p role="alert" className="mt-1 text-[9.5px] leading-3 text-[#B91C1C]">
          {message}
        </p>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cx(
            INPUT_BASE,
            "appearance-none pr-8 cursor-pointer",
            "border-[#CBD5E1]",
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748B]" />
      </div>
    </label>
  );
}

function SectionCard({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#BFDBFE] bg-white p-3.5 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
      <h2 className="mb-3 text-[12px] font-bold text-[#2563EB]">
        {number}. {title}
      </h2>
      {children}
    </section>
  );
}

function FieldLine({
  y,
  index,
  label,
  value,
  valueSize = 3.55,
  labelWidth = 37,
}: {
  y: number;
  index: string;
  label: string;
  value: string;
  valueSize?: number;
  labelWidth?: number;
}) {
  const left = 9;
  const labelX = 15;
  const lineX = labelX + labelWidth;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${left}mm`,
          top: `${y}mm`,
          width: "5mm",
          fontSize: "3.4mm",
          lineHeight: 1,
          fontWeight: 700,
          color: INK,
        }}
      >
        {index}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${labelX}mm`,
          top: `${y}mm`,
          width: `${labelWidth - 2}mm`,
          fontSize: "3.35mm",
          lineHeight: 1,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${lineX}mm`,
          top: `${y + 3.2}mm`,
          width: `${210 - lineX - 18}mm`,
          borderBottom: "0.45mm dotted #475569",
        }}
      />
      {value ? (
        <div
          style={{
            position: "absolute",
            left: `${lineX + 1}mm`,
            top: `${y - 0.3}mm`,
            width: `${210 - lineX - 20}mm`,
            fontSize: `${valueSize}mm`,
            lineHeight: 1,
            fontWeight: 700,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "clip",
          }}
        >
          {value}
        </div>
      ) : null}
    </>
  );
}

function SmallInlineField({
  x,
  y,
  label,
  value,
  width,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  width: number;
}) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${x}mm`,
          top: `${y}mm`,
          fontSize: "3.3mm",
          lineHeight: 1,
          color: INK,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${x + 26}mm`,
          top: `${y + 3.1}mm`,
          width: `${width}mm`,
          borderBottom: "0.45mm dotted #475569",
        }}
      />
      {value ? (
        <div
          style={{
            position: "absolute",
            left: `${x + 27}mm`,
            top: `${y - 0.4}mm`,
            width: `${Math.max(width - 2, 5)}mm`,
            fontSize: "3.45mm",
            lineHeight: 1,
            fontWeight: 700,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {value}
        </div>
      ) : null}
    </>
  );
}

function PhotoBox() {
  return (
    <div
      style={{
        position: "absolute",
        right: "16mm",
        top: "12mm",
        width: "31mm",
        height: "35mm",
        border: "0.45mm dashed #64748B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2mm",
        fontSize: "3mm",
        lineHeight: 1.25,
        color: "#64748B",
      }}
    >
      Attach passport
      <br />
      photo with stapler
    </div>
  );
}

function FuelTypeBoxes({ value }: { value: FuelCardFormState["fuelType"] }) {
  const types = [
    { x: 68, label: "Petrol", short: "Petrol" },
    { x: 98, label: "Octane", short: "Octane" },
    { x: 128, label: "Diesel", short: "Diesel" },
  ];
  return (
    <div>
      {types.map((item) => (
        <div key={item.label}>
          <div
            style={{
              position: "absolute",
              left: `${item.x}mm`,
              top: "132mm",
              width: "4.8mm",
              height: "4.8mm",
              border: "0.45mm solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {value === item.label ? (
              <Check className="h-[4mm] w-[4mm] text-[#2563EB]" />
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: `${item.x + 6}mm`,
              top: "132mm",
              fontSize: "3.2mm",
              lineHeight: 1.15,
            }}
          >
            {item.short}
          </div>
        </div>
      ))}
    </div>
  );
}

function FuelCardPreview({
  form,
  documentRef,
  id,
}: {
  form: FuelCardFormState;
  documentRef?: RefObject<HTMLDivElement | null>;
  id?: string;
}) {
  return (
    <div
      id={id}
      ref={documentRef}
      className="relative h-[297mm] w-[210mm] shrink-0 overflow-hidden bg-white text-[#0F172A]"
      style={{
        boxSizing: "border-box",
        fontFamily: "Georgia, 'Times New Roman', serif",
        boxShadow: "0 10px 26px -8px rgba(15,23,42,.28)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "60mm",
          top: "10mm",
          fontSize: "4.3mm",
          fontWeight: 700,
          textDecoration: "underline",
        }}
      >
        Fuel Oil Application
      </div>

      <PhotoBox />

      <SmallInlineField
        x={9}
        y={22}
        label="1. Applicant/organization name:"
        value={form.applicantOrganization}
        width={76}
      />
      <SmallInlineField
        x={9}
        y={30}
        label="2. Father/proprietor:"
        value={form.fatherProprietor}
        width={106}
      />
      <SmallInlineField
        x={9}
        y={38}
        label="3. Village/road:"
        value={form.villageRoad}
        width={118}
      />
      <SmallInlineField
        x={9}
        y={46}
        label="4. Union:"
        value={form.unionName}
        width={129}
      />
      <SmallInlineField
        x={9}
        y={54}
        label="5. Post office:"
        value={form.postOffice}
        width={120}
      />
      <SmallInlineField
        x={9}
        y={62}
        label="6. Thana/upazila:"
        value={form.thanaUpazila}
        width={113}
      />
      <SmallInlineField
        x={9}
        y={70}
        label="7. District:"
        value={form.district}
        width={129}
      />
      <SmallInlineField
        x={9}
        y={78}
        label="8. NID or trade license number:"
        value={form.nidLicenseNumber}
        width={93}
      />
      <SmallInlineField
        x={9}
        y={86}
        label="9. Pump name:"
        value={form.pumpName}
        width={126}
      />
      <SmallInlineField
        x={9}
        y={94}
        label="10. Machine/equipment name:"
        value={form.machineEquipment}
        width={99}
      />

      <FieldLine y={106} index="11." label="Fuel type:" value={form.fuelType} />
      <FuelTypeBoxes value={form.fuelType} />
      <FieldLine
        y={119}
        index="12."
        label="Fuel quantity (liters):"
        value={form.fuelQuantity}
      />
      <FieldLine
        y={145}
        index="13."
        label="Purpose of use:"
        value={form.purposeOfUse}
        labelWidth={31}
      />
      <FieldLine
        y={158}
        index="14."
        label="Mobile number:"
        value={form.mobileNumber}
        labelWidth={31}
      />

      <div
        style={{
          position: "absolute",
          left: "10mm",
          top: "171mm",
          width: "174mm",
          fontSize: "3.25mm",
          lineHeight: 1.35,
          color: INK,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: "2mm" }}>
          Humble submission:
        </div>
        <div>
          In reference to the above subject, I wish to inform you that my
          organization regularly needs fuel oil to run its work. I kindly
          request you to take the necessary steps to allow me to collect the
          stated quantity of fuel oil.
        </div>

        <div style={{ marginTop: "6mm", fontWeight: 700 }}>Attachments:</div>
        <div style={{ marginTop: "2mm", paddingLeft: "4mm", lineHeight: 1.55 }}>
          <div>Recent photograph</div>
          <div>Copy of NID or trade license</div>
          <div>Required documents of the organization</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "10mm",
          top: "229mm",
          width: "181mm",
          height: "26mm",
          border: "0.45mm solid #334155",
          padding: "5mm",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "3.5mm",
            marginBottom: "5mm",
          }}
        >
          Permission of respectable person & ward representative
        </div>
        <div style={{ fontSize: "3.15mm", marginBottom: "4mm" }}>
          Approved fuel quantity:{" "}
          <span
            style={{
              display: "inline-block",
              width: "88mm",
              borderBottom: "0.45mm dotted #475569",
              verticalAlign: "middle",
            }}
          />
        </div>
        <div style={{ fontSize: "3.15mm" }}>
          Recommending officer (signature & seal):{" "}
          <span
            style={{
              display: "inline-block",
              width: "70mm",
              borderBottom: "0.45mm dotted #475569",
              verticalAlign: "middle",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewToolbar({
  zoom,
  setZoom,
  hasData,
}: {
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  hasData: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#E2E8F0] px-3 py-2">
      <span className="text-[11px] font-semibold text-[#475569]">Preview</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((v) => Math.max(0.7, Number((v - 0.1).toFixed(1))))}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[44px] text-center text-[10px] font-semibold text-[#475569]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((v) => Math.min(1.4, Number((v + 0.1).toFixed(1))))}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          onClick={() => setZoom(1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#CBD5E1] bg-white text-[#64748B] hover:text-[#0F172A]"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <span
          className={cx(
            "ml-1 rounded-full px-2 py-1 text-[9px] font-bold",
            hasData
              ? "bg-[#D1FAE5] text-[#047857]"
              : "bg-[#E2E8F0] text-[#475569]",
          )}
        >
          {hasData ? "Filled" : "Empty"}
        </span>
      </div>
    </div>
  );
}

function PrintRoot({
  form,
  mode,
}: {
  form: FuelCardFormState;
  mode: "print" | "pdf";
}) {
  const page = (
    <div
      id="fuel-print-root"
      className={cx(
        "fixed inset-0 z-[9999] bg-white",
        mode === "pdf" && "pointer-events-none opacity-0",
      )}
      style={mode === "pdf" ? { position: "fixed", left: 0, top: 0 } : undefined}
    >
      <div
        id="fuel-print-page"
        style={{ width: "210mm", height: "297mm", margin: "0 auto" }}
      >
        <FuelCardPreview form={form} />
      </div>
    </div>
  );
  return typeof document !== "undefined"
    ? createPortal(page, document.body)
    : null;
}

export default function FuelCardForm() {
  const [form, setForm] = useState<FuelCardFormState>(EMPTY_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [mode, setMode] = useState<RenderMode>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const toastId = useRef(0);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const hasData = useMemo(() => !isFormEmpty(form), [form]);
  const pdfBusy = mode === "pdf";

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
      toastTimers.current.set(id, setTimeout(() => dismissToast(id), 4000));
    },
    [dismissToast],
  );

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

  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  const setField = useCallback(
    <K extends FormKey>(key: K, value: FuelCardFormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const setText = useCallback(
    (key: StringKey, value: string) => setField(key, value),
    [setField],
  );

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

  const clearAll = () => {
    if (!hasData) return;
    try {
      window.localStorage.setItem(LAST_KEY, JSON.stringify(form));
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setForm({ ...EMPTY_FORM });
    setPan({ x: 0, y: 0 });
    setZoom(1);
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

  const share = async () => {
    const payload = {
      title: "Fuel Card Form",
      text: "Fill in the Fuel Card Form online.",
      url: window.location.href,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        pushToast("success", "Link copied", "The page link is on your clipboard.");
      } else {
        pushToast("error", "Could not share", "Sharing is not supported in this browser.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      pushToast("error", "Could not share", "Sharing was blocked by the browser.");
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
      const page = document.getElementById("fuel-print-page");
      if (!page) throw new Error("Printable page was not found.");

      const canvas = await html2canvas(page, {
        backgroundColor: PAPER,
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      pdf.setProperties({
        title: "Fuel Card Form",
        subject: "Fuel oil application",
      });
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

      const slug = form.applicantOrganization
        .trim()
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      pdf.save(
        slug
          ? `fuel-card-form-${slug}.pdf`
          : "fuel-card-form.pdf",
      );
      bumpUsage();
      pushToast("success", "PDF ready", "Your Fuel Card Form has been downloaded.");
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

  const onPreviewPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: pan.x,
      oy: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPreviewPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setPan({
      x: dragRef.current.ox + (event.clientX - dragRef.current.x),
      y: dragRef.current.oy + (event.clientY - dragRef.current.y),
    });
  };

  const onPreviewPointerUp = () => setDragging(false);

  const resetPreview = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const viewportStyle: CSSProperties = {
    cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
  };

  return (
    <div
      className="-mx-4 -mt-6 min-h-[calc(100vh-72px)] bg-[#F8FAFC] px-4 pb-28 pt-5 text-[#0F172A] print:bg-white"
      style={{ marginBottom: "-24px" }}
    >
      <style>{`
        @media print {
          html, body { background: #fff !important; }
          body > * { display: none !important; }
          #fuel-print-root { display: block !important; }
          #fuel-print-page { display: block !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className="mx-auto max-w-[1180px]">
        <div className="mb-2 flex items-center gap-2 px-1 text-[9px] text-[#64748B]">
          <span>⌂</span>
          <span>/</span>
          <span>Sohoz Tools</span>
          <span>/</span>
          <span>General Tools</span>
          <span>/</span>
          <span className="font-semibold text-[#475569]">Fuel Card Form</span>
        </div>

        <div className="mb-4 flex items-start justify-between gap-4 px-1">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                <FileText className="h-4 w-4" />
              </span>
              <h1 className="text-[23px] font-bold tracking-[-0.02em] text-[#0F172A]">
                Fuel Card Form
              </h1>
              <span className="rounded-full bg-[#D1FAE5] px-2 py-1 text-[9px] font-bold text-[#047857]">
                Free
              </span>
              <span className="text-[9px] text-[#64748B]">
                ✓ Used {usedCount} {usedCount === 1 ? "time" : "times"}
              </span>
            </div>
            <p className="mt-1 pl-10 text-[10px] text-[#475569]">
              Fill in your details on the left — see the application letter on
              the right and download it as PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              onClick={toggleFavorite}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition",
                favorite
                  ? "border-[#93C5FD] text-[#2563EB]"
                  : "border-[#CBD5E1] text-[#64748B] hover:bg-[#F8FAFC]",
              )}
            >
              <Star className={cx("h-4 w-4", favorite && "fill-current")} />
            </button>
            <button
              type="button"
              title="Share"
              aria-label="Share"
              onClick={share}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#64748B] transition hover:bg-[#F8FAFC]"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid items-start gap-3.5 lg:grid-cols-[265px_minmax(0,1fr)]">
          <div className="space-y-3.5">
            <SectionCard number={1} title="Personal & organization details">
              <div className="space-y-3">
                <TextField
                  label="Applicant / organization name"
                  placeholder="Name or organization"
                  value={form.applicantOrganization}
                  onChange={(v) => setText("applicantOrganization", v)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Father / proprietor"
                    placeholder="Father / proprietor name"
                    value={form.fatherProprietor}
                    onChange={(v) => setText("fatherProprietor", v)}
                  />
                  <TextField
                    label="NID / license number"
                    placeholder="NID or license number"
                    value={form.nidLicenseNumber}
                    onChange={(v) => setText("nidLicenseNumber", v)}
                  />
                </div>
                <TextField
                  label="Mobile number"
                  placeholder="01712345678"
                  value={form.mobileNumber}
                  inputMode="tel"
                  maxLength={11}
                  validate={validateMobile}
                  onChange={(v) => setText("mobileNumber", digitString(v, 11))}
                />
              </div>
            </SectionCard>

            <SectionCard number={2} title="Address & pump details">
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Village / road"
                  placeholder="Village or road name"
                  value={form.villageRoad}
                  onChange={(v) => setText("villageRoad", v)}
                />
                <TextField
                  label="Union"
                  placeholder="Union name"
                  value={form.unionName}
                  onChange={(v) => setText("unionName", v)}
                />
                <TextField
                  label="Post office"
                  placeholder="Post office"
                  value={form.postOffice}
                  onChange={(v) => setText("postOffice", v)}
                />
                <SelectField
                  label="District"
                  value={form.district}
                  placeholder="District name"
                  options={DISTRICTS}
                  onChange={(v) => setText("district", v)}
                />
                <TextField
                  label="Thana / upazila"
                  placeholder="Thana or upazila"
                  value={form.thanaUpazila}
                  onChange={(v) => setText("thanaUpazila", v)}
                />
                <TextField
                  label="Pump name"
                  placeholder="Pump name"
                  value={form.pumpName}
                  onChange={(v) => setText("pumpName", v)}
                />
              </div>
            </SectionCard>

            <SectionCard number={3} title="Machine & usage details">
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="Machine / equipment name"
                  placeholder="e.g. generator"
                  value={form.machineEquipment}
                  onChange={(v) => setText("machineEquipment", v)}
                />
                <SelectField
                  label="Fuel type: petrol, octane, diesel"
                  value={form.fuelType}
                  placeholder="Select fuel type"
                  options={FUEL_TYPES.filter(
                    (item): item is Exclude<FuelCardFormState["fuelType"], ""> =>
                      item !== "",
                  )}
                  onChange={(v) =>
                    setField(
                      "fuelType",
                      (FUEL_TYPES as readonly string[]).includes(v)
                        ? (v as FuelCardFormState["fuelType"])
                        : "",
                    )
                  }
                />
                <TextField
                  label="Fuel quantity (liters)"
                  placeholder="e.g. 50"
                  value={form.fuelQuantity}
                  inputMode="numeric"
                  onChange={(v) => setText("fuelQuantity", v)}
                />
                <TextField
                  label="Purpose of use"
                  placeholder="e.g. running generator"
                  value={form.purposeOfUse}
                  onChange={(v) => setText("purposeOfUse", v)}
                />
              </div>
            </SectionCard>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
            <PreviewToolbar zoom={zoom} setZoom={setZoom} hasData={hasData} />

            <div className="px-2 pt-2">
              <label className="flex items-center gap-2 px-2 pb-2 text-[10px] font-medium text-[#64748B]">
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#2563EB]"
                />
                Live preview
              </label>
            </div>

            <div
              ref={viewportRef}
              className="relative h-[720px] overflow-hidden rounded-b-xl bg-[#334155]"
              style={viewportStyle}
              onPointerDown={onPreviewPointerDown}
              onPointerMove={onPreviewPointerMove}
              onPointerUp={onPreviewPointerUp}
              onPointerCancel={onPreviewPointerUp}
            >
              <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-[#0F172A] px-3 py-1.5 text-[9px] font-bold text-white shadow">
                Page 1 of 1
              </div>

              <div
                className="absolute left-1/2 top-6 origin-top-left"
                style={{
                  transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${zoom})`,
                }}
              >
                <FuelCardPreview
                  form={form}
                  documentRef={previewRef}
                  id="fuel-preview-page"
                />
              </div>

              {dragging ? (
                <div className="pointer-events-none absolute inset-0 border-2 border-[#60A5FA]" />
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E2E8F0] px-3 py-2">
              <button
                type="button"
                onClick={resetPreview}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#475569] hover:bg-[#F8FAFC]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset view
              </button>
            </div>
          </div>
        </div>

        <section className="mt-3.5 rounded-xl border border-[#34D399] bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.05)]">
          <h2 className="text-[11px] font-bold text-[#065F46]">
            Important Information and Instructions:
          </h2>
          <div className="my-3 border-t border-[#A7F3D0]" />
          <p className="text-[10px] leading-5 text-[#334155]">
            The following documents must be attached:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[10px] leading-5 text-[#334155]">
            <li>Attach a passport-size photo to the application with glue or stapler.</li>
            <li>Submit a photocopy of National ID (NID) or trade license.</li>
            <li>Attach copies of required organization/equipment documents.</li>
            <li>An active mobile number must be provided.</li>
          </ul>
          <p className="mt-4 text-[10px] leading-5 text-[#DC2626]">
            Fill in all information correctly and accurately. The application may be cancelled for incorrect information.
          </p>
          <p className="mt-4 text-[10px] leading-5 text-[#0F766E]">
            After printing, obtain signature and approval from a respectable person, ward representative or relevant officer before submitting at the pump.
          </p>
          <p className="mt-4 text-[10px] leading-5 text-[#047857]">
            Collect only the approved quantity of fuel oil as per distribution policy; apply again for additional quantity.
          </p>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2E8F0] bg-white/95 px-4 py-2 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[9px] text-[#64748B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#94A3B8]" />
            Add an input to get started
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              disabled={!hasData}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold text-[#94A3B8] hover:bg-[#F8FAFC] disabled:cursor-not-allowed"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
            <button
              type="button"
              onClick={restoreLast}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#475569] hover:bg-[#F8FAFC]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore last form
            </button>
            <button
              type="button"
              disabled={pdfBusy}
              onClick={print}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#CBD5E1] bg-white px-3 text-[10px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] disabled:cursor-wait disabled:opacity-60"
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
                      : "text-[#475569]",
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
              className="text-[#64748B] hover:text-[#0F172A]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {mode ? <PrintRoot form={form} mode={mode} /> : null}
    </div>
  );
}
