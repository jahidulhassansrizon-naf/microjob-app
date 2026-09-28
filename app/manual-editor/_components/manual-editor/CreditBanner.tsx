"use client";
import { X } from "lucide-react";
import { useManualEditor } from "./EditorProvider";

export default function CreditBanner() {
  const { showCreditBanner, setShowCreditBanner } = useManualEditor();
  if (!showCreditBanner) return null;
  return (
    <div className="max-w-[1700px] w-full mx-auto px-4 pt-4">
      <div className="bg-[#E2E8F0] border border-[#2563EB]/20 text-[#0F172A] px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs shrink-0">
            !
          </div>
          <p className="text-xs font-semibold">
            <span className="font-bold">Your credit is running low!</span>{" "}
            Currently you have only <span className="font-bold">0</span> credits
            left.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition"
          >
            Click here to buy credit &gt;
          </button>
          <button
            type="button"
            onClick={() => setShowCreditBanner(false)}
            className="text-[#0F172A]/60 hover:text-[#0F172A] transition"
            aria-label="Close credit warning"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
