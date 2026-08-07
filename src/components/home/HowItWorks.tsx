import { CalendarCheck, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { howItWorks } from "@/data/services";
import { site } from "@/config/site";

/**
 * Three steps on a stepped baseline — each one drops lower than the last, like
 * a roller working down a wall.
 *
 * THE WHOLE SECTION IS BRAND ORANGE. It used to be a near-black section with a
 * thin orange strip of guarantees under it, which is a stripe rather than a
 * plane — the page read as black with orange details, and the brand is black
 * AND orange. Two full-height orange planes now carry the scroll: this one
 * roughly a third of the way down, the closing CTA at the end, with the
 * marquee band between them.
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
    <section
      className="orange-plane relative overflow-hidden pt-20 pb-0 lg:pt-28"
      aria-labelledby="how-heading"
    >
      <div className="shell relative">
        <SectionHeading
          eyebrow="How it works"
          title={<span id="how-heading">Quote, schedule, fresh coat.</span>}
          lead="No sales visit, no pressure, and no price that changes once the sheets are down."
          onAccent
        />

        <ol className="mt-14 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {howItWorks.map((step, index) => (
            <Reveal
              as="li"
              key={step.step}
              delay={0.08 * index}
              className={index === 1 ? "lg:mt-12" : index === 2 ? "lg:mt-24" : ""}
            >
              <div className="h-px bg-on-accent/30" aria-hidden="true" />
              {/* Outlined on the orange rather than filled. A filled near-black
                  disc on this ground reads as a hole punched through the
                  section; the ring reads as drawn on it. */}
              <span className="mt-7 inline-grid size-16 place-items-center rounded-full border border-on-accent/45 figures text-[1.125rem] font-semibold text-on-accent">
                {step.step}
              </span>
              <h3 className="mt-6 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-on-accent">
                {step.title}
              </h3>
              <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-on-accent/85">
                {step.body}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>

      {/* The three facts drop out of the orange onto near-black. Inverting the
          band rather than tinting it is what stops a full-height orange section
          reading as one flat rectangle — and these are the three lines a
          nervous customer actually reads, so they get the contrast. Full-bleed,
          deliberately not inside the shell. */}
      <div className="relative mt-20 bg-paper lg:mt-28">
        <ul className="shell grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {badges.map(({ icon: Icon, label, note }, index) => (
            <Reveal
              as="li"
              key={label}
              delay={0.07 * index}
              className="flex items-start gap-4 py-8 sm:px-7 sm:first:pl-0 sm:last:pr-0 lg:py-10"
            >
              <Icon weight="light" className="size-7 shrink-0 text-accent" />
              <div>
                <p className="font-display text-[1.0625rem] leading-snug font-semibold text-ink">
                  {label}
                </p>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-soft">{note}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
