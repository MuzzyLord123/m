/**
 * Where an enquiry goes.
 *
 * NOTHING IS WIRED UP YET. Neil has not said whether he wants enquiries as an
 * email, a text, or both, and there is no email address published anywhere on
 * the old site to send them to. See content/needed.ts#enquiry-delivery.
 *
 * Until that is answered, an enquiry is written to the server log and goes no
 * further, and `npm run check:launch` fails. Do not put the site live in this
 * state — a form that silently swallows work is worse than no form.
 *
 * To wire it up, implement deliverEnquiry() below. It is the only thing that
 * needs to change: one function, one file.
 */

export type Enquiry = {
  name: string;
  phone?: string;
  email?: string;
  project: string;
  timescale?: string;
  /** Only sent from the workshops page. */
  preferredSaturday?: string;
  /** Filenames and sizes only — the files themselves are not stored anywhere. */
  photos: Array<{ name: string; size: number }>;
  /** Which page it came from. */
  source: string;
};

export const DELIVERY_CONFIGURED = false;

export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  if (!DELIVERY_CONFIGURED) {
    // Deliberately loud. This shows up in the host's logs on every enquiry so
    // that a form quietly going nowhere cannot pass unnoticed.
    console.warn(
      '[enquiry] No delivery is configured — this enquiry was NOT sent to anyone.\n' +
        'Implement deliverEnquiry() in src/lib/enquiry.ts. See content/needed.ts#enquiry-delivery.\n' +
        JSON.stringify(enquiry, null, 2),
    );
    return;
  }

  // When Neil has decided: send it here. An email provider needs an API key in
  // an environment variable — it does not belong in this file.
  throw new Error('DELIVERY_CONFIGURED is true but deliverEnquiry() has no implementation.');
}
