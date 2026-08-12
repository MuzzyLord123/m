import { Logotype } from '../Logotype'
import { CallLink } from '../CallLink'
import { MobileMenu } from './MobileMenu'

/**
 * Handheld chrome, in two parts.
 *
 * A compact top bar carrying the logotype and the burger, and a fixed call bar
 * across the bottom of the screen that is there from the first pixel of scroll.
 *
 * The call bar is deliberately NOT inside the menu. Opening a menu to find a
 * phone number is two actions; this way the number is always one tap, whether
 * the menu has ever been opened or not. It is also plain markup — no JavaScript
 * is involved in reaching the phone.
 */

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/12 bg-paper md:hidden">
      <div className="mx-auto flex h-[52px] w-full items-center justify-between px-5">
        <a href="/" aria-label="F.A.S Painter &amp; Decorator, home">
          <Logotype />
        </a>
        <MobileMenu />
      </div>
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
