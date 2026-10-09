// app/page.tsx
"use client";
import { T } from "@/components/i18n/I18nProvider";
import { useEffect, useState } from "react";
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
    const [isChecking, setIsChecking] = useState(true);
    useEffect(() => {
        // লগইন করা ইউজারও হোম পেজ দেখতে পারবে; এখানে সেশন থাকলেই
        // ড্যাশবোর্ডে স্বয়ংক্রিয় রিডাইরেক্ট করা হবে না।
        setIsChecking(false);
    }, []);
    // Scroll Restoration (রিলোড দিলে ঠিক একই পজিশনে ধরে রাখার লজিক)
    useEffect(() => {
        if (isChecking)
            return;
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
    }, [isChecking]);
    // চেক করার সময় ফ্লিকার প্রতিরোধ করতে হালকা লোডিং
    if (isChecking) {
        return (<div className="min-h-screen bg-[#FAF7FD] flex items-center justify-center font-sans">
        <p className="text-gray-500 font-medium"><T>{"Loading..."}</T></p>
      </div>);
    }
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
