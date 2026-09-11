"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Star,
  Share2,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Search,
  ArrowLeft,
  Briefcase,
  FileUser,
  ChevronUp,
} from "lucide-react";

export default function EducationBoardResult() {
  const [board, setBoard] = useState("");
  const [examination, setExamination] = useState("");
  const [year, setYear] = useState("");
  const [roll, setRoll] = useState("");
  const [reg, setReg] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [showHowToUse, setShowHowToUse] = useState(false);

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Tools</span>
        </Link>
        <span>/</span>
        <span>Educational Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">
          Education Board Result
        </span>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Education Board Result
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Check JSC, SSC, HSC and equivalent results from Bangladesh's
              official education board system.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Star size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Form & Right Result Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Input Form */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Student information
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Enter the same board, examination, year, roll and registration
              details used for the examination.
            </p>
          </div>

          <div className="space-y-3">
            {/* Board */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Board <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700"
                >
                  <option value="">Select board</option>
                  <option value="dhaka">Dhaka</option>
                  <option value="chittagong">Chittagong</option>
                  <option value="rajshahi">Rajshahi</option>
                  <option value="comilla">Comilla</option>
                  <option value="barisal">Barisal</option>
                  <option value="sylhet">Sylhet</option>
                  <option value="dinajpur">Dinajpur</option>
                  <option value="jessore">Jessore</option>
                  <option value="mymensingh">Mymensingh</option>
                  <option value="madrasah">Madrasah</option>
                  <option value="technical">Technical</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Examination */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Examination <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700"
                >
                  <option value="">Select examination</option>
                  <option value="ssc">SSC / Dakhil / Equivalent</option>
                  <option value="hsc">HSC / Alim / Equivalent</option>
                  <option value="jsc">JSC / JDC</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Year <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700"
                >
                  <option value="">Select year</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Roll number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 123456"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-gray-300"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 mb-1 block">
                Registration number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1234567890"
                value={reg}
                onChange={(e) => setReg(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-gray-300"
              />
            </div>

            {/* CAPTCHA Card */}
            <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 space-y-2">
              <label className="text-[11px] font-bold text-gray-700 block">
                Security code (CAPTCHA) <span className="text-red-500">*</span>
              </label>

              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[70px]">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <RefreshCw size={13} />
                </button>
                <span className="text-xs font-bold text-red-500 tracking-wide">
                  CAPTCHA unavailable
                </span>
              </div>

              <input
                type="text"
                placeholder="Enter the code shown above"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-gray-300"
              />
            </div>

            {/* Warning Info Box */}
            <div className="bg-amber-50/60 border border-amber-200/60 p-2.5 rounded-xl text-[10px] text-amber-800 font-medium">
              Results are requested from educationboardresults.gov.bd. A fresh
              CAPTCHA is required for each request.
            </div>

            {/* Submit Button */}
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed transition-all"
            >
              <Search size={14} />
              <span>Get Result</span>
            </button>
          </div>
        </div>

        {/* Right Side: Result Viewer */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[500px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">Official result</h2>
            <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
              Error
            </span>
          </div>

          {/* Empty / Error State */}
          <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
            <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-3 border border-red-100">
              <AlertTriangle size={20} />
            </div>
            <p className="text-xs font-semibold text-red-500">
              Network error. Please try again.
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Bottom Status & Action Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>
            The result could not be retrieved — review the message and try
            again.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all">
            Reset
          </button>
          <button
            disabled
            className="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-not-allowed transition-all"
          >
            <Search size={14} />
            <span>Get Result</span>
          </button>
        </div>
      </div>

      {/* How to use Accordion */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-500">?</span>
            <span>How to use</span>
          </div>
          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            Select your Education Board, Examination type (SSC/HSC/JSC), Year,
            and enter your Roll and Registration number along with the Security
            CAPTCHA to fetch official results.
          </div>
        )}
      </div>

      {/* Related Tools Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/form-auto-fillup"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Briefcase size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                Form auto fillup
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Auto fill job application forms quickly.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/national-university-result"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <GraduationCap size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                National University Result
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Check Honours, Degree Pass and Masters results.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/ats-friendly-cv-maker"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <FileUser size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                ATS Friendly CV Maker
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Build an ATS-friendly CV with live preview.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
