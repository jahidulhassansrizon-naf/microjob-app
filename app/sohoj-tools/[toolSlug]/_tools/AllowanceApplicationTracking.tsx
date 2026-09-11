"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  FileText,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  RefreshCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
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

export default function AllowanceApplicationTracking() {
  const router = useRouter();

  // Tab state: "trackingId" or "nid"
  const [activeTab, setActiveTab] = useState<"trackingId" | "nid">(
    "trackingId",
  );

  // Form inputs
  const [trackingId, setTrackingId] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [dob, setDob] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  // Result state (null, "loading", "success", "not-found")
  const [trackingStatus, setTrackingStatus] = useState<
    "idle" | "success" | "not-found"
  >("idle");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleTrack = () => {
    if (!trackingId && !nidNumber) return;
    // Simulate lookup
    setTrackingStatus("success");
  };

  const handleReset = () => {
    setTrackingId("");
    setNidNumber("");
    setDob("");
    setCaptchaInput("");
    setTrackingStatus("idle");
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
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1"
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
                Allowance Application Tracking
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <FileText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Allowance Application Tracking
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Check where a Department of Social Services allowance application
              stands — by tracking id or NID — and print the result.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-purple-500 hover:border-purple-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-purple-400 text-purple-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: APPLICATION DETAILS FORM */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Application details
                </span>
              </div>

              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Enter the tracking id you received when the application was
                submitted. No id? Use the NID/birth registration number with the
                date of birth instead.
              </p>

              {/* Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("trackingId")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "trackingId"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Tracking id
                </button>
                <button
                  onClick={() => setActiveTab("nid")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "nid"
                      ? "bg-amber-500 text-white shadow-2xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  NID & date of birth
                </button>
              </div>

              {/* Conditional Inputs */}
              {activeTab === "trackingId" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Tracking id <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="e.g. 0123456789"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      NID / Birth Registration number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      placeholder="e.g. 19951234567890123"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Date of birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Captcha Section */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-gray-700">
                  Captcha code <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-center font-mono text-base font-bold tracking-widest text-gray-700 select-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:8px_8px] flex-1">
                    <span className="italic line-through decoration-purple-500">
                      20
                    </span>{" "}
                    + <span className="underline decoration-amber-500">9</span>{" "}
                    =
                  </div>
                  <button
                    onClick={() => setCaptchaInput("")}
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-800 transition-colors"
                    title="Refresh captcha"
                  >
                    <RefreshCcw size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Type the code shown"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 mt-2"
                />
              </div>

              {/* Track Action Button */}
              <button
                onClick={handleTrack}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
              >
                <Search size={16} />
                <span>Track application</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: APPLICATION STATUS PREVIEW */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[580px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Application status</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {trackingStatus === "success" ? "Success" : "Empty"}
                  </span>
                </div>

                {/* Status Content */}
                {trackingStatus === "success" ? (
                  <div className="mt-6 space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                      <CheckCircle2
                        size={20}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-900">
                          Application Approved & Verified
                        </h4>
                        <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                          Your old age / social safety net allowance application
                          has been successfully verified by the Upazila Social
                          Services Office.
                        </p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-2xl p-4 space-y-3 text-xs bg-gray-50/50">
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-medium">
                          Tracking ID:
                        </span>
                        <span className="font-bold text-gray-900">
                          {trackingId || "TRK-9842510"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-medium">
                          Applicant Name:
                        </span>
                        <span className="font-bold text-gray-900">
                          Md. Abdul Hakim
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-medium">
                          Allowance Type:
                        </span>
                        <span className="font-bold text-gray-900">
                          Old Age Allowance (বয়স্ক ভাতা)
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500 font-medium">
                          Current Stage:
                        </span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Disbursed / Active
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">
                          Bank / Mobile Account:
                        </span>
                        <span className="font-bold text-gray-900">
                          Nagad (01712******)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-32 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-2xs">
                      <FileText size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900">
                      Enter application details
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed">
                      The current stage of your application and every step it
                      has passed will appear here.
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
            <span>Add an input to get started</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleTrack}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
            >
              <Search size={14} />
              <span>Track application</span>
            </button>
          </div>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Enter your unique tracking ID or NID with date of birth on
                the left panel.
              </p>
              <p>2. Complete the simple captcha verification code.</p>
              <p>
                3. Click &quot;Track application&quot; to view your current
                approval status instantly.
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
