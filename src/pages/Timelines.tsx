import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * The schedules page, drawn as schedules. Each tier is a chapter with a
 * phase rail — a hairline with ember waypoints, horizontal on desktop and a
 * ladder on phones — instead of the old rounded cards with off-palette
 * green/blue/purple gradient rockets. Durations align with the tier series
 * (3–5 days / 1–2 weeks / 2–4 weeks / scoped), and the tier links are now
 * explicit — the old string-derived routes pointed at pages that don't
 * exist (e.g. "/business").
 */

const timelines = [
  {
    no: "01",
    tier: "Starter Site",
    route: "/starter",
    duration: "3–5 days",
    pages: "1–2 pages",
    phases: [
      { name: "Chat", duration: "Day 1", description: "Tell us about your business and requirements" },
      { name: "Design & Build", duration: "Day 2-4", description: "Custom design and responsive build" },
      { name: "Review & Launch", duration: "Day 5-7", description: "Your feedback, refinements, and go-live" },
    ],
  },
  {
    no: "02",
    tier: "Business Site",
    route: "/growth",
    duration: "1–2 weeks",
    pages: "2–5 pages",
    phases: [
      { name: "Discovery", duration: "Day 1-2", description: "In-depth consultation and content planning" },
      { name: "Design Phase", duration: "Day 3-6", description: "Custom design mockups and approval" },
      { name: "Development", duration: "Day 7-10", description: "Full build with CMS integration" },
      { name: "Launch", duration: "Day 11-14", description: "Testing, training, and go-live" },
    ],
  },
  {
    no: "03",
    tier: "Growth Site",
    route: "/professional",
    duration: "2–4 weeks",
    pages: "6–10 pages",
    phases: [
      { name: "Strategy", duration: "Week 1", description: "Requirements, content strategy, UX planning" },
      { name: "Design", duration: "Week 2", description: "Custom design system, all page mockups" },
      { name: "Development", duration: "Week 2-3", description: "Advanced features, blog, lead capture" },
      { name: "Launch", duration: "Week 3-4", description: "Performance optimisation, testing, training" },
    ],
  },
  {
    no: "04",
    tier: "Enterprise & Custom",
    route: "/enterprise",
    duration: "Scoped per build",
    pages: "Unlimited",
    phases: [
      { name: "Discovery", duration: "Variable", description: "Requirements, architecture, planning" },
      { name: "Proposal", duration: "Variable", description: "Custom quote and timeline" },
      { name: "Development", duration: "Variable", description: "Phased build with regular updates" },
      { name: "Launch & Support", duration: "Ongoing", description: "Deployment and partnership" },
    ],
  },
];

/** A tier's schedule: hairline rail with ember waypoints. */
function PhaseRail({ phases }: { phases: (typeof timelines)[number]["phases"] }) {
  const cols = phases.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return (
    <RevealGroup className={`grid grid-cols-1 gap-y-6 lg:gap-y-0 ${cols}`} stagger={0.08}>
      {phases.map((phase, i) => (
        <RevealItem key={phase.name} className="relative lg:pr-8">
          {/* the rail segment + node (desktop) */}
          <span className="relative mb-4 hidden h-px w-full bg-border lg:block" aria-hidden>
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" />
            {i === phases.length - 1 && (
              <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 border border-border bg-background" />
            )}
          </span>
          {/* mobile: ladder node */}
          <div className="flex gap-4 lg:block">
            <span className="mt-1 flex h-2 w-2 shrink-0 bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] lg:hidden" aria-hidden />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {phase.duration}
              </p>
              <h4 className="mt-1.5 font-display text-base font-semibold tracking-tight sm:text-lg">
                {phase.name}
              </h4>
              <p className="mt-1 max-w-[26ch] text-sm font-light leading-relaxed text-muted-foreground">
                {phase.description}
              </p>
            </div>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

export default function Timelines() {
  return (
    <Layout>
      <PageHero
        eyebrow="The schedule"
        index="31"
        crumbs={[{ label: "Home", href: "/" }, { label: "Timelines" }]}
        title="Know exactly when"
        highlight="to expect it"
        body="Honest delivery windows for every tier — what happens in each week and what we need from you."
        aside={
          <PageHeroFacts
            facts={[
              { value: "04", label: "Schedules" },
              { value: "3–5 days", label: "Fastest tier" },
              { value: "£0", label: "Until you approve" },
            ]}
          />
        }
      />

      {/* The four schedules */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="space-y-0">
            {timelines.map((timeline) => (
              <Reveal key={timeline.tier} className="border-t border-border/60 py-12 first:border-t-0 first:pt-0 sm:py-14">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-primary">
                        {timeline.no}
                      </span>
                      <span className="h-px w-8 bg-primary" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                        {timeline.pages}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                      {timeline.tier}
                    </h2>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="mono-label text-primary">{timeline.duration}</span>
                    <Link
                      to={timeline.route}
                      className="link-underline hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
                    >
                      View tier
                    </Link>
                  </div>
                </div>

                <PhaseRail phases={timeline.phases} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The clock starts
                <span className="block text-primary">when you say go.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Every schedule begins with a free preview — you see the design before a single
                payment.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Start your project
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/preview-process" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                How the preview works
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
