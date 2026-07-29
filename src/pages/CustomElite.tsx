import { Link } from "react-router-dom";
import { Crown, Infinity as InfinityIcon, Users, Rocket, Brain, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { TierScale, TierRail } from "@/components/marketing/TierSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Tier 05 — Custom Elite, the top of the ladder. Same specification-document
 * architecture as the series, with one difference: the accent from here on
 * is brass, not ember. One material change to mark the flagship — not a
 * different design language.
 */

const capabilities = [
  { icon: InfinityIcon, title: "Unlimited Scope", description: "No restrictions on site size or complexity" },
  { icon: Brain, title: "Custom Applications", description: "Web apps, SaaS platforms, portals" },
  { icon: Users, title: "Dedicated Team", description: "Your own development team throughout" },
  { icon: Rocket, title: "Bespoke Functionality", description: "Features built specifically for you" },
  { icon: Shield, title: "Enterprise Security", description: "Maximum security protocols" },
  { icon: Sparkles, title: "Ongoing Support", description: "Long-term development partnership" },
];

const process = [
  { title: "Discovery Call", desc: "Understand your requirements and vision" },
  { title: "Technical Proposal", desc: "Architecture, timeline, and pricing" },
  { title: "Team Assembly", desc: "Dedicated team assigned to your project" },
  { title: "Agile Development", desc: "Iterative building with regular reviews" },
  { title: "Launch & Support", desc: "Deployment and ongoing partnership" },
];

const benefits = [
  "Dedicated project manager",
  "Direct access to development team",
  "Priority support",
  "Flexible timeline and scope",
  "Complete IP ownership",
  "Source code and documentation",
  "Training and knowledge transfer",
  "Ongoing maintenance options",
];

export default function CustomElite() {
  return (
    <Layout>
      <PageHero
        eyebrow="Website tiers"
        index="05"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages", href: "/packages" }, { label: "Custom Elite" }]}
        title="Custom"
        highlight="Elite"
        body="Fully bespoke systems for one-of-a-kind requirements — designed and engineered from a blank page."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="gold" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Start the conversation
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
              { value: "∞", label: "Scope" },
              { value: "Yours", label: "Dedicated team" },
              { value: "100%", label: "IP ownership" },
            ]}
          />
        }
      />

      <TierScale current="05" />

      {/* Flagship strip */}
      <div className="border-b border-border/60">
        <div className="container-tight flex items-center justify-between py-4">
          <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-gold">
            <Crown className="h-3.5 w-3.5" strokeWidth={1.5} />
            The flagship tier
          </span>
          <span className="mono-label hidden sm:block">Accent from here: brass</span>
        </div>
      </div>

      {/* Capabilities — brass matrix */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-gold" />
              <span className="eyebrow">No limitations</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Unlimited
                <span className="block text-gold">capabilities.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                We build exactly what your organisation needs, with no limitations.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item, i) => (
              <RevealItem
                key={item.title}
                className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="mb-7 flex items-center justify-between">
                  <item.icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">{item.title}</h3>
                <div className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {item.description}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Process + elite benefits */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold" />
                  <span className="eyebrow">Five stages</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  How it works.
                </h2>
                <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                  Every Custom Elite project starts with a conversation to understand your vision
                  and requirements.
                </p>
              </Reveal>
              <RevealGroup>
                {process.map((item, i) => (
                  <RevealItem
                    key={item.title}
                    className="grid grid-cols-[auto_1fr] gap-5 border-t border-border/60 py-6 last:border-b"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-[hsl(30_85%_30%)] dark:text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
                        {item.title}
                      </span>
                      <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
                        {item.desc}
                      </span>
                    </span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <div className="lg:col-span-6">
              <Reveal className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold" />
                  <span className="eyebrow">The retainer</span>
                </div>
                <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                  Elite benefits.
                </h2>
              </Reveal>
              <RevealGroup stagger={0.03}>
                {benefits.map((item, i) => (
                  <RevealItem
                    key={item}
                    className="flex items-baseline gap-4 border-b border-border/60 py-3.5"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-[hsl(30_85%_30%)] dark:text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-light leading-relaxed text-foreground/85">{item}</span>
                  </RevealItem>
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
              <div className="mb-5 flex items-center gap-3">
                <Crown className="h-4 w-4 text-gold" strokeWidth={1.5} />
                <span className="eyebrow">Tier 05</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Let&rsquo;s build something
                <span className="block text-gold">extraordinary.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Get in touch to discuss your vision and receive a custom proposal tailored to your
                organisation&rsquo;s needs.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="gold" size="xl" asChild className="group">
                <Link to="/get-started">
                  Contact us to discuss
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <TierRail current="05" />
    </Layout>
  );
}
