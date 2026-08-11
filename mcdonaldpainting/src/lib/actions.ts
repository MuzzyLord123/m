'use server';

import {
  deliverEnquiry,
  ENQUIRY_TYPES,
  type EnquiryState,
  type EnquiryType,
} from './enquiry';

/**
 * This file exports one thing, and it is an async function. A `'use server'`
 * module may not export anything else — the state type and its initial value
 * are in lib/enquiry.ts for that reason, not by accident.
 */

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Good enough to catch a typo. Anything stricter rejects real addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitEnquiry(
  _prev: EnquiryState,
  form: FormData,
): Promise<EnquiryState> {
  // Honeypot. A real visitor never sees this field. Answer as though it worked —
  // telling a bot it failed only teaches it which field to leave alone.
  if (text(form, 'website')) {
    return { status: 'success' };
  }

  // Timing trap. The stamp is written by JavaScript when the form mounts, so a
  // visitor with JavaScript off skips the check rather than being locked out.
  const stamp = Number(text(form, 'stamp'));
  if (stamp && Date.now() - stamp < 3000) {
    return { status: 'success' };
  }

  const rawType = text(form, 'type');
  const type = (ENQUIRY_TYPES.includes(rawType as EnquiryType) ? rawType : 'commercial') as EnquiryType;

  const values = {
    type,
    name: text(form, 'name'),
    organisation: text(form, 'organisation'),
    email: text(form, 'email'),
    telephone: text(form, 'telephone'),
    building: text(form, 'building'),
    message: text(form, 'message'),
  };

  const wantsCapabilityStatement = text(form, 'capabilityStatement') === 'yes';

  const fieldErrors: EnquiryState['fieldErrors'] = {};
  if (!values.name) fieldErrors.name = 'Needed, so we know who we are replying to.';

  // A domestic enquiry can leave an email and no phone or the other way round.
  // A tender enquiry has to have a work email — it is the whole point of it.
  if (wantsCapabilityStatement || type === 'tender') {
    if (!EMAIL.test(values.email)) {
      fieldErrors.email = 'A work email address — this is where the statement is sent.';
    }
  } else if (!values.email && !values.telephone) {
    fieldErrors.telephone = 'A phone number or an email address, so we can come back to you.';
  } else if (values.email && !EMAIL.test(values.email)) {
    fieldErrors.email = 'That address looks incomplete.';
  }

  if (Object.keys(fieldErrors).length) {
    return { status: 'error', fieldErrors, values };
  }

  try {
    await deliverEnquiry({
      ...values,
      wantsCapabilityStatement,
      receivedAt: new Date().toISOString(),
    });
  } catch {
    return {
      status: 'error',
      message:
        'Something went wrong sending that. Ring Sean on 07851 113 929 rather than trying again — it is faster and it definitely works.',
      values,
    };
  }

  return {
    status: 'success',
    values,
    ...(wantsCapabilityStatement ? { download: '/capability-statement.pdf' } : {}),
  };
}
