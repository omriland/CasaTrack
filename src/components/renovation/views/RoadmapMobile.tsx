'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listMilestones, listTasks } from '@/lib/renovation'
import type { RenovationMilestone, RenovationTask } from '@/types/renovation'
import { MilestoneDetailDrawer } from '@/components/renovation/MilestoneDetailDrawer'
import {
  currentWeekStart,
  formatRange,
  MILESTONE_COLORS,
  parseYmd,
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

export function RoadmapMobile() {
  const { project, activeProfile } = useRenovation()
  const [milestones, setMilestones] = useState<RenovationMilestone[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState<{ milestone: RenovationMilestone; isNew: boolean } | null>(
    null
  )
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    if (!project) return
    const url = `${window.location.origin}/share/roadmap/${project.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${project.name} · Roadmap`, url })
        return
      } catch {
        /* user cancelled or unsupported — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this public link:', url)
    }
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

  const groups = useMemo(() => {
    const sorted = [...milestones].sort(
      (a, b) => a.start_date.localeCompare(b.start_date) || a.sort_order - b.sort_order
    )
    const map = new Map<string, { label: string; items: RenovationMilestone[] }>()
    for (const m of sorted) {
      const weekStart = startOfWeek(parseYmd(m.start_date), { weekStartsOn: 0 })
      const key = toYmd(weekStart)
      const entry = map.get(key)
      if (entry) entry.items.push(m)
      else map.set(key, { label: `Week of ${format(weekStart, 'MMM d')}`, items: [m] })
    }
    return Array.from(map.values())
  }, [milestones])

  const openNew = () => {
    if (!project) return
    setEditor({ milestone: makeDraft(project.id, milestones.length), isNew: true })
  }

  const handleSaved = (saved: RenovationMilestone, isNew: boolean) => {
    setMilestones((prev) => (isNew ? [...prev, saved] : prev.map((m) => (m.id === saved.id ? saved : m))))
    setEditor(null)
  }

  const handleDeleted = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    setEditor(null)
  }

  return (
    <div className="animate-fade-in pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Roadmap</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={!project}
            aria-label="Share roadmap"
            className={`flex h-[42px] w-[42px] items-center justify-center rounded-xl border transition-colors disabled:opacity-50 ${
              copied
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
            }`}
          >
            {copied ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={openNew}
            disabled={!project}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors active:bg-indigo-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-[14px] text-slate-400">Loading…</p>
      ) : milestones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-slate-600">No milestones yet</p>
          <p className="mt-1 text-[13px] text-slate-400">
            Tap “New” to add your first roadmap item. The drag-to-plan Gantt is available on desktop.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <h2 className="mb-2 px-1 text-[12px] font-extrabold uppercase tracking-wider text-slate-400">
                {g.label}
              </h2>
              <div className="space-y-2">
                {g.items.map((m) => {
                  const taskCount = m.task_ids.length
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditor({ milestone: m, isNew: false })}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left shadow-sm transition-colors active:bg-slate-50"
                    >
                      <span
                        className="h-9 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: m.color, opacity: m.done ? 0.4 : 1 }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-[15px] font-semibold ${
                            m.done ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                          dir="auto"
                        >
                          {m.title}
                        </p>
                        <p className="mt-0.5 text-[13px] text-slate-500">
                          {formatRange(m.start_date, m.end_date)}
                          {taskCount > 0 && ` · ${taskCount} task${taskCount > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      {m.done && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
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
