// app/dashboard/_components/ToolGrid.tsx
"use client";

import {
  Sparkles,
  FileEdit,
  Copy,
  FileText,
  Briefcase,
  ShoppingBag,
  Image as ImageIcon,
  FileType,
  FileCheck2,
  FileSearch,
  Pencil,
  FileCheck,
  Wand2,
  Receipt,
  ArrowLeftRight,
  ReceiptText,
  Users,
  Sliders,
  Landmark,
  Settings,
  Store,
} from "lucide-react";

export default function ToolGrid() {
  // ১. মেইন বড় আইকনসমূহ
  const mainTools = [
    {
      title: "AI Photo Edit",
      icon: <Sparkles size={38} className="text-amber-400" />,
      bg: "bg-[#1E1E2D]",
    },
    {
      title: "Manual Photo Edit",
      icon: <FileEdit size={38} className="text-white" />,
      bg: "bg-[#0084FF]",
    },
    {
      title: "Bulk Photo Edit",
      icon: <Copy size={38} className="text-white" />,
      bg: "bg-[#10D03A]",
    },
    {
      title: "Document Generate",
      icon: <FileText size={38} className="text-white" />,
      bg: "bg-[#8161FF]",
    },
    {
      title: "Jobs",
      icon: <Briefcase size={38} className="text-white" />,
      bg: "bg-[#FF9500]",
    },
    {
      title: "Sohoz Tools",
      icon: <ShoppingBag size={38} className="text-white" />,
      bg: "bg-[#FF5D73]",
    },
  ];

  // ২. মাঝের আইকনসমূহ (ব্যাজসহ)
  const secondaryTools = [
    {
      title: "Form auto fillup",
      icon: <Briefcase size={26} className="text-white" />,
      bg: "bg-[#8161FF]",
      badge: "New",
      badgeColor: "bg-emerald-500",
    },
    {
      title: "Image Size Reducer",
      icon: <ImageIcon size={26} className="text-white" />,
      bg: "bg-[#10D03A]",
    },
    {
      title: "Image Convert",
      icon: <FileType size={26} className="text-white" />,
      bg: "bg-[#C026D3]",
      badge: "Hot",
      badgeColor: "bg-rose-500",
    },
    {
      title: "NID to PDF",
      icon: <FileCheck2 size={26} className="text-white" />,
      bg: "bg-[#10D03A]",
      badge: "Hot",
      badgeColor: "bg-rose-500",
    },
    {
      title: "Passport to PDF",
      icon: <FileSearch size={26} className="text-white" />,
      bg: "bg-[#10D03A]",
    },
    {
      title: "Edit PDF",
      icon: <Pencil size={26} className="text-white" />,
      bg: "bg-[#D9381E]",
      badge: "New",
      badgeColor: "bg-emerald-500",
    },
    {
      title: "Image to Text",
      icon: <FileCheck size={26} className="text-white" />,
      bg: "bg-[#00B4D8]",
      badge: "New",
      badgeColor: "bg-emerald-500",
    },
    {
      title: "Document Cleanup",
      icon: <Wand2 size={26} className="text-white" />,
      bg: "bg-[#2EC4B6]",
      badge: "New",
      badgeColor: "bg-emerald-500",
    },
  ];

  // ৩. Accounts & Settings
  const accountsTools = [
    {
      title: "Invoice",
      icon: <Receipt size={26} className="text-white" />,
      bg: "bg-[#8161FF]",
    },
    {
      title: "Income & Expense",
      icon: <ArrowLeftRight size={26} className="text-white" />,
      bg: "bg-[#0084FF]",
    },
    {
      title: "Income/Expense List",
      icon: <ReceiptText size={26} className="text-white" />,
      bg: "bg-[#C09B00]",
    },
    {
      title: "Customers",
      icon: <Users size={26} className="text-white" />,
      bg: "bg-[#E63946]",
    },
    {
      title: "Photo Edit Settings",
      icon: <Sliders size={26} className="text-white" />,
      bg: "bg-[#C026D3]",
    },
    {
      title: "Useful Links",
      icon: <Landmark size={26} className="text-white" />,
      bg: "bg-[#D97706]",
      badge: "New",
      badgeColor: "bg-emerald-500",
    },
    {
      title: "Settings",
      icon: <Settings size={26} className="text-white" />,
      bg: "bg-[#2563EB]",
    },
    {
      title: "Manage Shop",
      icon: <Store size={26} className="text-white" />,
      bg: "bg-[#DC2626]",
    },
  ];

  return (
    <div className="py-8 max-w-7xl mx-auto px-4">
      {/* Row 1: Main Large Tools */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 justify-items-center">
        {mainTools.map((tool, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 ${tool.bg} rounded-[32px] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}
            >
              {tool.icon}
            </div>
            <span className="text-xs sm:text-sm font-bold text-gray-800 mt-3 text-center max-w-[110px] leading-tight">
              {tool.title}
            </span>
          </div>
        ))}
      </div>

      {/* 1st Horizontal Divider Line */}
      <hr className="border-t border-gray-200/80 my-10" />

      {/* Row 2: Secondary Tools with Badges */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-5 justify-items-center">
        {secondaryTools.map((tool, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div className="relative">
              {tool.badge && (
                <span
                  className={`absolute -top-2 -left-2 ${tool.badgeColor} text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-xs uppercase tracking-wider`}
                >
                  {tool.badge}
                </span>
              )}
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 ${tool.bg} rounded-[24px] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200`}
              >
                {tool.icon}
              </div>
            </div>
            <span className="text-xs font-bold text-gray-700 mt-2.5 text-center max-w-[95px] leading-tight">
              {tool.title}
            </span>
          </div>
        ))}
      </div>

      {/* 2nd Horizontal Divider Line */}
      <hr className="border-t border-gray-200/80 my-10" />

      {/* Row 3: Accounts & Settings */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-6 pl-1">
          Accounts & Settings
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-5 justify-items-center">
          {accountsTools.map((tool, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div className="relative">
                {tool.badge && (
                  <span
                    className={`absolute -top-2 -left-2 ${tool.badgeColor} text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full z-10 shadow-xs uppercase tracking-wider`}
                  >
                    {tool.badge}
                  </span>
                )}
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 ${tool.bg} rounded-[24px] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200`}
                >
                  {tool.icon}
                </div>
              </div>
              <span className="text-xs font-bold text-gray-700 mt-2.5 text-center max-w-[95px] leading-tight">
                {tool.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
