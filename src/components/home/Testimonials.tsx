import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonials } from "@/data/testimonials";

/**
 * Quote cards on an uneven grid: the first runs wide and large, the rest fall
 * in beside and beneath it at two different widths.
 */
export function Testimonials() {
  /* Renders nothing until there are real quotes to show. See
     src/data/testimonials.ts — the examples that shaped this layout are
     deliberately not published. A missing section reads as a site that has not
     asked for reviews yet; an invented one is a banned practice. */
  if (testimonials.length === 0) return null;

  const [lead, ...rest] = testimonials;

  return (
    <section className="bg-plaster py-20 lg:py-28" aria-labelledby="testimonials-heading">
      <div className="shell">
        <SectionHeading
          eyebrow="What people say"
          title={<span id="testimonials-heading">Neighbours talk. That is the marketing.</span>}
          lead="Most of our work comes from someone who has seen a job we finished down the road."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <figure className="flex h-full flex-col justify-between rounded-[4px] bg-paper p-8 lg:p-10">
              <blockquote className="font-display text-[1.5rem] leading-[1.28] font-medium tracking-[-0.02em] text-balance text-ink lg:text-[1.875rem]">
                “{lead.quote}”
              </blockquote>
              <figcaption className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]">
                <span className="font-semibold text-ink">{lead.name}</span>
                <span className="text-ink-mute">{lead.town}</span>
                <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
                <span className="text-ink-soft">{lead.job}</span>
              </figcaption>
            </figure>
          </Reveal>

          {rest.slice(0, 5).map((item, index) => (
            <Reveal
              key={item.name}
              delay={0.05 * index}
              className={index === 0 ? "lg:row-span-1" : ""}
            >
              <figure className="flex h-full flex-col justify-between rounded-[4px] border border-ink/10 bg-paper/60 p-7">
                <blockquote className="text-[0.9375rem] leading-relaxed text-ink-soft">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 text-[0.875rem]">
                  <span className="font-semibold text-ink">{item.name}</span>
                  <span className="text-ink-mute">
                    {" "}
                    · {item.town} · {item.job}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
