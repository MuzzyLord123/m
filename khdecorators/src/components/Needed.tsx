import { needed } from '@content/needed'

/**
 * A marked gap where a fact should be.
 *
 * Everything on this site that Kenny has not confirmed renders as one of these
 * instead of as an invented value. It is deliberately plain and deliberately
 * visible: the whole point is that nobody can read a page and mistake a gap for an
 * answer, and that whoever reviews the build can see exactly what is still owed.
 *
 * There is no red on this site to make a warning out of, so the marker is a 1px
 * ruled box in the annotation register. It reads as an empty field on a form,
 * which is what it is.
 */
export function Needed({ token, inline = true }: { token: string; inline?: boolean }) {
  // Find the register entry so the marker can say what is missing rather than
  // just that something is. Matched loosely: several placeholders share one entry.
  const bare = token.replace(/[{}]/g, '')
  const entry = needed.find(
    (n) =>
      n.token === token ||
      n.token
        .replace(/[{}]/g, '')
        .split(/\s*\/\s*/)
        .includes(bare),
  )

  const label = entry ? entry.ask : `Confirm ${bare.toLowerCase().replace(/_/g, ' ')}`

  if (inline) {
    return (
      <span
        className="annotation inline-block border border-rule px-2 py-1 align-baseline text-muted"
        title={label}
      >
        To confirm
      </span>
    )
  }

  return (
    <div className="border border-rule p-4">
      <div className="annotation">To confirm</div>
      <p className="measure mt-2 text-muted">{label}</p>
    </div>
  )
}
