import { site, socialLinks } from "@/config/site";

/**
 * LocalBusiness structured data. For a decorator this is the single highest
 * value piece of SEO on the site: it is what puts the trade, the area served,
 * the phone number and the opening hours into a local search result.
 *
 * schema.org/HousePainter is a subtype of LocalBusiness and is the exact fit.
 */

const DAY_MAP: Record<string, string[]> = {
  "Monday to Friday": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  Saturday: ["Saturday"],
  Sunday: ["Sunday"],
};

/** "7.30am – 5.30pm" -> { opens: "07:30", closes: "17:30" } */
function parseHours(time: string): { opens: string; closes: string } | null {
  if (/closed/i.test(time)) return null;
  const parts = time.split(/[–-]/).map((part) => part.trim());
  if (parts.length !== 2) return null;

  const toIso = (value: string): string | null => {
    const match = value.match(/^(\d{1,2})(?:[.:](\d{2}))?\s*(am|pm)$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = match[2] ?? "00";
    const meridiem = match[3].toLowerCase();
    if (meridiem === "pm" && hour !== 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  };

  const opens = toIso(parts[0]);
  const closes = toIso(parts[1]);
  return opens && closes ? { opens, closes } : null;
}

export function StructuredData() {
  const openingHours = site.hours
    .map((slot) => {
      const parsed = parseHours(slot.time);
      if (!parsed) return null;
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: DAY_MAP[slot.days] ?? [slot.days],
        opens: parsed.opens,
        closes: parsed.closes,
      };
    })
    .filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@type": "HousePainter",
    "@id": `${site.url}#business`,
    name: site.name,
    description: `Painter and decorator covering ${site.serviceArea}. Interior and exterior decorating, wallpapering, spray finishing and commercial work.`,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: `${site.url}/work/hero.jpg`,
    priceRange: "££",
    address: {
      "@type": "PostalAddress",
      addressLocality: site.town,
      addressCountry: "GB",
    },
    areaServed: site.towns.map((town) => ({ "@type": "City", name: town })),
    openingHoursSpecification: openingHours,
    /* Only real profiles. A sameAs pointing at "{{FACEBOOK_URL}}" is an
       invalid URL in the knowledge graph and does the business no favours. */
    sameAs: socialLinks.map((link) => link.href),
    knowsAbout: [
      "Interior decorating",
      "Exterior painting",
      "Wallpapering",
      "Spray finishing",
      "Commercial decorating",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own config, never from user input.
      dangerouslySetInnerHTML={{ __html: ldJson(data) }}
    />
  );
}

/** Article markup for a blog post. */
export function ArticleStructuredData({
  title,
  description,
  slug,
  date,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  date: string;
  image: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    image: `${site.url}${image}`,
    mainEntityOfPage: `${site.url}/blog/${slug}`,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(data) }} />
  );
}

/**
 * JSON-LD, serialised so it cannot escape its own <script> tag.
 *
 * `JSON.stringify` does not escape `<`, so a value containing the literal
 * `</script>` ends the block early and everything after it is parsed as HTML —
 * the classic JSON-in-HTML injection. Nothing in src/config or src/data
 * currently contains one, so this is not a live hole; it is a hole that opens
 * the first time a value here comes from anywhere less trusted than a file in
 * this repo, and it costs one replace to close permanently.
 *
 * U+2028/U+2029 go with it: legal in JSON, illegal in a JavaScript string
 * literal, and a silent parse error in older consumers.
 */
function ldJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
