import { Logotype } from '../Logotype'
import { CallLink } from '../CallLink'

/**
 * Mobile navigation. Deliberately NOT a responsive version of the desktop bar.
 *
 * No hamburger, no drawer. A compact top bar carrying the logotype and two
 * links, and a fixed call bar across the bottom of the screen that is there
 * from the first pixel of scroll. The phone is always one tap away.
 *
 * Both are plain markup — no JavaScript is involved in reaching the phone.
 */

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/12 bg-paper md:hidden">
      <nav
        aria-label="Main"
        className="mx-auto flex h-[52px] w-full items-center justify-between px-5"
      >
        <a href="#top" aria-label="F.A.S Painter &amp; Decorator, back to top">
          <Logotype />
        </a>
        <ul className="flex items-center gap-5">
          <li>
            <a href="#work" className="font-body text-[0.9rem] font-medium text-ink">
              Work
            </a>
          </li>
          <li>
            <a href="#contact" className="font-body text-[0.9rem] font-medium text-ink">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

export function MobileCallBar() {
  return (
    <nav
      aria-label="Call"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="bg-orange-deep">
        <CallLink variant="bar" />
      </div>
    </nav>
  )
}
