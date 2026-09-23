'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { PALETTE_ORDER } from '@content/fields'
import { menu } from '@content/copy'
import { phone } from '@content/site'

/**
 * The menu.
 *
 * The brief said no burger, and it was right at the time: the site was one
 * scrolling sequence plus two side pages, and the only thing anyone needed was
 * the phone number. It is eight pages now, and from a service page there was no
 * way at all to reach the reviews — which on this site is the argument. So
 * there is a menu, and the job is to make it belong here rather than to bolt a
 * generic one on.
 *
 * ── The mark ─────────────────────────────────────────────────────────────────
 *
 * Three hard-edged bars in the current foreground: no rounding, no box, no
 * stroke icon out of a set, and the same 2px weight as the mono type it sits
 * next to. They are the current foreground rather than palette colours because
 * the strip is repainted on scroll — a stone bar would vanish the moment the
 * page turned stone.
 *
 * Open, the three bars collapse into one. Not a cross: a cross is the same
 * cross every site has, and this one has a word next to it doing the same job
 * better, the way everything else here is labelled rather than iconified.
 *
 * ── The panel ────────────────────────────────────────────────────────────────
 *
 * This is where the colour goes, and it is the whole idea: the menu is the
 * site in miniature. Every link is a full-bleed band of one field colour, in
 * palette order, so opening the menu is the same experience as scrolling the
 * page — the six colours, stacked, with type flush left on them. Each band
 * carries its own foreground from content/fields.ts, so every one of them
 * clears 7:1 by construction.
 *
 * The bands wipe in from the baseline up, staggered, using the same reveal as
 * the display type everywhere else.
 */

export function Menu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    button.current?.focus()
  }, [])

  /* Route change closes it. Without this, tapping a link leaves the panel over
     the page you just asked for. */
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* Escape closes, and the page underneath does not scroll while it is open. */
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    // Focus the panel so the next Tab lands inside it rather than back in the
    // page behind.
    panel.current?.focus()

    return () => {
      root.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  /* Tab wraps inside the panel while it is open. */
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panel.current) return
    const focusable = panel.current.querySelectorAll<HTMLElement>('a[href], button')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="menu-panel"
        // Full 44px square minimum even when it is showing bars alone: the mark
        // is 20px wide, and a 20px control on a phone is one you miss.
        className="mono-sm -mr-2 flex h-11 min-w-11 shrink-0 items-center justify-end gap-2.5 px-2 uppercase md:h-14"
      >
        <span aria-hidden="true" className="relative block h-[14px] w-[20px]">
          {[-6, 0, 6].map((y, i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 left-0 block h-[2px] w-full"
              style={{ backgroundColor: 'var(--fg)', marginTop: '-1px' }}
              initial={false}
              animate={{ y: open ? 0 : y }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
        </span>
        {/*
          The word is what makes the mark unambiguous, and it is the site's
          habit anyway — everything here is labelled rather than iconified.
          Below 420px there is not room for the name, the number and a labelled
          button all at once, so the word is dropped while closed and brought
          back while open, where a lone bar would be a guess. The number goes
          the other way: it is redundant in the strip while the panel is open,
          because the panel ends with it at four times the size.
        */}
        <span data-menu-word className="hidden min-[420px]:inline">
          {open ? menu.close : menu.open}
        </span>
        <span className="sr-only min-[420px]:hidden">{open ? menu.close : menu.open}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="menu-panel"
            ref={panel}
            tabIndex={-1}
            onKeyDown={onPanelKeyDown}
            /* Below the strip, so the name, the phone number and the close
               control never disappear behind it. */
            className="fixed inset-0 z-40 flex flex-col pt-11 outline-none md:pt-14"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {menu.links.map((link, i) => {
              const colour = PALETTE_ORDER[i % PALETTE_ORDER.length]
              const current = pathname === link.href

              return (
                <motion.div
                  key={link.href}
                  data-clip=""
                  className="flex min-h-[3.5rem] flex-1"
                  /* The 1px overlap closes the sub-pixel seam between two
                     flexed bands. Without it the page behind shows through as
                     a hairline of somebody else's text. */
                  style={{
                    backgroundColor: colour.bg,
                    color: colour.fg,
                    marginTop: i === 0 ? 0 : -1,
                  }}
                  initial={{ clipPath: 'inset(100% 0 0 0)' }}
                  animate={{ clipPath: 'inset(0% 0 0 0)' }}
                  transition={{
                    duration: 0.34,
                    delay: i * 0.035,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className="flex w-full items-center px-[max(1.25rem,4vw)]"
                  >
                    <span
                      className={
                        current
                          ? 't-line underline underline-offset-[8px]'
                          : 't-line'
                      }
                    >
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              )
            })}

            {/* The number gets its own band at the bottom, because it is the
                only thing on this site anyone has to be able to find and the
                menu should not be the one screen where it is small. */}
            <motion.div
              data-clip=""
              // No items-center here: it would stop the link stretching to fill
              // the band, leaving a 32px tap target on the phone number.
              className="flex min-h-[4.5rem] flex-[1.4]"
              style={{
                backgroundColor: PALETTE_ORDER[menu.links.length % PALETTE_ORDER.length].bg,
                color: PALETTE_ORDER[menu.links.length % PALETTE_ORDER.length].fg,
                marginTop: -1,
              }}
              initial={{ clipPath: 'inset(100% 0 0 0)' }}
              animate={{ clipPath: 'inset(0% 0 0 0)' }}
              transition={{
                duration: 0.34,
                delay: menu.links.length * 0.035,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <a
                href={phone.href}
                className="flex w-full items-center px-[max(1.25rem,4vw)]"
              >
                <span className="t-phone tabular-nums">{phone.display}</span>
              </a>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
