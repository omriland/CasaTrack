'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { RoomIconGlyph, ROOM_ICON_TILE, normalizeRoomIconKey } from '@/components/renovation/room-icons'
import { RoomIconPickerGrid } from '@/components/renovation/RoomIconPicker'
import { cn } from '@/utils/common'
import { RoomInlineTaskAdd } from '@/components/renovation/RoomInlineTaskAdd'
import { RoomNotesMarkdownEditor } from '@/components/renovation/RoomNotesMarkdownEditor'
import { notesContentEqual } from '@/lib/room-notes-html'
import { useRoomsPageState } from './useRoomsPageState'

/** Clears sticky header + chip row when scrolling to a section */
const SECTION_SCROLL_MARGIN = 'scroll-mt-[9.5rem]'

function AccordionChevron({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('h-[18px] w-[18px] shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180')}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function RoomsMobile() {
  const {
    project,
    rooms,
    tags,
    loading,
    selectedId,
    selectRoom,
    lightbox,
    setLightbox,
    editName,
    setEditName,
    editNotes,
    setEditNotes,
    editIconKey,
    setEditIconKey,
    saving,
    saveAck,
    load,
    selectedRoom,
    roomTasks,
    roomSubtasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
    saveTaskTitle,
    addTaskToRoom,
    saveNeedTitle,
    toggleNeedCompleted,
  } = useRoomsPageState()

  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const [roomPickerOpen, setRoomPickerOpen] = useState(false)
  const roomPickerRef = useRef<HTMLDivElement>(null)

  const [openNotes, setOpenNotes] = useState(false)
  const [openTasks, setOpenTasks] = useState(true)
  const [openSubtasks, setOpenSubtasks] = useState(true)
  const [openNeeds, setOpenNeeds] = useState(true)
  const [openGallery, setOpenGallery] = useState(false)

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [draftTaskTitle, setDraftTaskTitle] = useState('')
  const [editingNeedId, setEditingNeedId] = useState<string | null>(null)
  const [draftNeedTitle, setDraftNeedTitle] = useState('')

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [rooms],
  )

  const roomDirty = useMemo(() => {
    if (!selectedRoom) return false
    return (
      editName.trim() !== selectedRoom.name ||
      !notesContentEqual(editNotes, selectedRoom.notes) ||
      editIconKey !== normalizeRoomIconKey(selectedRoom.room_icon_key)
    )
  }, [selectedRoom, editName, editNotes, editIconKey])

  useEffect(() => {
    if (loading || rooms.length === 0) return
    if (!selectedId || !rooms.some((r) => r.id === selectedId)) {
      selectRoom(rooms[0].id)
    }
  }, [loading, rooms, selectedId, selectRoom])

  useEffect(() => {
    if (!roomPickerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRoomPickerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roomPickerOpen])

  useEffect(() => {
    if (!roomPickerOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (roomPickerRef.current?.contains(n)) return
      setRoomPickerOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [roomPickerOpen])

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const commitTaskEdit = useCallback(() => {
    if (!editingTaskId) return
    void saveTaskTitle(editingTaskId, draftTaskTitle)
    setEditingTaskId(null)
  }, [editingTaskId, draftTaskTitle, saveTaskTitle])

  const commitNeedEdit = useCallback(() => {
    if (!editingNeedId) return
    void saveNeedTitle(editingNeedId, draftNeedTitle)
    setEditingNeedId(null)
  }, [editingNeedId, draftNeedTitle, saveNeedTitle])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center py-20">
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-[16px] font-medium text-slate-500">No project found</p>
        <Link
          href="/renovation"
          className="mt-5 flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-[14px] font-semibold text-white active:opacity-90"
        >
          Create a project first
        </Link>
      </div>
    )
  }

  const roomLightboxIndex = lightbox ? roomPhotos.findIndex((i) => i.id === lightbox.id) : -1

  const taskCount = selectedRoom ? roomTasks.length : 0
  const subtaskCount = selectedRoom ? roomSubtasks.length : 0
  const needCount = selectedRoom ? roomNeeds.length : 0
  const photoCount = selectedRoom ? roomPhotos.length : 0

  return (
    <div className="animate-fade-in-up pb-1">
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 rounded-2xl bg-white/80 ring-1 ring-slate-200/80" />
          <div className="h-52 rounded-2xl bg-white/80 ring-1 ring-slate-200/80" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-[16px] font-semibold text-slate-900">No rooms yet</p>
          <Link
            href="/renovation/settings"
            className="mt-5 flex h-11 w-full max-w-xs items-center justify-center rounded-xl bg-indigo-600 px-5 text-[14px] font-semibold text-white active:opacity-90"
          >
            Add in Settings
          </Link>
        </div>
      ) : (
        <>
          {selectedRoom && roomDirty && (
            <button
              type="button"
              onClick={() => void saveRoom()}
              disabled={saving}
              className="fixed z-[45] flex h-12 min-w-[5.5rem] items-center justify-center rounded-full bg-indigo-600 px-5 text-[14px] font-semibold text-white active:opacity-90 disabled:opacity-50 right-4 bottom-[calc(5.35rem+env(safe-area-inset-bottom))]"
              aria-label={saving ? 'Saving' : 'Save space'}
            >
              {saving ? '…' : 'Save'}
            </button>
          )}

          <div className="sticky top-0 z-20 -mx-3 mb-4 space-y-3 border-b border-transparent bg-[#f0f2f6]/90 px-3 pb-3 pt-0 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Spaces</h1>
              {saveAck && !saving && (
                <span
                  className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 animate-fade-in"
                  role="status"
                  aria-live="polite"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
            </div>

            <div
              className="relative flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5"
              ref={roomPickerRef}
            >
              <button
                type="button"
                onClick={() => selectedRoom && setIconPickerOpen(true)}
                disabled={!selectedRoom}
                className={cn(
                  'grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-transform active:scale-[0.97] disabled:opacity-45',
                  selectedRoom ? ROOM_ICON_TILE[editIconKey] : 'border border-dashed border-slate-200 bg-[#fafbfc]',
                )}
                aria-label="Change room icon"
              >
                {selectedRoom ? (
                  <RoomIconGlyph roomKey={editIconKey} className="h-6 w-6" />
                ) : (
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </button>

              <input
                dir="auto"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => void saveRoom()}
                placeholder={sortedRooms.length ? 'Room name' : 'Add rooms in Settings'}
                disabled={!selectedRoom}
                className="min-w-0 flex-1 bg-transparent text-[18px] font-semibold leading-snug text-slate-900 outline-none placeholder:text-slate-400 text-start disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setRoomPickerOpen((o) => !o)}
                disabled={!sortedRooms.length}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors active:bg-slate-100 disabled:opacity-35"
                aria-haspopup="listbox"
                aria-expanded={roomPickerOpen}
                aria-label="Switch room"
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {roomPickerOpen && sortedRooms.length > 0 && (
                <div
                  className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-[min(50vh,280px)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 animate-fade-in"
                  role="listbox"
                >
                  {sortedRooms.map((rm) => {
                    const rk = normalizeRoomIconKey(rm.room_icon_key)
                    return (
                      <button
                        key={rm.id}
                        type="button"
                        role="option"
                        aria-selected={selectedId === rm.id}
                        onClick={() => {
                          selectRoom(rm.id)
                          setRoomPickerOpen(false)
                        }}
                        className={cn(
                          'mb-0.5 flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition-colors last:mb-0',
                          selectedId === rm.id
                            ? 'bg-indigo-50 font-semibold text-indigo-800'
                            : 'font-medium text-slate-900 active:bg-slate-50',
                        )}
                      >
                        <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', ROOM_ICON_TILE[rk])}>
                          <RoomIconGlyph roomKey={rk} className="h-4 w-4" />
                        </div>
                        <span className="truncate text-start" dir="auto">
                          {rm.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedRoom && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    { id: 'spaces-section-tasks', label: 'Tasks', count: taskCount },
                    { id: 'spaces-section-subtasks', label: 'Subtasks', count: subtaskCount },
                    { id: 'spaces-section-needs', label: 'Needs', count: needCount },
                    { id: 'spaces-section-gallery', label: 'Gallery', count: photoCount },
                  ] as const
                ).map(({ id, label, count }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollToSection(id)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-2 pl-3.5 pr-3 text-[14px] font-semibold text-slate-900 active:bg-slate-50"
                  >
                    {label}
                    <span className="grid min-h-[22px] min-w-[22px] place-items-center rounded-md bg-slate-50 px-1.5 text-[12px] font-bold tabular-nums text-slate-500">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedRoom && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" dir="auto">
              {/* Notes */}
              <section id="spaces-section-notes" className={SECTION_SCROLL_MARGIN}>
                <button
                  type="button"
                  onClick={() => setOpenNotes((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start active:bg-[#fafbfc]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-slate-900">Notes</span>
                      <span className="block text-[12px] font-medium text-slate-500">Plans and measurements</span>
                    </span>
                  </span>
                  <AccordionChevron open={openNotes} />
                </button>
                {openNotes && (
                  <div className="border-t border-slate-200 px-4 pb-4 pt-1">
                    <RoomNotesMarkdownEditor
                      instanceKey={selectedId ?? ''}
                      value={editNotes}
                      onChange={setEditNotes}
                      onBlur={() => void saveRoom()}
                      placeholder="Add notes for this space…"
                      className="w-full"
                    />
                  </div>
                )}
              </section>

              <div className="h-px bg-slate-200" aria-hidden />

              {/* Tasks */}
              <section id="spaces-section-tasks" className={SECTION_SCROLL_MARGIN}>
                <button
                  type="button"
                  onClick={() => setOpenTasks((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start active:bg-[#fafbfc]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e9f2ff] text-indigo-600">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-slate-900">Tasks</span>
                      <span className="block text-[12px] font-medium text-slate-500">Linked to this room</span>
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tabular-nums text-slate-500">{roomTasks.length}</span>
                    <AccordionChevron open={openTasks} />
                  </div>
                </button>
                {openTasks && (
                  <div className="border-t border-slate-200 bg-[#fafbfc]/80 px-2 pb-3 pt-2 space-y-2">
                    {roomTasks.length === 0 ? (
                      <div className="space-y-3 py-2">
                        <p className="text-center text-[14px] font-medium text-slate-400">No tasks linked yet.</p>
                        <RoomInlineTaskAdd roomId={selectedId} onAdd={addTaskToRoom} variant="mobile" />
                      </div>
                    ) : (
                      <>
                        <ul className="flex flex-col gap-2 max-h-[min(40vh,280px)] overflow-y-auto">
                          {roomTasks.map((t) => (
                            <li key={t.id}>
                              {editingTaskId === t.id ? (
                                <input
                                  autoFocus
                                  dir="auto"
                                  value={draftTaskTitle}
                                  onChange={(e) => setDraftTaskTitle(e.target.value)}
                                  onBlur={() => commitTaskEdit()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      commitTaskEdit()
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingTaskId(null)
                                      setDraftTaskTitle('')
                                    }
                                  }}
                                  className="min-h-[48px] w-full rounded-[6px] border border-slate-200 bg-white px-3 text-[15px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-start"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTaskId(t.id)
                                    setDraftTaskTitle(t.title)
                                  }}
                                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-[6px] border border-slate-200 bg-white px-3 py-2.5 text-start active:bg-slate-50"
                                  dir="auto"
                                >
                                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-snug text-slate-900">
                                    {t.title}
                                  </span>
                                  {t.status !== 'done' && (
                                    <span className="shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-slate-500">
                                      {t.status.replace('_', ' ')}
                                    </span>
                                  )}
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                        <RoomInlineTaskAdd roomId={selectedId} onAdd={addTaskToRoom} variant="mobile" />
                      </>
                    )}
                  </div>
                )}
              </section>

              <div className="h-px bg-slate-200" aria-hidden />

              {/* Subtasks */}
              <section id="spaces-section-subtasks" className={SECTION_SCROLL_MARGIN}>
                <button
                  type="button"
                  onClick={() => setOpenSubtasks((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start active:bg-[#fafbfc]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-slate-900">Subtasks</span>
                      <span className="block text-[12px] font-medium text-slate-500">Sub-items linked to this room</span>
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tabular-nums text-slate-500">{roomSubtasks.length}</span>
                    <AccordionChevron open={openSubtasks} />
                  </div>
                </button>
                {openSubtasks && (
                  <div className="border-t border-slate-200 bg-[#fafbfc]/80 px-2 pb-3 pt-2">
                    {roomSubtasks.length === 0 ? (
                      <p className="py-6 text-center text-[14px] font-medium text-slate-400">No subtasks linked yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2 max-h-[min(40vh,280px)] overflow-y-auto">
                        {roomSubtasks.map((st) => (
                          <li
                            key={st.id}
                            className="flex min-h-[48px] items-center gap-3 rounded-[6px] border border-slate-200 bg-white px-3 py-2.5"
                            dir="auto"
                          >
                            <div className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                              st.is_done
                                ? 'border-[#0052cc] bg-[#0052cc]'
                                : 'border-slate-300 bg-white',
                            )}>
                              {st.is_done && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={cn(
                              'min-w-0 flex-1 truncate text-[15px] font-medium leading-snug',
                              st.is_done ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900',
                            )}>{st.title}</span>
                            {st.task_title && (
                              <span className="shrink-0 rounded-md bg-slate-50 px-2 py-0.5 text-[12px] font-bold text-slate-400 truncate max-w-[100px]">{st.task_title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              <div className="h-px bg-slate-200" aria-hidden />

              {/* Needs */}
              <section id="spaces-section-needs" className={SECTION_SCROLL_MARGIN}>
                <button
                  type="button"
                  onClick={() => setOpenNeeds((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start active:bg-[#fafbfc]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold text-slate-900">Needs</span>
                      <span className="block text-[12px] font-medium text-slate-500">Shopping and requirements</span>
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tabular-nums text-slate-500">{roomNeeds.length}</span>
                    <AccordionChevron open={openNeeds} />
                  </div>
                </button>
                {openNeeds && (
                  <div className="border-t border-slate-200 bg-[#fafbfc]/80 px-2 pb-3 pt-2">
                    {roomNeeds.length === 0 ? (
                      <p className="py-6 text-center text-[14px] font-medium text-slate-400">No needs linked yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {roomNeeds.map((n) => (
                          <li
                            key={n.id}
                            className="flex min-h-[48px] items-stretch gap-3 rounded-[6px] border border-slate-200 bg-white px-2 py-1.5"
                          >
                            <button
                              type="button"
                              aria-pressed={n.completed}
                              aria-label={n.completed ? 'Mark need incomplete' : 'Mark need complete'}
                              onClick={() => void toggleNeedCompleted(n.id, !n.completed)}
                              className={cn(
                                'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl border-2 transition-colors',
                                n.completed
                                  ? 'border-emerald-500 bg-emerald-500 text-white'
                                  : 'border-slate-300 bg-white',
                              )}
                            >
                              {n.completed && (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            {editingNeedId === n.id ? (
                              <input
                                autoFocus
                                dir="auto"
                                value={draftNeedTitle}
                                onChange={(e) => setDraftNeedTitle(e.target.value)}
                                onBlur={() => commitNeedEdit()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    commitNeedEdit()
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingNeedId(null)
                                    setDraftNeedTitle('')
                                  }
                                }}
                                className="min-h-[40px] min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[15px] font-medium text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-start"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNeedId(n.id)
                                  setDraftNeedTitle(n.title)
                                }}
                                className={cn(
                                  'min-w-0 flex-1 py-2 text-start text-[15px] font-medium leading-snug transition-colors',
                                  n.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900',
                                )}
                                dir="auto"
                              >
                                <span className="block truncate">{n.title}</span>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              <div className="h-px bg-slate-200" aria-hidden />

              {/* Gallery */}
              <section id="spaces-section-gallery" className={SECTION_SCROLL_MARGIN}>
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenGallery((o) => !o)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start active:bg-[#fafbfc]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">
                        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-slate-900">Gallery</span>
                        <span className="block text-[12px] font-medium text-slate-500">Photos tagged with this room</span>
                      </span>
                    </span>
                    <AccordionChevron open={openGallery} />
                  </button>
                  {roomPhotos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto border-t border-slate-200 px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {roomPhotos.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setLightbox(item)}
                          className="relative aspect-[3/4] h-[4.25rem] w-auto shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 active:opacity-90"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.public_url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {openGallery && (
                  <div className="border-t border-slate-200 bg-[#fafbfc]/80 px-2 pb-4 pt-3">
                    {roomPhotos.length === 0 ? (
                      <p className="py-6 text-center text-[14px] font-medium text-slate-400">No photos in this room.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {roomPhotos.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLightbox(item)}
                            className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 active:opacity-90"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.public_url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}

      <MobileBottomSheet open={iconPickerOpen && !!selectedRoom} onClose={() => setIconPickerOpen(false)} title="Room icon">
        <p className="mb-3 px-1 text-right text-[13px] font-medium text-slate-500" dir="rtl">
          אייקונים מספריית{' '}
          <a
            href="https://lucide.dev"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-indigo-600 underline decoration-indigo-200"
          >
            Lucide
          </a>
          . בחרו — ואז שמרו את החדר.
        </p>
        <RoomIconPickerGrid dense value={editIconKey} onChange={setEditIconKey} onPick={() => setIconPickerOpen(false)} />
      </MobileBottomSheet>

      {lightbox && roomPhotos.length > 0 && roomLightboxIndex >= 0 && (
        <Lightbox
          key={lightbox.id}
          images={roomPhotos}
          initialIndex={roomLightboxIndex}
          rooms={rooms}
          tags={tags}
          onClose={() => setLightbox(null)}
          onChanged={() => load()}
        />
      )}
    </div>
  )
}
