'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import {
  CONSENT_REOPEN,
  STORED_ITEMS,
  readConsent,
  writeConsent,
} from '@/lib/consent';

/**
 * The consent notice.
 *
 * Written and drawn as a site notice rather than as a cookie bar: a graphite
 * panel in the corner with a hi-vis marking across the top, label type, and the
 * same rules and tables as the rest of the site. It is the one piece of
 * interface on a website that everybody has agreed to make ugly, which makes it
 * one of the few places left where care is actually noticeable.
 *
 * The behaviour matters more than the drawing:
 *
 *   - Both choices are one click and they are the same size. A giant "Accept"
 *     next to a buried "Manage" is a dark pattern, and under UK PECR refusing
 *     has to be as easy as agreeing.
 *   - Nothing is set before the choice. GA4 is not loaded until analytics is
 *     allowed — see components/Analytics.tsx.
 *   - It renders nothing at all until it has checked storage on the client, so
 *     it can never flash up at somebody who already answered.
 *   - It is not a modal. It does not trap focus or block the page, because a
 *     visitor who wants to read the compliance page before deciding should be
 *     able to. It sits last in the DOM and is reachable by keyboard from
 *     anywhere on the page.
 */
export function Consent() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [detail, setDetail] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    setReady(true);
    setOpen(readConsent() === null);

    const reopen = () => {
      returnFocus.current = true;
      setDetail(false);
      setOpen(true);
    };
    window.addEventListener(CONSENT_REOPEN, reopen);
    return () => window.removeEventListener(CONSENT_REOPEN, reopen);
  }, []);

  // When the footer link reopens it, move focus into the panel — otherwise a
  // keyboard user clicks "Cookies" and nothing appears to happen.
  useEffect(() => {
    if (open && returnFocus.current) {
      panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      returnFocus.current = false;
    }
  }, [open]);

  const decide = useCallback((analytics: boolean) => {
    writeConsent(analytics);
    setOpen(false);
  }, []);

  if (!ready || !open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      data-ground="graphite"
      className="fixed inset-x-4 bottom-4 z-[70] max-w-[30rem] border border-line border-t-[3px] border-t-hivis sm:inset-x-auto sm:left-6 sm:bottom-6"
    >
      <div className="p-6">
        <p className="t-label !text-hivis">Notice · Cookies</p>
        <h2 id="consent-title" className="t-sub mt-3 text-bone">
          One choice, and it is remembered
        </h2>
        <p id="consent-body" className="mt-3 text-[15px] leading-[1.55] text-concrete">
          This site needs nothing from you to work. If you allow it, we count visits so
          Sean can see which pages bring in enquiries. There is no advertising, no
          tracking across other sites, and nothing is sold or shared.
        </p>

        {detail ? (
          <dl className="mt-5 border-t border-line">
            {STORED_ITEMS.map((item) => (
              <div key={item.name} className="border-b border-line py-3">
                <dt className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[14px] font-bold text-bone">
                    {item.name}
                  </span>
                  <span className="t-label shrink-0">
                    {item.category === 'essential' ? 'Always' : 'Only if allowed'}
                  </span>
                </dt>
                <dd className="mt-1.5 text-[13px] leading-[1.5] text-concrete">
                  {item.purpose}
                </dd>
                <dd className="t-label mt-1.5">
                  {item.kind} · {item.expires}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* Both buttons the same weight and the same size. Refusing has to be as
            easy as agreeing, and a grey "reject" next to a bright "accept" is
            the pattern the regulator is actually looking for. */}
        <div className="mt-6 grid grid-cols-2 gap-px bg-line">
          <button
            type="button"
            onClick={() => decide(true)}
            className="t-label !text-graphite bg-hivis px-4 py-3.5 hover:bg-[#c98d18]"
          >
            Allow analytics
          </button>
          <button
            type="button"
            onClick={() => decide(false)}
            className="t-label !text-bone bg-steel px-4 py-3.5 hover:bg-graphite"
          >
            Essential only
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => setDetail((v) => !v)}
            aria-expanded={detail}
            className="t-label hover:!text-hivis underline decoration-1 underline-offset-4"
          >
            {detail ? 'Hide what is stored' : 'What is stored'}
          </button>
          <Link href="/privacy" className="t-label hover:!text-hivis underline decoration-1 underline-offset-4">
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
