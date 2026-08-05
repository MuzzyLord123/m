import { site } from "@/config/site";

/**
 * Emails are hand-built HTML with inline styles — the only thing that renders
 * reliably across Outlook, Gmail and Apple Mail. Same palette and voice as the
 * site, no third-party template service, nothing to pay for.
 */

const INK = "#141414";
const SOFT = "#4b4b47";
const MUTE = "#6a6a64";
const PAPER = "#fafaf8";
const PLASTER = "#edede9";
const ACCENT = "#1d4fd8";

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${PLASTER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PLASTER};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${PAPER};border-radius:4px;">
<tr><td style="padding:28px 32px 0;">
  <p style="margin:0;font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${INK};">
    <span style="color:${MUTE};">The</span> Paint <span style="border-bottom:3px solid ${ACCENT};padding-bottom:2px;">Man</span>
  </p>
</td></tr>
<tr><td style="padding:24px 32px 32px;font:400 15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${SOFT};">
${body}
</td></tr>
<tr><td style="padding:0 32px 28px;">
  <hr style="border:0;border-top:1px solid #d8d8d2;margin:0 0 16px;">
  <p style="margin:0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTE};">
    ${escapeHtml(site.name)} · ${escapeHtml(site.town)} · <a href="tel:${escapeHtml(site.phoneHref)}" style="color:${ACCENT};text-decoration:none;">${escapeHtml(site.phone)}</a>
  </p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function rows(pairs: [string, string | undefined][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
${pairs
  .filter(([, value]) => value)
  .map(
    ([label, value]) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid ${PLASTER};font:400 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTE};width:38%;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:8px 0;border-bottom:1px solid ${PLASTER};font:600 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(value as string)}</td>
</tr>`,
  )
  .join("")}
</table>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** To the decorator: everything needed to price the job and ring back. */
export function quoteNotification(input: {
  service: string;
  property: string;
  rooms: string;
  timing: string;
  name: string;
  phone: string;
  email: string;
  town: string;
  message?: string;
  hasPhotos?: boolean;
}): string {
  return shell(
    "New quote enquiry",
    `<h1 style="margin:0 0 6px;font:600 22px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">New quote enquiry</h1>
<p style="margin:0 0 20px;color:${MUTE};font-size:14px;">${escapeHtml(input.name)} in ${escapeHtml(input.town)}.</p>
${rows([
  ["Trade", input.service],
  ["Property", input.property],
  ["How much", input.rooms],
  ["Timing", input.timing],
  ["Name", input.name],
  ["Phone", input.phone],
  ["Email", input.email],
  ["Town", input.town],
  ["Has photos", input.hasPhotos ? "Yes — waiting on them" : undefined],
])}
${
  input.message
    ? `<p style="margin:0 0 6px;font:400 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTE};">What they said</p>
<p style="margin:0 0 20px;padding:14px 16px;background:${PLASTER};border-radius:4px;white-space:pre-wrap;color:${INK};">${escapeHtml(input.message)}</p>`
    : ""
}
<p style="margin:0;"><a href="tel:${escapeHtml(input.phone)}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Ring ${escapeHtml(input.name)}</a></p>`,
  );
}

/** To the enquirer: confirmation, and exactly what happens next. */
export function quoteConfirmation(input: { name: string; service: string }): string {
  return shell(
    "We have your enquiry",
    `<h1 style="margin:0 0 6px;font:600 22px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">Thanks ${escapeHtml(input.name.split(" ")[0])}, we have it.</h1>
<p style="margin:0 0 20px;">Your enquiry about ${escapeHtml(input.service.toLowerCase())} has landed with us. Here is what happens next.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
${["We ring you within one working day to talk it through.", "We come and look at the job, and measure up.", "A written, itemised price lands in your inbox within 48 hours."]
  .map(
    (step, index) => `<tr>
<td width="34" style="padding:6px 0;vertical-align:top;font:600 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${ACCENT};">0${index + 1}</td>
<td style="padding:6px 0;font:400 15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${SOFT};">${escapeHtml(step)}</td>
</tr>`,
  )
  .join("")}
</table>
<p style="margin:0 0 20px;">No obligation and no follow-up calls unless you ask for them. If anything changes, or you would rather talk now, ring <a href="tel:${escapeHtml(site.phoneHref)}" style="color:${ACCENT};">${escapeHtml(site.phone)}</a>.</p>`,
  );
}

/** To the decorator: a requested site visit, with the .ics attached. */
export function bookingNotification(input: {
  dateLabel: string;
  preference: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  message?: string;
}): string {
  return shell(
    "Site visit requested",
    `<h1 style="margin:0 0 6px;font:600 22px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">Site visit requested</h1>
<p style="margin:0 0 20px;color:${MUTE};font-size:14px;">Pencilled into the attached calendar file. Ring to confirm.</p>
${rows([
  ["Day", input.dateLabel],
  ["Preference", input.preference],
  ["Name", input.name],
  ["Phone", input.phone],
  ["Email", input.email],
  ["Address", input.address],
])}
${
  input.message
    ? `<p style="margin:0 0 6px;font:400 13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTE};">What they said</p>
<p style="margin:0;padding:14px 16px;background:${PLASTER};border-radius:4px;white-space:pre-wrap;color:${INK};">${escapeHtml(input.message)}</p>`
    : ""
}`,
  );
}

/** To the enquirer: honest about it being a request, not a confirmed slot. */
export function bookingConfirmation(input: {
  name: string;
  dateLabel: string;
  preference: string;
}): string {
  return shell(
    "Your site visit request",
    `<h1 style="margin:0 0 6px;font:600 22px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">Thanks ${escapeHtml(input.name.split(" ")[0])}, that is requested.</h1>
<p style="margin:0 0 18px;">You have asked for a visit on <strong style="color:${INK};">${escapeHtml(input.dateLabel)}</strong>, ${escapeHtml(input.preference.toLowerCase())}.</p>
<p style="margin:0 0 18px;">Nothing is booked until we have spoken. We will ring within one working day to fix the time properly, because a decorator who is still up a ladder at four o'clock should not be promising you a two o'clock visit.</p>
<p style="margin:0;">If that day stops working, ring <a href="tel:${escapeHtml(site.phoneHref)}" style="color:${ACCENT};">${escapeHtml(site.phone)}</a> and we will move it.</p>`,
  );
}
