import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Eye, FileCheck, Banknote, KeyRound } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell, LadderRow } from "@/components/marketing/Matrix";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { WordReveal } from "@/components/motion/Scrub";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/**
 * This page used to carry six invented clients — "TechStart Solutions",
 * "Hartley Legal", "Artisan Coffee Co." — with fabricated quotes, invented
 * people, stock Unsplash photos, and a stats band ("500+ projects", "98%
 * satisfaction") describing a track record that doesn't exist. All of it is
 * gone; see PLACEHOLDERS.md P9.
 *
 * What replaced it is the only honest version of a success page a young
 * studio can publish: the promises a client can verify before paying,
 * the journey every project actually follows, and a plain invitation to be
 * an early client. When real stories exist, they belong here.
 */

const checkable = [
  {
    icon: Eye,
    title: "The preview is real",
    desc: "Before any payment, you receive a working preview of your actual site — not a mood board. Judge us on it.",
  },
  {
    icon: Banknote,
    title: "The pricing is published",
    desc: "Every tier and service has its scope in writing on this site. Compare us line by line against any quote.",
  },
  {
    icon: KeyRound,
    title: "The ownership is total",
    desc: "Code, design, content, accounts — contractually yours. No licensing fees, no lock-in, resale rights included.",
  },
  {
    icon: FileCheck,
    title: "The work is inspectable",
    desc: "Our reference builds are public and labelled honestly as studies — showing exactly how each tier is put together.",
  },
];

const journey = [
  { title: "You tell us what the business needs", desc: "A short enquiry — no calls you didn't ask for, no obligation." },
  { title: "We build your preview free", desc: "A working version of your actual site, usually within a week." },
  { title: "You decide with the evidence in hand", desc: "Love it and we finish it. Don't, and you owe nothing." },
  { title: "We build, you review, it ships", desc: "Clear timelines by tier — days for a Starter, staged delivery for platforms." },
  { title: "Everything transfers to you", desc: "Source code, accounts, training. The site is an asset you own outright." },
];

export default function SuccessStories() {
  return (
    <Layout>
      <PageHero
        eyebrow="On the record"
        index="47"
        crumbs={[{ label: "Home", href: "/" }, { label: "Success stories" }]}
        title="Judged on evidence,"
        highlight="not testimonials."
        body="We're a young studio, and we won't invent a wall of glowing clients to look older. Here's what you can actually check — before you pay anything."
      />

      {/* The honest statement */}
      <section className="section-padding">
        <div className="container-tight">
          <WordReveal
            text="Most agency success pages are unverifiable. Ours is short on names and long on things you can test yourself — a free preview, published pricing, and ownership in writing."
            className="max-w-4xl font-display text-2xl font-semibold leading-snug tracking-[-0.02em] sm:text-3xl lg:text-4xl"
          />
        </div>
      </section>

      {/* What you can check */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Verifiable now</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Four claims you can
              <span className="block text-primary">check today.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {checkable.map((item, i) => (
              <MatrixCell key={item.title} icon={item.icon} index={i} title={item.title}>
                {item.desc}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* The journey every project follows */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Every project</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The story your project
                <span className="block text-primary">will follow.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                Five chapters, in this order, every time. The only variable is how far up the
                tier ladder you go.
              </p>
              <Link
                to="/portfolio"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground"
              >
                <span className="link-underline">See the reference builds</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {journey.map((step, i) => (
                <LadderRow key={step.title} index={i} title={step.title}>
                  {step.desc}
                </LadderRow>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Early client close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The first stories here
                <span className="block text-primary">will be real ones.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Early clients get the studio&rsquo;s full attention — and when your results are
                worth telling, this page is where they&rsquo;ll live, with your permission.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Start with a free preview
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
