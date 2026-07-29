import { Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  RefreshCw,
  Clock,
  FileCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { PreviewStrip, PreviewRail } from "@/components/marketing/PreviewSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Preview funnel 03 — the guarantee, set as terms a buyer can actually
 * read: four commitments in a matrix, three outcomes as parallel columns
 * (including the one where you walk away), and the revision policy as a
 * two-column spec. Tier names aligned with the series (free = Starter &
 * Business, paid = Growth & Enterprise).
 */

const guarantees = [
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "Every preview passes 8 rigorous quality checkpoints. We don't deliver until it meets our exacting standards."
  },
  {
    icon: RefreshCw,
    title: "Revision Policy",
    description: "Free previews include 1 round of minor revisions. Paid previews include 2 rounds to ensure you're satisfied."
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    description: "We commit to our timelines. If we're late, you receive a 10% discount on your final purchase."
  },
  {
    icon: FileCheck,
    title: "Full Transparency",
    description: "You receive daily updates during development. No surprises, no hidden costs, no fine print."
  }
];

const whatHappens = [
  {
    scenario: "You love the preview",
    icon: CheckCircle,
    tone: "primary" as const,
    steps: [
      "Approve the preview and confirm your order",
      "For paid previews, fee is credited to final invoice",
      "We finalize the site with your feedback",
      "Full handover with training and documentation",
    ],
  },
  {
    scenario: "You want changes",
    icon: RefreshCw,
    tone: "primary" as const,
    steps: [
      "Provide detailed feedback on what to adjust",
      "We implement agreed revisions (1-2 rounds)",
      "Review updated preview",
      "Proceed when satisfied",
    ],
  },
  {
    scenario: "You don't want to proceed",
    icon: AlertCircle,
    tone: "muted" as const,
    steps: [
      "No obligation for free previews - walk away anytime",
      "For paid previews, fee is non-refundable",
      "We archive your files for 90 days",
      "You can return anytime to reconsider",
    ],
  },
];

const revisionDetails = [
  {
    tier: "Free Previews",
    description: "Starter & Business tiers",
    revisions: "1 round",
    includes: ["Color/font adjustments", "Minor layout tweaks", "Text corrections", "Image swaps"]
  },
  {
    tier: "Paid Previews",
    description: "Growth & Enterprise",
    revisions: "2 rounds",
    includes: ["All minor revisions", "Layout restructuring", "Feature adjustments", "Extended functionality tweaks"]
  }
];

export default function PreviewGuarantee() {
  return (
    <Layout>
      <PageHero
        eyebrow="The preview funnel"
        index="44"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview guarantee" }]}
        title="The preview"
        highlight="guarantee"
        body="No commitment, no obligation — the preview is free and the decision stays yours."
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
              { value: "04", label: "Commitments" },
              { value: "10%", label: "Off if we're late" },
              { value: "£0", label: "To walk away" },
            ]}
          />
        }
      />

      <PreviewStrip current="03" />

      {/* The four commitments */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">In writing</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Four commitments,
              <span className="block text-primary">no fine print.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {guarantees.map((item, i) => (
              <MatrixCell key={item.title} icon={item.icon} index={i} title={item.title}>
                {item.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* The three outcomes */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Every ending covered</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                What happens next —
                <span className="block text-primary">all three versions.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Including the one where you walk away. A guarantee that skips that ending
                isn&rsquo;t one.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 lg:grid-cols-3">
            {whatHappens.map((scenario, sIndex) => (
              <RevealItem
                key={scenario.scenario}
                className="border-b border-r border-border/60 p-7 sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <scenario.icon
                    className={`h-5 w-5 ${scenario.tone === "muted" ? "text-muted-foreground" : "text-primary"}`}
                    strokeWidth={1.5}
                  />
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(sIndex + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {scenario.scenario}
                </h3>
                <ol className="mt-5 border-t border-border/60">
                  {scenario.steps.map((step, i) => (
                    <li
                      key={step}
                      className="flex items-baseline gap-3 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <span className="font-mono text-[10px] tabular-nums text-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Revision policy */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The revision policy</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              What a round
              <span className="block text-primary">of changes covers.</span>
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            {revisionDetails.map((detail, i) => (
              <RevealItem key={detail.tier} className="border-b border-r border-border/60 p-7 sm:p-8">
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mono-label text-primary">{detail.revisions}</span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{detail.tier}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {detail.description}
                </p>
                <ul className="mt-5 border-t border-border/60">
                  {detail.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                      {item}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The risk is ours.
                <span className="block text-primary">That&rsquo;s the point.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                If the preview doesn&rsquo;t earn the project, we haven&rsquo;t earned your money.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Start with a preview
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <PreviewRail current="03" />
    </Layout>
  );
}
