import { z } from "zod";

/** UK numbers, loosely: digits, spaces, brackets, +44. Ten digits minimum. */
const phone = z
  .string()
  .min(1, "We need a number to ring you back on")
  .refine((value) => (value.replace(/\D/g, "").length ?? 0) >= 10, {
    message: "That does not look like a full phone number",
  });

export const SERVICE_OPTIONS = [
  { id: "interior", label: "Interior decorating", note: "Walls, ceilings, woodwork" },
  { id: "exterior", label: "Exterior painting", note: "Render, masonry, timber" },
  { id: "wallpaper", label: "Wallpapering", note: "Feature walls, murals, full rooms" },
  { id: "spray", label: "Spray finishing", note: "Kitchens, staircases, wardrobes" },
  { id: "commercial", label: "Commercial", note: "Offices, surgeries, shops" },
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
  /* .trim() runs BEFORE the length check, so " " is caught as empty rather than
     passing as a two-character name — and the confirmation email opens "Thanks
     Sarah," rather than "Thanks , ". Autofill and paste both leave whitespace
     surprisingly often. */
  name: z.string().trim().min(2, "Your name, so we know who we are speaking to"),
  phone,
  email: z.email("Check the email address — we send the written quote there").trim(),
  town: z.string().trim().min(2, "Which town is the property in?"),
  message: z
    .string()
    .trim()
    .max(2000, "That is longer than we can take here — ring us instead")
    .optional(),
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
  name: z.string().trim().min(2, "Your name, so we know who we are speaking to"),
  phone,
  email: z.email("Check the email address — we confirm the visit there").trim(),
  address: z.string().trim().min(4, "The address we are coming to"),
  message: z
    .string()
    .trim()
    .max(2000, "That is longer than we can take here — ring us instead")
    .optional(),

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
