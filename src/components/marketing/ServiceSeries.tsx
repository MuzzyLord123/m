import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * The marketing services as a numbered series — the same editorial device as
 * the website tiers. A contents strip places each service among its
 * siblings, capability cells carry their feature sub-lists in the ledger
 * voice, plan columns share hairlines, and every page ends on a
 * previous/next rail.
 */

export const SERVICES = [
  { no: "01", name: "Social Media", route: "/social-media", blurb: "Run properly, every week" },
  { no: "02", name: "Ad Management", route: "/ad-management", blurb: "Budgets that answer for themselves" },
  { no: "03", name: "Content Creation", route: "/content-creation", blurb: "Assets you own and reuse" },
  { no: "04", name: "SEO & Strategy", route: "/seo-strategy", blurb: "Rankings that hold" },
  { no: "05", name: "Account Management", route: "/account-management", blurb: "One team on the estate" },
  { no: "06", name: "Website Management", route: "/website-management", blurb: "Sites kept running" },
] as const;

export type ServiceNo = (typeof SERVICES)[number]["no"];

/** Contents strip — where this service sits in the practice. */
export function ServiceStrip({ current }: { current: ServiceNo }) {
  return (
    <section className="border-y border-border/60" aria-label="Service index">
      <div className="container-tight">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-stretch">
            {SERVICES.map((s, i) => {
              const active = s.no === current;
              return (
                <Link
                  key={s.no}
                  to={s.route}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-baseline gap-2 whitespace-nowrap px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 sm:px-5 ${
                    i > 0 ? "border-l border-border/60" : ""
                  } ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className={`tabular-nums ${active ? "text-primary" : ""}`}>{s.no}</span>
                  <span>{s.name}</span>
                  <span
                    aria-hidden
                    className={`absolute inset-x-0 bottom-0 h-px origin-left bg-primary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A capability with its feature sub-list, set as a matrix cell. */
export function CapabilityCell({
  icon: Icon,
  index,
  title,
  description,
  features,
}: {
  icon: LucideIcon;
  index: number;
  title: string;
  description: string;
  features: readonly string[];
}) {
  return (
    <RevealItem className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
      />
      <div className="mb-7 flex items-center justify-between">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
      <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{description}</p>
      <ul className="mt-5 border-t border-border/60">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2.5 border-b border-border/40 py-2 text-xs font-light text-muted-foreground last:border-b-0"
          >
            <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={2.4} />
            {feature}
          </li>
        ))}
      </ul>
    </RevealItem>
  );
}

export type ServicePlan = {
  name: string;
  /** e.g. "Tailored", "Custom Quote" — always a scope note, never a number. */
  price: string;
  note?: string;
  features: readonly string[];
  popular?: boolean;
};

/** Plan columns sharing hairlines; the popular plan carries a standing ember rule. */
export function ServicePlans({ plans, cta = "Get started" }: { plans: readonly ServicePlan[]; cta?: string }) {
  const cols =
    plans.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <RevealGroup className={`grid grid-cols-1 border-l border-t border-border/60 ${cols}`}>
      {plans.map((plan, i) => (
        <RevealItem
          key={plan.name}
          className="group relative flex flex-col overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02]"
        >
          <span
            aria-hidden
            className={`absolute inset-x-0 top-0 h-px origin-left bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              plan.popular ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
            }`}
          />
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            {plan.popular && (
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
                Most popular
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold tracking-tight">{plan.name}</h3>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {plan.price}
          </p>
          {plan.note && (
            <p className="mt-2 text-xs font-light text-primary">{plan.note}</p>
          )}
          <ul className="mt-5 flex-1 border-t border-border/60">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
              >
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.2} />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button variant={plan.popular ? "premium" : "outline"} className="w-full" asChild>
              <Link to="/get-started">{cta}</Link>
            </Button>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/** Standard left-aligned section opener for series pages. */
export function SeriesHeading({
  eyebrow,
  title,
  accent,
  standfirst,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  standfirst?: ReactNode;
}) {
  return (
    <Reveal className="mb-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">{eyebrow}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
          {title}
          {accent && <span className="block text-primary">{accent}</span>}
        </h2>
        {standfirst && (
          <p className="max-w-sm text-sm font-light text-muted-foreground">{standfirst}</p>
        )}
      </div>
    </Reveal>
  );
}

/** Case-study-style previous / next service navigation. */
export function ServiceRail({ current }: { current: ServiceNo }) {
  const i = SERVICES.findIndex((s) => s.no === current);
  const prev = i > 0 ? SERVICES[i - 1] : SERVICES[SERVICES.length - 1];
  const next = i < SERVICES.length - 1 ? SERVICES[i + 1] : SERVICES[0];

  return (
    <section className="border-t border-border/60" aria-label="Service navigation">
      <div className="container-tight">
        <Reveal className="grid sm:grid-cols-2">
          <Link
            to={prev.route}
            className="group flex flex-col gap-2 border-b border-border/60 py-10 pr-6 transition-colors duration-300 hover:bg-foreground/[0.02] sm:border-b-0 sm:border-r sm:py-14"
          >
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
              Previous service · {prev.no}
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
              {prev.name}
            </span>
            <span className="text-sm font-light text-muted-foreground">{prev.blurb}</span>
          </Link>
          <Link
            to={next.route}
            className="group flex flex-col items-end gap-2 py-10 pl-6 text-right transition-colors duration-300 hover:bg-foreground/[0.02] sm:py-14"
          >
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Next service · {next.no}
              <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary sm:text-3xl">
              {next.name}
            </span>
            <span className="text-sm font-light text-muted-foreground">{next.blurb}</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
