import Image from 'next/image'
import { photos } from '@content/photos'

/**
 * The one field on the site with photographs in it: a horizontal snap strip,
 * each shot labelled room then village in mono.
 *
 * It renders nothing at all while content/photos.ts is empty, and the field
 * around it is not composed either — the site is designed to stand up with no
 * photography, and a photo section holding twelve grey rectangles would be
 * worse than no photo section.
 */

export function PhotoStrip() {
  if (photos.length === 0) return null

  return (
    <ul
      className="-mx-[max(1.25rem,4vw)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,4vw)] pb-4"
      style={{ scrollbarWidth: 'thin' }}
    >
      {photos.map((photo) => (
        <li key={photo.src} className="w-[min(78vw,34rem)] shrink-0 snap-start">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 78vw, 34rem"
            className="h-auto w-full"
          />
          <p className="mono-label mt-3">
            {photo.room}, {photo.place}
          </p>
        </li>
      ))}
    </ul>
  )
}
