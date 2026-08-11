/**
 * Where an enquiry goes.
 *
 * A contact form that delivers nowhere is worse than no form at all: the
 * customer believes they have got in touch, and then waits. So the form does
 * not render until this is switched on, and /contact gives the phone number and
 * the email address instead — the two routes known to work.
 *
 * To turn it on:
 *   1. Set ENQUIRY_WEBHOOK_URL (see .env.example). Any endpoint that accepts a
 *      JSON POST will do — a form service, an automation, your own handler.
 *      Nothing here is tied to a particular provider and nothing is paid for.
 *   2. Send a real enquiry through the live form.
 *   3. Confirm it arrived in the inbox somebody actually reads.
 *   4. Then flip DELIVERY_CONFIGURED.
 *
 * In that order. The flag means "a human has watched a test enquiry land",
 * not "the code looks right".
 */
export const DELIVERY_CONFIGURED = false;

export type Enquiry = {
  name: string;
  phone: string;
  email: string;
  town: string;
  message: string;
};

export type EnquiryResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof Enquiry | 'form', string>> };

/** Trim, collapse runs of whitespace, and cap length so nothing daft is stored. */
function clean(value: FormDataEntryValue | null, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export function parseEnquiry(form: FormData): {
  values: Enquiry;
  errors: Partial<Record<keyof Enquiry | 'form', string>>;
} {
  const values: Enquiry = {
    name: clean(form.get('name'), 80),
    phone: clean(form.get('phone'), 40),
    email: clean(form.get('email'), 120),
    town: clean(form.get('town'), 80),
    message: clean(form.get('message'), 2000),
  };

  const errors: Partial<Record<keyof Enquiry | 'form', string>> = {};

  if (!values.name) errors.name = 'We need a name to know who we are replying to.';
  if (!values.message) errors.message = 'Tell us roughly what needs doing.';

  // One way to reply is enough — some people would rather not give an email,
  // and this trade runs on phone calls.
  if (!values.phone && !values.email) {
    errors.phone = 'Leave a phone number or an email address, whichever suits.';
  }

  if (values.email && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(values.email)) {
    errors.email = 'That email address does not look complete.';
  }

  if (values.phone && values.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'That phone number looks a digit or two short.';
  }

  return { values, errors };
}

/**
 * Delivery. Provider-agnostic on purpose: a POST of JSON, to whatever URL is in
 * the environment. Swapping providers is a change of env var, not a change of
 * code, and there is no SDK to keep up to date.
 */
export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  const url = process.env.ENQUIRY_WEBHOOK_URL;

  if (!url) {
    throw new Error(
      'ENQUIRY_WEBHOOK_URL is not set, so there is nowhere to deliver this enquiry. ' +
        'Either set it or set DELIVERY_CONFIGURED to false so the form is not shown.',
    );
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: `Website enquiry — ${enquiry.name}${enquiry.town ? `, ${enquiry.town}` : ''}`,
      ...enquiry,
      receivedAt: new Date().toISOString(),
    }),
    // A customer should not sit and watch a spinner because a webhook is slow.
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Enquiry webhook returned ${response.status}`);
  }
}
