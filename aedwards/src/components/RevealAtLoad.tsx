import type { ReactNode } from 'react'

/**
 * The clip reveal for type that is already on screen when the page loads.
 *
 * Deliberately not a client component and deliberately carrying no JavaScript
 * at all — it is one CSS class (see globals.css) and the animation starts as
 * soon as the stylesheet is parsed.
 *
 * Reveal.tsx is the right tool everywhere else, but above the fold its
 * intersection observer has nothing to wait for and costs real time: an element
 * held at opacity 0 until hydration cannot be a largest-contentful-paint
 * candidate, so using it on the hero headline hands the site's biggest piece of
 * type to whenever the JavaScript bundle happens to arrive.
 */

export function RevealAtLoad({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className ? `reveal-at-load ${className}` : 'reveal-at-load'}>{children}</div>
}
