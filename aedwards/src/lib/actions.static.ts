import { contact } from '@content/copy'
import type { EnquiryState } from './enquiry-fields'

/**
 * The static-export stand-in for src/lib/actions.ts.
 *
 * Server Actions need a server, so a statically exported build cannot contain
 * one — not even an unused one, because the `'use server'` directive fails the
 * export on sight. `npm run build:static` therefore resolves @/lib/actions to
 * this file instead (see the resolveAlias in next.config.mjs).
 *
 * Nothing ever calls it. On a static host the enquiry form is not rendered at
 * all: DELIVERY_CONFIGURED is false, so the contact field shows Andy's phone
 * number, which is what a static host can actually deliver on. This exists so
 * the import resolves and the form component still type-checks.
 *
 * If it somehow were called, it says so honestly and points at the phone,
 * rather than reporting a success that never happened.
 */
export async function submitEnquiry(
  _previous: EnquiryState,
  _data: FormData,
): Promise<EnquiryState> {
  return { status: 'error', message: contact.form.error }
}

export type { EnquiryState }
