// app/dashboard/_components/DashboardSidebar.tsx
"use client";

import { useState, useEffect } from "react";
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

  // ভাষা পরিবর্তনের স্টেট (EN / BN)
  const [lang, setLang] = useState<"EN" | "BN">("EN");

  // পেজ লোড হওয়ার সময় বর্তমান ভাষা কুকি থেকে চেক করা
  useEffect(() => {
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match) {
      if (match[2].includes("bn")) {
        setLang("BN");
      } else {
        setLang("EN");
      }
    }
  }, []);

  // গুগল ট্রান্সলেটের কুকি পরিবর্তন করে ভাষা বদলানোর ফাংশন
  const changeGoogleLanguage = (targetLang: "EN" | "BN") => {
    setLang(targetLang);
    const googleLangCode = targetLang === "BN" ? "/en/bn" : "/en/en";
    document.cookie = `googtrans=${googleLangCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${googleLangCode}; path=/`;
    window.location.reload();
  };

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

      {/* Drawer Content - Soft off-white Background (#F8FAFC) */}
      <div className="relative w-80 bg-[#F8FAFC] h-full shadow-2xl flex flex-col z-10 overflow-y-auto border-r border-[#E2E8F0]">
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0] sticky top-0 bg-[#F8FAFC] z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center font-black text-white text-sm">
              SK
            </div>
            <span className="font-black text-[#0F172A] text-base">
              Sohoz<span className="text-[#2563EB]">kaj</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs font-semibold text-[#0F172A] flex-1">
          {/* Primary CTA Button (#2563EB) */}
          <button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
            <Zap size={16} /> Buy Credits
          </button>

          <div className="space-y-1">
            <Link
              href="/credit-usage"
              onClick={onClose}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-gray-500" />
                <span>Credit Usage</span>
              </div>
              {/* Accent Badge (#10B981) */}
              <span className="bg-[#10B981] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                2
              </span>
            </Link>
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
            >
              <UserIcon size={16} className="text-gray-500" />
              <span>My Profile</span>
            </Link>
          </div>

          <hr className="border-[#E2E8F0]" />

          <div className="space-y-1">
            {/* Active Link: Secondary BG (#E2E8F0) & Primary Text (#2563EB) */}
            <Link
              href="/dashboard"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg bg-[#E2E8F0] text-[#2563EB] font-bold"
            >
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="#"
              onClick={onClose}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
            >
              <Award size={16} className="text-[#2563EB]" />
              <span>SohozKaj Contest</span>
            </Link>
          </div>

          <hr className="border-[#E2E8F0]" />

          {/* Features & Tools */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Features & Tools
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <FileText size={16} className="text-[#2563EB]" />
                <span>Document Toiri</span>
              </Link>

              <Link
                href="/ai-editor"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Sparkles size={16} className="text-[#2563EB]" />
                <span>AI Editor</span>
              </Link>

              <Link
                href="/manual-editor"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Edit3 size={16} className="text-blue-600" />
                <span>Manual Editor</span>
              </Link>

              <Link
                href="/bulk-photo-edit"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Layers size={16} className="text-[#10B981]" />
                  <span>Bulk Photo Edit</span>
                </div>
                {/* Accent Badge (#10B981) */}
                <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>

              <Link
                href="/ai-template"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <LayoutGrid size={16} className="text-purple-500" />
                <span>AI Template</span>
              </Link>

              {/* Question Papers Submenu */}
              <div>
                <button
                  onClick={() => toggleSubMenu("question-papers")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-red-500" />
                    <span>Question Papers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
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
                  <div className="ml-7 pl-2 border-l border-[#E2E8F0] space-y-1 my-1">
                    <Link
                      href="/questions-create/create"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-[#E2E8F0]/60 text-[#0F172A]"
                    >
                      Create Question
                    </Link>
                    <Link
                      href="/questions-create/manual"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-[#E2E8F0]/60 text-[#0F172A]"
                    >
                      Manual Question
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/print-media"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Printer size={16} className="text-[#2563EB]" />
                <span>Print Media</span>
              </Link>

              {/* SohozTools Submenu */}
              <div>
                <button
                  onClick={() => toggleSubMenu("sohoz-tools")}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench size={16} className="text-pink-500" />
                    <span>SohozTools</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
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
                  <div className="ml-7 pl-2 border-l border-[#E2E8F0] space-y-1 my-1">
                    <Link
                      href="/sohoj-tools"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-[#E2E8F0]/60 text-[#0F172A]"
                    >
                      All Free Tools
                    </Link>
                    <Link
                      href="/sohoj-tools?category=pdf"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-[#E2E8F0]/60 text-[#0F172A]"
                    >
                      PDF Tools
                    </Link>
                    <Link
                      href="/sohoj-tools?category=image"
                      onClick={onClose}
                      className="block p-1.5 rounded-md hover:bg-[#E2E8F0]/60 text-[#0F172A]"
                    >
                      Image Tools
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/jobs"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase size={16} className="text-[#2563EB]" />
                  <span>Jobs</span>
                </div>
                <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>

              <Link
                href="#"
                onClick={onClose}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-[#2563EB]" />
                  <span>Useful Links</span>
                </div>
                <span className="bg-[#10B981] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  New
                </span>
              </Link>
            </div>
          </div>

          <hr className="border-[#E2E8F0]" />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Accounts & Invoice
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <DollarSign size={16} className="text-[#10B981]" />
                <span>Income & Expense</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <FileText size={16} className="text-[#2563EB]" />
                <span>Invoice</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <UserIcon size={16} className="text-purple-500" />
                <span>Customers</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Plus size={16} className="text-[#2563EB]" />
                <span>Add Income / Expense</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <FileText size={16} className="text-gray-500" />
                <span>Income/Expense List</span>
              </Link>
            </div>
          </div>

          <hr className="border-[#E2E8F0]" />

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
              Other
            </p>
            <div className="space-y-1">
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Photo Edit Settings</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Settings size={16} className="text-gray-500" />
                <span>Settings</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <ShoppingBag size={16} className="text-[#2563EB]" />
                <span>Manage Shop</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <MessageCircle size={16} className="text-[#10B981]" />
                <span>WhatsApp সাপোর্ট</span>
              </Link>
              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <MessageCircle size={16} className="text-[#10B981]" />
                <span>WhatsApp Support Group</span>
              </Link>

              {/* Language Switcher Interactive Button */}
              <div
                onClick={() =>
                  changeGoogleLanguage(lang === "EN" ? "BN" : "EN")
                }
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#E2E8F0]/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-gray-500" />
                  <span>Language</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                    lang === "BN"
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#E2E8F0] text-[#0F172A]"
                  }`}
                >
                  EN | বাংলা
                </span>
              </div>

              <Link
                href="#"
                onClick={onClose}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#E2E8F0]/60 transition-colors"
              >
                <Video size={16} className="text-red-500" />
                <span>Introduce Video</span>
              </Link>
            </div>
          </div>

          {/* User Profile Card - Secondary Accent BG (#E2E8F0) */}
          <div className="pt-2">
            <div className="p-3 bg-[#E2E8F0]/70 border border-[#E2E8F0] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center font-bold text-xs uppercase">
                  {user?.fullName ? user.fullName.slice(0, 2) : "JH"}
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] text-xs truncate max-w-[120px]">
                    {user?.fullName || "Jahidul Hassan Srizon"}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {user?.phoneNumber || "01783666743"}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-red-500 hover:text-red-700 p-1 transition-colors"
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
