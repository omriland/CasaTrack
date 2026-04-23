'use client'

import React, { useEffect, useMemo } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { sortTeamMembersForAssigneePicker } from '@/lib/renovation-team-sort'
import { Dropdown } from '@/components/renovation/Dropdown'
import { DatePicker } from '@/components/renovation/DatePicker'
import { useTaskForm } from '@/components/renovation/useTaskForm'
import { STATUSES, URGENCY, PRIORITY_ICONS, addDaysToIso, formatStatusLabel, formatUrgencyLabel } from '@/components/renovation/task-form-shared'
import type {
  RenovationTask,
  RenovationTeamMember,
  RenovationLabel,
  RenovationRoom,
  RenovationProvider,
  TaskStatus,
  TaskUrgency,
} from '@/types/renovation'

export { PRIORITY_ICONS } from '@/components/renovation/task-form-shared'

interface TaskModalProps {
  editing?: RenovationTask | null
  members: RenovationTeamMember[]
  labels: RenovationLabel[]
  rooms: RenovationRoom[]
  providers: RenovationProvider[]
  onClose: () => void
  onSave: () => void
}

/** Desktop-only task form (centered modal). Mobile uses `TaskModalMobile`. */
export function TaskModal({ editing, members, labels, rooms, providers, onClose, onSave }: TaskModalProps) {
  const { activeProfile } = useRenovation()
  const assigneeDropdownOptions = useMemo(() => {
    const ordered = sortTeamMembersForAssigneePicker(members, activeProfile)
    return [{ value: '', label: 'Unassigned' }, ...ordered.map((m) => ({ value: m.id, label: m.name }))]
  }, [members, activeProfile])

  const {
    title,
    setTitle,
    body,
    setBody,
    status,
    setStatus,
    urgency,
    setUrgency,
    assigneeId,
    setAssigneeId,
    roomId,
    setRoomId,
    providerId,
    setProviderId,
    due,
    setDue,
    selLabels,
    saving,
    confirmDelete,
    save,
    toggleLabel,
    handleDeleteClick,
    editing: editingRow,
  } = useTaskForm({ editing, onSave })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        const saveBtn = document.getElementById('save-task-btn')
        if (saveBtn) saveBtn.click()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px] transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="animate-zoom-in flex w-full max-w-[560px] flex-col overflow-hidden rounded-[12px] border border-black/[0.08] bg-white pt-0 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)]"
      >
        <div className="relative flex items-center justify-between border-b border-black/[0.07] bg-white px-5 py-2.5">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-[oklch(0.13_0_0)]">
            {editingRow ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="-mr-2 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md p-1 text-[oklch(0.60_0_0)] transition-colors hover:bg-[oklch(0.97_0_0)] hover:text-[oklch(0.13_0_0)] active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="max-h-[85vh] space-y-4 overflow-y-auto p-5">
          <div className="group relative">
            <input
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name..."
              className="w-full bg-transparent pb-1 text-[24px] font-semibold tracking-[-0.02em] text-[oklch(0.13_0_0)] outline-none placeholder:text-[oklch(0.80_0_0)] transition-all font-[family-name:var(--font-varela-round)]"
              required
              autoFocus
            />
            <div className="absolute bottom-0 left-0 right-0 h-px origin-left scale-x-50 bg-black/10 transition-all duration-300 group-focus-within:scale-x-100 group-focus-within:bg-black/30" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Status</label>
              <Dropdown
                value={status}
                onChange={(val) => setStatus(val as TaskStatus)}
                options={STATUSES.map((s) => ({ value: s, label: formatStatusLabel(s) }))}
                className="h-10 w-full rounded-[8px] border border-black/10 bg-white text-[13px] font-medium capitalize text-[oklch(0.13_0_0)] shadow-none outline-none transition-all focus-within:border-black/25 focus-within:ring-0 !capitalize"
              />
            </div>
            <div className="space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Priority</label>
              <Dropdown
                value={urgency}
                onChange={(val) => setUrgency(val as TaskUrgency)}
                options={URGENCY.map((u) => ({
                  value: u,
                  label: formatUrgencyLabel(u),
                  icon: PRIORITY_ICONS[u],
                }))}
                className="h-10 w-full rounded-[8px] border border-black/10 bg-white text-[13px] font-medium capitalize text-[oklch(0.13_0_0)] shadow-none outline-none transition-all focus-within:border-black/25 focus-within:ring-0 !capitalize"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Due Date</label>
              <div className="group relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[oklch(0.60_0_0)] transition-colors group-focus-within:text-[oklch(0.13_0_0)]">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <DatePicker value={due} onChange={setDue} />
              </div>
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'Today', offset: 0 },
                  { label: 'Tomorrow', offset: 1 },
                  { label: 'In 5 days', offset: 5 },
                ].map((preset) => {
                  const target = addDaysToIso(preset.offset)
                  const act = due === target
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDue(target)}
                      className={`flex-1 rounded-[6px] px-2 py-1 text-center text-[11px] font-medium transition-all ${
                        act ? 'bg-[oklch(0.94_0_0)] text-[oklch(0.13_0_0)] border border-black/10' : 'bg-[oklch(0.97_0_0)] text-[oklch(0.60_0_0)] hover:bg-[oklch(0.94_0_0)] hover:text-[oklch(0.40_0_0)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Assignee</label>
              <Dropdown
                value={assigneeId}
                onChange={(val) => setAssigneeId(val)}
                options={assigneeDropdownOptions}
                className="h-10 w-full rounded-[8px] border border-black/10 bg-white text-[13px] font-medium text-[oklch(0.13_0_0)] shadow-none outline-none transition-all focus-within:border-black/25 focus-within:ring-0"
              />
            </div>
            {rooms.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Room</label>
                <Dropdown
                  value={roomId}
                  onChange={(val) => setRoomId(val)}
                  options={[{ value: '', label: 'No room' }, ...rooms.map((r) => ({ value: r.id, label: r.name }))]}
                  className="h-10 w-full rounded-[8px] border border-black/10 bg-white text-[13px] font-medium text-[oklch(0.13_0_0)] shadow-none outline-none transition-all focus-within:border-black/25 focus-within:ring-0"
                />
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Service provider</label>
              <Dropdown
                value={providerId}
                onChange={(val) => setProviderId(val)}
                options={[
                  { value: '', label: providers.length ? 'No provider' : 'Add providers in Providers tab' },
                  ...providers.map((p) => ({ value: p.id, label: p.name })),
                ]}
                className="h-10 w-full rounded-[8px] border border-black/10 bg-white text-[13px] font-medium text-[oklch(0.13_0_0)] shadow-none outline-none transition-all focus-within:border-black/25 focus-within:ring-0"
              />
            </div>
          </div>

          {labels.length > 0 && (
            <div className="space-y-1.5">
              <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Tags</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((lb) => {
                  const isSelected = selLabels.includes(lb.id)
                  return (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => toggleLabel(lb.id)}
                      className={`rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                        isSelected
                          ? 'border border-black/15 text-white'
                          : 'border border-black/10 bg-white text-[oklch(0.40_0_0)] hover:bg-[oklch(0.98_0_0)]'
                      }`}
                      style={isSelected ? { backgroundColor: lb.color } : undefined}
                    >
                      {lb.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="px-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]">Description</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 text-[oklch(0.60_0_0)]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <textarea
                dir="auto"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add context, measurements, or specs..."
                className="min-h-[24vh] w-full resize-none rounded-[8px] border border-black/10 bg-white py-2 pl-10 pr-3 text-[14px] font-medium text-[oklch(0.13_0_0)] transition-all placeholder:text-[oklch(0.60_0_0)] focus:border-black/25 focus:bg-white focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {editingRow && (editingRow.subtask_total ?? 0) > 0 && (
            <div className="flex items-center gap-2 rounded-[8px] border border-black/10 bg-[oklch(0.98_0_0)] px-4 py-3">
              <svg className="w-4 h-4 text-[oklch(0.60_0_0)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className={`text-[13px] font-medium tabular-nums ${editingRow.subtask_done === editingRow.subtask_total ? 'text-[oklch(0.65_0.18_163)]' : 'text-[oklch(0.40_0_0)]'}`}>
                Subtasks: {editingRow.subtask_done ?? 0}/{editingRow.subtask_total}
              </span>
              <span className="text-[11px] text-[oklch(0.60_0_0)] ml-auto">Open task detail to manage</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {editingRow && (
              <button
                type="button"
                onClick={() => void handleDeleteClick()}
                className={`flex h-12 shrink-0 items-center justify-center rounded shadow-sm transition-all ${
                  confirmDelete
                    ? 'w-auto border border-[oklch(0.55_0.22_15)] bg-[oklch(0.55_0.22_15)] px-4 font-semibold text-white'
                    : 'w-12 border border-[oklch(0.9_0.03_20)] bg-[oklch(0.98_0.01_20)] text-[oklch(0.55_0.22_15)] hover:bg-[oklch(0.96_0.02_20)] active:scale-[0.98]'
                }`}
              >
                {confirmDelete ? <span className="whitespace-nowrap text-sm">Sure?</span> : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
              </button>
            )}
            <button
              id="save-task-btn"
              type="submit"
              disabled={saving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[8px] bg-[oklch(0.13_0_0)] font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
