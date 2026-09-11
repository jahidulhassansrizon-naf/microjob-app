"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Star,
  Share2,
  RotateCw,
  Search,
  ChevronDown,
  FileText,
  UserCheck,
} from "lucide-react";

export default function NationalUniversityResult() {
  const [program, setProgram] = useState("");
  const [examination, setExamination] = useState("");
  const [examYear, setExamYear] = useState("");
  const [examRoll, setExamRoll] = useState("");
  const [regNum, setRegNum] = useState("");
  const [securityAns, setSecurityAns] = useState("");
  const [captcha, setCaptcha] = useState({ num1: 5, num2: 3 });
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  const handleRefreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2 });
    setSecurityAns("");
  };

  const handleReset = () => {
    setProgram("");
    setExamination("");
    setExamYear("");
    setExamRoll("");
    setRegNum("");
    setSecurityAns("");
  };

  const hasInput = program || examination || examYear || regNum;

  return (
    <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
      {/* Top Header / Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-800 transition-colors">
              <GraduationCap size={14} className="inline mr-1" />
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
              National University Result
            </span>
          </nav>

          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
              National University Result
            </h1>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Free
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1 font-medium">
            Check Honours, Degree Pass, Master&apos;s and Professional results
            from Bangladesh National University.
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

      {/* Main Grid: Left Form & Right Marksheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Student Information Form */}
        <div className="lg:col-span-4 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-900">
              Student information
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              Enter the same program, examination, year and registration details
              used for the NU examination.
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Program */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Program <span className="text-red-500">*</span>
              </label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Select program</option>
                <option value="honours">Honours</option>
                <option value="degree">Degree Pass</option>
                <option value="masters">Master&apos;s</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            {/* Examination */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Examination <span className="text-red-500">*</span>
              </label>
              <select
                value={examination}
                onChange={(e) => setExamination(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Select examination</option>
                <option value="1st-year">1st Year</option>
                <option value="2nd-year">2nd Year</option>
                <option value="3rd-year">3rd Year</option>
                <option value="4th-year">4th Year</option>
                <option value="final">Final Year</option>
              </select>
            </div>

            {/* Exam Year */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Exam year <span className="text-red-500">*</span>
              </label>
              <select
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Select year</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>

            {/* Exam Roll */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Exam roll{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1234567"
                value={examRoll}
                onChange={(e) => setExamRoll(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Registration number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 12345678901"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            {/* Security Answer */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Security answer <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Refresh captcha"
                >
                  <RotateCw size={14} />
                </button>
                <div className="flex-1 bg-gray-100 border border-gray-200 rounded-xl py-2 px-3 text-center font-bold text-gray-700 select-none">
                  {captcha.num1} + {captcha.num2} = ?
                </div>
                <input
                  type="text"
                  placeholder="Enter the sum"
                  value={securityAns}
                  onChange={(e) => setSecurityAns(e.target.value)}
                  className="w-32 bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-normal pt-2 border-t border-gray-100">
            Results are requested from results.nu.ac.bd. A fresh security
            question is required for each request.
          </p>
        </div>

        {/* Right Column: Official Marksheet Preview Area */}
        <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs min-h-[480px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-900">
              Official marksheet
            </h2>
            <div className="w-4 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Card Inner Content */}
          <div className="flex-1 my-4 bg-gray-50/60 border border-gray-200/60 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-3">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xs font-bold text-gray-800 mb-1">
              Enter student details
            </h3>
            <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
              The official National University result PDF will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action / Status Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${hasInput ? "bg-teal-500" : "bg-gray-300"}`}
          />
          <span>
            {hasInput ? "Ready to fetch result" : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!hasInput}
            className="flex-1 sm:flex-initial px-5 py-2 bg-gray-100 text-gray-400 disabled:opacity-70 disabled:cursor-not-allowed text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:bg-teal-600 hover:text-white"
          >
            <Search size={14} />
            <span>Get Result</span>
          </button>
        </div>
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
              1. Select your Academic Program (e.g., Honours, Degree,
              Master&apos;s).
            </p>
            <p>2. Select the Exam Year and Examination term.</p>
            <p>
              3. Provide your Registration Number accurately as printed on your
              admit card.
            </p>
            <p>
              4. Solve the security answer and click on &quot;Get Result&quot;.
            </p>
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
            href="/sohoj-tools/ats-cv-maker"
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-blue-300 transition-all flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                ATS Friendly CV Maker
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Build an ATS-friendly CV — live preview and PDF download.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
