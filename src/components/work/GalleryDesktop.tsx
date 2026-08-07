"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { SwatchFilter, type Filter } from "./SwatchFilter";
import { Lightbox } from "./Lightbox";
import { blurTone } from "@/lib/images";
import { projects, type Project } from "@/data/projects";

/**
 * Desktop gallery (≥1024px).
 *
 * A RULED TWELVE-COLUMN GRID. Every row fills the full width, every image in a
 * row is exactly the same height, and every caption in a row sits on the same
 * baseline.
 *
 * This replaces a staggered masonry — mixed aspect ratios plus mt-4/mt-20
 * offsets on every cell — which was meant to read as editorial and read as
 * misaligned instead. The photographs are a decorator's portfolio; what sells
 * them is looking like the work of someone whose whole trade is straight lines.
 *
 * The composition still varies, but it varies in WIDTH rather than in
 * baseline: rows alternate 7+5, 4+4+4, 5+7, 6+6. That is what keeps a fixed
 * grid from reading as a contact sheet, and it is only possible because the
 * cells are given explicit heights rather than aspect ratios — two cells of
 * different widths sharing one aspect ratio have different heights, which is
 * exactly how the old grid lost its baselines.
 *
 * Filtering reflows through Motion layout animations rather than a hard swap.
 * Hovering a project wipes a paint swipe up from the bottom edge to carry the
 * title, location and scope.
 */

/**
 * The row rhythm. Each row's spans sum to 12, and every cell in it shares one
 * height — so the row is flush at the top and flush at the bottom.
 */
const ROWS = [
  { height: "h-[24rem] xl:h-[27rem]", spans: [7, 5] },
  { height: "h-[18rem] xl:h-[20rem]", spans: [4, 4, 4] },
  { height: "h-[24rem] xl:h-[27rem]", spans: [5, 7] },
  { height: "h-[21rem] xl:h-[23rem]", spans: [6, 6] },
];

/* Tailwind scans source for literal class names, so the spans have to appear
   as complete strings somewhere it can see them. A lookup, not a template. */
const SPAN_CLASS: Record<number, string> = {
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  12: "col-span-12",
};

/** Splits `total` columns as evenly as possible across `n` cells. */
function distribute(total: number, n: number): number[] {
  const base = Math.floor(total / n);
  const extra = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * The `sizes` hint for a cell of `span` columns.
 *
 * Every cell used to claim 45vw regardless of width, which is what a fixed
 * `sizes` string costs once the spans stop being uniform: a four-column cell is
 * about 29vw, so the browser was fetching a source nearly twice the width it
 * would ever paint, eleven times over, on the page that is nothing but
 * photographs. The shell caps at 88rem, hence the two branches.
 */
function sizesFor(span: number): string {
  const fraction = span / 12;
  const capped = Math.round(1408 * fraction);
  const fluid = Math.round(88 * fraction);
  return `(min-width: 88rem) ${capped}px, ${fluid}vw`;
}

/**
 * Lays `count` projects into the row rhythm.
 *
 * The last row is the one that gives a grid like this away: with eleven
 * projects the rhythm leaves a single item spanning seven columns and five
 * columns of empty black beside it. So a short final row has its columns
 * redistributed to fill the width — one item runs the full twelve, two run
 * six and six. The grid always ends flush.
 */
function layout(count: number): { span: string; height: string; sizes: string }[] {
  const cells: { span: string; height: string; sizes: string }[] = [];
  let placed = 0;
  let row = 0;

  while (placed < count) {
    const { spans, height } = ROWS[row % ROWS.length];
    const remaining = count - placed;
    const widths = remaining < spans.length ? distribute(12, remaining) : spans;

    for (const width of widths.slice(0, remaining)) {
      cells.push({
        span: SPAN_CLASS[width] ?? "col-span-4",
        height,
        sizes: sizesFor(width),
      });
    }
    placed += widths.length;
    row += 1;
  }

  return cells;
}

export function GalleryDesktop() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Project | null>(null);
  const reduced = useReducedMotion();

  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  /* Recomputed per filter, not per project — a five-item result gets its own
     flush grid rather than the first five cells of the eleven-item one. */
  const cells = layout(shown.length);

  return (
    /* domMax rather than the root's domAnimation: the filter reflow uses
       layout projection, which is not in the smaller bundle. */
    <LazyMotion features={domMax}>
    <div className="hidden lg:block">
      <div className="shell">
        <SwatchFilter value={filter} onChange={setFilter} />

        <m.ul layout={!reduced} className="mt-12 grid grid-cols-12 gap-6">
          {/* Not mode="popLayout": it wraps exiting children in a div, which
              puts a non-list element between the ul and its li items. */}
          <AnimatePresence>
            {shown.map((project, index) => {
              const cell = cells[index];
              const image = project.images[0];

              return (
                <m.li
                  key={project.slug}
                  id={`desktop-${project.slug}`}
                  data-slug={project.slug}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className={`${cell.span} scroll-mt-32`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(project)}
                    className="group block w-full cursor-zoom-in text-left"
                    aria-label={`${project.title}, ${project.area} — open photographs`}
                  >
                    {/* A HEIGHT, not an aspect ratio. This is what puts every
                        image in a row on the same top and bottom line however
                        wide its cell is, and what puts the captions beneath
                        them on one baseline. */}
                    <div
                      className={`relative ${cell.height} w-full overflow-hidden rounded-[4px] bg-plaster`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes={cell.sizes}
                        placeholder="blur"
                        blurDataURL={blurTone(image.tone)}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />

                      {/* Paint swipe — wipes up from the bottom edge on hover */}
                      <div className="absolute inset-x-0 bottom-0 origin-bottom scale-y-0 bg-gradient-to-t from-scrim/92 via-scrim/75 to-transparent pt-16 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100">
                        <div className="p-6 opacity-0 transition-opacity duration-300 delay-100 group-hover:opacity-100 group-focus-visible:opacity-100">
                          <p className="font-display text-[1.25rem] leading-tight font-semibold tracking-[-0.02em] text-white">
                            {project.title}
                          </p>
                          <p className="mt-1 text-[0.875rem] text-white/75">{project.area}</p>
                          <p className="mt-2.5 max-w-md text-[0.875rem] leading-relaxed text-white/85">
                            {project.scope}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-baseline justify-between gap-4">
                      <h2 className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                        {project.title}
                      </h2>
                      <span className="shrink-0 text-[0.8125rem] text-ink-mute">
                        {project.area}
                      </span>
                    </div>
                  </button>
                </m.li>
              );
            })}
          </AnimatePresence>
        </m.ul>

        {shown.length === 0 && (
          <p className="mt-16 text-[1.0625rem] text-ink-soft">
            Nothing photographed in that trade yet. Ring and ask — there will be a job we can
            show you.
          </p>
        )}
      </div>

      <Lightbox project={open} onClose={() => setOpen(null)} />
    </div>
    </LazyMotion>
  );
}
