"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FilePlus,
  Star,
  Share2,
  Upload,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Combine,
  FileCode,
  ArrowLeft,
  X,
  GripVertical,
  Image as ImageIcon,
} from "lucide-react";

export default function CreatePdf() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showHowToUse, setShowHowToUse] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setSelectedFiles([]);
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
        <span className="font-semibold text-gray-900">Create PDF</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <FilePlus size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">Create PDF</h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Turn images and PDF pages into one combined PDF file.
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
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-gray-900">
              Files ({selectedFiles.length})
            </h2>

            <label className="border-2 border-dashed border-red-200 bg-red-50/30 hover:bg-red-50/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
              <div className="w-10 h-10 bg-red-100/80 text-red-500 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Upload size={20} />
              </div>
              <span className="text-xs font-bold text-gray-800">
                Drop files here or click to upload
              </span>
              <span className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed">
                PDF, image, or Word files — max 50 MB each JPG, PNG, WebP, GIF,
                HEIC, and PDF
              </span>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Selected File Item List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <GripVertical
                        size={14}
                        className="text-gray-400 cursor-grab"
                      />
                      <div className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon size={14} />
                        ) : (
                          <FileText size={14} />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Create Preview */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-700">Create preview</h2>
            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {selectedFiles.length === 0
                ? "Empty"
                : `${selectedFiles.length} files`}
            </span>
          </div>

          {/* Empty / Items Preview Box */}
          {selectedFiles.length === 0 ? (
            <div className="bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center my-auto text-center py-24">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-3 border border-red-100">
                <FileText size={20} />
              </div>
              <p className="text-xs font-bold text-gray-800">
                Add images or PDFs
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Arrange files in order, then create your PDF.
              </p>
            </div>
          ) : (
            <div className="my-auto py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex flex-col items-center text-center relative group"
                >
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="w-12 h-16 bg-white border border-gray-200 rounded-md shadow-2xs flex items-center justify-center my-2 text-red-500">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-gray-800 truncate w-full">
                    {file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div />
        </div>
      </div>

      {/* Bottom Action Controls Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
          <span>
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) ready to create PDF`
              : "Add images or PDFs"}
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
            disabled={selectedFiles.length === 0}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all ${
              selectedFiles.length > 0
                ? "bg-red-500 text-white shadow-xs hover:bg-red-600"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FilePlus size={14} />
            <span>Create PDF</span>
          </button>
        </div>
      </div>

      {/* Browser Processing Banner */}
      <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
        <Lock size={15} className="text-emerald-600 shrink-0" />
        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
      </div>

      {/* Instructions Accordion */}
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
            Upload images or PDF pages, arrange them in the sequence you want,
            and click "Create PDF" to build your combined document.
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Minimize2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <Combine size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Merge PDFs
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Combine multiple PDF files into one document in your chosen
                order.
              </p>
            </div>
          </Link>

          <Link
            href="/sohoj-tools/split-pdf"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-red-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
              <FileCode size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-red-500 transition-colors">
                Split PDF
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                Extract specific pages or split every page into separate files.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
