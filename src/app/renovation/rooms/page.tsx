'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { RoomsDesktop } from '@/components/renovation/views/RoomsDesktop'
import { RoomsMobile } from '@/components/renovation/views/RoomsMobile'

export default function RoomsPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <RoomsMobile /> : <RoomsDesktop />
}
