/**
 * Single source of truth for every client detail on the site.
 *
 * Nothing here is hard-coded in a component. To hand the site over, edit this
 * file only — the tokens below ({{PHONE}} etc.) are placeholders ready for a
 * find-and-replace with the client's real details.
 */

export const site = {
  name: "The Paint Men",
  legalName: "The Paint Men",
  trade: "Painter & decorator",
  tagline: "Decorating, done properly.",

  phone: "{{PHONE}}",
  /** Digits only, used for tel: links. Keep in sync with `phone`. */
  phoneHref: "{{PHONE}}".replace(/[^\d+]/g, "") || "{{PHONE}}",
  email: "{{EMAIL}}",

  town: "{{TOWN}}",
  serviceArea: "{{SERVICE_AREA}}",
  years: "{{YEARS}}",
  mapAddress: "{{MAP_ADDRESS}}",

  social: {
    instagram: "{{INSTAGRAM_URL}}",
    facebook: "{{FACEBOOK_URL}}",
  },

  /** Towns covered, shown as swatch chips in the service-area section. */
  towns: [
    "{{TOWN}}",
    "Chester",
    "Northwich",
    "Knutsford",
    "Wilmslow",
    "Frodsham",
    "Tarporley",
    "Mold",
    "Wrexham",
    "Nantwich",
  ],

  hours: [
    { days: "Monday to Friday", time: "7.30am – 5.30pm" },
    { days: "Saturday", time: "8am – 1pm" },
    { days: "Sunday", time: "Closed" },
  ],

  /** Structured-data + copy facts. Keep honest. */
  facts: {
    guarantee: "2-year workmanship guarantee",
    insurance: "£2m public liability cover",
    responseTime: "Quotes back within 48 hours",
  },

  /** Absolute site URL, used for metadata, sitemap and OG images. */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thepaintman.co.uk",
} as const;

export type Site = typeof site;

/** The site has exactly two conversion actions. Nothing else is a CTA. */
export const CTA_LABEL = "Get a Free Quote";
export const CTA_HREF = "/quote";
