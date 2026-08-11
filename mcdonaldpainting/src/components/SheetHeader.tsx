import { accreditation, coverage, phone, site } from '@content/site';
import { SECTORS } from '@content/sectors';

/**
 * The sheet header.
 *
 * Every page opens with one, and it is the device that sets the register for
 * the whole site: a page title in display type on graphite, with a metadata
 * table down the right in label type and rules. It is the cover sheet of a
 * tender submission, not a hero.
 *
 * The four default rows — coverage, sectors, accreditation, company number —
 * are the four things a buyer landing from a search wants to establish before
 * reading anything. They appear on every page for the same reason a document
 * repeats its reference number on every sheet: whichever page someone is sent,
 * the header answers the same questions.
 */

export type MetaRow = { label: string; value: string };

export const DEFAULT_META: MetaRow[] = [
  { label: 'Coverage', value: 'United Kingdom' },
  { label: 'Sectors', value: `${SECTORS.length}` },
  { label: 'Accreditation', value: `${accreditation.name} · ${accreditation.body}` },
  { label: 'Company no.', value: site.companyNumber },
];

export function SheetHeader({
  eyebrow,
  title,
  standfirst,
  meta = DEFAULT_META,
  children,
}: {
  eyebrow?: string;
  title: string;
  standfirst?: string;
  meta?: MetaRow[];
  /** The primary action for the page. One per page, no more. */
  children?: React.ReactNode;
}) {
  return (
    <header data-ground="graphite" className="pt-28 pb-[var(--spacing-band)] md:pt-36">
      <div className="shell">
        <div className="relative grid12 gap-y-10">
          {/* Registration ticks and the sheet reference. Decorative — the same
              information is in the metadata table beside them, in text. */}
          <div className="sheet-marks hidden lg:block" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="sheet-reference t-label hidden lg:block" aria-hidden>
            {site.legalName} · {site.companyNumber}
          </p>

          <div className="col-span-12 lg:col-span-8">
            {eyebrow ? (
              <p className="t-label mb-6" data-reveal="now">
                <span className="reveal-type">{eyebrow}</span>
              </p>
            ) : null}

            <h1 className="t-display" data-reveal="now">
              {/* Split on words so the clip reveal staggers across the line
                  rather than lifting the whole block at once. */}
              {title.split(' ').map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="reveal-type inline-block"
                  style={{ '--stagger': `${i * 60}ms` } as React.CSSProperties}
                >
                  {word}
                  {i < title.split(' ').length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {standfirst ? (
              <p className="t-lead mt-8 max-w-[62ch] text-concrete">{standfirst}</p>
            ) : null}

            {children ? <div className="mt-10">{children}</div> : null}
          </div>

          {/* The metadata table. 4 of 12 columns, rules top and between. */}
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <dl className="border-t border-line">
              {meta.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-line py-3"
                >
                  <dt className="t-label pt-0.5">{row.label}</dt>
                  <dd className="text-[15px] leading-[1.4] text-bone">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="t-label mt-4">{coverage.localLong}</p>

            {/* The contact box. A tender cover sheet carries one, and without
                it this column is a short table above a lot of nothing —
                which on a page arguing for density is the wrong signal. */}
            <div className="mt-10 border-t border-line pt-5">
              <p className="t-label">Enquiries</p>
              <a
                href={phone.href}
                data-analytics="phone"
                className="mt-2 block font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.02em] text-bone hover:text-hivis"
              >
                {phone.display}
              </a>
              <p className="t-label mt-2">{phone.who}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
