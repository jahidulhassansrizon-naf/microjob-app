// app/dashboard/_components/DashboardSummary.tsx
"use client";
import { DT } from "./DashboardText";
import { useState } from "react";
import { Coins, Sparkles, FileEdit, Copy, LayoutGrid, FileText, Printer, HelpCircle, } from "lucide-react";
export default function DashboardSummary() {
    const [filter, setFilter] = useState("Today");
    const usageCards = [
        {
            title: "AI Photo Edit",
            count: 0,
            icon: <Sparkles size={20}/>,
            bg: "bg-gradient-to-r from-[#DC2626] to-[#991B1B]",
        },
        {
            title: "Manually Edited Photos",
            count: 0,
            icon: <FileEdit size={20}/>,
            bg: "bg-gradient-to-r from-[#B91C1C] to-[#7F1D1D]",
        },
        {
            title: "Bulk Edited Photos",
            count: 0,
            icon: <Copy size={20}/>,
            bg: "bg-gradient-to-r from-[#5A4A32] to-[#3B2F1E]",
        },
        {
            title: "AI Template Images",
            count: 0,
            icon: <LayoutGrid size={20}/>,
            bg: "bg-gradient-to-r from-[#EF4444] to-[#B91C1C]",
        },
        {
            title: "Documents Generated",
            count: 0,
            icon: <FileText size={20}/>,
            bg: "bg-gradient-to-r from-[#7A6A50] to-[#5A4A32]",
        },
        {
            title: "Print Media Saved",
            count: 0,
            icon: <Printer size={20}/>,
            bg: "bg-gradient-to-r from-[#991B1B] to-[#5A4A32]",
        },
        {
            title: "Question Papers",
            count: 0,
            icon: <HelpCircle size={20}/>,
            bg: "bg-gradient-to-r from-[#DC2626] to-[#7F1D1D]",
        },
    ];
    return (<div className="space-y-6">
      {/* Account Summary */}
      <div className="bg-[#F2E8D2] border border-[#E3D6B8] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#3B2F1E]"><DT>{"Account Summary"}</DT></h3>
            <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-1.5 py-0.2 rounded-md"><DT>{"Live\r\n            "}</DT></span>
          </div>
          <div className="flex items-center bg-[#F3E9D2]/80 p-0.5 rounded-lg text-[13px] font-bold text-[#7A6A50]">
            {["Today", "This Week", "This Month"].map((item) => (<button key={item} onClick={() => setFilter(item)} className={`px-3 py-1 rounded-md transition-all ${filter === item ? "bg-[#FBF6E8] text-[#3B2F1E] shadow-xs" : "hover:text-[#3B2F1E]"}`}>
                <DT>{item}</DT>
              </button>))}
          </div>
        </div>

        {/* Income/Expense Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3.5">
            <span className="text-[13px] font-semibold text-emerald-600"><DT>{"Income\r\n            "}</DT></span>
            <div className="text-2xl font-black text-[#3B2F1E] my-1"><DT>{"\u09F3 0"}</DT></div>
            <span className="text-[11px] text-[#7A6A50] font-medium"><DT>{"Today"}</DT></span>
          </div>
          <div className="bg-[#FEE9E9]/50 border border-[#FBB6B6]/60 rounded-xl p-3.5">
            <span className="text-[13px] font-semibold text-[#DC2626]"><DT>{"Expense\r\n            "}</DT></span>
            <div className="text-2xl font-black text-[#3B2F1E] my-1"><DT>{"\u09F3 0"}</DT></div>
            <span className="text-[11px] text-[#7A6A50] font-medium"><DT>{"Stable"}</DT></span>
          </div>
          <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-3.5">
            <span className="text-[13px] font-semibold text-amber-600"><DT>{"Balance\r\n            "}</DT></span>
            <div className="text-2xl font-black text-[#3B2F1E] my-1"><DT>{"\u09F3 0"}</DT></div>
            <span className="text-[11px] text-[#7A6A50] font-medium"><DT>{"Current balance\r\n            "}</DT></span>
          </div>
          <div className="bg-[#FBF6E8] border border-[#E3D6B8] rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[13px] font-semibold text-[#7A6A50]"><DT>{"Due"}</DT></span>
            <div className="space-y-1 my-1 text-[13px]">
              <div className="flex justify-between font-bold text-[#5A4A32]">
                <span><DT>{"Income Due"}</DT></span> <span><DT>{"\u09F3 0"}</DT></span>
              </div>
              <div className="flex justify-between font-bold text-[#5A4A32]">
                <span><DT>{"Expense Due"}</DT></span> <span><DT>{"\u09F3 0"}</DT></span>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Recharge Banner */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D42020] text-white flex items-center justify-center font-bold">
              <Coins size={20}/>
            </div>
            <div>
              <p className="text-sm font-bold text-[#3B2F1E]"><DT>{"2"}</DT>{<DT>{" "}</DT>}
                <span className="font-medium text-[#5A4A32]"><DT>{"credits remaining\r\n                "}</DT></span>
              </p>
              <p className="text-[12px] text-[#7A6A50] font-medium"><DT>{"Total 2 \u00B7 0 used\r\n              "}</DT></p>
            </div>
          </div>
          <button className="bg-[#D42020] hover:bg-[#AE1717] text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-xs"><DT>{"Recharge Credit\r\n          "}</DT></button>
        </div>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {usageCards.map((card, idx) => (<div key={idx} className={`${card.bg} text-white rounded-2xl p-4 shadow-xs flex items-center gap-3 hover:scale-[1.02] transition-transform cursor-pointer`}>
            <div className="w-10 h-10 rounded-xl bg-[#FBF6E8]/20 backdrop-blur-md flex items-center justify-center shrink-0">
              {card.icon}
            </div>
            <div>
              <div className="text-xl font-black leading-tight">
                {card.count}
              </div>
              <div className="text-[12px] font-semibold opacity-90">
                {<DT>{card.title}</DT>}
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
