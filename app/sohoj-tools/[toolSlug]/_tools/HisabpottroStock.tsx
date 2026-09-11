"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export default function HisabpottroStock() {
  return (
    <div className="w-full text-gray-800 font-sans pb-16 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/sohoj-tools"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Tools</span>
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
        Hisabpottro & Stock
      </h1>

      {/* Coming Soon Card */}
      <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-16 shadow-2xs flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-2xs">
          <Clock size={24} />
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-2">Coming soon</h3>

        <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">
          Keep your business books effortlessly — record income and expenses,
          manage inventory and stock levels, and get clear reports at a glance.
          The full Hisabpottro system with stock management is coming soon.
        </p>
      </div>
    </div>
  );
}
