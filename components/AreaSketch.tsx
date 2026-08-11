/**
 * A radius sketch, drawn the way you would draw it on the back of a quote:
 * two wobbly rings, two towns marked, nothing pretending to be cartography.
 *
 * Not a Google Maps embed — a third-party iframe on the main page costs more in
 * load time than it gives back, and this was never a wayfinding problem. Only
 * the two places the client confirmed are marked.
 */
export function AreaSketch({ className = '' }: { className?: string }) {
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
        stroke="#4A443C"
        strokeWidth="2"
        strokeDasharray="10 8"
        strokeLinecap="round"
      />

      {/* inner ring */}
      <path
        d="M214 62 C 300 58, 366 106, 364 176 C 362 240, 296 288, 212 290 C 128 292, 66 240, 68 174 C 70 110, 134 66, 214 62"
        fill="none"
        stroke="#1F3D33"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* the line between the two, drawn by hand */}
      <path
        d="M176 166 C 192 160, 202 172, 214 180"
        fill="none"
        stroke="#4A443C"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Coedpoeth */}
      <rect x="163" y="158" width="12" height="12" fill="#1F3D33" />
      <text
        x="92"
        y="146"
        fill="#16130F"
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
        fill="#16130F"
        fontSize="19"
        fontWeight="700"
        style={{ fontFamily: 'var(--font-display)', fontStretch: '125%' }}
      >
        Wrexham
      </text>

      <text
        x="8"
        y="332"
        fill="#4A443C"
        fontSize="12.5"
        style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.12em' }}
      >
        SKETCH — NOT TO SCALE
      </text>
    </svg>
  )
}
