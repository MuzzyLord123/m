import { ImageResponse } from 'next/og';

/**
 * The sharing card.
 *
 * The same idea as the site, reduced to one frame: a hard centre seam with a
 * grey state on one side and a white one on the other. No photograph, because
 * the only honest photographs for this business are the before-and-after pairs
 * and none of them is in yet.
 *
 * Syne is fetched at build time. If that fetch fails the card still renders in
 * the fallback face rather than failing the build — a slightly off-brand
 * sharing image is a much smaller problem than a site that will not deploy.
 */

export const alt = 'Ego Decorators — painters, decorators and exterior repair, Neston';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generated once at build time, never per request. Required for the static
// export used by the shared-hosting bundle, and the right behaviour anyway —
// the card does not change between requests.
export const dynamic = 'force-static';

async function syne(): Promise<ArrayBuffer | null> {
  try {
    // The old user-agent matters: Google serves TTF to it, and satori cannot
    // read the woff2 that a modern browser string gets you.
    const css = await fetch('https://fonts.googleapis.com/css2?family=Syne:wght@800', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1)' },
    }).then((r) => r.text());

    const url = css.match(/src:\s*url\((.+?)\)/)?.[1];
    if (!url) return null;

    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const font = await syne();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0A0A0A',
          color: '#FFFFFF',
          fontFamily: font ? 'Syne' : 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Before — grey. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            padding: 64,
            background: '#6E6E6E',
            color: '#0A0A0A',
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase' }}>Before</div>
          <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>EG</div>
        </div>

        {/* After — white. The colour in this business is the paint. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 64,
            background: '#FFFFFF',
            color: '#0A0A0A',
          }}
        >
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase' }}>After</div>
          <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>O</div>
        </div>

        {/* The seam. */}
        <div
          style={{
            position: 'absolute',
            left: 599,
            top: 0,
            width: 4,
            height: 630,
            background: '#0A0A0A',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 64,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#0A0A0A',
            display: 'flex',
          }}
        >
          Ego Decorators · Neston
        </div>
      </div>
    ),
    {
      ...size,
      ...(font
        ? { fonts: [{ name: 'Syne', data: font, weight: 800 as const, style: 'normal' as const }] }
        : {}),
    },
  );
}
