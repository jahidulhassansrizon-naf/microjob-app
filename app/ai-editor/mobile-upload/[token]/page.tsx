import type { Metadata } from "next";
import MobileUploadClient from "../MobileUploadClient";

export const metadata: Metadata = {
  title: "Upload photo from phone | Sohozkaj",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function MobileUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MobileUploadClient token={token} />;
}
