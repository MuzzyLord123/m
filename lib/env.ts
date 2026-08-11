/**
 * Review mode.
 *
 * When on, the site shows the client what is still missing: the brief for every
 * empty photograph slot, and the list of villages he still has to confirm.
 * None of it renders on the live site.
 *
 * On by default outside production. Set NEXT_PUBLIC_SHOW_PHOTO_BRIEFS=1 to turn
 * it on for a staging deployment he can read on his phone.
 */
export const reviewMode =
  process.env.NEXT_PUBLIC_SHOW_PHOTO_BRIEFS === '1' || process.env.NODE_ENV !== 'production'

/** Alias kept for the photo slots, which are the main thing it drives. */
export const showPhotoBriefs = reviewMode
