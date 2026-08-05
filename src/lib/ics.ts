import { site } from "@/config/site";

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
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
  const start = new Date(`${date}T${preference === "Afternoon" ? "13:00:00" : "09:00:00"}Z`);
  const end = new Date(start.getTime() + 45 * 60 * 1000);
  const now = new Date();
  const uid = `visit-${start.getTime()}-${phone.replace(/\D/g, "").slice(-6)}@thepaintman`;

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
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    fold(`SUMMARY:${escape(`Site visit — ${name}, ${address}`)}`),
    fold(`LOCATION:${escape(address)}`),
    fold(`DESCRIPTION:${escape(description)}`),
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join("\r\n")}\r\n`;
}
