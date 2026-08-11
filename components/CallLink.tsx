import { Phone } from '@phosphor-icons/react/dist/ssr'
import { business } from '@/content/site'

/**
 * The phone number. Formatted identically everywhere: 07951 320566.
 *
 * `slab`  — the hero CTA. The single largest interactive element on the page.
 * `bar`   — the fixed mobile call bar. 56px, safe-area padded.
 * `nav`   — desktop bar, pinned right.
 * `block` — inside sections.
 */
export function CallLink({
  variant = 'block',
  label,
  className = '',
  id,
}: {
  variant?: 'slab' | 'bar' | 'nav' | 'block'
  label?: string
  className?: string
  id?: string
}) {
  const aria = `Ring ${business.name} on ${business.phoneDisplay}`

  if (variant === 'slab') {
    /* No aria-label: the visible text already reads "Ring me 07951 320566",
       and overriding it with a different wording breaks the match between
       what is on screen and what a voice-control user has to say. */
    return (
      <a
        id={id}
        href={business.phoneHref}
        className={`swatch-edge group block w-fit bg-orange-deep px-6 pt-5 pb-6 text-chalk transition-transform duration-200 ease-[var(--ease-bleed)] hover:-translate-y-0.5 md:px-9 md:pt-6 md:pb-7 ${className}`}
      >
        <span className="flex items-center gap-2 font-body text-[0.72rem] font-semibold tracking-[0.22em] uppercase">
          <Phone size={16} weight="regular" strokeWidth={1.5} aria-hidden />
          {label ?? 'Ring me'}
        </span>
        <span
          className="u-display mt-1.5 block text-[clamp(2.1rem,6.4vw,4.1rem)] whitespace-nowrap"
          style={{ fontWeight: 800 }}
        >
          {business.phoneDisplay}
        </span>
      </a>
    )
  }

  if (variant === 'bar') {
    return (
      <a
        id={id}
        href={business.phoneHref}
        aria-label={aria}
        className={`flex h-14 w-full items-center justify-center gap-3 bg-orange-deep text-chalk ${className}`}
      >
        <Phone size={22} weight="regular" strokeWidth={1.5} aria-hidden />
        <span className="u-display text-[1.35rem]" style={{ fontWeight: 800 }}>
          {business.phoneDisplay}
        </span>
      </a>
    )
  }

  if (variant === 'nav') {
    return (
      <a
        id={id}
        href={business.phoneHref}
        aria-label={aria}
        className={`stroke-link inline-flex items-center gap-2 font-body text-[0.98rem] font-semibold text-orange-ink ${className}`}
      >
        <Phone size={17} weight="regular" strokeWidth={1.5} aria-hidden />
        {business.phoneDisplay}
      </a>
    )
  }

  return (
    <a
      id={id}
      href={business.phoneHref}
      aria-label={aria}
      className={`bleed inline-flex items-center gap-3 border-2 border-orange-deep px-5 py-3.5 font-body font-semibold text-orange-ink transition-colors duration-200 hover:text-chalk focus-visible:text-chalk ${className}`}
    >
      <Phone size={19} weight="regular" strokeWidth={1.5} aria-hidden />
      <span className="u-display text-[1.15rem]" style={{ fontWeight: 700 }}>
        {business.phoneDisplay}
      </span>
    </a>
  )
}
