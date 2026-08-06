import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { RollerPass } from "@/components/motion/RollerPass";
import { services } from "@/data/services";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Services",
  description: `Interior decorating, exterior painting, wallpapering, spray finishing and commercial work across ${site.serviceArea}. What each job involves, and what it costs.`,
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-12 lg:pt-[11rem] lg:pb-16">
        <div className="shell grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              What we do
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
              Six trades, one{" "}
              <em className="inline-block pb-[0.06em] leading-[1.1] italic">decorator</em>.
            </h1>
          </div>
          <p className="measure text-[1.0625rem] leading-relaxed text-ink-soft lg:pb-3">
            The person who prices your job is the person who paints it. Nothing is passed to
            whoever happens to be free that week.
          </p>
        </div>

        {/* Jump list — the page is long and anchored */}
        <nav aria-label="Services" className="shell mt-12">
          <ul className="flex flex-wrap gap-2.5">
            {services.map((service) => (
              <li key={service.id}>
                <a
                  href={`#${service.id}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-hairline bg-paper px-4 py-2 text-[0.875rem] text-ink-soft transition-[border-color,color,background-color] duration-200 hover:border-accent hover:bg-accent-wash hover:text-accent"
                >
                  {service.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      {services.map((service, index) => {
        const section = (
          <section
            key={service.id}
            id={service.id}
            aria-labelledby={`${service.id}-heading`}
            className={`scroll-mt-28 py-16 lg:py-24 ${index % 2 === 1 ? "bg-plaster" : ""}`}
          >
            <div className="shell">
              {/* Mini-hero: photograph and lead, sides alternating down the page */}
              <div
                className={`grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* The first section sits at the fold on mobile and holds the
                    page's LCP element — it must not wait on the observer. */}
                <Reveal immediate={index === 0}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-plaster-deep">
                    <Image
                      src={service.image}
                      alt=""
                      fill
                      /* The first service photograph is this page's LCP
                         element on mobile — it must not wait its turn. */
                      priority={index === 0}
                      sizes="(min-width: 1024px) 45vw, 100vw"
                      placeholder="blur"
                      blurDataURL={blurTone(service.tone)}
                      className="object-cover"
                    />
                  </div>
                </Reveal>

                <Reveal delay={index === 0 ? 0 : 0.06} immediate={index === 0}>
                  <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute tabular-nums uppercase">
                    0{index + 1}
                  </p>
                  <h2
                    id={`${service.id}-heading`}
                    className="mt-4 font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] text-ink sm:text-[2.5rem]"
                  >
                    {service.title}
                  </h2>
                  <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">
                    {service.lead}
                  </p>

                  <ul className="mt-7 grid gap-3">
                    {service.scope.map((line) => (
                      <li key={line} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                        <Check weight="light" className="mt-0.5 size-[1.15rem] shrink-0 text-accent" />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={CTA_HREF}
                    className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-semibold whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-bright active:translate-y-px active:scale-[0.98]"
                  >
                    {CTA_LABEL}
                  </Link>
                </Reveal>
              </div>

              {/* FAQ — native disclosure, no JavaScript needed to open it */}
              <div className="mt-12 lg:mt-16">
                <h3 className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
                  Questions we get asked
                </h3>
                <div className="mt-4 border-t border-hairline">
                  {service.faqs.map((faq) => (
                    <details key={faq.question} className="group border-b border-hairline">
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.0625rem] font-medium text-ink transition-colors duration-200 hover:text-accent [&::-webkit-details-marker]:hidden">
                        {faq.question}
                        <Plus
                          weight="light"
                          className="mt-0.5 size-5 shrink-0 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:rotate-45"
                        />
                      </summary>
                      <p className="measure pb-5 text-[0.9375rem] leading-relaxed text-ink-soft">
                        {faq.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

        // One roller pass across the middle of the page, not on every section.
        return index === 2 ? <RollerPass key={service.id}>{section}</RollerPass> : section;
      })}
    </>
  );
}
