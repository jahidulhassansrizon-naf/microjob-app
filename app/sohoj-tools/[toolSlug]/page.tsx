import { permanentRedirect } from "next/navigation";

/**
 * পুরোনো লিংক (/sohoj-tools/[slug]) → নতুন লিংক (/seba-lagbe-tools/[slug])।
 */
type SearchParams = Record<string, string | string[] | undefined>;

export default async function LegacySebaLagbeToolRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ toolSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { toolSlug } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else if (value !== undefined) qs.set(key, value);
  }
  const query = qs.toString();
  permanentRedirect(`/seba-lagbe-tools/${encodeURIComponent(toolSlug)}${query ? `?${query}` : ""}`);
}
