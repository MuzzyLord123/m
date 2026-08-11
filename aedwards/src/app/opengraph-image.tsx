import { ImageResponse } from 'next/og'
import { PALETTE } from '@content/fields'
import { intro } from '@content/copy'
import { business, phone } from '@content/site'
import { yellRating } from '@content/reviews'
import { formatRating } from '@/lib/format'

/**
 * Field one, as a share card: the same deep green, the same type, the same
 * three things — who he is, what the rating is, and the number.
 *
 * The typefaces are fetched from Google at build time. If that fetch fails the
 * card renders in the fallback face rather than failing the build: a slightly
 * plainer share image is a much smaller problem than a site that will not
 * deploy.
 */

export const alt = `${business.name} — painter and decorator, ${business.town}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`,
      // An older user-agent gets truetype or woff back instead of woff2,
      // which is what the image renderer can actually parse.
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1)' } },
    ).then((r) => (r.ok ? r.text() : ''))

    const url = /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/.exec(css)?.[1]
    if (!url) return null

    const font = await fetch(url)
    return font.ok ? await font.arrayBuffer() : null
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const [display, mono] = await Promise.all([
    loadFont('Bricolage+Grotesque', 800),
    loadFont('DM+Mono', 500),
  ])

  const fonts = [
    ...(display
      ? [{ name: 'Bricolage Grotesque', data: display, weight: 800 as const, style: 'normal' as const }]
      : []),
    ...(mono ? [{ name: 'DM Mono', data: mono, weight: 500 as const, style: 'normal' as const }] : []),
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: PALETTE.f1.bg,
          color: PALETTE.f1.fg,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: display ? 'Bricolage Grotesque' : 'sans-serif',
              fontSize: 104,
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              maxWidth: 900,
            }}
          >
            {intro.name}
          </div>
          <div
            style={{
              fontFamily: mono ? 'DM Mono' : 'monospace',
              fontSize: 28,
              letterSpacing: '0.04em',
              marginTop: 32,
            }}
          >
            {intro.line}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: mono ? 'DM Mono' : 'monospace',
            fontSize: 30,
            letterSpacing: '0.04em',
          }}
        >
          {/* Spelled out rather than starred: DM Mono has no ★, and letting the
              renderer go looking for a font that does costs a network round
              trip at build time for a glyph nobody needs at this size. */}
          <div style={{ display: 'flex' }}>
            {formatRating(yellRating.average)} out of 5 · {yellRating.count} reviews · Yell
          </div>
          <div style={{ display: 'flex' }}>{phone.display}</div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) },
  )
}
