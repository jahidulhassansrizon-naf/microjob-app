export type SiteSettings = {
  branding: {
    siteName: string;
    tagline: string;
    logoUrl: string;
    footerLogoUrl: string;
    metaTitle: string;
    metaDescription: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    whatsapp: string;
    supportHours: string;
  };
  contactPage: {
    heroTitle: string;
    heroSubtitle: string;
    contactPrompt: string;
    callDescription: string;
    emailDescription: string;
    officeTitle: string;
    officeDescription: string;
    visitNote: string;
    availabilityLabel: string;
    availabilityText: string;
    mapLabel: string;
  };
  footer: {
    description: string;
    copyrightText: string;
  };
  developer: {
    title: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  partner: {
    title: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  aboutPage: {
    primaryOfficeLabel: string;
    primaryOfficeLicense: string;
    secondaryOfficeLabel: string;
    secondaryOfficeAddress: string;
    secondaryOfficePhone: string;
    secondaryOfficeId: string;
  };
  socials: {
    facebook: string;
    tiktok: string;
    youtube: string;
    instagram: string;
  };
};

export function replaceSiteNameInText(value: string, siteName: string): string {
  const configuredName = siteName.trim();
  if (!configuredName || configuredName === "Seba Lagbe") return value;
  return value.replace(/Seba Lagbe|সেবা লাগবে/g, configuredName);
}

/**
 * Build the browser/SEO title consistently on the server and in the client.
 * The configured website name must remain visible even if the saved metaTitle
 * contains only the old tagline (for example, "All your digital tasks in one place").
 */
export function buildSiteTitle(
  siteNameValue: string,
  metaTitleValue: string,
  taglineValue: string,
): string {
  const siteName = siteNameValue.trim() || DEFAULT_SITE_SETTINGS.branding.siteName;
  const tagline = taglineValue.trim() || DEFAULT_SITE_SETTINGS.branding.tagline;
  const rawTitle = metaTitleValue.trim() || `${siteName} - ${tagline}`;
  const replacedTitle = replaceSiteNameInText(rawTitle, siteName).trim();
  if (!replacedTitle) return siteName;

  // Keep an already-correct brand prefix unchanged.
  const prefixPattern = new RegExp(`^${escapeRegExp(siteName)}(?:$|[\\s\\-–—:|])`, "i");
  if (prefixPattern.test(replacedTitle)) return replacedTitle;

  // If the name appears later in a custom title, move it to the front rather
  // than displaying duplicate branding in the browser tab.
  const namePattern = new RegExp(escapeRegExp(siteName), "ig");
  const suffix = replacedTitle
    .replace(namePattern, " ")
    .replace(/^[\s\-–—:|]+|[\s\-–—:|]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return suffix ? `${siteName} - ${suffix}` : siteName;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  branding: {
    siteName: "Seba Lagbe",
    tagline: "All your digital tasks in one place",
    logoUrl: "/sebalagbelogo/sebalagbelogo.png",
    footerLogoUrl: "/footerLogo/logoFooter.jpg",
    metaTitle: "Seba Lagbe - All your digital tasks in one place",
    metaDescription: "Create documents, designs, and print media easily.",
  },
  contact: {
    phone: "017836666743",
    email: "jahidulhassansrizon@gmail.com",
    address: "Bou Bazar Rd, Tongi 1230, Bangladesh",
    whatsapp: "017836666743",
    supportHours: "No fixed office hours",
  },
  contactPage: {
    heroTitle: "Let's talk about your project.",
    heroSubtitle: "Seba Lagbe is independently built and operated from a home workspace in Tongi, Bangladesh. Send a message about support, feedback, or collaboration, and I'll reply as soon as I can.",
    contactPrompt: "Tell me a little about what you need. I'll get back to you as soon as I can.",
    callDescription: "Call if you need a quick reply",
    emailDescription: "Reach out any time",
    officeTitle: "Home-based workspace",
    officeDescription: "I work from home and am usually reachable throughout the day. Urgent work or errands may occasionally delay a reply, so please contact me before visiting.",
    visitNote: "Please contact me before visiting.",
    availabilityLabel: "Flexible availability",
    availabilityText: "Usually reachable throughout the day; a response can take longer during urgent tasks.",
    mapLabel: "Find the area on Google Maps",
  },
  footer: {
    description: "Seba Lagbe Platform — document creation, design, print media, and AI tools — all in one place.",
    copyrightText: "All rights reserved.",
  },
  developer: {
    title: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  },
  partner: {
    title: "",
    name: "",
    email: "",
    phone: "",
    address: "",
  },
  aboutPage: {
    primaryOfficeLabel: "Bangladesh - Head Office",
    primaryOfficeLicense: "To be updated...",
    secondaryOfficeLabel: "United States - Hub",
    secondaryOfficeAddress: "Address will be updated soon...",
    secondaryOfficePhone: "Phone number will be updated soon...",
    secondaryOfficeId: "To be updated...",
  },
  socials: {
    facebook: "https://www.facebook.com/profile.php?id=61593666395329",
    tiktok: "https://www.tiktok.com/@happycodingn",
    youtube: "https://www.youtube.com/channel/UCt9GohPOuqrNFYdkcM1fqWQ",
    instagram: "",
  },
};

const FIELD_LIMITS: Record<string, number> = {
  siteName: 120, tagline: 240, logoUrl: 2048, footerLogoUrl: 2048,
  metaTitle: 240, metaDescription: 500, title: 240, name: 200,
  phone: 60, email: 254, address: 500, whatsapp: 60, supportHours: 240, heroTitle: 240,
  heroSubtitle: 1200, contactPrompt: 800, callDescription: 300,
  emailDescription: 300, officeTitle: 240, officeDescription: 1200,
  visitNote: 800, availabilityLabel: 240, availabilityText: 800,
  mapLabel: 240, description: 1200, copyrightText: 240,
  primaryOfficeLabel: 200, primaryOfficeLicense: 200, secondaryOfficeLabel: 200,
  secondaryOfficeAddress: 500, secondaryOfficePhone: 80, secondaryOfficeId: 200,
  facebook: 2048, tiktok: 2048, youtube: 2048, instagram: 2048,
};

function cleanString(value: unknown, field: string, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim().slice(0, FIELD_LIMITS[field] ?? 1200);
  if (field === "siteName" && !cleaned) return fallback;
  const urlFields = new Set(["logoUrl", "footerLogoUrl", "facebook", "tiktok", "youtube", "instagram"]);
  if (urlFields.has(field) && cleaned) {
    const isLocalAsset = (field === "logoUrl" || field === "footerLogoUrl") && cleaned.startsWith("/") && !cleaned.startsWith("//");
    const isHttps = /^https:\/\//i.test(cleaned);
    const isSocialHttp = ["facebook", "tiktok", "youtube", "instagram"].includes(field) && /^https?:\/\//i.test(cleaned);
    if (!(isLocalAsset || isHttps || isSocialHttp)) return fallback;
  }
  return cleaned;
}

/** Merge saved settings with defaults, so newly introduced fields never break older records. */
export function mergeSiteSettings(value: unknown): SiteSettings {
  const incoming = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const mergeGroup = <K extends keyof SiteSettings>(group: K): SiteSettings[K] => {
    const defaults = DEFAULT_SITE_SETTINGS[group] as Record<string, string>;
    const raw = incoming[group] && typeof incoming[group] === "object"
      ? incoming[group] as Record<string, unknown>
      : {};
    const output: Record<string, string> = {};
    for (const field of Object.keys(defaults)) {
      output[field] = cleanString(raw[field], field, defaults[field]);
    }
    return output as SiteSettings[K];
  };
  return {
    branding: mergeGroup("branding"),
    contact: mergeGroup("contact"),
    contactPage: mergeGroup("contactPage"),
    footer: mergeGroup("footer"),
    developer: mergeGroup("developer"),
    partner: mergeGroup("partner"),
    aboutPage: mergeGroup("aboutPage"),
    socials: mergeGroup("socials"),
  };
}
