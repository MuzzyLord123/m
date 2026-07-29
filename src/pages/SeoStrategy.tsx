import { Link } from "react-router-dom";
import { Search, TrendingUp, FileText, Link2, MapPin, BarChart, ArrowRight } from "lucide-react";
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
 * Service 04 — SEO. The old page led with a stats band ("250% average
 * traffic increase", "95% client retention") that nothing on record supports
 * — removed under the no-invented-credibility rule; see PLACEHOLDERS.md P8.
 * What remains is the checkable part: what the work is and what each plan
 * carries.
 */

const services = [
  {
    icon: Search,
    title: "Keyword Research",
    description: "In-depth analysis to identify high-value keywords your audience is searching for.",
    features: ["Search volume analysis", "Competition assessment", "Long-tail opportunities", "Keyword mapping"],
  },
  {
    icon: BarChart,
    title: "Competitor Analysis",
    description: "Understand your competition's strategies and find gaps to exploit.",
    features: ["Backlink analysis", "Content gap analysis", "Ranking comparison", "Strategy insights"],
  },
  {
    icon: FileText,
    title: "Content Strategy",
    description: "Data-driven content planning that attracts and converts your target audience.",
    features: ["Content calendar", "Topic clusters", "Content optimization", "Performance tracking"],
  },
  {
    icon: Link2,
    title: "Link Building",
    description: "Quality backlink acquisition to boost your domain authority and rankings.",
    features: ["Outreach campaigns", "Guest posting", "Digital PR", "Link audit & cleanup"],
  },
  {
    icon: MapPin,
    title: "Local SEO",
    description: "Dominate local search results and attract customers in your area.",
    features: ["Google Business Profile", "Local citations", "Review management", "Local content"],
  },
  {
    icon: TrendingUp,
    title: "Technical SEO",
    description: "Optimize your site's foundation for better crawling and indexing.",
    features: ["Site speed optimization", "Mobile optimization", "Schema markup", "Core Web Vitals"],
  },
];

const plans: ServicePlan[] = [
  {
    name: "SEO Starter",
    price: "Custom Quote",
    features: [
      "5 target keywords",
      "Monthly reporting",
      "On-page optimization",
      "Basic link building",
      "Google Business setup",
    ],
  },
  {
    name: "SEO Growth",
    price: "Custom Quote",
    popular: true,
    features: [
      "15 target keywords",
      "Bi-weekly reporting",
      "Full on-page optimization",
      "Content creation (2 posts)",
      "Active link building",
      "Competitor monitoring",
    ],
  },
  {
    name: "SEO Pro",
    price: "Custom Quote",
    features: [
      "30+ target keywords",
      "Weekly reporting",
      "Complete technical SEO",
      "Content creation (4 posts)",
      "Premium link building",
      "Dedicated SEO manager",
    ],
  },
];

export default function SeoStrategy() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="04"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "SEO & strategy" }]}
        title="Search built on"
        highlight="structure"
        body="Keyword research, competitor analysis and the technical groundwork that makes rankings hold."
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
              { value: "5–30+", label: "Keywords by plan" },
              { value: "Monthly", label: "Reporting, minimum" },
            ]}
          />
        }
      />

      <ServiceStrip current="04" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The disciplines"
            title="The groundwork"
            accent="that ranks."
            standfirst="Six disciplines working together — from keyword maps to Core Web Vitals."
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
            title="SEO"
            accent="packages."
            standfirst="Scaled by how many keywords you're competing for and how fast you need movement."
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
                Ready to be
                <span className="block text-primary">found?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Rankings built on structure hold through algorithm updates. Let&rsquo;s build
                yours properly.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Start ranking
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <ServiceRail current="04" />
    </Layout>
  );
}
