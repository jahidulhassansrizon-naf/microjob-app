"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import FaqSection from "@/components/FaqSection";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Type,
  Video,
  LayoutGrid,
} from "lucide-react";

const categoriesData = [
  {
    name: "PDF Tools",
    description: "Merge, split, compress, and secure your PDF files",
    icon: FileText,
    tools: [
      { title: "Compress PDF", subtitle: "Compress PDF", href: "#" },
      { title: "Merge PDFs", subtitle: "Merge PDFs", href: "#" },
      { title: "Create PDF", subtitle: "Create PDF", href: "#" },
      { title: "Split PDF", subtitle: "Split PDF", href: "#" },
      { title: "PDF to Image", subtitle: "PDF to Image", href: "#" },
      { title: "Lock / Unlock PDF", subtitle: "Lock / Unlock PDF", href: "#" },
      { title: "Rotate PDF", subtitle: "Rotate PDF", href: "#" },
      { title: "Remove Pages", subtitle: "Remove Pages", href: "#" },
      { title: "PDF Watermark", subtitle: "PDF Watermark", href: "#" },
      { title: "Extract Images", subtitle: "Extract Images", href: "#" },
      { title: "PDF Permissions", subtitle: "PDF Permissions", href: "#" },
      { title: "Reduce PDF", subtitle: "Reduce PDF", href: "#" },
    ],
  },
  {
    name: "Image Tools",
    description: "Compress, convert, and edit your images",
    icon: ImageIcon,
    tools: [
      {
        title: "Image Size Reducer",
        subtitle: "Image Size Reducer",
        href: "#",
      },
      { title: "NID to PDF", subtitle: "NID to PDF", href: "#" },
      { title: "Remove Background", subtitle: "Remove Background", href: "#" },
      {
        title: "Govt Job Photo & Sign",
        subtitle: "Govt Job Photo & Sign Resizer",
        href: "#",
      },
      { title: "Passport to PDF", subtitle: "Passport to PDF", href: "#" },
      { title: "Image Convert", subtitle: "Image Convert", href: "#" },
      { title: "QR Code Generator", subtitle: "QR Code Generator", href: "#" },
      { title: "Image Resize", subtitle: "Image Resize", href: "#" },
      { title: "Crop Image", subtitle: "Crop Image", href: "#" },
      { title: "Images to PDF", subtitle: "Images to PDF", href: "#" },
      { title: "Add Watermark", subtitle: "Add Watermark", href: "#" },
      { title: "Flatten Image", subtitle: "Flatten Image", href: "#" },
    ],
  },
  {
    name: "Text Tools",
    description: "Convert, analyze, and extract your text",
    icon: Type,
    tools: [
      { title: "Bijoy ⇄ Unicode", subtitle: "Bijoy ⇄ Unicode", href: "#" },
      { title: "Banglish Typing", subtitle: "Banglish Typing", href: "#" },
      { title: "Number to Words", subtitle: "Number to Words", href: "#" },
      { title: "Image to Text", subtitle: "Image to Text", href: "#" },
      { title: "Text Analyzer", subtitle: "Text Analyzer", href: "#" },
      {
        title: "Date Format Converter",
        subtitle: "Date Format Converter",
        href: "#",
      },
    ],
  },
  {
    name: "Video Tools",
    description: "Compress, convert, and edit your videos",
    icon: Video,
    tools: [
      { title: "Compress Video", subtitle: "Compress Video", href: "#" },
      { title: "Trim/Cut Video", subtitle: "Trim/Cut Video", href: "#" },
      { title: "Merge Videos", subtitle: "Merge Videos", href: "#" },
      { title: "Video to Audio", subtitle: "Video to Audio", href: "#" },
      { title: "Add Watermark", subtitle: "Add Watermark", href: "#" },
      {
        title: "Audio Volume Booster",
        subtitle: "Audio Volume Booster/Reducer",
        href: "#",
      },
      { title: "Change Speed", subtitle: "Change Speed", href: "#" },
      { title: "Video to GIF", subtitle: "Video to GIF", href: "#" },
      { title: "Rotate / Flip", subtitle: "Rotate / Flip", href: "#" },
      { title: "Remove Audio", subtitle: "Remove Audio", href: "#" },
    ],
  },
  {
    name: "General Tools",
    description: "Everyday forms and utilities for Bangladesh",
    icon: LayoutGrid,
    tools: [
      { title: "Family Card Form", subtitle: "Family Card Form", href: "#" },
      { title: "Fuel Card Form", subtitle: "Fuel Card Form", href: "#" },
      {
        title: "ATS Friendly CV Maker",
        subtitle: "ATS Friendly CV Maker",
        href: "#",
      },
      { title: "Age Calculator", subtitle: "Age Calculator", href: "#" },
      { title: "EMI Calculator", subtitle: "EMI Calculator", href: "#" },
    ],
  },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("All Tools");
  const [searchQuery, setSearchQuery] = useState("");

  // ফিল্টারিং লজিক
  const filteredCategories = categoriesData
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (tool) =>
          (activeTab === "All Tools" || cat.name === activeTab) &&
          (tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.subtitle.toLowerCase().includes(searchQuery.toLowerCase())),
      ),
    }))
    .filter((cat) => cat.tools.length > 0);

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-gray-950 flex flex-col">
      {/* Hero / Header Section */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10 w-full flex flex-col items-center text-center">
        <div className="bg-orange-50 border border-orange-200/60 text-orange-600 text-xs font-bold px-4 py-1.5 rounded-full mb-4 sm:mb-6 shadow-2xs">
          50+ Easy Tools
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight text-gray-900 max-w-4xl leading-tight sm:leading-[1.15] mb-4 sm:mb-6">
          All your conversion work,{" "}
          <span className="text-orange-500">in one place—</span> simple & fast
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium max-w-xl mb-8 sm:mb-10 leading-relaxed">
          Easily convert and compress files right from your browser. Everything
          is fast, secure, and your files never leave your device.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-xl mb-6 sm:mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search tools... (e.g. compress, image, pdf, qr)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200/80 rounded-full pl-12 pr-16 sm:pr-20 py-3 sm:py-3.5 text-xs sm:text-sm shadow-sm focus:outline-none focus:border-orange-500 transition"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-bold bg-gray-100 border border-gray-200 text-gray-500 px-1.5 sm:px-2 py-1 rounded-md">
              Ctrl K
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-white border border-gray-200/60 p-1.5 rounded-2xl sm:rounded-full shadow-2xs max-w-full">
          {[
            "All Tools",
            "PDF Tools",
            "Image Tools",
            "Text Tools",
            "Video Tools",
            "General Tools",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 sm:px-5 py-2 rounded-xl sm:rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === tab
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Categories & Tools Section */}
      <main className="flex-grow max-w-[1200px] mx-auto px-4 sm:px-6 pb-16 sm:pb-24 w-full flex flex-col gap-10 sm:gap-12">
        {filteredCategories.map((category, catIdx) => {
          const CategoryIcon = category.icon;
          return (
            <section key={catIdx} className="flex flex-col gap-4">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/60 pb-3 gap-2 sm:gap-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                    <CategoryIcon size={18} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-gray-900">
                      {category.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-400 font-medium">
                      {category.description}
                    </p>
                  </div>
                </div>
                <Link
                  href="#"
                  className="text-xs font-bold text-gray-500 hover:text-orange-500 transition self-end sm:self-auto"
                >
                  See all tools &gt;
                </Link>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {category.tools.map((tool, tIdx) => (
                  <Link
                    key={tIdx}
                    href={tool.href}
                    className="bg-white border border-gray-100 rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-md hover:border-orange-200 transition flex items-start gap-3.5 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition">
                      <FileText size={16} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <h3 className="text-xs font-bold text-gray-900 group-hover:text-orange-500 transition truncate">
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium truncate">
                        {tool.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <FaqSection />
      <Footer />
    </div>
  );
}
