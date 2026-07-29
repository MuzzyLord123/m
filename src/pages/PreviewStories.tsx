import { Link } from "react-router-dom";
import { ArrowRight, Hammer, ShoppingBag, Rocket, Eye } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { LadderRow } from "@/components/marketing/Matrix";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * Formerly six invented clients ("Sarah M., Artisan Bakery"…) with fabricated
 * quotes, five-star ratings and a conversion stats band ("94% convert",
 * "4.9/5") — none of it real. Removed; see PLACEHOLDERS.md P9.
 *
 * The honest replacement: the preview journey told in second person — three
 * walkthroughs for three kinds of buyer, each explicitly hypothetical
 * ("if you run…"), because a scenario about *you* is honest where an
 * invented testimonial is not.
 */

const scenarios = [
  {
    icon: Hammer,
    kicker: "If you run a local trade",
    title: "The two-page test drive",
    tier: "Starter tier",
    steps: [
      "You send the enquiry on a Tuesday — business name, what you do, the area you cover.",
      "By the weekend there's a working preview: your services, your patch, a click-to-call that works.",
      "You show it to two customers. They find the number faster than on the old Facebook page.",
      "You approve it. It's live within days, and the code is yours.",
    ],
  },
  {
    icon: ShoppingBag,
    kicker: "If you're launching a shop",
    title: "The catalogue, proven first",
    tier: "Professional tier",
    steps: [
      "You need variants, baskets and payments — the things template builders make painful.",
      "The preview arrives with your real products in it, checkout flow clickable end to end.",
      "You test it on your phone, your partner's phone, and the tablet at the counter.",
      "Only when the flow convinces you does the build — and the bill — begin.",
    ],
  },
  {
    icon: Rocket,
    kicker: "If you need a platform",
    title: "The scoped rehearsal",
    tier: "Enterprise tier",
    steps: [
      "Complex builds start with discovery, not a template — requirements, architecture, stages.",
      "The preview demonstrates the key journeys: the portal login, the dashboard, the workflow.",
      "Your team pokes at it and writes the awkward questions. We answer them in the proposal.",
      "You commit to a staged plan where each stage ships something you can use.",
    ],
  },
];

export default function PreviewStories() {
  return (
    <Layout>
      <PageHero
        eyebrow="Previews"
        index="45"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview stories" }]}
        title="How a preview"
        highlight="plays out"
        body="Three honest walkthroughs — one for each kind of buyer — of what happens between your enquiry and your decision. No invented clients, no borrowed quotes."
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
            <Link to="/preview-process" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">The 7-day process</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
      />

      {/* The three walkthroughs */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="space-y-0">
            {scenarios.map((scenario, sIndex) => (
              <Reveal
                key={scenario.title}
                className="border-t border-border/60 py-12 first:border-t-0 first:pt-0 sm:py-14"
              >
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                  <div className="lg:col-span-4">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="font-mono text-[11px] tabular-nums text-primary">
                        {String(sIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="h-px w-8 bg-primary" />
                      <scenario.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="eyebrow mb-3">{scenario.kicker}</p>
                    <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                      {scenario.title}
                    </h2>
                    <p className="mono-label mt-4 text-primary">{scenario.tier}</p>
                  </div>
                  <RevealGroup className="lg:col-span-8" stagger={0.06}>
                    {scenario.steps.map((step, i) => (
                      <RevealItem
                        key={step}
                        className="flex items-baseline gap-4 border-b border-border/60 py-4"
                      >
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm font-light leading-relaxed text-foreground/85">
                          {step}
                        </span>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The constant */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <Eye className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="eyebrow">The constant</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Whatever the tier —
                <span className="block text-primary">you see it before you pay.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                The preview is the pitch. If it doesn&rsquo;t convince you, you owe nothing and
                keep your evenings.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Request your preview
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/preview-guarantee" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                Read the guarantee
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
