import Link from 'next/link';

import { phone } from '@content/site';
import { Arrow } from '@/components/Arrow';

/**
 * One primary action per page.
 *
 * Amber on every ground. It is the only block of colour on the site, which is
 * what makes it findable without a floating button or a sticky ribbon — and
 * navy type on amber is 7.9:1, so it is legible on white and on navy alike.
 *
 * On commercial pages it is the capability statement, because a buyer who
 * downloads a PDF has given us a work email and has something to forward to
 * whoever else has to see it. On domestic pages it is the phone, because a
 * householder is not going to read a capability statement and Sean would rather
 * they rang.
 *
 * What this replaces: a floating "Get a free quote" button, a sticky ribbon, and
 * the four separate calls to action the old site put on every page.
 */

export function CapabilityStatementAction({ note }: { note?: string }) {
  return (
    <div>
      <Link
        href="/contact?enquiry=tender#capability-statement"
        data-analytics="capability-statement-cta"
        className="t-label !text-[var(--color-navy)] inline-flex items-center gap-3 bg-[var(--color-amber)] px-7 py-4 hover:bg-[#c98d18]"
      >
        Request the capability statement
        <Arrow />
      </Link>
      <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.5] text-[var(--muted)]">
        {note ??
          'A six-page PDF: what we do, at what scale, in which sectors, with the compliance detail and three site records. Generated from this site, so it says the same thing the site does.'}
      </p>
    </div>
  );
}

export function PhoneAction({ note }: { note?: string }) {
  return (
    <div>
      <a
        href={phone.href}
        data-analytics="phone"
        className="t-label !text-[var(--color-navy)] inline-flex items-center gap-3 bg-[var(--color-amber)] px-6 py-4 hover:bg-[#c98d18]"
      >
        Ring {phone.who} — {phone.display}
        <Arrow />
      </a>
      {note ? (
        <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.5] text-[var(--muted)]">{note}</p>
      ) : null}
    </div>
  );
}
