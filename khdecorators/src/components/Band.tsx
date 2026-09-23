import type { ReactNode } from 'react'

/**
 * One band of the page: an eyebrow, a heading, an optional standfirst, the
 * content.
 *
 * The eyebrow is the signwriter's small lettering — wide capitals, tracked out,
 * led by a gilt lozenge (or flanked by two gilt rules when the band is centred).
 * One phrase of the heading can be laid in gold leaf with `gild`, and the light
 * runs across it once as it scrolls into view. One phrase, not the heading: gold
 * everywhere is gold nowhere.
 */
export function Band({
  id,
  eyebrow,
  title,
  /** A phrase inside `title` to set in gold leaf. Must appear in it verbatim. */
  gild,
  standfirst,
  children,
  tone = 'plain',
  /** A double gilt keyline across the top of the band. */
  divider = false,
  align = 'left',
  className,
}: {
  id?: string
  eyebrow?: string
  title?: string
  gild?: string
  standfirst?: string
  children: ReactNode
  tone?: 'plain' | 'well' | 'satin'
  divider?: boolean
  align?: 'left' | 'centre'
  className?: string
}) {
  const centred = align === 'centre'
  const ground = tone === 'well' ? 'kh-well' : tone === 'satin' ? 'bg-satin' : ''

  return (
    <section id={id} className={`relative scroll-mt-32 ${ground} ${className ?? ''}`}>
      {divider ? <div className="kh-moulding" /> : null}

      <div className="shell py-20 md:py-28">
        {title ? (
          <header className={`kh-reveal ${centred ? 'mx-auto max-w-[50rem] text-center' : 'max-w-[52rem]'}`}>
            {eyebrow ? (
              <p className={`annotation text-gold ${centred ? 'kh-flourish' : 'kh-eyebrow'}`}>
                {eyebrow}
              </p>
            ) : null}
            <h2 className="display-sm mt-5">
              <Gilded text={title} gild={gild} />
            </h2>
            {standfirst ? (
              <p
                className={`mt-6 text-lg leading-relaxed text-paper-dim ${centred ? 'mx-auto max-w-[44rem]' : 'measure'}`}
              >
                {standfirst}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className={`kh-reveal ${title ? 'mt-12 md:mt-16' : ''}`}>{children}</div>
      </div>
    </section>
  )
}

/**
 * A line of text with one phrase laid in gold leaf. If the phrase is not in the
 * text the line renders plain, rather than gilding the wrong words.
 */
export function Gilded({ text, gild, load = false }: { text: string; gild?: string; load?: boolean }) {
  if (!gild) return <>{text}</>
  const at = text.indexOf(gild)
  if (at === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <span className={`gilt ${load ? 'gilt-load' : 'gilt-sheen'}`}>{gild}</span>
      {text.slice(at + gild.length)}
    </>
  )
}
