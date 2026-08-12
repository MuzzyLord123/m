'use server';

import { deliverEnquiry, parseEnquiry, type EnquiryResult } from '@/lib/enquiry';

/**
 * The enquiry server action.
 *
 * A server action rather than a route handler because it works without
 * JavaScript: the form posts, this runs, the page comes back with the result.
 * Somebody on a bad connection halfway up the Wirral still gets through.
 */
export async function submitEnquiry(
  _previous: EnquiryResult | null,
  form: FormData,
): Promise<EnquiryResult> {
  // Honeypot. A field no human sees and no human fills in; bots fill everything.
  // Answer as though it worked — telling a spammer it failed just teaches it.
  if (typeof form.get('website') === 'string' && form.get('website') !== '') {
    return { ok: true };
  }

  const { values, errors } = parseEnquiry(form);
  if (Object.keys(errors).length) return { ok: false, errors };

  try {
    await deliverEnquiry(values);
    return { ok: true };
  } catch (error) {
    // The customer gets the phone number, not a stack trace. The detail goes to
    // the logs, where whoever is on call can find it.
    console.error('Enquiry delivery failed:', error);
    return {
      ok: false,
      errors: {
        form:
          'Something went wrong sending that, and we would rather tell you than ' +
          'let you think it arrived. Please ring instead — the number is just below.',
      },
    };
  }
}
