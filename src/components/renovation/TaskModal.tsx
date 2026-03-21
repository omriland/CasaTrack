'use client'

import React, { useState, useEffect } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createTask, updateTask, setTaskLabels, deleteTask } from '@/lib/renovation'
import { Dropdown } from '@/components/renovation/Dropdown'
import { DatePicker } from '@/components/renovation/DatePicker'
import { useRenovationMobileMedia } from '@/components/renovation/use-renovation-mobile'
import type {
  RenovationTask,
  RenovationTeamMember,
  RenovationLabel,
  RenovationRoom,
  RenovationProvider,
  TaskStatus,
  TaskUrgency,
} from '@/types/renovation'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']
const URGENCY: TaskUrgency[] = ['low', 'medium', 'high', 'critical']

export const PRIORITY_ICONS: Record<TaskUrgency, React.ReactNode> = {
  critical: <svg className="w-[14px] h-[14px] text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 11l8-8 8 8M4 19l8-8 8 8" /></svg>,
  high: <svg className="w-[14px] h-[14px] text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 15l8-8 8 8" /></svg>,
  medium: <svg className="w-[14px] h-[14px] text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16M4 15h16" /></svg>,
  low: <svg className="w-[14px] h-[14px] text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4 9l8 8 8-8" /></svg>,
}

const addDaysToIso = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

interface TaskModalProps {
  editing?: RenovationTask | null
  members: RenovationTeamMember[]
  labels: RenovationLabel[]
  rooms: RenovationRoom[]
  providers: RenovationProvider[]
  onClose: () => void
  onSave: () => void
}

export function TaskModal({ editing, members, labels, rooms, providers, onClose, onSave }: TaskModalProps) {
  const { project, activeProfile } = useRenovation()
  const isMobile = useRenovationMobileMedia()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TaskStatus>('open')
  const [urgency, setUrgency] = useState<TaskUrgency>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [due, setDue] = useState('')
  const [selLabels, setSelLabels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setBody(editing.body || '')
      setStatus(editing.status)
      setUrgency(editing.urgency)
      setAssigneeId(editing.assignee_id || '')
      setRoomId(editing.room_id || '')
      setProviderId(editing.provider_id || '')
      setDue(editing.due_date || '')
      setSelLabels(editing.label_ids || [])
    } else {
      setTitle('')
      setBody('')
      setStatus('open')
      setUrgency('medium')
      setAssigneeId('')
      setRoomId('')
      setProviderId('')
      setDue('')
      setSelLabels([])
    }
    setConfirmDelete(false)
  }, [editing])

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
          room_id: roomId || null,
          provider_id: providerId || null,
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
          created_by_member_id: activeProfile?.id ?? null,
          room_id: roomId || null,
          provider_id: providerId || null,
          due_date: due || null,
          label_ids: selLabels,
        })
      }
      onSave()
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

  return (
    <div
      className={
        isMobile
          ? 'fixed inset-0 z-[280] flex items-end justify-center p-0 bg-slate-900/40 backdrop-blur-sm transition-opacity'
          : 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity'
      }
      onClick={onClose}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className={
          isMobile
            ? 'w-full max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] bg-white rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col pt-2 animate-fade-in-up'
            : 'w-full max-w-[500px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pt-0 animate-zoom-in'
        }
      >
        {/* Header */}
        <div
          className={`px-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative ${isMobile ? 'py-1.5' : 'py-2'}`}
        >
          {isMobile ? (
            <div className="w-12 h-0.5 bg-slate-200 rounded-full absolute top-1 left-1/2 -translate-x-1/2" />
          ) : null}
          <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">{editing ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={onClose}
            className="p-1 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200 active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form
          onSubmit={save}
          className={`p-5 space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${isMobile ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-y-auto max-h-[85vh]'}`}
        >
          
          {/* Main Title Input */}
          <div className="relative group">
            <input
              dir="auto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name..."
              className="w-full bg-transparent text-[20px] font-bold text-slate-900 outline-none pb-1 placeholder-slate-200 transition-all font-display"
              required
              autoFocus
            />
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 group-focus-within:bg-indigo-500 transition-all duration-300 scale-x-50 origin-left group-focus-within:scale-x-100" />
          </div>

          {/* Core Configuration Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Status</label>
              <div className="relative">
                <Dropdown
                  value={status}
                  onChange={(val) => setStatus(val as TaskStatus)}
                  options={STATUSES.map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-bold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all !capitalize outline-none`}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Priority</label>
              <div className="relative">
                <Dropdown
                  value={urgency}
                  onChange={(val) => setUrgency(val as TaskUrgency)}
                  options={URGENCY.map(u => ({ value: u, label: u.replace(/\b\w/g, l => l.toUpperCase()), icon: PRIORITY_ICONS[u] }))}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-bold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all !capitalize outline-none`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Due Date</label>
              <div className="relative group">
                {!isMobile ? (
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                ) : null}
                <DatePicker value={due} onChange={setDue} />
              </div>
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: 'Today', offset: 0 },
                  { label: 'Tomorrow', offset: 1 },
                  { label: 'In 5 days', offset: 5 },
                ].map(preset => {
                  const target = addDaysToIso(preset.offset)
                  const act = due === target
                  return (
                    <button key={preset.label} type="button" onClick={() => setDue(target)} className={`px-2 py-1 text-[11px] font-bold rounded transition-all flex-1 text-center ${act ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Assignee</label>
              <div className="relative">
                <Dropdown
                  value={assigneeId}
                  onChange={(val) => setAssigneeId(val)}
                  options={[{ value: '', label: 'Unassigned' }, ...members.map(m => ({ value: m.id, label: m.name }))]}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-semibold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all outline-none`}
                />
              </div>
            </div>
            {rooms.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Room</label>
                <div className="relative">
                  <Dropdown
                    value={roomId}
                    onChange={(val) => setRoomId(val)}
                    options={[{ value: '', label: 'No room' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
                    className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-semibold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all outline-none`}
                  />
                </div>
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Service provider</label>
              <div className="relative">
                <Dropdown
                  value={providerId}
                  onChange={(val) => setProviderId(val)}
                  options={[
                    { value: '', label: providers.length ? 'No provider' : 'Add providers in Providers tab' },
                    ...providers.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  className={`w-full h-11 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-semibold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all outline-none`}
                />
              </div>
            </div>
          </div>

          {labels.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((lb) => {
                  const isSelected = selLabels.includes(lb.id)
                  return (
                    <button
                      key={lb.id}
                      type="button"
                      onClick={() => toggleLabel(lb.id)}
                      className={`text-[13px] px-3.5 py-1.5 rounded-full font-semibold transition-all duration-200 shadow-sm ${
                        isSelected ? 'text-white border-transparent scale-105' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Description</label>
            <div className="relative">
               <div className="absolute left-3.5 top-3.5 text-slate-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
               </div>
                <textarea
                  dir="auto"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add context, measurements, or specs..."
                  className={`w-full min-h-[25vh] pl-10 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 ${isMobile ? 'text-[16px]' : 'text-[14px]'} font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white resize-none`}
                />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            {editing && (
              <button
                type="button"
                onClick={async () => {
                  if (!confirmDelete) {
                    setConfirmDelete(true)
                    setTimeout(() => setConfirmDelete(false), 3000)
                    return
                  }
                  await deleteTask(editing.id)
                  onSave()
                }}
                className={`h-12 shrink-0 rounded flex items-center justify-center transition-all shadow-sm ${
                  confirmDelete 
                    ? 'w-auto px-4 bg-rose-600 border-rose-600 text-white font-bold' 
                    : 'w-12 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 active:scale-[0.98]'
                }`}
              >
                {confirmDelete ? (
                  <span className="text-sm whitespace-nowrap">Sure?</span>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                )}
              </button>
            )}
            <button id="save-task-btn" type="submit" disabled={saving} className="flex-1 h-12 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
