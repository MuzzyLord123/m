import type { ReactNode } from 'react'

/**
 * Masking-tape label. 1.5deg, torn ends, soft shadow.
 * Used sparingly — four on the page, no more.
 */
export function Tape({
  children,
  lean = 'left',
  className = '',
}: {
  children: ReactNode
  lean?: 'left' | 'right'
  className?: string
}) {
  return (
    <span className={`tape ${lean === 'right' ? 'tape--right' : ''} ${className}`}>{children}</span>
  )
}
