import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Images, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import { site } from "@/config/site";
import { photographCount, projects } from "@/data/projects";
import { previewMode } from "@/config/preview";

export const metadata: Metadata = {
  title: "Not built yet",
  robots: { index: false, follow: false },
};

/**
 * What a prospect sees when they open a page that is not part of the preview.
 *
 * It is deliberately a proper page rather than an error. Somebody is being
 * shown this to decide whether to commission the rest of the site, so it should
 * read as "here is what else there is" and not as "something went wrong" — no
 * 404 styling, no apology, and a way back into the two galleries that ARE built.
 *
 * WORDING MATTERS HERE. It used to say the page "is part of the full build",
 * which reads as though the whole site exists and access is being withheld —
 * exactly the wrong impression when the rest has not been commissioned. Every
 * line now says the same thing: these pages have not been submitted to build
 * yet. Keep it that way if this copy is edited.
 *
 * Reached by a rewrite from src/middleware.ts, so the address bar still shows
 * the page that was asked for.
 */
export default function PreviewLockedPage() {
  /* This route outlives the preview unless it is told not to. The middleware
     returns early once the gate is off, so nothing rewrites to here — but the
     page itself stayed a live 200 telling visitors, in the client's name, that
     their site is unfinished and listing which pages "have not been submitted
     to build yet". It is also absent from ALL_PAGES, so the not-built handling
     does not cover it either. It exists only while the preview does. */
  if (!previewMode) notFound();

  const rest = [
    { label: "Services", note: "The six trades, in detail, with the FAQs customers actually ask" },
    { label: "About", note: "Who turns up, how the work is run, what the guarantee covers" },
    { label: "Quote", note: "A four-step enquiry form that emails the job straight through" },
    { label: "Contact", note: "Phone, email, hours and a map of the area covered" },
    { label: "Advice", note: "Articles on cost, colour and materials, written to be found on Google" },
  ];

  return (
    /* data-preview-locked is what audit:content looks for. A grep on the
       headline broke the safety net the moment the headline was reworded. */
    <section data-preview-locked="true" className="pt-[9rem] pb-24 lg:pt-[13rem] lg:pb-32">
      <div className="shell">
        <p className="eyebrow text-accent">Preview</p>

        <h1 className="mt-5 max-w-4xl font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem] lg:text-[4.25rem]">
          This page has not been{" "}
          <em className="inline-block pb-[0.06em] leading-[1.1] italic">built</em> yet.
        </h1>

        <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
          What you are looking at is a live preview: the home page and both galleries, built
          properly and running on the real thing. This page is part of the full site build, which
          has not been submitted to build yet.
        </p>

        {/* The two that ARE built, as the obvious next click. */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          {[
            {
              href: "/work",
              icon: Images,
              title: "The photo gallery",
              note: `${photographCount} photographs across ${projects.length} projects`,
            },
            {
              href: "/videos",
              icon: VideoCamera,
              title: "The video gallery",
              note: "Films from site, desktop and mobile",
            },
          ].map(({ href, icon: Icon, title, note }) => (
            <Link
              key={href}
              href={href}
              className="card-edge group flex flex-col justify-between gap-8 overflow-hidden rounded-[4px] border border-hairline bg-paper p-7 transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-accent/40 hover:bg-accent-wash/50"
            >
              <Icon weight="light" className="size-8 text-accent" />
              <span>
                <span className="block font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {title}
                </span>
                <span className="mt-2 block text-[0.9375rem] leading-relaxed text-ink-soft">
                  {note}
                </span>
                <span className="mt-4 inline-flex items-center gap-2 text-[0.875rem] font-medium text-accent">
                  Have a look
                  <ArrowRight
                    weight="light"
                    className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                  />
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* What the rest of the build contains — the reason this page exists. */}
        <div className="mt-16 lg:max-w-3xl">
          <p className="eyebrow text-ink-mute">The rest of the full site build</p>
          <div className="tape-line mt-3" aria-hidden="true" />
          <ul className="mt-2">
            {rest.map((item, index) => (
              <li
                key={item.label}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-hairline/60 py-4"
              >
                <span className="figures w-6 shrink-0 text-[0.6875rem] font-semibold text-ink-mute">
                  0{index + 1}
                </span>
                <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                  {item.label}
                </span>
                <span className="text-[0.9375rem] text-ink-mute">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-[0.9375rem] text-ink-mute">
          Questions about any of it —{" "}
          <a
            href={`tel:${site.phoneHref}`}
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            {site.phone}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
