"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crop,
  Star,
  Share2,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Combine,
  FilePlus,
  ArrowLeft,
  X,
  Plus,
  Lock,
} from "lucide-react";

export default function PdfCrop() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
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
          <span>Back to Tools</span>
        </Link>
        <span>/</span>
        <span>PDF Tools</span>
        <span>/</span>
        <span className="font-semibold text-gray-900">PDF Crop</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
            <Crop size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">PDF Crop</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Trim margins, auto-remove white space, or crop a specific area on
              every page.
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Upload Box */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-900">
                Files ({selectedFile ? 1 : 0})
              </h2>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg cursor-pointer transition-colors border border-rose-100">
                <Plus size={12} />
                <span>Add</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[220px]">
                <div className="w-10 h-10 bg-rose-100/80 text-rose-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <span className="text-xs font-bold text-gray-800">
                  Drop PDFs here or click to upload
                </span>
                <span className="text-[10px] text-gray-400 font-medium mt-1">
                  1 PDF file, max 500 MB
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 bg-rose-100 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview Box */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">Preview</h2>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Empty
            </span>
          </div>

          {/* Empty Preview Placeholder */}
          <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-20">
            <div className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center mb-3 border border-rose-100">
              <FileText size={20} />
            </div>
            <p className="text-xs font-bold text-gray-800">
              Add files to get started
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Your result will appear here after you run the tool.
            </p>
          </div>

          <div />
        </div>
      </div>

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span>
            {selectedFile
              ? `Ready to process: ${selectedFile.name}`
              : "Add an input to get started"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
          >
            Reset
          </button>
          <button
            disabled={!selectedFile}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              selectedFile
                ? "bg-rose-500 text-white shadow-xs hover:bg-rose-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Crop size={14} />
            <span>Crop PDF</span>
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0" />
        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* How to use Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">?</span>
            <span>How to use</span>
          </div>
          {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            Upload your PDF file, drag to select the cropping area or specify
            precise margin trims, then click "Crop PDF" to apply and download
            the cropped file.
          </div>
        )}
      </div>

      {/* Same Category Tools */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-gray-900">
          Tools in the same category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sohoj-tools/compress-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-rose-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-500 transition-colors">
                Compress PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Shrink embedded photos and scans inside a PDF — text stays
                sharp.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/merge-pdfs"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-rose-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-500 transition-colors">
                Merge PDFs
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Combine multiple PDF files into one document in your chosen
                order.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/create-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-rose-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center shrink-0">
              <FilePlus size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-rose-500 transition-colors">
                Create PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Turn images and PDF pages into one combined PDF file.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
