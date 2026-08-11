'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { navSections } from '@/content/site'
import { Logotype } from '../Logotype'
import { CallLink } from '../CallLink'

/**
 * Desktop bar: thin, sticky, paper. Ink links, phone pinned right in orange.
 * The active section is marked by a short painted underline that slides
 * between items rather than switching on and off.
 *
 * Mobile gets a completely different build — see MobileBars. This one is
 * hidden below the md breakpoint and never becomes a hamburger.
 */
export function DesktopNav() {
  const [active, setActive] = useState<string>(navSections[0].id)
  const [stroke, setStroke] = useState<{ x: number; w: number } | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const measure = useCallback((id: string) => {
    const list = listRef.current
    const item = itemRefs.current[id]
    if (!list || !item) return
    const l = list.getBoundingClientRect()
    const i = item.getBoundingClientRect()
    setStroke({ x: i.left - l.left, w: i.width })
  }, [])

  useEffect(() => {
    const sections = navSections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    measure(active)
  }, [active, measure])

  useEffect(() => {
    const onResize = () => measure(active)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active, measure])

  return (
    <header className="sticky top-0 z-50 hidden border-b border-ink/12 bg-paper md:block">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-8 px-8"
      >
        <a href="#top" className="shrink-0" aria-label="F.A.S Painter &amp; Decorator, back to top">
          <Logotype />
        </a>

        <ul ref={listRef} className="relative ml-auto flex items-center gap-7">
          {navSections.map((s) => (
            <li key={s.id}>
              <a
                ref={(el) => {
                  itemRefs.current[s.id] = el
                }}
                href={`#${s.id}`}
                aria-current={active === s.id ? 'true' : undefined}
                className={`block py-1.5 font-body text-[0.94rem] transition-colors duration-200 ${
                  active === s.id ? 'text-ink' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}

          {stroke ? (
            <span
              aria-hidden
              className="absolute -bottom-0.5 left-0 h-[4px] bg-orange transition-[translate,width] duration-300 ease-[var(--ease-roller)]"
              style={{ translate: `${stroke.x}px 0`, width: `${stroke.w}px` }}
            />
          ) : null}
        </ul>

        <div className="shrink-0 pl-2">
          <CallLink variant="nav" />
        </div>
      </nav>
    </header>
  )
}
