"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  CreditCard,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Printer,
  RotateCcw,
  Download,
} from "lucide-react";

// Related tools in the same category
const relatedTools = [
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
      "Fill in your details on the left — see a live Form-13 on the right and download as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
  {
    title: "Allowance Application Tracking",
    description:
      "Check status of Department of Social Services allowance application status, — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/allowance-application-tracking",
    icon: FileText,
  },
];

export default function FamilyCardForm() {
  const router = useRouter();

  // States for form inputs
  const [recipient, setRecipient] = useState("Ward Councillor");
  const [unionName, setUnionName] = useState("01. 1st Union Parishad");
  const [applicantName, setApplicantName] = useState("");
  const [fatherHusband, setFatherHusband] = useState("");
  const [motherName, setMotherName] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [village, setVillage] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [wordNo, setWordNo] = useState("");
  const [upazila, setUpazila] = useState("");
  const [district, setDistrict] = useState("");
  const [numSons, setNumSons] = useState("2");
  const [numDaughters, setNumDaughters] = useState("1");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleClear = () => {
    setApplicantName("");
    setFatherHusband("");
    setMotherName("");
    setNidNumber("");
    setMobileNumber("");
    setVillage("");
    setPostOffice("");
    setWordNo("");
    setUpazila("");
    setDistrict("");
    setNumSons("2");
    setNumDaughters("1");
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
                Family Card Form
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <CreditCard size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Family Card Form
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Fill in your details on the left — see a live application letter
              on the right and download as PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-blue-400 text-blue-400" : ""}
              />
            </button>
            <button className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs">
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM SETTINGS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Settings
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Fill in all fields who preview update as you type.
                </span>
              </div>

              {/* 1. General Information */}
              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  1. General Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Select recipient
                    </label>
                    <select
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Ward Councillor">Ward Councillor</option>
                      <option value="Chairman">Chairman</option>
                      <option value="Mayor">Mayor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Union / municipality name
                    </label>
                    <input
                      type="text"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      placeholder="e.g. 1st Union Parishad"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Applicant full name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Applicant name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Father / husband name
                    </label>
                    <input
                      type="text"
                      value={fatherHusband}
                      onChange={(e) => setFatherHusband(e.target.value)}
                      placeholder="Father / husband name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Mother name
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Mother name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      National ID (NID) number
                    </label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      placeholder="National ID number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Mobile number
                    </label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01712345678"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Full address */}
              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  2. Full address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Village / neighbourhood
                    </label>
                    <input
                      type="text"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      placeholder="Village name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Post office
                    </label>
                    <input
                      type="text"
                      value={postOffice}
                      onChange={(e) => setPostOffice(e.target.value)}
                      placeholder="Post office name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Ward number
                    </label>
                    <input
                      type="text"
                      value={wordNo}
                      onChange={(e) => setWordNo(e.target.value)}
                      placeholder="e.g. 03"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Upazila
                    </label>
                    <input
                      type="text"
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      placeholder="Upazila name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="District name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 3. Family details (children) */}
              <div className="space-y-3 border border-purple-200/80 rounded-xl p-3.5 bg-purple-50/20">
                <h3 className="text-xs font-bold text-purple-900">
                  3. Family details (children)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Number of sons
                    </label>
                    <input
                      type="text"
                      value={numSons}
                      onChange={(e) => setNumSons(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Number of daughters
                    </label>
                    <input
                      type="text"
                      value={numDaughters}
                      onChange={(e) => setNumDaughters(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleClear}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW LETTER */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[700px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Live preview</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    Empty
                  </span>
                </div>

                {/* PDF Letter Document Look */}
                <div className="mt-4 bg-white border border-gray-300 rounded-lg p-8 shadow-sm text-gray-800 font-serif text-xs space-y-4 leading-relaxed relative">
                  <div className="text-center font-bold text-sm tracking-wide underline uppercase mb-6">
                    Family Card Application
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold">To,</p>
                    <p className="font-semibold">
                      {recipient || "......................................"}
                    </p>
                    <p>
                      {unionName || "......................................"}
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold">
                      Subject: Regarding Family Card / application for Family
                      Card.
                    </p>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold">Sir,</p>
                    <p className="mt-1 text-justify">
                      I hereby certify that I am a permanent resident of the
                      said ward/union/municipality area. Due to socio-economic
                      reasons and to receive government benefits and
                      relief/subsidized services, I need a family card. Detailed
                      information about me and my family is provided below:
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">1.</span>
                      <span className="col-span-3 font-semibold">
                        Applicant name:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {applicantName}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">2.</span>
                      <span className="col-span-3 font-semibold">
                        Father/husband name:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {fatherHusband}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">3.</span>
                      <span className="col-span-3 font-semibold">
                        Mother name:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {motherName}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">4.</span>
                      <span className="col-span-3 font-semibold">
                        National ID number:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {nidNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">5.</span>
                      <span className="col-span-3 font-semibold">
                        Mobile number:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {mobileNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-1 font-bold">6.</span>
                      <span className="col-span-3 font-semibold">
                        Current and permanent address:
                      </span>
                      <span className="col-span-8">
                        Village/neighbourhood:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {village}
                        </span>
                        , Post office:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {postOffice}
                        </span>
                        <br />
                        Ward no.:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {wordNo}
                        </span>
                        , Upazila:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {upazila}
                        </span>
                        <br />
                        District:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {district}
                        </span>
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 pt-1">
                      <span className="col-span-1 font-bold">7.</span>
                      <span className="col-span-3 font-semibold">
                        Family member details:
                      </span>
                      <span className="col-span-8">
                        Sons:{" "}
                        <span className="border-b border-dotted border-gray-400 px-2">
                          {numSons}
                        </span>{" "}
                        &nbsp;&nbsp;&nbsp; Daughters:{" "}
                        <span className="border-b border-dotted border-gray-400 px-2">
                          {numDaughters}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-justify">
                      Therefore, after verifying the above information, I kindly
                      request you to take the necessary steps to issue me a
                      family card.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="pt-16 flex justify-between items-end text-center">
                    <div>
                      <div className="w-40 border-b border-black mb-1"></div>
                      <p className="text-[10px] font-bold">
                        Signature (recipient / ward representative)
                      </p>
                    </div>
                    <div>
                      <div className="w-40 border-b border-black mb-1"></div>
                      <p className="text-[10px] font-bold">
                        Applicant signature
                      </p>
                    </div>
                  </div>

                  {/* Stamp Box on top right */}
                  <div className="absolute top-8 right-8 w-24 h-28 border-2 border-dashed border-gray-400 flex items-center justify-center text-[9px] text-center text-gray-400 p-1">
                    Passport-size photo with staple/seal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Add an input to get started</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={() => alert("Downloading PDF...")}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* IMPORTANT INFORMATION AND INSTRUCTIONS */}
        <div className="bg-sky-50/40 border border-sky-200/80 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
            Important Information and Instructions:
          </h3>
          <p className="text-xs text-gray-700 font-medium">
            The following documents must be attached:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li>
              Attach one colour passport-size photo in the application form with
              a stapler.
            </li>
            <li>
              Submit a photocopy of the National ID (NID) with the application
              form.
            </li>
            <li>
              Submit photocopies of National IDs of all other family members (if
              any).
            </li>
            <li>An active mobile number must be provided.</li>
          </ul>
          <p className="text-[11px] font-bold text-red-600 pt-1">
            Fill in all information correctly and accurately. The application
            may be cancelled for incorrect information.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            Submit this form to a respectable person in your area — Member,
            Chairman, Councillor or Mayor. There is no online system to apply
            for a family card.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            You do not need to pay anyone or use a broker to get this government
            benefit — the Family Card is distributed free of charge by the
            government.
          </p>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
          <ShieldCheck size={16} className="text-blue-600 shrink-0" />
          <span>
            Your files are processed in the browser — they are not uploaded to
            any server.
          </span>
        </div>

        {/* HOW TO USE DROPDOWN */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Fill in your personal details, address, and family
                information on the left panel.
              </p>
              <p>
                2. Watch the application letter update live on the right panel.
              </p>
              <p>3. Print or download the form as a PDF to submit.</p>
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
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
