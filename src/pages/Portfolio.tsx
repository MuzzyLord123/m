import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";

const projects = [
  // These were captioned with invented outcomes — "+150% online orders",
  // "+£50K monthly sales", "500K patients served". The studio confirmed these
  // are design studies, not client work, so the numbers describe results that
  // never happened. Replaced with what each build actually demonstrates, which
  // is true and still useful to a buyer. See PLACEHOLDERS.md P1.
  { tier: "Starter", title: "Local Cafe Landing", result: "Menu, hours and directions above the fold", slug: "local-cafe-landing" },
  { tier: "Growth", title: "Consulting Firm", result: "Service pages built around one enquiry route", slug: "consulting-firm" },
  { tier: "Professional", title: "Fashion E-commerce", result: "Catalogue, variants and checkout flow", slug: "fashion-ecommerce" },
  { tier: "Enterprise", title: "SaaS Platform", result: "Marketing site plus authenticated app shell", slug: "saas-platform" },
  { tier: "Custom Elite", title: "Healthcare Portal", result: "Role-based access and records UI", slug: "healthcare-portal" },
  { tier: "Starter", title: "Freelancer Portfolio", result: "Single-page case study layout", slug: "freelancer-portfolio" },
];

/**
 * Rebuilt as an index of rows — the homepage practice-list pattern — rather
 * than a grid of letter-initial thumbnail cards. A ledger of builds with tier,
 * title and what each demonstrates reads as a studio's own record; six cards
 * with a giant gradient initial in each read as filler. Honesty framing
 * unchanged: these are design studies, labelled as such.
 */
export default function Portfolio() {
  return (
    <Layout>
      <PageHero
        eyebrow="Design studies"
        index="05"
        crumbs={[{ label: "Home", href: "/" }, { label: "Reference builds" }]}
        title="Reference"
        highlight="builds"
        body="Our own concepts, built to show how each tier is put together — labelled honestly as studies, not client work."
      />

      <section className="section-padding">
        <div className="container-tight">
          <RevealGroup className="border-t border-border/60">
            {projects.map((project, i) => (
              <RevealItem key={project.slug}>
                <Link
                  to={`/portfolio/${project.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 border-b border-border/60 py-7 transition-colors duration-300 hover:bg-foreground/[0.02] sm:grid-cols-[3.5rem_8rem_1fr_2.5rem] sm:gap-x-8 sm:py-9"
                >
                  <span className="font-mono text-[11px] tabular-nums tracking-[0.2em] text-primary sm:text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mono-label hidden sm:block">{project.tier}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-1 sm:text-2xl">
                      {project.title}
                    </span>
                    <span className="mt-1 block text-sm font-light text-muted-foreground">
                      <span className="sm:hidden">{project.tier} · </span>
                      {project.result}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 text-primary opacity-0 transition-all duration-500 group-hover:opacity-100"
                    strokeWidth={1.5}
                  />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="mt-14 flex flex-col items-start gap-6 border-t border-border/60 pt-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Want one of these built for you?
              </h2>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                Tell us what the business needs and we&rsquo;ll show you a free preview first.
              </p>
            </div>
            <Magnetic className="inline-block shrink-0">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Start your project
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
