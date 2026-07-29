import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Eye } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { PreviewStrip, PreviewRail } from "@/components/marketing/PreviewSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Preview funnel 06. The old page invented six preview clients ("Local
 * Plumber, converted in 5 days") with testimonials and a stats band ("500+
 * previews delivered", "94% conversion", "100% satisfaction") — none of it
 * real; removed under PLACEHOLDERS.md P9.
 *
 * The honest replacement is a specimen sheet: exactly what a preview
 * contains at each tier, drawn from the published package scopes, plus the
 * public reference builds as the inspectable evidence.
 */

const specimens = [
  {
    tier: "Starter preview",
    delivery: "Within 1 week · free",
    scope: "1–2 pages",
    contains: [
      "Your actual business name, copy and branding",
      "Working contact form and click-to-call",
      "Google Maps with your location",
      "Mobile layout you can test on your phone",
    ],
    reference: { label: "See a Starter-grade study", href: "/portfolio/local-cafe-landing" },
  },
  {
    tier: "Business preview",
    delivery: "Within 1 week · free",
    scope: "2–5 pages",
    contains: [
      "Home, services and contact pages designed",
      "Bespoke layout — no template underneath",
      "CMS areas marked so you see what you'll edit",
      "Conversion structure: enquiry routes wired",
    ],
    reference: { label: "See a Business-grade study", href: "/portfolio/consulting-firm" },
  },
  {
    tier: "Growth preview",
    delivery: "3–5 days · deposit credited",
    scope: "6–10 pages",
    contains: [
      "Full page architecture with navigation",
      "Lead capture and automation demonstrated",
      "Blog / content hub structure in place",
      "Performance profile you can measure yourself",
    ],
    reference: { label: "See a Growth-grade study", href: "/portfolio/fashion-ecommerce" },
  },
  {
    tier: "Enterprise preview",
    delivery: "Scoped per build · fee credited",
    scope: "Key journeys",
    contains: [
      "The critical user journeys, clickable end to end",
      "Portal or dashboard shells demonstrated",
      "Integration points identified and mapped",
      "Staged delivery plan alongside the preview",
    ],
    reference: { label: "See a platform-grade study", href: "/portfolio/saas-platform" },
  },
];

export default function PreviewPortfolio() {
  return (
    <Layout>
      <PageHero
        eyebrow="The preview funnel"
        index="41"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview portfolio" }]}
        title="What a preview"
        highlight="actually contains"
        body="No invented case studies here — just the exact scope of what lands in your inbox at each tier, and public reference builds you can inspect right now."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Request yours
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Link to="/portfolio" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">The reference builds</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
        aside={
          <PageHeroFacts
            facts={[
              { value: "04", label: "Specimen sheets" },
              { value: "06", label: "Public studies" },
              { value: "£0", label: "Most previews" },
            ]}
          />
        }
      />

      <PreviewStrip current="06" />

      {/* Specimen sheets */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Tier by tier</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The specimen
                <span className="block text-primary">sheets.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Every preview is your real site in miniature — these are the guaranteed contents.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            {specimens.map((specimen, i) => (
              <RevealItem
                key={specimen.tier}
                className="group relative flex flex-col overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {specimen.scope}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{specimen.tier}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                  {specimen.delivery}
                </p>
                <ul className="mt-5 flex-1 border-t border-border/60">
                  {specimen.contains.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.8} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={specimen.reference.href}
                  className="group/link mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
                >
                  <span className="link-underline">{specimen.reference.label}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The next specimen
                <span className="block text-primary">could be your site.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Tell us what the business needs and judge the result with your own eyes — free
                for most tiers.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Request your preview
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <PreviewRail current="06" />
    </Layout>
  );
}
