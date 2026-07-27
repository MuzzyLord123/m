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

// --- Section pools per industry ---
const SECTION_POOLS: Record<Industry, string[][]> = {
  agency: [
    ["Header", "Hero Section", "Feature Section", "Stats Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "About Section", "Team Section", "Gallery Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Feature Collection Section", "Pricing Section", "FAQ Section", "Footer"],
    ["Header", "Hero Section", "Gallery Section", "How It Works Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "Locations Section", "FAQ Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Testimonial Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Feature List Section", "Pricing Section", "CTA Section", "Footer"],
  ],
  saas: [
    ["Header", "Hero Section", "Feature Section", "How It Works Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Feature List Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "FAQ Section", "CTA Section", "Footer"],
    ["Header", "About Section", "Team Section", "Stats Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "FAQ Section", "Footer"],
    ["Header", "Hero Section", "Testimonial Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "How It Works Section", "Feature List Section", "CTA Section", "Footer"],
  ],
  ecommerce: [
    ["Header", "Hero Section", "Feature Collection Section", "Stats Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Feature List Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Gallery Section", "Testimonial Section", "Footer"],
    ["Header", "About Section", "Team Section", "CTA Section", "Footer"],
    ["Header", "FAQ Section", "Contact Form Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "Feature List Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "How It Works Section", "Stats Section", "Footer"],
  ],
  corporate: [
    ["Header", "Hero Section", "Feature Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "About Section", "Team Section", "Gallery Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "How It Works Section", "Testimonial Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "Locations Section", "FAQ Section", "Footer"],
    ["Header", "Hero Section", "Stats Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "Feature List Section", "CTA Section", "Footer"],
    ["Header", "Gallery Section", "Team Section", "CTA Section", "Footer"],
  ],
  restaurant: [
    ["Header", "Hero Section", "Feature Section", "Gallery Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Pricing Section", "Footer"],
    ["Header", "Gallery Section", "About Section", "Footer"],
    ["Header", "About Section", "Team Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "Locations Section", "FAQ Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Testimonial Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "How It Works Section", "CTA Section", "Footer"],
  ],
  healthcare: [
    ["Header", "Hero Section", "Feature Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "How It Works Section", "CTA Section", "Footer"],
    ["Header", "Team Section", "About Section", "Testimonial Section", "Footer"],
    ["Header", "Contact Form Section", "Locations Section", "FAQ Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "FAQ Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Testimonial Section", "Stats Section", "Footer"],
    ["Header", "Gallery Section", "Feature List Section", "CTA Section", "Footer"],
  ],
  education: [
    ["Header", "Hero Section", "Feature Section", "How It Works Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Pricing Section", "FAQ Section", "Footer"],
    ["Header", "Team Section", "About Section", "Testimonial Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "FAQ Section", "Footer"],
    ["Header", "Gallery Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Testimonial Section", "Feature List Section", "Footer"],
    ["Header", "How It Works Section", "Pricing Section", "CTA Section", "Footer"],
  ],
  photography: [
    ["Header", "Hero Section", "Gallery Section", "About Section", "CTA Section", "Footer"],
    ["Header", "Gallery Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "FAQ Section", "CTA Section", "Footer"],
    ["Header", "About Section", "Team Section", "Gallery Section", "Footer"],
    ["Header", "Contact Form Section", "Locations Section", "Footer"],
    ["Header", "Blog Section", "Gallery Section", "CTA Section", "Footer"],
    ["Header", "Hero Section", "Stats Section", "Testimonial Section", "Footer"],
    ["Header", "Feature Section", "How It Works Section", "CTA Section", "Footer"],
  ],
  startup: [
    ["Header", "Hero Section", "Feature Section", "How It Works Section", "Stats Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Feature List Section", "CTA Section", "Footer"],
    ["Header", "Pricing Section", "FAQ Section", "Testimonial Section", "Footer"],
    ["Header", "About Section", "Team Section", "Stats Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "FAQ Section", "Footer"],
    ["Header", "Hero Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "How It Works Section", "Gallery Section", "CTA Section", "Footer"],
  ],
  generic: [
    ["Header", "Hero Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "About Section", "Team Section", "CTA Section", "Footer"],
    ["Header", "Feature Collection Section", "Pricing Section", "Footer"],
    ["Header", "Blog Section", "Feature Section", "CTA Section", "Footer"],
    ["Header", "Contact Form Section", "FAQ Section", "Footer"],
    ["Header", "Gallery Section", "Testimonial Section", "CTA Section", "Footer"],
    ["Header", "Stats Section", "How It Works Section", "CTA Section", "Footer"],
    ["Header", "Feature List Section", "Pricing Section", "Footer"],
  ],
};

// --- Page name templates per industry ---
interface PageTemplate {
  name: string;
  slug: string;
  parentSlug: string | null;
  depth: number;
}

const PAGE_TEMPLATES: Record<Industry, PageTemplate[]> = {
  agency: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Services", slug: "/services", parentSlug: "/", depth: 1 },
    { name: "Web Design", slug: "/services/web-design", parentSlug: "/services", depth: 2 },
    { name: "Branding", slug: "/services/branding", parentSlug: "/services", depth: 2 },
    { name: "SEO", slug: "/services/seo", parentSlug: "/services", depth: 2 },
    { name: "Social Media", slug: "/services/social-media", parentSlug: "/services", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Our Team", slug: "/about/team", parentSlug: "/about", depth: 2 },
    { name: "Portfolio", slug: "/portfolio", parentSlug: "/", depth: 1 },
    { name: "Case Studies", slug: "/portfolio/case-studies", parentSlug: "/portfolio", depth: 2 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "Pricing", slug: "/pricing", parentSlug: "/", depth: 1 },
    { name: "Testimonials", slug: "/testimonials", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
  ],
  saas: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Features", slug: "/features", parentSlug: "/", depth: 1 },
    { name: "Integrations", slug: "/features/integrations", parentSlug: "/features", depth: 2 },
    { name: "API", slug: "/features/api", parentSlug: "/features", depth: 2 },
    { name: "Security", slug: "/features/security", parentSlug: "/features", depth: 2 },
    { name: "Pricing", slug: "/pricing", parentSlug: "/", depth: 1 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Docs", slug: "/docs", parentSlug: "/", depth: 1 },
    { name: "Getting Started", slug: "/docs/getting-started", parentSlug: "/docs", depth: 2 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Changelog", slug: "/changelog", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
    { name: "Partners", slug: "/partners", parentSlug: "/", depth: 1 },
  ],
  ecommerce: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Shop", slug: "/shop", parentSlug: "/", depth: 1 },
    { name: "New Arrivals", slug: "/shop/new-arrivals", parentSlug: "/shop", depth: 2 },
    { name: "Best Sellers", slug: "/shop/best-sellers", parentSlug: "/shop", depth: 2 },
    { name: "Sale", slug: "/shop/sale", parentSlug: "/shop", depth: 2 },
    { name: "Categories", slug: "/categories", parentSlug: "/", depth: 1 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Shipping", slug: "/shipping", parentSlug: "/", depth: 1 },
    { name: "Returns", slug: "/returns", parentSlug: "/", depth: 1 },
    { name: "Reviews", slug: "/reviews", parentSlug: "/", depth: 1 },
    { name: "Gift Cards", slug: "/gift-cards", parentSlug: "/", depth: 1 },
    { name: "Lookbook", slug: "/lookbook", parentSlug: "/", depth: 1 },
  ],
  corporate: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Services", slug: "/services", parentSlug: "/", depth: 1 },
    { name: "Consulting", slug: "/services/consulting", parentSlug: "/services", depth: 2 },
    { name: "Strategy", slug: "/services/strategy", parentSlug: "/services", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Leadership", slug: "/about/leadership", parentSlug: "/about", depth: 2 },
    { name: "History", slug: "/about/history", parentSlug: "/about", depth: 2 },
    { name: "Case Studies", slug: "/case-studies", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "Investors", slug: "/investors", parentSlug: "/", depth: 1 },
    { name: "Partners", slug: "/partners", parentSlug: "/", depth: 1 },
    { name: "Sustainability", slug: "/sustainability", parentSlug: "/", depth: 1 },
    { name: "Press", slug: "/press", parentSlug: "/", depth: 1 },
  ],
  restaurant: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Menu", slug: "/menu", parentSlug: "/", depth: 1 },
    { name: "Lunch Menu", slug: "/menu/lunch", parentSlug: "/menu", depth: 2 },
    { name: "Dinner Menu", slug: "/menu/dinner", parentSlug: "/menu", depth: 2 },
    { name: "Drinks", slug: "/menu/drinks", parentSlug: "/menu", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Our Chef", slug: "/about/chef", parentSlug: "/about", depth: 2 },
    { name: "Reservations", slug: "/reservations", parentSlug: "/", depth: 1 },
    { name: "Gallery", slug: "/gallery", parentSlug: "/", depth: 1 },
    { name: "Events", slug: "/events", parentSlug: "/", depth: 1 },
    { name: "Catering", slug: "/catering", parentSlug: "/", depth: 1 },
    { name: "Reviews", slug: "/reviews", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Gift Cards", slug: "/gift-cards", parentSlug: "/", depth: 1 },
  ],
  healthcare: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Services", slug: "/services", parentSlug: "/", depth: 1 },
    { name: "Primary Care", slug: "/services/primary-care", parentSlug: "/services", depth: 2 },
    { name: "Specialist Care", slug: "/services/specialist", parentSlug: "/services", depth: 2 },
    { name: "Wellness", slug: "/services/wellness", parentSlug: "/services", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Our Doctors", slug: "/about/doctors", parentSlug: "/about", depth: 2 },
    { name: "Appointments", slug: "/appointments", parentSlug: "/", depth: 1 },
    { name: "Patient Resources", slug: "/resources", parentSlug: "/", depth: 1 },
    { name: "Insurance", slug: "/resources/insurance", parentSlug: "/resources", depth: 2 },
    { name: "Testimonials", slug: "/testimonials", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
  ],
  education: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Courses", slug: "/courses", parentSlug: "/", depth: 1 },
    { name: "Web Development", slug: "/courses/web-development", parentSlug: "/courses", depth: 2 },
    { name: "Data Science", slug: "/courses/data-science", parentSlug: "/courses", depth: 2 },
    { name: "Design", slug: "/courses/design", parentSlug: "/courses", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Instructors", slug: "/about/instructors", parentSlug: "/about", depth: 2 },
    { name: "Pricing", slug: "/pricing", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Resources", slug: "/resources", parentSlug: "/", depth: 1 },
    { name: "Testimonials", slug: "/testimonials", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
    { name: "Community", slug: "/community", parentSlug: "/", depth: 1 },
  ],
  photography: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Portfolio", slug: "/portfolio", parentSlug: "/", depth: 1 },
    { name: "Weddings", slug: "/portfolio/weddings", parentSlug: "/portfolio", depth: 2 },
    { name: "Portraits", slug: "/portfolio/portraits", parentSlug: "/portfolio", depth: 2 },
    { name: "Commercial", slug: "/portfolio/commercial", parentSlug: "/portfolio", depth: 2 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Packages", slug: "/packages", parentSlug: "/", depth: 1 },
    { name: "Booking", slug: "/booking", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Testimonials", slug: "/testimonials", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Behind the Scenes", slug: "/behind-the-scenes", parentSlug: "/", depth: 1 },
    { name: "Prints", slug: "/prints", parentSlug: "/", depth: 1 },
    { name: "Events", slug: "/events", parentSlug: "/", depth: 1 },
  ],
  startup: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "Product", slug: "/product", parentSlug: "/", depth: 1 },
    { name: "Features", slug: "/product/features", parentSlug: "/product", depth: 2 },
    { name: "How It Works", slug: "/product/how-it-works", parentSlug: "/product", depth: 2 },
    { name: "Integrations", slug: "/product/integrations", parentSlug: "/product", depth: 2 },
    { name: "Pricing", slug: "/pricing", parentSlug: "/", depth: 1 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Team", slug: "/about/team", parentSlug: "/about", depth: 2 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Investors", slug: "/investors", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
    { name: "Press", slug: "/press", parentSlug: "/", depth: 1 },
    { name: "Changelog", slug: "/changelog", parentSlug: "/", depth: 1 },
  ],
  generic: [
    { name: "Home", slug: "/", parentSlug: null, depth: 0 },
    { name: "About", slug: "/about", parentSlug: "/", depth: 1 },
    { name: "Our Team", slug: "/about/team", parentSlug: "/about", depth: 2 },
    { name: "Services", slug: "/services", parentSlug: "/", depth: 1 },
    { name: "Service One", slug: "/services/service-one", parentSlug: "/services", depth: 2 },
    { name: "Service Two", slug: "/services/service-two", parentSlug: "/services", depth: 2 },
    { name: "Portfolio", slug: "/portfolio", parentSlug: "/", depth: 1 },
    { name: "Blog", slug: "/blog", parentSlug: "/", depth: 1 },
    { name: "Pricing", slug: "/pricing", parentSlug: "/", depth: 1 },
    { name: "Testimonials", slug: "/testimonials", parentSlug: "/", depth: 1 },
    { name: "FAQ", slug: "/faq", parentSlug: "/", depth: 1 },
    { name: "Contact", slug: "/contact", parentSlug: "/", depth: 1 },
    { name: "Gallery", slug: "/gallery", parentSlug: "/", depth: 1 },
    { name: "Careers", slug: "/careers", parentSlug: "/", depth: 1 },
    { name: "Resources", slug: "/resources", parentSlug: "/", depth: 1 },
  ],
};

function buildSitemap(industry: Industry, pageCount: number) {
  const templates = PAGE_TEMPLATES[industry];
  const sectionPool = SECTION_POOLS[industry];

  // Always include Home first, then pick pages respecting hierarchy
  const selected: PageTemplate[] = [templates[0]]; // Home
  const remaining = templates.slice(1);

  // Prioritize depth-1 pages first, then fill with depth-2
  const depth1 = remaining.filter(p => p.depth === 1);
  const depth2 = remaining.filter(p => p.depth === 2);

  // Add depth-1 pages
  for (const p of depth1) {
    if (selected.length >= pageCount) break;
    selected.push(p);
  }

  // Add depth-2 pages (only if parent is already selected)
  for (const p of depth2) {
    if (selected.length >= pageCount) break;
    if (selected.some(s => s.slug === p.parentSlug)) {
      selected.push(p);
    }
  }

  // If we still need more pages, generate extras
  let extraIdx = 1;
  while (selected.length < pageCount) {
    selected.push({
      name: `Page ${selected.length + 1}`,
      slug: `/page-${extraIdx}`,
      parentSlug: "/",
      depth: 1,
    });
    extraIdx++;
  }

  // Trim to exact count
  const finalPages = selected.slice(0, pageCount);

  // Assign sections from pool
  return finalPages.map((page, i) => ({
    page_name: page.name,
    slug: page.slug,
    parent_slug: page.parentSlug,
    sections: sectionPool[i % sectionPool.length],
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, pageCount } = await req.json();

    if (!prompt || !pageCount) {
      return new Response(JSON.stringify({ error: "Missing prompt or pageCount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const industry = detectIndustry(prompt);
    const pages = buildSitemap(industry, pageCount);

    return new Response(JSON.stringify({ success: true, pages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-sitemap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
