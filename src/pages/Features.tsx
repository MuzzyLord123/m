import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { 
  Smartphone, Lock, Search, Share2, BarChart3, Zap, 
  Palette, Code, Database, Shield, Globe, Headphones,
  CheckCircle, X, ArrowRight
} from "lucide-react";

const allFeatures = [
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Every site looks perfect on desktop, tablet, and mobile devices.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Lock,
    title: "SSL Certificate",
    description: "Free SSL encryption to keep your site and visitors secure.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Search,
    title: "Basic SEO",
    description: "Meta tags, sitemap, and search engine optimization fundamentals.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Share2,
    title: "Social Integration",
    description: "Connect your social media profiles and enable sharing.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: BarChart3,
    title: "Google Analytics",
    description: "Track visitor behavior and site performance.",
    tiers: ["growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Code,
    title: "CMS Integration",
    description: "Content management system for easy updates.",
    tiers: ["growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Palette,
    title: "Custom Design",
    description: "Unique design tailored to your brand identity.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Lightning-fast loading speeds and Core Web Vitals optimization.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Database,
    title: "E-commerce Ready",
    description: "Online store functionality with payment processing.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Enhanced security protocols and regular security audits.",
    tiers: ["enterprise", "elite"],
  },
  {
    icon: Globe,
    title: "API Connections",
    description: "Integration with third-party services and custom APIs.",
    tiers: ["enterprise", "elite"],
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Dedicated support with faster response times.",
    tiers: ["enterprise", "elite"],
  },
];

const tierDetails = [
  { id: "starter", name: "Starter", price: "Tailored" },
  { id: "growth", name: "Growth", price: "Tailored" },
  { id: "professional", name: "Professional", price: "Tailored" },
  { id: "enterprise", name: "Enterprise", price: "Custom" },
  { id: "elite", name: "Custom Elite", price: "Bespoke" },
];

export default function Features() {
  return (
    <Layout>
      <PageHero
        eyebrow="Feature breakdown"
        index="03"
        crumbs={[{ label: "Home", href: "/" }, { label: "Features" }]}
        title="Everything included"
        highlight="in your site"
        body="A line-by-line breakdown of what ships with each tier — every feature checkable against the comparison below."
        aside={
          <PageHeroFacts
            facts={[
              { value: String(allFeatures.length), label: "Features listed" },
              { value: "5", label: "Tiers compared" },
              { value: "Free", label: "Preview first" },
            ]}
          />
        }
      />

      {/* Features — bordered matrix, tier dots as mono badges */}
      <section className="section-padding">
        <div className="container-tight">
          <Matrix cols={3}>
            {allFeatures.map((feature, index) => (
              <MatrixCell key={feature.title} icon={feature.icon} index={index} title={feature.title}>
                <span className="block">{feature.description}</span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {tierDetails.map((tier) =>
                    feature.tiers.includes(tier.id) ? (
                      <span
                        key={tier.id}
                        className="rounded-full border border-primary/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-primary"
                      >
                        {tier.name}
                      </span>
                    ) : null
                  )}
                </span>
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Comparison — the spec-sheet treatment */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal>
            <div className="mb-6 flex items-baseline justify-between gap-6">
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">Feature comparison</h2>
              <span className="mono-label hidden sm:block">All five tiers</span>
            </div>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-border">
                    <th scope="col" className="mono-label py-4 pr-4 font-medium">Feature</th>
                    {tierDetails.map((tier) => (
                      <th key={tier.id} scope="col" className="px-2 py-4 text-center">
                        <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">{tier.name}</span>
                        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-primary">{tier.price}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feature) => (
                    <tr key={feature.title} className="border-b border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]">
                      <th scope="row" className="py-4 pr-4 text-sm font-normal text-foreground/85">
                        <span className="flex items-center gap-3">
                          <feature.icon className="h-4 w-4 text-primary" strokeWidth={1.6} />
                          {feature.title}
                        </span>
                      </th>
                      {tierDetails.map((tier) => (
                        <td key={tier.id} className="px-2 py-4 text-center">
                          {feature.tiers.includes(tier.id) ? (
                            <CheckCircle className="mx-auto h-4 w-4 text-primary" strokeWidth={2} aria-label="Included" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/40" strokeWidth={2} aria-label="Not included" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="heading-lg">Find the right <span className="text-gradient">tier</span></h2>
              <p className="body-md mt-2 max-w-xl">Not sure which fits? Tell us what the business needs and we&rsquo;ll recommend one — with a free preview before any commitment.</p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">Get started <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" /></Link>
                </Button>
              </Magnetic>
              <Link to="/packages" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground">
                <span className="link-underline">View packages</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
