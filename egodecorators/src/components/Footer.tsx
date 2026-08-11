import Link from 'next/link';
import { currentYear, email, nav, phone, profiles, site } from '@content/site';
import { Band, Container } from '@/components/Band';
import { Split } from '@/components/Split';

/**
 * The footer.
 *
 * Three faults from the old site are fixed here by construction rather than by
 * remembering:
 *
 *   · the year is computed, not typed. The old footer said 2022 for four years.
 *   · the email comes from one constant that is asserted to be a complete
 *     address. The old footer rendered `info@egodecorators` with no .com, so
 *     every mailto on the site failed silently.
 *   · every off-site link says where it actually goes. The old site had an icon
 *     labelled "google" that opened Yell, and its real Instagram — far and away
 *     its best source of photographs — on an unlabelled icon next to it.
 */
export function Footer() {
  const year = currentYear();

  const links = [
    profiles.instagram,
    profiles.yell,
    ...(profiles.google ? [profiles.google] : []),
  ];

  return (
    <Band tone="ink" as="footer" className="pb-8">
      <Container>
        <Split
          left={
            <div>
              <p className="meta">Ego Decorators</p>
              <p className="display-sm mt-3">
                <a href={phone.href} className="link-seam">
                  {phone.display}
                </a>
              </p>
              <p className="mt-3">
                <a href={email.href} className="link-seam">
                  {email.address}
                </a>
              </p>
              <p className="meta mt-6">
                {site.base} · {site.areaServed.join(', ')}
              </p>
            </div>
          }
          right={
            <div>
              <nav aria-label="Footer">
                <ul className="columns-2 gap-6">
                  {[...nav, { href: '/contact', label: 'Contact' }].map((item) => (
                    <li key={item.href} className="mb-2">
                      <Link href={item.href} className="link-seam">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="link-seam meta"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                      {'handle' in link && link.handle ? ` — ${link.handle}` : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          }
        />

        <hr className="hair mt-band" />
        <p className="meta mt-4">
          © {year} Ego Decorators · Painters, decorators and exterior repair, {site.base}
        </p>
      </Container>
    </Band>
  );
}
