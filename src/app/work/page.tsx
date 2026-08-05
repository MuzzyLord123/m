import type { Metadata } from "next";
import { GalleryDesktop } from "@/components/work/GalleryDesktop";
import { GalleryMobile } from "@/components/work/GalleryMobile";
import { BeforeAfter } from "@/components/work/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { beforeAfterProjects, projects } from "@/data/projects";
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
        <div className="shell">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
            Our work · {projects.length} projects
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.5rem]">
            Finished jobs, <em className="inline-block pb-[0.06em] leading-[1.1] italic">not</em>{" "}
            staged photographs.
          </h1>
          <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
            Every job here was priced, prepared and painted by us. Where a room looked bad enough
            beforehand to be worth showing, the before shot is here too.
          </p>
        </div>
      </section>

      <GalleryDesktop />
      <GalleryMobile />

      <section className="bg-plaster py-20 lg:py-28" aria-labelledby="ba-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="Before and after"
            title={<span id="ba-heading">Drag the handle. That is the same wall.</span>}
            lead="Preparation is most of the cost and all of the difference. These two show why."
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
