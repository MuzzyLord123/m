/**
 * Photographs.
 *
 * Andy has around twelve room shots. They exist on the Yell listing as
 * compressed CDN copies, and those are not usable here: they are somebody
 * else's hosted, resized, watermark-adjacent files, and they would look like
 * exactly what they are. The originals live on his phone.
 *
 * So this array is empty, and the photo field does not render. That is by
 * design — the site is type and colour and it stands up with no photography at
 * all. When the originals arrive, drop them in public/photographs, add entries
 * here, and field 10 appears on the home page on its own.
 *
 * Label format is room then village, in mono: "Study, Gresford".
 */

export type Photo = {
  /** Path under /public. */
  src: string
  /** Room. */
  room: string
  /** Village or town. Only ones Andy confirms. */
  place: string
  /** Written for someone who cannot see it. Not a caption. */
  alt: string
  width: number
  height: number
}

export const photos: readonly Photo[] = []

export const hasPhotos = photos.length > 0
