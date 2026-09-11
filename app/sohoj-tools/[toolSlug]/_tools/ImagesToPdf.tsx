"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileImage,
  Star,
  Share2,
  ArrowLeft,
  RotateCcw,
  Image as ImageIcon,
  CreditCard,
  Wand2,
  SlidersHorizontal,
  FileText,
  Sparkles,
  RectangleHorizontal,
  RectangleVertical,
  Compass,
} from "lucide-react";

export default function ImagesToPdf() {
  const [activeTab, setActiveTab] = useState<"page" | "image" | "effects">(
    "page",
  );
  const [orientation, setOrientation] = useState<
    "auto" | "portrait" | "landscape"
  >("auto");
  const [pageSize, setPageSize] = useState<string>("a4");
  const [margin, setMargin] = useState<string>("medium");
  const [pageNumbers, setPageNumbers] = useState<boolean>(false);

  const handleReset = () => {
    setActiveTab("page");
    setOrientation("auto");
    setPageSize("a4");
    setMargin("medium");
    setPageNumbers(false);
  };

  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Sohoj Tools</span>
        </Link>
        <span>/</span>
        <span>Image Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">Images to PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
            <FileImage size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Images to PDF</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Combine JPG, PNG, WebP, and more into one PDF — reorder pages in
              your browser.
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

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            {/* Header Title with Subtitle */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-50 text-orange-500 rounded-md flex items-center justify-center">
                <SlidersHorizontal size={13} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-900">Settings</h2>
                <p className="text-[10px] text-gray-400">
                  Customize PDF output
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold">
              <button
                onClick={() => setActiveTab("page")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "page"
                    ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileText size={13} /> Page
              </button>
              <button
                onClick={() => setActiveTab("image")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "image"
                    ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ImageIcon size={13} /> Image
              </button>
              <button
                onClick={() => setActiveTab("effects")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "effects"
                    ? "bg-white text-orange-500 shadow-xs border border-gray-100"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Sparkles size={13} /> Effects
              </button>
            </div>

            {/* Tab Content: Page Settings */}
            {activeTab === "page" && (
              <div className="space-y-4 pt-1">
                {/* Orientation Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-700">Orientation</span>
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                      ORIENTATION
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "auto", label: "Auto", icon: Compass },
                      {
                        id: "portrait",
                        label: "Portrait",
                        icon: RectangleVertical,
                      },
                      {
                        id: "landscape",
                        label: "Landscape",
                        icon: RectangleHorizontal,
                      },
                    ].map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setOrientation(item.id as any)}
                          className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                            orientation === item.id
                              ? "border-orange-500 bg-orange-50/30 text-orange-500 font-bold shadow-2xs"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <IconComp size={15} />
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-[10px] text-gray-500">
                    <span className="font-bold text-gray-700">Auto</span>
                    <br />
                    pt · A4 (output)
                  </div>
                </div>

                {/* Page Size Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-700">Page size</span>
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                      PAGE SIZE
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "a4", label: "A4" },
                      { id: "letter", label: "Letter" },
                      { id: "a3", label: "A3" },
                      { id: "legal", label: "Legal" },
                      { id: "a5", label: "A5" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPageSize(item.id)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          pageSize === item.id
                            ? "border-orange-500 bg-orange-50/30 text-orange-500 font-bold shadow-2xs"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-3.5 h-4 border border-current rounded-xs flex items-center justify-center text-[7px] font-bold">
                          {item.label.charAt(0)}
                        </div>
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Margin Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-700">Margin</span>
                    <span className="text-[9px] font-bold text-gray-400 tracking-wider">
                      MARGIN
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "none", label: "None" },
                      { id: "small", label: "Small" },
                      { id: "medium", label: "Medium" },
                      { id: "large", label: "Large" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setMargin(item.id)}
                        className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          margin === item.id
                            ? "border-orange-500 bg-orange-50/30 text-orange-500 font-bold shadow-2xs"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-4 h-4 border border-current rounded-xs border-dashed flex items-center justify-center" />
                        <span className="text-[9px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Numbers Switch */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block">
                      Page numbers
                    </span>
                    <span className="text-[9px] text-gray-400 block">
                      Add page numbers
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPageNumbers(!pageNumbers)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pageNumbers ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        pageNumbers ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button className="flex-1 py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl cursor-not-allowed text-center transition-all">
              Create PDF
            </button>
          </div>
        </div>

        {/* Right Side PDF Preview Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 min-h-[460px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">PDF preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Empty Upload Dropzone */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center flex-1 text-center my-1 border-dashed">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-3">
                <ImageIcon size={28} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Add images to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-1">
                Arrange images in order, then create your PDF.
              </span>
              <span className="text-[10px] text-gray-400 mt-4 font-medium">
                Or press Ctrl+V to paste a copied image
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tools in the same category */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/image-size-reducer"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                Image Size Reducer
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Shrink JPG, PNG, and WebP photos in your browser — quality stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/nid-to-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                NID to PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Turn NID card front and back photos into a clean A4 PDF — all in
                your browser.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/remove-background"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-orange-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                Remove Background
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Erase portrait, product, or logo backgrounds in your browser —
                download a transparent PNG.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
