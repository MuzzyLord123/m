'use client'

import { useEffect, useRef } from 'react'
import { recordConversion, type ConversionKind } from '@/lib/conversions'

/**
 * Fires a conversion once, when the page it sits on has loaded.
 *
 * Used only on /contact/sent, which is where the form lands when it posts without
 * JavaScript. The enhanced path fires its own conversion and never navigates here, so
 * an enquiry is counted exactly once either way.
 *
 * The ref guard matters: in development React mounts effects twice on purpose, and
 * without it every enquiry would be reported to Google Ads as two.
 */
export function ConversionOnLoad({ kind }: { kind: ConversionKind }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    recordConversion(kind)
  }, [kind])

  return null
}
