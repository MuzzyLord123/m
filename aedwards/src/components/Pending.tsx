import { neededById } from '@content/needed'

/**
 * A marked placeholder, visible in development only.
 *
 * Where a fact is missing, the public site says nothing — it does not print
 * "CONFIRM: fully insured" at a customer. But a gap that is invisible while
 * you work on the site is a gap that ships. So in `npm run dev` this renders
 * the actual question, in mono, exactly where the missing fact would go, and
 * in a production build it renders nothing at all.
 *
 * The list it reads from is the same one CONTENT-NEEDED.md and
 * `npm run check:content` use: content/needed.json.
 */

export function Pending({ id }: { id: string }) {
  if (process.env.NODE_ENV === 'production') return null

  const needed = neededById(id)
  if (!needed) return null

  return (
    <p className="mono-sm mt-8 max-w-[52ch]" data-pending={id}>
      <span className="uppercase">Not published yet — {id}</span>
      <br />
      {needed.question}
    </p>
  )
}
