import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { SplitText } from "@/components/motion/SplitText";
import { EASE_OUT } from "@/lib/motion";

export type Crumb = { label: string; href?: string };

/**
 * Opening block for every interior marketing page.
 *
 * The pages it replaces all began the same way: a centred badge pill, a centred
 * heading with a gradient word, a centred paragraph and two centred buttons,
 * floating over blurred blobs. Fifty pages of that, and every page is the
 * homepage again with different words.
 *
 * This one is left-aligned and asymmetric. It carries a real breadcrumb, an
 * index number that gives the page a position in the site, and an optional
 * `aside` slot for a page-specific fact — a price, a turnaround, a count — so
 * different pages actually look different from one another.
 */
export function PageHero({
  eyebrow,
  title,
  highlight,
  body,
  crumbs = [],
  actions,
  aside,
  /** Two-digit marker, e.g. "04". Purely typographic — gives the block a corner. */
  index,
}: {
  eyebrow?: ReactNode;
  title: string;
  highlight?: string;
  body?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  aside?: ReactNode;
  index?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      {/* A single ember wash off to one side. Not four blurred orbs. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 40% 60% at 88% 20%, hsl(var(--primary) / 0.1) 0%, transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.025) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.025) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 70% 100% at 70% 0%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 100% at 70% 0%, black, transparent 75%)",
        }}
      />

      <div className="container-tight relative z-10 pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
        {crumbs.length > 0 && (
          <motion.nav
            aria-label="Breadcrumb"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="mb-8 flex flex-wrap items-center gap-1.5"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden />}
                {c.href ? (
                  <Link
                    to={c.href}
                    className="mono-label transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="mono-label text-foreground/80">{c.label}</span>
                )}
              </span>
            ))}
          </motion.nav>
        )}

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center gap-3">
              {index && (
                <span className="font-mono text-[11px] tabular-nums text-primary">{index}</span>
              )}
              <span className="h-px w-8 bg-primary" />
              {eyebrow && (
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                  {eyebrow}
                </span>
              )}
            </div>

            <h1 className="font-display font-semibold leading-[0.96] tracking-[-0.04em] text-[clamp(2.3rem,5.6vw,4.2rem)]">
              <SplitText text={title} as="span" className="block" />
              {highlight && (
                <span className="mt-1 block text-primary">
                  <SplitText text={highlight} as="span" className="block" delay={0.12} />
                </span>
              )}
            </h1>

            {body && (
              <motion.p
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25, ease: EASE_OUT }}
                className="mt-7 max-w-2xl text-[15px] font-light leading-relaxed text-muted-foreground sm:text-lg"
              >
                {body}
              </motion.p>
            )}

            {actions && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.34, ease: EASE_OUT }}
                className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
              >
                {actions}
              </motion.div>
            )}
          </div>

          {aside && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
              className="lg:col-span-4 lg:pt-2"
            >
              {aside}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Metric list for `PageHero`'s aside slot. Hairline-separated, mono labels. */
export function PageHeroFacts({ facts }: { facts: { value: string; label: string }[] }) {
  return (
    <dl className="border-t border-border/60">
      {facts.map((f) => (
        <div key={f.label} className="flex items-baseline justify-between gap-6 border-b border-border/60 py-4">
          <dt className="mono-label">{f.label}</dt>
          <dd className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
