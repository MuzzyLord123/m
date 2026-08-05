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
  const [lead, ...rest] = services;

  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="services-heading">
      <SectionHeading
        eyebrow="What we do"
        title={
          <span id="services-heading">
            Five trades, one <em className="italic">decorator</em>.
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
              className="group flex h-full flex-col justify-between rounded-[4px] border border-hairline bg-paper p-7 transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:bg-accent-wash/50"
            >
              <div>
                <p className="font-display text-[0.8125rem] font-semibold tracking-[0.1em] text-ink-mute tabular-nums">
                  0{index + 2}
                </p>
                <h3 className="mt-5 font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {service.title}
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {service.summary}
                </p>
              </div>
              <span className="mt-7 inline-flex items-center gap-2 text-[0.875rem] font-medium text-accent">
                See the detail
                <ArrowRight
                  weight="light"
                  className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
