/**
 * Trade icons, drawn for this trade.
 *
 * Not an icon library. A paint roller, a brush, a spray gun, an extractor, a
 * wallpaper roll, a house elevation and a shop front — the tools and the jobs
 * Kenny actually does. That is what makes the service cards read as a
 * decorator's website rather than as a template with a generic wrench on it, and
 * a library would not have a spray gun or a dust extractor in it anyway.
 *
 * All of them: 24×24, 1.5px stroke, `currentColor`, no fill. They inherit the
 * gold from the card, they cost nothing (inline SVG, no request, no font), and
 * they scale without going blurry. `aria-hidden` throughout — every one sits
 * next to a real text label, so announcing it would just repeat the label.
 */

type IconProps = { className?: string }

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** A spray gun: body, nozzle, cup, and the atomised fan coming off it. */
export function SprayGunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 8.5h6.5v3.5H4z" />
      <path d="M6 12v4.5a1.5 1.5 0 0 0 1.5 1.5H8" />
      <path d="M5 8.5V6.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M10.5 10.25h2.25" />
      <path d="M15 7.5v5.5" />
      <path d="M18 6v8.5" />
      <path d="M21 4.5v11.5" />
    </svg>
  )
}

/** A paint roller: frame, handle, and the sleeve. */
export function RollerIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4" width="14" height="5" rx="1" />
      <path d="M17 6.5h2.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H12" />
      <path d="M12 11.5v2" />
      <rect x="9.5" y="13.5" width="5" height="7" rx="1" />
    </svg>
  )
}

/** A brush: handle, ferrule, bristles. */
export function BrushIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 3.5h6v9H9z" />
      <path d="M8.25 12.5h7.5v3a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1z" />
      <path d="M11 16.5v2.25a1.25 1.25 0 0 0 2.5 0V16.5" />
      <path d="M11 6.5h4" />
    </svg>
  )
}

/** A sander with an extraction hose — the dustless system. */
export function ExtractorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="7" width="9" height="5" rx="1.5" />
      <path d="M5 12v1.5h5V12" />
      <path d="M12 9.5c2 0 2.5-2 4.5-2s2.5 2 4.5 2" />
      <path d="M21 9.5v6a2.5 2.5 0 0 1-2.5 2.5H15" />
      <path d="M6 17.5h4" />
    </svg>
  )
}

/** A roll of wallpaper, part unrolled. */
export function WallpaperIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5.5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 0 13 5.5v13l-4.5-2-4.5 2z" />
      <path d="M15.5 3A2.5 2.5 0 0 1 18 5.5v10a2.5 2.5 0 0 0 2.5 2.5" />
      <path d="M7.5 8h2" />
      <path d="M7.5 11.5h2" />
    </svg>
  )
}

/** A house elevation — exterior work. */
export function HouseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
      <path d="M8 12h1.5" />
    </svg>
  )
}

/** A room corner with a ceiling line — interior work. */
export function InteriorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 4.5h17v15h-17z" />
      <path d="M3.5 7.5h17" />
      <path d="M3.5 17h17" />
      <path d="M8 7.5v9.5" />
    </svg>
  )
}

/** A shop front — commercial work. */
export function ShopIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 8.5h17V20h-17z" />
      <path d="M3.5 8.5 5 4.5h14l1.5 4" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

/** A unit with a roller shutter — industrial work. */
export function IndustrialIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 20V9l6-3.5V20" />
      <path d="M9 11.5 21 6v14" />
      <path d="M13 20v-4.5h4V20" />
    </svg>
  )
}

/** A tick. Used for every "what's included" list on the site. */
export function TickIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M4.5 12.5l4.5 4.5L19.5 6.5" />
    </svg>
  )
}

/** A telephone handset. */
export function PhoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7.5 3.5 10 6l-2 2.5a12 12 0 0 0 7.5 7.5L18 14l2.5 2.5-2 2.5C13 20.5 3.5 11 4.5 5.5z" />
    </svg>
  )
}

/** An arrow, for "find out more". */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12h15" />
      <path d="M13.5 6l6 6-6 6" />
    </svg>
  )
}

/**
 * The brush-stroke divider between the major bands of the page.
 *
 * A hand-drawn tapering stroke rather than a straight rule: it is the one piece
 * of ornament on the site, and it should look like it came off a brush.
 * `preserveAspectRatio="none"` stretches it to the container width, which is
 * fine for a stroke this shape and keeps it to one path at any width.
 */
export function BrushDivider({ className }: { className?: string }) {
  return (
    <svg
      className={`kh-brush ${className ?? ''}`}
      viewBox="0 0 1200 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 6.2c120-2.4 180 1.1 300-.6s180-3.2 300-1.4 200 3.6 300 2.1 180-3.9 300-2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Icon lookup for the service cards, keyed by the slug in /content/services.ts. */
export const SERVICE_ICONS = {
  spray: SprayGunIcon,
  roller: RollerIcon,
  brush: BrushIcon,
  extractor: ExtractorIcon,
  wallpaper: WallpaperIcon,
  house: HouseIcon,
  interior: InteriorIcon,
  shop: ShopIcon,
  industrial: IndustrialIcon,
} as const

export type ServiceIconKey = keyof typeof SERVICE_ICONS
