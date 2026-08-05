import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { VideoFacade } from "@/components/media/VideoFacade";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: `${site.years} years decorating across ${site.serviceArea}. Who turns up, how we work, and what the guarantee actually covers.`,
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "The preparation is the job",
    body: "Filling, sanding, caulking and masking take longer than painting and cost more in labour. They are itemised on every quote so you can see exactly what you are paying for, rather than finding out later what was skipped.",
  },
  {
    title: "One price, agreed first",
    body: "The number on the quote is the number on the invoice. If we find something behind the wallpaper that changes the job, we stop and tell you before carrying on, and you decide.",
  },
  {
    title: "Your house stays yours",
    body: "Sheets down before a tin is opened, furniture moved and covered, floors protected, and the room put back and hoovered at the end of every day. You should be able to use your house while we are in it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="pt-[7.5rem] pb-12 lg:pt-[11rem] lg:pb-16">
        <div className="shell grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              About
            </p>
            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4rem]">
              The person quoting is the person{" "}
              <em className="inline-block pb-[0.06em] leading-[1.1] italic">painting</em>.
            </h1>
            <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
              {site.name} has been decorating homes and commercial premises around {site.town}{" "}
              for {site.years} years. Small enough that you get the same decorator every day,
              established enough to carry {site.facts.insurance.toLowerCase()} and stand behind a{" "}
              {site.facts.guarantee.toLowerCase()}.
            </p>
          </div>

          <Reveal delay={0.08}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] bg-plaster">
              <Image
                src="/work/about-portrait.png"
                alt="The Paint Man on site, cutting in a ceiling edge by hand"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                placeholder="blur"
                blurDataURL={blurTone("#c3ccc9")}
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="shell pb-16 lg:pb-24" aria-labelledby="video-heading">
        <SectionHeading
          eyebrow="Meet the decorator"
          title={<span id="video-heading">Two minutes on how we work.</span>}
          lead="Filmed on a job in Frodsham. No script, no drone shots, just what a week on site actually looks like."
        />
        <Reveal className="mt-10">
          <VideoFacade
            id="aqz-KE-bpKQ"
            title="A week on site: hall, stairs and landing"
            poster="/work/video-poster.png"
            tone="#b9ae9f"
            caption="Replace this with the client's own film — the component takes any YouTube ID."
            className="mx-auto max-w-4xl"
          />
        </Reveal>
      </section>

      <section className="bg-plaster py-20 lg:py-28" aria-labelledby="principles-heading">
        <div className="shell">
          <SectionHeading
            eyebrow="How we work"
            title={<span id="principles-heading">Three things we do not budge on.</span>}
          />
          <ol className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-10">
            {principles.map((principle, index) => (
              <Reveal as="li" key={principle.title} delay={index * 0.07}>
                <div className="tape-line" aria-hidden="true" />
                <p className="mt-6 font-display text-[0.8125rem] font-semibold tracking-[0.1em] text-accent tabular-nums">
                  0{index + 1}
                </p>
                <h3 className="mt-4 font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                  {principle.title}
                </h3>
                <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {principle.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="font-display text-[2rem] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-ink sm:text-[2.5rem]">
              Want to see the work in person?
            </h2>
            <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">
              We can usually put you in touch with a customer near you who will let you look at
              a finished job. Ask when we come to quote.
            </p>
          </div>
          <Link
            href={CTA_HREF}
            className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-base font-semibold whitespace-nowrap text-white shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-deep active:translate-y-px active:scale-[0.98]"
          >
            {CTA_LABEL}
          </Link>
        </div>
      </section>
    </>
  );
}
