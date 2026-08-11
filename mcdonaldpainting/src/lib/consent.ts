/**
 * Consent.
 *
 * Under UK PECR, analytics cookies need consent before they are set — not
 * after, and not on the strength of "by continuing to browse you agree". So
 * this is not a banner that decorates a decision already taken: GA4 is not
 * loaded at all until someone says yes, and saying no means the tag never
 * arrives on the page.
 *
 * What is stored:
 *   - The choice itself, in localStorage. Not a cookie, because it does not
 *     need to reach the server, and a value that never leaves the browser is
 *     easier to explain honestly on the privacy page.
 *   - Nothing else, ever, without `analytics: true`.
 *
 * `VERSION` exists so that if the site ever starts using something new, the
 * stored answer is invalidated and the question is asked again rather than an
 * old yes being stretched to cover a new thing.
 */

export const CONSENT_KEY = 'mpc.consent';
export const CONSENT_VERSION = 1;

export type Consent = {
  version: number;
  /** Always true. The site does not work without it and it is not asked about. */
  essential: true;
  analytics: boolean;
  decidedAt: string;
};

/** Null means nobody has been asked yet, or the stored answer is out of date. */
export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean') return null;
    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: parsed.analytics,
      decidedAt: typeof parsed.decidedAt === 'string' ? parsed.decidedAt : '',
    };
  } catch {
    // Private browsing, a full quota, or a storage-blocking extension. Treat it
    // as "not asked" rather than throwing — the site has to work either way.
    return null;
  }
}

export function writeConsent(analytics: boolean): Consent {
  const consent: Consent = {
    version: CONSENT_VERSION,
    essential: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Storage refused. The choice still applies for this page view — it just
    // will not be remembered, and the notice will ask again next time.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: consent }));
  return consent;
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* nothing to do */
  }
  window.dispatchEvent(new Event(CONSENT_REOPEN));
}

/** Fired when a choice is made, so the analytics loader can react immediately. */
export const CONSENT_EVENT = 'mpc:consent';
/** Fired by the footer link, to reopen the notice after a decision. */
export const CONSENT_REOPEN = 'mpc:consent-reopen';

/**
 * What is actually stored, listed for the notice and the privacy page. These
 * two surfaces read the same array so the page cannot describe something the
 * site does not do.
 */
export const STORED_ITEMS = [
  {
    name: CONSENT_KEY,
    kind: 'Local storage',
    purpose: 'Remembers the choice made below, so you are not asked on every page.',
    expires: 'Until you clear it, or twelve months, whichever is first',
    category: 'essential' as const,
  },
  {
    name: '_ga, _ga_*',
    kind: 'Cookie, set by Google Analytics',
    purpose:
      'Counts visits and which pages get read, so we can see whether the site is doing its job. It does not identify you.',
    expires: 'Up to two years',
    category: 'analytics' as const,
  },
];
