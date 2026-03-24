'use client'

import React from 'react'
import { DatePicker } from '@/components/renovation/DatePicker'
import { useTaskForm } from '@/components/renovation/useTaskForm'
import { STATUSES, URGENCY, addDaysToIso, formatStatusLabel, formatUrgencyLabel } from '@/components/renovation/task-form-shared'
import type { RenovationTask, RenovationTeamMember, RenovationLabel, RenovationRoom, RenovationProvider, TaskStatus, TaskUrgency } from '@/types/renovation'

const selectField =
  'box-border w-full min-w-0 max-w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[16px] font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20'

interface TaskModalMobileProps {
  editing?: RenovationTask | null
  members: RenovationTeamMember[]
  labels: RenovationLabel[]
  rooms: RenovationRoom[]
  providers: RenovationProvider[]
  onClose: () => void
  onSave: () => void
}

/** Full-screen mobile task form; desktop uses `TaskModal`. */
export function TaskModalMobile({ editing, members, labels, rooms, providers, onClose, onSave }: TaskModalMobileProps) {
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

  return (
    <div
      className="fixed inset-0 z-[280] flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-white overscroll-x-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative flex h-12 w-full min-w-0 max-w-full shrink-0 items-center justify-center border-b border-slate-100 bg-white px-3">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-slate-900">{editingRow ? 'Edit task' : 'New task'}</h1>
      </header>

      <form
        id="task-form-mobile"
        onSubmit={save}
        className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-x-none overscroll-contain"
      >
        <div className="box-border w-full min-w-0 max-w-full space-y-5 px-4 pb-4 pt-4">
          <div className="min-w-0 max-w-full space-y-1.5">
            <label htmlFor="task-title-mobile" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Title
            </label>
            <input
              id="task-title-mobile"
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="box-border w-full min-w-0 max-w-full border-b-2 border-slate-100 bg-transparent pb-2 text-[20px] font-bold text-slate-900 outline-none placeholder:text-slate-300 focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={selectField}
              aria-label="Status"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as TaskUrgency)}
              className={selectField}
              aria-label="Priority"
            >
              {URGENCY.map((u) => (
                <option key={u} value={u}>
                  {formatUrgencyLabel(u)}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Due date</label>
            <div className="grid w-full min-w-0 max-w-full grid-cols-1 overflow-x-clip [&_.reno-native-date]:min-w-0">
              <DatePicker value={due} onChange={setDue} />
            </div>
            <div className="grid min-w-0 max-w-full grid-cols-3 gap-2 pt-1">
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
                    className={`min-h-[40px] min-w-0 rounded-xl px-1 text-center text-[11px] font-bold leading-tight transition-all ${
                      act ? 'bg-indigo-100 text-indigo-800 shadow-sm' : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={selectField}
              aria-label="Assignee"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {rooms.length > 0 && (
            <div className="min-w-0 max-w-full space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Room</label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={selectField} aria-label="Room">
                <option value="">No room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service provider</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className={selectField}
              aria-label="Service provider"
            >
              <option value="">{providers.length ? 'No provider' : 'Add providers in Providers tab'}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {labels.length > 0 && (
            <div className="min-w-0 max-w-full space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tags</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((lb) => {
                  const isSelected = selLabels.includes(lb.id)
                  return (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => toggleLabel(lb.id)}
                      className={`rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-sm transition-all ${
                        isSelected ? 'scale-[1.02] text-white' : 'border border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100'
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

          <div className="min-w-0 max-w-full space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
            <textarea
              dir="auto"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Context, measurements, links…"
              rows={5}
              className="box-border min-h-[140px] w-full min-w-0 max-w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </form>

      <div className="box-border flex w-full min-w-0 max-w-full shrink-0 gap-3 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {editingRow && (
          <button
            type="button"
            onClick={() => void handleDeleteClick()}
            className={`flex min-h-[52px] shrink-0 items-center justify-center rounded-xl font-bold transition-all ${
              confirmDelete ? 'min-w-[100px] bg-rose-600 px-4 text-white' : 'w-[52px] border border-rose-100 bg-rose-50 text-rose-600 active:bg-rose-100'
            }`}
          >
            {confirmDelete ? 'Sure?' : <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
          </button>
        )}
        <button
          type="submit"
          form="task-form-mobile"
          disabled={saving}
          className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[16px] font-bold text-white shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50"
        >
          {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Save'}
        </button>
      </div>
    </div>
  )
}
