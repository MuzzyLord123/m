/**
 * Enquiry delivery. Server only — never import this from a client component.
 * The form field names and the spam traps live in ./enquiry-fields, which is
 * safe to share with the browser.
 *
 * There is no email address on file for Andy yet, so out of the box this is
 * NOT configured, and the form does not render at all: the contact field shows
 * his phone number instead. A form that silently drops enquiries is worse than
 * no form, and a form that says "thanks, I'll be in touch" when nothing was
 * sent is worse than both.
 *
 * Two transports, both plain fetch, no SDK and no dependency:
 *
 *   ENQUIRY_WEBHOOK_URL   POST the enquiry as JSON. Point it at whatever he
 *                         ends up using — a form service, a Zap, an inbox
 *                         bridge. The simplest thing that works.
 *   RESEND_API_KEY        with ENQUIRY_TO (and optionally ENQUIRY_FROM) to
 *                         send the enquiry as an email.
 *
 * Set either and the form appears. Set neither and it stays hidden.
 */

const WEBHOOK = process.env.ENQUIRY_WEBHOOK_URL
const RESEND_KEY = process.env.RESEND_API_KEY
const TO = process.env.ENQUIRY_TO
const FROM = process.env.ENQUIRY_FROM ?? 'enquiries@aedwardsdecorating.co.uk'

/**
 * Read by the contact field to decide whether to render the form at all.
 *
 * The home page is statically prerendered, so this is evaluated at BUILD time,
 * not per request. Setting the variable on a host that is already running will
 * not make the form appear — the site has to be rebuilt. That is the right
 * trade: keeping the home page static is worth far more than being able to
 * toggle a form without a deploy, and every host sets its environment before
 * it builds anyway. LAUNCH.md step 8 says so out loud.
 */
export const DELIVERY_CONFIGURED = Boolean(WEBHOOK || (RESEND_KEY && TO))

export type Enquiry = {
  name: string
  phone: string
  job: string
}

export class NotConfiguredError extends Error {
  constructor() {
    super('No enquiry delivery is configured. See src/lib/enquiry.ts.')
    this.name = 'NotConfiguredError'
  }
}

export async function deliver(enquiry: Enquiry): Promise<void> {
  if (WEBHOOK) {
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...enquiry, site: 'aedwardsdecorating' }),
    })
    if (!res.ok) throw new Error(`Enquiry webhook returned ${res.status}`)
    return
  }

  if (RESEND_KEY && TO) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${RESEND_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        subject: `Enquiry from ${enquiry.name} — ${enquiry.phone}`,
        text: [`Name:   ${enquiry.name}`, `Phone:  ${enquiry.phone}`, '', enquiry.job].join('\n'),
      }),
    })
    if (!res.ok) throw new Error(`Resend returned ${res.status}`)
    return
  }

  throw new NotConfiguredError()
}
