// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HeroFeatures from "@/components/HeroFeatures";
import AiEditorSection from "@/components/AiEditorSection";
import DocumentSection from "@/components/DocumentSection";
import PrintMediaSection from "@/components/PrintMediaSection";
import WhyChooseUs from "@/components/WhyChooseUs";
import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Helper function: Cookie থেকে টোকেন বের করার জন্য
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return null;
    };

    const tokenLocal = localStorage.getItem("token");
    const tokenCookie = getCookie("token");

    // টোকেন থাকলে সরাসরি ড্যাশবোর্ডে পাঠাবে
    if (tokenLocal || tokenCookie) {
      router.replace("/dashboard");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  // চেক করার সময় ফ্লিকার প্রতিরোধ করতে হালকা লোডিং
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAF7FD] flex items-center justify-center font-sans">
        <p className="text-gray-500 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7FD] overflow-x-hidden">
      <Hero />
      <HeroFeatures />
      <AiEditorSection />
      <DocumentSection />
      <PrintMediaSection />
      <WhyChooseUs />
      <FaqSection />
      <CtaBanner />
      <Footer />
    </div>
  );
}
