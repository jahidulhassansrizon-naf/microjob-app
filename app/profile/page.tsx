"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  AlertCircle,
  Coins,
  Edit,
  Mail,
  ChevronRight,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";

interface UserProfile {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
  district?: string;
  profession?: string;
  gender?: string;
  dob?: string;
  address?: string;
  thana?: string;
  postcode?: string;
  about?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState("Personal Information");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Auth Protection Check
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.push("/login"); // লগইন না থাকলে /login পেজে পাঠিয়ে দেবে
      return;
    } else {
      setIsAuthenticated(true);
    }

    // 2. LocalStorage অথবা Backend API থেকে ডাটা নেওয়া
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }

    // 3. API এর মাধ্যমে লেটেস্ট প্রোফাইল ডাটা ফেচ করা
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  // ইউজারের নামের দুইটা বর্ণ সংক্ষেপে বের করার ফাংশন (যেমন: Sami Chisty -> SC)
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // অথেনটিকেশন চেক চলাকালীন লোডার স্ক্রিন
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7]">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xs">
          <Loader2 size={16} className="animate-spin text-amber-500" />
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-800 font-sans pb-12">
      {/* Top Navbar */}
      <DashboardNavbar />

      <main className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">
        {/* Page Title Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-400 font-medium">
            Manage your personal and business information
          </p>
        </div>

        {/* User Overview Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0">
              {getInitials(user?.fullName)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {user?.fullName || "Guest User"}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                <span>📞 {user?.phoneNumber || "Not provided"}</span>
                <span>✉️ {user?.email || "Not provided"}</span>
                <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  🇧🇩 {user?.country || "Bangladesh"}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Balance Card */}
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 px-4 flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <Coins size={18} />
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Credit Balance
              </p>
              <p className="text-sm font-bold text-amber-600">
                Credits <span className="text-base">2</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alert Banner: Low Credit */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-600">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle size={14} />
            </div>
            <div>
              <p className="font-bold text-red-700">
                Your credit is running low!
              </p>
              <p className="text-[11px] text-red-500 font-medium">
                Currently you have only 2 credits left.
              </p>
            </div>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors self-end sm:self-auto">
            <span>Click here to buy credit</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Profile Completion Bonus Box */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-red-50 text-red-500 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles size={12} />
                Profile Info Incomplete
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                18 Credit Bonus
              </span>
            </div>
            <span className="text-sm font-black text-red-500">16%</span>
          </div>

          <p className="text-xs text-gray-400 font-medium">
            Only 16 fields left — fill in all your personal and shop/business
            info and 18 bonus credits will be added to your account
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full w-[16%] rounded-full transition-all duration-300"></div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            "Personal Information",
            "Shop / Business Information",
            "Change Password",
            "Devices login",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Personal Information Form Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Section Sub-header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <User size={16} className="text-amber-500" />
              <span>{user?.fullName || "Guest User"}</span>
            </div>
            <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-colors">
              <Edit size={12} />
              <span>Edit</span>
            </button>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Full Name */}
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400">Full Name</p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {user?.fullName || "Not provided"}
              </p>
            </div>

            {/* Phone Number */}
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400">
                Phone Number
              </p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {user?.phoneNumber || "Not provided"}
              </p>
            </div>

            {/* Country */}
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400">Country</p>
              <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1.5">
                🇧🇩 {user?.country || "Bangladesh"}
              </p>
            </div>

            {/* Email + Verify Banner */}
            <div className="bg-red-50/50 border border-red-100 p-2.5 rounded-xl space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400">Email</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">
                  {user?.email || "Not provided"}
                </span>
                <span className="bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Not verified
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-red-100/60">
                <span className="text-[10px] text-red-500 font-medium">
                  Verify your email to earn the bonus
                </span>
                <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Mail size={10} />
                  <span>Verify</span>
                </button>
              </div>
            </div>

            {/* Profession */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">
                Profession / Designation
              </p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.profession || "Not provided"}
              </p>
            </div>

            {/* Gender */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">Gender</p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.gender || "Not provided"}
              </p>
            </div>

            {/* Date of Birth */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">
                Date of Birth
              </p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.dob || "Not provided"}
              </p>
            </div>

            {/* Address */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">Address</p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.address || "Not provided"}
              </p>
            </div>

            {/* District */}
            <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400">District</p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {user?.district || "Not provided"}
              </p>
            </div>

            {/* Thana */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">
                Thana / Upazila
              </p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.thana || "Not provided"}
              </p>
            </div>

            {/* Postcode */}
            <div className="bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">
                Postcode
              </p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.postcode || "Not provided"}
              </p>
            </div>

            {/* About Yourself (Full Width) */}
            <div className="md:col-span-2 bg-amber-50/40 border border-amber-200/50 p-2.5 rounded-xl">
              <p className="text-[10px] font-bold text-amber-700/70">
                About yourself
              </p>
              <p className="text-amber-800/60 font-medium italic mt-0.5">
                {user?.about || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
