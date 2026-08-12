/**
 * Formatting helpers.
 *
 * Deliberately not Intl: these strings are rendered on the server and again on
 * the client, and Intl output can differ between the two (and between Node
 * builds). A hand-rolled formatter is boring, identical everywhere, and cannot
 * cause a hydration mismatch.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** "2025-11-17" → "17 Nov 2025" */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Expected an ISO date, got: ${iso}`)
  const [, y, mo, d] = m
  return `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`
}

/** "4.9" not "4.90"; "5" not "5.0". Numbers are always mono on this site. */
export function formatRating(n: number): string {
  return String(Math.round(n * 10) / 10)
}
