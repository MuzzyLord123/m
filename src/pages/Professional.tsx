import { Link } from "react-router-dom";
import { FileText, TrendingUp, Rss, Settings, Zap, Search, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { TierScale, TierRail, SpecLedger } from "@/components/marketing/TierSeries";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Tier 03 — the Growth site. This chapter's signature is the fifteen-line
 * specification: the longest ledger in the series, set full-width.
 */

const features = [
  { icon: FileText, title: "6-10 Pages", description: "Comprehensive site with room to grow" },
  { icon: Settings, title: "Advanced UX", description: "Thoughtful page structure and user flows" },
  { icon: Zap, title: "Lead Capture", description: "Automation setup to capture and nurture leads" },
  { icon: Rss, title: "Blog / Content Hub", description: "Establish authority with regular content" },
  { icon: Search, title: "Advanced SEO", description: "Deep optimisation for search rankings" },
  { icon: TrendingUp, title: "Performance", description: "Speed optimised for better conversions" },
];

const included = [
  "6-10 custom-designed pages",
  "Advanced UX & page structure",
  "Lead capture & automation setup",
  "Blog or content hub",
  "Performance optimisation",
  "Advanced on-page SEO",
  "CMS with full training",
  "Contact forms with automation",
  "Social media integration",
  "Google Analytics & tracking",
  "SSL certificate",
  "Complete code ownership",
  "UK-based support",
  "Mobile-responsive design",
  "60-day post-launch support",
];

export default function Professional() {
  return (
    <Layout>
      <PageHero
        eyebrow="Website tiers"
        index="03"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: "Growth" }]}
        title="The Growth"
        highlight="site"
        body="Custom design and deeper integrations for businesses whose website has to carry real weight."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Get started
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Link to="/packages" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">View packages</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
        aside={
          <PageHeroFacts
            facts={[
              { value: "6–10", label: "Pages" },
              { value: "2–4 wks", label: "Delivery" },
              { value: "60 days", label: "Post-launch support" },
            ]}
          />
        }
      />

      <TierScale current="03" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">What it carries</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Built for
                <span className="block text-primary">growth.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Everything you need to scale your online presence and capture more leads.
              </p>
            </div>
          </Reveal>

          <Matrix cols={3}>
            {features.map((feature, i) => (
              <MatrixCell key={feature.title} icon={feature.icon} index={i} title={feature.title}>
                {feature.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* The fifteen-line specification */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The specification</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Everything included.
              </h2>
              <span className="mono-label hidden sm:block">15 line items — the longest in the series</span>
            </div>
          </Reveal>
          <SpecLedger items={included} />

          <Reveal className="mt-10 max-w-xl border border-primary/30 p-6">
            <span className="mono-label text-primary">Beyond ten pages?</span>
            <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
              Custom platforms, web apps and integrations live in the Enterprise tier — scoped
              properly and delivered in stages.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-5">
              <Link to="/enterprise">View Enterprise</Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Ready to
                <span className="block text-primary">scale?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                A website built to capture leads and carry real traffic — with the structure to
                keep growing.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Book a strategy call
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/portfolio" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                View examples
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <TierRail current="03" />
    </Layout>
  );
}
