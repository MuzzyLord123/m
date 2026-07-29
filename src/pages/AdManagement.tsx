import { Link } from "react-router-dom";
import { Target, TrendingUp, BarChart3, MousePointer, RefreshCw, LineChart, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import {
  ServiceStrip,
  ServiceRail,
  ServicePlans,
  CapabilityCell,
  SeriesHeading,
  type ServicePlan,
} from "@/components/marketing/ServiceSeries";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/** Service 02 — paid media, set as a capability matrix and plan columns. */

const services = [
  {
    icon: Target,
    title: "PPC Campaigns",
    description: "Strategic pay-per-click advertising across Google, Bing, and social platforms with precise audience targeting.",
    features: ["Keyword research & optimization", "Ad copy A/B testing", "Landing page optimization", "Quality score improvement"],
  },
  {
    icon: TrendingUp,
    title: "Social Media Advertising",
    description: "Engaging ad campaigns across Facebook, Instagram, LinkedIn, TikTok, and Twitter to reach your ideal customers.",
    features: ["Audience segmentation", "Creative ad design", "Retargeting campaigns", "Lookalike audiences"],
  },
  {
    icon: BarChart3,
    title: "Google Ads Management",
    description: "Full-service Google Ads management including Search, Display, Shopping, and YouTube campaigns.",
    features: ["Campaign structure optimization", "Bid strategy management", "Conversion tracking", "Performance reporting"],
  },
  {
    icon: RefreshCw,
    title: "Retargeting Strategies",
    description: "Re-engage visitors who've shown interest with strategic remarketing across multiple platforms.",
    features: ["Pixel implementation", "Custom audience creation", "Dynamic product ads", "Cross-platform retargeting"],
  },
  {
    icon: MousePointer,
    title: "Conversion Optimization",
    description: "Maximize your ad spend ROI with data-driven optimization and conversion rate improvements.",
    features: ["Funnel analysis", "CTA optimization", "Form optimization", "Heat map analysis"],
  },
  {
    icon: LineChart,
    title: "Analytics & Reporting",
    description: "Comprehensive reporting with actionable insights to continuously improve campaign performance.",
    features: ["Custom dashboards", "ROI tracking", "Attribution modeling", "Monthly strategy reviews"],
  },
];

const plans: ServicePlan[] = [
  {
    name: "Starter Ads",
    price: "Tailored",
    note: "For smaller budgets",
    features: ["1 platform management", "Basic campaign setup", "Weekly optimization", "Monthly reporting"],
  },
  {
    name: "Growth Ads",
    price: "Tailored",
    note: "For growing businesses",
    features: ["3 platform management", "Advanced targeting", "Bi-weekly optimization", "Bi-weekly reporting"],
    popular: true,
  },
  {
    name: "Professional Ads",
    price: "Tailored",
    note: "For scaling businesses",
    features: ["All platforms", "Full funnel strategy", "Weekly optimization", "Weekly reporting + calls"],
  },
  {
    name: "Enterprise Ads",
    price: "Custom",
    note: "Unlimited ad spend",
    features: ["Dedicated team", "Custom integrations", "Daily optimization", "Real-time dashboards"],
  },
];

export default function AdManagement() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="02"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "Ad management" }]}
        title="Ads that earn"
        highlight="their budget"
        body="PPC and paid social with the spend, targeting and results reported to you like an owner, not a spectator."
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
              { value: "06", label: "Disciplines" },
              { value: "04", label: "Management plans" },
              { value: "Yours", label: "Ad accounts" },
            ]}
          />
        }
      />

      <ServiceStrip current="02" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The disciplines"
            title="Comprehensive"
            accent="ad services."
            standfirst="From campaign setup to optimization, we handle every aspect of your digital advertising."
          />
          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <CapabilityCell key={service.title} index={i} {...service} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The plans"
            title="Ad management"
            accent="packages."
            standfirst="Choose the package that fits your advertising budget and goals."
          />
          <ServicePlans plans={plans} cta="Get started" />
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Ready to scale
                <span className="block text-primary">your advertising?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Let&rsquo;s create high-converting ad campaigns that drive real results for your
                business.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Start your campaign
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <ServiceRail current="02" />
    </Layout>
  );
}
