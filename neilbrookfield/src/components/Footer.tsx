import Link from 'next/link';

import { PhoneLink } from '@/components/Phone';
import { cta, nav, site, FOUNDED } from '@content/site';

/**
 * No year is printed anywhere here. A hardcoded year goes stale in January and
 * a computed one on a statically built page goes stale the same way — so the
 * footer says "since 1990" and lets the reader do the arithmetic.
 */
export function Footer() {
  return (
    <footer data-tone="night" className="gutter-x border-t border-t-brass/55 pt-16 pb-12">
      <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-12 lg:flex-row lg:justify-between">
        <div className="max-w-[34ch]">
          <p className="font-[family-name:var(--font-display)] text-2xl leading-tight font-light">
            {site.name}
          </p>
          <p className="secondary mt-4 text-base leading-relaxed">
            Decorator in Chester. Hand-painted kitchens and furniture, and decorating inside and
            out across Cheshire. Trading on my own account since {FOUNDED}.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-3">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="eyebrow text-linen hover:text-brass">
              {item.label}
            </Link>
          ))}
          <Link href={cta.href} className="eyebrow text-linen hover:text-brass">
            {cta.label}
          </Link>
        </nav>

        <div className="flex flex-col gap-4">
          <p className="eyebrow">Ring me</p>
          <PhoneLink withIcon className="text-[1.35rem]" />
          <p className="secondary text-sm">Chester and across Cheshire.</p>
        </div>
      </div>

      <hr className="hairline mt-16 mb-6" />

      <p className="eyebrow eyebrow-muted">© {site.name}</p>
    </footer>
  );
}
