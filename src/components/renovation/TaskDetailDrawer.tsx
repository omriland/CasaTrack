'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createLabel, setTaskLabels, updateTask } from '@/lib/renovation'
import type {
  RenovationTask,
  RenovationLabel,
  RenovationRoom,
  RenovationProvider,
  RenovationTeamMember,
  TaskStatus,
  TaskUrgency,
} from '@/types/renovation'
import { normalizeRoomIconKey, RoomIconGlyph, ROOM_ICON_TILE } from '@/components/renovation/room-icons'
import { PRIORITY_ICONS, STATUSES, URGENCY, formatUrgencyLabel } from '@/components/renovation/task-form-shared'
import { format, parseISO } from 'date-fns'
import { formatTaskDue } from '@/lib/renovation-format'
import { MemberAvatarChip } from '@/components/renovation/MemberAvatar'

const EMPTY_LABEL_IDS: string[] = []

type DetailPickerOpen = 'status' | 'assignee' | 'room' | 'priority' | 'provider' | 'labels' | null

interface TaskDetailDrawerProps {
  task: RenovationTask
  members: RenovationTeamMember[]
  labels: RenovationLabel[]
  rooms: RenovationRoom[]
  providers: RenovationProvider[]
  onClose: () => void
  onEdit: () => void
  onTaskChange?: (task: RenovationTask) => void
  /** Called after a new label is created in this drawer so parent can refresh label list. */
  onLabelCreated?: (label: RenovationLabel) => void
}

export function TaskDetailDrawer({
  task,
  members,
  labels,
  rooms,
  providers,
  onClose,
  onEdit,
  onTaskChange,
  onLabelCreated,
}: TaskDetailDrawerProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [bodyDraft, setBodyDraft] = useState(task.body || '')
  const [detailPickerOpen, setDetailPickerOpen] = useState<DetailPickerOpen>(null)
  const [labelSearch, setLabelSearch] = useState('')
  const statusPickerRef = useRef<HTMLDivElement>(null)
  const assigneePickerRef = useRef<HTMLDivElement>(null)
  const roomPickerRef = useRef<HTMLDivElement>(null)
  const priorityPickerRef = useRef<HTMLDivElement>(null)
  const providerPickerRef = useRef<HTMLDivElement>(null)
  const labelPickerRef = useRef<HTMLDivElement>(null)
  const labelSearchInputRef = useRef<HTMLInputElement>(null)

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [members],
  )

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [providers],
  )

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [rooms],
  )

  const sortedLabels = useMemo(
    () => [...labels].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [labels],
  )

  const filteredLabels = useMemo(() => {
    const q = labelSearch.trim().toLowerCase()
    if (!q) return sortedLabels
    return sortedLabels.filter((l) => l.name.toLowerCase().includes(q))
  }, [sortedLabels, labelSearch])

  const labelCreateNameTrimmed = labelSearch.trim()
  const canCreateLabel =
    labelCreateNameTrimmed.length > 0 &&
    !sortedLabels.some((l) => l.name.toLowerCase() === labelCreateNameTrimmed.toLowerCase())

  const taskLabelIds = task.label_ids ?? EMPTY_LABEL_IDS
  const taskLabelsResolved = useMemo(
    () => taskLabelIds.map((id) => sortedLabels.find((l) => l.id === id)).filter(Boolean) as RenovationLabel[],
    [taskLabelIds, sortedLabels],
  )

  useEffect(() => {
    setTitleDraft(task.title)
    setBodyDraft(task.body || '')
  }, [task])

  useEffect(() => {
    if (!detailPickerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailPickerOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailPickerOpen])

  useEffect(() => {
    if (!detailPickerOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (detailPickerOpen === 'status' && statusPickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'assignee' && assigneePickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'room' && roomPickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'priority' && priorityPickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'provider' && providerPickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'labels' && labelPickerRef.current?.contains(n)) return
      setDetailPickerOpen(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [detailPickerOpen])

  useEffect(() => {
    if (detailPickerOpen !== 'labels') return
    const t = window.setTimeout(() => labelSearchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [detailPickerOpen])

  const commitLabelIds = (nextIds: string[]) => {
    const prev = task.label_ids ?? []
    if (prev.length === nextIds.length && prev.every((id) => nextIds.includes(id))) return
    const updated = { ...task, label_ids: nextIds, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    setTaskLabels(task.id, nextIds).catch(() => onTaskChange?.(task))
  }

  const toggleTaskLabel = (labelId: string) => {
    const set = new Set(taskLabelIds)
    if (set.has(labelId)) set.delete(labelId)
    else set.add(labelId)
    commitLabelIds([...set])
  }

  const createLabelFromSearch = async () => {
    const name = labelCreateNameTrimmed
    if (!name || !canCreateLabel) return
    try {
      const newLabel = await createLabel(task.project_id, name)
      onLabelCreated?.(newLabel)
      commitLabelIds([...taskLabelIds, newLabel.id])
      setLabelSearch('')
    } catch {
      alert('Could not create label')
    }
  }

  const commitTitle = async () => {
    setEditingTitle(false)
    const t = titleDraft.trim()
    if (!t || t === task.title) {
      setTitleDraft(task.title)
      return
    }
    const updated = { ...task, title: t, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { title: t }).catch(() => onTaskChange?.(task))
  }

  const commitBody = async () => {
    setEditingBody(false)
    const b = bodyDraft.trim() || null
    if (b === task.body) {
      setBodyDraft(task.body || '')
      return
    }
    const updated = { ...task, body: b, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { body: b }).catch(() => onTaskChange?.(task))
  }

  const commitStatus = (status: TaskStatus) => {
    setDetailPickerOpen(null)
    if (status === task.status) return
    const updated = { ...task, status, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { status }).catch(() => onTaskChange?.(task))
  }

  const commitAssignee = (assigneeId: string | null) => {
    setDetailPickerOpen(null)
    if (assigneeId === task.assignee_id) return
    const member = assigneeId ? sortedMembers.find((m) => m.id === assigneeId) ?? null : null
    const updated = { ...task, assignee_id: assigneeId, assignee: member, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { assignee_id: assigneeId }).catch(() => onTaskChange?.(task))
  }

  const commitRoom = (roomId: string | null) => {
    setDetailPickerOpen(null)
    if (roomId === task.room_id) return
    const r = roomId ? sortedRooms.find((x) => x.id === roomId) ?? null : null
    const updated = { ...task, room_id: roomId, room: r, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { room_id: roomId }).catch(() => onTaskChange?.(task))
  }

  const commitPriority = (urgency: TaskUrgency) => {
    setDetailPickerOpen(null)
    if (urgency === task.urgency) return
    const updated = { ...task, urgency, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { urgency }).catch(() => onTaskChange?.(task))
  }

  const commitProvider = (providerId: string | null) => {
    setDetailPickerOpen(null)
    if (providerId === task.provider_id) return
    const p = providerId ? sortedProviders.find((x) => x.id === providerId) ?? null : null
    const updated = { ...task, provider_id: providerId, provider: p, updated_at: new Date().toISOString() }
    onTaskChange?.(updated)
    updateTask(task.id, { provider_id: providerId }).catch(() => onTaskChange?.(task))
  }

  const isDone = task.status === 'done'
  const dueMeta = task.due_date ? formatTaskDue(task.due_date, { isDone }) : null
  const room =
    task.room ?? (task.room_id ? rooms.find((r) => r.id === task.room_id) ?? null : null)
  const provider = task.provider_id ? providers.find((p) => p.id === task.provider_id) : null

  let lastEditedLabel = task.updated_at
  try {
    lastEditedLabel = format(parseISO(task.updated_at), "MMM d, yyyy '·' HH:mm")
  } catch {
    /* keep raw */
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none z-[200] transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-y-0 right-0 z-[210] w-[100vw] md:w-[576px] lg:w-[720px] bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)] flex flex-col transition-transform animate-slide-in-right"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0" ref={statusPickerRef}>
              <button
                type="button"
                onClick={() => setDetailPickerOpen((o) => (o === 'status' ? null : 'status'))}
                className="group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                aria-haspopup="listbox"
                aria-expanded={detailPickerOpen === 'status'}
              >
                <span className="rounded px-2 py-1 text-[12px] font-bold uppercase text-[#42526e] bg-[#dfe1e6]">
                  {task.status.replace('_', ' ')}
                </span>
                <svg
                  className="h-4 w-4 shrink-0 text-[#5e6c84] opacity-70 transition-opacity group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {detailPickerOpen === 'status' && (
                <div
                  className="absolute left-0 top-full z-40 mt-1 w-[200px] overflow-hidden rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                  role="listbox"
                >
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="option"
                      aria-selected={task.status === s}
                      onClick={() => commitStatus(s)}
                      className={`mb-0.5 flex w-full items-center rounded-md px-3 py-2.5 text-left text-[14px] font-medium uppercase tracking-wide transition-colors last:mb-0 ${
                        task.status === s
                          ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="truncate font-mono text-[13px] font-semibold uppercase tracking-widest text-slate-500">
              {task.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md text-[14px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors ml-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-[65%] shrink-0 px-8 py-6 space-y-6">
            <div className="space-y-4">
              {editingTitle ? (
                <textarea
                  autoFocus
                  dir="rtl"
                  className="w-full text-right text-[24px] font-bold text-[#172b4d] leading-snug rounded px-2 py-1 outline-none resize-none bg-slate-100 shadow-inner"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(task.title) }
                  }}
                  rows={2}
                />
              ) : (
                <h1 
                  className="text-right text-[24px] font-bold text-[#172b4d] leading-snug break-words px-2 py-1 hover:bg-slate-50 cursor-text rounded transition-colors" 
                  dir="rtl"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double click to edit"
                >
                  {task.title}
                </h1>
              )}
              <div className="flex flex-wrap gap-2 px-2">
                 {room && (
                   <span className="text-[12px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">
                     {room.name}
                   </span>
                 )}
              </div>
            </div>

            <div>
              <h2 className="text-[14px] font-bold text-[#172b4d] mb-2 px-2">Description</h2>
              {editingBody ? (
                <div className="px-2">
                  <textarea
                    autoFocus
                    dir="rtl"
                    className="w-full text-right text-[14px] leading-relaxed text-[#172b4d] bg-slate-100 rounded-md outline-none p-3 resize-y min-h-[160px] shadow-inner"
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setEditingBody(false); setBodyDraft(task.body || '') }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitBody() }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 flex-row-reverse">
                    <span className="text-[11px] text-slate-400 font-medium px-1" dir="rtl">טיפ: לחץ Cmd/Ctrl + Enter לשמירה</span>
                    <div className="flex justify-start gap-2 flex-row-reverse">
                      <button onClick={commitBody} className="px-3 py-1.5 rounded-md bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold text-[13px] transition-colors shadow-sm">Save</button>
                      <button onClick={() => { setEditingBody(false); setBodyDraft(task.body || '') }} className="px-3 py-1.5 rounded-md hover:bg-slate-100 font-semibold text-slate-600 text-[13px] transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
               ) : task.body ? (
                 <div 
                   className="text-[14px] text-right leading-relaxed text-[#172b4d] whitespace-pre-wrap hover:bg-slate-50 p-2 rounded-md cursor-text transition-colors" 
                   dir="rtl"
                   onDoubleClick={() => setEditingBody(true)}
                   title="Double click to edit"
                 >
                   {task.body}
                 </div>
              ) : (
                <div 
                  className="text-[14px] text-right text-slate-500 hover:bg-slate-50 cursor-pointer p-3 mx-2 rounded-md border border-dashed border-slate-300 transition-colors flex items-center gap-2 font-medium"
                  dir="rtl"
                  onDoubleClick={() => setEditingBody(true)}
                  onClick={() => setEditingBody(true)}
                  title="Double click to edit"
                >
                  <svg className="w-4 h-4 opacity-70 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add a description...
                </div>
              )}
            </div>

          </div>

          <div className="w-full md:w-[35%] shrink-0 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6">
            <div className="space-y-5">
              <h3 className="text-[12px] font-extrabold text-[#5e6c84] uppercase tracking-wider">Details</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Assignee</span>
                  <div className="relative" ref={assigneePickerRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailPickerOpen((o) => (o === 'assignee' ? null : 'assignee'))
                      }
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left -mx-2 transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                    >
                      {task.assignee ? (
                        <>
                          <MemberAvatarChip
                            name={task.assignee.name}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold shadow-sm"
                          />
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172b4d]">
                            {task.assignee.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-4 w-4 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <span className="text-[14px] font-medium italic text-slate-500">
                            Unassigned
                          </span>
                        </>
                      )}
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {detailPickerOpen === 'assignee' && (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                        role="listbox"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!task.assignee_id}
                          onClick={() => commitAssignee(null)}
                          className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] font-medium transition-colors last:mb-0 ${
                            !task.assignee_id
                              ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          Unassigned
                        </button>
                        {sortedMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            role="option"
                            aria-selected={task.assignee_id === m.id}
                            onClick={() => commitAssignee(m.id)}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                              task.assignee_id === m.id
                                ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                : 'font-medium text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <MemberAvatarChip
                              name={m.name}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                            />
                            <span className="truncate">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Room</span>
                  <div className="relative" ref={roomPickerRef}>
                    <button
                      type="button"
                      onClick={() => setDetailPickerOpen((o) => (o === 'room' ? null : 'room'))}
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left -mx-2 transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                    >
                      {room ? (
                        <>
                          <div
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${ROOM_ICON_TILE[normalizeRoomIconKey(room.room_icon_key)]}`}
                          >
                            <RoomIconGlyph
                              roomKey={normalizeRoomIconKey(room.room_icon_key)}
                              className="h-3.5 w-3.5"
                            />
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172b4d]" dir="auto">
                            {room.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                          <span className="text-[14px] font-medium italic text-slate-500">
                            {sortedRooms.length ? 'No room' : 'Add rooms in Settings'}
                          </span>
                        </>
                      )}
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {detailPickerOpen === 'room' && (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                        role="listbox"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!task.room_id}
                          onClick={() => commitRoom(null)}
                          className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] font-medium transition-colors last:mb-0 ${
                            !task.room_id
                              ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          {sortedRooms.length ? 'No room' : 'Add rooms in Settings'}
                        </button>
                        {sortedRooms.map((rm) => {
                          const rk = normalizeRoomIconKey(rm.room_icon_key)
                          return (
                            <button
                              key={rm.id}
                              type="button"
                              role="option"
                              aria-selected={task.room_id === rm.id}
                              onClick={() => commitRoom(rm.id)}
                              className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                                task.room_id === rm.id
                                  ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                  : 'font-medium text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div
                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${ROOM_ICON_TILE[rk]}`}
                              >
                                <RoomIconGlyph roomKey={rk} className="h-3.5 w-3.5" />
                              </div>
                              <span className="truncate" dir="auto">
                                {rm.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Priority</span>
                  <div className="relative" ref={priorityPickerRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailPickerOpen((o) => (o === 'priority' ? null : 'priority'))
                      }
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left -mx-2 transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                    >
                      <span className="flex shrink-0 items-center">{PRIORITY_ICONS[task.urgency]}</span>
                      <span className="min-w-0 flex-1 text-[14px] font-medium capitalize text-[#172b4d]">
                        {formatUrgencyLabel(task.urgency)}
                      </span>
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {detailPickerOpen === 'priority' && (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                        role="listbox"
                      >
                        {URGENCY.map((u) => (
                          <button
                            key={u}
                            type="button"
                            role="option"
                            aria-selected={task.urgency === u}
                            onClick={() => commitPriority(u)}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                              task.urgency === u
                                ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                : 'font-medium text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {PRIORITY_ICONS[u]}
                            <span className="capitalize">{formatUrgencyLabel(u)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {dueMeta && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Due Date</span>
                    <span className={`text-[14px] font-bold ${
                      dueMeta.tone === 'overdue' ? 'text-rose-600' : 
                      dueMeta.tone === 'soon' ? 'text-amber-600' : 'text-[#172b4d]'
                    }`}>
                      {dueMeta.label}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Provider</span>
                  <div className="relative" ref={providerPickerRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailPickerOpen((o) => (o === 'provider' ? null : 'provider'))
                      }
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left -mx-2 transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                    >
                      {provider ? (
                        <>
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                            <span className="leading-none">{provider.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172b4d]">
                            {provider.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <span className="text-[14px] font-medium italic text-slate-500">
                            {sortedProviders.length ? 'No provider' : 'Add providers in Providers tab'}
                          </span>
                        </>
                      )}
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {detailPickerOpen === 'provider' && (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                        role="listbox"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!task.provider_id}
                          onClick={() => commitProvider(null)}
                          className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] font-medium transition-colors last:mb-0 ${
                            !task.provider_id
                              ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          {sortedProviders.length ? 'No provider' : 'Add providers in Providers tab'}
                        </button>
                        {sortedProviders.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            role="option"
                            aria-selected={task.provider_id === pr.id}
                            onClick={() => commitProvider(pr.id)}
                            className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                              task.provider_id === pr.id
                                ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                : 'font-medium text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                              <span className="leading-none">{pr.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="truncate">{pr.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Labels</span>
                  <div className="relative" ref={labelPickerRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setDetailPickerOpen((o) => {
                          if (o === 'labels') return null
                          setLabelSearch('')
                          return 'labels'
                        })
                      }
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left -mx-2 transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                    >
                      {taskLabelsResolved.length > 0 ? (
                        <>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {taskLabelsResolved.slice(0, 4).map((lb) => (
                              <span
                                key={lb.id}
                                className="h-5 w-5 shrink-0 rounded border border-white/40 shadow-sm"
                                style={{ backgroundColor: lb.color }}
                                title={lb.name}
                              />
                            ))}
                            {taskLabelsResolved.length > 4 && (
                              <span className="text-[11px] font-bold text-[#5e6c84]">+{taskLabelsResolved.length - 4}</span>
                            )}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172b4d]" dir="auto">
                            {taskLabelsResolved.map((l) => l.name).join(', ')}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                            <svg
                              className="h-3.5 w-3.5 text-[#a5adba]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          </div>
                          <span className="text-[14px] font-medium italic text-slate-500">No labels</span>
                        </>
                      )}
                      <svg
                        className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {detailPickerOpen === 'labels' && (
                      <div
                        className="absolute left-0 right-0 top-full z-30 mt-1 flex max-h-72 flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white/98 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                        role="listbox"
                        aria-multiselectable
                      >
                        <div className="border-b border-slate-100 p-2">
                          <input
                            ref={labelSearchInputRef}
                            type="search"
                            value={labelSearch}
                            onChange={(e) => setLabelSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && canCreateLabel) {
                                e.preventDefault()
                                void createLabelFromSearch()
                              }
                            }}
                            placeholder="Search labels…"
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] font-medium text-[#172b4d] outline-none placeholder:text-slate-400 focus:border-[#4c9aff] focus:bg-white focus:ring-1 focus:ring-[#4c9aff]"
                            dir="auto"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1.5">
                          {filteredLabels.length === 0 && !canCreateLabel ? (
                            <p className="px-3 py-4 text-center text-[13px] text-slate-500">
                              {sortedLabels.length === 0
                                ? 'No labels yet. Type a name above to create one.'
                                : 'No matching labels'}
                            </p>
                          ) : (
                            filteredLabels.map((lb) => {
                              const selected = taskLabelIds.includes(lb.id)
                              return (
                                <button
                                  key={lb.id}
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => toggleTaskLabel(lb.id)}
                                  className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                                    selected
                                      ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                      : 'font-medium text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span
                                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                                      selected ? 'border-[#0052cc] bg-white' : 'border-slate-200 bg-white'
                                    }`}
                                  >
                                    {selected && (
                                      <svg className="h-3 w-3 text-[#0052cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </span>
                                  <span
                                    className="h-5 w-5 shrink-0 rounded-sm shadow-sm"
                                    style={{ backgroundColor: lb.color }}
                                  />
                                  <span className="min-w-0 flex-1 truncate" dir="auto">
                                    {lb.name}
                                  </span>
                                </button>
                              )
                            })
                          )}
                        </div>
                        {canCreateLabel && (
                          <div className="border-t border-slate-100 p-1.5">
                            <button
                              type="button"
                              onClick={() => void createLabelFromSearch()}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] font-semibold text-[#0052cc] transition-colors hover:bg-[#e9f2ff]"
                            >
                              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="min-w-0 truncate" dir="auto">
                                Create &quot;{labelCreateNameTrimmed}&quot;
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 space-y-4 border-t border-slate-200 pt-4">
                  {task.created_by && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[13px] font-semibold text-[#5e6c84]">Reporter</span>
                      <div className="flex items-center gap-2">
                        <MemberAvatarChip
                          name={task.created_by.name}
                          className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold shadow-sm"
                        />
                        <span className="text-[14px] font-medium text-[#172b4d]">{task.created_by.name}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Last edited</span>
                    <time
                      dateTime={task.updated_at}
                      className="text-[14px] font-medium text-[#172b4d] tabular-nums"
                    >
                      {lastEditedLabel}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
