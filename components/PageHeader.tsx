import type { PageHeaderCopy } from '@/content/pages'
import { Tape } from './Tape'

/**
 * The masthead on every page except home, where the hero does the job.
 *
 * The painted bar across the top is the page's swatch colour — the same one
 * the desktop underline slides to and the mobile menu paints beside that page.
 * Three places, one colour, so you always know which page you are on.
 */
export function PageHeader({ copy }: { copy: PageHeaderCopy }) {
  return (
    <header className="bg-paper">
      <span aria-hidden className="block h-[10px] w-full" style={{ backgroundColor: copy.colour }} />

      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 px-5 pt-12 pb-10 md:px-8 md:pt-20 md:pb-16">
        <div className="col-span-12 md:col-span-7">
          <Tape>{copy.eyebrow}</Tape>
          <h1 className="mt-6 text-[clamp(2.1rem,5.6vw,3.8rem)] text-ink">{copy.heading}</h1>
        </div>
        <p className="col-span-12 mt-6 max-w-[52ch] self-end font-body text-ink-soft md:col-span-4 md:col-start-9 md:mt-0">
          {copy.intro}
        </p>
      </div>
    </header>
  )
}
