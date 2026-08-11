/**
 * The spam traps' shared vocabulary.
 *
 * Separate from src/lib/enquiry.ts because the form is a client component and
 * needs these names, while enquiry.ts reads environment variables and delivers
 * mail. Nothing that touches the environment should be reachable from the
 * browser bundle, even harmlessly.
 */

/** Field name for the honeypot. Plausible to a bot, off-screen to a human. */
export const HONEYPOT_FIELD = 'website'

/**
 * Field name for the timing trap.
 *
 * It carries elapsed milliseconds since the form mounted, measured on the
 * client with performance.now(). Elapsed, not a timestamp: a wall-clock
 * timestamp gets compared against the server's clock, and a customer whose
 * phone has the wrong date would be turned away by their own device. Elapsed
 * time cannot skew.
 *
 * The pages are static, so there is no server-issued nonce to sign — and
 * signing a build-time timestamp would measure the age of the deployment
 * rather than how long this person spent filling the form in, which is the
 * only thing worth measuring.
 */
export const ELAPSED_FIELD = 'elapsed'

/** Bots submit instantly. Nobody types a name, a number and a job in three seconds. */
const MIN_ELAPSED_MS = 3_000
/** Longer than this is a stale tab or a replay. */
const MAX_ELAPSED_MS = 1000 * 60 * 60 * 3

/**
 * True if this submission looks automated. Anything caught here is shown the
 * same success state as a real customer — telling a bot why it failed is free
 * tuning for whoever wrote it.
 *
 * An empty elapsed field means JavaScript did not run. That is a person with
 * scripts off, not a bot, so the timing check stands down and the honeypot
 * carries it alone. A form that only worked with JavaScript would be the
 * bigger failure.
 */
export function looksAutomated(honeypot: string, elapsed: string): boolean {
  if (honeypot.trim() !== '') return true
  if (elapsed.trim() === '') return false

  const ms = Number(elapsed)
  if (!Number.isFinite(ms) || ms < 0) return true
  return ms < MIN_ELAPSED_MS || ms > MAX_ELAPSED_MS
}
