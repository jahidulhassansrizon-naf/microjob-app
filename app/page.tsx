// app/page.tsx
"use client";
import { useEffect } from "react";
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
    // There is nothing to check (logged-in users may also see the home page), so the page renders
    // its real content immediately - no "Loading..." placeholder frame on reload.
    // Scroll Restoration (রিলোড দিলে ঠিক একই পজিশনে ধরে রাখার লজিক)
    useEffect(() => {
        // ১. আগের সেভ থাকা স্ক্রোল পজিশনে ফিরিয়ে নিয়ে যাওয়া
        const savedScrollPos = sessionStorage.getItem("home_scroll_pos");
        if (savedScrollPos) {
            setTimeout(() => {
                window.scrollTo({
                    top: parseInt(savedScrollPos, 10),
                    behavior: "instant" as ScrollBehavior,
                });
            }, 50);
        }
        // ২. ইউজার যখনই স্ক্রোল করবে, বর্তমান পজিশন সেভ রাখা
        const handleScroll = () => {
            sessionStorage.setItem("home_scroll_pos", window.scrollY.toString());
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);
    return (<div className="min-h-screen bg-[#FAF7FD] overflow-x-hidden">
      <Hero />
      <HeroFeatures />
      <AiEditorSection />
      <DocumentSection />
      <PrintMediaSection />
      <WhyChooseUs />
      <FaqSection />
      <CtaBanner />
      <Footer />
    </div>);
}
