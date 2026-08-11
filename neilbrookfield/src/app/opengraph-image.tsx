import fs from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';

import { site, FOUNDED } from '@content/site';

/**
 * The card people see when the site is shared in a message.
 *
 * Set in the site's own type on the site's own ink, because there is no
 * photograph to use yet and a link that previews as a blank grey box looks
 * broken — which matters for a trade that travels by word of mouth.
 *
 * Once there is a hero photograph, this is the place to swap in: read the image
 * off disk and lay the same plate across the foot of it. Each job already uses
 * its own hero photograph for sharing; this is only the fallback.
 *
 * The font is committed to the repo (src/assets/fonts) rather than fetched at
 * build time, so a build with no network still produces the right card.
 * Fraunces is under the SIL Open Font Licence — see the licence file beside it.
 */

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${site.name} — decorator and hand-painted kitchens, Chester`;

const fraunces = fs.readFileSync(
  path.join(process.cwd(), 'src/assets/fonts/Fraunces-Light.ttf'),
);

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
          backgroundColor: '#101518',
          color: '#F4EFE8',
          padding: '72px 80px',
          fontFamily: 'Fraunces',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 96, height: 1, backgroundColor: '#A9822F' }} />
          <div
            style={{
              marginTop: 22,
              fontSize: 22,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#A9822F',
            }}
          >
            Decorator · Chester and Cheshire
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 92, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
            {site.name}
          </div>
          <div style={{ marginTop: 26, fontSize: 34, lineHeight: 1.35, color: '#9BA3A6' }}>
            Hand-painted kitchens and furniture, and decorating
          </div>
          {/* One string, not an interpolation: satori requires an explicit
              display on any element with more than one child node. */}
          <div style={{ marginTop: 4, fontSize: 34, lineHeight: 1.35, color: '#9BA3A6' }}>
            {`inside and out. Trading since ${FOUNDED}.`}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Fraunces', data: fraunces, style: 'normal', weight: 300 }],
    },
  );
}
