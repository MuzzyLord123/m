import { ImageResponse } from 'next/og';

import { accreditation, coverage, site } from '@content/site';

/**
 * The sharing card. Built from the same tokens as the site — graphite ground,
 * one hi-vis rule, a metadata row along the bottom — rather than a photograph,
 * because there is no photograph on this site that has been cleared for it yet.
 *
 * System type rather than Schibsted: fetching a font file at image-generation
 * time is a network dependency on a code path that has to work every time
 * something is pasted into a message.
 */
export const alt = 'McDonald Painting Contractors Ltd — commercial and industrial painting contractors';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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
          background: '#14181B',
          color: '#F4F2EE',
          padding: 64,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 20, letterSpacing: 3, color: '#CFC9BE' }}>
          {site.legalName.toUpperCase()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Commercial and industrial
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            painting contractors
          </div>
          <div style={{ display: 'flex', width: 200, height: 8, background: '#E4FF32', marginTop: 28 }} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #39424A',
            paddingTop: 20,
            fontSize: 20,
            color: '#CFC9BE',
          }}
        >
          <div style={{ display: 'flex' }}>{coverage.wider}</div>
          <div style={{ display: 'flex' }}>
            {accreditation.name} · Company no. {site.companyNumber}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
