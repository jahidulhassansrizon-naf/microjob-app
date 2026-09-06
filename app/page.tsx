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
