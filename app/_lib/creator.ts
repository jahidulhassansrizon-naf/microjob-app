// Who made SebaLagbe.com. One place for the founder's name, photo and the Google (JSON-LD) data,
// so the About page, the root layout and the metadata always say the same thing.
// Google compares this data with what a visitor can actually read on the page, so the same
// name and photo are also shown in plain view on /about.

export const SITE_URL = "https://sebalagbe.com";
export const SITE_NAME = "SebaLagbe.com";
export const SITE_ALT_NAMES = ["Seba Lagbe", "সেবা লাগবে", "sebalagbe.com"];

export const CREATOR = {
  nameBn: "জাহিদুল হাসান সৃজন",
  nameEn: "Jahidul Hassan Srizon",
  // Other spellings people may search for.
  altNames: [
    "Jahidul Hasan Srizon",
    "Jahidul Hassan Srijon",
    "Zahidul Hasan Srizon",
    "Zahidul Hasan Srijon",
  ],
  roleEn: "Founder, designer & full-stack developer",
  roleBn: "প্রতিষ্ঠাতা, ডিজাইনার ও ফুল-স্ট্যাক ডেভেলপার",
} as const;

// Family and hometown, only put into the Google data on /about (not visible on the page).
// Set INCLUDE_FAMILY_IN_GOOGLE_DATA to false to remove all of it from the Google data again.
export const INCLUDE_FAMILY_IN_GOOGLE_DATA = true;

export const FAMILY = {
  hometown: {
    nameBn: "জয়াগ, নোয়াখালী",
    nameEn: "Joyag, Noakhali, Bangladesh",
    region: "Noakhali",
    country: "BD",
  },
  father: { nameEn: "Parvez Mahamud Shuvo", nameBn: "পারভেজ মাহমুদ শুভ" },
  mother: { nameEn: "Roksana Akter Lipi", nameBn: "রোকসানা আক্তার লিপি" },
} as const;

// public/adminpic/srizonFbPic.jpg (file name is case-sensitive on the server).
export const FOUNDER_IMAGE_PATH = "/adminpic/srizonFbPic.jpg";
export const FOUNDER_IMAGE_URL = FOUNDER_IMAGE_PATH;

// The founder's own profiles. Google uses these links to confirm that the person on this site
// and the person on Facebook / YouTube are the same, which helps the name and photo show up in search.
export const FOUNDER_SOCIAL_LINKS = [
  "https://www.facebook.com/profile.php?id=61593666395329",
  "https://www.youtube.com/@srizonbuilds",
];

export const ABOUT_URL = `${SITE_URL}/about`;
export const PERSON_ID = `${ABOUT_URL}#founder`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const CREATOR_DESCRIPTION_EN = `${CREATOR.nameEn} (${CREATOR.nameBn}) is the creator and founder of ${SITE_NAME}. He designs and develops the whole platform on his own.`;

const personCore = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: CREATOR.nameBn,
  alternateName: [CREATOR.nameEn, ...CREATOR.altNames],
  url: ABOUT_URL,
  sameAs: FOUNDER_SOCIAL_LINKS,
};

const familyJsonLd = () =>
  INCLUDE_FAMILY_IN_GOOGLE_DATA
    ? {
        homeLocation: {
          "@type": "Place",
          name: FAMILY.hometown.nameEn,
          alternateName: FAMILY.hometown.nameBn,
          address: {
            "@type": "PostalAddress",
            addressRegion: FAMILY.hometown.region,
            addressCountry: FAMILY.hometown.country,
          },
        },
        parent: [FAMILY.father, FAMILY.mother].map((p) => ({
          "@type": "Person",
          name: p.nameEn,
          alternateName: p.nameBn,
        })),
      }
    : {};

/** Full description of the founder (used on /about). */
export const personJsonLd = () => ({
  ...personCore,
  ...familyJsonLd(),
  image: `${SITE_URL}${FOUNDER_IMAGE_PATH}`,
  jobTitle: CREATOR.roleEn,
  description: CREATOR_DESCRIPTION_EN,
  worksFor: { "@id": ORGANIZATION_ID },
  owns: { "@id": ORGANIZATION_ID },
});

/** The organisation + website, with the founder linked in (used on every page). */
export const siteJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: SITE_ALT_NAMES,
      url: SITE_URL,
      founder: personCore,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      name: SITE_NAME,
      alternateName: SITE_ALT_NAMES,
      url: SITE_URL,
      publisher: { "@id": ORGANIZATION_ID },
      creator: { "@id": PERSON_ID },
    },
  ],
});

/** The /about page: a profile page whose main subject is the founder. */
export const aboutPageJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${ABOUT_URL}#profilepage`,
      url: ABOUT_URL,
      name: `${CREATOR.nameBn} (${CREATOR.nameEn}) – ${SITE_NAME}`,
      inLanguage: ["bn", "en"],
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: personJsonLd(),
    },
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      alternateName: SITE_ALT_NAMES,
      url: SITE_URL,
      founder: { "@id": PERSON_ID },
    },
  ],
});

/** Safe to put inside <script type="application/ld+json">. */
export const jsonLdString = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
