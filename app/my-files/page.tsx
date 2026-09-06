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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#FF5D00] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // অথেন্টিকেটেড না হলে পেজ রেন্ডার হবে না
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navbar */}
      <DashboardNavbar />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title */}
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">
          My Files
        </h1>

        {/* Top Category Buttons (Visible Scrollbar Line for Mobile) */}
        <div className="relative mb-6">
          <div
            className="flex items-center gap-3 overflow-x-auto pb-3 pr-8"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#CBD5E1 transparent",
            }}
          >
            <button
              onClick={() => setActiveTab("generated-images")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "generated-images"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Sparkles
                size={16}
                className={
                  activeTab === "generated-images"
                    ? "text-orange-400"
                    : "text-gray-500"
                }
              />
              Generated Images
            </button>

            <button
              onClick={() => setActiveTab("print-media")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "print-media"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Printer size={16} className="text-orange-500" />
              Print Media
            </button>

            <button
              onClick={() => setActiveTab("regular-documents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "regular-documents"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FileText size={16} className="text-blue-500" />
              Regular Documents
            </button>

            <button
              onClick={() => setActiveTab("question-papers")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "question-papers"
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FileText size={16} className="text-red-500" />
              Question Papers
            </button>
          </div>
          {/* Right Fade Indicator */}
          <div className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-[#FDFBF7] to-transparent pointer-events-none sm:hidden"></div>
        </div>

        {/* Sub-tabs for Generated Images (Visible Scrollbar Line for Mobile) */}
        {activeTab === "generated-images" && (
          <div className="relative mb-6">
            <div
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs overflow-x-auto pb-2 pr-8"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#CBD5E1 transparent",
              }}
            >
              <button
                onClick={() => setSubTab("ai-photo-edit")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "ai-photo-edit"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                AI Photo Edit
              </button>
              <button
                onClick={() => setSubTab("manually-edited")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "manually-edited"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Manually Edited
              </button>
              <button
                onClick={() => setSubTab("ai-template-generated")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "ai-template-generated"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                AI Template Generated
              </button>
              <button
                onClick={() => setSubTab("bulk-photo-edit")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  subTab === "bulk-photo-edit"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search images by filename"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Date Picker */}
          <div className="relative col-span-1">
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Background Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-400">
              <option>All backgrounds</option>
              <option>White Background</option>
              <option>Transparent</option>
            </select>
          </div>

          {/* Dress Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-400">
              <option>All dress</option>
              <option>Formal</option>
              <option>Casual</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="col-span-1">
            <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-gray-400">
              <option>Newest first</option>
              <option>Oldest first</option>
            </select>
          </div>

          {/* View Toggle Icons (Grid / List) */}
          <div className="col-span-full sm:col-span-1 flex items-center gap-1 justify-start sm:justify-end bg-white border border-gray-200 rounded-xl px-2 py-1">
            <button className="p-1.5 bg-amber-600 text-white rounded-lg shadow-xs cursor-pointer">
              <Grid size={14} />
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer">
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Results Container (No Images Found Box) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
            <ImageIcon size={24} />
          </div>
          <p className="text-gray-500 text-xs font-medium">No images found</p>
        </div>
      </div>
    </div>
  );
}
