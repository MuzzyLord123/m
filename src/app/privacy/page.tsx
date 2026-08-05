import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${site.name} does with the details you send through this website, and what we do not do with them.`,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const sections = [
  {
    heading: "What we collect",
    body: [
      "If you fill in the quote form or ask for a site visit, we collect your name, phone number, email address, the town or address of the job, and whatever you write in the message box. That is all we ask for and all we keep.",
      "We do not run analytics on this site. There is no tracking pixel, no advertising tag, and no cookie set by us.",
    ],
  },
  {
    heading: "What we do with it",
    body: [
      "We use your details to price your job, arrange a visit and carry out the work. Your enquiry is emailed to us and stored in our email account.",
      "We never sell your details, never pass them to anyone for marketing, and never add you to a mailing list. You will not hear from us again after a quote unless you get in touch.",
    ],
  },
  {
    heading: "Who else touches it",
    body: [
      "Emails from this website are delivered by Resend, an email provider, which processes the contents of your enquiry in order to send it. Their privacy notice is at resend.com/legal/privacy-policy.",
      "The live chat is provided by Tawk.to. If you open a chat, your messages and basic connection details are handled by them. It loads only when you choose to open it — the script is not on the page until then.",
      "The map on the contact page is an embed from Google Maps and loads only when you scroll to it. Google may set cookies through that embed. Nothing plays from YouTube until you press play on a video.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "Quote enquiries are kept for two years, so that we can look back at what was agreed if you come back to us. Records relating to work we have carried out are kept for six years, which is what our insurer and HMRC require.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Ring or email and we will do it — there is no form to fill in.",
      "If you are not happy with how we have handled your details you can complain to the Information Commissioner's Office at ico.org.uk.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <section className="pt-[7.5rem] pb-24 lg:pt-[11rem] lg:pb-32">
      <div className="shell">
        <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
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
            <p className="text-[0.75rem] font-semibold tracking-[0.12em] text-ink-mute uppercase">
              On this page
            </p>
            <ul className="mt-4 grid gap-2.5">
              {sections.map((section) => (
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
            {sections.map((section) => (
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
              {site.legalName}, {site.town}. Contact {site.email} or {site.phone} about anything
              on this page.
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
