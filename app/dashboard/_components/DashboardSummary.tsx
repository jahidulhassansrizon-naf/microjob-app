// app/dashboard/_components/DashboardSummary.tsx
"use client";

import { useState } from "react";
import {
  Coins,
  Sparkles,
  FileEdit,
  Copy,
  LayoutGrid,
  FileText,
  Printer,
  HelpCircle,
} from "lucide-react";

export default function DashboardSummary() {
  const [filter, setFilter] = useState("Today");

  const usageCards = [
    {
      title: "AI Photo Edit",
      count: 0,
      icon: <Sparkles size={20} />,
      bg: "bg-gradient-to-r from-indigo-600 to-indigo-800",
    },
    {
      title: "Manually Edited Photos",
      count: 0,
      icon: <FileEdit size={20} />,
      bg: "bg-gradient-to-r from-sky-400 to-blue-500",
    },
    {
      title: "Bulk Edited Photos",
      count: 0,
      icon: <Copy size={20} />,
      bg: "bg-gradient-to-r from-fuchsia-600 to-pink-600",
    },
    {
      title: "AI Template Images",
      count: 0,
      icon: <LayoutGrid size={20} />,
      bg: "bg-gradient-to-r from-purple-600 to-indigo-600",
    },
    {
      title: "Documents Generated",
      count: 0,
      icon: <FileText size={20} />,
      bg: "bg-gradient-to-r from-blue-600 to-cyan-700",
    },
    {
      title: "Print Media Saved",
      count: 0,
      icon: <Printer size={20} />,
      bg: "bg-gradient-to-r from-teal-600 to-emerald-700",
    },
    {
      title: "Question Papers",
      count: 0,
      icon: <HelpCircle size={20} />,
      bg: "bg-gradient-to-r from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <div className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-900">Account Summary</h3>
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
              Live
            </span>
          </div>
          <div className="flex items-center bg-gray-100/80 p-0.5 rounded-lg text-[11px] font-bold text-gray-500">
            {["Today", "This Week", "This Month"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`px-3 py-1 rounded-md transition-all ${filter === item ? "bg-white text-gray-900 shadow-xs" : "hover:text-gray-900"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Income/Expense Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-emerald-600">
              Income
            </span>
            <div className="text-xl font-black text-gray-900 my-1">৳ 0</div>
            <span className="text-[9px] text-gray-400 font-medium">Today</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-100/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-rose-500">
              Expense
            </span>
            <div className="text-xl font-black text-gray-900 my-1">৳ 0</div>
            <span className="text-[9px] text-gray-400 font-medium">Stable</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3.5">
            <span className="text-[11px] font-semibold text-amber-600">
              Balance
            </span>
            <div className="text-xl font-black text-gray-900 my-1">৳ 0</div>
            <span className="text-[9px] text-gray-400 font-medium">
              Current balance
            </span>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-gray-500">Due</span>
            <div className="space-y-1 my-1 text-[11px]">
              <div className="flex justify-between font-bold text-gray-700">
                <span>Income Due</span> <span>৳ 0</span>
              </div>
              <div className="flex justify-between font-bold text-gray-700">
                <span>Expense Due</span> <span>৳ 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Recharge Banner */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5D00] text-white flex items-center justify-center font-bold">
              <Coins size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                2{" "}
                <span className="font-medium text-gray-600">
                  credits remaining
                </span>
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Total 2 · 0 used
              </p>
            </div>
          </div>
          <button className="bg-[#FF5D00] hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-xs">
            Recharge Credit
          </button>
        </div>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {usageCards.map((card, idx) => (
          <div
            key={idx}
            className={`${card.bg} text-white rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              {card.icon}
            </div>
            <div>
              <div className="text-lg font-black leading-tight">
                {card.count}
              </div>
              <div className="text-[10px] font-semibold opacity-90">
                {card.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
