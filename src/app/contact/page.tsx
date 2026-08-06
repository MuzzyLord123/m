import type { Metadata } from "next";
import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { QuoteFormLazy } from "@/components/quote/QuoteFormLazy";
import { MapEmbed } from "@/components/media/MapEmbed";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Ring ${site.phone} or send the job details through. Decorating across ${site.serviceArea}, quotes back within 48 hours.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-12 lg:pt-[11rem] lg:pb-16">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              Contact
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem]">
              Ring us, or tell us about the{" "}
              <em className="inline-block pb-[0.06em] leading-[1.1] italic">job</em>.
            </h1>
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
              The phone is answered by the decorator, not an office. If we are up a ladder it
              goes to voicemail and we ring back the same day.
            </p>

            <dl className="mt-10 grid gap-6">
              <div>
                <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-ink-mute uppercase">
                  Phone
                </dt>
                <dd className="mt-2">
                  <a
                    href={`tel:${site.phoneHref}`}
                    className="inline-flex items-center gap-3 font-display text-[1.75rem] font-semibold tracking-[-0.025em] text-ink transition-colors duration-200 hover:text-accent"
                  >
                    <Phone weight="light" className="size-6 text-accent" />
                    {site.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-ink-mute uppercase">
                  Email
                </dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${site.email}`}
                    className="inline-flex items-center gap-3 text-[1.0625rem] text-ink-soft transition-colors duration-200 hover:text-accent"
                  >
                    <EnvelopeSimple weight="light" className="size-5 text-accent" />
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-semibold tracking-[0.12em] text-ink-mute uppercase">
                  Based in
                </dt>
                <dd className="mt-2 inline-flex items-center gap-3 text-[1.0625rem] text-ink-soft">
                  <MapPin weight="light" className="size-5 text-accent" />
                  {site.town}, covering {site.serviceArea}
                </dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-hairline pt-8">
              <h2 className="text-[0.75rem] font-semibold tracking-[0.12em] text-ink-mute uppercase">
                Opening hours
              </h2>
              <dl className="mt-4 grid max-w-sm gap-2.5">
                {site.hours.map((slot) => (
                  <div key={slot.days} className="flex justify-between gap-6 text-[0.9375rem]">
                    <dt className="text-ink-soft">{slot.days}</dt>
                    <dd className="text-ink tabular-nums">{slot.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <Reveal delay={0.08} className="lg:pt-14">
            <MapEmbed />
            <p className="mt-6 text-[0.875rem] leading-relaxed text-ink-mute">
              We are on site most days, so the workshop address is for post rather than visits.
              Ring before calling in.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-accent-wash py-20 lg:py-28" aria-labelledby="contact-form-heading">
        <div className="shell">
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
            Free quote
          </p>
          <div className="tape-line mt-3" aria-hidden="true" />
          <div className="mt-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <h2
              id="contact-form-heading"
              className="font-display text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] text-ink sm:text-[2.75rem]"
            >
              Four questions, two minutes.
            </h2>
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-ink-soft lg:mt-2">
              Enough to price most jobs without a visit. A written, itemised price follows within
              48 hours.
            </p>
          </div>

          <div className="mt-12 rounded-[4px] bg-paper p-6 sm:p-9 lg:p-12">
            <QuoteFormLazy />
          </div>
        </div>
      </section>
    </>
  );
}
