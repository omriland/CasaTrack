'use client'

import type { ReactNode } from 'react'

type MobileStickyFooterProps = {
  children: ReactNode
  className?: string
  /** Clear the renovation mobile bottom tab bar (default true). */
  aboveTabBar?: boolean
}

export function MobileStickyFooter({ children, className = '', aboveTabBar = true }: MobileStickyFooterProps) {
  return (
    <div
      className={`fixed left-0 right-0 z-[90] md:hidden pointer-events-none ${className}`}
      style={{
        bottom: aboveTabBar
          ? 'calc(4.35rem + env(safe-area-inset-bottom, 0px))'
          : 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="max-w-lg mx-auto px-4 pointer-events-auto">{children}</div>
    </div>
  )
}
