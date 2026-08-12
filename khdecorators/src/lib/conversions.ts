/**
 * Google Ads conversion tracking.
 *
 * ============================================================================
 *  READ ADS-MIGRATION.md BEFORE CHANGING ANYTHING IN THIS FILE.
 * ============================================================================
 *
 * Kenny is the only client in this portfolio paying for traffic. The tag below is
 * already live on the Google Sites pages and it already has conversion history
 * behind it, which is what his smart bidding is optimising against. Two ways to
 * lose real money here:
 *
 *  1. Ship the site with the tag missing or misspelled. Conversions stop arriving,
 *     bidding degrades, and nobody notices for a fortnight because the ads keep
 *     running.
 *
 *  2. Create NEW conversion actions in Google Ads for the new form and the new
 *     tap-to-call, instead of pointing them at the EXISTING actions. A new action
 *     starts its learning from zero. Bidding gets measurably worse for weeks while
 *     it relearns, and the history against the old action is orphaned.
 *
 * The second is the likelier mistake because it feels like the tidy thing to do.
 * It is not. The labels below come OUT of his Ads account — they are the existing
 * actions' `send_to` values — rather than being generated fresh for this build.
 */

/** Live on every page of the current site. Do not change it. */
export const ADS_ID = 'AW-11172797357'

/**
 * The three conversion actions, as `AW-11172797357/<label>` strings.
 *
 * These are read from the environment rather than hard-coded, because the labels
 * are not knowable from outside the Ads account and guessing one would silently
 * send conversions nowhere. Set them in the host's environment — see .env.example
 * and ADS-MIGRATION.md §2 for where in the Ads interface to find each one.
 *
 * Written out literally rather than looked up by key: `NEXT_PUBLIC_*` variables are
 * substituted into the bundle at build time by static analysis, so a dynamic
 * `process.env[name]` would come back undefined in the browser.
 */
const SEND_TO = {
  form: process.env.NEXT_PUBLIC_ADS_CONVERSION_FORM,
  call: process.env.NEXT_PUBLIC_ADS_CONVERSION_CALL,
  email: process.env.NEXT_PUBLIC_ADS_CONVERSION_EMAIL,
} as const

export type ConversionKind = keyof typeof SEND_TO

/** GA4, for behaviour. Free tier, and optional — the site works without it. */
export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID

/** The GA4 event name for each action. `generate_lead` is GA4's own recommended name. */
const GA4_EVENT: Record<ConversionKind, string> = {
  form: 'generate_lead',
  call: 'contact_call',
  email: 'contact_email',
}

type GtagArgs =
  | ['event', string, Record<string, unknown>?]
  | ['config', string, Record<string, unknown>?]
  | ['js', Date]
  | ['set', Record<string, unknown>]

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void
    dataLayer?: unknown[]
  }
}

/**
 * Record an enquiry.
 *
 * Fires the Ads conversion against the mapped action, and a GA4 event for
 * behaviour reporting. Safe to call before gtag has loaded, safe to call when the
 * labels are not configured, and safe to call during a server render — it does
 * nothing rather than throwing, because a tracking failure must never break a
 * tap-to-call. The call is what earns the money; the measurement of it does not.
 */
export function recordConversion(kind: ConversionKind): void {
  if (typeof window === 'undefined') return

  const sendTo = SEND_TO[kind]

  if (!sendTo) {
    // Loud in development, silent in production. A missing label is a
    // configuration job, not something to shout about in a customer's console.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[conversions] No send_to configured for "${kind}". Set NEXT_PUBLIC_ADS_CONVERSION_${kind.toUpperCase()} ` +
          `to the existing conversion action's value from the Ads account. See ADS-MIGRATION.md §2.`,
      )
    }
  } else {
    try {
      window.gtag?.('event', 'conversion', { send_to: sendTo })
    } catch {
      // Never let a tracking error surface to a customer mid-enquiry.
    }
  }

  if (GA4_ID) {
    try {
      window.gtag?.('event', GA4_EVENT[kind], { method: kind })
    } catch {
      /* as above */
    }
  }
}

/**
 * True when every conversion label is configured. Used by the launch check so the
 * site cannot be cut over with the measurement half-wired.
 */
export const conversionsConfigured = (): boolean =>
  Boolean(SEND_TO.form && SEND_TO.call && SEND_TO.email)
