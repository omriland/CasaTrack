'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { ProvidersDesktop } from '@/components/renovation/views/ProvidersDesktop'
import { ProvidersMobile } from '@/components/renovation/views/ProvidersMobile'

export default function RenovationProvidersPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <ProvidersMobile /> : <ProvidersDesktop />
}
