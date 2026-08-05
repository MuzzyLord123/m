"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SwatchFilter, type Filter } from "./SwatchFilter";
import { Lightbox } from "./Lightbox";
import { blurTone } from "@/lib/images";
import { projects, type Project } from "@/data/projects";

/**
 * Desktop gallery (≥1024px).
 *
 * Editorial masonry on a twelve-column grid: fractional spans, mixed aspect
 * ratios and staggered baselines, so no two rows read the same. Filtering
 * reflows through Motion layout animations rather than a hard swap.
 *
 * Hovering a project wipes a paint swipe up from the bottom edge to carry the
 * title, location and scope.
 */

/** Span, aspect and vertical offset per position. Deliberately uneven. */
const CELLS = [
  { span: "col-span-5", ratio: "aspect-[4/5]", offset: "" },
  { span: "col-span-7", ratio: "aspect-[16/9]", offset: "mt-14" },
  { span: "col-span-4", ratio: "aspect-square", offset: "" },
  { span: "col-span-4", ratio: "aspect-[3/4]", offset: "mt-16" },
  { span: "col-span-4", ratio: "aspect-[16/9]", offset: "mt-6" },
  { span: "col-span-6", ratio: "aspect-[3/2]", offset: "" },
  { span: "col-span-6", ratio: "aspect-[4/5]", offset: "mt-20" },
  { span: "col-span-5", ratio: "aspect-[3/2]", offset: "" },
  { span: "col-span-7", ratio: "aspect-[16/9]", offset: "mt-10" },
  { span: "col-span-4", ratio: "aspect-square", offset: "" },
  { span: "col-span-4", ratio: "aspect-[3/4]", offset: "mt-12" },
  { span: "col-span-4", ratio: "aspect-[4/5]", offset: "mt-4" },
];

export function GalleryDesktop() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Project | null>(null);
  const reduced = useReducedMotion();

  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div className="hidden lg:block">
      <div className="shell">
        <SwatchFilter value={filter} onChange={setFilter} />

        <motion.ul layout={!reduced} className="mt-12 grid grid-cols-12 gap-6">
          {/* Not mode="popLayout": it wraps exiting children in a div, which
              puts a non-list element between the ul and its li items. */}
          <AnimatePresence>
            {shown.map((project, index) => {
              const cell = CELLS[index % CELLS.length];
              const image = project.images[0];

              return (
                <motion.li
                  key={project.slug}
                  id={project.slug}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className={`${cell.span} ${cell.offset} scroll-mt-32`}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(project)}
                    className="group block w-full cursor-zoom-in text-left"
                    aria-label={`${project.title}, ${project.area} — open photographs`}
                  >
                    <div
                      className={`relative ${cell.ratio} w-full overflow-hidden rounded-[4px] bg-plaster`}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1536px) 40vw, 45vw"
                        placeholder="blur"
                        blurDataURL={blurTone(image.tone)}
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                      />

                      {/* Paint swipe — wipes up from the bottom edge on hover */}
                      <div className="absolute inset-x-0 bottom-0 origin-bottom scale-y-0 bg-gradient-to-t from-ink/92 via-ink/75 to-transparent pt-16 transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100">
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
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>

        {shown.length === 0 && (
          <p className="mt-16 text-[1.0625rem] text-ink-soft">
            Nothing photographed in that trade yet. Ring and ask — there will be a job we can
            show you.
          </p>
        )}
      </div>

      <Lightbox project={open} onClose={() => setOpen(null)} />
    </div>
  );
}
