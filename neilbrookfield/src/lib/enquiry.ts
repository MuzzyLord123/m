/**
 * Where an enquiry goes.
 *
 * Delivery is by email, sent through Resend. It switches itself on when two
 * environment variables are present on the host:
 *
 *   RESEND_API_KEY   an API key from resend.com
 *   ENQUIRY_TO       the address enquiries should land in
 *   ENQUIRY_FROM     optional; defaults to enquiries@<your verified domain>
 *
 * With those set, an enquiry is emailed the moment the form is submitted. With
 * them missing, it is written to the host's log and a loud warning is printed,
 * so a form quietly going nowhere cannot pass unnoticed.
 *
 * There is no third state and no silent failure: if Resend rejects the send, the
 * visitor is told to ring instead rather than being shown a false confirmation.
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

/** True once the host has the two variables above. Nothing to edit by hand. */
export const DELIVERY_CONFIGURED = Boolean(
  process.env.RESEND_API_KEY && process.env.ENQUIRY_TO,
);

function plainText(enquiry: Enquiry): string {
  const lines = [
    `From:      ${enquiry.name}`,
    enquiry.phone ? `Phone:     ${enquiry.phone}` : null,
    enquiry.email ? `Email:     ${enquiry.email}` : null,
    enquiry.timescale ? `Timescale: ${enquiry.timescale}` : null,
    enquiry.preferredSaturday ? `Saturday:  ${enquiry.preferredSaturday}` : null,
    `Page:      ${enquiry.source}`,
    '',
    'The job:',
    enquiry.project,
  ];

  if (enquiry.photos.length) {
    lines.push(
      '',
      `${enquiry.photos.length} photograph${enquiry.photos.length === 1 ? '' : 's'} attached:`,
      ...enquiry.photos.map((p) => `  ${p.name} (${Math.round(p.size / 1024)} KB)`),
      '',
      'Note: the photographs are named here but not attached to this email. Ring',
      'them back and ask them to send the pictures across.',
    );
  }

  return lines.filter((l) => l !== null).join('\n');
}

export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  if (!DELIVERY_CONFIGURED) {
    console.warn(
      '[enquiry] RESEND_API_KEY / ENQUIRY_TO are not set, so this enquiry was NOT sent to anyone.\n' +
        'Set both on the host to switch delivery on. See src/lib/enquiry.ts.\n' +
        plainText(enquiry),
    );
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ENQUIRY_FROM ?? 'Website enquiry <enquiries@neilbrookfield.co.uk>',
      to: [process.env.ENQUIRY_TO],
      // So a reply from the phone goes straight back to the customer.
      ...(enquiry.email ? { reply_to: enquiry.email } : {}),
      subject: `Enquiry from ${enquiry.name}${enquiry.phone ? ` — ${enquiry.phone}` : ''}`,
      text: plainText(enquiry),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend refused the send: ${response.status} ${await response.text().catch(() => '')}`,
    );
  }
}
