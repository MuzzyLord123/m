import { site } from "@/config/site";

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * A FLOATING iCalendar timestamp — no trailing Z, no TZID.
 *
 * The visit is agreed as "9am" or "1pm", meaning wall-clock time in the UK.
 * Stamping that as UTC is wrong for the seven months the country spends in
 * British Summer Time: a 9am visit written as 0900Z opens in the decorator's
 * diary at 10am, and he turns up an hour after the customer expected him.
 *
 * RFC 5545 §3.3.5 form 1: a date-time with no suffix is interpreted in the
 * local timezone of whoever opens it. For an appointment where both parties are
 * in the same country, that is exactly the intended meaning — and it needs no
 * VTIMEZONE block, which is the other, far heavier, correct answer.
 */
function floatingStamp(isoDate: string, hour: number, minute: number): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${isoDate.replace(/-/g, "")}T${hh}${mm}00`;
}

/** Folds long lines at 75 octets, as iCalendar requires. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

function escape(value: string): string {
  return value.replace(/[\\;,]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
}

/**
 * Calendar invitation for a requested site visit, attached to the decorator's
 * notification email so the job goes straight into their diary.
 *
 * Morning visits are pencilled in at 9am, afternoons at 1pm, and "either" at
 * 9am — the decorator confirms the real time when they ring, which is what the
 * booking copy promises.
 */
export function buildVisitIcs({
  date,
  preference,
  name,
  address,
  phone,
  email,
  notes,
}: {
  date: string;
  preference: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
}): string {
  const startHour = preference === "Afternoon" ? 13 : 9;
  const dtStart = floatingStamp(date, startHour, 0);
  const dtEnd = floatingStamp(date, startHour, 45);
  const now = new Date();
  const uid = `visit-${date}-${startHour}-${phone.replace(/\D/g, "").slice(-6)}@thepaintmen`;

  const description = [
    `Site visit request via the website.`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Preference: ${preference}`,
    notes ? `Notes: ${notes}` : null,
    ``,
    `Ring to confirm the time before the visit.`,
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.name}//Site visit//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    fold(`SUMMARY:${escape(`Site visit — ${name}, ${address}`)}`),
    fold(`LOCATION:${escape(address)}`),
    fold(`DESCRIPTION:${escape(description)}`),
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}
