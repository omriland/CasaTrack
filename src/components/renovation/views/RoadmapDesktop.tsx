'use client'

import { useCallback, useEffect, useState } from 'react'
import { addDays } from 'date-fns'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listMilestones, listTasks, updateMilestone } from '@/lib/renovation'
import type { RenovationMilestone, RenovationTask } from '@/types/renovation'
import { RoadmapGantt } from '@/components/renovation/RoadmapGantt'
import { MilestoneDetailDrawer } from '@/components/renovation/MilestoneDetailDrawer'
import {
  currentWeekStart,
  MILESTONE_COLORS,
  toYmd,
} from '@/components/renovation/views/roadmap-shared'

function makeDraft(projectId: string, count: number): RenovationMilestone {
  const start = currentWeekStart()
  return {
    id: '',
    project_id: projectId,
    title: '',
    color: MILESTONE_COLORS[count % MILESTONE_COLORS.length],
    notes: null,
    done: false,
    start_date: toYmd(start),
    end_date: toYmd(addDays(start, 4)),
    sort_order: count,
    created_by_member_id: null,
    created_at: '',
    updated_at: '',
    task_ids: [],
  }
}

export function RoadmapDesktop() {
  const { project, activeProfile } = useRenovation()
  const [milestones, setMilestones] = useState<RenovationMilestone[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [hideDone, setHideDone] = useState(false)
  const [editor, setEditor] = useState<{ milestone: RenovationMilestone; isNew: boolean } | null>(
    null
  )
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    if (!project) return
    const url = `${window.location.origin}/share/roadmap/${project.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this public link:', url)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [project])

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [ms, ts] = await Promise.all([listMilestones(project.id), listTasks(project.id)])
      setMilestones(ms)
      setTasks(ts)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    if (!project) return
    setEditor({ milestone: makeDraft(project.id, milestones.length), isNew: true })
  }

  const handleCreateDraft = (startYmd: string, endYmd: string) => {
    if (!project) return
    const draft = makeDraft(project.id, milestones.length)
    setEditor({ milestone: { ...draft, start_date: startYmd, end_date: endYmd }, isNew: true })
  }

  const handlePersist = (id: string, patch: { start_date: string; end_date: string }) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    updateMilestone(id, patch).catch(() => void load())
  }

  const handleSaved = (saved: RenovationMilestone, isNew: boolean) => {
    setMilestones((prev) => (isNew ? [...prev, saved] : prev.map((m) => (m.id === saved.id ? saved : m))))
    setEditor(null)
  }

  const handleDeleted = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    setEditor(null)
  }

  const doneCount = milestones.filter((m) => m.done).length

  return (
    <div className="animate-fade-in flex h-[calc(100dvh-7.5rem)] min-h-[480px] flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Roadmap</h1>
          <p className="mt-0.5 text-[14px] text-slate-500">
            Plan the main items across the working weeks. Drag to move or resize, click to edit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={!project}
            title="Copy a public, view-only link to this roadmap"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
              copied
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link copied
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </>
            )}
          </button>
          {doneCount > 0 && (
            <button
              type="button"
              onClick={() => setHideDone((v) => !v)}
              className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${
                hideDone
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {hideDone ? 'Show done' : 'Hide done'}
            </button>
          )}
          <button
            type="button"
            onClick={openNew}
            disabled={!project}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New milestone
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[14px] text-slate-400">
          Loading roadmap…
        </div>
      ) : (
        <RoadmapGantt
          className="min-h-0 flex-1"
          milestones={milestones}
          hideDone={hideDone}
          onOpen={(m) => setEditor({ milestone: m, isNew: false })}
          onCreateDraft={handleCreateDraft}
          onPersist={handlePersist}
        />
      )}

      {editor && project && (
        <MilestoneDetailDrawer
          projectId={project.id}
          milestone={editor.milestone}
          isNew={editor.isNew}
          tasks={tasks}
          createdByMemberId={activeProfile?.id ?? null}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
