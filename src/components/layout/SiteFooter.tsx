import Link from "next/link";
import { ArrowUpRight, EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { site, socialLinks } from "@/config/site";
import { primaryNav, serviceLinks } from "@/lib/nav";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-plaster pt-20 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-14">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr_1fr_1.1fr] lg:gap-10">
          {/* Identity + the two conversion actions */}
          <div>
            <Wordmark className="text-[1.25rem]" />
            <p className="measure mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
              {site.years} years decorating homes and commercial premises across{" "}
              {site.serviceArea}. Clean edges, honest prices, dust sheets down before the
              first tin is opened.
            </p>

            <div className="mt-7 grid gap-3">
              <a
                href={`tel:${site.phoneHref}`}
                className="group inline-flex items-center gap-2.5 font-display text-[1.35rem] font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 hover:text-accent"
              >
                <Phone weight="light" className="size-5 text-accent" />
                {site.phone}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2.5 text-[0.95rem] text-ink-soft transition-colors duration-200 hover:text-accent"
              >
                <EnvelopeSimple weight="light" className="size-5 text-accent" />
                {site.email}
              </a>
              <p className="inline-flex items-center gap-2.5 text-[0.95rem] text-ink-soft">
                <MapPin weight="light" className="size-5 text-accent" />
                Based in {site.town}
              </p>
            </div>
          </div>

          <FooterColumn title="Pages">
            {primaryNav.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterColumn>

          <FooterColumn title="What we do">
            {serviceLinks.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Opening hours">
            {site.hours.map((slot) => (
              <li key={slot.days} className="flex justify-between gap-4 text-[0.9375rem]">
                <span className="text-ink-soft">{slot.days}</span>
                <span className="text-ink tabular-nums">{slot.time}</span>
              </li>
            ))}
            <li className="pt-3 text-[0.875rem] leading-relaxed text-ink-mute">
              {site.facts.responseTime}. {site.facts.insurance}.
            </li>
          </FooterColumn>
        </div>

        {/* Towns covered — chips, not a comma list */}
        <div className="mt-16">
          <h2 className="text-[0.75rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
            Covering {site.serviceArea}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {site.towns.map((town) => (
              <li
                key={town}
                className="rounded-full border border-ink/12 bg-paper px-3.5 py-1.5 text-[0.8125rem] text-ink-soft"
              >
                {town}
              </li>
            ))}
          </ul>
        </div>

        <hr className="tape-line mt-14 mb-8" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-ink-mute">
            © {year} {site.legalName}. {site.facts.guarantee}.
          </p>
          <div className="flex flex-wrap items-center gap-6 text-[0.8125rem]">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-ink-soft transition-colors duration-200 hover:text-accent"
              >
                {link.label} <ArrowUpRight weight="light" className="size-3.5" />
              </a>
            ))}
            <Link
              href="/privacy"
              className="text-ink-soft transition-colors duration-200 hover:text-accent"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.75rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
        {title}
      </h2>
      <ul className="mt-4 grid gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[0.9375rem] text-ink-soft transition-colors duration-200 hover:text-accent"
      >
        {children}
      </Link>
    </li>
  );
}
