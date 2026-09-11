"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crop,
  Star,
  Share2,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  ChevronDown,
  GraduationCap,
  UserCheck,
  RotateCw,
} from "lucide-react";

export default function GovtJobPhotoSignResizer() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignature(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleReset = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setSignature(null);
    setSignaturePreview(null);
  };

  const hasInput = photo !== null || signature !== null;

  return (
    <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
      {/* Top Header / Breadcrumbs & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Link href="/" className="hover:text-gray-800 transition-colors">
              <Crop size={14} className="inline mr-1" />
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
              Govt Job Photo & Sign Resizer
            </span>
          </nav>

          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Crop size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
              Govt Job Photo & Sign Resizer
            </h1>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Free
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1 font-medium">
            Crop and resize job application photo and signature to exact pixel
            and file-size limits.
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

      {/* Main Grid: Left Controls & Right Output Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload Controls & Specs */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Position & Crop */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-gray-900">
                Position & crop
              </h2>
            </div>

            <div className="space-y-3.5">
              {/* Photo 300x300 Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Photo 300×300 px
                </label>
                <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <div className="w-9 h-9 bg-amber-100/80 text-amber-600 rounded-xl flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Upload size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {photo ? photo.name : "Upload passport photo"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    JPG, PNG, or WebP
                  </span>
                </label>
              </div>

              {/* Signature 300x80 Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Signature 300×80 px
                </label>
                <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group block">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                  <div className="w-9 h-9 bg-amber-100/80 text-amber-600 rounded-xl flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    <Upload size={16} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    {signature ? signature.name : "Upload signature"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    JPG, PNG, or WebP
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Output specs */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
            <h2 className="text-xs font-bold text-gray-900 mb-2">
              Output specs
            </h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Photo: 300×300 pixels, max 100 KB JPEG
            </p>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Signature: 300×80 pixels, max 60 KB JPEG
            </p>
            <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
              Downloads as JPEG (.jpg) with automatic compression.
            </p>
          </div>
        </div>

        {/* Right Column: Output Preview Area */}
        <div className="lg:col-span-8 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs min-h-[480px] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-900">Output preview</h2>
            <span className="bg-gray-100 text-gray-400 text-[10px] font-medium px-2 py-0.5 rounded-md">
              {hasInput ? "Ready" : "Empty"}
            </span>
          </div>

          {/* Interactive Preview Canvas or Empty Banner */}
          <div className="flex-1 my-4 bg-gray-50/60 border border-gray-200/60 rounded-xl p-8 flex flex-col items-center justify-center text-center">
            {hasInput ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
                {photoPreview && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Photo (300×300)
                    </span>
                    <img
                      src={photoPreview}
                      alt="Photo preview"
                      className="w-36 h-36 object-cover rounded-lg border border-gray-300 shadow-2xs"
                    />
                  </div>
                )}
                {signaturePreview && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Signature (300×80)
                    </span>
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="w-48 h-16 object-contain rounded-lg border border-gray-300 shadow-2xs bg-white"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-3">
                  <ImageIcon size={24} />
                </div>
                <h3 className="text-xs font-bold text-gray-800 mb-1">
                  Upload photo and signature
                </h3>
                <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                  Live previews appear here as you adjust the crop boxes.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action / Status Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span
            className={`w-2 h-2 rounded-full ${hasInput ? "bg-emerald-500" : "bg-gray-300"}`}
          />
          <span>
            {hasInput
              ? "Images loaded — ready to export"
              : "Add an input to get started"}
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
            className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              hasInput
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-2xs cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>Export JPEG files</span>
          </button>
        </div>
      </div>

      {/* Security/Privacy Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2.5 text-emerald-800 text-xs font-medium">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
        <span>
          Your files are processed in the browser — they are not uploaded to any
          server.
        </span>
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
            <p>1. Upload your passport size photo (300x300 px target size).</p>
            <p>2. Upload your signature image (300x80 px target size).</p>
            <p>
              3. Crop or adjust the selection box on the output preview panel.
            </p>
            <p>
              4. Click &quot;Export JPEG files&quot; to download optimized
              images with correct specs.
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
            href="/sohoj-tools/national-university-result"
            className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:border-teal-300 transition-all flex items-start gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                National University Result
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                Check Honours, Degree Pass, Master&apos;s and Professional
                results from Bangladesh National University.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
