import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

/**
 * The preview funnel as a numbered series — the same editorial device as the
 * website tiers and the practice. Six pages that answer, in order: what
 * happens, what it costs, what we promise, how it plays out, what people
 * ask, and what you'll receive.
 */

export const PREVIEWS = [
  { no: "01", name: "The process", route: "/preview-process", blurb: "Seven days, five deliverables" },
  { no: "02", name: "Packages", route: "/preview-pricing", blurb: "Free for most tiers" },
  { no: "03", name: "The guarantee", route: "/preview-guarantee", blurb: "Walk away owing nothing" },
  { no: "04", name: "How it plays out", route: "/preview-stories", blurb: "Three honest walkthroughs" },
  { no: "05", name: "The FAQ", route: "/preview-faq", blurb: "Straight answers" },
  { no: "06", name: "What you receive", route: "/preview-portfolio", blurb: "Scope, tier by tier" },
] as const;

export type PreviewNo = (typeof PREVIEWS)[number]["no"];

/** Contents strip — where this page sits in the preview funnel. */
export function PreviewStrip({ current }: { current: PreviewNo }) {
  return (
    <section className="border-y border-border/60" aria-label="Preview series index">
      <div className="container-tight">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-stretch">
            {PREVIEWS.map((p, i) => {
              const active = p.no === current;
              return (
                <Link
                  key={p.no}
                  to={p.route}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-baseline gap-2 whitespace-nowrap px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 sm:px-5 ${
                    i > 0 ? "border-l border-border/60" : ""
                  } ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className={`tabular-nums ${active ? "text-primary" : ""}`}>{p.no}</span>
                  <span>{p.name}</span>
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

/** Previous / next page in the funnel. */
export function PreviewRail({ current }: { current: PreviewNo }) {
  const i = PREVIEWS.findIndex((p) => p.no === current);
  const prev = i > 0 ? PREVIEWS[i - 1] : PREVIEWS[PREVIEWS.length - 1];
  const next = i < PREVIEWS.length - 1 ? PREVIEWS[i + 1] : PREVIEWS[0];

  return (
    <section className="border-t border-border/60" aria-label="Preview series navigation">
      <div className="container-tight">
        <Reveal className="grid sm:grid-cols-2">
          <Link
            to={prev.route}
            className="group flex flex-col gap-2 border-b border-border/60 py-10 pr-6 transition-colors duration-300 hover:bg-foreground/[0.02] sm:border-b-0 sm:border-r sm:py-14"
          >
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" aria-hidden />
              Previously · {prev.no}
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
              Up next · {next.no}
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
