/**
 * A radius sketch, drawn the way you would draw it on the back of a quote:
 * two wobbly rings, two towns marked, nothing pretending to be cartography.
 *
 * Not a Google Maps embed — a third-party iframe on the main page costs more in
 * load time than it gives back, and this was never a wayfinding problem. Only
 * the two places the client confirmed are marked.
 *
 * `tone` switches the whole thing for a dark background rather than trying to
 * recolour it from the outside. Orange stays orange in both — it is the marker
 * on the town he is based in, and it clears 3:1 against paper and green alike.
 */
export function AreaSketch({
  className = '',
  tone = 'ink',
}: {
  className?: string
  tone?: 'ink' | 'chalk'
}) {
  const chalk = tone === 'chalk'
  const line = chalk ? '#FFFDF8' : '#4A443C'
  const ring = chalk ? '#FFFDF8' : '#1F3D33'
  const label = chalk ? '#FFFDF8' : '#16130F'
  const mark = chalk ? '#FFFDF8' : '#1F3D33'
  const caption = chalk ? '#FFFDF8' : '#4A443C'

  return (
    <svg
      viewBox="0 0 420 340"
      className={className}
      role="img"
      aria-label="Sketch showing Wrexham and Coedpoeth with a rough working radius drawn around them."
    >
      {/* outer ring — drawn in one go, so it does not close neatly */}
      <path
        d="M212 36 C 312 30, 392 96, 396 168 C 400 244, 322 306, 214 310 C 110 314, 26 250, 28 168 C 30 92, 116 40, 212 36"
        fill="none"
        stroke={line}
        strokeWidth="2"
        strokeDasharray="10 8"
        strokeLinecap="round"
        opacity={chalk ? 0.75 : 1}
      />

      {/* inner ring */}
      <path
        d="M214 62 C 300 58, 366 106, 364 176 C 362 240, 296 288, 212 290 C 128 292, 66 240, 68 174 C 70 110, 134 66, 214 62"
        fill="none"
        stroke={ring}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* the line between the two, drawn by hand */}
      <path
        d="M176 166 C 192 160, 202 172, 214 180"
        fill="none"
        stroke={line}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Coedpoeth */}
      <rect x="163" y="158" width="12" height="12" fill={mark} />
      <text
        x="92"
        y="146"
        fill={label}
        fontSize="16"
        fontWeight="700"
        style={{ fontFamily: 'var(--font-display)', fontStretch: '125%' }}
      >
        Coedpoeth
      </text>

      {/* Wrexham */}
      <rect x="214" y="176" width="15" height="15" fill="#D24E1B" />
      <text
        x="237"
        y="190"
        fill={label}
        fontSize="19"
        fontWeight="700"
        style={{ fontFamily: 'var(--font-display)', fontStretch: '125%' }}
      >
        Wrexham
      </text>

      <text
        x="8"
        y="332"
        fill={caption}
        fontSize="12.5"
        opacity={chalk ? 0.85 : 1}
        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.12em' }}
      >
        SKETCH — NOT TO SCALE
      </text>
    </svg>
  )
}
