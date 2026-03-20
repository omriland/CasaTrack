'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { GalleryBody } from '@/components/renovation/views/GalleryBody'

export default function GalleryPage() {
  const isMobile = useRenovationMobile()
  return <GalleryBody mobile={isMobile} />
}
