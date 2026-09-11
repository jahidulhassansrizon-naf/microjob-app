"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Calculator,
  Calendar,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
  {
    title: "Family Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/family-card-form",
    icon: CreditCard,
  },
  {
    title: "Fuel Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/fuel-card-form",
    icon: CreditCard,
  },
  {
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
];

export default function AgeCalculator() {
  const router = useRouter();

  // Inputs
  const [dob, setDob] = useState("");
  const [ageAtDate, setAgeAtDate] = useState("2026-09-11");
  const [compareAgeToggle, setCompareAgeToggle] = useState(false);
  const [compareDob, setCompareDob] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Calculate age logic if DOB is provided
  const calculateAge = () => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const targetDate = ageAtDate ? new Date(ageAtDate) : new Date();

    if (isNaN(birthDate.getTime())) return null;

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        0,
      );
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Total days/weeks approx
    const diffTime = Math.abs(targetDate.getTime() - birthDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;

    return { years, months, days, totalDays, totalWeeks, totalMonths };
  };

  const ageResult = calculateAge();

  const handleReset = () => {
    setDob("");
    setAgeAtDate("2026-09-11");
    setCompareAgeToggle(false);
    setCompareDob("");
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1 cursor-pointer"
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
                Age Calculator
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calculator size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Age Calculator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Calculate your exact age in years, months, days, and more —
              instantly in your browser.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-purple-500 hover:border-purple-300 transition-all shadow-2xs cursor-pointer"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-purple-400 text-purple-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs cursor-pointer">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ENTER DATES FORM */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Enter dates
                </span>
              </div>

              {/* Date of Birth Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400 font-medium">
                  Required — cannot be a future date
                </p>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Age at Date Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Age at Date
                </label>
                <p className="text-[11px] text-gray-400 font-medium">
                  Optional — defaults to today
                </p>
                <div className="relative">
                  <input
                    type="date"
                    value={ageAtDate}
                    onChange={(e) => setAgeAtDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Compare Age Toggle Box */}
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                      <Calculator size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        Compare Age
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Enter another birth date — compared with yours above
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compareAgeToggle}
                      onChange={() => setCompareAgeToggle(!compareAgeToggle)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {compareAgeToggle && (
                  <div className="pt-2">
                    <input
                      type="date"
                      value={compareDob}
                      onChange={(e) => setCompareDob(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: YOUR AGE PREVIEW */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Your age</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {ageResult ? "Calculated" : "Empty"}
                  </span>
                </div>

                {/* Result Display */}
                {ageResult ? (
                  <div className="mt-6 space-y-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">
                        Exact Age
                      </p>
                      <h2 className="text-3xl font-extrabold text-purple-900">
                        {ageResult.years}{" "}
                        <span className="text-base font-normal">Years</span>,{" "}
                        {ageResult.months}{" "}
                        <span className="text-base font-normal">Months</span>,{" "}
                        {ageResult.days}{" "}
                        <span className="text-base font-normal">Days</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Months
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {ageResult.totalMonths}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Weeks
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {ageResult.totalWeeks.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Days
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {ageResult.totalDays.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-32 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-2xs">
                      <Calculator size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900">
                      Enter your date of birth above to see your age instantly.
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed">
                      Enter your date of birth to see your exact age.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>
              Your files are processed in the browser — they are not uploaded to
              any server.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Calculator size={14} />
              <span>Print / Save</span>
            </button>
          </div>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>1. Select your Date of Birth in the left settings panel.</p>
              <p>
                2. Choose a custom &quot;Age at Date&quot; if you want to
                calculate age for a past or future date (defaults to today).
              </p>
              <p>
                3. View your exact age breakdown in years, months, days, weeks,
                and total months instantly on the right.
              </p>
            </div>
          )}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3">
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
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
