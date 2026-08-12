'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { phone } from '@content/site';
import { Wordmark } from '@/components/Wordmark';

/**
 * Navigation.
 *
 * Not a tab row. The old site had eight of them — Home, About Us, Projects
 * Gallery, Health & Safety, Blog, FAQ, Testimonials, Contact — and not one of
 * them named a sector or a capability, so a facilities manager could read the
 * whole navigation and still not know whether the firm painted factories.
 *
 * What replaces it: a numbered sector index in a full-height graphite panel.
 * The bar itself carries three things — who this is, the way in, and the number
 * that gets answered.
 *
 * The panel is a separate chunk, fetched on first open. It is the only thing on
 * the site that needs an animation runtime, and it sits behind a click, so it
 * has no business being in front of the first paint of every page.
 */

const SectorIndexOverlay = dynamic(() => import('@/components/SectorIndexOverlay'), {
  ssr: false,
});

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on navigation. Without this the panel stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <header
        data-ground="paper"
        className="fixed inset-x-0 top-0 z-50 border-b border-[var(--rule)] bg-white/95 backdrop-blur-[6px]"
      >
        <div className="shell flex h-16 items-center justify-between gap-6 md:h-20">
          <Link href="/" aria-label="McDonald Painting Contractors, home">
            <Wordmark compact />
          </Link>

          <div className="flex items-center gap-5 md:gap-8">
            <a
              href={phone.href}
              className="t-label !text-[var(--ink)] hover:!text-[var(--mark)]"
              data-analytics="phone"
            >
              {phone.display}
            </a>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="sector-index"
              className="t-label !text-[var(--color-navy)] bg-[var(--color-amber)] px-4 py-2.5 hover:bg-[#c98d18]"
            >
              {open ? 'Close' : 'Index'}
            </button>
          </div>
        </div>
      </header>

      {/* Mounted only once the panel has been opened, so the chunk is never
          fetched by a visitor who does not use it. */}
      <SectorIndexOverlay open={open} onClose={close} />
    </>
  );
}
