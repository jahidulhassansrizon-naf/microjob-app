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
  Printer,
  RotateCcw,
  Download,
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
    title: "Allowance Application Tracking",
    description:
      "Check status of Department of Social Services allowance application status, — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/allowance-application-tracking",
    icon: FileText,
  },
];

export default function VoterMigrationForm() {
  const router = useRouter();

  // States for form inputs
  const [upazilaThana, setUpazilaThana] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState("");
  const [currentVoterNo, setCurrentVoterNo] = useState("");
  const [voterAreaName, setVoterAreaName] = useState("");
  const [voterAreaCode, setVoterAreaCode] = useState("");
  const [currentUpazila, setCurrentUpazila] = useState("");
  const [currentDistrict, setCurrentDistrict] = useState("");
  const [currentVillage, setCurrentVillage] = useState("");
  const [currentHouseNo, setCurrentHouseNo] = useState("");

  // New address states
  const [newDistrict, setNewDistrict] = useState("");
  const [newUpazila, setNewUpazila] = useState("");
  const [newCityCorp, setNewCityCorp] = useState("");
  const [newWordNo, setNewWordNo] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaCode, setNewAreaCode] = useState("");
  const [newVillage, setNewVillage] = useState("");
  const [newHouseNo, setNewHouseNo] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPostOffice, setNewPostOffice] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");

  // Residence & reason states
  const [residingDate, setResidingDate] = useState("");
  const [migrationReason, setMigrationReason] = useState("");

  // Identifier states
  const [identifierName, setIdentifierName] = useState("");
  const [identifierNid, setIdentifierNid] = useState("");
  const [identifierVoterNo, setIdentifierVoterNo] = useState("");
  const [identifierAddress, setIdentifierAddress] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleClear = () => {
    setUpazilaThana("");
    setDistrictName("");
    setApplicantName("");
    setNationalId("");
    setDob("");
    setCurrentVoterNo("");
    setVoterAreaName("");
    setVoterAreaCode("");
    setCurrentUpazila("");
    setCurrentDistrict("");
    setCurrentVillage("");
    setCurrentHouseNo("");
    setNewDistrict("");
    setNewUpazila("");
    setNewCityCorp("");
    setNewWordNo("");
    setNewAreaName("");
    setNewAreaCode("");
    setNewVillage("");
    setNewHouseNo("");
    setNewPhone("");
    setNewPostOffice("");
    setNewPostalCode("");
    setResidingDate("");
    setMigrationReason("");
    setIdentifierName("");
    setIdentifierNid("");
    setIdentifierVoterNo("");
    setIdentifierAddress("");
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
                Voter Migration Form
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <FileText size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Voter Migration Form
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Fill in your details on the left — see a live Form-13 on the right
              and download as PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-500 hover:border-indigo-300 transition-all shadow-2xs"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-indigo-400 text-indigo-400" : ""}
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
                  Fill in all fields. Preview updates as you type.
                </span>
              </div>

              {/* 1. Recipient */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  1. Recipient (election office)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Upazila / Thana (election office)
                    </label>
                    <input
                      type="text"
                      value={upazilaThana}
                      onChange={(e) => setUpazilaThana(e.target.value)}
                      placeholder="e.g. upazila / thana na"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      District (election office)
                    </label>
                    <input
                      type="text"
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      placeholder="district name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Applicant details */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  2. Applicant details
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Applicant name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="applicant name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      National ID (NID) number
                    </label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="national id number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Date of birth
                    </label>
                    <input
                      type="text"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Current enrolment */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  3. Current enrolment
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Voter number
                  </label>
                  <input
                    type="text"
                    value={currentVoterNo}
                    onChange={(e) => setCurrentVoterNo(e.target.value)}
                    placeholder="current voter number"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Voter area name
                    </label>
                    <input
                      type="text"
                      value={voterAreaName}
                      onChange={(e) => setVoterAreaName(e.target.value)}
                      placeholder="voter area name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Voter area code
                    </label>
                    <input
                      type="text"
                      value={voterAreaCode}
                      onChange={(e) => setVoterAreaCode(e.target.value)}
                      placeholder="area code"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Upazila / Thana
                    </label>
                    <input
                      type="text"
                      value={currentUpazila}
                      onChange={(e) => setCurrentUpazila(e.target.value)}
                      placeholder="upazila / thana name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      District
                    </label>
                    <input
                      type="text"
                      value={currentDistrict}
                      onChange={(e) => setCurrentDistrict(e.target.value)}
                      placeholder="district name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Village / road name and number
                    </label>
                    <input
                      type="text"
                      value={currentVillage}
                      onChange={(e) => setCurrentVillage(e.target.value)}
                      placeholder="village / road name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      House / holding number
                    </label>
                    <input
                      type="text"
                      value={currentHouseNo}
                      onChange={(e) => setCurrentHouseNo(e.target.value)}
                      placeholder="house / holding number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Area you want to move to */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  4. Area you want to move to
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      District (new)
                    </label>
                    <input
                      type="text"
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      placeholder="district name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Upazila / Thana (new)
                    </label>
                    <input
                      type="text"
                      value={newUpazila}
                      onChange={(e) => setNewUpazila(e.target.value)}
                      placeholder="upazila / thana name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      City corporation / municipality / union / cantonment board
                    </label>
                    <input
                      type="text"
                      value={newCityCorp}
                      onChange={(e) => setNewCityCorp(e.target.value)}
                      placeholder="e.g. union parishad"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Ward number
                    </label>
                    <input
                      type="text"
                      value={newWordNo}
                      onChange={(e) => setNewWordNo(e.target.value)}
                      placeholder="e.g. 03"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Voter area name (new)
                    </label>
                    <input
                      type="text"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="voter area name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Voter area number (new)
                    </label>
                    <input
                      type="text"
                      value={newAreaCode}
                      onChange={(e) => setNewAreaCode(e.target.value)}
                      placeholder="area code"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Village / road name and number (new)
                    </label>
                    <input
                      type="text"
                      value={newVillage}
                      onChange={(e) => setNewVillage(e.target.value)}
                      placeholder="village / road name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      House / holding number (new)
                    </label>
                    <input
                      type="text"
                      value={newHouseNo}
                      onChange={(e) => setNewHouseNo(e.target.value)}
                      placeholder="house / holding number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Telephone / mobile number
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Post office
                    </label>
                    <input
                      type="text"
                      value={newPostOffice}
                      onChange={(e) => setNewPostOffice(e.target.value)}
                      placeholder="post office name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Post code
                  </label>
                  <input
                    type="text"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 5. Residence period and reason */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  5. Residence period and reason
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Living at the new address since
                  </label>
                  <input
                    type="text"
                    value={residingDate}
                    onChange={(e) => setResidingDate(e.target.value)}
                    placeholder="e.g. 01st January 2026"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Reason for migration
                  </label>
                  <input
                    type="text"
                    value={migrationReason}
                    onChange={(e) => setMigrationReason(e.target.value)}
                    placeholder="e.g. Job / marriage / permanent residence"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 6. Identifier details (optional) */}
              <div className="space-y-3 border border-indigo-200/80 rounded-xl p-3.5 bg-indigo-50/20">
                <h3 className="text-xs font-bold text-indigo-900">
                  6. Identifier details (optional)
                </h3>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Identifier name
                  </label>
                  <input
                    type="text"
                    value={identifierName}
                    onChange={(e) => setIdentifierName(e.target.value)}
                    placeholder="identifier name"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Identifier NID number
                    </label>
                    <input
                      type="text"
                      value={identifierNid}
                      onChange={(e) => setIdentifierNid(e.target.value)}
                      placeholder="identifier nid number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Identifier voter number
                    </label>
                    <input
                      type="text"
                      value={identifierVoterNo}
                      onChange={(e) => setIdentifierVoterNo(e.target.value)}
                      placeholder="identifier voter number"
                      className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Identifier address
                  </label>
                  <input
                    type="text"
                    value={identifierAddress}
                    onChange={(e) => setIdentifierAddress(e.target.value)}
                    placeholder="identifier address"
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2 bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
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

          {/* RIGHT COLUMN: PREVIEW LETTER (2 PAGES) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between min-h-[900px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Live preview</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    Empty
                  </span>
                </div>

                {/* Page 1 */}
                <div className="mt-4 bg-white border border-gray-300 rounded-lg p-6 shadow-sm text-gray-800 font-serif text-[11px] space-y-3 leading-relaxed relative">
                  <div className="text-right font-bold text-[10px]">ফরম-১৩</div>
                  <div className="text-center font-bold text-xs uppercase tracking-wide">
                    নিবন্ধন এলাকা পরিবর্তন সংক্রান্ত ভোটার তালিকা স্থানান্তরের
                    আবেদন
                  </div>

                  <div className="space-y-1 pt-1">
                    <p className="font-bold">বরাবর,</p>
                    <p className="font-semibold">
                      উপজেলা / থানা নির্বাচন অফিসার
                    </p>
                    <p>
                      {upazilaThana ||
                        "................................................"}{" "}
                      &nbsp;{" "}
                      {districtName || "................................"}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">১.</span>
                      <span className="col-span-3 font-semibold">
                        আবেদনকারীর নাম:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {applicantName}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">২.</span>
                      <span className="col-span-3 font-semibold">
                        জাতীয় পরিচয়পত্র নম্বর:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {nationalId}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৩.</span>
                      <span className="col-span-3 font-semibold">
                        জন্ম তারিখ:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {dob}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৪.</span>
                      <span className="col-span-3 font-semibold">
                        বর্তমান ভোটার নম্বর:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {currentVoterNo}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৫.</span>
                      <span className="col-span-3 font-semibold">
                        বর্তমান ভোটার এলাকা:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {voterAreaName} (কোড: {voterAreaCode}), উপজেলা:{" "}
                        {currentUpazila}, জেলা: {currentDistrict}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold">মহোদয়,</p>
                    <p className="text-justify mt-0.5">
                      আমি নিম্ন স্বাক্ষরকারী বর্তমান ভোটার এলাকা হইতে অন্য
                      এলাকায় স্থায়ীভাবে বসবাস শুরু করিয়াছি বিধায় আমার নাম
                      বর্তমান ভোটার তালিকা হইতে কাটিয়া নতুন ঠিকানায় স্থানান্তর
                      করার অনুরোধ করিতেছি।
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৬.</span>
                      <span className="col-span-3 font-semibold">
                        যে এলাকায় যেতে চান:
                      </span>
                      <span className="col-span-8">
                        জেলা:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newDistrict}
                        </span>
                        , উপজেলা:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newUpazila}
                        </span>
                        <br />
                        ইউনিয়ন/পৌরসভা:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newCityCorp}
                        </span>
                        , ওয়ার্ড নম্বর:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newWordNo}
                        </span>
                        <br />
                        গ্রাম/রাস্তা:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newVillage}
                        </span>
                        , বাসা/হোল্ডিং:{" "}
                        <span className="border-b border-dotted border-gray-400 inline-block px-1">
                          {newHouseNo}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-12 flex justify-end text-center">
                    <div>
                      <div className="w-36 border-b border-black mb-1"></div>
                      <p className="text-[9px] font-bold">
                        আবেদনকারীর স্বাক্ষর
                      </p>
                    </div>
                  </div>
                </div>

                {/* Page 2 */}
                <div className="mt-6 bg-white border border-gray-300 rounded-lg p-6 shadow-sm text-gray-800 font-serif text-[11px] space-y-3 leading-relaxed relative">
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৭.</span>
                      <span className="col-span-3 font-semibold">
                        নতুন ঠিকানায় বসবাসের সময়:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {residingDate}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-1">
                      <span className="col-span-1 font-bold">৮.</span>
                      <span className="col-span-3 font-semibold">
                        স্থানান্তরের কারণ:
                      </span>
                      <span className="col-span-8 border-b border-dotted border-gray-400">
                        {migrationReason}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold text-[10px]">
                      শনাক্তকারীর বিবরণ (যদি থাকে):
                    </p>
                    <p className="text-[10px]">
                      নাম: {identifierName} | জাতীয় পরিচয়পত্র: {identifierNid} |
                      ভোটার নম্বর: {identifierVoterNo}
                    </p>
                    <p className="text-[10px]">ঠিকানা: {identifierAddress}</p>
                  </div>

                  <div className="pt-6">
                    <p className="font-bold text-center underline">
                      অফিস ব্যবহারের জন্য
                    </p>
                    <p className="text-[10px] mt-1">
                      তদন্তকারী কর্মকর্তার মন্তব্য ও সুপারিশ:
                    </p>
                    <div className="h-12 border-b border-dotted border-gray-400"></div>
                  </div>

                  {/* Signatures */}
                  <div className="pt-16 flex justify-between items-end text-center">
                    <div>
                      <div className="w-36 border-b border-black mb-1"></div>
                      <p className="text-[9px] font-bold">
                        তদন্তকারী কর্মকর্তার স্বাক্ষর
                      </p>
                    </div>
                    <div>
                      <div className="w-36 border-b border-black mb-1"></div>
                      <p className="text-[9px] font-bold">
                        নির্বাচন অফিসারের স্বাক্ষর
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
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
            Attach the following documents with the application:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1.5 font-medium">
            <li>A photocopy of the National ID (NID) must be attached.</li>
            <li>
              A certificate from the local union office / mayor / chairman
              proving previous/new address.
            </li>
            <li>A copy of a utility bill (if available).</li>
            <li>
              Holding tax receipt / chowkidar tax receipt / municipal tax or
              other proof.
            </li>
          </ul>
          <p className="text-[11px] font-bold text-red-600 pt-1">
            Fill in all field correctly. Wrong information can get the
            application rejected.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            Print the completed Form-13 (2 pages), and submit it to your
            specific thana/thana election office.
          </p>
          <p className="text-[11px] font-medium text-gray-600">
            You do not need a broker or any payment to migrate your vote — this
            service is free of charge.
          </p>
        </div>

        {/* PRIVACY NOTICE */}
        <div className="bg-indigo-50/60 border border-indigo-200/60 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
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
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Fill in your personal details, election office name, current
                and new address on the left panel.
              </p>
              <p>
                2. Watch the official Form-13 update live on the right panel.
              </p>
              <p>3. Print or download the 2-page form as a PDF to submit.</p>
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
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
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
