'use client'

import { CalendarDesktop } from '@/components/renovation/views/CalendarDesktop'
import { CalendarMobile } from '@/components/renovation/views/CalendarMobile'
import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'

export default function CalendarPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <CalendarMobile /> : <CalendarDesktop />
}
