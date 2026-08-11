import type { Metadata } from "next";
import { site } from "@/config/site";
import { POLICY_UPDATED, policySections } from "@/data/privacy";
import { previewMode } from "@/config/preview";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${site.name} does with the details you send through this website, and what we do not do with them.`,
  alternates: { canonical: "/privacy" },
  /* This page sets its own robots rule, which OVERRIDES the site-wide one in
     layout.tsx rather than merging with it — so a hard `index: true` here would
     have made /privacy the one indexable page on a preview build that is
     noindex everywhere else. It only mattered once /privacy was unlocked in
     preview mode; before that the middleware never served it. Follows the same
     flag as everything else now. */
  robots: previewMode ? { index: false, follow: false } : { index: true, follow: true },
};



export default function PrivacyPage() {
  return (
    <section className="pt-[7.5rem] pb-24 lg:pt-[11rem] lg:pb-32">
      <div className="shell">
        <p className="eyebrow text-ink-mute">
          Privacy
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.25rem]">
          What we do with your details.
        </h1>
        <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
          Written in plain English, because a privacy notice nobody can read is not really a
          privacy notice. If anything here is unclear, ring {site.phone} and ask.
        </p>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.65fr_1fr] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-ink-mute">
              On this page
            </p>
            <ul className="mt-4 grid gap-2.5">
              {policySections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${slug(section.heading)}`}
                    className="text-[0.9375rem] text-ink-soft transition-colors duration-200 hover:text-accent"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid gap-10">
            {policySections.map((section) => (
              <section key={section.heading} id={slug(section.heading)} className="scroll-mt-32">
                <div className="tape-line" aria-hidden="true" />
                <h2 className="mt-6 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                  {section.heading}
                </h2>
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="measure mt-4 text-[1rem] leading-relaxed text-ink-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <p className="text-[0.875rem] text-ink-mute">
              Last updated {POLICY_UPDATED}. {site.legalName}, {site.town}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
