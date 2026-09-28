"use client";

import { useState, useEffect } from "react";
import DashboardNavbar from "../dashboard/_components/DashboardNavbar";
import {
  Sparkles,
  FileText,
  Printer,
  Search,
  Grid,
  List,
  ImageIcon,
} from "lucide-react";

export default function MyFilesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState("generated-images");
  const [subTab, setSubTab] = useState("ai-photo-edit");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateQuery, setDateQuery] = useState("");

  // 🟢 সিকিউরিটি ও অথেনটিকেশন চেক
  useEffect(() => {
    try {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      const token = tokenCookie ? tokenCookie.split("=")[1] : null;

      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie =
          "token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        window.location.href = "/login";
      } else {
        setIsAuthenticated(true);
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setLoading(false);
    }
  }, []);

  // লোডিং হওয়ার সময় ক্লিন স্পিনার
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#0F172A]/70">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // অথেন্টিকেটেড না হলে পেজ রেন্ডার হবে না
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navbar */}
      <DashboardNavbar />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] mb-6">
          My Files
        </h1>

        {/* Top Category Buttons (Visible Scrollbar Line for Mobile) */}
        <div className="relative mb-6">
          <div
            className="flex items-center gap-3 overflow-x-auto pb-3 pr-8"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#E2E8F0 transparent",
            }}
          >
            <button
              onClick={() => setActiveTab("generated-images")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "generated-images"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E2E8F0]/40"
              }`}
            >
              <Sparkles
                size={16}
                className={
                  activeTab === "generated-images"
                    ? "text-[#10B981]"
                    : "text-[#0F172A]/60"
                }
              />
              Generated Images
            </button>

            <button
              onClick={() => setActiveTab("print-media")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "print-media"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E2E8F0]/40"
              }`}
            >
              <Printer
                size={16}
                className={
                  activeTab === "print-media"
                    ? "text-[#10B981]"
                    : "text-[#2563EB]"
                }
              />
              Print Media
            </button>

            <button
              onClick={() => setActiveTab("regular-documents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "regular-documents"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E2E8F0]/40"
              }`}
            >
              <FileText
                size={16}
                className={
                  activeTab === "regular-documents"
                    ? "text-[#10B981]"
                    : "text-[#2563EB]"
                }
              />
              Regular Documents
            </button>

            <button
              onClick={() => setActiveTab("question-papers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "question-papers"
                  ? "bg-[#2563EB] text-white shadow-md"
                  : "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E2E8F0]/40"
              }`}
            >
              <FileText
                size={16}
                className={
                  activeTab === "question-papers"
                    ? "text-[#10B981]"
                    : "text-[#10B981]"
                }
              />
              Question Papers
            </button>
          </div>
          {/* Right Fade Indicator */}
          <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-[#F8FAFC] to-transparent pointer-events-none sm:hidden"></div>
        </div>

        {/* Sub-tabs for Generated Images (Visible Scrollbar Line for Mobile) */}
        {activeTab === "generated-images" && (
          <div className="relative mb-6">
            <div
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#E2E8F0] shadow-xs overflow-x-auto pb-2 pr-8"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#E2E8F0 transparent",
              }}
            >
              <button
                onClick={() => setSubTab("ai-photo-edit")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "ai-photo-edit"
                    ? "bg-[#2563EB] text-white"
                    : "text-[#0F172A] hover:bg-[#E2E8F0]/50"
                }`}
              >
                AI Photo Edit
              </button>
              <button
                onClick={() => setSubTab("manually-edited")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "manually-edited"
                    ? "bg-[#2563EB] text-white"
                    : "text-[#0F172A] hover:bg-[#E2E8F0]/50"
                }`}
              >
                Manually Edited
              </button>
              <button
                onClick={() => setSubTab("ai-template-generated")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "ai-template-generated"
                    ? "bg-[#2563EB] text-white"
                    : "text-[#0F172A] hover:bg-[#E2E8F0]/50"
                }`}
              >
                AI Template Generated
              </button>
              <button
                onClick={() => setSubTab("bulk-photo-edit")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "bulk-photo-edit"
                    ? "bg-[#2563EB] text-white"
                    : "text-[#0F172A] hover:bg-[#E2E8F0]/50"
                }`}
              >
                Bulk Photo Edit
              </button>
            </div>
            {/* Right Fade Indicator */}
            <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-2xl sm:hidden"></div>
          </div>
        )}

        {/* Filters and Search Bar Section (Fully Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {/* Search by filename */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F172A]/40"
            />
            <input
              type="text"
              placeholder="Search images by filename"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Date Picker */}
          <div className="relative col-span-1">
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Background Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
              <option>All backgrounds</option>
              <option>White Background</option>
              <option>Transparent</option>
            </select>
          </div>

          {/* Dress Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
              <option>All dress</option>
              <option>Formal</option>
              <option>Casual</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]">
              <option>Newest first</option>
              <option>Oldest first</option>
            </select>
          </div>

          {/* View Toggle Icons (Grid / List) */}
          <div className="col-span-full sm:col-span-1 flex items-center gap-1 justify-start sm:justify-end bg-white border border-[#E2E8F0] rounded-xl px-2 py-1">
            <button className="p-1.5 bg-[#2563EB] text-white rounded-lg shadow-xs cursor-pointer">
              <Grid size={14} />
            </button>
            <button className="p-1.5 text-[#0F172A]/50 hover:text-[#0F172A] rounded-lg cursor-pointer">
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Results Container (No Images Found Box) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#0F172A]/40 mb-3 border border-[#E2E8F0]">
            <ImageIcon size={24} />
          </div>
          <p className="text-[#0F172A]/70 text-xs font-medium">
            No images found
          </p>
        </div>
      </div>
    </div>
  );
}
