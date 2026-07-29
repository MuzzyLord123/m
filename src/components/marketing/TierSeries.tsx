import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * The website tiers as a series. Five pages that used to be five unrelated
 * templates now read as chapters of one document: a scale diagram showing
 * where the tier sits, a numbered spec ledger instead of a checklist, and
 * case-study-style previous/next navigation at the foot of each page.
 */

export const TIERS = [
  { no: "01", name: "Starter", route: "/starter", pages: "1–2 pages", timeline: "3–5 days", blurb: "Found and contacted fast" },
  { no: "02", name: "Business", route: "/growth", pages: "2–5 pages", timeline: "1–2 weeks", blurb: "Look established" },
  { no: "03", name: "Growth", route: "/professional", pages: "6–10 pages", timeline: "2–4 weeks", blurb: "Built to scale" },
  { no: "04", name: "Enterprise", route: "/enterprise", pages: "Unlimited", timeline: "4–12 weeks", blurb: "Platforms & integrations" },
  { no: "05", name: "Custom Elite", route: "/custom-elite", pages: "No limits", timeline: "Scoped per build", blurb: "A blank-page build" },
] as const;

export type TierNo = (typeof TIERS)[number]["no"];

/**
 * Where this tier sits on the ladder — the site's own structure drawn as a
 * graphic. The current tier is the lit point; the rest are wayposts. Each
 * waypost navigates.
 */
export function TierScale({ current }: { current: TierNo }) {
  return (
    <section className="border-y border-border/60" aria-label="Tier scale">
      <div className="container-tight">
        <RevealGroup className="grid grid-cols-5">
          {TIERS.map((tier, i) => {
            const active = tier.no === current;
            return (
              <RevealItem key={tier.no} className={i > 0 ? "border-l border-border/60" : ""}>
                <Link
                  to={tier.route}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex h-full flex-col gap-1.5 px-2 py-5 transition-colors duration-300 sm:px-4 sm:py-6 ${
                    active ? "" : "hover:bg-foreground/[0.02]"
                  }`}
                >
                  {/* the rail: a hairline with a node on it */}
                  <span className="relative mb-2 block h-px w-full bg-border" aria-hidden>
                    <span
                      className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 transition-colors duration-300 ${
                        active
                          ? "bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]"
                          : "border border-border bg-background group-hover:border-primary/50"
                      }`}
                      style={{ left: `${(i / (TIERS.length - 1)) * 88}%` }}
                    />
                  </span>
                  <span
                    className={`font-mono text-[10px] tabular-nums tracking-[0.18em] ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tier.no}
                  </span>
                  <span
                    className={`font-display text-xs font-semibold tracking-tight sm:text-sm ${
                      active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {tier.name}
                  </span>
                  <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground lg:block">
                    {tier.timeline}
                  </span>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}

/** Numbered two-column ledger — the spec-sheet answer to a checkmark list. */
export function SpecLedger({ items, columns = 2 }: { items: readonly string[]; columns?: 1 | 2 }) {
  return (
    <RevealGroup
      className={`grid grid-cols-1 gap-x-12 ${columns === 2 ? "sm:grid-cols-2" : ""}`}
      stagger={0.03}
    >
      {items.map((item, i) => (
        <RevealItem
          key={item}
          className="flex items-baseline gap-4 border-b border-border/60 py-3.5"
        >
          <span className="font-mono text-[11px] tabular-nums text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-light leading-relaxed text-foreground/85">{item}</span>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/** Case-study-style previous / next tier navigation. */
export function TierRail({ current }: { current: TierNo }) {
  const i = TIERS.findIndex((t) => t.no === current);
  const prev = i > 0 ? TIERS[i - 1] : null;
  const next = i < TIERS.length - 1 ? TIERS[i + 1] : null;

  return (
    <section className="border-t border-border/60" aria-label="Tier navigation">
      <div className="container-tight">
        <Reveal className="grid sm:grid-cols-2">
          {prev ? (
            <Link
              to={prev.route}
              className="group flex flex-col gap-2 border-b border-border/60 py-10 pr-6 transition-colors duration-300 hover:bg-foreground/[0.02] sm:border-b-0 sm:border-r sm:py-14"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                Previous tier · {prev.no}
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
                {prev.name}
              </span>
              <span className="text-sm font-light text-muted-foreground">{prev.blurb}</span>
            </Link>
          ) : (
            <Link
              to="/packages"
              className="group flex flex-col gap-2 border-b border-border/60 py-10 pr-6 transition-colors duration-300 hover:bg-foreground/[0.02] sm:border-b-0 sm:border-r sm:py-14"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
                The catalogue
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
                All packages
              </span>
              <span className="text-sm font-light text-muted-foreground">Six categories, every build</span>
            </Link>
          )}

          {next ? (
            <Link
              to={next.route}
              className="group flex flex-col items-end gap-2 py-10 pl-6 text-right transition-colors duration-300 hover:bg-foreground/[0.02] sm:py-14"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Next tier · {next.no}
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
                {next.name}
              </span>
              <span className="text-sm font-light text-muted-foreground">{next.blurb}</span>
            </Link>
          ) : (
            <Link
              to="/get-started"
              className="group flex flex-col items-end gap-2 py-10 pl-6 text-right transition-colors duration-300 hover:bg-foreground/[0.02] sm:py-14"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Beyond the ladder
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
                Start a conversation
              </span>
              <span className="text-sm font-light text-muted-foreground">Tell us what you&rsquo;re building</span>
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  );
}
