import type { Metadata } from 'next';

import { Band, NumberedItem, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { SheetHeader, DEFAULT_META } from '@/components/SheetHeader';
import { pageMetadata } from '@/lib/metadata';
import { STORED_ITEMS } from '@/lib/consent';
import { privacy } from '@content/copy/privacy';

export const metadata: Metadata = pageMetadata({
  title: privacy.meta.title,
  description: privacy.meta.description,
  path: '/privacy',
});

/**
 * /privacy
 *
 * The storage table is rendered from lib/consent.ts — the same array the
 * consent notice reads. It is the only way to guarantee that the page
 * describing what the site stores and the code that stores it agree with each
 * other, which is the whole point of a privacy notice.
 */
export default function PrivacyPage() {
  return (
    <>
      <SheetHeader
        eyebrow="Legal"
        title={privacy.sheet.title}
        standfirst={privacy.sheet.standfirst}
        meta={[
          { label: 'Last updated', value: privacy.updated },
          ...DEFAULT_META.slice(2),
        ]}
      />

      <Band ground="mist">
        {privacy.sections.map((section) => (
          <NumberedItem
            key={section.number}
            number={section.number}
            title={section.title}
            headingLevel="h2"
          >
            {section.body.map((para) => (
              <p key={para.slice(0, 24)} className="mb-4 max-w-[64ch] text-[15px] leading-[1.6] last:mb-0">
                {para}
              </p>
            ))}
            {'confirm' in section && section.confirm ? (
              <Confirm
                id={section.confirm}
                note={'confirmNote' in section ? section.confirmNote : undefined}
                className="mt-6 max-w-[56ch]"
              />
            ) : null}
          </NumberedItem>
        ))}
      </Band>

      <Band ground="graphite" id="cookies">
        <SectionHead title={privacy.storage.title} standfirst={privacy.storage.note} />

        <table className="mt-10 hidden w-full border-collapse text-left md:table">
          <caption className="sr-only">
            Everything this site stores on your device, what it is for and how long it lasts
          </caption>
          <thead>
            <tr className="border-y border-[var(--rule)]">
              <th scope="col" className="t-label w-[20%] py-4 pr-6 align-bottom">Name</th>
              <th scope="col" className="t-label w-[24%] py-4 pr-6 align-bottom">Type</th>
              <th scope="col" className="t-label w-[36%] py-4 pr-6 align-bottom">What it is for</th>
              <th scope="col" className="t-label w-[20%] py-4 align-bottom">Lasts</th>
            </tr>
          </thead>
          <tbody>
            {STORED_ITEMS.map((item) => (
              <tr key={item.name} className="border-b border-[var(--rule)] odd:bg-[var(--raised)]">
                <th scope="row" className="py-5 pr-6 align-top font-display text-[15px] font-bold text-[var(--ink)]">
                  {item.name}
                </th>
                <td className="py-5 pr-6 align-top text-[15px] leading-[1.5] text-[var(--muted)]">
                  {item.kind}
                  <span className="t-label mt-2 block !text-[var(--mark)]">
                    {item.category === 'essential' ? 'Always set' : 'Only if you allow it'}
                  </span>
                </td>
                <td className="py-5 pr-6 align-top text-[15px] leading-[1.5] text-[var(--muted)]">
                  {item.purpose}
                </td>
                <td className="py-5 align-top text-[15px] leading-[1.5] text-[var(--muted)]">
                  {item.expires}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="md:hidden">
          {STORED_ITEMS.map((item) => (
            <div key={item.name} className="border-b border-[var(--rule)] py-6 first:border-t">
              <dt className="font-display text-[16px] font-bold text-[var(--ink)]">{item.name}</dt>
              <dd className="t-label mt-2 !text-[var(--mark)]">
                {item.category === 'essential' ? 'Always set' : 'Only if you allow it'}
              </dd>
              <dd className="mt-3 text-[15px] leading-[1.5] text-[var(--muted)]">{item.purpose}</dd>
              <dd className="t-label mt-3">{item.kind} · {item.expires}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-[62ch] text-[15px] leading-[1.6] text-[var(--muted)]">
          To change your mind, use the <strong className="font-medium text-[var(--ink)]">Cookies</strong>{' '}
          link at the bottom of any page. It reopens the notice and the choice is remade from
          scratch.
        </p>
      </Band>
    </>
  );
}
