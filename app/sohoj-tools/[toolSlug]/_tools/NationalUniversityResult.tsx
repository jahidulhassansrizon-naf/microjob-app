"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Star,
  Share2,
  ChevronDown,
  FileText,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

const OFFICIAL_NU_RESULT_URL = "https://results.nu.ac.bd/";

export default function NationalUniversityResult() {
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [openedOfficialPortal, setOpenedOfficialPortal] = useState(false);

  const openOfficialPortal = () => {
    window.open(OFFICIAL_NU_RESULT_URL, "_blank", "noopener,noreferrer");

    setOpenedOfficialPortal(true);
  };

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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Information Card */}
        <div className="lg:col-span-4 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-gray-900">
              Check your official result
            </h2>

            <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
              Your National University result is available through the
              university&apos;s official result portal.
            </p>
          </div>

          {/* Official Portal Card */}
          <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                <GraduationCap size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                  Official National University Portal
                </p>

                <h3 className="text-sm font-extrabold text-gray-900 mt-1">
                  NU Results Archive
                </h3>

                <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                  Open the official National University website to search your
                  result using your academic information.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openOfficialPortal}
              className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <ExternalLink size={15} />
              <span>Open Official Result Website</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-800">
                  Official verification
                </p>

                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  Result details are entered and verified directly on the
                  official National University result website.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>

              <div>
                <p className="text-[11px] font-bold text-gray-800">
                  No information stored here
                </p>

                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  This page does not ask you to enter your roll, registration
                  number or other result information.
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-normal pt-2 border-t border-gray-100">
            Clicking the button above opens the official National University
            result website in a new tab.
          </p>
        </div>

        {/* Right Official Result Area */}
        <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-900">
              Official result portal
            </h2>

            <div className="w-4 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Main CTA Area */}
          <div className="flex-1 my-4 bg-gray-50/60 border border-gray-200/60 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
              <GraduationCap size={30} />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-2">
              Official National University Website
            </span>

            <h3 className="text-base md:text-lg font-extrabold text-gray-900 mb-2">
              View Your National University Result
            </h3>

            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              Click the button below to open the official National University
              result portal. Enter your required information there to view your
              result.
            </p>

            <button
              type="button"
              onClick={openOfficialPortal}
              className="mt-6 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ExternalLink size={15} />
              <span>Click Here to View Official Result</span>
              <ArrowUpRight size={14} />
            </button>

            {openedOfficialPortal && (
              <p className="text-[10px] text-teal-600 font-medium mt-3">
                Official result website opened in a new tab.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status / CTA */}
      <div className="bg-white border border-gray-200/80 rounded-2xl px-5 py-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-500" />

          <span>
            Ready to view your result on the official National University
            website
          </span>
        </div>

        <button
          type="button"
          onClick={openOfficialPortal}
          className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
        >
          <ExternalLink size={14} />
          <span>Open Official Result</span>
        </button>
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
            <p>1. Click on &quot;Open Official Result Website&quot;.</p>

            <p>
              2. The official National University result website will open in a
              new tab.
            </p>

            <p>
              3. Select the required result category and enter your information
              on the official website.
            </p>

            <p>
              4. Complete any verification shown there and view your result.
            </p>
          </div>
        )}
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700">
          Tools in the same category
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Education Board Result */}
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

          {/* ATS Friendly CV Maker */}
          <Link
            href="/sohoj-tools/ats-friendly-cv-maker"
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
