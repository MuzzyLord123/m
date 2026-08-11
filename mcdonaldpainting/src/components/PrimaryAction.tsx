import Link from 'next/link';

import { phone } from '@content/site';
import { Arrow } from '@/components/Arrow';

/**
 * One primary action per page.
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

export function CapabilityStatementAction({
  note,
  ground = 'graphite',
}: {
  note?: string;
  ground?: 'graphite' | 'concrete';
}) {
  const onGraphite = ground === 'graphite';

  return (
    <div>
      <Link
        href="/contact?enquiry=tender#capability-statement"
        data-analytics="capability-statement-cta"
        className={`t-label inline-flex items-center gap-3 px-6 py-4 ${
          onGraphite
            ? '!text-graphite bg-hivis hover:bg-bone'
            : '!text-concrete bg-graphite hover:bg-steel'
        }`}
      >
        Request the capability statement
        <Arrow />
      </Link>
      <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.5] opacity-80">
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
        className="t-label !text-graphite inline-flex items-center gap-3 bg-hivis px-6 py-4 hover:bg-bone"
      >
        Ring {phone.who} — {phone.display}
        <Arrow />
      </a>
      {note ? (
        <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.5] opacity-80">{note}</p>
      ) : null}
    </div>
  );
}
