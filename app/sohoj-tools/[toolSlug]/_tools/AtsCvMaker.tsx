"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  Share2,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Upload,
  Download,
  Printer,
  RotateCw,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Sparkles,
} from "lucide-react";

export default function AtsCvMaker() {
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [currentStep, setCurrentStep] = useState(1);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(true);

  const steps = [
    { id: 1, label: "Import" },
    { id: 2, label: "Personal" },
    { id: 3, label: "Summary" },
    { id: 4, label: "Experience" },
    { id: 5, label: "Education" },
    { id: 6, label: "Skills" },
    { id: 7, label: "Projects" },
    { id: 8, label: "Finalize" },
  ];

  const templates = [
    { id: "classic", label: "Classic ATS", selected: true },
    { id: "modern", label: "Modern", selected: false },
    { id: "professional", label: "Professional", selected: false },
    { id: "elegant", label: "Elegant", selected: false },
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
      {/* Top Header / Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-800 transition-colors">
              <FileText size={14} className="inline mr-1" />
            </Link>
            <span>/</span>
            <Link
              href="/sohoj-tools"
              className="hover:text-gray-800 transition-colors"
            >
              Sohoz Tools
            </Link>
            <span>/</span>
            <span className="hover:text-gray-800 transition-colors cursor-pointer">
              Educational Tools
            </span>
            <span>/</span>
            <span className="font-semibold text-gray-800">
              ATS Friendly CV Maker
            </span>
          </nav>

          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
              ATS Friendly CV Maker
            </h1>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Free
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1 font-medium">
            Build an ATS-friendly CV — live preview and PDF download.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
            title="Favorite"
          >
            <Star size={16} />
          </button>
          <button
            type="button"
            className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
            title="Share"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Settings & Right Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings & Form Wizard */}
        <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-900">Settings</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              Fill in your CV step by step. The preview updates as you type.
            </p>
          </div>

          {/* Template Card */}
          <div className="border border-orange-200 bg-orange-50/20 rounded-xl p-3.5 space-y-3">
            <button
              type="button"
              onClick={() => setIsTemplateOpen(!isTemplateOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800">
                  Template
                </span>
                <span className="text-[10px] text-amber-600 font-medium">
                  More designs coming soon
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform duration-200 ${
                  isTemplateOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isTemplateOpen && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`relative rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? "border-orange-500 bg-white shadow-2xs ring-1 ring-orange-400"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {/* Thumbnail Placeholder */}
                      <div className="w-full h-12 bg-gradient-to-r from-amber-100/70 to-orange-100/70 rounded-lg mb-2 flex items-center justify-center p-1.5">
                        <div className="w-full h-full bg-white/80 rounded border border-orange-200/50" />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-800">
                          {tpl.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            className="text-orange-500 fill-orange-500 stroke-white"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step Progress Header */}
          <div className="border border-amber-200/80 bg-amber-50/30 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-800 font-bold">
                Import{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </span>
              <span className="text-orange-600 font-extrabold text-[11px]">
                {currentStep}/8 steps - {Math.round((currentStep / 8) * 100)}%
              </span>
            </div>

            {/* Step Navigation Dots Bar */}
            <div className="flex items-center justify-between gap-1 py-1">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                      currentStep === s.id
                        ? "bg-orange-500 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStep === steps.length}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400">
              Required fields: 0/2
            </p>
          </div>

          {/* Step Content Box */}
          <div className="border border-orange-200/80 rounded-xl p-4 space-y-3 bg-white">
            <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wide">
              0. Import from PDF
            </h3>
            <p className="text-[11px] text-gray-500">
              Upload an existing CV PDF to pre-fill the form.
            </p>

            {/* Upload Box */}
            <div className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Upload size={18} />
              </div>
              <p className="text-xs font-bold text-indigo-700">
                Upload an existing CV PDF
              </p>
              <p className="text-[10px] text-gray-400 max-w-xs mt-1 leading-relaxed">
                PDFs downloaded from this tool are read directly. Scanned PDFs
                will use OCR (max 8 MB).
              </p>
            </div>
          </div>

          {/* Previous / Next Step Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="flex-1 py-2 px-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              &lt; Previous step
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1"
            >
              <span>Next step</span>
              <span>&gt;</span>
            </button>
          </div>

          {/* Action Export Buttons */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                className="py-2.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
              >
                <RotateCw size={12} />
                <span>Clear all</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: CV Preview Sheet Area */}
        <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs min-h-[620px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-900">Preview</h2>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Live preview
              </span>
            </div>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-md">
              Empty
            </span>
          </div>

          {/* Blank CV Document Sheet */}
          <div className="flex-1 my-4 bg-gray-100/60 border border-gray-200/60 rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md aspect-[1/1.4] bg-white rounded-md shadow-md border border-gray-200 p-8 flex flex-col justify-between">
              {/* Dummy CV Content Lines */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4 space-y-2">
                  <div className="w-3/4 h-5 bg-gray-200 rounded" />
                  <div className="w-1/2 h-3 bg-gray-100 rounded" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="w-1/3 h-3.5 bg-gray-200 rounded" />
                  <div className="w-full h-2.5 bg-gray-100 rounded" />
                  <div className="w-full h-2.5 bg-gray-100 rounded" />
                  <div className="w-4/5 h-2.5 bg-gray-100 rounded" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="w-1/3 h-3.5 bg-gray-200 rounded" />
                  <div className="w-full h-2.5 bg-gray-100 rounded" />
                  <div className="w-3/4 h-2.5 bg-gray-100 rounded" />
                </div>
              </div>

              <div className="text-center pt-6 border-t border-gray-100">
                <span className="text-[10px] text-gray-300">
                  CV Preview Area
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security/Privacy Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* Collapsible: How to use */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-sm">?</span>
            <span className="text-xs font-bold text-gray-800">How to use</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform duration-200 ${
              isHowToUseOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isHowToUseOpen && (
          <div className="px-5 pb-4 pt-1 text-xs text-gray-600 border-t border-gray-100 space-y-2">
            <p>
              1. Choose an ATS-friendly layout template from the top section.
            </p>
            <p>
              2. Upload an existing PDF CV or fill out each section
              step-by-step.
            </p>
            <p>3. Review your live updated CV preview on the right panel.</p>
            <p>4. Download as PDF or print directly once complete.</p>
          </div>
        )}
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <Link
            href="/sohoj-tools/form-auto-fillup"
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-teal-300 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                Form auto fillup
              </h4>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/sohoj-tools/education-board-result"
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-teal-300 transition-all flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                Education Board Result
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Check JSC, SSC, HSC and equivalent results from
                Bangladesh&apos;s official education board system.
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/sohoj-tools/national-university-result"
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-teal-300 transition-all flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                National University Result
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Check Honours, Degree Pass, Master&apos;s and Professional
                results from Bangladesh National University.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
