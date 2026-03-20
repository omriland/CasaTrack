'use client'

import { useEffect } from 'react'
import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { SettingsDesktop } from '@/components/renovation/views/SettingsDesktop'
import { SettingsMobile } from '@/components/renovation/views/SettingsMobile'

export default function RenovationSettingsPage() {
  const isMobile = useRenovationMobile()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#budget') return
    const id = window.setTimeout(() => {
      document.getElementById('budget')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return () => window.clearTimeout(id)
  }, [])

  return isMobile ? <SettingsMobile /> : <SettingsDesktop />
}
