import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone } from "@phosphor-icons/react/dist/ssr";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { featuredProjects } from "@/data/projects";
import { blurTone } from "@/lib/images";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/**
 * A 404 that still tries to win the job.
 *
 * The default Next.js 404 is a black-on-white line of system text, which on a
 * site whose whole argument is "we finish things properly" reads as the one
 * unfinished corner. This one carries the site's own type, offers the four
 * routes a lost visitor actually wants, and keeps the phone number in reach —
 * a mistyped URL should not cost an enquiry.
 */
export default function NotFound() {
  const project = featuredProjects[0];

  return (
    <section className="pt-[8rem] pb-24 lg:pt-[12rem] lg:pb-32">
      <div className="shell grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
            Error 404
          </p>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.25rem] lg:text-[4rem]">
            That page has been{" "}
            <em className="inline-block pb-[0.06em] leading-[1.1] italic">painted over</em>.
          </h1>
          <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
            The link is wrong or the page has moved. Nothing is broken — here is the way back.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={CTA_HREF}
              className="inline-flex h-13 items-center rounded-full bg-accent px-7 text-base font-semibold whitespace-nowrap text-on-accent shadow-accent transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {CTA_LABEL}
            </Link>
            <a
              href={`tel:${site.phoneHref}`}
              className="inline-flex h-13 items-center gap-2 rounded-full border border-ink/20 px-6 text-base font-medium whitespace-nowrap text-ink transition-[border-color,color] duration-200 hover:border-accent hover:text-accent"
            >
              <Phone weight="light" className="size-[1.15rem] text-accent" />
              {site.phone}
            </a>
          </div>

          <ul className="mt-10 grid gap-px overflow-hidden rounded-[8px] border border-hairline bg-hairline sm:grid-cols-2">
            {[
              { href: "/work", label: "See finished jobs", note: "Eleven projects, before and after" },
              { href: "/services", label: "What we do", note: "Six trades, one decorator" },
              { href: "/about", label: "Who you are hiring", note: "The person who prices it paints it" },
              { href: "/contact", label: "Get in touch", note: "Phone, email and where we cover" },
            ].map((link) => (
              <li key={link.href} className="bg-paper">
                <Link
                  href={link.href}
                  className="group flex h-full items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-accent-wash"
                >
                  <span>
                    <span className="block text-[0.9375rem] font-semibold text-ink">{link.label}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-ink-mute">
                      {link.note}
                    </span>
                  </span>
                  <ArrowRight
                    weight="light"
                    className="size-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-plaster max-lg:hidden">
          <Image
            src={project.images[0].src}
            alt={project.images[0].alt}
            fill
            sizes="45vw"
            placeholder="blur"
            blurDataURL={blurTone(project.images[0].tone)}
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
