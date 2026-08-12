'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navPages } from '@/content/site'
import { Logotype } from '../Logotype'
import { CallLink } from '../CallLink'

/**
 * Desktop bar: thin, sticky, paper. Ink links, phone pinned right in orange.
 *
 * The current page is marked by a short painted underline that slides between
 * items rather than switching on and off, and it takes the colour of the page
 * it lands on — the same swatch that paints that page's spine in the mobile
 * menu.
 *
 * Mobile gets a completely different build; this one is hidden below md.
 */
export function DesktopNav() {
  const pathname = usePathname()
  const [stroke, setStroke] = useState<{ x: number; w: number; colour: string } | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})

  const measure = useCallback(() => {
    const list = listRef.current
    const item = itemRefs.current[pathname]
    const page = navPages.find((p) => p.href === pathname)
    if (!list || !item || !page) {
      setStroke(null)
      return
    }
    const l = list.getBoundingClientRect()
    const i = item.getBoundingClientRect()
    setStroke({ x: i.left - l.left, w: i.width, colour: page.colour })
  }, [pathname])

  useEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  return (
    <header className="sticky top-0 z-50 hidden border-b border-ink/12 bg-paper md:block">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[68px] w-full max-w-[1240px] items-center gap-8 px-8"
      >
        <Link href="/" className="shrink-0" aria-label="F.A.S Painter &amp; Decorator, home">
          <Logotype />
        </Link>

        <ul ref={listRef} className="relative ml-auto flex items-center gap-7">
          {navPages.map((page) => {
            const current = pathname === page.href
            return (
              <li key={page.href}>
                <Link
                  ref={(el) => {
                    itemRefs.current[page.href] = el
                  }}
                  href={page.href}
                  aria-current={current ? 'page' : undefined}
                  className={`block py-1.5 font-body text-[0.94rem] transition-colors duration-200 ${
                    current ? 'text-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  {page.label}
                </Link>
              </li>
            )
          })}

          {stroke ? (
            <span
              aria-hidden
              className="absolute -bottom-0.5 left-0 h-[4px] transition-[translate,width,background-color] duration-300 ease-[var(--ease-roller)]"
              style={{
                translate: `${stroke.x}px 0`,
                width: `${stroke.w}px`,
                backgroundColor: stroke.colour,
              }}
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
