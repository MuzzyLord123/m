import type { Metadata } from 'next'
import { Band } from '@/components/Band'
import { Gallery } from '@/components/Gallery'
import { Hero } from '@/components/Hero'
import { pageMetadata } from '@/lib/metadata'
import { allPhotos, byCategory, photos } from '@content/photos'

export const metadata: Metadata = pageMetadata({
  title: 'Gallery of work in {town} | KH Painting and Decorating',
  description:
    'Photographs of Kenny’s own painting, decorating, wallpapering and exterior work across {town} and the north west. No stock photography. Ring 07538 869832 for a free quote.',
  path: '/gallery',
})

const sections = [
  {
    id: 'exterior',
    eyebrow: 'Outside',
    title: 'Exterior work',
    gild: 'Exterior',
    standfirst: 'Elevations, render, brick, garage doors and woodwork — whole houses, in daylight.',
    items: byCategory('exterior'),
  },
  {
    id: 'wallpaper',
    eyebrow: 'Papering',
    title: 'Wallpaper and murals',
    gild: 'murals',
    standfirst: 'Feature walls, full rooms and murals, hung with the pattern matched.',
    items: byCategory('wallpaper'),
  },
  {
    id: 'interior',
    eyebrow: 'Inside',
    title: 'Interior decoration',
    gild: 'Interior',
    standfirst: 'Lounges, halls, stairs and landings — and a few mid-job, because the preparation is the part that decides how it lasts.',
    items: byCategory('interior'),
  },
] as const

/**
 * Every photograph, hung by kind of work. The lightbox on each set moves through
 * that set only, so "next" from a staircase is another interior.
 */
export default function GalleryPage() {
  return (
    <>
      <Hero
        photo={photos.birdGreenPanelling}
        eyebrow={`Gallery · ${allPhotos.length} photographs`}
        title="My work, photographed on the day"
        gild="on the day"
        lede="Every picture here is one of my own jobs. Tap any of them to see it larger. If you can see something like what you want doing, ring me about it."
        plaque={photos.birdGreenPanelling.caption}
        from="gallery-hero"
        quoteHref="/contact"
      />

      {sections.map((section, i) => (
        <Band
          key={section.id}
          id={section.id}
          tone={i % 2 === 1 ? 'well' : 'plain'}
          divider={i > 0}
          eyebrow={section.eyebrow}
          title={section.title}
          gild={section.gild}
          standfirst={section.standfirst}
        >
          <Gallery items={[...section.items]} label={section.title} />
        </Band>
      ))}
    </>
  )
}
