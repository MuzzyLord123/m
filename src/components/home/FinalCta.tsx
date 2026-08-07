import Link from "next/link";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { RollerPass } from "@/components/motion/RollerPass";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

/**
 * The last thing on the page is the ask, on a full-bleed band of brand orange.
 *
 * Everything here was white on #f26522 — about 2.9:1, a straight AA failure on
 * the site's single most important call to action. The band now follows the
 * same rule as every other orange surface: near-black type on the orange, and
 * the primary pill inverts to near-black with an orange label, which is the
 * highest-contrast pair the palette can make.
 */
export function FinalCta() {
  return (
    <RollerPass tone="plaster">
      <section
        className="orange-plane py-20 lg:py-28"
        aria-labelledby="final-cta-heading"
      >
        <div className="shell grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="eyebrow text-on-accent/85">
              Next step
            </p>
            <h2
              id="final-cta-heading"
              className="mt-5 font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance text-on-accent sm:text-[3.25rem] lg:text-[4rem]"
            >
              Tell us about the job.
            </h2>
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-on-accent/85">
              Four questions, two minutes. We come and look, then send a written price within 48
              hours. No obligation and no follow-up calls unless you ask for them.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Link
              href={CTA_HREF}
              className="inline-flex h-14 items-center justify-center rounded-full bg-on-accent px-8 text-base font-semibold whitespace-nowrap text-accent transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px active:translate-y-px active:scale-[0.98]"
            >
              {CTA_LABEL}
            </Link>
            <a
              href={`tel:${site.phoneHref}`}
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-on-accent/35 px-8 text-base font-medium whitespace-nowrap text-on-accent transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-on-accent/10 active:translate-y-px active:scale-[0.98]"
            >
              <Phone weight="light" className="size-5" />
              {site.phone}
            </a>
          </div>
        </div>
      </section>
    </RollerPass>
  );
}
