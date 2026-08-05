import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MapEmbed } from "@/components/media/MapEmbed";
import { site } from "@/config/site";

/**
 * Towns as sample-card swatch chips — one of the two places on the site where
 * the five-colour palette is allowed out. Never UI chrome.
 */
const SWATCHES = [
  "var(--color-swatch-sage)",
  "var(--color-swatch-terracotta)",
  "var(--color-swatch-ochre)",
  "var(--color-swatch-slate)",
  "var(--color-swatch-blush)",
];

export function ServiceArea() {
  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="area-heading">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="Where we work"
            title={<span id="area-heading">Covering {site.serviceArea}.</span>}
            align="wide"
          />
          <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
            Based in {site.town} and on site within about forty minutes of it. If your town is
            not on the list, ring and ask — if we cannot get to you we will tell you who can.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {site.towns.map((town, index) => (
              <li
                key={town}
                className="inline-flex items-center gap-2.5 rounded-full border border-ink/12 bg-paper py-1.5 pr-4 pl-2 text-[0.875rem] text-ink-soft"
              >
                <span
                  aria-hidden="true"
                  className="size-4 rounded-full"
                  style={{ backgroundColor: SWATCHES[index % SWATCHES.length] }}
                />
                {town}
              </li>
            ))}
          </ul>

          <dl className="mt-10 grid gap-5 border-t border-hairline pt-8 sm:grid-cols-2">
            <div>
              <dt className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">Phone</dt>
              <dd className="mt-1.5">
                <a
                  href={`tel:${site.phoneHref}`}
                  className="font-display text-[1.25rem] font-semibold text-ink transition-colors duration-200 hover:text-accent"
                >
                  {site.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">Hours</dt>
              <dd className="mt-1.5 text-[0.9375rem] text-ink-soft">
                {site.hours[0].days}, {site.hours[0].time}
              </dd>
            </div>
          </dl>
        </div>

        <Reveal delay={0.08} className="lg:pt-4">
          <MapEmbed />
        </Reveal>
      </div>
    </section>
  );
}
