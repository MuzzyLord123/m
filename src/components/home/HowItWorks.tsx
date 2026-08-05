import { CalendarCheck, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { howItWorks } from "@/data/services";
import { site } from "@/config/site";

/**
 * Three steps on a stepped baseline — each one drops lower than the last, like
 * a roller working down a wall — with the trust badges carried underneath.
 */
export function HowItWorks() {
  const badges = [
    { icon: ShieldCheck, label: site.facts.guarantee, note: "In writing, with the invoice." },
    { icon: CalendarCheck, label: site.facts.responseTime, note: "Itemised, so you can see the prep." },
    { icon: Sparkle, label: site.facts.insurance, note: "Certificate sent before we start." },
  ];

  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="how-heading">
      <SectionHeading
        eyebrow="How it works"
        title={<span id="how-heading">Quote, schedule, fresh coat.</span>}
        lead="No sales visit, no pressure, and no price that changes once the sheets are down."
      />

      <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
        {howItWorks.map((step, index) => (
          <Reveal
            as="li"
            key={step.step}
            delay={0.08 * index}
            className={index === 1 ? "lg:mt-12" : index === 2 ? "lg:mt-24" : ""}
          >
            <div className="tape-line" aria-hidden="true" />
            <span className="mt-7 inline-grid size-16 place-items-center rounded-full bg-accent font-display text-[1.125rem] font-semibold text-white tabular-nums">
              {step.step}
            </span>
            <h3 className="mt-6 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
              {step.title}
            </h3>
            <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {step.body}
            </p>
          </Reveal>
        ))}
      </ol>

      <Reveal delay={0.1}>
        <ul className="mt-20 grid gap-px overflow-hidden rounded-[4px] bg-hairline sm:grid-cols-3">
          {badges.map(({ icon: Icon, label, note }) => (
            <li key={label} className="flex items-start gap-4 bg-paper p-7">
              <Icon weight="light" className="size-7 shrink-0 text-accent" />
              <div>
                <p className="font-display text-[1.0625rem] leading-snug font-semibold text-ink">
                  {label}
                </p>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-mute">{note}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
