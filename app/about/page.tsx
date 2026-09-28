import AboutHero from "@/components/aboutComponent/AboutHero";
import AboutJourney from "@/components/aboutComponent/AboutJourney";
import AboutValues from "@/components/aboutComponent/AboutValues";
import AboutOffice from "@/components/aboutComponent/AboutOffice";
import AboutTeamCTA from "@/components/aboutComponent/AboutTeamCTA";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-blue-100 selection:text-[#2563EB]">
      <main className="space-y-12 md:space-y-16 pt-6 pb-16">
        <AboutHero />
        <AboutJourney />
        <AboutValues />
        <AboutOffice />
        <AboutTeamCTA />
      </main>
      <CtaBanner />
      <Footer />
    </div>
  );
}
