'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { VendorBudgetView } from '@/components/renovation/views/VendorBudgetView'
import { profileCanViewBudget } from '@/lib/renovation-profile'

export default function RenovationBudgetPage() {
  const { project, activeProfile, profileBootstrapDone } = useRenovation()
  const router = useRouter()

  useEffect(() => {
    if (!profileBootstrapDone || !project) return
    if (!profileCanViewBudget(activeProfile?.name)) router.replace('/renovation')
  }, [profileBootstrapDone, project, activeProfile?.name, router])

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <a href="/renovation" className="text-indigo-600 font-semibold">
          Create a project first
        </a>
      </p>
    )
  }

  if (!profileBootstrapDone) {
    return <p className="text-center text-slate-400 py-16 text-sm">Loading…</p>
  }

  if (!profileCanViewBudget(activeProfile?.name)) {
    return (
      <div className="py-16 px-4 text-center text-slate-600 space-y-3">
        <p className="text-[15px]">The budget view is only available to Omri and Tamar.</p>
        <Link href="/renovation" className="text-indigo-600 font-semibold text-[15px]">
          Back to overview
        </Link>
      </div>
    )
  }

  return <VendorBudgetView projectId={project.id} />
}
