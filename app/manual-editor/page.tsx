"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ManualT as T, useManualEditorText } from "./_components/manual-editor/manualEditorI18n";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar";
import PhotoSizePanel from "./_components/manual-editor/PhotoSizePanel";
import ExportFormatPanel from "./_components/manual-editor/ExportFormatPanel";
import BackgroundPanel from "./_components/manual-editor/BackgroundPanel";
import AiToolsPanel from "./_components/manual-editor/AiToolsPanel";
import PhotoWorkspace from "./_components/manual-editor/PhotoWorkspace";
import AdjustmentsPanel from "./_components/manual-editor/AdjustmentsPanel";
import QrUploadPanel from "./_components/manual-editor/QrUploadPanel";
import DownloadPanel from "./_components/manual-editor/DownloadPanel";
import StepCard from "./_components/manual-editor/StepCard";
import { ArrowLeft, ArrowRight, Check, RefreshCcw, Scissors, Smartphone } from "lucide-react";
import GeneratedPhotosPanel from "./_components/manual-editor/GeneratedPhotosPanel";
import ScanModal from "./_components/manual-editor/ScanModal";
import PrintStudioModal from "./_components/manual-editor/PrintStudioModal";
import { PoseFixLauncher } from "./_components/manual-editor/PoseFixModal";
import { ManualEditorProvider, useManualEditor, } from "./_components/manual-editor/EditorProvider";

type StepInfo = { id: number; short: [string, string]; title: [string, string]; hint: [string, string] };

/**
 * One step at a time. The person only ever sees the tools for the step they are on;
 * Download / Print appear only at the very end.
 */
const STEPS: StepInfo[] = [
    { id: 1, short: ["ছবি আপলোড", "Upload"], title: ["ছবি আপলোড করুন", "Upload your photo"], hint: ["প্রথমে আপনার ছবিটি দিন।", "Start by adding your photo."] },
    { id: 2, short: ["ক্রপ", "Crop"], title: ["ছবি ক্রপ করুন", "Crop your photo"], hint: ["ছবির বাড়তি অংশ কেটে ফেলুন। দরকার না হলে এই ধাপ বাদ দিন।", "Cut away what you do not need. Skip it if not needed."] },
    { id: 3, short: ["মাপ ও ধরন", "Size & type"], title: ["মাপ ও ফাইলের ধরন", "Size and file type"], hint: ["ফর্ম, ভর্তি বা প্রিন্টের জন্য যে মাপ ও ফরম্যাট লাগবে সেটা বেছে নিন।", "Pick the size and format your form, admission or print needs."] },
    { id: 4, short: ["ব্যাকগ্রাউন্ড", "Background"], title: ["ব্যাকগ্রাউন্ড", "Background"], hint: ["একটা রং বেছে নিন, অথবা পুরনো ব্যাকগ্রাউন্ড সরিয়ে দিন।", "Choose a colour, or remove the old background."] },
    { id: 5, short: ["ঠিকঠাক", "Adjust"], title: ["ঠিকঠাক করুন", "Adjust the photo"], hint: ["ছবি আরও উজ্জ্বল, স্পষ্ট বা রঙিন করুন। দরকার না হলে পরের ধাপে যান।", "Make it brighter, sharper or more colourful. Skip if it looks fine."] },
    { id: 6, short: ["ডাউনলোড", "Download"], title: ["ডাউনলোড ও প্রিন্ট", "Download and print"], hint: ["সব ঠিক থাকলে ডাউনলোড বা প্রিন্ট করুন।", "If everything looks right, download or print."] },
];
const LAST_STEP = STEPS.length;

function ManualEditorScreen() {
    const { loading, isAuthenticated, activePhoto, photoMode, cropAvailable, resetEditor, requestCrop, startOver } = useManualEditor();
    const { locale } = useManualEditorText();
    const bn = String(locale ?? "").toLowerCase().startsWith("bn");
    const pick = (pair: [string, string]) => (bn ? pair[0] : pair[1]);
    const tx = (b: string, e: string) => (bn ? b : e);

    // In "Dual" mode the photos live in two slots, so the wizard keeps going even while a slot is empty.
    const hasPhoto = Boolean(activePhoto) || photoMode === "dual";
    const [step, setStep] = useState(1);
    const [maxStep, setMaxStep] = useState(1);
    const goTo = useCallback((next: number) => {
        const value = Math.min(LAST_STEP, Math.max(1, next));
        setStep(value);
        setMaxStep((current) => Math.max(current, value));
    }, []);

    // Photo added -> crop step. Photo removed / editor reset -> back to the start.
    const hadPhotoRef = useRef(false);
    useEffect(() => {
        if (!hasPhoto) {
            setStep(1);
            setMaxStep(1);
        }
        else if (!hadPhotoRef.current) {
            setStep((current) => (current === 1 ? 2 : current));
            setMaxStep((current) => Math.max(current, 2));
        }
        hadPhotoRef.current = hasPhoto;
    }, [hasPhoto]);

    // Crop finished (or closed) the first time -> size step.
    const cropWasOpenRef = useRef(cropAvailable);
    useEffect(() => {
        if (cropWasOpenRef.current && !cropAvailable && hasPhoto) {
            setStep((current) => (current === 2 ? 3 : current));
            setMaxStep((current) => Math.max(current, 3));
        }
        cropWasOpenRef.current = cropAvailable;
    }, [cropAvailable, hasPhoto]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [step]);

    if (loading) {
        return (<div className="page-font min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm font-semibold text-[#6B5A40]"><T>{"\u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09BE \u09B9\u099A\u09CD\u099B\u09C7...\n          "}</T></p>
        </div>
      </div>);
    }
    if (!isAuthenticated)
        return null;

    const current = STEPS[step - 1];
    const next = STEPS[step] ?? null;

    let panel: React.ReactNode = null;
    if (step === 1) {
        panel = (<div className="flex flex-col gap-3">
          <p className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 text-[14px] font-bold leading-snug text-[#5A4A32]">
            {tx("ডান পাশের বক্সে ক্লিক করে ছবি দিন, অথবা ছবিটা টেনে এনে ছেড়ে দিন। ছবি দিলেই পরের ধাপ নিজে থেকে খুলবে।", "Click the box next to this to add a photo, or drag a photo into it. The next step opens by itself.")}
          </p>
          <details className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3">
            <summary className="flex cursor-pointer items-center gap-2 text-[14px] font-extrabold text-[#3B2F1E]"><Smartphone size={16}/>{tx("মোবাইল থেকে ছবি দিন", "Upload from your phone")}</summary>
            <div className="mt-3"><QrUploadPanel /></div>
          </details>
        </div>);
    }
    else if (step === 2) {
        panel = (<div className="flex flex-col gap-2.5">
          <button type="button" onClick={requestCrop} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#DC2626] py-3 text-[16px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#B91C1C]"><Scissors size={18}/>{tx("ক্রপ করুন", "Crop the photo")}</button>
          <button type="button" onClick={() => goTo(3)} className="flex w-full cursor-pointer items-center justify-center rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] py-2.5 text-[14px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8]">{tx("ক্রপ লাগবে না, পরের ধাপে যাই", "No crop needed, go to the next step")}</button>
          <p className="text-[12.5px] font-semibold leading-snug text-[#6B5A40]">{tx("ক্রপের সময় ছবি ঘোরানো ও আয়নার মতো উল্টানোও যায়।", "While cropping you can also rotate and mirror the photo.")}</p>
          <div className="mt-1 border-t border-[#E3D6B8] pt-2.5">
            <p className="mb-1.5 text-[12.5px] font-semibold leading-snug text-[#6B5A40]">{tx("ছবির মাথা, ঘাড় বা কাঁধ বাঁকা থাকলে আগে সোজা করে নিন:", "If the head, neck or shoulders are crooked, straighten them first:")}</p>
            <PoseFixLauncher variant="wide" />
          </div>
        </div>);
    }
    else if (step === 3) {
        panel = (<div className="flex flex-col gap-3">
          <PhotoSizePanel />
          <ExportFormatPanel />
          {photoMode === "dual" && (<p className="rounded-xl bg-[#DC2626]/10 px-3 py-2 text-[12.5px] font-bold leading-snug text-[#B91C1C]">{tx("দুটি ছবি: ডান পাশে বাঁ ও ডান দুই জায়গায় দুটি ছবি দিন।", "Two photos: add one photo in each of the left and right slots on the preview.")}</p>)}
        </div>);
    }
    else if (step === 4) {
        panel = <BackgroundPanel />;
    }
    else if (step === 5) {
        panel = (<div className="flex flex-col gap-3">
          <AdjustmentsPanel />
          <details className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-3">
            <summary className="cursor-pointer text-[14px] font-extrabold text-[#3B2F1E]">{tx("✨ AI টুলস (শুধু দরকার হলে)", "✨ AI tools (only if needed)")}</summary>
            <p className="mt-1 text-[12.5px] font-semibold text-[#6B5A40]">{tx("ছবিতে সমস্যা থাকলে এখান থেকে ঠিক করুন।", "Use these if the photo needs fixing.")}</p>
            <div className="mt-3"><AiToolsPanel /></div>
          </details>
        </div>);
    }
    else {
        panel = <DownloadPanel onChangeSize={() => goTo(3)} />;
    }

    return (<div className="manual-editor-root min-h-screen bg-gradient-to-b from-[#E9DDC3] to-[#EFE5CE] flex flex-col font-sans page-font select-none text-[#3B2F1E]">
      <DashboardNavbar />
      <div className="w-full p-3 md:p-4 lg:px-5 lg:py-4 flex flex-col gap-4 flex-1">
        {/* Steps bar: tap a finished step to go back to it */}
        <ol className="flex items-center gap-x-1.5 overflow-x-auto rounded-2xl border border-[#E3D6B8] bg-[#F2E8D2] px-3 py-2.5 text-[14px] font-bold text-[#3B2F1E]">
          {STEPS.map((item, index) => {
            const active = item.id === step;
            const done = item.id < maxStep || (item.id === 1 && hasPhoto && !active);
            const reachable = item.id <= maxStep && (hasPhoto || item.id === 1);
            return (<React.Fragment key={item.id}>
              <li className="shrink-0">
                <button type="button" disabled={!reachable} onClick={() => goTo(item.id)} className={`flex items-center gap-2 rounded-xl px-2 py-1 transition ${active ? "bg-[#DC2626]/10 ring-1 ring-[#DC2626]/40" : reachable ? "hover:bg-[#EFE3C8]" : "opacity-50"} disabled:cursor-not-allowed`}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-extrabold text-white ${done && !active ? "bg-[#10B981]" : active ? "bg-[#DC2626]" : "bg-[#B0A080]"}`}>
                    {done && !active ? <Check size={14} strokeWidth={3}/> : item.id}
                  </span>
                  <span className={active ? "text-[#DC2626]" : ""}>{pick(item.short)}</span>
                </button>
              </li>
              {index < STEPS.length - 1 && <span aria-hidden="true" className="shrink-0 text-[#B0A080]">›</span>}
            </React.Fragment>);
          })}
          <li className="ml-auto shrink-0 pl-2">
            <button type="button" onClick={resetEditor} title={tx("ছবির সব এডিট মুছে ফেলুন (ছবি থাকবে)", "Clear all edits (the photo stays)")} className="flex items-center gap-1 rounded-lg border border-[#E3D6B8] bg-[#FBF6E8] px-2 py-1 text-[12px] font-extrabold text-[#6B5A40] hover:bg-[#EFE3C8]"><RefreshCcw size={13}/><T>Reset</T></button>
          </li>
        </ol>

        {/* Left: only the current step. Right: the photo. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col gap-3">
            <StepCard step={step} title={pick(current.title)} hint={pick(current.hint)}>
              {panel}
            </StepCard>

            <div className="flex items-center gap-2">
              {step > 1 && (<button type="button" onClick={() => goTo(step - 1)} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-3 text-[15px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8]"><ArrowLeft size={16}/>{tx("পিছনে", "Back")}</button>)}
              {next ? (<button type="button" disabled={step === 1 && !hasPhoto} onClick={() => goTo(step + 1)} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-[#DC2626] px-4 py-3 text-[15px] font-extrabold text-white shadow-sm transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40">
                  <span className="truncate">{step === 1 && !hasPhoto ? tx("আগে ছবি দিন", "Add a photo first") : (next.id === 6 ? tx("পরের ধাপ: ডাউনলোড ও প্রিন্ট", "Next: Download & print") : tx(`পরের ধাপ: ${pick(next.short)}`, `Next: ${pick(next.short)}`))}</span><ArrowRight size={16} className="shrink-0"/>
                </button>) : (<button type="button" onClick={startOver} className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] px-4 py-3 text-[15px] font-extrabold text-[#3B2F1E] transition-colors hover:bg-[#EFE3C8]"><RefreshCcw size={15}/>{tx("নতুন ছবি দিয়ে আবার শুরু", "Start again with a new photo")}</button>)}
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-8 lg:sticky lg:top-3 lg:self-start lg:h-[calc(100vh-24px)] lg:min-h-[560px]">
            <PhotoWorkspace />
          </div>
        </div>

        {(step === 1 || step === LAST_STEP) && <GeneratedPhotosPanel />}
      </div>

      <footer className="mt-auto shrink-0 border-t border-[#E3D6B8] bg-[#F2E8D2] px-5 py-3 text-[13px] text-[#6B5A40]">
        <div className="w-full flex items-center justify-between gap-3">
          <span><T>{"Manual Editor"}</T></span>
          <span><T>{"Browser editing is local; AI processing runs in your browser.\n          "}</T></span>
        </div>
      </footer>

      <ScanModal />
      <PrintStudioModal />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .page-font.page-font, .page-font.page-font *:not(.font-mono):not(svg):not(svg *) {
          font-family: "Plus Jakarta Sans", "Hind Siliguri", "Noto Sans Bengali", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
          font-optical-sizing: auto;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        .page-font h1, .page-font h2, .page-font h3, .page-font h4 { letter-spacing: -0.01em; }
        .scroll { scrollbar-width: thin; scrollbar-color: #F87171 transparent; }
        .scroll::-webkit-scrollbar { width: 12px; }
        .scroll::-webkit-scrollbar-track { background: rgba(148,163,184,0.18); border-radius: 999px; margin: 10px 0; }
        .scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#F87171,#DC2626); border-radius: 999px; border: 3px solid #F2E8D2; min-height: 48px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg,#EF4444,#B91C1C); }

        .manual-editor-root button:not(:disabled),
        .manual-editor-root [role="button"],
        .manual-editor-root input[type="range"],
        .manual-editor-root select,
        .manual-editor-root summary {
          cursor: pointer;
        }

        .manual-editor-root button:disabled,
        .manual-editor-root select:disabled,
        .manual-editor-root input:disabled {
          cursor: not-allowed;
        }
      `}</style>
    </div>);
}
export default function ManualEditorPage() {
    return (<ManualEditorProvider>
      <ManualEditorScreen />
    </ManualEditorProvider>);
}
