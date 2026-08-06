import { CalendarCheck, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { howItWorks } from "@/data/services";
import { site } from "@/config/site";

/**
 * Three steps on a stepped baseline — each one drops lower than the last, like
 * a roller working down a wall.
 *
 * The three guarantees below run as a FULL-BLEED BAND OF BRAND ORANGE. Two
 * reasons. Commercially, they are the three facts that settle a nervous
 * customer — a guarantee, a response time and an insurance figure — so they
 * deserve the loudest surface on the page. Compositionally, the site needed
 * orange at a rhythm rather than sprinkled: this band and the closing CTA are
 * the two full planes, roughly a third and the end of the scroll.
 *
 * Near-black type on the orange throughout — white on #f26522 is about 2.9:1
 * and fails, which is exactly the mistake the closing CTA had been shipping.
 */
export function HowItWorks() {
  const badges = [
    { icon: ShieldCheck, label: site.facts.guarantee, note: "In writing, with the invoice." },
    { icon: CalendarCheck, label: site.facts.responseTime, note: "Itemised, so you can see the prep." },
    { icon: Sparkle, label: site.facts.insurance, note: "Certificate sent before we start." },
  ];

  return (
    <section className="pt-20 pb-0 lg:pt-28" aria-labelledby="how-heading">
      <div className="shell">
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
            <span className="mt-7 inline-grid size-16 place-items-center rounded-full bg-accent font-display text-[1.125rem] font-semibold text-on-accent tabular-nums">
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

      </div>

      {/* Full-bleed. Deliberately not inside the shell. */}
      <div className="mt-20 bg-accent lg:mt-28">
        <ul className="shell grid divide-y divide-on-accent/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {badges.map(({ icon: Icon, label, note }, index) => (
            <Reveal
              as="li"
              key={label}
              delay={0.07 * index}
              className="flex items-start gap-4 py-8 sm:px-7 sm:first:pl-0 sm:last:pr-0 lg:py-10"
            >
              <Icon weight="light" className="size-7 shrink-0 text-on-accent" />
              <div>
                <p className="font-display text-[1.0625rem] leading-snug font-semibold text-on-accent">
                  {label}
                </p>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-on-accent/80">{note}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
