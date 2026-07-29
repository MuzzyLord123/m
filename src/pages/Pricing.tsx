import { Link } from "react-router-dom";
import { Check, Minus, ArrowRight, Shield, Zap, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { LadderRow } from "@/components/marketing/Matrix";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";

/**
 * Rebuilt as a rate card, not a card carousel. The old page floated four 3D
 * tilting glass cards over a parallax stock render — the exact grammar of every
 * AI-generated pricing page. A studio's rate card is a table: tiers across the
 * top, what's included down the side, one hairline per row. All pricing here
 * is genuinely "tailored", so the table sells the *scope* differences and the
 * tier pages carry the detail.
 */

const packages = [
  {
    name: "Starter",
    timeline: "Days, not weeks",
    description: "Pubs, tradesmen & local services",
    href: "/starter",
    cta: "Get started",
    popular: false,
  },
  {
    name: "Business",
    timeline: "1–2 weeks",
    description: "Growing local businesses",
    href: "/growth",
    cta: "Request a quote",
    popular: true,
  },
  {
    name: "Growth",
    timeline: "2–3 weeks",
    description: "Businesses ready to scale",
    href: "/professional",
    cta: "Book a call",
    popular: false,
  },
  {
    name: "Enterprise",
    timeline: "Tailored to you",
    description: "Complex or large-scale builds",
    href: "/get-started",
    cta: "Contact us",
    popular: false,
  },
];

// true = included, false = not part of the tier, string = the specific scope.
const featureRows: { label: string; values: (boolean | string)[] }[] = [
  { label: "Pages", values: ["1–2", "2–5", "6–10", "Unlimited"] },
  { label: "Mobile-first design", values: [true, true, true, true] },
  { label: "Contact form", values: [true, true, true, true] },
  { label: "SEO setup", values: ["Basic", "Basic", "Advanced", "Advanced"] },
  { label: "CMS for easy edits", values: [false, true, true, true] },
  { label: "Bespoke layout", values: [false, true, true, true] },
  { label: "Lead capture & automation", values: [false, false, true, true] },
  { label: "Blog / content hub", values: [false, false, true, true] },
  { label: "Web apps & custom functionality", values: [false, false, false, true] },
  { label: "CRM, booking & API integrations", values: [false, false, false, true] },
  { label: "Multi-location support", values: [false, false, false, true] },
  { label: "Full code ownership", values: [true, true, true, true] },
];

const trustSignals = [
  { icon: Shield, text: "No hidden fees" },
  { icon: Heart, text: "UK-based support" },
  { icon: Zap, text: "Built to convert, not just look good" },
];

const enterpriseScope = [
  "Complex or large-scale websites",
  "Web apps & custom functionality",
  "CRM, booking, or API integrations",
  "Multi-location or high-traffic platforms",
  "Long-term development & support",
];

const faqs = [
  {
    q: "Do I own the code and design?",
    a: "Yes, 100%. You receive complete ownership of all code, design files, and assets. No vendor lock-in.",
  },
  {
    q: "What's included in the price?",
    a: "All packages include mobile-responsive design, contact forms, basic SEO, SSL certificate setup, and hosting migration assistance.",
  },
  {
    q: "How fast can you deliver?",
    a: "Starter sites can be ready in days. Business sites typically take 1-2 weeks. We focus on quality and speed.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No hidden fees, ever. The price you see is the price you pay. Hosting and domain are separate ongoing costs.",
  },
  {
    q: "Do you offer ongoing support?",
    a: "Yes, we offer maintenance packages for all tiers. We're UK-based and here when you need us.",
  },
];

function TableValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-primary" strokeWidth={2.2} aria-label="Included" />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-3.5 w-3.5 text-muted-foreground/30" aria-label="Not included" />;
  }
  return <span className="text-xs text-foreground/85">{value}</span>;
}

export default function Pricing() {
  return (
    <Layout>
      <PageHero
        eyebrow="The rate card"
        index="03"
        crumbs={[{ label: "Home", href: "/" }, { label: "Pricing" }]}
        title="Clear pricing,"
        highlight="no nonsense."
        body="Professional websites for businesses — serving clients locally, nationwide, and worldwide. Every tier is priced to the job, and every build starts with a free preview."
        aside={
          <PageHeroFacts
            facts={[
              { value: "04", label: "Website tiers" },
              { value: "£0", label: "Design preview" },
              { value: "100%", label: "Code ownership" },
            ]}
          />
        }
      />

      {/* The rate card */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                What each tier carries
              </h2>
              <span className="mono-label hidden sm:block">All tiers — tailored pricing</span>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-border align-bottom">
                    <th scope="col" className="w-[28%] py-5 pr-4">
                      <span className="mono-label">Included</span>
                    </th>
                    {packages.map((pkg) => (
                      <th key={pkg.name} scope="col" className="w-[18%] px-2 py-5 text-center">
                        {pkg.popular && (
                          <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
                            Most popular
                          </span>
                        )}
                        <span className="block font-display text-base font-semibold tracking-tight sm:text-lg">
                          {pkg.name}
                        </span>
                        <span className="mt-1 block text-[11px] font-light text-muted-foreground">
                          {pkg.description}
                        </span>
                        <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {pkg.timeline}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]"
                    >
                      <th scope="row" className="py-3.5 pr-4 text-sm font-normal text-foreground/85">
                        {row.label}
                      </th>
                      {row.values.map((value, i) => (
                        <td key={packages[i].name} className="px-2 py-3.5 text-center">
                          <TableValue value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-5 pr-4" />
                    {packages.map((pkg) => (
                      <td key={pkg.name} className="px-2 py-5 text-center">
                        <Button
                          variant={pkg.popular ? "premium" : "outline"}
                          size="sm"
                          asChild
                          className="w-full max-w-[10rem]"
                        >
                          <Link to={pkg.href}>{pkg.cta}</Link>
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>

          <RevealGroup className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-6">
            {trustSignals.map((signal) => (
              <div key={signal.text} className="flex items-center gap-2.5">
                <signal.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-light text-muted-foreground">{signal.text}</span>
              </div>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Enterprise & custom */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Beyond the tiers</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Need something
                <span className="block text-primary">more complex?</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                For web apps, custom functionality, CRM integrations, booking systems, or
                multi-location platforms — we tailor everything to your business.
              </p>
              <Magnetic className="mt-9 inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Contact us
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
            </Reveal>
            <RevealGroup className="lg:col-span-7">
              {enterpriseScope.map((item, i) => (
                <LadderRow key={item} index={i} title={item} />
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Straight answers</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Asked before
                <span className="block text-primary">you ask.</span>
              </h2>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {faqs.map((item, i) => (
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
                Ready to get
                <span className="block text-primary">started?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                A professional website that works as hard as you do. No jargon, no fuss — just
                results.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Get started
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/portfolio" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                View our work
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
