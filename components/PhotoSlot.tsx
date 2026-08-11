import Image from 'next/image'
import type { Photo, SwatchKey } from '@/content/types'
import { swatchHex } from '@/lib/swatches'
import { showPhotoBriefs } from '@/lib/env'

/**
 * Reserved space for one of his own photographs.
 *
 * With a real file: next/image, explicit dimensions, sizes set, AVIF/WebP.
 * Without one: a flat block in the section's swatch colour carrying a printed
 * label. Never a stock photograph of a painter in white overalls, and never an
 * AI-generated interior passed off as his work.
 *
 * The label is a flat chalk block, deliberately NOT a masking-tape strip —
 * tape is reserved for the four section eyebrows.
 */
export function PhotoSlot({
  photo,
  swatch,
  className = '',
  sizes = '100vw',
  priority = false,
  label = 'Photograph to come',
  labelSide = 'left',
}: {
  photo: Photo
  swatch: SwatchKey
  className?: string
  sizes?: string
  priority?: boolean
  /** null renders the block with no label — the hero places its own. */
  label?: string | null
  labelSide?: 'left' | 'right'
}) {
  if (photo.src && photo.alt && photo.width && photo.height) {
    return (
      <figure className={`relative overflow-hidden ${className}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          priority={priority}
          className="h-full w-full object-cover"
        />
      </figure>
    )
  }

  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${className}`}
      style={{ backgroundColor: swatchHex[swatch] }}
      role="img"
      aria-label={`Space reserved for a photograph: ${photo.brief}`}
    >
      <div className={`p-4 md:p-5 ${labelSide === 'right' ? 'text-right' : ''}`}>
        {label ? (
          <span className="inline-block bg-chalk px-3 py-1.5 font-body text-[0.68rem] font-semibold tracking-[0.18em] text-ink uppercase">
            {label}
          </span>
        ) : null}
        {showPhotoBriefs ? (
          <p className="mt-2 max-w-[46ch] bg-paper px-3 py-2 text-[0.82rem] leading-snug text-ink">
            <span className="font-semibold">Shot needed:</span> {photo.brief}
          </p>
        ) : null}
      </div>
    </div>
  )
}
