/** Shared content types. */

export type SwatchKey = 'blue' | 'clay' | 'sage' | 'black'

/**
 * A photograph slot.
 *
 * While `src` is null the site renders a flat colour block carrying `brief` —
 * the description of the shot we need. No stock photography, ever. Drop a file
 * into /public/work, set `src`, `alt`, `width` and `height`, and the real
 * photograph takes over. See README.md.
 */
export type Photo = {
  src: string | null
  /** Describes the work in the photo, e.g. "kitchen ceiling and walls repainted, Coedpoeth". */
  alt: string | null
  width: number | null
  height: number | null
  /** Plain-English brief for the shot. Also listed in CONTENT-NEEDED.md. */
  brief: string
}

export const emptyPhoto = (brief: string): Photo => ({
  src: null,
  alt: null,
  width: null,
  height: null,
  brief,
})
