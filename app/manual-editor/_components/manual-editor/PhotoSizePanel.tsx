"use client";
import { ManualT as T, useManualEditorText } from "./manualEditorI18n";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, GraduationCap, Image as ImageIcon, Maximize2, Plane, Printer, Ruler, Search, Users, } from "lucide-react";
import { ADMISSION_ID_PREFIX, ADMISSION_SIZE_PRESETS, DPI, R_SIZE_PRESETS, VISA_PRESETS, buildAdmissionSizePreset } from "./constants";
import { ADMISSION_PRESETS, buildAdmissionLabel, type AdmissionFormat } from "@/app/ai-editor/_components/admissionSizes";
import { isAdmissionPreset } from "./admissionExport";
import { useManualEditor } from "./EditorProvider";
import type { PhotoMode, SizePreset } from "./types";
const MODE_LABELS: Record<PhotoMode, string> = {
    passport: "Passport",
    dual: "Dual",
    visa: "Visa",
    rsizes: "R Sizes",
    freesize: "Free size",
    admission: "Admission",
};

const ADMISSION_GROUPS: { key: "university" | "job" | "general"; title: string }[] = [
    { key: "university", title: "বিশ্ববিদ্যালয় ভর্তি" },
    { key: "job", title: "সরকারি চাকরি" },
    { key: "general", title: "অন্যান্য" },
];
const inputCls = "mt-1 w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1.5 text-[14px] font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626]";

type Unit = "mm" | "cm" | "in" | "px";
const UNIT_LABEL: Record<Unit, string> = { mm: "mm", cm: "cm", in: "inch", px: "px" };
const MIN_PX = 20;
const MAX_PX = 6000;

const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);
const pxToMm = (px: number) => Math.round(((px / DPI) * 25.4) * 100) / 100;
const roundNice = (value: number) => Math.round(value * 100) / 100;
const digits = (value: string) => value.replace(/\D/g, "");
/** Bangla digits and a comma are accepted too, so nobody has to switch the keyboard. */
const cleanDecimal = (value: string) => value
    .replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "")
    .replace(/(\..*)\./g, "$1");

function pixelsOf(preset: SizePreset) {
    if (isAdmissionPreset(preset))
        return { w: preset.widthPx, h: preset.heightPx };
    return { w: mmToPx(preset.widthMm), h: mmToPx(preset.heightMm) };
}
function compactPresetLabel(label: string) {
    if (label.includes(" — ")) {
        return label.split(" — ")[0];
    }
    return label.replace(" inch", "").replace(" mm", "");
}
function formatName(format?: AdmissionFormat) {
    return format === "jpg" ? "JPG" : format === "png" ? "PNG" : "JPG/PNG";
}

/** Own pixel size / KB limit / format for any portal that is not in the list. */
function AdmissionCustomForm({ active, initial, onApply, bn, }: {
    active: boolean;
    initial: SizePreset | null;
    onApply: (preset: ReturnType<typeof buildAdmissionSizePreset>) => void;
    bn: boolean;
}) {
    const tx = (b: string, e: string) => (bn ? b : e);
    const start = initial && isAdmissionPreset(initial) ? initial : null;
    const [w, setW] = useState(String(start?.widthPx ?? 300));
    const [h, setH] = useState(String(start?.heightPx ?? 300));
    const [minKB, setMinKB] = useState(start?.minKB ? String(start.minKB) : "");
    const [maxKB, setMaxKB] = useState(start ? (start.maxKB ? String(start.maxKB) : "") : "100");
    const [format, setFormat] = useState<AdmissionFormat>(start?.format ?? "jpg");
    const [error, setError] = useState("");
    const apply = () => {
        const wi = Number(w);
        const hi = Number(h);
        const mx = maxKB.trim() ? Number(maxKB) : 0;
        const mn = minKB.trim() ? Number(minKB) : 0;
        if (!Number.isFinite(wi) || !Number.isFinite(hi) || wi < MIN_PX || hi < MIN_PX || wi > MAX_PX || hi > MAX_PX) {
            setError(tx("প্রস্থ ও উচ্চতা ২০ থেকে ৬০০০ পিক্সেলের মধ্যে দিন।", "Width and height must be between 20 and 6000 px."));
            return;
        }
        if (mx && mx < 5) {
            setError(tx("সর্বোচ্চ KB কমপক্ষে ৫ দিন।", "Max KB must be at least 5."));
            return;
        }
        if (mn && mx && mn >= mx) {
            setError(tx("সর্বনিম্ন KB সর্বোচ্চের চেয়ে কম হতে হবে।", "Min KB must be lower than Max KB."));
            return;
        }
        setError("");
        onApply(buildAdmissionSizePreset({
            id: "custom",
            label: buildAdmissionLabel({ widthPx: wi, heightPx: hi, minKB: mn || undefined, maxKB: mx || undefined, format }),
            widthPx: wi,
            heightPx: hi,
            minKB: mn || undefined,
            maxKB: mx || undefined,
            format,
        }));
    };
    // Is what is typed the same as what is in use right now?
    const current = active && start ? start : null;
    const inSync = Boolean(current)
        && current!.widthPx === Number(w)
        && current!.heightPx === Number(h)
        && (current!.minKB ?? 0) === (minKB.trim() ? Number(minKB) : 0)
        && (current!.maxKB ?? 0) === (maxKB.trim() ? Number(maxKB) : 0)
        && current!.format === format;
    return (<div className={`rounded-xl border p-2.5 ${active ? "border-[#DC2626] bg-[#DC2626]/5" : "border-[#E3D6B8] bg-[#F7EFD9]"}`} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}>
      <p className="mb-1.5 text-[14px] font-extrabold text-[#3B2F1E]">{tx("✏️ নিজের মাপ দিন (অন্য যেকোনো ভর্তি/আবেদন)", "✏️ Type your own size (any other admission / application)")}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("প্রস্থ (px)", "Width (px)")}<input className={inputCls} inputMode="numeric" value={w} onChange={(e) => setW(digits(e.target.value))}/></label>
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("উচ্চতা (px)", "Height (px)")}<input className={inputCls} inputMode="numeric" value={h} onChange={(e) => setH(digits(e.target.value))}/></label>
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("সর্বনিম্ন KB (না থাকলে খালি)", "Min KB (blank if none)")}<input className={inputCls} inputMode="numeric" value={minKB} onChange={(e) => setMinKB(digits(e.target.value))}/></label>
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("সর্বোচ্চ KB", "Max KB")}<input className={inputCls} inputMode="numeric" value={maxKB} onChange={(e) => setMaxKB(digits(e.target.value))}/></label>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {(["jpg", "png", "any"] as AdmissionFormat[]).map((f) => (<button key={f} type="button" onClick={() => setFormat(f)} className={`cursor-pointer rounded-md border px-2 py-1 text-[13px] font-bold transition ${format === f ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>
            {f === "any" ? "JPG/PNG" : f.toUpperCase()}
          </button>))}
        <button type="button" onClick={apply} className="ml-auto cursor-pointer rounded-md bg-[#059669] px-3 py-1.5 text-[13px] font-extrabold text-white transition hover:bg-[#047857]">{inSync ? tx("✓ ব্যবহৃত হচ্ছে", "✓ In use") : tx("এই মাপ নিন", "Use this size")}</button>
      </div>
      {!inSync && !error && (<p className="mt-1 text-[12.5px] font-bold text-[#B45309]">{tx("মাপ লিখে «এই মাপ নিন» চাপুন (বা Enter)।", "After typing, press “Use this size” (or Enter).")}</p>)}
      {error && <p className="mt-1 text-[13px] font-bold text-[#DC2626]">{error}</p>}
    </div>);
}

/** Free size in mm / cm / inch / px. Typing is never altered while the person types. */
function FreeSizeForm({ bn, }: {
    bn: boolean;
}) {
    const tx = (b: string, e: string) => (bn ? b : e);
    const { freeWidth, freeHeight, setFreeWidth, setFreeHeight, setFreeSizeOpen } = useManualEditor();
    const [unit, setUnit] = useState<Unit>("mm");
    const toUnit = (mm: number, u: Unit) => {
        if (u === "mm")
            return String(roundNice(mm));
        if (u === "cm")
            return String(roundNice(mm / 10));
        if (u === "in")
            return String(roundNice(mm / 25.4));
        return String(mmToPx(mm));
    };
    const toMm = (value: number, u: Unit) => {
        if (u === "mm")
            return value;
        if (u === "cm")
            return value * 10;
        if (u === "in")
            return value * 25.4;
        return pxToMm(value);
    };
    const [w, setW] = useState(() => toUnit(freeWidth, "mm"));
    const [h, setH] = useState(() => toUnit(freeHeight, "mm"));
    const [error, setError] = useState("");
    // Keep the boxes in step if the size is changed from somewhere else.
    useEffect(() => {
        setW(toUnit(freeWidth, unit));
        setH(toUnit(freeHeight, unit));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [freeWidth, freeHeight]);
    const changeUnit = (next: Unit) => {
        setUnit(next);
        setW(toUnit(freeWidth, next));
        setH(toUnit(freeHeight, next));
        setError("");
    };
    const parse = () => {
        const wv = Number(w);
        const hv = Number(h);
        if (!Number.isFinite(wv) || !Number.isFinite(hv) || wv <= 0 || hv <= 0) {
            setError(tx("প্রস্থ ও উচ্চতা লিখুন।", "Enter width and height."));
            return null;
        }
        const wm = unit === "px" ? pxToMm(Math.round(wv)) : toMm(wv, unit);
        const hm = unit === "px" ? pxToMm(Math.round(hv)) : toMm(hv, unit);
        const wp = mmToPx(wm);
        const hp = mmToPx(hm);
        if (wp < MIN_PX || hp < MIN_PX || wp > MAX_PX || hp > MAX_PX) {
            setError(tx("মাপ খুব ছোট বা খুব বড়। (১.৭ মিমি থেকে ৫০০ মিমি-র মধ্যে দিন)", "Size is too small or too large (keep it between 1.7 mm and 500 mm)."));
            return null;
        }
        setError("");
        return { wm: roundNice(wm), hm: roundNice(hm) };
    };
    const liveW = Number(w);
    const liveH = Number(h);
    const livePx = Number.isFinite(liveW) && Number.isFinite(liveH) && liveW > 0 && liveH > 0
        ? (unit === "px" ? { w: Math.round(liveW), h: Math.round(liveH) } : { w: mmToPx(toMm(liveW, unit)), h: mmToPx(toMm(liveH, unit)) })
        : null;
    const apply = () => {
        const result = parse();
        if (!result)
            return;
        setFreeWidth(result.wm);
        setFreeHeight(result.hm);
        setFreeSizeOpen(false);
    };
    return (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}>
      <p className="text-[14px] font-extrabold text-[#3B2F1E] mb-2">{tx("📐 নিজের মাপ লিখুন", "📐 Type your own size")}</p>
      <div className="mb-2 flex items-center gap-1.5">
        {(["mm", "cm", "in", "px"] as Unit[]).map((u) => (<button key={u} type="button" onClick={() => changeUnit(u)} className={`cursor-pointer rounded-md border px-2.5 py-1 text-[13px] font-bold transition ${unit === u ? "border-[#DC2626] bg-[#DC2626] text-white" : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:bg-[#EFE3C8]"}`}>{UNIT_LABEL[u]}</button>))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("প্রস্থ", "Width")} ({UNIT_LABEL[unit]})
          <input className={inputCls} inputMode="decimal" value={w} onChange={(e) => setW(unit === "px" ? digits(e.target.value) : cleanDecimal(e.target.value))}/>
        </label>
        <label className="text-[13px] font-bold text-[#5A4A32]">{tx("উচ্চতা", "Height")} ({UNIT_LABEL[unit]})
          <input className={inputCls} inputMode="decimal" value={h} onChange={(e) => setH(unit === "px" ? digits(e.target.value) : cleanDecimal(e.target.value))}/>
        </label>
      </div>
      {livePx && (<p className="mt-2 text-[13px] font-bold text-[#6B5A40]">{tx("ডাউনলোড হবে:", "Download will be:")} {livePx.w} × {livePx.h} px ({DPI} DPI)</p>)}
      {error && <p className="mt-1 text-[13px] font-bold text-[#DC2626]">{error}</p>}
      <button type="button" onClick={apply} className="mt-2 w-full rounded-xl bg-[#D42020] px-3 py-2 text-[14px] font-extrabold text-white hover:bg-[#AE1717] active:scale-[0.98] transition-colors cursor-pointer">{tx("এই মাপ নিন", "Apply size")}</button>
    </div>);
}

export default function PhotoSizePanel() {
    const { t, locale } = useManualEditorText();
    const bn = String(locale ?? "").toLowerCase().startsWith("bn");
    const tx = (b: string, e: string) => (bn ? b : e);
    const { photoMode, selectMode, sizeMenu, setSizeMenu, selectedPreset, currentPreset, selectPreset, freeSizeOpen, setFreeSizeOpen, } = useManualEditor();
    const [query, setQuery] = useState("");
    const selectedVisaLabel = photoMode === "visa"
        ? compactPresetLabel(currentPreset.label)
        : MODE_LABELS.visa;
    const activeAdmission = photoMode === "admission" ? currentPreset : null;
    const selectedRSizeLabel = photoMode === "rsizes"
        ? compactPresetLabel(currentPreset.label)
        : MODE_LABELS.rsizes;

    // The one line that tells the person exactly what they will get.
    const summary = useMemo(() => {
        const px = pixelsOf(currentPreset);
        const dual = photoMode === "dual";
        const w = dual ? px.w * 2 : px.w;
        const widthMm = dual ? currentPreset.widthMm * 2 : currentPreset.widthMm;
        const admission = isAdmissionPreset(currentPreset) ? currentPreset : null;
        return {
            px: `${w} × ${px.h} px`,
            mm: `${roundNice(widthMm)} × ${roundNice(currentPreset.heightMm)} mm`,
            inch: `${roundNice(widthMm / 25.4)} × ${roundNice(currentPreset.heightMm / 25.4)} inch`,
            admission,
        };
    }, [currentPreset, photoMode]);

    const filteredAdmission = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q)
            return ADMISSION_PRESETS;
        return ADMISSION_PRESETS.filter((p) => `${p.title} ${p.widthPx}x${p.heightPx} ${p.widthPx}×${p.heightPx} ${p.note ?? ""}`.toLowerCase().includes(q));
    }, [query]);

    return (<section className="flex flex-col gap-3">
      {/* What you have chosen: always visible, so nobody has to guess the size */}
      <div className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#6B5A40]"><Ruler size={14}/>{tx("আপনার বেছে নেওয়া মাপ", "Your chosen size")}</p>
        <p className="mt-0.5 text-[20px] font-extrabold leading-tight text-[#DC2626]">{summary.px}</p>
        <p className="text-[13px] font-bold text-[#5A4A32]">
          {summary.admission
            ? `${summary.admission.maxKB ? `${summary.admission.minKB ? `${summary.admission.minKB}–` : tx("সর্বোচ্চ ", "max ")}${summary.admission.maxKB} KB · ` : ""}${formatName(summary.admission.format)} · ${summary.mm}`
            : `${summary.mm} · ${summary.inch} · ${DPI} DPI`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 relative">
        {[
            {
                id: "passport" as const,
                label: "Passport",
                icon: <ImageIcon className="w-6 h-6 text-[#7A6A50]"/>,
            },
            {
                id: "dual" as const,
                label: "Dual",
                icon: <Users className="w-6 h-6 text-[#7A6A50]"/>,
            },
            {
                id: "visa" as const,
                label: selectedVisaLabel,
                icon: <Plane className="w-6 h-6 text-[#7A6A50]"/>,
            },
            {
                id: "rsizes" as const,
                label: selectedRSizeLabel,
                icon: <Printer className="w-6 h-6 text-[#7A6A50]"/>,
            },
            {
                id: "freesize" as const,
                label: "Free size",
                icon: <Maximize2 className="w-6 h-6 text-[#7A6A50]"/>,
            },
            {
                id: "admission" as const,
                label: "Admission",
                icon: <GraduationCap className="w-6 h-6 text-[#7A6A50]"/>,
            },
        ].map((item) => {
            const isActive = photoMode === item.id;
            const isPresetMode = item.id === "visa" || item.id === "rsizes" || item.id === "admission";
            return (<div key={item.id} className="relative min-w-0">
              <button type="button" onClick={() => {
                    selectMode(item.id);
                    if (item.id === "freesize") {
                        setSizeMenu(null);
                        setFreeSizeOpen(true);
                        return;
                    }
                    if (item.id === "visa" || item.id === "rsizes" || item.id === "admission") {
                        setFreeSizeOpen(false);
                        setSizeMenu(item.id);
                        return;
                    }
                    setSizeMenu(null);
                    setFreeSizeOpen(false);
                }} className={`relative flex w-full min-w-0 flex-col items-center justify-center p-2 rounded-2xl border text-[14px] font-bold transition h-[84px] cursor-pointer ${isActive
                    ? "border-[#DC2626] bg-[#F6D9A8] ring-1 ring-[#DC2626]"
                    : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626]/40"}`}>
                <span className="mb-1.5 shrink-0">{item.icon}</span>

                <span title={t(item.label)} className={`w-full text-center text-[13px] leading-tight font-bold ${isActive ? "text-[#DC2626]" : "text-[#3B2F1E]"}`}>
                  {<T>{item.label}</T>}
                </span>
              </button>

              {isPresetMode && isActive && (<button type="button" aria-label={t(`Open ${item.label} size menu`)} onClick={() => setSizeMenu(sizeMenu === item.id ? null : item.id)} className="absolute -right-1 -top-1 rounded-full bg-[#FBF6E8] border border-[#E3D6B8] shadow-sm text-[#6B5A40] hover:text-[#3B2F1E] cursor-pointer">
                  <ChevronDown size={12}/>
                </button>)}
            </div>);
        })}
      </div>

      {/* Visa Size Menu */}
      {photoMode === "visa" && sizeMenu === "visa" && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[14px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Visa Photo Size"}</T></p>

          <div className="grid grid-cols-2 gap-2 scroll max-h-64 overflow-y-auto pr-1">
            {VISA_PRESETS.map((preset) => {
                const px = pixelsOf(preset);
                const on = selectedPreset?.id === preset.id;
                return (<button key={preset.id} type="button" onClick={() => selectPreset(preset, "visa")} className={`rounded-xl border px-2 py-2 text-[13px] font-bold transition-colors cursor-pointer ${on
                    ? "border-[#DC2626] bg-[#F6D9A8] text-[#DC2626]"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:border-[#DC2626]/40"}`}>
                <span className="block"><T>{preset.label}</T></span>
                <span className="block text-[12px] font-semibold text-[#7A6A50]">{px.w}×{px.h} px</span>
              </button>);
            })}
          </div>
        </div>)}

      {/* Print Size Menu */}
      {photoMode === "rsizes" && sizeMenu === "rsizes" && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[14px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Print Size"}</T></p>

          <div className="grid grid-cols-3 gap-2 scroll max-h-64 overflow-y-auto pr-1">
            {R_SIZE_PRESETS.map((preset) => {
                const px = pixelsOf(preset);
                const on = selectedPreset?.id === preset.id;
                return (<button key={preset.id} type="button" onClick={() => selectPreset(preset, "rsizes")} className={`rounded-xl border px-1.5 py-2 text-[13px] font-bold transition-colors cursor-pointer ${on
                    ? "border-[#DC2626] bg-[#DC2626] text-white shadow-sm"
                    : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:border-[#DC2626]/40"}`}>
                <span className="block"><T>{compactPresetLabel(preset.label)}</T></span>
                <span className={`block text-[11.5px] font-semibold ${on ? "text-white/90" : "text-[#7A6A50]"}`}>{px.w}×{px.h}</span>
              </button>);
            })}
          </div>
        </div>)}

      {/* Admission Size Menu (university / job portals: exact pixels + KB limit) */}
      {photoMode === "admission" && sizeMenu === "admission" && (<div className="rounded-2xl border-2 border-[#DC2626] bg-[#F0DDB5] p-3 shadow-xl">
          <p className="text-[14px] font-extrabold text-[#3B2F1E] mb-2"><T>{"Admission Photo Size"}</T></p>

          <label className="relative mb-2 block">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A6A50]"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("খুঁজুন: BCS, NU, 300x300 ...", "Search: BCS, NU, 300x300 ...")} className="w-full rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] py-1.5 pl-8 pr-2 text-[14px] font-bold text-[#3B2F1E] outline-none focus:border-[#DC2626]"/>
          </label>

          <div className="scroll max-h-56 overflow-y-auto pr-1 space-y-3">
            {ADMISSION_GROUPS.map((group) => {
                const items = filteredAdmission.filter((p) => p.group === group.key);
                if (!items.length)
                    return null;
                return (<div key={group.key}>
                  <p className="mb-1.5 text-[13px] font-bold text-[#6B5A40]">{group.title}</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map((item) => {
                        const preset = ADMISSION_SIZE_PRESETS.find((p) => p.id === `${ADMISSION_ID_PREFIX}${item.id}`);
                        if (!preset)
                            return null;
                        const on = selectedPreset?.id === preset.id;
                        return (<button key={preset.id} type="button" onClick={() => selectPreset(preset, "admission")} className={`relative cursor-pointer rounded-lg border px-3 py-2 text-left transition-all ${on ? "border-[#DC2626] bg-[#F6D9A8]" : "border-[#E3D6B8] bg-[#FBF6E8] hover:border-[#DC2626]/40"}`}>
                          {on && (<span className="absolute right-2 top-2 rounded-full bg-[#DC2626] p-0.5 text-white"><Check size={9}/></span>)}
                          <span className={`block text-[14px] font-extrabold leading-tight ${on ? "text-[#DC2626]" : "text-[#3B2F1E]"}`}>{item.title}</span>
                          <span className="mt-0.5 block text-[13px] font-semibold text-[#5A4A32]">
                            {item.widthPx}×{item.heightPx} px · {item.minKB ? `${item.minKB}–` : "সর্বোচ্চ "}{item.maxKB} KB · {formatName(item.format)}
                          </span>
                          {item.note && (<span className="mt-0.5 block text-[13px] leading-snug text-[#7A6A50]">{item.note}</span>)}
                        </button>);
                    })}
                  </div>
                </div>);
            })}
            {!filteredAdmission.length && (<p className="py-2 text-center text-[13px] font-bold text-[#6B5A40]">{tx("কিছু পাওয়া যায়নি। নিচে নিজের মাপ দিন।", "Nothing found. Type your own size below.")}</p>)}
          </div>

          {/* Always visible (outside the scrolling list) */}
          <div className="mt-2">
            <AdmissionCustomForm bn={bn} active={Boolean(activeAdmission?.id === `${ADMISSION_ID_PREFIX}custom`)} initial={selectedPreset && selectedPreset.id === `${ADMISSION_ID_PREFIX}custom` ? selectedPreset : null} onApply={(preset) => selectPreset(preset, "admission")}/>
          </div>

          <p className="mt-2 text-[14px] font-bold leading-snug text-[#6B5A40]"><T>{"Download gives exactly this pixel size, inside the KB limit, in the right format."}</T></p>
        </div>)}

      {/* Free Size Menu */}
      {photoMode === "freesize" && freeSizeOpen && (<FreeSizeForm bn={bn}/>)}
    </section>);
}
