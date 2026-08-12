'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { business, navPages } from '@/content/site'
import { Logotype } from '../Logotype'
import { CallLink } from '../CallLink'

/**
 * The handheld menu.
 *
 * A burger, but not a generic one: three painted strokes of different lengths
 * in three of the swatch colours, so it reads as a paint chart rather than the
 * same three grey bars every site ships. It becomes an ink cross when open.
 *
 * The panel is a dust sheet dropping over the page — full screen, paper base,
 * one painted spine per page in that page's colour, the label set in Archivo
 * Expanded, and the phone number sitting at the bottom of it. Rows lay in one
 * after another rather than all at once.
 *
 * Built on a native <dialog>, so focus trapping, Escape and focus restoration
 * come for free and there is no drawer library. It closes itself on navigation.
 *
 * The fixed call bar stays put underneath all of this — opening a menu should
 * never be the thing standing between somebody and the phone number.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const pathname = usePathname()

  const close = useCallback(() => dialogRef.current?.close(), [])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  // navigating away should not leave the sheet hanging over the new page
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="-mr-2 flex h-11 w-11 items-center justify-center"
      >
        <span className="sr-only">Menu</span>
        <BurgerStrokes />
      </button>

      <dialog
        ref={dialogRef}
        className="menu-dialog"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <div className="menu-sheet flex h-[100dvh] w-full flex-col bg-paper">
          <div className="flex shrink-0 items-center justify-between border-b-2 border-ink px-5 py-3">
            <Logotype />
            <button
              type="button"
              onClick={close}
              className="-mr-2 flex h-11 w-11 items-center justify-center"
            >
              <span className="sr-only">Close menu</span>
              <CrossStrokes />
            </button>
          </div>

          <nav aria-label="Pages" className="grow overflow-y-auto">
            <ol>
              {navPages.map((page, i) => {
                const current = pathname === page.href
                return (
                  <li
                    key={page.href}
                    className="menu-row border-b border-ink/15"
                    style={{ ['--i' as string]: i }}
                  >
                    <Link
                      href={page.href}
                      aria-current={current ? 'page' : undefined}
                      className="flex items-stretch gap-4 px-5 py-4"
                    >
                      {/* fixed-width slot, so the current page's fatter bar
                          never shunts the label out of line with the others */}
                      <span aria-hidden className="flex w-6 shrink-0 justify-start">
                        <span
                          className={`menu-swatch block h-full ${current ? 'w-full' : 'w-1/2'}`}
                          style={{ backgroundColor: page.colour, ['--i' as string]: i }}
                        />
                      </span>
                      <span className="min-w-0 grow">
                        <span
                          className={`u-display block text-[1.85rem] leading-none text-ink ${
                            current ? 'underline decoration-4 underline-offset-[6px]' : ''
                          }`}
                        >
                          {page.label}
                        </span>
                        <span className="mt-1.5 block font-body text-[0.82rem] leading-snug text-ink-soft">
                          {page.blurb}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="u-display self-center font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink-soft"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </nav>

          <div className="shrink-0 border-t-2 border-ink px-5 pt-5 pb-6">
            <p className="font-body text-[0.72rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
              {business.base} · Coedpoeth
            </p>
            <div className="mt-3">
              <CallLink variant="slab" />
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}

/**
 * Three strokes, three lengths, three swatch colours. Not three grey bars.
 * Orange is left out on purpose — it belongs to the phone.
 */
function BurgerStrokes() {
  return (
    <span aria-hidden className="relative block h-[19px] w-[27px]">
      <span className="absolute top-0 left-0 block h-[3px] w-[27px] bg-swatch-clay" />
      <span className="absolute top-2 left-0 block h-[3px] w-[19px] bg-swatch-sage" />
      <span className="absolute top-4 left-0 block h-[3px] w-[24px] bg-swatch-blue" />
    </span>
  )
}

function CrossStrokes() {
  return (
    <span aria-hidden className="relative block h-[19px] w-[27px]">
      <span className="absolute top-2 left-0 block h-[3px] w-[27px] origin-center rotate-45 bg-ink" />
      <span className="absolute top-2 left-0 block h-[3px] w-[27px] origin-center -rotate-45 bg-ink" />
    </span>
  )
}
