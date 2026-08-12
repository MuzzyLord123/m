import Link from 'next/link';

import { Band } from '@/components/Band';
import { SectorIndexList } from '@/components/SectorIndex';
import { SheetHeader } from '@/components/SheetHeader';
import { phone } from '@content/site';

/**
 * Nothing should reach this page — the redirect map in next.config.mjs covers
 * every URL the old WordPress site is known to have had, and MIGRATION.md §1 is
 * the crawl that finds the rest.
 *
 * When something does, it gets the sector index rather than an apology, because
 * whoever arrived was looking for one of eight things.
 */
export default function NotFound() {
  return (
    <>
      <SheetHeader
        eyebrow="404"
        title="That page has moved"
        standfirst="The site was rebuilt and the addresses changed with it. Everything the old site had is here somewhere — the eight sectors below are the fastest way to it."
      >
        <a
          href={phone.href}
          data-analytics="phone"
          className="t-label !text-[var(--color-navy)] inline-flex items-center gap-3 bg-[var(--color-amber)] px-6 py-4 hover:bg-[#c98d18]"
        >
          Or ring {phone.who} — {phone.display}
        </a>
      </SheetHeader>

      <Band ground="paper">
        <SectorIndexList ground="paper" />
        <p className="mt-10">
          <Link href="/" className="t-label underline decoration-1 underline-offset-4">
            Back to the front page
          </Link>
        </p>
      </Band>
    </>
  );
}
