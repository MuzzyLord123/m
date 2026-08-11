'use server';

import { deliverEnquiry, type Enquiry } from './enquiry';

export type EnquiryState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<'name' | 'project' | 'contact', string>>;
  /** Echoed back so a failed submission does not empty the form. */
  values?: Record<string, string>;
};

export const initialEnquiryState: EnquiryState = { status: 'idle' };

/** Anything above this and the browser will have struggled to send it anyway. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_PHOTOS = 6;

function text(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

export async function submitEnquiry(
  _prev: EnquiryState,
  form: FormData,
): Promise<EnquiryState> {
  // Honeypot. A real person never sees this field, so anything in it is a bot.
  // Answer as though it worked — telling a bot it failed only teaches it.
  if (text(form, 'website')) {
    return { status: 'success' };
  }

  // Timing trap. The stamp is written by JavaScript when the form mounts, so a
  // visitor without JavaScript simply skips this check rather than being locked
  // out of the form for having it switched off.
  const stamp = Number(text(form, 'stamp'));
  if (stamp && Date.now() - stamp < 3000) {
    return { status: 'success' };
  }

  const values = {
    name: text(form, 'name'),
    phone: text(form, 'phone'),
    email: text(form, 'email'),
    project: text(form, 'project'),
    timescale: text(form, 'timescale'),
    preferredSaturday: text(form, 'preferredSaturday'),
  };

  const fieldErrors: EnquiryState['fieldErrors'] = {};
  if (!values.name) fieldErrors.name = 'Please put your name in.';
  if (!values.phone && !values.email) {
    fieldErrors.contact = 'A phone number or an email address, so I can come back to you.';
  }
  if (!values.project) fieldErrors.project = 'A line or two about the job.';

  if (Object.keys(fieldErrors).length) {
    return {
      status: 'error',
      message: 'Almost — a couple of things are missing.',
      fieldErrors,
      values,
    };
  }

  const photos = form
    .getAll('photos')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_PHOTOS)
    .filter((f) => f.size <= MAX_PHOTO_BYTES)
    .map((f) => ({ name: f.name, size: f.size }));

  const enquiry: Enquiry = {
    name: values.name,
    ...(values.phone ? { phone: values.phone } : {}),
    ...(values.email ? { email: values.email } : {}),
    project: values.project,
    ...(values.timescale ? { timescale: values.timescale } : {}),
    ...(values.preferredSaturday ? { preferredSaturday: values.preferredSaturday } : {}),
    photos,
    source: text(form, 'source') || 'unknown',
  };

  try {
    await deliverEnquiry(enquiry);
  } catch (error) {
    console.error('[enquiry] delivery failed', error);
    return {
      status: 'error',
      message: 'Something went wrong sending that. Ring me instead and I will pick it up.',
      values,
    };
  }

  return { status: 'success' };
}
