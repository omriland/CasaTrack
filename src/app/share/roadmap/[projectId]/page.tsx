'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProjectById, listMilestones } from '@/lib/renovation'
import type { RenovationMilestone, RenovationProject } from '@/types/renovation'
import { RoadmapGantt } from '@/components/renovation/RoadmapGantt'
import { PublicRoadmapWeeks } from '@/components/renovation/PublicRoadmapWeeks'
import { useRenovationMobileMedia } from '@/components/renovation/use-renovation-mobile'

export default function PublicRoadmapPage() {
  const params = useParams<{ projectId: string }>()
  const projectId = String(params?.projectId ?? '')
  const [project, setProject] = useState<RenovationProject | null>(null)
  const [milestones, setMilestones] = useState<RenovationMilestone[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')
  const isMobile = useRenovationMobileMedia()

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const p = await getProjectById(projectId)
        if (!active) return
        if (!p) {
          setState('notfound')
          return
        }
        const ms = await listMilestones(projectId)
        if (!active) return
        setProject(p)
        setMilestones(ms)
        setState('ready')
      } catch {
        if (active) setState('notfound')
      }
    })()
    return () => {
      active = false
    }
  }, [projectId])

  if (state === 'notfound') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-[oklch(0.995_0_0)] px-6 text-center">
        <div className="text-[20px] font-bold text-slate-800">Roadmap not found</div>
        <p className="mt-1 text-[14px] text-slate-500">
          This link may be invalid or the project is no longer available.
        </p>
      </div>
    )
  }

  return (
    <div className="reno-app flex h-dvh flex-col bg-[oklch(0.995_0_0)] text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[18px] font-bold tracking-tight text-slate-900">
                {project?.name || 'Renovation'}
              </h1>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Roadmap
              </span>
            </div>
            {project?.address_text && (
              <p className="truncate text-[13px] text-slate-500">{project.address_text}</p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View only
          </span>
        </div>
      </header>

      <main
        className={`flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 ${isMobile ? 'overflow-y-auto' : ''}`}
      >
        {state === 'loading' ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[14px] text-slate-400">
            Loading roadmap…
          </div>
        ) : isMobile ? (
          <PublicRoadmapWeeks milestones={milestones} />
        ) : (
          <RoadmapGantt className="min-h-0 flex-1" milestones={milestones} hideDone={false} readOnly />
        )}
      </main>
    </div>
  )
}
