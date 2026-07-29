import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * The bordered matrix — the site's standard answer to "several things of equal
 * weight", replacing the rounded-glass-card grid on every interior page. Cells
 * share hairlines with their neighbours instead of floating, an ember rule
 * draws across a cell's top edge on hover, and each cell carries a mono index
 * numeral. This is the homepage services/apps pattern, packaged so a page
 * rewrite is three lines instead of forty.
 */
export function Matrix({
  children,
  className = "",
  cols = 3,
}: {
  children: ReactNode;
  className?: string;
  /** Column count at lg. 2, 3 or 4. */
  cols?: 2 | 3 | 4;
}) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 4
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <RevealGroup className={`grid grid-cols-1 border-l border-t border-border/60 ${colClass} ${className}`}>
      {children}
    </RevealGroup>
  );
}

export function MatrixCell({
  icon: Icon,
  index,
  title,
  children,
  footer,
  className = "",
}: {
  icon?: LucideIcon;
  /** Zero-based position; rendered as a two-digit numeral. */
  index?: number;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <RevealItem
      className={`group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8 ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
      />
      {(Icon || index !== undefined) && (
        <div className="mb-7 flex items-center justify-between">
          {Icon ? <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} /> : <span />}
          {index !== undefined && (
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>
      )}
      <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h3>
      {children && (
        <div className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{children}</div>
      )}
      {footer && <div className="mt-5">{footer}</div>}
    </RevealItem>
  );
}

/**
 * Hairline ladder row — the standard for ordered lists (steps, terms,
 * inclusions). Matches the homepage preview/terms ladder.
 */
export function LadderRow({
  index,
  title,
  children,
}: {
  index?: number;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <RevealItem className="grid grid-cols-[auto_1fr] gap-5 border-t border-border/60 py-6 last:border-b">
      {index !== undefined ? (
        <span className="font-mono text-[11px] tabular-nums text-primary">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : (
        <span className="mt-2 h-1 w-1 rounded-full bg-primary" />
      )}
      <span>
        <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">{title}</span>
        {children && (
          <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
            {children}
          </span>
        )}
      </span>
    </RevealItem>
  );
}
