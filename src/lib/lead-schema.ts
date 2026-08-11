import { z } from "zod";

/**
 * Every free-text field a visitor can send goes through this first.
 *
 * WHY IT EXISTS. These values end up in an email sent FROM the client's own
 * DKIM-signed domain, and one of them — the email address — decides who
 * receives it. Unbounded text with no character class made that a usable relay:
 * a "name" of `URGENT: your invoice is overdue https://evil.tld/pay` passed
 * validation, was interpolated into the confirmation email's headline, and was
 * delivered to any address the sender chose, SPF- and DKIM-passing, from the
 * decorator's domain. Escaping was never the missing piece — the payload is
 * plain text, and mail clients linkify bare URLs themselves.
 *
 * It strips Unicode control and format characters (\p{Cc} covers CR and LF,
 * \p{Cf} covers the bidi overrides that let text be displayed in a different
 * order from the way it is stored) and collapses runs of whitespace. Newlines
 * are the specific one that matters: these values reach a mail subject line,
 * and a subject containing CRLF is header injection.
 */
const text = (max: number) =>
  z
    .string()
    .transform((value) =>
      value
        .replace(/[\p{Cc}\p{Cf}]/gu, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .pipe(z.string().max(max, "That is longer than we can take here — ring us instead"));

/** UK numbers, loosely: digits, spaces, brackets, +44. Ten digits minimum. */
const phone = text(30)
  .pipe(z.string().min(1, "We need a number to ring you back on"))
  .refine((value) => (value.replace(/\D/g, "").length ?? 0) >= 10, {
    message: "That does not look like a full phone number",
  });

export const SERVICE_OPTIONS = [
  { id: "interior", label: "Interior decorating", note: "Bedrooms, living rooms, woodwork" },
  { id: "halls", label: "Halls, stairs & landings", note: "Spindles, panelling, high walls" },
  { id: "kitchens", label: "Kitchens, bathrooms & wet rooms", note: "Units, splashbacks, steam" },
  { id: "extensions", label: "Extensions & loft conversions", note: "New plaster, first coats" },
  { id: "exterior", label: "Exterior painting", note: "Render, fascias, fences" },
  { id: "commercial", label: "Commercial", note: "Shops, offices, units" },
  { id: "unsure", label: "Not sure yet", note: "Tell us and we will work it out" },
] as const;

export const PROPERTY_OPTIONS = [
  "Terraced house",
  "Semi-detached",
  "Detached",
  "Bungalow",
  "Flat or apartment",
  "Commercial premises",
] as const;

export const ROOM_OPTIONS = [
  "One room",
  "Two or three rooms",
  "Four or more rooms",
  "Whole house",
  "Outside only",
] as const;

export const TIMING_OPTIONS = [
  "As soon as you can",
  "Within a month",
  "One to three months",
  "Just pricing it up for now",
] as const;

export const quoteSchema = z.object({
  service: z.enum(SERVICE_OPTIONS.map((option) => option.id) as [string, ...string[]], {
    message: "Pick the trade that fits best",
  }),
  property: z.enum(PROPERTY_OPTIONS, { message: "Tell us what sort of property it is" }),
  rooms: z.enum(ROOM_OPTIONS, { message: "Roughly how much needs doing?" }),
  timing: z.enum(TIMING_OPTIONS, { message: "When would you like it done?" }),
  /* text() normalises BEFORE the length check, so " " is caught as empty rather
     than passing as a two-character name — and the confirmation email opens
     "Thanks Sarah," rather than "Thanks , ". Autofill and paste both leave
     whitespace surprisingly often. The caps are what stop a name being used as
     a message: they are generous for a real one and useless for a payload. */
  name: text(80).pipe(z.string().min(2, "Your name, so we know who we are speaking to")),
  phone,
  email: z.email("Check the email address — we send the written quote there").trim().max(254),
  town: text(80).pipe(z.string().min(2, "Which town is the property in?")),
  message: text(2000).optional(),
  hasPhotos: z.boolean().optional(),

  // Spam defences. Neither is ever shown to a person.
  website: z.string().max(0, "Something went wrong. Ring us instead.").optional(),
  elapsedMs: z.number(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const AM_PM = ["Morning", "Afternoon", "Either"] as const;

export const bookingSchema = z.object({
  /** ISO date string for the requested visit. */
  date: z.string().min(1, "Pick a day that suits you"),
  preference: z.enum(AM_PM, { message: "Morning or afternoon?" }),
  name: text(80).pipe(z.string().min(2, "Your name, so we know who we are speaking to")),
  phone,
  email: z.email("Check the email address — we confirm the visit there").trim().max(254),
  address: text(200).pipe(z.string().min(4, "The address we are coming to")),
  message: text(2000).optional(),

  website: z.string().max(0, "Something went wrong. Ring us instead.").optional(),
  elapsedMs: z.number(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

/**
 * A person cannot read four steps, decide and type their details in under four
 * seconds. A bot fills the lot instantly.
 */
/**
 * Minimum time a human spends on the form. The client sends ELAPSED time, not
 * the timestamp it started at: comparing a browser's clock against the server's
 * means any clock skew is read as "submitted impossibly fast", and the customer
 * is silently binned while being shown the success screen. Elapsed time is two
 * readings of the same clock, so skew cancels out.
 *
 * A bot can lie about elapsed time — but it could equally lie about a start
 * timestamp, so nothing is lost, and honest customers stop being thrown away.
 */
export const MIN_SUBMIT_MS = 4000;

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string };
