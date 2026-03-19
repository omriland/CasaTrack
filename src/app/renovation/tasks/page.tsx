'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  listLabels,
  listTasks,
  listTeamMembers,
} from '@/lib/renovation'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { formatDateDisplay } from '@/lib/renovation-format'
import type { RenovationLabel, RenovationTask, RenovationTeamMember, TaskStatus, TaskUrgency } from '@/types/renovation'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']

export default function TasksPage() {
  const { project } = useRenovation()
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationTask | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [t, m, l] = await Promise.all([
        listTasks(project.id),
        listTeamMembers(project.id),
        listLabels(project.id),
      ])
      setTasks(t)
      setMembers(m)
      setLabels(l)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setSheet(true)
  }

  const openEdit = (t: RenovationTask) => {
    setEditing(t)
    setSheet(true)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  if (!project) {
    return (
      <p className="text-center text-black/45 py-16">
        <a href="/renovation" className="text-[#007AFF]">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Work</p>
          <h1 className="text-[28px] font-semibold tracking-tight">Tasks</h1>
        </div>
        <button type="button" onClick={openNew} className="h-10 px-4 rounded-md bg-[#007AFF] text-white text-[15px] font-semibold">
          Add task
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors capitalize ${
              filter === s ? 'bg-[#1C1C1E] text-white' : 'bg-white border border-black/[0.08] text-black/70'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-md border border-black/[0.06]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-black/[0.06] p-10 text-center text-[15px] text-black/45">
          No tasks in this filter
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const overdue = t.due_date && t.status !== 'done' && new Date(t.due_date + 'T23:59:59') < new Date()
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openEdit(t)}
                className="w-full text-left bg-white rounded-md border border-black/[0.06] p-4 flex gap-3.5 items-start active:scale-[0.99] transition-transform shadow-sm"
              >
                <div className="shrink-0 mt-1 opacity-90">{PRIORITY_ICONS[t.urgency]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-medium leading-snug" dir="auto">
                    {t.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {t.assignee && (
                      <span className="text-[12px] px-2 py-0.5 rounded-full bg-black/[0.06] text-black/60">{t.assignee.name}</span>
                    )}
                    {t.due_date && (
                      <span className={`text-[12px] tabular-nums ${overdue ? 'text-[#FF3B30] font-medium' : 'text-black/45'}`}>
                        {formatDateDisplay(t.due_date)}
                      </span>
                    )}
                    {(t.label_ids || []).map((lid) => {
                      const lb = labels.find((l) => l.id === lid)
                      return lb ? (
                        <span
                          key={lid}
                          className="text-[11px] px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: lb.color }}
                        >
                          {lb.name}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
                <span className="text-[12px] text-black/35 font-semibold capitalize shrink-0">{t.status.replace('_', ' ')}</span>
              </button>
            )
          })}
        </div>
      )}

      {sheet && (
        <TaskModal
          editing={editing}
          members={members}
          labels={labels}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
        />
      )}
    </div>
  )
}
