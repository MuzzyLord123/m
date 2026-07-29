import { Link } from "react-router-dom";
import { Shield, Eye, MessageSquare, Star, Users, Globe, ArrowRight } from "lucide-react";
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

/**
 * Service 05 — account management. The old stats band claimed "100% response
 * rate", "<2hrs response time" and "500+ brands protected" — numbers with no
 * record behind them, removed under the no-invented-credibility rule (see
 * PLACEHOLDERS.md P8). 24/7 monitoring survives as a commitment in the plan
 * copy, where it belongs.
 */

const services = [
  {
    icon: Eye,
    title: "Digital Presence Oversight",
    description: "Complete monitoring and management of your online presence across all platforms and channels.",
    features: ["24/7 brand monitoring", "Competitor tracking", "Industry trend analysis", "Crisis detection"],
  },
  {
    icon: Shield,
    title: "Reputation Management",
    description: "Protect and enhance your brand reputation with proactive monitoring and response strategies.",
    features: ["Review monitoring", "Negative content mitigation", "Positive PR amplification", "Brand sentiment tracking"],
  },
  {
    icon: MessageSquare,
    title: "Review Responses",
    description: "Professional, timely responses to customer reviews across all major platforms.",
    features: ["Google reviews", "Trustpilot management", "Social media reviews", "Industry-specific platforms"],
  },
  {
    icon: Star,
    title: "Brand Monitoring",
    description: "Real-time tracking of brand mentions, sentiment, and online conversations about your business.",
    features: ["Social listening", "News monitoring", "Forum tracking", "Influencer mentions"],
  },
  {
    icon: Users,
    title: "Community Management",
    description: "Build and nurture engaged online communities around your brand.",
    features: ["Community guidelines", "Member engagement", "Conflict resolution", "Growth strategies"],
  },
  {
    icon: Globe,
    title: "Multi-Platform Management",
    description: "Unified management of your presence across all digital touchpoints.",
    features: ["Website monitoring", "Social profiles", "Directory listings", "Third-party mentions"],
  },
];

const plans: ServicePlan[] = [
  {
    name: "Essential",
    price: "Custom Quote",
    features: [
      "Basic monitoring",
      "Weekly reports",
      "Review responses (up to 20)",
      "1 platform management",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "Custom Quote",
    popular: true,
    features: [
      "Full monitoring suite",
      "Bi-weekly reports",
      "Unlimited review responses",
      "3 platform management",
      "Reputation repair",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom Quote",
    features: [
      "24/7 monitoring",
      "Real-time dashboards",
      "Crisis management",
      "All platforms",
      "Dedicated manager",
      "Custom integrations",
    ],
  },
];

export default function AccountManagement() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="05"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "Account management" }]}
        title="One team on"
        highlight="the whole estate"
        body="Your digital presence looked after end to end — sites, listings, campaigns and reputation in one pair of hands."
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
              { value: "03", label: "Plans" },
              { value: "24/7", label: "Enterprise monitoring" },
            ]}
          />
        }
      />

      <ServiceStrip current="05" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The disciplines"
            title="Watching everything"
            accent="that carries your name."
            standfirst="Monitoring, responding and repairing across every platform your brand appears on."
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
            title="Management"
            accent="packages."
            standfirst="From basic monitoring to a dedicated manager with real-time dashboards."
          />
          <ServicePlans plans={plans} cta="Get a quote" />
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Your reputation,
                <span className="block text-primary">managed.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Hand the whole estate to one team and get your evenings back.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Get started
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <ServiceRail current="05" />
    </Layout>
  );
}
