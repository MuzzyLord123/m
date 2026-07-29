import { Link } from "react-router-dom";
import { FileText, BarChart, Rss, Settings, Users, ArrowRight, Palette } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell, LadderRow } from "@/components/marketing/Matrix";
import { TierScale, TierRail, SpecLedger } from "@/components/marketing/TierSeries";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Tier 02 — the Business site. Same specification-document architecture as
 * the rest of the series; this chapter's distinctive section is the page
 * structure ladder (what 2–5 pages actually means).
 */

const features = [
  { icon: FileText, title: "2-5 Pages", description: "Home, About, Services, Contact & more" },
  { icon: Palette, title: "Bespoke Layout", description: "Custom design — no templates" },
  { icon: Settings, title: "CMS Access", description: "Easy content updates without developer help" },
  { icon: BarChart, title: "Conversion-Focused", description: "Built to turn visitors into customers" },
  { icon: Rss, title: "On-Page SEO", description: "Optimised for search engines" },
  { icon: Users, title: "Mobile & Desktop", description: "Perfect on every device" },
];

const included = [
  "2-5 custom-designed pages",
  "Bespoke layout (no templates)",
  "Conversion-focused structure",
  "On-page SEO optimisation",
  "CMS access for easy edits",
  "Mobile & desktop optimised",
  "Contact form with email integration",
  "Social media integration",
  "Google Analytics setup",
  "SSL certificate",
  "Complete code ownership",
  "UK-based support",
];

const pageStructure = [
  { name: "Home", desc: "Hero section, services overview, testimonials, CTA" },
  { name: "About", desc: "Your story, team, values, why customers choose you" },
  { name: "Services", desc: "What you offer with clear descriptions" },
  { name: "Gallery/Portfolio", desc: "Show off your work (optional)" },
  { name: "Contact", desc: "Form, map, contact details, social links" },
];

export default function Growth() {
  return (
    <Layout>
      <PageHero
        eyebrow="Website tiers"
        index="02"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: "Business" }]}
        title="The Business"
        highlight="site"
        body="For businesses ready to look established — more pages, more structure, and a CMS you can run yourself."
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
              { value: "2–5", label: "Pages" },
              { value: "1–2 wks", label: "Delivery" },
              { value: "100%", label: "Code ownership" },
            ]}
          />
        }
      />

      <TierScale current="02" />

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
                <span className="block text-primary">credibility.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Everything you need to look professional and win more business.
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

      {/* Page structure — this chapter's signature section */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">The blueprint</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                What 2–5 pages
                <span className="block text-primary">actually means.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                A typical Business site structure — shaped to how your customers actually buy, not
                a fixed template.
              </p>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {pageStructure.map((page, i) => (
                <LadderRow key={page.name} index={i} title={page.name}>
                  {page.desc}
                </LadderRow>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Spec ledger */}
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
              <span className="mono-label hidden sm:block">12 line items</span>
            </div>
          </Reveal>
          <SpecLedger items={included} />

          <Reveal className="mt-10 max-w-xl border border-primary/30 p-6">
            <span className="mono-label text-primary">Need more?</span>
            <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
              If you need 6–10 pages, a blog, or lead capture automation, the Growth site has you
              covered.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-5">
              <Link to="/professional">View Growth site</Link>
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
                Ready to look
                <span className="block text-primary">professional?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Get a website that makes you look as good as your work. Bespoke design, no
                templates, no fuss.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Request a quote
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

      <TierRail current="02" />
    </Layout>
  );
}
