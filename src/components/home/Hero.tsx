import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { HeroHeadline } from "@/components/motion/HeroHeadline";
import { Reveal } from "@/components/motion/Reveal";
import { blurTone } from "@/lib/images";
import { photographCount } from "@/data/projects";
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
              {/* Was the guarantee, the cover and the response time, all three —
                  the same three the stat rail below now carries in full. A line
                  that repeats the band beneath it is noise, so this keeps only
                  what the rail does not say: what happens after you ask. */}
              <p className="mt-7 flex max-w-md items-center gap-2.5 text-[0.875rem] text-ink-mute">
                <ShieldCheck weight="light" className="size-5 shrink-0 text-accent" />
                Free written quote, itemised, back within 48 hours.
              </p>
            </Reveal>
          </div>

          {/* Work photograph, bleeding off the right edge of the page.
              -mr-[var(--shell-pad)] alone did NOT reach the edge: the shell is
              also capped at --spacing-shell, so above 88rem there is a centring
              gutter outside the padding that the negative margin never crossed,
              and the photograph stopped ~16px short at 1440 — near enough to
              the edge to read as a mistake rather than a bleed. Both are taken
              off here. Any overshoot from the scrollbar's share of 100vw is
              caught by overflow-x: clip on the body. */}
          <div className="relative lg:[margin-right:calc(-1*(var(--shell-pad)+max(0px,(100vw-var(--spacing-shell))/2)))]">
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

            {/* Overlapping card — the asymmetry that stops this reading as a
                stock hero. It used to hold "10 / years decorating in
                Merseyside…", which the stat rail below now states outright, so
                it says the one thing only this element can: what the
                photograph behind it actually is. */}
            <Link
              href="/work"
              className="card-edge group relative z-10 -mt-10 ml-4 block w-fit max-w-[16rem] rounded-[4px] bg-paper px-6 py-5 shadow-lift sm:-mt-14 sm:ml-8 lg:-mt-20 lg:ml-8"
            >
              <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-accent uppercase">
                The job above
              </p>
              <p className="mt-2.5 font-display text-[1.125rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                Kitchen extension, bare shell to finished
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-[0.8125rem] text-ink-soft">
                See the job
                <ArrowRight
                  weight="light"
                  aria-hidden="true"
                  className="size-4 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                />
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* The fold used to end in a third of a screen of empty black: the type
          column finishes well above the photograph and nothing carried the eye
          across the bottom of the viewport. This is the band that belongs
          there — four figures a customer is actually weighing, ruled off, edge
          to edge, with the count taken from the photographs on the site rather
          than asserted. */}
      <div className="mt-14 border-y border-hairline bg-accent-wash/40 lg:mt-20">
        <Reveal>
          {/* Borders per cell rather than divide-*, which adds a top border to
              everything but the first child — in a two-up grid that draws a
              rule above the SECOND cell of row one and leaves a half-width
              stray at the foot. Two columns on a phone, four on a desktop,
              ruled on the edges that actually separate them. */}
          <dl className="shell grid grid-cols-2 lg:grid-cols-4">
            {[
              { figure: site.years, label: "years on the tools" },
              { figure: `${photographCount}`, label: "photographs of real jobs" },
              { figure: "2yr", label: "workmanship guarantee" },
              { figure: "£2m", label: "public liability cover" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={[
                  "border-hairline py-7",
                  index % 2 === 1 ? "border-l pl-6" : "",
                  index >= 2 ? "border-t lg:border-t-0" : "",
                  index > 0 ? "lg:border-l lg:pl-8" : "lg:pl-0",
                  "lg:pr-8",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-[2rem] leading-none font-semibold tracking-[-0.03em] text-accent tabular-nums lg:text-[2.5rem]">
                    {stat.figure}
                  </span>
                  <span className="mt-2 block text-[0.8125rem] leading-snug text-ink-soft">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
