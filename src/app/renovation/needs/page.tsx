'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { NeedsDesktop } from '@/components/renovation/views/NeedsDesktop'
import { NeedsMobile } from '@/components/renovation/views/NeedsMobile'

export default function RenovationNeedsPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <NeedsMobile /> : <NeedsDesktop />
}
