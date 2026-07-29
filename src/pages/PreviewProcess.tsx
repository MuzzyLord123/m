import { Link } from "react-router-dom";
import {
  ArrowRight,
  MessageSquare,
  Palette,
  Code2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { SpecLedger } from "@/components/marketing/TierSeries";
import { PreviewStrip, PreviewRail } from "@/components/marketing/PreviewSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Preview funnel 01 — the seven days, drawn as a day ledger: numbered rows
 * with ember day markers and each day's deliverable set as a mono tag. The
 * old alternating card-timeline is gone.
 */

const processSteps = [
  {
    day: "Day 1",
    icon: MessageSquare,
    title: "Discovery Call",
    description: "We discuss your vision, goals, and requirements. You share examples you love and we outline the scope.",
    deliverable: "Project brief & scope document"
  },
  {
    day: "Day 2",
    icon: Palette,
    title: "Design Concept",
    description: "Our design team creates mood boards, color palettes, and wireframes based on your brand and preferences.",
    deliverable: "Design direction approval"
  },
  {
    day: "Day 3-5",
    icon: Code2,
    title: "Custom Development",
    description: "Our professional coders hand-build your preview site. No templates - every element crafted specifically for you.",
    deliverable: "Working preview site"
  },
  {
    day: "Day 6",
    icon: Eye,
    title: "Preview Review",
    description: "You receive access to your fully functional preview. Explore every page, test interactions, and gather feedback.",
    deliverable: "Live preview link"
  },
  {
    day: "Day 7",
    icon: CheckCircle,
    title: "Feedback & Decision",
    description: "We discuss your thoughts, answer questions, and if you're satisfied, proceed to finalization.",
    deliverable: "Revision notes or approval"
  }
];

const teamRoles = [
  {
    role: "Project Manager",
    responsibility: "Coordinates your project from start to finish, ensuring deadlines and quality standards are met."
  },
  {
    role: "Lead Designer",
    responsibility: "Creates your visual identity, ensuring brand consistency and modern aesthetics."
  },
  {
    role: "Senior Developer",
    responsibility: "Hand-codes your preview using cutting-edge technologies for performance and reliability."
  },
  {
    role: "QA Specialist",
    responsibility: "Tests every interaction across devices and browsers before your preview is delivered."
  }
];

const qualityCheckpoints = [
  "Mobile responsiveness verification",
  "Cross-browser compatibility testing",
  "Performance optimization check",
  "Accessibility compliance review",
  "Content accuracy validation",
  "Interactive element testing",
  "SEO foundation verification",
  "Security best practices audit"
];

export default function PreviewProcess() {
  return (
    <Layout>
      <PageHero
        eyebrow="The preview funnel"
        index="42"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview process" }]}
        title="How we build"
        highlight="your preview"
        body="What happens between your enquiry and the preview landing in your inbox."
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
              { value: "07", label: "Days" },
              { value: "05", label: "Deliverables" },
              { value: "08", label: "Quality checks" },
            ]}
          />
        }
      />

      <PreviewStrip current="01" />

      {/* The seven-day ledger */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Day by day</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The 7-day
                <span className="block text-primary">preview timeline.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Every day has a deliverable — you always know what stage your preview is at.
              </p>
            </div>
          </Reveal>

          <RevealGroup>
            {processSteps.map((step) => (
              <RevealItem
                key={step.title}
                className="group grid grid-cols-[auto_1fr] items-start gap-x-5 border-t border-border/60 py-7 last:border-b sm:grid-cols-[7rem_auto_1fr_auto] sm:items-center sm:gap-x-8"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  {step.day}
                </span>
                <span className="hidden h-9 w-9 items-center justify-center border border-primary/25 bg-primary/[0.06] sm:flex">
                  <step.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
                    {step.title}
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm font-light leading-relaxed text-muted-foreground">
                    {step.description}
                  </span>
                </span>
                <span className="col-start-2 mt-2 sm:col-start-auto sm:mt-0 sm:text-right">
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    Deliverable
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-foreground/85">
                    {step.deliverable}
                  </span>
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Who works on it */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The hands on it</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Four roles on
              <span className="block text-primary">every preview.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {teamRoles.map((member, i) => (
              <MatrixCell key={member.role} index={i} title={member.role}>
                {member.responsibility}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Quality checkpoints */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Before it ships</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Eight checks,
                <span className="block text-primary">every time.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                A preview doesn&rsquo;t leave the studio until it passes the same checklist as a
                finished site.
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              <SpecLedger items={qualityCheckpoints} />
            </div>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Seven days from now,
                <span className="block text-primary">you could be looking at it.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Free for sites under 5 pages. Fast-track available when you need a bigger build
                proven sooner.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Get your free preview
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/preview-faq" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                Common questions
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <PreviewRail current="01" />
    </Layout>
  );
}
