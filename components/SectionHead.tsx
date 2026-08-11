import type { ReactNode } from 'react'

/**
 * Section eyebrow + heading. The eyebrow sits behind a short painted rule
 * rather than a masking-tape strip — tape is rationed to four on the page.
 */
export function SectionHead({
  eyebrow,
  heading,
  intro,
  tone = 'ink',
  className = '',
  ruleColour,
}: {
  eyebrow: string
  heading: ReactNode
  intro?: ReactNode
  tone?: 'ink' | 'chalk'
  className?: string
  ruleColour?: string
}) {
  const chalk = tone === 'chalk'
  return (
    <div className={className}>
      <p
        className={`flex items-center gap-3 font-body text-[0.72rem] font-semibold tracking-[0.2em] uppercase ${
          chalk ? 'text-chalk/85' : 'text-ink-soft'
        }`}
      >
        <span
          aria-hidden
          className="inline-block h-[7px] w-9 shrink-0"
          style={{ backgroundColor: ruleColour ?? (chalk ? '#FFFDF8' : '#D24E1B') }}
        />
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-[clamp(1.9rem,4.4vw,3.1rem)] ${chalk ? 'text-chalk' : 'text-ink'}`}
      >
        {heading}
      </h2>
      {intro ? (
        <div
          className={`mt-5 max-w-[62ch] font-body ${chalk ? 'text-chalk/90' : 'text-ink-soft'}`}
        >
          {intro}
        </div>
      ) : null}
    </div>
  )
}
