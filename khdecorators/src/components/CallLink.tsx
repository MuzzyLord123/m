'use client'

import type { ReactNode } from 'react'
import { recordConversion } from '@/lib/conversions'
import { email, phone } from '@content/site'

/**
 * Tap-to-call, and the click is a conversion.
 *
 * On the old site the only way to make contact was an embedded Google Form. Half of
 * paid traffic on a trade site is somebody standing in their hallway who wants to
 * talk to a person, and for them the number IS the conversion — so it fires the
 * same mapped Ads action the form does.
 *
 * `href` and label both come from the one constant in /content/site.ts, so the
 * number on screen cannot drift from the number being dialled.
 *
 * It is a plain link. The click handler is a passenger: if the JavaScript fails, is
 * blocked, or has not loaded yet, the link still dials. Nothing about getting hold
 * of Kenny depends on tracking working.
 */
export function CallLink({
  children,
  className,
  /** Where on the site the tap happened. Useful in GA4, ignored by Ads. */
  from,
}: {
  children?: ReactNode
  className?: string
  from?: string
}) {
  return (
    <a
      href={phone.href}
      className={className}
      data-from={from}
      onClick={() => recordConversion('call')}
    >
      {children ?? phone.label}
    </a>
  )
}

/**
 * The email address, and the click is a conversion too — a lower-intent one than a
 * call, but it is still an enquiry and it should be counted as one.
 */
export function EmailLink({
  children,
  className,
  from,
}: {
  children?: ReactNode
  className?: string
  from?: string
}) {
  return (
    <a
      href={`mailto:${email}`}
      className={className}
      data-from={from}
      onClick={() => recordConversion('email')}
    >
      {children ?? email}
    </a>
  )
}
