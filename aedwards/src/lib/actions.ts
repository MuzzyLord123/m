'use server'

import { contact } from '@content/copy'
import { deliver } from './enquiry'
import { ELAPSED_FIELD, HONEYPOT_FIELD, looksAutomated } from './enquiry-fields'

export type EnquiryState = {
  status: 'idle' | 'ok' | 'invalid' | 'error'
  message?: string
}

/** Generous, but not a place to paste a novel. */
const LIMITS = { name: 120, phone: 40, job: 2000 } as const

function field(data: FormData, key: string, max: number): string {
  return String(data.get(key) ?? '')
    .trim()
    .slice(0, max)
}

export async function submitEnquiry(
  _previous: EnquiryState,
  data: FormData,
): Promise<EnquiryState> {
  if (
    looksAutomated(String(data.get(HONEYPOT_FIELD) ?? ''), String(data.get(ELAPSED_FIELD) ?? ''))
  ) {
    // Same answer a real customer gets. No feedback to tune against.
    return { status: 'ok' }
  }

  const name = field(data, 'name', LIMITS.name)
  const phone = field(data, 'phone', LIMITS.phone)
  const job = field(data, 'job', LIMITS.job)

  if (!name || !phone || !job) {
    return { status: 'invalid', message: 'Name, number and what needs doing, please.' }
  }

  try {
    await deliver({ name, phone, job })
  } catch {
    // Never swallow this into a false "thanks, I'll be in touch". If it did not
    // send, say so and put the phone number back in front of them.
    return { status: 'error', message: contact.form.error }
  }

  return { status: 'ok' }
}
