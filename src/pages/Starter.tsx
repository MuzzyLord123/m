import { Link } from "react-router-dom";
import { Smartphone, Mail, Search, ArrowRight, Zap, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell, LadderRow } from "@/components/marketing/Matrix";
import { TierScale, TierRail, SpecLedger } from "@/components/marketing/TierSeries";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Tier 01 of the series. The page is a specification document: scale diagram,
 * capability matrix, numbered spec ledger, process ladder, then the series
 * rail on to Business. No floating cards anywhere.
 */

const features = [
  { icon: Smartphone, title: "Mobile-First Design", description: "Perfect display on all devices and screen sizes" },
  { icon: Zap, title: "Fast-Loading Build", description: "Lightning-fast loading speeds that keep visitors engaged" },
  { icon: Phone, title: "Clear Call-to-Actions", description: "Calls, bookings, and enquiries made easy" },
  { icon: Mail, title: "Contact Form", description: "Professional contact form with email notifications" },
  { icon: MapPin, title: "Google Maps", description: "Help customers find you with integrated maps" },
  { icon: Search, title: "Basic SEO Setup", description: "On-page optimisation to help you get found" },
];

const included = [
  "1-2 professionally designed pages",
  "Mobile-first, fast-loading build",
  "Clear call-to-actions (calls, bookings, enquiries)",
  "Contact form with email integration",
  "Google Maps integration",
  "Basic SEO setup",
  "Social media link integration",
  "SSL certificate setup",
  "Complete source code ownership",
  "Launch-ready in days, not weeks",
];

const perfectFor = [
  "Pubs & restaurants",
  "Tradesmen & contractors",
  "Local services",
  "Small retail shops",
  "Personal portfolios",
  "Event announcements",
];

const process = [
  { title: "Chat", desc: "Tell us about your business and what you need" },
  { title: "Design", desc: "We create your custom site design" },
  { title: "Review", desc: "You provide feedback and we refine" },
  { title: "Launch", desc: "Your site goes live in days" },
];

export default function Starter() {
  return (
    <Layout>
      <PageHero
        eyebrow="Website tiers"
        index="01"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: "Starter" }]}
        title="The Starter"
        highlight="site"
        body="A fast, focused site that gets a local business found and contacted — live in days, not months."
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
              { value: "1–2", label: "Pages" },
              { value: "3–5 days", label: "Delivery" },
              { value: "100%", label: "Code ownership" },
            ]}
          />
        }
      />

      {/* Where this tier sits */}
      <TierScale current="01" />

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
                Everything you need
                <span className="block text-primary">to get found.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                A professional web presence that works as hard as you do.
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

      {/* The spec ledger + who it's for */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary" />
                  <span className="eyebrow">The specification</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  Complete package.
                </h2>
              </Reveal>
              <SpecLedger items={included} />
            </div>

            <div className="lg:col-span-5">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary" />
                  <span className="eyebrow">Built for</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  Perfect for.
                </h2>
              </Reveal>
              <RevealGroup>
                {perfectFor.map((item, i) => (
                  <LadderRow key={item} index={i} title={item} />
                ))}
              </RevealGroup>

              <Reveal className="mt-10 border border-primary/30 p-6">
                <span className="mono-label text-primary">Need more pages?</span>
                <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                  Growing business? The Business site includes up to 5 pages with CMS access for
                  easy updates.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-5">
                  <Link to="/growth">View Business site</Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Four steps</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Simple
                <span className="block text-primary">process.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                From first chat to live site in days — you see the design before you pay a penny.
              </p>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {process.map((item, i) => (
                <LadderRow key={item.title} index={i} title={item.title}>
                  {item.desc}
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
                <span className="block text-primary">online?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                A professional website that works as hard as you do. No hidden fees, UK-based
                support.
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
                View examples
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Series navigation */}
      <TierRail current="01" />
    </Layout>
  );
}
