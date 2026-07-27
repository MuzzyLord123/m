import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Industry detection ---
type Industry = "agency" | "saas" | "ecommerce" | "corporate" | "restaurant" | "healthcare" | "education" | "photography" | "startup" | "generic";

const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  agency: ["agency", "creative", "design agency", "marketing agency", "branding", "digital agency"],
  saas: ["saas", "software", "platform", "app", "dashboard", "subscription", "tool"],
  ecommerce: ["store", "shop", "ecommerce", "e-commerce", "product", "retail", "buy", "cart"],
  corporate: ["corporate", "enterprise", "business", "consulting", "firm", "professional"],
  restaurant: ["restaurant", "food", "menu", "dining", "cafe", "bistro", "catering", "chef"],
  healthcare: ["health", "medical", "doctor", "clinic", "hospital", "wellness", "therapy", "patient"],
  education: ["education", "course", "learning", "school", "university", "training", "instructor", "teach"],
  photography: ["photography", "photo", "photographer", "studio", "portrait", "gallery", "wedding photo"],
  startup: ["startup", "launch", "mvp", "investor", "funding", "disrupt"],
  generic: [],
};

function detectIndustry(prompt: string): Industry {
  const lower = prompt.toLowerCase();
  let best: Industry = "generic";
  let bestScore = 0;
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS) as [Industry, string[]][]) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = industry; }
  }
  return best;
}

// --- Section type categorization ---
function categorizeSections(sectionIds: string[]) {
  const cats: Record<string, string[]> = {
    nav: [], hero: [], features: [], pricing: [], testimonials: [],
    cta: [], contact: [], team: [], stats: [], faq: [], gallery: [],
    blog: [], footer: [], howItWorks: [], about: [], logos: [], other: [],
  };

  for (const id of sectionIds) {
    const lower = id.toLowerCase();
    if (lower.startsWith("nav-")) cats.nav.push(id);
    else if (lower.includes("hero")) cats.hero.push(id);
    else if (lower.includes("feature")) cats.features.push(id);
    else if (lower.includes("pricing")) cats.pricing.push(id);
    else if (lower.includes("testimonial")) cats.testimonials.push(id);
    else if (lower.includes("cta")) cats.cta.push(id);
    else if (lower.includes("contact")) cats.contact.push(id);
    else if (lower.includes("team")) cats.team.push(id);
    else if (lower.includes("stat")) cats.stats.push(id);
    else if (lower.includes("faq")) cats.faq.push(id);
    else if (lower.includes("gallery") || lower.includes("portfolio")) cats.gallery.push(id);
    else if (lower.includes("blog")) cats.blog.push(id);
    else if (lower.includes("footer")) cats.footer.push(id);
    else if (lower.includes("how-it-works") || lower.includes("process") || lower.includes("step")) cats.howItWorks.push(id);
    else if (lower.includes("about")) cats.about.push(id);
    else if (lower.includes("logo")) cats.logos.push(id);
    else cats.other.push(id);
  }

  return cats;
}

function pick<T>(arr: T[], fallback?: T): T | undefined {
  if (arr.length === 0) return fallback;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// --- Page layout recipes by page type ---
type PageType = "home" | "about" | "services" | "pricing" | "contact" | "blog" | "gallery" | "faq" | "team" | "generic";

function guessPageType(slug: string, name: string): PageType {
  const combined = (slug + " " + name).toLowerCase();
  if (slug === "/") return "home";
  if (combined.includes("about")) return "about";
  if (combined.includes("service") || combined.includes("feature") || combined.includes("product")) return "services";
  if (combined.includes("pricing") || combined.includes("plan")) return "pricing";
  if (combined.includes("contact")) return "contact";
  if (combined.includes("blog") || combined.includes("news") || combined.includes("article")) return "blog";
  if (combined.includes("gallery") || combined.includes("portfolio") || combined.includes("work") || combined.includes("case")) return "gallery";
  if (combined.includes("faq")) return "faq";
  if (combined.includes("team") || combined.includes("people") || combined.includes("staff")) return "team";
  return "generic";
}

// Layout recipe: which category slots to fill for each page type
const PAGE_RECIPES: Record<PageType, string[][]> = {
  home: [
    ["nav", "hero", "features", "stats", "testimonials", "cta", "footer"],
    ["nav", "hero", "features", "logos", "howItWorks", "cta", "footer"],
    ["nav", "hero", "features", "stats", "cta", "footer"],
  ],
  about: [
    ["nav", "hero", "about", "team", "stats", "footer"],
    ["nav", "about", "team", "gallery", "cta", "footer"],
  ],
  services: [
    ["nav", "hero", "features", "howItWorks", "cta", "footer"],
    ["nav", "features", "stats", "testimonials", "cta", "footer"],
  ],
  pricing: [
    ["nav", "hero", "pricing", "faq", "cta", "footer"],
    ["nav", "pricing", "features", "testimonials", "footer"],
  ],
  contact: [
    ["nav", "contact", "faq", "footer"],
    ["nav", "hero", "contact", "footer"],
  ],
  blog: [
    ["nav", "blog", "cta", "footer"],
    ["nav", "hero", "blog", "footer"],
  ],
  gallery: [
    ["nav", "gallery", "testimonials", "cta", "footer"],
    ["nav", "hero", "gallery", "footer"],
  ],
  faq: [
    ["nav", "hero", "faq", "contact", "footer"],
    ["nav", "faq", "cta", "footer"],
  ],
  team: [
    ["nav", "team", "about", "cta", "footer"],
    ["nav", "hero", "team", "footer"],
  ],
  generic: [
    ["nav", "hero", "features", "cta", "footer"],
    ["nav", "hero", "stats", "testimonials", "footer"],
    ["nav", "features", "gallery", "cta", "footer"],
  ],
};

// --- Page name templates ---
interface PageTemplate {
  name: string;
  slug: string;
}

const INDUSTRY_PAGES: Record<Industry, PageTemplate[]> = {
  agency: [
    { name: "Home", slug: "/" }, { name: "Services", slug: "/services" }, { name: "Portfolio", slug: "/portfolio" },
    { name: "About", slug: "/about" }, { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" },
    { name: "Pricing", slug: "/pricing" }, { name: "Testimonials", slug: "/testimonials" }, { name: "FAQ", slug: "/faq" },
    { name: "Careers", slug: "/careers" },
  ],
  saas: [
    { name: "Home", slug: "/" }, { name: "Features", slug: "/features" }, { name: "Pricing", slug: "/pricing" },
    { name: "About", slug: "/about" }, { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" },
    { name: "FAQ", slug: "/faq" }, { name: "Docs", slug: "/docs" }, { name: "Changelog", slug: "/changelog" },
    { name: "Careers", slug: "/careers" },
  ],
  ecommerce: [
    { name: "Home", slug: "/" }, { name: "Shop", slug: "/shop" }, { name: "About", slug: "/about" },
    { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" }, { name: "FAQ", slug: "/faq" },
    { name: "Reviews", slug: "/reviews" }, { name: "Shipping", slug: "/shipping" }, { name: "Returns", slug: "/returns" },
    { name: "Gallery", slug: "/gallery" },
  ],
  corporate: [
    { name: "Home", slug: "/" }, { name: "Services", slug: "/services" }, { name: "About", slug: "/about" },
    { name: "Case Studies", slug: "/case-studies" }, { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" },
    { name: "Careers", slug: "/careers" }, { name: "Team", slug: "/team" }, { name: "FAQ", slug: "/faq" },
    { name: "Partners", slug: "/partners" },
  ],
  restaurant: [
    { name: "Home", slug: "/" }, { name: "Menu", slug: "/menu" }, { name: "About", slug: "/about" },
    { name: "Reservations", slug: "/reservations" }, { name: "Gallery", slug: "/gallery" }, { name: "Contact", slug: "/contact" },
    { name: "Events", slug: "/events" }, { name: "Reviews", slug: "/reviews" }, { name: "Blog", slug: "/blog" },
    { name: "Catering", slug: "/catering" },
  ],
  healthcare: [
    { name: "Home", slug: "/" }, { name: "Services", slug: "/services" }, { name: "About", slug: "/about" },
    { name: "Doctors", slug: "/team" }, { name: "Appointments", slug: "/contact" }, { name: "Blog", slug: "/blog" },
    { name: "FAQ", slug: "/faq" }, { name: "Testimonials", slug: "/testimonials" }, { name: "Resources", slug: "/resources" },
    { name: "Careers", slug: "/careers" },
  ],
  education: [
    { name: "Home", slug: "/" }, { name: "Courses", slug: "/courses" }, { name: "About", slug: "/about" },
    { name: "Instructors", slug: "/team" }, { name: "Pricing", slug: "/pricing" }, { name: "Blog", slug: "/blog" },
    { name: "Contact", slug: "/contact" }, { name: "FAQ", slug: "/faq" }, { name: "Testimonials", slug: "/testimonials" },
    { name: "Resources", slug: "/resources" },
  ],
  photography: [
    { name: "Home", slug: "/" }, { name: "Portfolio", slug: "/portfolio" }, { name: "About", slug: "/about" },
    { name: "Packages", slug: "/pricing" }, { name: "Booking", slug: "/contact" }, { name: "Blog", slug: "/blog" },
    { name: "Testimonials", slug: "/testimonials" }, { name: "FAQ", slug: "/faq" }, { name: "Gallery", slug: "/gallery" },
    { name: "Events", slug: "/events" },
  ],
  startup: [
    { name: "Home", slug: "/" }, { name: "Product", slug: "/product" }, { name: "Pricing", slug: "/pricing" },
    { name: "About", slug: "/about" }, { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" },
    { name: "FAQ", slug: "/faq" }, { name: "Team", slug: "/team" }, { name: "Investors", slug: "/investors" },
    { name: "Careers", slug: "/careers" },
  ],
  generic: [
    { name: "Home", slug: "/" }, { name: "About", slug: "/about" }, { name: "Services", slug: "/services" },
    { name: "Blog", slug: "/blog" }, { name: "Contact", slug: "/contact" }, { name: "FAQ", slug: "/faq" },
    { name: "Gallery", slug: "/gallery" }, { name: "Pricing", slug: "/pricing" }, { name: "Testimonials", slug: "/testimonials" },
    { name: "Team", slug: "/team" },
  ],
};

function buildWireframe(industry: Industry, pageCount: number, cats: Record<string, string[]>) {
  const templates = INDUSTRY_PAGES[industry];
  const pages: { page_name: string; slug: string; sections: string[] }[] = [];

  for (let i = 0; i < pageCount; i++) {
    const tmpl = i < templates.length
      ? templates[i]
      : { name: `Page ${i + 1}`, slug: `/page-${i + 1}` };

    const pageType = guessPageType(tmpl.slug, tmpl.name);
    const recipes = PAGE_RECIPES[pageType];
    const recipe = recipes[i % recipes.length];

    const sections: string[] = [];
    for (const cat of recipe) {
      const pool = cats[cat] || [];
      const section = pick(pool);
      if (section) sections.push(section);
    }

    // Ensure nav and footer exist
    if (sections.length === 0 || !sections[0]?.toLowerCase().startsWith("nav")) {
      const nav = pick(cats.nav);
      if (nav) sections.unshift(nav);
    }
    const last = sections[sections.length - 1];
    if (!last?.toLowerCase().startsWith("footer")) {
      const footer = pick(cats.footer);
      if (footer) sections.push(footer);
    }

    pages.push({ page_name: tmpl.name, slug: tmpl.slug, sections });
  }

  return pages;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, pageCount, sectionIds } = await req.json();

    if (!prompt || !pageCount || !sectionIds?.length) {
      return new Response(JSON.stringify({ error: "Missing prompt, pageCount, or sectionIds" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const industry = detectIndustry(prompt);
    const cats = categorizeSections(sectionIds);
    const pages = buildWireframe(industry, pageCount, cats);

    return new Response(JSON.stringify({ success: true, pages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-wireframes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
