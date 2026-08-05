import { DesktopNav } from "./DesktopNav";
import { MobileMenu } from "./MobileMenu";
import { NavSentinel } from "./NavSentinel";

/**
 * Two separately designed navigation systems, not one responsive compromise.
 * The header floats over the hero; each system handles its own chrome.
 */
export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-[90] isolate">
      <NavSentinel />
      <DesktopNav />
      <MobileMenu />
    </header>
  );
}
