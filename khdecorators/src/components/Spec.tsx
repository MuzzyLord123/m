import type { SpecRow } from '@content/types'
import { isPlaceholder } from '@content/types'
import { Needed } from './Needed'

/**
 * A specification table.
 *
 * The main way this site is informative rather than decorative, and the reason
 * density sits at 5 rather than 2. Label left in the annotation register, value
 * right in body type with tabular numerals so the numbers line up down the column.
 *
 * A value still holding a `{{PLACEHOLDER}}` renders as a marked gap rather than as
 * a claim. The row stays in place so the shape of the document is right and so the
 * missing fact is visible to whoever is reviewing the page.
 */
export function Spec({
  rows,
  /** Two columns of rows on wide screens. For the longer tables. */
  dense = false,
}: {
  rows: SpecRow[]
  dense?: boolean
}) {
  return (
    <dl
      className={
        dense
          ? 'grid grid-cols-1 border-t border-rule sm:grid-cols-2 sm:gap-x-10'
          : 'grid grid-cols-1 border-t border-rule'
      }
    >
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-baseline gap-x-4 border-b border-rule py-3"
        >
          <dt className="annotation pt-1">{row.label}</dt>
          <dd className="spec-value">
            {isPlaceholder(row.value) ? <Needed token={row.value} /> : row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
