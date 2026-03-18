'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createTask,
  deleteTask,
  listLabels,
  listTasks,
  listTeamMembers,
  setTaskLabels,
  updateTask,
} from '@/lib/renovation'
import { Dropdown } from '@/components/renovation/Dropdown'
import { formatDateDisplay } from '@/lib/renovation-format'
import type { RenovationLabel, RenovationTask, RenovationTeamMember, TaskStatus, TaskUrgency } from '@/types/renovation'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']
const URGENCY: TaskUrgency[] = ['low', 'medium', 'high', 'critical']
const urgencyDot: Record<TaskUrgency, string> = {
  low: 'bg-black/20',
  medium: 'bg-[#007AFF]',
  high: 'bg-[#FF9500]',
  critical: 'bg-[#FF3B30]',
}

export default function TasksPage() {
  const { project } = useRenovation()
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationTask | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TaskStatus>('open')
  const [urgency, setUrgency] = useState<TaskUrgency>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [due, setDue] = useState('')
  const [selLabels, setSelLabels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

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
    setTitle('')
    setBody('')
    setStatus('open')
    setUrgency('medium')
    setAssigneeId('')
    setDue('')
    setSelLabels([])
    setSheet(true)
  }

  const openEdit = (t: RenovationTask) => {
    setEditing(t)
    setTitle(t.title)
    setBody(t.body || '')
    setStatus(t.status)
    setUrgency(t.urgency)
    setAssigneeId(t.assignee_id || '')
    setDue(t.due_date || '')
    setSelLabels(t.label_ids || [])
    setSheet(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateTask(editing.id, {
          title: title.trim(),
          body: body || null,
          status,
          urgency,
          assignee_id: assigneeId || null,
          due_date: due || null,
        })
        await setTaskLabels(editing.id, selLabels)
      } else {
        await createTask(project.id, {
          title: title.trim(),
          body: body || null,
          status,
          urgency,
          assignee_id: assigneeId || null,
          due_date: due || null,
          label_ids: selLabels,
        })
      }
      setSheet(false)
      await load()
    } catch (err) {
      console.error(err)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleLabel = (id: string) => {
    setSelLabels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
            className={`shrink-0 px-3 py-1.5 rounded-full text-[14px] font-medium transition-colors ${
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
                className="w-full text-left bg-white rounded-md border border-black/[0.06] p-4 flex gap-3 active:scale-[0.99] transition-transform"
              >
                <div className={`w-1 rounded-full shrink-0 self-stretch ${urgencyDot[t.urgency]}`} />
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
                <span className="text-[12px] text-black/35 uppercase shrink-0">{t.status.replace('_', ' ')}</span>
              </button>
            )
          })}
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4 bg-black/40" onClick={() => setSheet(false)}>
          <form
            onSubmit={save}
            onClick={(ev) => ev.stopPropagation()}
            className="w-full md:max-w-lg bg-white rounded-t-[14px] md:rounded-md p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[92vh] overflow-y-auto"
          >
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-[20px] font-semibold mb-4">{editing ? 'Edit task' : 'New task'}</h2>
            <div className="space-y-3">
              <input
                dir="auto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full h-12 px-3 rounded-md border border-black/[0.12] text-[17px] font-medium"
                required
              />
              <textarea dir="auto" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notes" rows={3} className="w-full px-3 py-2 rounded-md border border-black/[0.12] text-[15px]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Dropdown
                    value={status}
                    onChange={(val) => setStatus(val as TaskStatus)}
                    options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ') }))}
                    className="w-full h-12 rounded-md border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
                  />
                </div>
                <div className="relative">
                  <Dropdown
                    value={urgency}
                    onChange={(val) => setUrgency(val as TaskUrgency)}
                    options={URGENCY.map(u => ({ value: u, label: u }))}
                    className="capitalize w-full h-12 rounded-md border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">Assignee</label>
                <div className="relative">
                  <Dropdown
                    value={assigneeId}
                    onChange={(val) => setAssigneeId(val)}
                    options={[{ value: '', label: 'Unassigned' }, ...members.map(m => ({ value: m.id, label: m.name }))]}
                    className="w-full h-12 rounded-md border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] text-black/45">Due date</label>
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1 w-full h-11 px-2 rounded-md border border-black/[0.12] text-[15px]" />
              </div>
              {labels.length > 0 && (
                <div>
                  <p className="text-[13px] text-black/45 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((lb) => (
                      <button
                        key={lb.id}
                        type="button"
                        onClick={() => toggleLabel(lb.id)}
                        className={`text-[13px] px-3 py-1.5 rounded-full border-2 transition-colors ${
                          selLabels.includes(lb.id) ? 'text-white border-transparent' : 'border-black/[0.12] text-black/70'
                        }`}
                        style={selLabels.includes(lb.id) ? { backgroundColor: lb.color } : undefined}
                      >
                        {lb.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              {editing && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('Delete task?')) return
                    await deleteTask(editing.id)
                    setSheet(false)
                    await load()
                  }}
                  className="h-12 px-4 rounded-md text-[#FF3B30] font-medium"
                >
                  Delete
                </button>
              )}
              <button type="button" onClick={() => setSheet(false)} className="flex-1 h-12 rounded-md bg-black/[0.06] font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 h-12 rounded-md bg-[#007AFF] text-white font-semibold disabled:opacity-50">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
