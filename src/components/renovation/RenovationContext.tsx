'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getActiveProject } from '@/lib/renovation'
import type { RenovationProject } from '@/types/renovation'

type Ctx = {
  project: RenovationProject | null
  loading: boolean
  refresh: () => Promise<void>
}

const RenovationContext = createContext<Ctx | null>(null)

export function RenovationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [project, setProject] = useState<RenovationProject | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const p = await getActiveProject()
      setProject(p)
    } catch (e) {
      console.error(e)
      setProject(null)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const p = await getActiveProject()
        if (!cancelled) setProject(p)
      } catch {
        if (!cancelled) setProject(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <RenovationContext.Provider value={{ project, loading, refresh }}>
      {children}
    </RenovationContext.Provider>
  )
}

export function useRenovation() {
  const c = useContext(RenovationContext)
  if (!c) throw new Error('useRenovation outside provider')
  return c
}
