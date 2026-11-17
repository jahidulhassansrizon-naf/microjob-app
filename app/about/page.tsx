import type { Metadata } from "next";
import AboutContent from "./AboutContent";
import Footer from "@/components/Footer";
import {
  ABOUT_URL,
  CREATOR,
  FOUNDER_IMAGE_PATH,
  SITE_NAME,
  aboutPageJsonLd,
  jsonLdString,
} from "@/app/_lib/creator";

// Written in both languages on purpose: the server cannot know the visitor's language, and people
// search for the founder's name in Bangla and in English.
const title = `${CREATOR.nameBn} (${CREATOR.nameEn}) – Founder & Developer of ${SITE_NAME}`;
const description =
  `${CREATOR.nameBn} (${CREATOR.nameEn}) হলেন ${SITE_NAME}-এর প্রতিষ্ঠাতা ও নির্মাতা। তিনি একাই পুরো প্ল্যাটফর্ম ডিজাইন ও ডেভেলপ করছেন। ` +
  `${CREATOR.nameEn} is the creator and founder of ${SITE_NAME}, designing and developing the whole platform on his own.`;

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: CREATOR.nameBn, url: ABOUT_URL }, { name: CREATOR.nameEn, url: ABOUT_URL }],
  creator: CREATOR.nameBn,
  publisher: SITE_NAME,
  alternates: { canonical: ABOUT_URL },
  openGraph: {
    type: "profile",
    url: ABOUT_URL,
    title,
    description,
    siteName: SITE_NAME,
    images: [{ url: FOUNDER_IMAGE_PATH, alt: `${CREATOR.nameBn} (${CREATOR.nameEn})` }],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [FOUNDER_IMAGE_PATH],
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(aboutPageJsonLd()) }}
      />
      <main className="min-h-screen">
        <AboutContent />
      </main>
      <Footer />
    </>
  );
}
