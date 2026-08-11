import type { ReactNode } from 'react'
import { Rail, type RailItem } from './Rail'

/**
 * The page container.
 *
 * On large screens it reserves a left column for the sticky rail; without a rail it
 * is a single column. Both keep the same outer measure, so the exposed grid lines up
 * from page to page — which is the point of showing a grid at all.
 */
export function PageShell({ rail, children }: { rail?: readonly RailItem[]; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[90rem] px-5 md:px-8">
      {rail && rail.length > 0 ? (
        <div className="lg:grid lg:grid-cols-[7rem_minmax(0,1fr)] lg:gap-12">
          {/*
            `hidden` below lg, not just on the rail itself. The sticky wrapper's own
            top padding would otherwise sit above the hero on a phone as ~56px of
            empty space with nothing in it.
          */}
          <div className="relative hidden lg:block">
            <div className="sticky top-0 pt-14">
              <Rail items={rail} />
            </div>
          </div>
          <div>{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
