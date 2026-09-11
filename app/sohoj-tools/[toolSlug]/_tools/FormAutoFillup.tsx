"use client";

import React from "react";
import Link from "next/link";
import {
  Plus,
  Settings,
  Search,
  ChevronLeft,
  FolderMinus,
  Briefcase,
} from "lucide-react";

export default function FormAutoFillup() {
  return (
    <div className="w-full">
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/sohoj-tools"
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 transition"
        >
          <ChevronLeft className="w-4 h-4 mr-0.5" />
          Back to Tools
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#FDE8CC] rounded-xl flex items-center justify-center text-[#E58900]">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Form auto fillup
            </h1>
            <p className="text-xs text-gray-500">
              Manage your job application forms and their data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition shadow-sm">
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            Settings
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E88000] text-white rounded-lg text-xs font-semibold hover:bg-[#d17300] transition shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Create New Form
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-2.5 shadow-sm border border-gray-100 mb-5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or father's name..."
            className="w-full pl-9 pr-4 py-1 text-xs bg-transparent focus:outline-none placeholder-gray-400 text-gray-700"
          />
        </div>
      </div>

      {/* Empty State Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm min-h-[320px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
          <FolderMinus className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">
          No forms yet
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Create your first form to get started.
        </p>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-[#E88000] text-white rounded-lg text-xs font-semibold hover:bg-[#d17300] transition shadow-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create New Form
        </button>
      </div>
    </div>
  );
}
