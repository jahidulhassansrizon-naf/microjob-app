import { permanentRedirect } from "next/navigation";

/**
 * পুরোনো লিংক (/sohoj-tools) → নতুন লিংক (/seba-lagbe-tools)।
 * আগের বুকমার্ক বা শেয়ার করা লিংক যেন নষ্ট না হয়, তাই এই ছোট রিডাইরেক্ট রাখা হয়েছে।
 */
type SearchParams = Record<string, string | string[] | undefined>;

export default async function LegacySebaLagbeToolsRedirect({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value !== undefined) qs.set(key, value);
  }
  const query = qs.toString();
  permanentRedirect(`/seba-lagbe-tools${query ? `?${query}` : ""}`);
}
