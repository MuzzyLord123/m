/**
 * Site-wide facts. One source of truth — a value that appears twice on the site
 * is imported from here twice, never retyped.
 *
 * Nothing in this file may be invented. An unconfirmed fact belongs in
 * content/needed.json as an open question, and renders on the page as a
 * labelled frame that says what is missing.
 */

/* -------------------------------------------------------------------------
   Telephone — ONE constant.

   The E.164 form is the constant. The display label is derived from it, so the
   two cannot drift apart the way hand-typed pairs always eventually do. The
   assertion at the bottom of this block runs at module load, which means a
   mismatch fails the build rather than shipping a number that does not dial.
------------------------------------------------------------------------- */

const PHONE_E164 = '+447450996728';

function toNationalDigits(e164: string): string {
  if (!e164.startsWith('+44')) {
    throw new Error(`PHONE_E164 must be a UK number in E.164 form, got: ${e164}`);
  }
  return `0${e164.slice(3)}`;
}

/** 07450 996728 — UK mobiles group 5 + 6 after the leading zero. */
function formatUkMobile(e164: string): string {
  const national = toNationalDigits(e164);
  if (!/^07\d{9}$/.test(national)) {
    throw new Error(
      `Expected a UK mobile (07 + 9 digits) so it can be grouped 5+6, got: ${national}. ` +
        `If the number changes to a landline, update formatUkMobile() — do not hand-type the label.`,
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
} as const;

{
  const hrefDigits = phone.href.replace(/\D/g, '');
  const labelDigits = phone.display.replace(/\D/g, '');
  if (!hrefDigits.endsWith(labelDigits.slice(1))) {
    throw new Error(
      `Phone label and href disagree: label ${phone.display} vs href ${phone.href}.`,
    );
  }
}

/* -------------------------------------------------------------------------
   Email.

   The old site's footer rendered `info@egodecorators` — no .com — so the
   mailto never resolved. Same fix as the phone: one constant, and a check that
   it is at least shaped like an address.
------------------------------------------------------------------------- */

const EMAIL = 'info@egodecorators.com';

if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(EMAIL)) {
  throw new Error(
    `EMAIL is not a complete address: ${EMAIL}. This is the exact fault the old ` +
      `site shipped — the footer was missing its .com and every mailto failed.`,
  );
}

export const email = {
  address: EMAIL,
  href: `mailto:${EMAIL}`,
} as const;

/* -------------------------------------------------------------------------
   Years trading.

   The old site said "15 Years Extensive Experience". It was written in 2022 and
   has been wrong every year since. There is no hardcoded count here and there
   never will be: set FOUNDED once, and every page derives from it.

   Until Ted confirms the year, `since` is null and the pages that would have
   mentioned it render a labelled frame instead. See content/needed.json#founded.
------------------------------------------------------------------------- */

/** The year they started trading. null until confirmed — never guessed. */
export const FOUNDED: number | null = null;

/** "trading since 2007", or null while the year is unknown. */
export function tradingSince(): string | null {
  return FOUNDED === null ? null : `trading since ${FOUNDED}`;
}

/** Completed years trading, derived — never written down. */
export function yearsTrading(now: Date = new Date()): number | null {
  return FOUNDED === null ? null : now.getFullYear() - FOUNDED;
}

/** For the footer. Computed at render, so it cannot be stale in January. */
export function currentYear(now: Date = new Date()): number {
  return now.getFullYear();
}

/* ------------------------------------------------------------------------- */

export const site = {
  name: 'Ego Decorators',
  /** Canonical host — apex, matching the old site. See MIGRATION.md. */
  url: 'https://egodecorators.com',
  trade: 'Painters and decorators',
  base: 'Neston, Cheshire',
  /** Broad areas only. A named-village list is unconfirmed. */
  areaServed: ['Cheshire', 'Wirral', 'Flintshire'],
} as const;

/**
 * Off-site profiles.
 *
 * Labelled honestly, which the old site did not do: its "google" icon linked to
 * Yell, and Instagram was on an unlabelled icon. A link that says Google goes
 * to Google or it does not ship.
 *
 * `google` stays null until we know whether a Business Profile exists and who
 * controls it — see content/needed.json#google-profile.
 */
export const profiles = {
  instagram: {
    label: 'Instagram',
    href: 'https://www.instagram.com/ego_decorators/',
    handle: '@ego_decorators',
  },
  yell: {
    label: 'Yell',
    href: 'https://www.yell.com/biz/ego-decorators-neston-10357583/',
  },
  google: null as { label: string; href: string } | null,
} as const;

/** Every confirmed off-site profile, for schema `sameAs`. */
export function sameAsUrls(): string[] {
  return [profiles.instagram.href, profiles.yell.href, profiles.google?.href].filter(
    (u): u is string => Boolean(u),
  );
}

export const nav = [
  { href: '/repairs', label: 'Repairs' },
  { href: '/exterior', label: 'Exterior' },
  { href: '/interior', label: 'Interior' },
  { href: '/commercial', label: 'Commercial' },
  { href: '/projects', label: 'Work' },
  { href: '/about', label: 'About' },
] as const;

export const cta = {
  label: 'Get a price',
  href: '/contact',
} as const;
