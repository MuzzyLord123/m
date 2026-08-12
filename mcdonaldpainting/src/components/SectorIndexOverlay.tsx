'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { SECTORS } from '@content/sectors';
import { phone } from '@content/site';

/**
 * The sector index panel.
 *
 * Split out of Nav and loaded on demand, because this is the only part of the
 * site that uses motion/react and it is behind a click. Bundling an animation
 * runtime into the first load of every page, to animate something most visitors
 * never open, is about 45KB of JavaScript in front of the largest paint.
 *
 * motion/react earns its place here specifically: an interruptible open state,
 * an exit animation, and a staggered list. Everything else on the site animates
 * once on entry and is done in CSS.
 */

const PAGES = [
  { label: 'Capability schedule', href: '/capabilities' },
  { label: 'Programmed maintenance', href: '/programmed-maintenance' },
  { label: 'Compliance and accreditation', href: '/compliance' },
  { label: 'Site records', href: '/projects' },
  { label: 'Photographs', href: '/gallery' },
  { label: 'About the company', href: '/about' },
  { label: 'Enquiries', href: '/contact' },
];

export default function SectorIndexOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      // Focus stays inside the panel while it is open. A full-screen overlay
      // that leaks focus to the page underneath is unusable with a keyboard.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the panel so a screen reader lands inside it.
    panelRef.current?.querySelector<HTMLElement>('a[href]')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const duration = reduced ? 0 : 0.32;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          className="fixed inset-0 z-[60]"
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduced ? 1 : 0 }}
          transition={{ duration: duration / 2 }}
        >
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-[var(--color-navy)]/60"
            aria-label="Close index"
            onClick={onClose}
            tabIndex={-1}
          />

          <motion.div
            ref={panelRef}
            id="sector-index"
            role="dialog"
            aria-modal="true"
            aria-label="Sector index"
            data-ground="graphite"
            className="absolute inset-y-0 right-0 flex w-full max-w-[46rem] flex-col overflow-y-auto border-l border-line"
            initial={{ x: reduced ? 0 : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduced ? 0 : '100%' }}
            transition={{ duration, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-[var(--spacing-gutter)] py-5">
              <p className="t-label">Sector index</p>
              <button
                type="button"
                onClick={onClose}
                className="t-label !text-graphite bg-hivis px-4 py-2.5 hover:bg-[#c98d18]"
              >
                Close
              </button>
            </div>

            <nav aria-label="Sectors" className="px-[var(--spacing-gutter)] pt-2">
              <ol>
                {SECTORS.map((sector, i) => (
                  <motion.li
                    key={sector.number}
                    className="border-b border-line"
                    initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduced ? 0 : 0.08 + i * 0.025, duration: 0.2 }}
                  >
                    <Link
                      href={sector.href}
                      className="group grid grid-cols-[3rem_1fr] items-baseline gap-x-5 py-5 hover:text-hivis focus-visible:text-hivis"
                    >
                      <span className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.03em] text-concrete transition-colors group-hover:text-hivis group-focus-visible:text-hivis">
                        {sector.number}
                      </span>
                      <span>
                        <span className="font-display text-[1.25rem] font-bold leading-tight tracking-[-0.02em]">
                          {sector.label}
                        </span>
                        <span className="mt-1.5 block text-[14px] leading-[1.45] text-concrete">
                          {sector.summary}
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ol>
            </nav>

            <nav
              aria-label="Pages"
              className="mt-auto border-t border-line px-[var(--spacing-gutter)] py-8"
            >
              <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {PAGES.map((page) => (
                  <li key={page.href}>
                    <Link href={page.href} className="t-label !text-bone hover:!text-hivis">
                      {page.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <a
                href={phone.href}
                data-analytics="phone"
                className="mt-8 inline-block font-display text-[1.5rem] font-extrabold tracking-[-0.02em] text-bone hover:text-hivis"
              >
                {phone.display}
              </a>
              <p className="t-label mt-2">{phone.who}</p>
            </nav>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
