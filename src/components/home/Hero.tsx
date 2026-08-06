import Image from "next/image";
import Link from "next/link";
import { Phone, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { HeroHeadline } from "@/components/motion/HeroHeadline";
import { Reveal } from "@/components/motion/Reveal";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

export function Hero() {
  return (
    <section className="relative pt-[6.5rem] pb-16 lg:pt-[9rem] lg:pb-24">
      <div className="shell">
        <div className="grid items-end gap-y-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-x-12">
          {/* Type column */}
          <div className="relative z-10 lg:pb-10">
            <Reveal immediate>
              <p className="flex items-center gap-3 text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                Painter &amp; decorator · {site.town}
              </p>
            </Reveal>

            <HeroHeadline
              /* Two considerations set this scale. The column narrows at lg when
                 the photograph takes its half, so the size steps back down
                 there to hold two lines. And the base size is 2.875rem rather
                 than 3.25rem because at 412px the fallback italic — which is
                 wider than the real face — wrapped "done properly." onto a
                 third line and snapped back when the font swapped in, which
                 was the entire source of this page's 0.041 CLS. */
              className="mt-6 font-display text-[2.875rem] leading-[1] font-semibold tracking-[-0.035em] text-ink sm:text-[4.25rem] lg:text-[3.5rem] xl:text-[4.5rem] 2xl:text-[5.25rem]"
              lines={[
                "Decorating,",
                // Italic of the same family, never a second typeface. The extra
                // leading and padding keep the descenders on "properly" clear.
                <em key="line-2" className="inline-block pb-[0.08em] leading-[1.1] italic">
                  done properly.
                </em>,
              ]}
            />

            <Reveal delay={0.32} immediate>
              <p className="measure mt-7 text-[1.0625rem] leading-relaxed text-ink-soft sm:text-[1.125rem]">
                {site.years} years on the tools across {site.serviceArea}. Sheets down, edges
                cut by hand, price agreed before we start.
              </p>
            </Reveal>

            <Reveal delay={0.4} immediate>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={CTA_HREF}
                  className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-base font-semibold whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-bright active:translate-y-px active:scale-[0.98]"
                >
                  {CTA_LABEL}
                </Link>
                <a
                  href={`tel:${site.phoneHref}`}
                  className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-ink/20 px-7 text-base font-medium whitespace-nowrap text-ink transition-[border-color,color,background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-accent hover:bg-accent-wash hover:text-accent active:translate-y-px active:scale-[0.98]"
                >
                  <Phone weight="light" className="size-5 text-accent" />
                  {site.phone}
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.48} immediate>
              <p className="mt-7 flex max-w-md items-center gap-2.5 text-[0.875rem] text-ink-mute">
                <ShieldCheck weight="light" className="size-5 shrink-0 text-accent" />
                {site.facts.guarantee} · {site.facts.insurance} · {site.facts.responseTime}
              </p>
            </Reveal>
          </div>

          {/* Work photograph, bleeding off the right edge of the page */}
          <div className="relative lg:-mr-[var(--shell-pad)]">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[4px] bg-plaster lg:aspect-[5/4]">
              <Image
                src="/work/hero.jpg"
                alt="Open-plan kitchen extension with a vaulted ceiling and roof lights, decorated throughout"
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                placeholder="blur"
                blurDataURL={blurTone("#88847c")}
                className="object-cover"
              />
            </div>

            {/* Overlapping card — the asymmetry that stops this reading as a stock hero */}
            <div className="relative z-10 -mt-10 ml-4 w-fit rounded-[4px] bg-paper px-6 py-5 shadow-lift sm:-mt-14 sm:ml-8 lg:-mt-20 lg:ml-8">
              <p className="font-display text-[2.5rem] leading-none font-semibold tracking-[-0.03em] text-ink">
                {site.years}
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">
                years decorating in
                <br />
                {site.serviceArea}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
