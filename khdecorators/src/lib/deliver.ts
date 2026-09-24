import nodemailer from 'nodemailer'
import { email as kennysEmail } from '@content/site'
import { formatEnquiry, type EnquiryValues } from './enquiry'

/**
 * Getting an enquiry to Kenny.
 *
 * There is no form provider on this site — no Google Form, no Typeform, no embedded
 * widget of any kind. The form is native HTML, it posts to a route handler in this
 * app, and this is the function that turns the result into an email in the Outlook
 * mailbox he already reads.
 *
 * SMTP through his own mailbox, so there is no third-party account to create, no
 * subscription, and no vendor holding his enquiries. Credentials go in the host's
 * environment — see .env.example and LAUNCH.md for how to generate the app password.
 *
 * ## The failure mode is the important part
 *
 * If delivery is not configured, or the send fails, this function reports failure
 * and the route handler tells the visitor to ring instead. It never reports success
 * for an email that did not go anywhere. A form that silently swallows enquiries is
 * worse than no form at all on a site where every visitor cost money to acquire, and
 * it is the kind of fault that stays undiscovered for months because there is
 * nothing to notice.
 *
 * The enquiry is also written to the server log at error level on any failure, in
 * full, so a lost enquiry can still be recovered from the host's logs and rung back.
 */

export type DeliveryResult = { ok: true } | { ok: false; reason: string }

const config = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  /** Where enquiries land. Defaults to the address published on the site. */
  to: process.env.ENQUIRY_TO ?? kennysEmail,
}

/** True when the mailbox is wired up. The launch check calls this. */
export const deliveryConfigured = (): boolean => Boolean(config.host && config.user && config.pass)

export async function deliverEnquiry(values: EnquiryValues): Promise<DeliveryResult> {
  const { subject, text } = formatEnquiry(values)

  if (!deliveryConfigured()) {
    console.error(
      '[enquiry] SMTP is not configured, so this enquiry was NOT delivered. ' +
        'Set SMTP_HOST, SMTP_USER and SMTP_PASS — see LAUNCH.md. Enquiry follows:\n' +
        text,
    )
    return { ok: false, reason: 'not-configured' }
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      // 587 is STARTTLS, 465 is implicit TLS. Both encrypt; only the handshake differs.
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    })

    await transport.sendMail({
      from: `"KH Painting and Decorating website" <${config.user}>`,
      to: config.to,
      subject,
      text,
      // So Kenny can hit reply and it goes to the customer, when they left an email.
      replyTo: values.contact.includes('@') ? values.contact : undefined,
    })

    return { ok: true }
  } catch (error) {
    console.error(
      `[enquiry] Delivery failed: ${error instanceof Error ? error.message : String(error)}. ` +
        `Enquiry follows so it can be recovered from these logs:\n${text}`,
    )
    return { ok: false, reason: 'send-failed' }
  }
}
