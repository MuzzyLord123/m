"use client";

import { CATEGORIES, type CategoryId } from "@/data/projects";

export type Filter = CategoryId | "all";

const OPTIONS: { id: Filter; label: string; swatch: string }[] = [
  { id: "all", label: "Everything", swatch: "var(--color-ink)" },
  ...CATEGORIES.map((category) => ({
    id: category.id as Filter,
    label: category.label,
    swatch: category.swatch,
  })),
];

/**
 * Filters as paint sample cards — the one context, with the gallery itself,
 * where the five-colour sample palette is allowed out of its box.
 *
 * Signature interaction 5 — swatch physics: chips lift and tilt on hover and
 * press down on click, with the tinted shadow deepening as they rise.
 */
export function SwatchFilter({
  value,
  onChange,
  layout = "grid",
}: {
  value: Filter;
  onChange: (next: Filter) => void;
  layout?: "grid" | "strip";
}) {
  const strip = layout === "strip";

  return (
    /* The group role lives on a wrapper, not on the ul. Putting it on the list
       itself overrides the list role and orphans every li inside it. */
    <div role="group" aria-label="Filter projects by trade">
      <ul
        className={
          strip
            ? "-mx-[var(--shell-pad)] flex snap-x scroll-pl-[var(--shell-pad)] gap-3 overflow-x-auto overscroll-x-contain px-[var(--shell-pad)] pt-1 pb-3"
            : "flex flex-wrap gap-3"
        }
      >
        {OPTIONS.map((option) => {
        const active = value === option.id;
        return (
          <li key={option.id} className={strip ? "shrink-0 snap-start" : undefined}>
            <button
              type="button"
              onClick={() => onChange(option.id)}
              aria-pressed={active}
              className={`group block w-[6.5rem] overflow-hidden rounded-[4px] border bg-paper text-left transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:rotate-1 hover:shadow-lift active:scale-[0.98] active:rotate-0 ${
                active
                  ? "border-accent shadow-lift"
                  : "border-hairline shadow-[0_1px_2px_rgb(60_60_50/0.05)]"
              }`}
            >
              <span
                aria-hidden="true"
                className="block h-14 w-full"
                style={{ backgroundColor: option.swatch }}
              />
              {/* min-h, because "Feature walls" is the one label that wraps to
                  two lines at this card width — which made that single chip
                  taller than the five beside it and broke the row's baseline.
                  Reserving the second line keeps every chip the same height
                  whatever a category is called. */}
              <span className="flex min-h-[2.875rem] items-center justify-between gap-1 px-2.5 py-2">
                <span
                  className={`text-[0.8125rem] font-medium ${active ? "text-accent" : "text-ink-soft"}`}
                >
                  {option.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full transition-opacity duration-200 ${
                    active ? "bg-accent opacity-100" : "opacity-0"
                  }`}
                />
              </span>
            </button>
          </li>
        );
        })}
      </ul>
    </div>
  );
}
