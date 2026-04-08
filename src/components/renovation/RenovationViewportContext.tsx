'use client'

import { createContext, useContext, type ReactNode } from 'react'

const RenovationViewportContext = createContext<boolean>(false)

export function RenovationViewportProvider({
  isMobile,
  children,
}: {
  isMobile: boolean
  children: ReactNode
}) {
  return <RenovationViewportContext.Provider value={isMobile}>{children}</RenovationViewportContext.Provider>
}

/** True when viewport is max-width 768px (matches Tailwind `md` at 768 — iPad portrait / common DevTools widths). Only use under RenovationShell. */
export function useRenovationMobile() {
  return useContext(RenovationViewportContext)
}
