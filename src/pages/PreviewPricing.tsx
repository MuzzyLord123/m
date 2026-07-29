import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { LadderRow } from "@/components/marketing/Matrix";
import { ServicePlans, type ServicePlan } from "@/components/marketing/ServiceSeries";
import { PreviewStrip, PreviewRail } from "@/components/marketing/PreviewSeries";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Preview funnel 02 — the three preview routes as shared-hairline plan
 * columns, tier names aligned with the website-tier series (free covers
 * Starter & Business; Growth and Enterprise carry a credited fee).
 */

const previewTiers: ServicePlan[] = [
  {
    name: "Free Preview",
    price: "Free — up to 5 pages",
    note: "For Starter & Business sites · 1 week",
    popular: true,
    features: [
      "Fully functional preview site",
      "Mobile responsive design",
      "Custom coded — no templates",
      "Professional design concepts",
      "1 week delivery",
      "No obligation to purchase",
      "Full transparency throughout",
    ],
  },
  {
    name: "Growth Preview",
    price: "Deposit — credited on purchase",
    note: "For Growth site projects · 3–5 days",
    features: [
      "Priority development queue",
      "Senior developer assigned",
      "Accelerated 3-5 day delivery",
      "Advanced functionality demo",
      "Lead capture preview",
      "Fee credited on purchase",
      "Dedicated project manager",
    ],
  },
  {
    name: "Enterprise Preview",
    price: "Custom — credited on purchase",
    note: "For enterprise & custom builds",
    features: [
      "Bespoke preview scope",
      "Full dedicated team",
      "Custom timeline agreed",
      "Complex functionality demo",
      "Advanced integrations",
      "Fee credited on purchase",
      "White-glove service",
    ],
  },
];

const faqItems = [
  {
    q: "Is the preview fee separate from the final site cost?",
    a: "For paid previews (Growth and Enterprise), the preview fee is credited toward your final purchase. If you buy the site, you effectively got the preview free."
  },
  {
    q: "Why charge for larger site previews?",
    a: "Complex sites require significant professional development time. The upfront fee ensures fair compensation while demonstrating serious commitment from both parties."
  },
  {
    q: "What if I don't like the preview?",
    a: "For free previews, there's no obligation — you simply walk away. For paid previews, we offer revision rounds to address concerns."
  },
  {
    q: "Can I get a refund on the preview fee?",
    a: "Preview fees are non-refundable as they compensate our team for custom development work. However, the fee is credited if you proceed with the full site purchase."
  }
];

export default function PreviewPricing() {
  return (
    <Layout>
      <PageHero
        eyebrow="The preview funnel"
        index="43"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview packages" }]}
        title="Preview"
        highlight="packages"
        body="What the free preview includes, and what optional extras cost if you want to see more first."
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
              { value: "£0", label: "Up to 5 pages" },
              { value: "100%", label: "Fee credited on buy" },
              { value: "3–7", label: "Days to deliver" },
            ]}
          />
        }
      />

      <PreviewStrip current="02" />

      {/* The three routes */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Three routes</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Pick how much you
                <span className="block text-primary">want proven first.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Free for most sites. Paid previews exist only where the build itself is a serious
                piece of work — and the fee comes off your invoice.
              </p>
            </div>
          </Reveal>
          <ServicePlans plans={previewTiers} cta="Start a preview" />
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">The fine print</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Read before
                <span className="block text-primary">you ask.</span>
              </h2>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {faqItems.map((item, i) => (
                <LadderRow key={item.q} index={i} title={item.q}>
                  {item.a}
                </LadderRow>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Start with the
                <span className="block text-primary">free one.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Most projects qualify. If yours is bigger, we&rsquo;ll say so before anything
                costs anything.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Request a preview
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <PreviewRail current="02" />
    </Layout>
  );
}
