'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Deep links to `/renovation/budget` land on the budget section in Settings. */
export default function RenovationBudgetRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/renovation/settings#budget')
  }, [router])
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[15px] font-medium text-slate-500">
      Opening budget…
    </div>
  )
}
