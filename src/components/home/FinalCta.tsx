import Link from "next/link";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { RollerPass } from "@/components/motion/RollerPass";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

/** The last thing on the page is the ask. Laid down by a roller pass. */
export function FinalCta() {
  return (
    <RollerPass tone="plaster">
      <section className="bg-accent py-20 lg:py-28" aria-labelledby="final-cta-heading">
        <div className="shell grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-white/80 uppercase">
              Next step
            </p>
            <h2
              id="final-cta-heading"
              className="mt-5 font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance text-white sm:text-[3.25rem] lg:text-[4rem]"
            >
              Tell us about the job.
            </h2>
            <p className="measure mt-5 text-[1.0625rem] leading-relaxed text-white/85">
              Four questions, two minutes. We come and look, then send a written price within 48
              hours. No obligation and no follow-up calls unless you ask for them.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
            <Link
              href={CTA_HREF}
              className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold whitespace-nowrap text-accent-ink transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-px active:translate-y-px active:scale-[0.98]"
            >
              {CTA_LABEL}
            </Link>
            <a
              href={`tel:${site.phoneHref}`}
              className="inline-flex h-14 items-center justify-center gap-2.5 rounded-full border border-white/40 px-8 text-base font-medium whitespace-nowrap text-white transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 active:translate-y-px active:scale-[0.98]"
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
