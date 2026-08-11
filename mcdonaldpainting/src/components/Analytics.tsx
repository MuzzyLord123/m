'use client';

import Script from 'next/script';
import { useEffect } from 'react';

/**
 * GA4 and nothing else.
 *
 * Two events are worth more to Sean than every pageview on the site put
 * together, because they are the two that show the site is doing the job the
 * rebuild was paid for:
 *
 *   capability_statement_download — a buyer took the PDF and left a work email.
 *   enquiry_type_selected         — how many enquiries are tender and commercial
 *                                   rather than domestic.
 *
 * Phone taps are tracked too, since on mobile that is the conversion.
 *
 * Nothing loads unless NEXT_PUBLIC_GA_ID is set, so a preview build sends no
 * data anywhere and Lighthouse measures the site rather than the tag.
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

  // One delegated listener for every [data-analytics] element on the site, so a
  // link does not have to become a client component to be measurable.
  useEffect(() => {
    if (!id) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('[data-analytics]');
      if (!el) return;
      track(el.getAttribute('data-analytics') ?? 'click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [id]);

  if (!id) return null;

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
