'use client'

import { useRenovation } from '@/components/renovation/RenovationContext'
import { VendorBudgetView } from '@/components/renovation/views/VendorBudgetView'

export default function RenovationBudgetPage() {
  const { project } = useRenovation()

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <a href="/renovation" className="text-indigo-600 font-semibold">
          Create a project first
        </a>
      </p>
    )
  }

  return <VendorBudgetView projectId={project.id} />
}
