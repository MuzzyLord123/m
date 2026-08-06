import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/services";
import { blurTone } from "@/lib/images";

/**
 * Deliberately uneven: the lead service runs tall down the left with its
 * photograph, the other four sit in a stepped two-column stack beside it.
 * No row of equal cards anywhere.
 */
export function ServicesOverview() {
  /* The lead runs tall down the left over two rows; four cards fill the two
     right-hand columns beside it; the sixth runs the full width beneath as a
     wide row. When the trades went from five to six, `rest` became five cards
     in a two-column stack — three rows against a two-row lead — which left the
     bottom two-thirds of the grid empty at 1024px and above. */
  const [lead, ...others] = services;
  const rest = others.slice(0, 4);
  const wide = others[4];

  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="services-heading">
      <SectionHeading
        eyebrow="What we do"
        title={
          <span id="services-heading">
            Six trades, one <em className="italic">decorator</em>.
          </span>
        }
        lead="Every job is priced and carried out by the same person who comes to look at it. Nothing is subcontracted out to whoever is free that week."
        drip
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-[1.45fr_1fr_1fr] lg:gap-6">
        {/* Lead card — image-led, spans both rows */}
        <Reveal className="lg:row-span-2">
          <Link
            href={`/services#${lead.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-[4px] bg-plaster transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
          >
            <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[5/6]">
              <Image
                src={lead.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                placeholder="blur"
                blurDataURL={blurTone(lead.tone)}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col p-7">
              <h3 className="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                {lead.title}
              </h3>
              <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                {lead.summary}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-accent">
                See the detail
                <ArrowRight
                  weight="light"
                  className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        </Reveal>

        {rest.map((service, index) => (
          <Reveal
            key={service.id}
            delay={0.06 * index}
            /* Stepped offsets — the second column starts lower than the third. */
            className={index % 2 === 0 ? "lg:mt-0" : "lg:mt-10"}
          >
            <Link
              href={`/services#${service.id}`}
              className="card-edge group flex h-full flex-col overflow-hidden rounded-[4px] border border-hairline bg-paper transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:bg-accent-wash/50"
            >
              <div className="p-7">
                <p className="font-display text-[0.8125rem] font-semibold tracking-[0.1em] text-accent tabular-nums">
                  0{index + 2}
                </p>
                <h3 className="mt-5 font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {service.summary}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[0.875rem] font-medium text-accent">
                  See the detail
                  <ArrowRight
                    weight="light"
                    className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                  />
                </span>
              </div>

              {/* These four cards are stretched to the height of the lead card
                  beside them, which spans two rows — so with the link pinned to
                  the foot by justify-between, every one of them carried four
                  inches of empty black through its middle. The photograph takes
                  that space instead: flex-1, so it is exactly as tall as the
                  gap was, and it is the trade's own picture rather than filler.
                  Image at the FOOT here against the lead card's image at the
                  head, so the grid still never repeats a card shape. */}
              <div className="relative min-h-[7rem] flex-1 overflow-hidden">
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 22vw, 100vw"
                  placeholder="blur"
                  blurDataURL={blurTone(service.tone)}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              </div>
            </Link>
          </Reveal>
        ))}

        {wide && (
          <Reveal delay={0.3} className="lg:col-span-3">
            <Link
              href={`/services#${wide.id}`}
              className="card-edge group flex flex-col justify-between gap-6 overflow-hidden rounded-[4px] border border-hairline bg-paper p-7 transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:bg-accent-wash/50 sm:flex-row sm:items-center lg:p-8"
            >
              <div className="flex items-start gap-6 lg:gap-8">
                <p className="font-display text-[0.8125rem] font-semibold tracking-[0.1em] text-accent tabular-nums">
                  0{services.length}
                </p>
                <div>
                  <h3 className="font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                    {wide.title}
                  </h3>
                  <p className="measure mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                    {wide.summary}
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 text-[0.875rem] font-medium whitespace-nowrap text-accent">
                See the detail
                <ArrowRight
                  weight="light"
                  className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                />
              </span>
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
