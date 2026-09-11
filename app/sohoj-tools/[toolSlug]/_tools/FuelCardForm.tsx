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
  Printer,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
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
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
  {
    title: "Allowance Application Tracking",
    description:
      "Check where a Department of Social Services allowance application stands — by tracking id or NID — and print the result.",
    href: "/sohoj-tools/allowance-application-tracking",
    icon: FileText,
  },
];

export default function FuelCardForm() {
  const router = useRouter();

  // Form states
  const [applicantName, setApplicantName] = useState("");
  const [fatherProprietor, setFatherProprietor] = useState("");
  const [nidLicense, setNidLicense] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [villageRoad, setVillageRoad] = useState("");
  const [unionName, setUnionName] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [thanaUpazila, setThanaUpazila] = useState("");
  const [district, setDistrict] = useState("");
  const [pumpName, setPumpName] = useState("");
  const [machineName, setMachineName] = useState("");
  const [fuelType, setFuelType] = useState("Diesel");
  const [fuelQuantity, setFuelQuantity] = useState("");
  const [purposeOfUse, setPurposeOfUse] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleClear = () => {
    setApplicantName("");
    setFatherProprietor("");
    setNidLicense("");
    setMobileNumber("");
    setVillageRoad("");
    setUnionName("");
    setPostOffice("");
    setThanaUpazila("");
    setDistrict("");
    setPumpName("");
    setMachineName("");
    setFuelType("Diesel");
    setFuelQuantity("");
    setPurposeOfUse("");
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
                Fuel Card Form
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <CreditCard size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Fuel Card Form
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
          {/* LEFT COLUMN: SETTINGS / FORM FIELDS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Settings
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Fill in all fields. View preview updates as you type.
                </span>
              </div>

              {/* Section 1: Personal & organization details */}
              <div className="border border-purple-200/60 rounded-xl p-3.5 space-y-3 bg-purple-50/10">
                <h3 className="text-xs font-bold text-purple-900">
                  1. Personal & organization details
                </h3>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    Applicant / organization name
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Name or organization"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Father / proprietor
                    </label>
                    <input
                      type="text"
                      value={fatherProprietor}
                      onChange={(e) => setFatherProprietor(e.target.value)}
                      placeholder="Father / proprietor"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      NID / license number
                    </label>
                    <input
                      type="text"
                      value={nidLicense}
                      onChange={(e) => setNidLicense(e.target.value)}
                      placeholder="NID or license num"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700">
                    Mobile number
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="01712345678"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Section 2: Address & pump details */}
              <div className="border border-purple-200/60 rounded-xl p-3.5 space-y-3 bg-purple-50/10">
                <h3 className="text-xs font-bold text-purple-900">
                  2. Address & pump details
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Village / road
                    </label>
                    <input
                      type="text"
                      value={villageRoad}
                      onChange={(e) => setVillageRoad(e.target.value)}
                      placeholder="Village or road name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Union
                    </label>
                    <input
                      type="text"
                      value={unionName}
                      onChange={(e) => setUnionName(e.target.value)}
                      placeholder="Union name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Post office
                    </label>
                    <input
                      type="text"
                      value={postOffice}
                      onChange={(e) => setPostOffice(e.target.value)}
                      placeholder="Post office"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Thana / upazila
                    </label>
                    <input
                      type="text"
                      value={thanaUpazila}
                      onChange={(e) => setThanaUpazila(e.target.value)}
                      placeholder="Thana or upazila"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      District
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="District name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Pump name
                    </label>
                    <input
                      type="text"
                      value={pumpName}
                      onChange={(e) => setPumpName(e.target.value)}
                      placeholder="Pump name"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Machine & usage details */}
              <div className="border border-purple-200/60 rounded-xl p-3.5 space-y-3 bg-purple-50/10">
                <h3 className="text-xs font-bold text-purple-900">
                  3. Machine & usage details
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Machine / equipment name
                    </label>
                    <input
                      type="text"
                      value={machineName}
                      onChange={(e) => setMachineName(e.target.value)}
                      placeholder="e.g. Generator"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Fuel type: petrol, octane, diesel
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Octane">Octane</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Fuel quantity (liters)
                    </label>
                    <input
                      type="text"
                      value={fuelQuantity}
                      onChange={(e) => setFuelQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Purpose of use
                    </label>
                    <input
                      type="text"
                      value={purposeOfUse}
                      onChange={(e) => setPurposeOfUse(e.target.value)}
                      placeholder="e.g. running generator"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons inside Settings */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="py-2.5 bg-white border border-gray-200 hover:border-purple-400 text-purple-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
                >
                  <Printer size={15} />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleClear}
                  className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center justify-center gap-2"
                >
                  <RotateCcw size={15} />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PREVIEW A4 LETTER */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[750px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Preview</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    Live preview
                  </span>
                </div>

                {/* Simulated A4 Paper Sheet */}
                <div className="bg-[#1e1e1e] p-4 rounded-xl flex justify-center overflow-x-auto">
                  <div className="bg-white w-[540px] min-h-[720px] p-8 text-gray-900 shadow-lg text-[11px] font-serif relative flex flex-col justify-between">
                    {/* Top Content of A4 */}
                    <div className="space-y-4">
                      <div className="text-center font-bold underline tracking-wide text-sm pb-2">
                        Fuel Oil Application
                      </div>

                      <div className="space-y-2 font-sans text-[10px] leading-relaxed pt-2">
                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">1.</span>
                          <span className="text-gray-500 w-36">
                            Applicant / organization name:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {applicantName ||
                              "..........................................................."}
                          </span>
                          <div className="border border-dashed border-gray-400 p-2 text-center text-[8px] text-gray-400 w-20 h-24 flex items-center justify-center">
                            Affix passport size photo with stapler
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">2.</span>
                          <span className="text-gray-500 w-36">
                            Father / proprietor:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {fatherProprietor ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">3.</span>
                          <span className="text-gray-500 w-36">
                            Village / road:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {villageRoad ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">4.</span>
                          <span className="text-gray-500 w-36">Union:</span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {unionName ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">5.</span>
                          <span className="text-gray-500 w-36">
                            Post office:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {postOffice ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">6.</span>
                          <span className="text-gray-500 w-36">
                            Thana / upazila:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {thanaUpazila ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">7.</span>
                          <span className="text-gray-500 w-36">District:</span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {district ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">8.</span>
                          <span className="text-gray-500 w-36">
                            NID or trade license number:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {nidLicense ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">9.</span>
                          <span className="text-gray-500 w-36">Pump name:</span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {pumpName ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">10.</span>
                          <span className="text-gray-500 w-36">
                            Machine / equipment name:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {machineName ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">11.</span>
                          <span className="text-gray-500 w-36">Fuel type:</span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {fuelType ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">12.</span>
                          <span className="text-gray-500 w-36">
                            Fuel quantity (liters):
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {fuelQuantity ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">13.</span>
                          <span className="text-gray-500 w-36">
                            Purpose of use:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {purposeOfUse ||
                              "..........................................................."}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-bold w-5">14.</span>
                          <span className="text-gray-500 w-36">
                            Mobile number:
                          </span>
                          <span className="border-b border-dotted border-gray-400 flex-1 font-medium">
                            {mobileNumber ||
                              "..........................................................."}
                          </span>
                        </div>
                      </div>

                      <p className="text-[9px] text-gray-700 leading-tight pt-2 font-sans">
                        Humble submission: in reference to the above subject, I
                        wish to inform you that my organization regularly needs
                        fuel oil to run its works. Kindly request you to take
                        the necessary steps to allow me to collect the stated
                        quantity of fuel oil.
                      </p>

                      <div className="text-[9px] text-gray-700 space-y-0.5 font-sans">
                        <p className="font-bold">Attachments:</p>
                        <p>• license photocopy</p>
                        <p>• copy of nid or trade license</p>
                        <p>• required documents of the organization</p>
                      </div>
                    </div>

                    {/* Bottom Signature Box on A4 */}
                    <div className="border border-gray-800 p-2 mt-4 space-y-3 font-sans text-[9px]">
                      <p className="text-center font-bold">
                        Permission of responsible person & ward representative
                      </p>
                      <div className="space-y-1">
                        <p>
                          Approved fuel quantity:
                          ..............................................................................................
                        </p>
                        <p>
                          Recommending officer (signature & seal):
                          ...................................................................
                        </p>
                      </div>
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
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
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
              onClick={() => window.print()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* IMPORTANT INFORMATION & INSTRUCTIONS */}
        <div className="bg-cyan-50/50 border border-cyan-200/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-cyan-900 uppercase tracking-wide">
            Important Information and Instructions:
          </h3>
          <p className="text-xs font-bold text-cyan-900">
            The following documents must be attached:
          </p>
          <ul className="text-xs text-cyan-800 space-y-1 pl-4 list-disc font-medium">
            <li>
              Attach a passport-size photo to the application with glue or
              stapler.
            </li>
            <li>Submit a photocopy of National ID (NID) or trade license.</li>
            <li>Attach copies of required organization/equipment documents.</li>
            <li>An active mobile number must be provided.</li>
          </ul>
          <p className="text-[11px] text-red-600 font-semibold pt-1">
            Fill in all information correctly and accurately. The application
            may be cancelled for incorrect information.
          </p>
          <p className="text-[11px] text-amber-800 font-medium">
            After printing, obtain signature and approval from a responsible
            person, ward representative or relevant office before submitting at
            the pump.
          </p>
          <p className="text-[11px] text-emerald-800 font-medium">
            Collect only the approved quantity of fuel oil as per distribution
            policy; apply again for additional quantity.
          </p>
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
                1. Fill up personal, organization, address, and machine details
                on the left settings panel.
              </p>
              <p>
                2. See the application letter automatically update in real-time
                on the right preview box.
              </p>
              <p>
                3. Click &quot;Download PDF&quot; or &quot;Print&quot; to obtain
                the final document for submission.
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
