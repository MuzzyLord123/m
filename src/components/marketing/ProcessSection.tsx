import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_PROCESS_DEFAULTS, type HomeProcessContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";
import { getIcon } from "@/lib/marketingIcons";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { EASE_OUT, VIEWPORT } from "@/lib/motion";

/**
 * The process, as a numbered ladder with a scroll-drawn spine.
 *
 * The previous version was a zig-zag timeline of glass cards alternating left
 * and right of a centre line, with white numerals on near-invisible chips (1.1:1
 * in light mode — effectively blank). Alternating cards is the stock "process"
 * component; it reads as a template because it is one, and it collapses to a
 * plain stack on mobile anyway, so the arrangement only existed at one width.
 *
 * This is a single left-aligned column. The spine fills as you scroll, which
 * gives the section a sense of progress the zig-zag only implied.
 */
export function ProcessSection() {
  const { data } = useSiteContent<HomeProcessContent>("home_process", HOME_PROCESS_DEFAULTS);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 60%"],
  });
  const spine = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });
  const spineHeight = useTransform(spine, (v) => `${Math.max(0, Math.min(1, v)) * 100}%`);

  return (
    <section className="section-padding relative border-t border-border/60">
      <div className="container-tight">
        <SectionHeading
          className="mb-14 sm:mb-20"
          eyebrow={
            <EditableField sectionKey="home_process" field="eyebrow" value={data.eyebrow} label="Eyebrow">
              {data.eyebrow}
            </EditableField>
          }
          title={
            <span className="block">
              <EditableField sectionKey="home_process" field="title" value={data.title} label="Title">
                {data.title}
              </EditableField>{" "}
              <span className="text-gradient">
                <EditableField sectionKey="home_process" field="titleHighlight" value={data.titleHighlight} label="Title highlight">
                  {data.titleHighlight}
                </EditableField>
              </span>
            </span>
          }
          body={
            <EditableField sectionKey="home_process" field="subtitle" value={data.subtitle} label="Subtitle" kind="textarea">
              {data.subtitle}
            </EditableField>
          }
        />

        <div ref={trackRef} className="relative pl-8 sm:pl-16">
          {/* Spine. The track is always there; the accent fills it on scroll. */}
          <div className="absolute bottom-0 left-0 top-0 w-px bg-border sm:left-2">
            <motion.div
              className="absolute inset-x-0 top-0 bg-primary"
              style={{ height: reduce ? "100%" : spineHeight }}
            />
          </div>

          {data.steps.map((step) => {
            const StepIcon = getIcon(step.icon);
            return (
              <motion.div
                key={step.step}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT}
                transition={{ duration: 0.65, ease: EASE_OUT }}
                className="relative border-b border-border/60 py-10 last:border-b-0 sm:py-14"
              >
                {/* Node sitting on the spine. */}
                <span
                  aria-hidden
                  className="absolute left-[-2.19rem] top-[3.1rem] h-1.5 w-1.5 rounded-full bg-primary sm:left-[-3.69rem] sm:top-[4.15rem]"
                />

                <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
                  <div className="lg:col-span-5">
                    <div className="mb-4 flex items-center gap-4">
                      <span className="font-mono text-[11px] tabular-nums tracking-[0.2em] text-primary">
                        {step.step}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border">
                        <StepIcon className="h-4 w-4 text-primary" strokeWidth={1.6} />
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {step.title}
                    </h3>
                  </div>

                  <div className="lg:col-span-7">
                    <p className="max-w-xl text-sm font-light leading-relaxed text-muted-foreground sm:text-[15px]">
                      {step.description}
                    </p>
                    <ul className="mt-6 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {step.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2.5">
                          <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.2} />
                          <span className="text-sm font-light text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Reveal className="mt-12">
          <p className="mono-label">
            {data.steps.length} stages · every one signed off before the next begins
          </p>
        </Reveal>
      </div>
    </section>
  );
}
