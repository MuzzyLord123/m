'use client'

import { PALETTE } from '@content/fields'
import { business, phone } from '@content/site'

/**
 * The last resort: this replaces the root layout, so it gets its own <html>
 * and cannot rely on the site's stylesheet having loaded. Hence the inline
 * styles — but the phone number and the colours still come from the content
 * files, because "the number appears in exactly one place" is not a rule that
 * gets suspended on the page most likely to be someone's only visit.
 */

export default function GlobalError() {
  const { bg, fg } = PALETTE.f1

  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          padding: '4rem max(1.25rem, 4vw)',
          backgroundColor: bg,
          color: fg,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 15,
          letterSpacing: '0.04em',
        }}
      >
        <p style={{ margin: 0, textTransform: 'uppercase' }}>{business.name}</p>
        <p style={{ marginTop: '2rem' }}>Sorry — the site is not loading. Give Andy a ring.</p>
        <a
          href={phone.href}
          style={{
            display: 'block',
            marginTop: '2rem',
            fontSize: 'clamp(1.75rem, 5.5vw, 4rem)',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          {phone.display}
        </a>
      </body>
    </html>
  )
}
