'use client'

import { useRenovationMobile } from '@/components/renovation/use-renovation-mobile'
import { WishlistDesktop } from '@/components/renovation/views/WishlistDesktop'
import { WishlistMobile } from '@/components/renovation/views/WishlistMobile'

export default function RenovationWishlistPage() {
  const isMobile = useRenovationMobile()
  return isMobile ? <WishlistMobile /> : <WishlistDesktop />
}
