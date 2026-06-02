'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { RoadmapDesktop } from '@/components/renovation/views/RoadmapDesktop'
import { RoadmapMobile } from '@/components/renovation/views/RoadmapMobile'

export default function RoadmapPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <RoadmapMobile /> : <RoadmapDesktop />
}
