'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { PhoneLink } from '@/components/Phone';
import { cta, nav, site } from '@content/site';
import { cn } from '@/lib/cn';

/**
 * Slim editorial bar. One brass hairline beneath it and nothing else.
 *
 * Deliberately absent: a sticky full-width call bar and a coloured floating
 * button. Somebody choosing who is going to hand-paint their kitchen is
 * researching, not dialling in a panic, and a shouting call-to-action would
 * cheapen the work it sits on top of.
 *
 * The overlay is animated with CSS transitions rather than a motion library.
 * This component is on every page, and a 40-kilobyte animation runtime to fade
 * five links in is a poor trade against a mobile performance budget. The hero
 * parallax, which genuinely needs scroll-linked values, still uses motion.
 */
export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Any navigation closes the overlay.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      (previouslyFocused ?? triggerRef.current)?.focus?.();
    };
  }, [open, close]);

  return (
    <header data-tone="night" className="sticky top-0 z-40 border-b border-b-brass/55 bg-night">
      <div className="gutter-x flex h-16 items-center justify-between gap-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[1.05rem] tracking-[0.02em] whitespace-nowrap"
        >
          {site.name}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'eyebrow transition-colors duration-300',
                  active ? 'text-brass' : 'text-linen hover:text-brass',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-8 lg:flex">
          <Link href={cta.href} className="eyebrow link-rule text-linen">
            {cta.label}
          </Link>
          <PhoneLink className="eyebrow text-linen transition-colors duration-300 hover:text-brass" />
        </div>

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu-overlay"
          className="eyebrow text-linen lg:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <div
        id="menu-overlay"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-tone="night"
        data-open={open}
        // inert keeps the closed overlay out of the tab order and away from
        // screen readers without needing to unmount it.
        inert={!open}
        className={cn(
          'gutter-x fixed inset-0 z-50 flex flex-col justify-between bg-night pt-24 pb-12 lg:hidden',
          'transition-opacity duration-300 ease-out',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <button
          type="button"
          onClick={close}
          className="eyebrow absolute top-0 right-[var(--spacing-gutter)] flex h-16 items-center text-linen"
        >
          Close
        </button>

        <nav aria-label="Menu" className="flex flex-col gap-6">
          {nav.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              // Staggered at 40ms intervals, in CSS.
              style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
              className={cn(
                'font-[family-name:var(--font-display)] text-[clamp(2rem,9vw,3rem)] leading-[1.05] font-light',
                'transition-opacity duration-350 ease-out',
                open ? 'opacity-100' : 'opacity-0',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
          <hr className="hairline" />
          <Link href={cta.href} className="eyebrow link-rule self-start text-linen">
            {cta.label}
          </Link>
          <PhoneLink withIcon className="text-[1.25rem]" />
        </div>
      </div>
    </header>
  );
}
