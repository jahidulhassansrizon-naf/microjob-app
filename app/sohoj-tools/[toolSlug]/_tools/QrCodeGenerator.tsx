"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Star,
  Share2,
  ArrowLeft,
  Link as LinkIcon,
  Phone,
  Wifi,
  Globe,
  Video,
  MessageCircle,
  Download,
  Copy,
  Printer,
  ChevronDown,
  Image as ImageIcon,
  CreditCard,
  Wand2,
} from "lucide-react";

export default function QrCodeGenerator() {
  const [contentType, setContentType] = useState<string>("url");
  const [inputUrl, setInputUrl] = useState<string>("https://example.com");
  const [stylePreset, setStylePreset] = useState<string>("classic");
  const [downloadSize, setDownloadSize] = useState<number>(600);

  // Shape Selections
  const [selectedBodyShape, setSelectedBodyShape] = useState<number>(0);
  const [selectedEyeFrame, setSelectedEyeFrame] = useState<number>(0);
  const [selectedEyeBall, setSelectedEyeBall] = useState<number>(0);

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
        <span className="font-semibold text-gray-900">QR Code Generator</span>
      </div>

      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-xl flex items-center justify-center shrink-0 border border-sky-100">
            <QrCode size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                QR Code Generator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Create custom QR codes for links, WiFi, contacts, and more — all
              in your browser.
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side Settings Form */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section: What to encode */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span className="text-amber-500">❖</span> What to encode
              </h2>
              <button className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-100">
                Bulk generate
              </button>
            </div>

            {/* Content Type Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-500 block">
                Content type
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setContentType("url")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "url"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <LinkIcon size={13} /> URL / Link
                </button>

                <button
                  onClick={() => setContentType("phone")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "phone"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Phone size={13} className="text-emerald-500" /> Phone
                </button>

                <button
                  onClick={() => setContentType("wifi")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "wifi"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Wifi size={13} className="text-sky-500" /> WiFi
                </button>

                <button
                  onClick={() => setContentType("facebook")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "facebook"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Globe size={13} className="text-blue-600" /> Facebook
                </button>

                <button
                  onClick={() => setContentType("youtube")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "youtube"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Video size={13} className="text-red-500" /> YouTube
                </button>

                <button
                  onClick={() => setContentType("whatsapp")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    contentType === "whatsapp"
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <MessageCircle size={13} className="text-emerald-500" />{" "}
                  WhatsApp
                </button>

                <button className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-gray-500 border border-gray-200 bg-white hover:bg-gray-50">
                  Other types <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-gray-600 block">
                URL / Link
              </label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Section: Style */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <span className="text-amber-500">❖</span> Style
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">
                One-click presets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { name: "Classic", key: "classic", color: "text-gray-800" },
                { name: "Warm", key: "warm", color: "text-amber-500" },
                { name: "Dots", key: "dots", color: "text-blue-500" },
                { name: "Gradient", key: "gradient", color: "text-purple-500" },
                { name: "Leaf", key: "leaf", color: "text-emerald-500" },
                { name: "Diamond", key: "diamond", color: "text-amber-700" },
                { name: "Connected", key: "connected", color: "text-teal-500" },
              ].map((style) => (
                <button
                  key={style.key}
                  onClick={() => setStylePreset(style.key)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    stylePreset === style.key
                      ? "border-amber-500 bg-amber-50/20 shadow-xs"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <QrCode size={22} className={style.color} />
                  <span className="text-[10px] font-bold text-gray-700">
                    {style.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700">
                My templates
              </span>
              <button className="text-[10px] font-bold text-gray-600 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50">
                Save current design
              </button>
            </div>
          </div>

          {/* Section: Shapes */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h2 className="text-xs font-bold text-gray-900">Shapes</h2>
              <button className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                Square <ChevronDown size={12} />
              </button>
            </div>

            {/* Body shape grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gray-600 block">
                Body shape
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 24 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBodyShape(i)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      selectedBodyShape === i
                        ? "border-amber-500 bg-amber-50 text-amber-600 font-bold"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    <div className="w-4 h-4 bg-current rounded-xs" />
                  </button>
                ))}
              </div>
            </div>

            {/* Eye frame grid */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-600 block">
                Eye frame
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEyeFrame(i)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      selectedEyeFrame === i
                        ? "border-amber-500 bg-amber-50 text-amber-600"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    <div className="w-4 h-4 border-2 border-current rounded-xs" />
                  </button>
                ))}
              </div>
            </div>

            {/* Eye ball grid */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-600 block">
                Eye ball
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEyeBall(i)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      selectedEyeBall === i
                        ? "border-amber-500 bg-amber-50 text-amber-600"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-400"
                    }`}
                  >
                    <div className="w-2.5 h-2.5 bg-current rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expandable Accordion Options */}
          <div className="space-y-2">
            {[
              "Colour, background, shape & frame",
              "Logo",
              "Frame & label",
              "Advanced",
            ].map((title, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-between items-center cursor-pointer hover:bg-gray-50/50 transition-colors"
              >
                <span className="text-xs font-bold text-gray-800">{title}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            ))}
          </div>

          {/* Recent codes card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900">Recent codes</h3>
              <button className="text-[10px] text-gray-400 font-bold border border-gray-200 px-2 py-0.5 rounded">
                Save current
              </button>
            </div>

            {/* Rules banner */}
            <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-100 space-y-1.5 text-[11px] text-gray-600">
              <span className="font-bold text-gray-900 block mb-1">
                3 rules for a good QR code
              </span>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">❖</span>
                <span>
                  Keep strong contrast between the code and its background —
                  pale codes will not scan.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">❖</span>
                <span>
                  With a logo, keep error correction at M so the code stays
                  readable.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">❖</span>
                <span>Scan it once with a phone before you print it.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Live Preview Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 sticky top-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold text-gray-900">Live preview</h2>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                Empty
              </span>
            </div>

            {/* Preview Box */}
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px] text-center">
              <div className="w-16 h-16 bg-white border border-gray-200 shadow-2xs rounded-2xl flex items-center justify-center text-amber-500 mb-3">
                <QrCode size={36} />
              </div>
              <span className="text-xs font-bold text-gray-800 block">
                Enter your content to get started
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">
                Your live QR code preview will appear here.
              </span>
            </div>

            {/* Download Size Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-600">
                <span>Download size</span>
                <span>
                  {downloadSize} × {downloadSize} px
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="1200"
                step="100"
                value={downloadSize}
                onChange={(e) => setDownloadSize(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                <span>For web</span>
                <span>For print</span>
              </div>
            </div>

            {/* Info Tags */}
            <div className="flex gap-1.5 text-[9px] font-bold text-gray-500">
              <span className="bg-gray-100 px-2 py-0.5 rounded">
                Data 0 chars
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded">ECC M</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded">Margin 8%</span>
            </div>

            {/* Action Download Buttons */}
            <button className="w-full py-2.5 bg-gray-200 text-gray-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Download size={14} /> Download PNG
            </button>

            <div className="grid grid-cols-4 gap-1.5">
              <button className="py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50">
                SVG
              </button>
              <button className="py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50">
                JPG
              </button>
              <button className="py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50">
                PDF
              </button>
              <button className="py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center justify-center gap-1">
                <Copy size={12} /> Copy
              </button>
            </div>

            {/* Print Sheet Accordion */}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs font-bold text-gray-700 cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Printer size={14} /> Print sheet & share
              </span>
              <ChevronDown size={14} className="text-gray-400" />
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-sky-200 transition-all flex items-start gap-3 group"
          >
            <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
              <Wand2 size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-sky-500 transition-colors">
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
