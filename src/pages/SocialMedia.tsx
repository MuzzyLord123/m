import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import {
  ServiceStrip,
  ServiceRail,
  ServicePlans,
  SeriesHeading,
  type ServicePlan,
} from "@/components/marketing/ServiceSeries";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Service 01 of the series. The old page defined four management plans and
 * then never rendered them — they're now the centre of the page, set as
 * shared-hairline plan columns.
 */

const plans: ServicePlan[] = [
  {
    name: "Starter",
    price: "Tailored",
    features: ["2 platforms", "8 posts monthly", "Basic engagement", "Monthly reporting"],
  },
  {
    name: "Growth",
    price: "Tailored",
    features: ["3 platforms", "16 posts monthly", "Community management", "Ad spend management"],
    popular: true,
  },
  {
    name: "Professional",
    price: "Tailored",
    features: ["5 platforms", "30 posts monthly", "Full ad management", "Influencer outreach"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["All platforms", "Unlimited posts", "Complete management", "Tailored to you"],
  },
];

export default function SocialMedia() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="01"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "Social media" }]}
        title="Social media,"
        highlight="run properly"
        body="Planned, posted and answered every week — presence that compounds instead of a feed that goes quiet."
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
              { value: "04", label: "Management plans" },
              { value: "Weekly", label: "Publishing rhythm" },
              { value: "15%", label: "Off when bundled" },
            ]}
          />
        }
      />

      <ServiceStrip current="01" />

      {/* Plans */}
      <section className="section-padding">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The plans"
            title="Four ways to"
            accent="hand it over."
            standfirst="From a steady two-platform presence to complete management — priced to the work, not a menu."
          />
          <ServicePlans plans={plans} cta="Get a quote" />
        </div>
      </section>

      {/* Bundle offer */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Bundle &amp; save</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Bundle with
                <span className="block text-primary">your website.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Combine any website package with social media management and receive 15% off the
                total monthly fee.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Get custom quote
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <ServiceRail current="01" />
    </Layout>
  );
}
