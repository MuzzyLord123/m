'use client';

import { CONSENT_REOPEN } from '@/lib/consent';

/**
 * Reopens the consent notice.
 *
 * A choice you cannot revisit is not a choice, and a site that hides the way
 * back is the reason people distrust the banner in the first place. This sits
 * in the footer of every page, in the same type as everything around it.
 *
 * It is a button rather than a link because it does not go anywhere — and it
 * degrades honestly: with JavaScript off it is not rendered at all, and the
 * privacy page next to it explains how to clear the stored choice by hand.
 */
export function CookiesLink({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_REOPEN))}
      className={`t-label !text-[var(--muted)] text-left hover:!text-[var(--mark)] ${className}`}
    >
      Cookies
    </button>
  );
}
