"use server";

import { Resend } from "resend";
import { site } from "@/config/site";
import { buildVisitIcs } from "@/lib/ics";
import {
  bookingSchema,
  quoteSchema,
  MIN_SUBMIT_MS,
  SERVICE_OPTIONS,
  type BookingInput,
  type LeadResult,
  type QuoteInput,
} from "@/lib/lead-schema";
import {
  bookingConfirmation,
  bookingNotification,
  quoteConfirmation,
  quoteNotification,
} from "@/lib/email/templates";

const FALLBACK_FROM = "The Paint Men <onboarding@resend.dev>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function serviceLabel(id: string): string {
  return SERVICE_OPTIONS.find((option) => option.id === id)?.label ?? "Decorating";
}

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Spam defences without a CAPTCHA: a honeypot field no person can see, and a
 * minimum time on the form that no bot waits out. Both fail closed but return
 * a success shape, so a bot learns nothing from the response.
 */
function looksAutomated(input: { website?: string; elapsedMs: number }): boolean {
  if (input.website && input.website.length > 0) return true;
  // Elapsed time measured on the client, never a cross-clock subtraction.
  return input.elapsedMs < MIN_SUBMIT_MS;
}

function failure(error: unknown): LeadResult {
  console.error("[lead] send failed", error);
  return {
    ok: false,
    error: `That did not send. Ring ${site.phone} and we will take the details over the phone.`,
  };
}

export async function submitQuote(raw: QuoteInput): Promise<LeadResult> {
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Some details are missing. Check the form and try again." };
  }

  const input = parsed.data;
  if (looksAutomated(input)) return { ok: true };

  const resend = client();
  if (!resend) {
    console.warn("[lead] RESEND_API_KEY is not set — quote not delivered", {
      name: input.name,
      email: input.email,
    });
    return {
      ok: false,
      error: `Our email is not connected yet. Ring ${site.phone} and we will take the details now.`,
    };
  }

  const service = serviceLabel(input.service);

  try {
    const notification = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || FALLBACK_FROM,
      to: process.env.LEAD_TO_EMAIL || site.email,
      replyTo: input.email,
      subject: `Quote enquiry — ${input.name}, ${input.town} (${service})`,
      html: quoteNotification({ ...input, service }),
    });
    if (notification.error) return failure(notification.error);

    // The enquirer's confirmation must never block the lead itself.
    const confirmation = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || FALLBACK_FROM,
      to: input.email,
      subject: `We have your enquiry — ${site.name}`,
      html: quoteConfirmation({ name: input.name, service }),
    });
    if (confirmation.error) console.error("[lead] confirmation failed", confirmation.error);

    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function submitBooking(raw: BookingInput): Promise<LeadResult> {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Some details are missing. Check the form and try again." };
  }

  const input = parsed.data;
  if (looksAutomated(input)) return { ok: true };

  const resend = client();
  if (!resend) {
    console.warn("[lead] RESEND_API_KEY is not set — booking not delivered", {
      name: input.name,
      date: input.date,
    });
    return {
      ok: false,
      error: `Our email is not connected yet. Ring ${site.phone} and we will book the visit now.`,
    };
  }

  const label = dateLabel(input.date);
  const ics = buildVisitIcs({
    date: input.date,
    preference: input.preference,
    name: input.name,
    address: input.address,
    phone: input.phone,
    email: input.email,
    notes: input.message,
  });

  try {
    const notification = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || FALLBACK_FROM,
      to: process.env.LEAD_TO_EMAIL || site.email,
      replyTo: input.email,
      subject: `Site visit — ${input.name}, ${label} (${input.preference})`,
      html: bookingNotification({ ...input, dateLabel: label }),
      attachments: [
        {
          filename: "site-visit.ics",
          content: Buffer.from(ics).toString("base64"),
          contentType: "text/calendar; charset=utf-8; method=PUBLISH",
        },
      ],
    });
    if (notification.error) return failure(notification.error);

    const confirmation = await resend.emails.send({
      from: process.env.LEAD_FROM_EMAIL || FALLBACK_FROM,
      to: input.email,
      subject: `Your site visit request — ${site.name}`,
      html: bookingConfirmation({
        name: input.name,
        dateLabel: label,
        preference: input.preference,
      }),
    });
    if (confirmation.error) console.error("[lead] confirmation failed", confirmation.error);

    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
