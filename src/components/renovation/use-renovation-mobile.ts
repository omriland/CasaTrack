'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

export { useRenovationMobile } from './RenovationViewportContext'

const MOBILE_MQ = '(max-width: 768px)'

/**
 * Matches Tailwind `md` breakpoint (viewport &lt; 768px).
 * Returns false until after mount so SSR + first client paint match (avoids hydration mismatches
 * in components that branch UI on this value, e.g. `DatePicker`).
 */
export function useRenovationMobileMedia(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const mqMatches = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia(MOBILE_MQ)
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia(MOBILE_MQ).matches,
    () => false
  )

  return mounted && mqMatches
}
