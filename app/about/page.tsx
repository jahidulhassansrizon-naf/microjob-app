import AboutHero from "@/components/aboutComponent/AboutHero";
import AboutJourney from "@/components/aboutComponent/AboutJourney";
import AboutValues from "@/components/aboutComponent/AboutValues";
import AboutOffice from "@/components/aboutComponent/AboutOffice";
import AboutTeamCTA from "@/components/aboutComponent/AboutTeamCTA";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-slate-50/30 space-y-8 pt-8 pb-12">
        <AboutHero />
        <AboutJourney />
        <AboutValues />
        <AboutOffice />
        <AboutTeamCTA />
      </main>
      <CtaBanner />
      <Footer />
    </>
  );
}
