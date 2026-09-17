import React from "react";
import FaqSection from "@/components/FaqSection";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";
import Hero from "@/components/helpPageComponent/Hero";
export default function HelpPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}

      {/* Video Grid */}
      <Hero />
      {/* Helpline Box */}

      {/* FAQ Section */}
      <FaqSection />

      {/* CTA Banner */}
      <CtaBanner />

      {/* Footer */}
      <Footer />
    </main>
  );
}
