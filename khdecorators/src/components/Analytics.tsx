import Script from 'next/script'
import { ADS_ID, GA4_ID } from '@/lib/conversions'

/**
 * The Google Ads tag, carried over from the old site, plus GA4 if it is configured.
 *
 * `afterInteractive`: the tag loads after the page is usable. It must not compete
 * with the largest image and the font for the first two seconds, because LCP has a
 * budget on this project (§10) and because a slow landing page is money on paid
 * traffic — the same money the tag exists to measure.
 *
 * One gtag.js load configured for both properties rather than two script tags. The
 * Ads ID is hard-coded on purpose: it is a known constant, it is already live, and
 * an environment variable that failed to get set on the host would silently take
 * the conversion tracking off the site.
 *
 * Note on UK consent: Ads and GA4 both set cookies, and PECR expects consent for
 * the analytics ones. There is no consent banner here because the brief did not ask
 * for one and because a banner on a paid landing page costs enquiries — but it is a
 * decision for Kenny to make knowingly rather than one to leave unmentioned. If he
 * wants it, Google Consent Mode v2 is the route, and it is written up in
 * ADS-MIGRATION.md §8 so nobody has to rediscover it.
 */
export function Analytics() {
  return (
    <>
      <Script
        id="gtag-js"
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
          ${GA4_ID ? `gtag('config', '${GA4_ID}');` : ''}
        `}
      </Script>
    </>
  )
}
