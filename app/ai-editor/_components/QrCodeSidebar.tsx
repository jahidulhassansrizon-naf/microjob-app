"use client";

import React from "react";
import { QrCode } from "lucide-react";

export default function QrCodeSidebar() {
  return (
    <div className="w-[280px] flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 bg-gray-900 text-white p-3 rounded-xl mb-3">
          <div className="bg-gray-800 p-2 rounded-lg">
            <QrCode size={24} className="text-gray-300" />
          </div>
          <div>
            <h4 className="text-xs font-semibold">Scan Now</h4>
            <p className="text-[10px] text-gray-400">Scan QR Code</p>
          </div>
        </div>
        <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition">
          <QrCode size={16} /> Scan
        </button>
      </div>
    </div>
  );
}
