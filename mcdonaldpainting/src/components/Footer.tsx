import Link from 'next/link';

import { SECTORS } from '@content/sectors';
import {
  accreditation,
  coverage,
  email,
  founded,
  phone,
  registeredOffice,
  site,
  socials,
} from '@content/site';
import { Confirm } from '@/components/Confirm';
import { CookiesLink } from '@/components/CookiesLink';
import { Mark } from '@/components/Wordmark';

/**
 * The footer carries what a contractor's footer carries: the registered name,
 * the company number, the accreditation and the number that gets answered.
 *
 * The company number is not decoration. It is the one claim on this site that
 * anybody can verify in ten seconds, and putting it where a procurement officer
 * expects to find it is the cheapest credibility on the page.
 */
export function Footer() {
  const year = 2026; // Static: a footer that renders the current date forces a
  // dynamic render on every page for a number nobody reads.

  return (
    <footer data-ground="steel" className="border-t border-line">
      <div className="shell py-[var(--spacing-band)]">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <Mark size={34} className="text-bone" />
            <p className="mt-5 font-display text-[1.5rem] font-extrabold leading-none tracking-[-0.02em] text-bone">
              McDonald Painting Contractors
            </p>
            <p className="t-label mt-3">Commercial and industrial painting contractors</p>

            <a
              href={phone.href}
              data-analytics="phone"
              className="mt-8 block font-display text-[clamp(1.75rem,3vw,2.5rem)] font-extrabold leading-none tracking-[-0.02em] text-bone hover:text-hivis"
            >
              {phone.display}
            </a>
            <p className="t-label mt-3">{phone.who}</p>

            {email.confirmed ? (
              <a
                href={`mailto:${email.published}`}
                className="mt-6 block text-[15px] text-concrete underline underline-offset-4 hover:text-hivis"
              >
                {email.published}
              </a>
            ) : (
              <Confirm
                id="email"
                className="mt-6 max-w-[42ch]"
                note="Which email address the site should publish. The website is on one domain and the current published address is on another — procurement teams whitelist sending domains, so this gets settled before launch."
              />
            )}
          </div>

          <nav aria-label="Sectors" className="col-span-6 lg:col-span-3">
            <p className="t-label mb-5">Sectors</p>
            <ul className="space-y-2.5">
              {SECTORS.map((sector) => (
                <li key={sector.number}>
                  <Link
                    href={sector.href}
                    className="text-[15px] text-concrete hover:text-hivis"
                  >
                    {/* 75%, not 60%: at 60% this is 4.15:1 on the steel ground and fails AA. */}
                    <span className="tabular-nums opacity-75">{sector.number}</span>{' '}
                    {sector.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company" className="col-span-6 lg:col-span-2">
            <p className="t-label mb-5">Company</p>
            <ul className="space-y-2.5">
              {[
                { label: 'Capability schedule', href: '/capabilities' },
                { label: 'Programmed maintenance', href: '/programmed-maintenance' },
                { label: 'Compliance', href: '/compliance' },
                { label: 'Site records', href: '/projects' },
                { label: 'About', href: '/about' },
                { label: 'Enquiries', href: '/contact' },
                { label: 'Privacy', href: '/privacy' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[15px] text-concrete hover:text-hivis">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-12 lg:col-span-2">
            <p className="t-label mb-5">Follow</p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={socials.instagram}
                  rel="me noopener"
                  className="text-[15px] text-concrete hover:text-hivis"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={socials.facebook}
                  rel="me noopener"
                  className="text-[15px] text-concrete hover:text-hivis"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* The registered details. Set as a table because that is what it is. */}
        <dl className="mt-16 grid grid-cols-1 gap-x-[var(--spacing-gutter)] border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-line py-3 lg:border-b-0">
            <dt className="t-label">Registered name</dt>
            <dd className="mt-1.5 text-[15px] text-bone">{site.legalName}</dd>
          </div>
          <div className="border-b border-line py-3 lg:border-b-0">
            <dt className="t-label">Company number</dt>
            <dd className="mt-1.5 text-[15px] text-bone">{site.companyNumber}</dd>
          </div>
          <div className="border-b border-line py-3 lg:border-b-0">
            <dt className="t-label">Accreditation</dt>
            <dd className="mt-1.5 text-[15px] text-bone">
              {accreditation.name} · assessed by {accreditation.body}
            </dd>
          </div>
          <div className="border-b border-line py-3 lg:border-b-0">
            <dt className="t-label">Coverage</dt>
            <dd className="mt-1.5 text-[15px] text-bone">{coverage.wider}</dd>
          </div>
        </dl>

        {registeredOffice.confirmed && registeredOffice.lines.length ? (
          <address className="mt-6 not-italic text-[15px] text-concrete">
            {registeredOffice.lines.join(', ')}
          </address>
        ) : (
          <Confirm id="registered-office" className="mt-6 max-w-[52ch]" />
        )}

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-label">
            © {year} {site.legalName}
            {founded.year ? ` · Trading since ${founded.year}` : ''}
          </p>
          <div className="flex items-center gap-6">
            <CookiesLink />
            <p className="t-label">Registered in England and Wales</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
