import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { phone, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const alt =
  'KH Painting and Decorating — painter, decorator and spray finisher. A black-and-white mock-Tudor house from one of Kenny’s jobs.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The share card — what shows when the site is posted on Facebook, WhatsApp or
 * LinkedIn, so it is built to stop a thumb.
 *
 * The site's own opening reduced to one frame: Kenny's mock-Tudor job full-bleed,
 * darkened from the left, his logo, the headline in the wide signwriter's cut with
 * "spray finisher" in gold, a gilt keyline inset from the edge, and the number.
 *
 * Its assets live in src/og/, prepared for this and nothing else:
 *   - photo.jpg — the hero photograph cropped to 1200×630;
 *   - kh-logo.png — his logo at share size;
 *   - archivo-wide-700/600.ttf — static TTF cuts of the site's Archivo at the
 *     widths the headings and labels use. `ImageResponse` needs TTF/OTF/WOFF and
 *     cannot read a variable font's width axis, so the cuts are fixed instances
 *     (wght 700 wdth 118, wght 600 wdth 125), subset to the letters used, 13KB each.
 *     Regenerate with fonttools' instancer if the wording here gains a new letter.
 *
 * Colours are literals because `ImageResponse` renders outside the document and
 * has no CSS variables. Keep them in step with the `@theme` block in globals.css.
 */
export default async function OpenGraphImage() {
  const dir = join(process.cwd(), 'src', 'og')
  const [photo, logo, wide700, wide600] = await Promise.all([
    readFile(join(dir, 'photo.jpg'), 'base64'),
    readFile(join(dir, 'kh-logo.png'), 'base64'),
    readFile(join(dir, 'archivo-wide-700.ttf')),
    readFile(join(dir, 'archivo-wide-600.ttf')),
  ])
  const place = isPlaceholder(town) ? 'the north west' : town

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        backgroundColor: '#0E0C0A',
        fontFamily: 'Archivo Wide',
      }}
    >
      <img
        src={`data:image/jpeg;base64,${photo}`}
        width={1200}
        height={630}
        alt=""
        style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }}
      />
      {/* The scrims: from the left, where the words are, and from the foot. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          backgroundImage:
            'linear-gradient(90deg, rgba(8,7,6,0.94) 0%, rgba(8,7,6,0.82) 42%, rgba(8,7,6,0.25) 75%, rgba(8,7,6,0.1) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          backgroundImage: 'linear-gradient(0deg, rgba(8,7,6,0.85) 0%, rgba(8,7,6,0) 45%)',
        }}
      />
      {/* The gilt keyline. */}
      <div
        style={{
          position: 'absolute',
          top: 22,
          left: 22,
          right: 22,
          bottom: 22,
          display: 'flex',
          border: '1px solid rgba(241,220,148,0.45)',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '64px 72px',
        }}
      >
        <img src={`data:image/png;base64,${logo}`} width={190} height={100} alt="" />

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Archivo Label',
              fontSize: 17,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#C9A227',
            }}
          >
            <div style={{ width: 9, height: 9, marginRight: 16, backgroundColor: '#C9A227', transform: 'rotate(45deg)' }} />
            Painting &amp; Decorating · North West England
          </div>
          {/* Three lines, each one node: satori wants one child per text block. */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22, fontSize: 64, lineHeight: 1.02, letterSpacing: -1.6, color: '#F1ECE3' }}>
            <div style={{ display: 'flex' }}>Painter, decorator</div>
            <div style={{ display: 'flex' }}>
              <span style={{ marginRight: 18 }}>and</span>
              <span style={{ color: '#E2C55F' }}>spray finisher</span>
            </div>
            <div style={{ display: 'flex' }}>{`in ${place}`}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              padding: '15px 26px',
              backgroundColor: '#C9A227',
              color: '#0E0C0A',
              fontFamily: 'Archivo Label',
              fontSize: 19,
              letterSpacing: 2.5,
            }}
          >
            {`RING KENNY · ${phone.label}`}
          </div>
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              marginLeft: 26,
              fontSize: 15,
              color: '#ADA79D',
              fontFamily: 'Archivo Label',
              letterSpacing: 2,
            }}
          >
            FREE QUOTES · SPRAYING · DUSTLESS SANDING
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Archivo Wide', data: wide700, weight: 700, style: 'normal' },
        { name: 'Archivo Label', data: wide600, weight: 600, style: 'normal' },
      ],
    },
  )
}
