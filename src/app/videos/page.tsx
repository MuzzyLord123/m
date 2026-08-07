import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { FilmGallery } from "@/components/work/FilmGallery";
import { FinalCta } from "@/components/home/FinalCta";
import { Reveal } from "@/components/motion/Reveal";
import { films, hasFilms, showFilmSlots } from "@/data/films";
import { photographCount, projects } from "@/data/projects";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Videos",
  description: `Films from site across ${site.serviceArea} — the preparation, the order of work, and what a finish looks like in daylight rather than in a photograph.`,
  alternates: { canonical: "/videos" },
};

/**
 * The video gallery, on its own page.
 *
 * It used to be a section three quarters of the way down /work, behind eleven
 * projects and a before-and-after block. Films are the thing a customer will
 * watch longest and the thing hardest to fake, so they get a page and a place
 * in the menu rather than a footnote on someone else's.
 *
 * Photographs live on /work. The two link to each other at the foot of each
 * page so a visitor who wants the other one never has to go back to the menu.
 */
export default function VideosPage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-10 lg:pt-[11rem] lg:pb-14">
        <div className="shell grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow text-ink-mute">
              On film{hasFilms ? ` · ${films.length} film${films.length === 1 ? "" : "s"}` : ""}
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
              Watch a job{" "}
              <em className="inline-block pb-[0.06em] leading-[1.1] italic">actually</em> happen.
            </h1>
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
              A photograph shows you the finish. A film shows you the preparation underneath it,
              the order the work goes in, and what the paint looks like in daylight rather than
              under a camera flash.
            </p>
          </div>

          <Reveal immediate>
            <dl className="lg:pb-2">
              {[
                { term: "Films", value: hasFilms ? `${films.length}` : "Coming" },
                { term: "Photographs", value: `${photographCount}` },
                { term: "Projects", value: `${projects.length}` },
                { term: "Covering", value: site.serviceArea },
              ].map((row) => (
                <div
                  key={row.term}
                  className="flex items-baseline justify-between gap-6 border-b border-hairline py-3.5 first:border-t"
                >
                  <dt className="eyebrow text-ink-mute">{row.term}</dt>
                  <dd className="text-right font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-accent tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="pb-20 lg:pb-28" aria-label="Films">
        {/* Renders the real gallery once there is a film, and the empty slots
            until then — see FilmGallery and src/data/films.ts. */}
        <FilmGallery />

        {showFilmSlots && (
          <div className="shell mt-10">
            <p className="measure text-[0.9375rem] leading-relaxed text-ink-mute">
              The films are being put together. Until they are here, every job on this page is
              photographed in full — {photographCount} photographs across {projects.length}{" "}
              projects, including the before shots.
            </p>
          </div>
        )}
      </section>

      {/* The way across to the photographs, so nobody has to go back to the menu. */}
      <section className="border-t border-hairline bg-accent-wash/40 py-14 lg:py-16">
        <div className="shell flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="eyebrow text-accent">The photographs</p>
            <p className="mt-3 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink sm:text-[1.875rem]">
              {photographCount} photographs of finished work.
            </p>
          </div>
          <Link
            href="/work"
            className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-ink/20 px-7 text-base font-medium whitespace-nowrap text-ink transition-[border-color,color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-accent hover:bg-accent-wash hover:text-accent active:translate-y-px active:scale-[0.98]"
          >
            See the photo gallery
            <ArrowRight
              weight="light"
              className="size-4 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
