// app/dashboard/_components/DashboardSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Zap,
  CreditCard,
  User as UserIcon,
  LayoutGrid,
  Award,
  FileText,
  Globe,
  DollarSign,
  Plus,
  Settings,
  ShoppingBag,
  MessageCircle,
  Video,
  LogOut,
  Sparkles,
  Edit3,
  Layers,
  Printer,
  Briefcase,
  Wrench,
  ChevronDown,
} from "lucide-react";

interface UserData {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onLogout: () => void;
}

export default function DashboardSidebar({
  isOpen,
  onClose,
  user,
  onLogout,
}: DashboardSidebarProps) {
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSubMenu = (menu: string) => {
    setOpenSubMenu(openSubMenu === menu ? null : menu);
  };

  return (
    <div className="fixed inset-0 z-[999] flex justify-start">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer Content */}
      <div className="relative w-80 bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FF5D00] rounded-lg flex items-center justify-center font-black text-white text-sm">
              SK
            </div>
            <span className="font-black text-gray-900 text-base">
              Sohoz<span className="text-[#FF5D00]">kaj</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs font-semibold text-gray-700 flex-1">
          <button className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
            <Zap size={16} /> Buy Credits
          </button>

          <div className="space-y-1">
            <Link
              href="/credit-usage"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-gray-500" />
                <span>Credit Usage</span>
              </div>
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                2
              </span>
            </Link>
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
            >
              <UserIcon size={16} className="text-gray-500" />
              <span>My Profile</span>
            </Link>
          </div>

          <hr className="border-gray-100" />

          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-orange-50 text-[#FF5D00]"
            >
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="#"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
            >
              <Award size={16} className="text-amber-500" />
              <span>SohozKaj Contest</span>
            </Link>
          </div>

          <hr className="border-gray-100" />

          {/* Features & Tools */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Features & Tools
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <FileText size={16} className="text-blue-500" />
                <span>Document Toiri</span>
              </Link>

              <Link
                href="/ai-editor"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Sparkles size={16} className="text-orange-500" />
                <span>AI Editor</span>
              </Link>

              <Link
                href="/manual-editor"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Edit3 size={16} className="text-blue-600" />
                <span>Manual Editor</span>
              </Link>

              <Link
                href="/bulk-photo-edit"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className="text-emerald-600" />
                  <span>Bulk Photo Edit</span>
                </div>
                <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>

              <Link
                href="/ai-template"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <LayoutGrid size={16} className="text-purple-500" />
                <span>AI Template</span>
              </Link>

              {/* Question Papers Submenu */}
              <div>
                <button
                  onClick={() => toggleSubMenu("question-papers")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-red-500" />
                    <span>Question Papers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                      New
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${
                        openSubMenu === "question-papers" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                {openSubMenu === "question-papers" && (
                  <div className="ml-7 pl-2 border-l border-gray-200 space-y-1 my-1">
                    <Link
                      href="/questions-create/create"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-gray-50 text-gray-600"
                    >
                      Create Question
                    </Link>
                    <Link
                      href="/questions-create/manual"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-gray-50 text-gray-600"
                    >
                      Manual Question
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/print-media"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Printer size={16} className="text-orange-600" />
                <span>Print Media</span>
              </Link>

              {/* 🟢 SohozTools Submenu (Fixed Correct Routes) */}
              <div>
                <button
                  onClick={() => toggleSubMenu("sohoz-tools")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench size={16} className="text-pink-500" />
                    <span>SohozTools</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                      FREE
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${
                        openSubMenu === "sohoz-tools" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                {openSubMenu === "sohoz-tools" && (
                  <div className="ml-7 pl-2 border-l border-gray-200 space-y-1 my-1">
                    <Link
                      href="/sohoj-tools"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-gray-50 text-gray-600"
                    >
                      All Free Tools
                    </Link>
                    <Link
                      href="/sohoj-tools?category=pdf"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-gray-50 text-gray-600"
                    >
                      PDF Tools
                    </Link>
                    <Link
                      href="/sohoj-tools?category=image"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-gray-50 text-gray-600"
                    >
                      Image Tools
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/jobs"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} className="text-amber-600" />
                  <span>Jobs</span>
                </div>
                <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>

              <Link
                href="#"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-amber-500" />
                  <span>Useful Links</span>
                </div>
                <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Accounts & Invoice
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <DollarSign size={16} className="text-emerald-500" />
                <span>Income & Expense</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <FileText size={16} className="text-blue-600" />
                <span>Invoice</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <UserIcon size={16} className="text-purple-500" />
                <span>Customers</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Plus size={16} className="text-blue-500" />
                <span>Add Income / Expense</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <FileText size={16} className="text-gray-500" />
                <span>Income/Expense List</span>
              </Link>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Other
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Photo Edit Settings</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Settings</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <ShoppingBag size={16} className="text-amber-600" />
                <span>Manage Shop</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <MessageCircle size={16} className="text-emerald-600" />
                <span>WhatsApp সাপোর্ট</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <MessageCircle size={16} className="text-emerald-500" />
                <span>WhatsApp Support Group</span>
              </Link>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-gray-500" />
                  <span>Language</span>
                </div>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  EN | বাংলা
                </span>
              </div>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50"
              >
                <Video size={16} className="text-red-500" />
                <span>Introduce Video</span>
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs uppercase">
                  {user?.fullName ? user.fullName.slice(0, 2) : "JH"}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xs truncate max-w-[120px]">
                    {user?.fullName || "Jahidul Hassan Srizon"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {user?.phoneNumber || "01783666743"}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
