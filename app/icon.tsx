import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

/** The logotype swatch, reduced to the size of a browser tab. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1F3D33',
          color: '#FFFDF8',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.02em',
        }}
      >
        FAS
      </div>
    ),
    size,
  )
}
