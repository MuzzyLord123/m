import { business } from '@/content/site'

/**
 * "F.A.S" set in Archivo Expanded inside a painted swatch block, with
 * "Painter & Decorator" in small caps beneath. No emblem, no crest, no splat.
 */
export function Logotype({
  size = 'sm',
  tone = 'ink',
}: {
  size?: 'sm' | 'lg'
  tone?: 'ink' | 'chalk'
}) {
  const chalk = tone === 'chalk'
  return (
    <span className="inline-flex items-center gap-2.5 align-middle">
      <span
        className={`u-display swatch-edge-sm inline-block px-2.5 pt-1 pb-1.5 leading-none ${
          chalk ? 'bg-chalk text-green' : 'bg-green text-chalk'
        } ${size === 'lg' ? 'text-2xl' : 'text-base'}`}
        style={{ fontWeight: 800, letterSpacing: '0.01em' }}
      >
        {business.shortName}
      </span>
      <span
        className={`font-body leading-tight ${chalk ? 'text-chalk' : 'text-ink-soft'} ${
          size === 'lg' ? 'text-[0.72rem]' : 'text-[0.6rem]'
        } font-semibold tracking-[0.2em] uppercase`}
      >
        Painter &amp;
        <br />
        Decorator
      </span>
    </span>
  )
}
