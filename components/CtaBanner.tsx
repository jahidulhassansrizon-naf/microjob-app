"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, X } from "lucide-react";

export default function CtaBanner() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  const highlights = [
    "Create files in one click",
    "All tools in one place",
    "Save time, reduce hassle",
  ];

  return (
    <section className="w-full bg-gradient-to-r from-[#FF5100] via-[#E1007E] to-[#8000FF] py-20 px-6 md:px-12 text-center text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 relative z-10">
        {/* Badge */}
        <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs">
          Our Specialty
        </div>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
          Get Started for Free Now!
        </h2>

        {/* Subtitle */}
        <p className="text-white/80 text-xs md:text-sm font-medium max-w-lg">
          Join our platform today and make your daily work easier with SohozKaj.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold px-7 py-3.5 rounded-full text-sm inline-flex items-center justify-center gap-2 shadow-lg transition hover:scale-105 cursor-pointer"
          >
            <span>Start for Free</span>
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-sm text-white font-bold px-7 py-3.5 rounded-full text-sm transition cursor-pointer"
          >
            Watch Demo Video
          </button>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs"
            >
              <CheckCircle2 size={14} className="text-white shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Video Popup Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-10 right-0 z-50 text-white/90 hover:text-white transition cursor-pointer flex items-center gap-1"
              aria-label="Close video"
            >
              <X size={26} />
            </button>

            {/* Youtube Embedded Video */}
            <iframe
              src="https://www.youtube.com/embed/NyGp0RiWXmM?autoplay=1&rel=0"
              title="SohozKaj Demo Video"
              className="w-full h-full border-0 rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
