import { Link } from "react-router-dom";
import { Database, Lock, Users, Globe, Code, Headphones, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell, LadderRow } from "@/components/marketing/Matrix";
import { TierScale, TierRail } from "@/components/marketing/TierSeries";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Tier 04 — Enterprise. This chapter's signature is the staged-delivery
 * process ladder: complex builds sold as a sequence, not a promise.
 */

const capabilities = [
  { icon: Database, title: "Custom Databases", description: "Tailored database architecture for your needs" },
  { icon: Code, title: "Web Apps", description: "Custom web applications and platforms" },
  { icon: Users, title: "CRM Integration", description: "Connect to your existing business systems" },
  { icon: Lock, title: "Booking Systems", description: "Online booking and scheduling" },
  { icon: Globe, title: "Multi-Location", description: "Support for multiple locations or regions" },
  { icon: Headphones, title: "Dedicated Support", description: "Long-term development and support" },
];

const projectTypes = [
  "Complex or large-scale websites",
  "Web apps & custom functionality",
  "CRM, booking, or API integrations",
  "Multi-location or high-traffic platforms",
  "E-commerce with custom requirements",
  "Long-term development & support",
];

const stages = [
  { title: "Discovery", desc: "We discuss your requirements and goals" },
  { title: "Proposal", desc: "You receive a tailored quote and timeline" },
  { title: "Build", desc: "We develop your custom solution" },
  { title: "Launch", desc: "Your platform goes live with full support" },
];

export default function Enterprise() {
  return (
    <Layout>
      <PageHero
        eyebrow="Website tiers"
        index="04"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: "Enterprise" }]}
        title="Enterprise"
        highlight="builds"
        body="Complex platforms, integrations and multi-site estates — scoped properly and delivered in stages."
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
              { value: "∞", label: "Pages & sections" },
              { value: "4–12 wks", label: "Typical delivery" },
              { value: "100%", label: "IP ownership" },
            ]}
          />
        }
      />

      <TierScale current="04" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">What we can build</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Platforms, not
                <span className="block text-primary">just pages.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                From custom web applications to enterprise platforms — built to your specific
                needs.
              </p>
            </div>
          </Reveal>

          <Matrix cols={3}>
            {capabilities.map((item, i) => (
              <MatrixCell key={item.title} icon={item.icon} index={i} title={item.title}>
                {item.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Project types + staged delivery */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary" />
                  <span className="eyebrow">The territory</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  Typical projects.
                </h2>
              </Reveal>
              <RevealGroup>
                {projectTypes.map((item, i) => (
                  <LadderRow key={item} index={i} title={item} />
                ))}
              </RevealGroup>
            </div>

            <div className="lg:col-span-6">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary" />
                  <span className="eyebrow">Delivered in stages</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  How it works.
                </h2>
              </Reveal>
              <RevealGroup>
                {stages.map((item, i) => (
                  <LadderRow key={item.title} index={i} title={item.title}>
                    {item.desc}
                  </LadderRow>
                ))}
              </RevealGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Let&rsquo;s discuss
                <span className="block text-primary">your project.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Every enterprise project is unique. Get in touch to discuss your requirements and
                receive a tailored proposal.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Contact us
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <TierRail current="04" />
    </Layout>
  );
}
