/**
 * Single source of truth for every client detail on the site.
 *
 * Nothing here is hard-coded in a component. There are two ways to fill it in
 * and they can be mixed:
 *
 *   1. Set the NEXT_PUBLIC_* environment variables — in Vercel, in Railway, or
 *      in .env.local. Nothing is rebuilt by hand and the repo stays generic.
 *   2. Replace the {{TOKEN}} fallbacks below with literal values and commit
 *      them. Simpler if the client is never going to touch a dashboard.
 *
 * A {{TOKEN}} that survives to a rendered page is a bug, not a placeholder:
 * a customer should never read "{{PHONE}}". `npm run audit:content` crawls the
 * built site and fails if one reaches the HTML, so this cannot go live half
 * filled in. Run it before every deploy — it is the check that the rest of the
 * hand-over depends on.
 *
 * These are NEXT_PUBLIC_ because client components import this file, which
 * means they are inlined at build time. Changing one needs a redeploy, not
 * just a save.
 */

/** Reads an env var, falling back to the token so the audit can spot it. */
const from = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
};

const phone = from("NEXT_PUBLIC_PHONE", "07970 752848");

export const site = {
  name: "The Paint Men",
  legalName: "The Paint Men",
  /** The person a customer actually deals with, start to finish. */
  owner: "James Young",
  trade: "Painter & decorator",
  tagline: "Decorating, done properly.",

  phone,
  /** Digits only, used for tel: links. Derived, so it cannot drift. */
  phoneHref: phone.replace(/[^\d+]/g, "") || phone,
  email: from("NEXT_PUBLIC_EMAIL", "{{EMAIL}}"),

  town: from("NEXT_PUBLIC_TOWN", "the Wirral"),
  serviceArea: from("NEXT_PUBLIC_SERVICE_AREA", "Merseyside, Cheshire & North Wales"),
  years: from("NEXT_PUBLIC_YEARS", "10"),
  /* Merseyside, so the embed opens on the area the business works out of
     rather than a pin on a house. */
  mapAddress: from("NEXT_PUBLIC_MAP_ADDRESS", "Merseyside, England"),

  social: {
    instagram: from("NEXT_PUBLIC_INSTAGRAM_URL", "{{INSTAGRAM_URL}}"),
    facebook: from("NEXT_PUBLIC_FACEBOOK_URL", "{{FACEBOOK_URL}}"),
  },

  /** Towns covered, shown as swatch chips in the service-area section. */
  towns: [
    "Birkenhead",
    "Wallasey",
    "Heswall",
    "West Kirby",
    "Bebington",
    "Neston",
    "Liverpool",
    "Ellesmere Port",
    "Chester",
    "Runcorn",
    "Mold",
    "Wrexham",
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

  /**
   * Absolute site URL, used for canonical tags, the sitemap and OG images.
   * The default matches the domain on the client's own logo; set
   * NEXT_PUBLIC_SITE_URL once the live host is known and redeploy, or every
   * canonical on the site points somewhere the client does not control.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://thepaintmen.com",
} as const;

export type Site = typeof site;

/**
 * True when every client detail has been filled in.
 *
 * Used to hide the things that are worse than absent when unset — a Facebook
 * link that goes to "{{FACEBOOK_URL}}" is a broken link on a live site, and a
 * map embed for "{{MAP_ADDRESS}}" is an error tile.
 */
export const isPlaceholder = (value: string): boolean => /\{\{[A-Z_]+\}\}/.test(value);

/**
 * The social profiles that actually exist, in display order.
 *
 * Filtered here rather than in each of the four places that render them, so an
 * unfilled profile can never reach a page as a link to "{{FACEBOOK_URL}}" —
 * a dead link in a footer is worse than an absent one, and it is the kind of
 * thing nobody notices until a customer clicks it.
 */
export const socialLinks = (
  [
    { label: "Instagram", href: site.social.instagram },
    { label: "Facebook", href: site.social.facebook },
  ] as const
).filter((link) => !isPlaceholder(link.href));

/** The map embed renders an error tile for an unresolved address. */
export const hasMapAddress = !isPlaceholder(site.mapAddress);

/** The site has exactly two conversion actions. Nothing else is a CTA. */
export const CTA_LABEL = "Get a Free Quote";
export const CTA_HREF = "/quote";
