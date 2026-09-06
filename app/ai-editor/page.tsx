"use client";

import { useState } from "react";
import { Sparkles, QrCode, Upload, Check } from "lucide-react";
import DashboardNavbar from "@/app/dashboard/_components/DashboardNavbar"; // পাথ আপনার প্রজেক্ট অনুযায়ী ঠিক করে নিতে পারেন

export default function AIEditorPage() {
  const [selectedSize, setSelectedSize] = useState("passport");
  const [selectedBg, setSelectedBg] = useState("orange");

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* ড্যাশবোর্ড নেভবার এখানে যুক্ত করা হলো */}
      <DashboardNavbar />

      {/* Main Container */}
      <div className="max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Sidebar: Generation Settings (Span 3) */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col gap-6 shadow-xs overflow-y-auto max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Sparkles size={18} className="text-orange-500" />
            <h2 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              Generation settings
            </h2>
          </div>

          {/* Photo Size Section */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Photo Size
            </span>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "passport", label: "Passport", icon: "🪪" },
                { id: "dual", label: "Dual", icon: "👥" },
                { id: "epass", label: "E-Pass", icon: "🆔" },
                { id: "visa", label: "Visa", icon: "✈️" },
                { id: "birth", label: "Birth", icon: "📄" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSize(item.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition relative ${
                    selectedSize === item.id
                      ? "border-orange-500 bg-orange-50/20 text-gray-900 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base mb-1">{item.icon}</span>
                  {item.label}
                  {selectedSize === item.id && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
                      <Check size={8} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Section */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Background
            </span>
            <div className="grid grid-cols-6 gap-2">
              {[
                {
                  id: "orange",
                  color: "bg-amber-500 border-2 border-orange-600",
                },
                { id: "blue1", color: "bg-blue-500" },
                { id: "blue2", color: "bg-sky-400" },
                { id: "gray", color: "bg-gray-400" },
                { id: "blue3", color: "bg-blue-600" },
                { id: "green", color: "bg-teal-700" },
                { id: "cream", color: "bg-amber-100" },
                {
                  id: "custom",
                  color:
                    "bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-[10px]",
                },
              ].map((bg, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedBg(bg.id)}
                  className={`h-9 rounded-xl ${bg.color} transition relative shadow-2xs hover:scale-105 flex items-center justify-center`}
                >
                  {bg.id === "custom" && <span className="text-xs">🎨</span>}
                  {selectedBg === bg.id && bg.id !== "custom" && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Check size={12} className="drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clothing Style Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Clothing Style
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">
                14/14 ⚙️
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className={`h-11 bg-gray-50 border rounded-xl flex items-center justify-center cursor-pointer hover:border-orange-500 transition ${
                    i === 0
                      ? "border-orange-500 bg-orange-50/30"
                      : "border-gray-200"
                  }`}
                >
                  {i === 0 ? (
                    <span className="text-xs text-orange-500 font-bold">
                      🚫
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">👔</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extra Editing Guide */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Extra Editing Guide
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">
                6/21 ⚙️
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Glow & Makeup" },
                { label: "Smooth Skin" },
                { label: "Brighten Image" },
                { label: "Studio Lighting" },
                { label: "Straighten Head" },
                { label: "Keep Marks" },
                { label: "Custom Instruction" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-2 bg-gray-50/60 border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center gap-1 cursor-pointer hover:bg-gray-100 transition"
                >
                  <span className="text-gray-600 text-xs">✨</span>
                  <span className="text-[9px] font-semibold text-gray-600 leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Workspace / Upload Area (Span 6) */}
        <div className="lg:col-span-6 bg-[#181C2E] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center relative min-h-[550px] shadow-lg">
          {/* Inner Dotted Box */}
          <div className="max-w-md w-full border-2 border-dashed border-gray-600/80 rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-[#1E2337]/50">
            <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700">
              <Upload size={24} className="text-gray-300" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-white text-base font-bold">Upload a Photo</h3>
              <p className="text-gray-400 text-xs">
                Click or scan QR code to upload from your phone <br />
                <span className="text-[10px] text-gray-500">(45×55 mm)</span>
              </p>
            </div>

            <button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2">
              <Upload size={14} /> Upload Photo
            </button>

            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 font-mono">
              Ctrl+U
            </span>
          </div>

          {/* Bottom Action Button */}
          <div className="absolute bottom-6">
            <button className="bg-[#242942] hover:bg-[#2D3352] text-amber-400 border border-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2">
              👥 Upload 2 separate images
            </button>
          </div>
        </div>

        {/* Right Sidebar: Scan QR Code (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
            <div className="bg-[#181C2E] text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800 rounded-lg text-orange-400">
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Scan Now</h4>
                  <p className="text-[10px] text-gray-400">Scan QR Code</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#181C2E] hover:bg-gray-900 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-xs">
              <QrCode size={14} /> Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
