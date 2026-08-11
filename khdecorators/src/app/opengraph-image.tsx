import { ImageResponse } from 'next/og'
import { business, phone, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const alt = 'KH Painting and Decorating — painting, decorating and spray finishing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The share card.
 *
 * The site's own language reduced to one frame: cool white, the exposed grid, ink
 * type, and the signal blue used once. No photograph — there are none yet, and a
 * share card built around an empty slot is worse than one built around type.
 *
 * Rendered with the runtime's default sans rather than Geist: `ImageResponse` needs a
 * ttf, otf or woff, and the `geist` package ships woff2 only. Loading a second copy of
 * the typeface purely for this image is not worth the weight — the card is type on
 * paper either way and the difference is invisible at share size.
 */
export default function OpenGraphImage() {
  const place = isPlaceholder(town) ? 'the north west' : town

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#F6F7F5',
        color: '#101413',
        padding: '72px',
        position: 'relative',
      }}
    >
      {/* The grid. Twelve columns, the same as the site. */}
      {Array.from({ length: 13 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${(i / 12) * 100}%`,
            width: '1px',
            backgroundColor: '#E7EAE8',
          }}
        />
      ))}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5C635F',
          }}
        >
          {business.name}
        </div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5C635F',
          }}
        >
          01
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '96px', height: '2px', backgroundColor: '#1D3BD6' }} />
        {/* One interpolated string, not text plus an expression: satori requires a
              div with more than one child node to declare its display mode, and
              `text {place}` counts as two children. */}
        <div
          style={{
            marginTop: 28,
            fontSize: 76,
            lineHeight: 1.05,
            letterSpacing: '-0.015em',
            maxWidth: '900px',
          }}
        >
          {`Painter, decorator and spray finisher in ${place}`}
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 26,
            color: '#5C635F',
            maxWidth: '820px',
          }}
        >
          UPVC, garage doors, render and kitchen doors sprayed. Dustless sanding, so you can stay in
          the house.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div style={{ fontSize: 34, color: '#1D3BD6' }}>{phone.label}</div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5C635F',
          }}
        >
          khdecorators.uk
        </div>
      </div>
    </div>,
    size,
  )
}
