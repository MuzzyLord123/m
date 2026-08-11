'use client'

import { useEffect, useState } from 'react'

export type RailItem = { id: string; number: string; label: string }

/**
 * The sticky left rail. Desktop only.
 *
 * Section numbers down the side, the current one in signal blue. There is no
 * sliding indicator and no highlight bar — the colour change is the whole of it,
 * because a rail that animates is a rail you look at instead of the work.
 *
 * It is a client component because it has to know where the reader is. It observes
 * the sections rather than listening to scroll, so it costs nothing while the page
 * is still.
 */
export function Rail({ items }: { items: readonly RailItem[] }) {
  const [current, setCurrent] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    // Visible ones are tracked in a set rather than taken from the last callback,
    // because entries only arrive for sections that changed state. Scrolling fast
    // past three sections gives one callback, and the topmost still-visible one is
    // the answer.
    const visible = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        const first = items.find((item) => visible.has(item.id))
        if (first) setCurrent(first.id)
      },
      // The band is the upper half of the viewport: a section counts as current
      // once its top has come up past the header and before it leaves the middle.
      { rootMargin: '-96px 0px -50% 0px', threshold: 0 },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [items])

  return (
    <nav aria-label="Sections on this page" className="hidden lg:block">
      <ol className="sticky top-28 space-y-3">
        {items.map((item) => {
          const active = item.id === current
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'true' : undefined}
                className={`annotation block transition-colors duration-200 ${
                  active ? 'text-gold' : 'text-paper-dim hover:text-paper'
                }`}
              >
                <span className="tabular-nums">{item.number}</span>
                <span className="mt-1 block normal-case tracking-normal">{item.label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
