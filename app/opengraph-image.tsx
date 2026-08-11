import { ImageResponse } from 'next/og'
import { business, meta } from '@/content/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = meta.title

/**
 * Built from the brand block, not a screenshot: Brunswick green field, the
 * logotype swatch, the trade and the place, and the phone number on the
 * tin-lid orange slab. Flat colour only — no gradient, no photograph, nothing
 * that has to be licensed.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#1F3D33',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FFFDF8',
              color: '#1F3D33',
              fontSize: 46,
              fontWeight: 800,
              padding: '6px 18px 12px',
              letterSpacing: '0.02em',
            }}
          >
            {business.shortName}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              color: '#FFFDF8',
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: '0.22em',
              lineHeight: 1.25,
            }}
          >
            <span>PAINTER &amp;</span>
            <span>DECORATOR</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: '#FFFDF8',
              fontSize: 86,
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
            }}
          >
            Painter &amp; decorator in Wrexham.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              color: '#FFFDF8',
              fontSize: 28,
              opacity: 0.92,
            }}
          >
            Wrexham · Coedpoeth · and the surrounding area
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#B8420F',
              color: '#FFFDF8',
              fontSize: 62,
              fontWeight: 800,
              padding: '18px 34px 24px',
              letterSpacing: '-0.01em',
            }}
          >
            {business.phoneDisplay}
          </div>
          <div style={{ display: 'flex', gap: 0 }}>
            {['#5B7C99', '#B9714F', '#7C8B6A', '#2A2723'].map((c) => (
              <div key={c} style={{ display: 'flex', width: 46, height: 92, backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
