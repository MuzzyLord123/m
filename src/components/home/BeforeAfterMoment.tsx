import { BeforeAfter } from "@/components/work/BeforeAfter";
import { Reveal } from "@/components/motion/Reveal";
import { beforeAfterProjects } from "@/data/projects";

export function BeforeAfterMoment() {
  const project = beforeAfterProjects[0];
  if (!project?.beforeAfter) return null;

  return (
    <section className="bg-plaster py-20 lg:py-28" aria-labelledby="before-after-heading">
      <div className="shell grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
            Drag to compare
          </p>
          <h2
            id="before-after-heading"
            className="mt-5 font-display text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] text-ink sm:text-[2.75rem]"
          >
            The work is in the <em className="italic">preparation</em>.
          </h2>
          <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-ink-soft">
            {project.detail}
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-ink/12 pt-6">
            <div>
              <dt className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">Where</dt>
              <dd className="mt-1.5 font-display text-[1.125rem] font-semibold text-ink">
                {project.area}
              </dd>
            </div>
            <div>
              <dt className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">On site</dt>
              <dd className="mt-1.5 font-display text-[1.125rem] font-semibold text-ink">
                {project.duration}
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={0.1}>
          <BeforeAfter
            before={project.beforeAfter.before}
            after={project.beforeAfter.after}
            label={`${project.title}, ${project.area}`}
            className="aspect-[3/2] w-full shadow-lift"
          />
          <p className="mt-3 text-[0.8125rem] text-ink-mute">
            Drag the handle, or focus it and use the arrow keys.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
