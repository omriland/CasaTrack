'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { RenovationDashboardDesktop } from '@/components/renovation/views/RenovationDashboardDesktop'
import { RenovationDashboardMobile } from '@/components/renovation/views/RenovationDashboardMobile'

export default function RenovationDashboardPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <RenovationDashboardMobile /> : <RenovationDashboardDesktop />
}
