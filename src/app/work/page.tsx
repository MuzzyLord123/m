import type { Metadata } from "next";
import { GalleryDesktop } from "@/components/work/GalleryDesktop";
import { GalleryMobile } from "@/components/work/GalleryMobile";
import { HashTarget } from "@/components/work/HashTarget";
import { FilmGallery } from "@/components/work/FilmGallery";
import { BeforeAfter } from "@/components/work/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { beforeAfterProjects, photographCount, projects } from "@/data/projects";
import { films, hasFilms } from "@/data/films";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Our work",
  description: `Recent decorating jobs across ${site.serviceArea} — interiors, exteriors, wallpapering, spray finishing and commercial work, with before and after comparisons.`,
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-10 lg:pt-[11rem] lg:pb-14">
        {/* Two columns, because at 1024px and above the headline measure only
            reaches halfway across the shell and the right-hand half of the
            first screen was empty black. The index carries what a customer
            would otherwise have to count for themselves. */}
        <div className="shell grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              Our work · {projects.length} projects
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
              Finished jobs, <em className="inline-block pb-[0.06em] leading-[1.1] italic">not</em>{" "}
              staged photographs.
            </h1>
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
              Every job here was priced, prepared and painted by us. Where a room looked bad enough
              beforehand to be worth showing, the before shot is here too.
            </p>
          </div>

          <Reveal immediate>
            <dl className="lg:pb-2">
              {[
                { term: "Photographs", value: `${photographCount}` },
                { term: "Projects", value: `${projects.length}` },
                { term: "Before and after", value: `${beforeAfterProjects.length}` },
                { term: "Covering", value: site.serviceArea },
              ].map((row) => (
                <div
                  key={row.term}
                  className="flex items-baseline justify-between gap-6 border-b border-hairline py-3.5 first:border-t"
                >
                  <dt className="text-[0.8125rem] tracking-[0.06em] text-ink-mute uppercase">
                    {row.term}
                  </dt>
                  <dd className="text-right font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-accent tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <GalleryDesktop />
      <GalleryMobile />
      <HashTarget />

      {/* Films. Renders nothing at all while src/data/films.ts is empty — an
          empty video gallery with a "coming soon" panel is worse than a site
          that does not claim to have films yet. Paste one entry and the whole
          section, both treatments and the count below build themselves. */}
      {hasFilms && (
        <section className="py-20 lg:py-28" aria-labelledby="films-heading">
          <div className="shell">
            <SectionHeading
              eyebrow="On film"
              title={<span id="films-heading">Watch a job actually happen.</span>}
              lead={`${films.length === 1 ? "A film" : films.length + " films"} from site — the preparation, the order of work and what the finish looks like in daylight rather than in a photograph.`}
            />
          </div>
          <div className="mt-12">
            <FilmGallery />
          </div>
        </section>
      )}

      <section className="bg-accent-wash py-20 lg:py-28" aria-labelledby="ba-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Before and after"
            title={<span id="ba-heading">Drag the handle. That is the same wall.</span>}
            lead={`Preparation is most of the cost and all of the difference. ${beforeAfterProjects.length === 1 ? "This one shows" : "These " + beforeAfterProjects.length + " show"} why.`}
          />

          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-8">
            {beforeAfterProjects.map((project, index) => (
              <Reveal key={project.slug} delay={index * 0.08} immediate={index === 0}>
                <BeforeAfter
                  before={project.beforeAfter!.before}
                  after={project.beforeAfter!.after}
                  label={`${project.title}, ${project.area}`}
                  className="aspect-[3/2] w-full shadow-lift"
                />
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
                    {project.title}
                  </h3>
                  <span className="shrink-0 text-[0.8125rem] text-ink-mute">{project.area}</span>
                </div>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {project.scope}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
