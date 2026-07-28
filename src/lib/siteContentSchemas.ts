export type HeroBadge = { icon: string; label: string };
export type HeroStat = { value: string; label: string };

export interface HomeHeroContent {
  eyebrow: string;
  titleLine1: string;
  titleLine2Prefix: string;
  rotatingWords: string[];
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  badges: HeroBadge[];
  stats: HeroStat[];
}

export const HOME_HERO_DEFAULTS: HomeHeroContent = {
  eyebrow: "Bespoke Studio · Built in the UK",
  titleLine1: "Digital Operations",
  titleLine2Prefix: "crafted for",
  rotatingWords: ["Modern Businesses", "Ambitious Brands", "Growing Teams", "Digital Leaders"],
  subtitle:
    "A private operations hub where your websites, applications, dashboards and internal systems are designed, built and quietly maintained — delivered through one secure platform.",
  primaryCtaLabel: "Request a Private Preview",
  primaryCtaHref: "/get-started",
  secondaryCtaLabel: "Tour the Platform",
  secondaryCtaHref: "/features",
  badges: [
    { icon: "Shield", label: "Enterprise-grade security" },
    { icon: "Heart", label: "UK-based team" },
    { icon: "Zap", label: "Built for scale" },
    { icon: "Check", label: "Full ownership" },
  ],
  stats: [
    { value: "UK", label: "Based" },
    { value: "25+", label: "Tools" },
    { value: "100%", label: "Ownership" },
    { value: "Free", label: "Preview" },
  ],
};

// ─── Process Section ───────────────────────────────────────────
export type ProcessStepData = {
  step: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  details: string[];
};

export interface HomeProcessContent {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  steps: ProcessStepData[];
}

export const HOME_PROCESS_DEFAULTS: HomeProcessContent = {
  eyebrow: "How It Works",
  title: "Our",
  titleHighlight: "Process",
  subtitle: "We've refined our approach to deliver exceptional results, every single time.",
  steps: [
    {
      step: "01",
      title: "Discovery & Strategy",
      description:
        "We start by understanding your business, your customers, and your goals. No cookie-cutter solutions — every project begins with a strategic conversation.",
      icon: "Target",
      details: [
        "In-depth consultation call",
        "Brand & competitor analysis",
        "Goals & requirements mapping",
        "Custom proposal & timeline",
      ],
    },
    {
      step: "02",
      title: "Design & Development",
      description:
        "Our team crafts bespoke designs and systems that capture your brand essence. We build websites, apps, and dashboards with clean, performant code.",
      icon: "Sparkles",
      details: [
        "Custom UI/UX design",
        "Responsive development",
        "Quality assurance testing",
        "Client review & feedback",
      ],
    },
    {
      step: "03",
      title: "Launch & Optimise",
      description:
        "We ensure everything works perfectly, optimise for search engines, and handle integrations. Your systems go live with confidence.",
      icon: "Rocket",
      details: [
        "Performance optimisation",
        "SEO & accessibility audit",
        "Domain & hosting setup",
        "Go-live deployment",
      ],
    },
    {
      step: "04",
      title: "Your Dashboard",
      description:
        "Access your private digital operations dashboard to manage websites, track app projects, upload assets, communicate with our team, and monitor everything in one secure place.",
      icon: "Database",
      details: [
        "Secure client portal access",
        "Asset & content management",
        "Direct team messaging",
        "Ongoing support & updates",
      ],
    },
  ],
};

// ─── Why Quooro Section ────────────────────────────────────────
export type DifferentiatorData = { icon: string; title: string; description: string };

export interface HomeWhyContent {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  differentiators: DifferentiatorData[];
}

export const HOME_WHY_DEFAULTS: HomeWhyContent = {
  eyebrow: "Why Choose Us",
  title: "Why",
  titleHighlight: "Quooro",
  subtitle:
    "We're not just another agency. We build long-term digital infrastructure that grows with your business.",
  differentiators: [
    {
      icon: "Infinity",
      title: "Ongoing Partnership",
      description:
        "We don't disappear after launch. Continuous management, updates, and strategic support.",
    },
    {
      icon: "Shield",
      title: "Enterprise Security",
      // "SOC-2 aligned practices" was here. SOC 2 is an audited attestation the
      // studio does not hold, and "aligned" reads as a certification to anyone
      // skimming. Replaced with what is true and checkable.
      description:
        "AES-256 encryption at rest, 2FA, and role-based access on every account.",
    },
    {
      icon: "Code2",
      title: "Full Ownership",
      description: "You own everything we build. No vendor lock-in, no hostage situations.",
    },
    {
      icon: "Headphones",
      title: "UK-Based Support",
      description: "Real people, real conversations. Direct access to your development team.",
    },
  ],
};

// ─── Generic Section Header (used for the rest of the homepage) ─
export interface SectionHeaderContent {
  eyebrow: string;
  titlePrefix: string;
  titleHighlight: string;
  subtitle: string;
}

export interface HomepageHeaderMeta extends SectionHeaderContent {
  label: string;
}

export const HOMEPAGE_HEADERS: Record<string, HomepageHeaderMeta> = {
  home_what_we_do: {
    label: "What We Do",
    eyebrow: "The Practice",
    titlePrefix: "What We",
    titleHighlight: "Do",
    subtitle: "Five disciplines. One quiet, end-to-end operation.",
  },
  home_global_reach: {
    label: "Global Reach",
    eyebrow: "Reach",
    // Was "Serving Clients Worldwide" / "From local businesses to global
    // enterprises…", which asserts a client roster the studio does not have.
    // The section now describes what the work can cover, not who has bought it.
    titlePrefix: "One studio.",
    titleHighlight: "Any postcode.",
    subtitle:
      "Built in Wales and run remotely, so the size of the job matters more than where it is. A high street shopfront and a multi-site operation get the same system underneath.",
  },
  home_dashboard: {
    label: "Dashboard",
    eyebrow: "The Platform",
    titlePrefix: "Your Business.",
    titleHighlight: "One Dashboard.",
    subtitle:
      "Every Quooro client receives access to a private digital operations dashboard. This is where your business runs — not just your website.",
  },
  home_free_previews: {
    label: "Free Previews",
    eyebrow: "Risk-Free Start",
    titlePrefix: "See It Before You",
    titleHighlight: "Commit",
    subtitle:
      "We offer free website previews so you can experience the quality, structure, and direction before moving forward.",
  },
  home_apps: {
    label: "Apps & Dashboards",
    eyebrow: "Beyond Websites",
    titlePrefix: "Custom Apps Built for",
    titleHighlight: "How You Work",
    subtitle:
      "We design and build custom web applications, dashboards, databases, and internal systems for businesses of all sizes — from simple tools to enterprise-level platforms.",
  },
  home_services: {
    label: "Services Grid",
    eyebrow: "Full-Service",
    titlePrefix: "Complete Digital",
    titleHighlight: "Solutions",
    subtitle:
      "From website development to full-scale digital marketing, we handle everything your business needs to thrive online.",
  },
  home_built_for: {
    label: "Built for Businesses",
    eyebrow: "",
    titlePrefix: "Built for Businesses That",
    titleHighlight: "Want More",
    subtitle:
      "Quooro is built for businesses that want structure, visibility, and long-term digital infrastructure — not one-off projects.",
  },
  home_cta: {
    label: "Bottom CTA",
    eyebrow: "Free preview — no commitment",
    titlePrefix: "Ready to Get",
    titleHighlight: "Started?",
    subtitle:
      "Get a professional digital system that works as hard as you do. Structure, visibility, and long-term infrastructure — built for growth.",
  },
};
