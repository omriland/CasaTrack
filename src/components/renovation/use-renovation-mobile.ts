'use client'

import { useSyncExternalStore } from 'react'

export { useRenovationMobile } from './RenovationViewportContext'

const MOBILE_MQ = '(max-width: 767px)'

/** Matches Tailwind `md` breakpoint (viewport &lt; 768px). Safe for modals and client-only UI. */
export function useRenovationMobileMedia(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia(MOBILE_MQ)
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(MOBILE_MQ).matches : false),
    () => false
  )
}
