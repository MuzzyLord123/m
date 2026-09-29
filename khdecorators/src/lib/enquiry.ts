/**
 * Enquiry validation. Shared by the route handler and the form component, so the
 * rules the browser applies are the rules the server applies.
 */

export type EnquiryValues = {
  name: string
  contact: string
  place: string
  job: string
}

export type EnquiryErrors = Partial<Record<keyof EnquiryValues | 'form', string>>

export const EMPTY_VALUES: EnquiryValues = { name: '', contact: '', place: '', job: '' }

/** The honeypot. Hidden from people, irresistible to the simpler bots. */
export const HONEYPOT_FIELD = 'website'

/** Hidden timestamp, used to reject submissions that arrived impossibly fast. */
export const TIMESTAMP_FIELD = 'started'

/** Anything filled in faster than this was not filled in by a person. */
const MIN_SECONDS = 2

const clean = (value: FormDataEntryValue | null, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/**
 * Two required fields, and only two: a name and a way of replying.
 *
 * Every extra required field costs enquiries, and this form is the conversion path
 * for paid traffic. Town and job description are useful to Kenny and they are both
 * optional, because someone who will not type their postcode will still ring back
 * if he has their number.
 */
export function validateEnquiry(
  data: FormData,
):
  | { ok: true; values: EnquiryValues }
  | { ok: false; errors: EnquiryErrors; values: EnquiryValues } {
  const values: EnquiryValues = {
    name: clean(data.get('name'), 100),
    contact: clean(data.get('contact'), 200),
    place: clean(data.get('place'), 100),
    job: clean(data.get('job'), 2000),
  }

  const errors: EnquiryErrors = {}

  if (values.name.length < 2) {
    errors.name = 'I need something to call you.'
  }

  if (values.contact.length < 6) {
    errors.contact = 'A phone number or an email address, so I can come back to you.'
  } else if (!looksContactable(values.contact)) {
    errors.contact = 'That does not look like a phone number or an email address.'
  }

  return Object.keys(errors).length === 0 ? { ok: true, values } : { ok: false, errors, values }
}

/**
 * Deliberately loose. It accepts anything that could plausibly be a UK number or
 * an email address, because the cost of wrongly rejecting a real enquiry is far
 * higher than the cost of letting a malformed one through — Kenny can read.
 */
function looksContactable(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 9) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
}

/**
 * Spam checks. No captcha: it is a tax on every real visitor to stop a problem a
 * one-man decorator's contact form does not have at scale, and on paid traffic a
 * challenge in front of the form is paid clicks thrown away.
 *
 * Returns true when the submission should be silently dropped. Silently, because
 * telling a bot it failed is how it learns to pass.
 */
export function looksAutomated(data: FormData): boolean {
  if (clean(data.get(HONEYPOT_FIELD), 100) !== '') return true

  const started = Number(clean(data.get(TIMESTAMP_FIELD), 20))
  if (Number.isFinite(started) && started > 0) {
    const elapsed = (Date.now() - started) / 1000
    if (elapsed < MIN_SECONDS) return true
  }

  return false
}

/** The email Kenny receives. Plain text — it goes to a phone. */
export function formatEnquiry(values: EnquiryValues): { subject: string; text: string } {
  const where = values.place ? ` — ${values.place}` : ''
  return {
    subject: `Website enquiry: ${values.name}${where}`,
    text: [
      `Name:     ${values.name}`,
      `Contact:  ${values.contact}`,
      `Town:     ${values.place || '(not given)'}`,
      '',
      'What needs doing',
      '----------------',
      values.job || '(nothing written)',
      '',
      '---',
      'Sent from the enquiry form on khdecorators.uk',
    ].join('\n'),
  }
}
