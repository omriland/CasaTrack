'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { RenovationMilestone, RenovationTask } from '@/types/renovation'
import {
  createMilestone,
  deleteMilestone,
  setMilestoneTasks,
  updateMilestone,
} from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import { MILESTONE_CATEGORIES } from '@/components/renovation/views/roadmap-shared'

interface MilestoneDetailDrawerProps {
  projectId: string
  milestone: RenovationMilestone
  /** When true the milestone is an unsaved draft and Save will insert it. */
  isNew: boolean
  tasks: RenovationTask[]
  createdByMemberId?: string | null
  onClose: () => void
  onSaved: (milestone: RenovationMilestone, isNew: boolean) => void
  onDeleted: (id: string) => void
}

export function MilestoneDetailDrawer({
  projectId,
  milestone,
  isNew,
  tasks,
  createdByMemberId,
  onClose,
  onSaved,
  onDeleted,
}: MilestoneDetailDrawerProps) {
  const [title, setTitle] = useState(milestone.title)
  const [color, setColor] = useState(milestone.color)
  const [notes, setNotes] = useState(milestone.notes ?? '')
  const [done, setDone] = useState(milestone.done)
  const [startDate, setStartDate] = useState(milestone.start_date)
  const [endDate, setEndDate] = useState(milestone.end_date)
  const [taskIds, setTaskIds] = useState<string[]>(milestone.task_ids ?? [])
  const [taskSearch, setTaskSearch] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(milestone.title)
    setColor(milestone.color)
    setNotes(milestone.notes ?? '')
    setDone(milestone.done)
    setStartDate(milestone.start_date)
    setEndDate(milestone.end_date)
    setTaskIds(milestone.task_ids ?? [])
    setTaskSearch('')
  }, [milestone])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Keep end on/after start.
  const effectiveEnd = endDate < startDate ? startDate : endDate

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => a.title.localeCompare(b.title)),
    [tasks]
  )

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase()
    // Hide done tasks, but keep any that are already linked so they can be unlinked.
    return sortedTasks.filter((t) => {
      if (t.status === 'done' && !taskIds.includes(t.id)) return false
      if (q && !t.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [sortedTasks, taskSearch, taskIds])

  const selectedTasks = useMemo(
    () => taskIds.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as RenovationTask[],
    [taskIds, tasks]
  )

  const toggleTask = (id: string) => {
    setTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const canSave = title.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await createMilestone(projectId, {
          title: title.trim(),
          color,
          notes: notes.trim() || null,
          done,
          start_date: startDate,
          end_date: effectiveEnd,
          created_by_member_id: createdByMemberId ?? null,
          task_ids: taskIds,
        })
        onSaved(created, true)
      } else {
        await updateMilestone(milestone.id, {
          title: title.trim(),
          color,
          notes: notes.trim() || null,
          done,
          start_date: startDate,
          end_date: effectiveEnd,
        })
        await setMilestoneTasks(milestone.id, taskIds)
        onSaved(
          {
            ...milestone,
            title: title.trim(),
            color,
            notes: notes.trim() || null,
            done,
            start_date: startDate,
            end_date: effectiveEnd,
            task_ids: taskIds,
            updated_at: new Date().toISOString(),
          },
          false
        )
      }
    } catch {
      alert('Could not save the milestone. Please try again.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) {
      onClose()
      return
    }
    if (!confirm('Delete this milestone? Linked tasks are not deleted.')) return
    setSaving(true)
    try {
      await deleteMilestone(milestone.id)
      onDeleted(milestone.id)
    } catch {
      alert('Could not delete the milestone.')
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[260] bg-slate-900/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-[270] flex w-[100vw] max-w-[460px] flex-col bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.18)] animate-slide-in-right"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            void handleSave()
          }
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-[16px] font-bold text-slate-900">
            {isNew ? 'New milestone' : 'Edit milestone'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-600">Title</label>
            <input
              autoFocus={isNew}
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Demolition, Plumbing rough-in…"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-slate-600">Subject</span>
            <div className="flex flex-wrap gap-2">
              {MILESTONE_CATEGORIES.map((cat) => {
                const selected = color.toLowerCase() === cat.color.toLowerCase()
                return (
                  <button
                    key={cat.color}
                    type="button"
                    onClick={() => setColor(cat.color)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-[13px] font-semibold transition-colors ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span dir="rtl">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-600">Start</label>
              <DatePicker
                value={startDate}
                onChange={(v) => {
                  setStartDate(v)
                  if (endDate < v) setEndDate(v)
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-600">End</label>
              <DatePicker value={effectiveEnd} onChange={(v) => setEndDate(v)} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDone((d) => !d)}
            className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                done ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
              }`}
            >
              {done && (
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-[14px] font-semibold text-slate-700">
              {done ? 'Done' : 'Mark as done'}
            </span>
          </button>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-slate-600">Notes</label>
            <textarea
              dir="auto"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional details…"
              className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-[14px] text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-slate-600">
              Linked tasks {selectedTasks.length > 0 && `(${selectedTasks.length})`}
            </span>
            {tasks.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-[13px] text-slate-500">
                No tasks yet. Create tasks in the Tasks tab to link them here.
              </p>
            ) : (
              <>
                <input
                  type="search"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search tasks…"
                  dir="auto"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500/30"
                />
                <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200">
                  {filteredTasks.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[13px] text-slate-500">No matching tasks</p>
                  ) : (
                    filteredTasks.map((t) => {
                      const selected = taskIds.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTask(t.id)}
                          className={`flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 text-left text-[14px] transition-colors last:border-b-0 ${
                            selected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                              selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {selected && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <span className={`min-w-0 flex-1 truncate ${t.status === 'done' ? 'text-slate-400 line-through' : ''}`} dir="auto">
                            {t.title}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-md px-3 py-2 text-[14px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            {isNew ? 'Discard' : 'Delete'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3.5 py-2 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-md bg-indigo-600 px-4 py-2 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
