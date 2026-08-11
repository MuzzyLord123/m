/**
 * Site-wide facts. Everything here is a single source of truth — if a value
 * appears in two places on the site, it is imported from here, not retyped.
 *
 * Nothing in this file may be invented. If a fact is not confirmed, it belongs
 * in content/needed.ts as an open question and renders as a labelled frame.
 */

/* -------------------------------------------------------------------------
   Telephone — ONE constant.

   The old site displayed 07944512946 and linked tel:0794451946. The href was
   two digits short, so every mobile visitor who tapped it either failed to
   connect or rang a stranger. That happened because the label and the link
   were typed separately, twice, on every page.

   Here there is exactly one number in the codebase. The E.164 form is the
   constant; the display form is derived from it. They cannot drift apart,
   and the assertion below fails the build if anyone makes them.
------------------------------------------------------------------------- */

/** CONFIRM with Neil before launch — see content/needed.ts#phone. */
const PHONE_E164 = '+447944512946';

/** true only once Neil has said the number aloud and it has been dialled. */
const PHONE_CONFIRMED = false;

function toNationalDigits(e164: string): string {
  if (!e164.startsWith('+44')) {
    throw new Error(`PHONE_E164 must be a UK number in E.164 form, got: ${e164}`);
  }
  return `0${e164.slice(3)}`;
}

/** 07944 512946 — UK mobiles group 5 + 6 after the leading zero. */
function formatUkMobile(e164: string): string {
  const national = toNationalDigits(e164);
  if (!/^07\d{9}$/.test(national)) {
    throw new Error(
      `Expected a UK mobile (07 + 9 digits) so it can be grouped 5+6, got: ${national}. ` +
        `If Neil's number is a landline, update formatUkMobile() — do not hand-type the label.`,
    );
  }
  return `${national.slice(0, 5)} ${national.slice(5)}`;
}

export const phone = {
  /** For tel: hrefs and JSON-LD. */
  e164: PHONE_E164,
  /** The only href used anywhere. */
  href: `tel:${PHONE_E164}`,
  /** The only label rendered anywhere. */
  display: formatUkMobile(PHONE_E164),
  confirmed: PHONE_CONFIRMED,
} as const;

// The bug that shipped on the old site, made impossible: label and href must
// contain the same digits. This runs at module load, so a mismatch fails the build.
{
  const hrefDigits = phone.href.replace(/\D/g, '');
  const labelDigits = phone.display.replace(/\D/g, '');
  if (!hrefDigits.endsWith(labelDigits.slice(1))) {
    throw new Error(
      `Phone label and href disagree: label ${phone.display} vs href ${phone.href}. ` +
        `This is exactly the bug the rebuild exists to fix.`,
    );
  }
}

/* ------------------------------------------------------------------------- */

/** Year Neil started on his own account. Never write a years-of-experience
 *  number by hand — derive it from this or say "since 1990". */
export const FOUNDED = 1990;

/** Completed years trading. Used on /about, which revalidates daily so it
 *  cannot go stale in January the way the old site's "40 years" did. */
export function yearsTrading(now: Date = new Date()): number {
  return now.getFullYear() - FOUNDED;
}

export const site = {
  name: 'Neil Brookfield',
  /** Canonical host. Do not change this — see MIGRATION.md. */
  url: 'https://www.neilbrookfield.co.uk',
  trade: 'Decorator',
  base: 'Chester, Cheshire',
  /** Copy across from the Wix head before DNS moves, or Search Console access
   *  is lost at cutover. */
  googleSiteVerification: 'IQTIQM2cKMZBMAqGucesXYcbBYO1Z6HquKUwQgMLfnI',
  /** Broad statement only. Named villages and a radius are unconfirmed —
   *  see content/needed.ts#area. */
  areaServed: ['Chester', 'Cheshire'],
  foundingDate: String(FOUNDED),
} as const;

export const nav = [
  { href: '/work', label: 'Work' },
  { href: '/hand-painted-kitchens', label: 'Hand-painted kitchens' },
  { href: '/decorating', label: 'Decorating' },
  { href: '/workshops', label: 'Workshops' },
  { href: '/about', label: 'About' },
] as const;

export const cta = {
  label: 'Arrange a visit',
  href: '/contact',
} as const;
