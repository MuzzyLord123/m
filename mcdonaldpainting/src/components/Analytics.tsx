'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import { CONSENT_EVENT, readConsent, type Consent } from '@/lib/consent';

/**
 * GA4 and nothing else — and not until it is allowed.
 *
 * The tag is not rendered at all until someone has said yes. That is stricter
 * than the usual arrangement, where the script loads on arrival and a banner
 * asks permission afterwards for something that has already happened, and it is
 * what UK PECR actually requires. It also means a visitor who declines carries
 * no third-party JavaScript at all.
 *
 * Two events are worth more to Sean than every pageview on the site put
 * together, because they are the two that show the rebuild is working:
 *
 *   capability_statement_download — a buyer took the PDF and left a work email.
 *   enquiry_type_selected         — how many enquiries are tender and commercial
 *                                   rather than domestic.
 *
 * Phone taps are tracked too, since on mobile that is the conversion.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Record<string, string> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', event, params);
}

export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(readConsent()?.analytics === true);

    const onDecision = (e: Event) => {
      setAllowed((e as CustomEvent<Consent>).detail?.analytics === true);
    };
    window.addEventListener(CONSENT_EVENT, onDecision);
    return () => window.removeEventListener(CONSENT_EVENT, onDecision);
  }, []);

  // One delegated listener for every [data-analytics] element on the site, so a
  // link does not have to become a client component to be measurable. It is
  // harmless without consent — track() is a no-op until gtag exists.
  useEffect(() => {
    if (!id || !allowed) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-analytics]');
      if (!el) return;
      track(el.getAttribute('data-analytics') ?? 'click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [id, allowed]);

  if (!id || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
