import Link from 'next/link';

import { PROGRAMMED_LABELS, SERVICES } from '@content/services';

/**
 * The specification table.
 *
 * Services are a table because a table is what a buyer is going to compare
 * against their own schedule of works. Three cards with an icon and a heading
 * cannot carry the fourth column, and the fourth column — what goes on a
 * programme and what is priced as it arises — is the one that decides how the
 * work is bought.
 *
 * Sortable would be a distraction. Legible is the requirement: rules between
 * rows, a steel stripe on alternate rows, tabular figures, and a layout that
 * turns into stacked records rather than a horizontal scroll on a phone.
 */
export function SpecTable({ ground = 'concrete' }: { ground?: 'concrete' | 'graphite' }) {
  return (
    <div data-ground={ground}>
      {/* Desktop: a real table. Screen readers get the row and column
          relationships, and so does anyone copying it into a spreadsheet. */}
      <table className="hidden w-full border-collapse text-left md:table">
        <caption className="sr-only">
          Schedule of works: service, typical application, sectors, and availability under a
          programmed contract
        </caption>
        <thead>
          <tr className="border-y border-[var(--rule)]">
            <th scope="col" className="t-label w-[22%] py-4 pr-6 align-bottom">
              Service
            </th>
            <th scope="col" className="t-label w-[40%] py-4 pr-6 align-bottom">
              Typical application
            </th>
            <th scope="col" className="t-label w-[20%] py-4 pr-6 align-bottom">
              Sectors
            </th>
            <th scope="col" className="t-label w-[18%] py-4 align-bottom">
              Programmed contract
            </th>
          </tr>
        </thead>
        <tbody>
          {SERVICES.map((row) => (
            <tr
              key={row.service}
              className="row-mark border-b border-[var(--rule-soft)] odd:bg-[var(--raised)]"
            >
              <th scope="row" className="py-5 pr-6 align-top text-[15px] font-medium">
                {row.anchor ? (
                  <Link
                    href={`/capabilities#${row.anchor}`}
                    className="underline decoration-[var(--rule)] decoration-1 underline-offset-4 hover:decoration-[var(--mark)]"
                  >
                    {row.service}
                  </Link>
                ) : (
                  row.service
                )}
              </th>
              <td className="py-5 pr-6 align-top text-[15px] leading-[1.5]">{row.application}</td>
              <td className="py-5 pr-6 align-top text-[15px] leading-[1.5]">
                {row.sectors.join(' · ')}
              </td>
              <td className="py-5 align-top text-[15px] leading-[1.5]">
                {PROGRAMMED_LABELS[row.programmed]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Under 768px the same data as stacked records. A four-column table in a
          horizontal scroller is a table nobody reads. */}
      <dl className="md:hidden">
        {SERVICES.map((row) => (
          <div key={row.service} className="border-b border-[var(--rule-soft)] py-6 first:border-t first:border-[var(--rule)]">
            <dt className="t-sub">{row.service}</dt>
            <dd className="mt-3 text-[15px] leading-[1.5]">{row.application}</dd>
            <dd className="mt-4 grid grid-cols-[8.5rem_1fr] gap-x-4 gap-y-2">
              <span className="t-label">Sectors</span>
              <span className="text-[14px]">{row.sectors.join(' · ')}</span>
              <span className="t-label">Programmed</span>
              <span className="text-[14px]">{PROGRAMMED_LABELS[row.programmed]}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
