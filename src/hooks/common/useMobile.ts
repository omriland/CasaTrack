import { useState, useEffect } from 'react'

/**
 * Hook to detect mobile screen size
 * @param breakpoint - Breakpoint in pixels (default: 768)
 * @returns boolean indicating if screen is mobile
 */
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkMobile()

    // Listen for resize events
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [breakpoint])

  return isMobile
}
