import { mergeSiteSettings } from "@/lib/siteSettings";

export type ContactListKey = "emails" | "phones" | "locations";
export type ContactSettingsWithLists = {
  email?: string;
  phone?: string;
  address?: string;
  emails?: string[];
  phones?: string[];
  locations?: string[];
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function sourceList(sourceContact: Record<string, unknown>, mergedContact: Record<string, unknown>, listKey: ContactListKey, legacyKey: "email" | "phone" | "address"): string[] {
  // An explicitly saved empty array means the admin intentionally removed every item.
  if (Array.isArray(sourceContact[listKey])) return cleanList(sourceContact[listKey]);
  const rawLegacy = sourceContact[legacyKey];
  const mergedLegacy = mergedContact[legacyKey];
  const fallback = typeof rawLegacy === "string" ? rawLegacy : typeof mergedLegacy === "string" ? mergedLegacy : "";
  return fallback.trim() ? [fallback.trim()] : [];
}

/** Merge ordinary settings and preserve editable contact lists even when the legacy
 * shared siteSettings normalizer only knows about the single-value contact fields. */
export function mergeSiteSettingsWithContactLists<T = Record<string, unknown>>(rawSettings: unknown): T {
  const merged = mergeSiteSettings((rawSettings ?? {}) as never) as unknown as Record<string, unknown>;
  const source = asRecord(rawSettings);
  const sourceContact = asRecord(source.contact);
  const mergedContact = asRecord(merged.contact);
  const emails = sourceList(sourceContact, mergedContact, "emails", "email");
  const phones = sourceList(sourceContact, mergedContact, "phones", "phone");
  const locations = sourceList(sourceContact, mergedContact, "locations", "address");

  return {
    ...merged,
    contact: {
      ...mergedContact,
      emails,
      phones,
      locations,
      // Keep the original single-value fields in sync so older components and
      // existing EmailJS routing continue to use the first configured item.
      email: emails[0] ?? "",
      phone: phones[0] ?? "",
      address: locations[0] ?? "",
    },
  } as unknown as T;
}

export function getContactList(contactValue: unknown, key: ContactListKey): string[] {
  const contact = asRecord(contactValue);
  if (Array.isArray(contact[key])) return cleanList(contact[key]);
  const legacyKey = key === "emails" ? "email" : key === "phones" ? "phone" : "address";
  const value = contact[legacyKey];
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}
