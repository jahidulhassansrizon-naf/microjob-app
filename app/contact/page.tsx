import ContactHero from "@/components/contactPageComponent/ContactHero";
import ContactMap from "@/components/contactPageComponent/ContactMap";
import RegisteredAddress from "@/components/contactPageComponent/RegisteredAddress";
import CtaBanner from "@/components/CtaBanner";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 1. Hero Title, Form & Info */}
      <ContactHero />

      {/* 2. Office Map Section */}
      <ContactMap />

      {/* 3. Address & License Details */}
      <RegisteredAddress />

      {/* 4. Pre-built CTA Banner */}
      <CtaBanner />

      {/* 5. Pre-built Footer */}
      <Footer />
    </main>
  );
}
