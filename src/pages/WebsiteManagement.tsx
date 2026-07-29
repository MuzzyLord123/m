import { Link } from "react-router-dom";
import { Shield, CheckCircle, AlertTriangle, Server, CreditCard, Zap, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import {
  ServiceStrip,
  ServiceRail,
  ServicePlans,
  SeriesHeading,
  type ServicePlan,
} from "@/components/marketing/ServiceSeries";
import { SpecLedger } from "@/components/marketing/TierSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Service 06 — website management. The most contract-like page on the site:
 * what management includes, what hosting actually costs (Netlify, at cost,
 * no markup), and what happens if you host it yourself. Set as a
 * specification document — the honesty is the selling point, so the design
 * job is to make the terms easy to read.
 */

const managementIncludes = [
  "Ongoing website maintenance & monitoring",
  "Bug fixes and error resolution",
  "Performance checks and optimisation",
  "Security updates and dependency updates",
  "Content edits (text changes, layout tweaks, CTA updates)",
  "Image and photo uploads",
  "Menu updates (for static or eCommerce sites)",
  "Ensuring the website runs smoothly at all times",
];

const plans: ServicePlan[] = [
  {
    name: "Starter Management",
    price: "Tailored — per month",
    features: [
      "Small websites & static sites",
      "Minor edits and updates",
      "Bug fixes",
      "Performance monitoring",
    ],
  },
  {
    name: "Business Management",
    price: "Tailored — per month",
    popular: true,
    features: [
      "Growing businesses & service sites",
      "Regular content changes",
      "Image uploads & layout edits",
      "Priority bug fixes",
      "Ongoing maintenance",
    ],
  },
  {
    name: "eCommerce Management",
    price: "Tailored — per month",
    features: [
      "Product uploads & changes",
      "Menu updates",
      "Pricing changes",
      "Image uploads",
      "Performance & stability monitoring",
      "Recommended for businesses with frequent updates",
    ],
  },
];

const hostingCosts = [
  { type: "Small / Static Sites", cost: "Based on usage" },
  { type: "Business Sites", cost: "Based on usage" },
  { type: "Larger / High-Traffic Sites", cost: "Based on usage" },
];

const summary = [
  "You can host yourself or with us",
  "Hosting is charged at cost (no markup)",
  "Individual edits available at competitive rates",
  "Management plans are the most cost-effective option long-term",
  "Custom Elite plans include full technical oversight",
];

export default function WebsiteManagement() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="06"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "Website management" }]}
        title="Sites kept"
        highlight="running"
        body="Updates, monitoring, backups and fixes handled quietly — the part of ownership nobody wants to do alone."
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
              { value: "08", label: "Things handled" },
              { value: "03", label: "Monthly plans" },
              { value: "£0", label: "Hosting markup" },
            ]}
          />
        }
      />

      <ServiceStrip current="06" />

      {/* Why + what's included */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Why it matters</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Websites aren&rsquo;t
                <span className="block text-primary">set and forget.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                Updates, fixes, and changes are inevitable. Ongoing management prevents small
                issues from becoming costly problems — and lets you focus on running your business
                while we handle the technical side.
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              <SpecLedger items={managementIncludes} />
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The plans"
            title="Management"
            accent="pricing."
            standfirst="Priced to the size of the site and how often it changes."
          />
          <ServicePlans plans={plans} cta="Get a quote" />

          {/* Custom Elite management — brass, matching the flagship tier */}
          <Reveal className="mt-8 border border-gold/30 p-7 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
                <Shield className="h-4 w-4" strokeWidth={1.5} />
                Custom Elite website management
              </span>
              <span className="mono-label">Custom pricing</span>
            </div>
            <p className="mt-4 max-w-2xl text-sm font-light leading-relaxed text-muted-foreground">
              Available under Custom Elite in Web Services. Includes everything above, plus:
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {["Advanced troubleshooting", "Ongoing optimisation", "Priority support", "Full technical oversight"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm font-light text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-gold" strokeWidth={2} />
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs font-light italic text-muted-foreground">
              Ideal for complex or high-traffic websites. Price based on website size and
              complexity.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Hosting at cost */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="mb-5 flex items-center gap-3">
                <Server className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="eyebrow">Hosting with us</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Charged at cost.
                <span className="block text-primary">No markup, ever.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                We host websites using Netlify, a reliable and scalable hosting platform — and we
                only charge exactly what Netlify charges us.{" "}
                <strong className="font-medium text-foreground">We do not profit from hosting.</strong>
              </p>
            </Reveal>
            <Reveal className="lg:col-span-7">
              <div className="border-t border-border/60">
                {hostingCosts.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-baseline justify-between gap-6 border-b border-border/60 py-4"
                  >
                    <span className="text-sm font-light text-foreground/85">{item.type}</span>
                    <span className="mono-label">{item.cost}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs font-light text-muted-foreground">
                Hosting costs depend on traffic, bandwidth, and site complexity.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Self-hosting terms + one-off pricing */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="Hosting it yourself"
            title="You're free to"
            accent="take it anywhere."
            standfirst="Full ownership means exactly that. Here's what changes when the site leaves our hosting."
          />

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            <RevealItem className="border-b border-r border-border/60 p-7 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-gold" strokeWidth={1.5} />
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">01</span>
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                Once the site leaves our hosting
              </h3>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-2.5 text-sm font-light text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  We do not provide ongoing edits or updates
                </li>
                <li className="flex items-start gap-2.5 text-sm font-light text-muted-foreground">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                  The website is considered complete and delivered
                </li>
              </ul>
            </RevealItem>

            <RevealItem className="border-b border-r border-border/60 p-7 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <CreditCard className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">02</span>
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                One-off edit pricing
              </h3>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                No management plan
              </p>
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                Includes one dedicated edit session where multiple changes can be made. Contact us
                for a personalized quote based on your specific needs. Pricing reflects the time
                required for manual code edits and deployment.
              </p>
            </RevealItem>

            <RevealItem className="border-b border-r border-border/60 p-7 sm:p-8 md:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <Zap className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">03</span>
              </div>
              <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                Fixes without a management plan
              </h3>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Small code fix</p>
                  <p className="mt-1 text-sm font-light text-muted-foreground">
                    Quote on request — e.g. broken contact form, layout issue, minor bug.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[hsl(0_72%_38%)] dark:text-[hsl(0_90%_70%)]">Emergency / priority fix</p>
                  <p className="mt-1 text-sm font-light text-muted-foreground">
                    Quote on request. Applies if the site is down or requires urgent attention —
                    charged at a premium due to priority scheduling.
                  </p>
                </div>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Recommendation */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="Our recommendation"
            title="If we host it,"
            accent="let us manage it."
            standfirst="A management plan is the most cost-effective way to keep a site healthy long-term."
          />

          <Reveal className="grid gap-0 border-l border-t border-border/60 md:grid-cols-2">
            <div className="border-b border-r border-border/60 p-7 sm:p-8">
              <p className="mono-label mb-5 text-[hsl(0_72%_38%)] dark:text-[hsl(0_90%_70%)]">Without management</p>
              <ul className="space-y-3">
                {[
                  "Edits become costly over time",
                  "Emergency fixes are significantly more expensive",
                  "Small issues can impact performance and conversions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-light text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-b border-r border-border/60 p-7 sm:p-8">
              <p className="mono-label mb-5 text-primary">With management</p>
              <ul className="space-y-3">
                {["Predictable monthly cost", "Faster updates", "Ongoing peace of mind"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-light text-muted-foreground">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Summary strip */}
          <RevealGroup className="mt-10 border-t border-border/60">
            {summary.map((item, i) => (
              <RevealItem
                key={item}
                className="flex items-baseline gap-4 border-b border-border/60 py-3.5"
              >
                <span className="font-mono text-[11px] tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-light leading-relaxed text-foreground/85">{item}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <ServiceRail current="06" />
    </Layout>
  );
}
