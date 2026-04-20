'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
import { RoomIconGlyph, ROOM_ICON_TILE, normalizeRoomIconKey } from '@/components/renovation/room-icons'
import { RoomIconPickerDialog } from '@/components/renovation/RoomIconPicker'
import { RoomInlineTaskAdd } from '@/components/renovation/RoomInlineTaskAdd'
import { RoomNotesMarkdownEditor } from '@/components/renovation/RoomNotesMarkdownEditor'
import { notesContentEqual } from '@/lib/room-notes-html'
import { useRoomsPageState } from './useRoomsPageState'

export function RoomsDesktop() {
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
    addTaskToRoom,
  } = useRoomsPageState()

  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  useEffect(() => {
    if (loading || rooms.length === 0 || selectedId) return
    selectRoom(rooms[0]!.id)
  }, [loading, rooms, selectedId, selectRoom])

  if (!project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
        <div className="mb-4 rounded-lg bg-indigo-100 p-4 text-indigo-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-600">No project found</p>
        <Link href="/renovation" className="mt-4 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95">
          Create a project first
        </Link>
      </div>
    )
  }

  const roomLightboxIndex = lightbox ? roomPhotos.findIndex((i) => i.id === lightbox.id) : -1

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Spaces</h1>
          <p className="text-[15px] text-slate-500 mt-0.5">
            Select a room to view its notes, tasks, needs, and photos.
          </p>
        </div>
        {selectedRoom && (
          <div className="flex items-center gap-2.5 pb-1">
            {saveAck && !saving && (
              <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-600 animate-fade-in" role="status">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            <button
              type="button"
              onClick={saveRoom}
              disabled={
                saving ||
                (editName.trim() === selectedRoom.name &&
                  notesContentEqual(editNotes, selectedRoom.notes) &&
                  normalizeRoomIconKey(selectedRoom.room_icon_key) === editIconKey)
              }
              className="h-9 rounded-lg bg-slate-900 px-5 text-[13px] font-semibold text-white transition-all hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-28 rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="h-10 w-64 rounded-lg bg-slate-100" />
          <div className="h-48 rounded-lg bg-slate-100" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-52 rounded-lg bg-slate-100" />
            <div className="h-52 rounded-lg bg-slate-100" />
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg bg-white p-10 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">No rooms added yet</h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm">Go to Settings to add the rooms and spaces involved in this renovation.</p>
          <Link href="/renovation/settings" className="mt-5 h-10 inline-flex items-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition-all hover:bg-indigo-600 active:scale-95">
            Add rooms in Settings
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Horizontal room selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {rooms.map((room) => {
              const active = selectedId === room.id
              const ri = normalizeRoomIconKey(room.room_icon_key)
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => selectRoom(room.id)}
                  className={`group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                    active ? 'bg-white/15' : 'bg-slate-100 group-hover:bg-slate-200/70'
                  }`}>
                    <RoomIconGlyph roomKey={ri} className="h-4 w-4" />
                  </div>
                  <span className="truncate max-w-[120px]" dir="auto">{room.name}</span>
                </button>
              )
            })}
          </div>

          {selectedRoom ? (
            <div className="animate-fade-in space-y-8">
              {/* Room header: icon + name */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  title="Change icon"
                  onClick={() => setIconPickerOpen(true)}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-all hover:scale-105 ${ROOM_ICON_TILE[editIconKey]}`}
                >
                  <RoomIconGlyph roomKey={editIconKey} className="h-7 w-7" />
                </button>
                <input
                  dir="auto"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveRoom}
                  placeholder="Space name"
                  className="min-w-0 flex-1 border-none bg-transparent text-[24px] font-bold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none"
                />
              </div>

              {/* Notes — no card wrapper */}
              <div>
                <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-slate-400">Notes</p>
                <RoomNotesMarkdownEditor
                  instanceKey={selectedId ?? ''}
                  value={editNotes}
                  onChange={setEditNotes}
                  onBlur={saveRoom}
                  placeholder="Plans, specs, dimensions, ideas for this space…"
                  className="w-full"
                />
              </div>

              {/* Tasks & Needs side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tasks */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Tasks</p>
                    <span className="text-[12px] font-semibold text-slate-400 tabular-nums">{roomTasks.length}</span>
                  </div>
                  {roomTasks.length === 0 ? (
                    <div className="space-y-3 py-4 text-center">
                      <p className="text-[14px] text-slate-400">No tasks linked yet</p>
                      <RoomInlineTaskAdd roomId={selectedId} onAdd={addTaskToRoom} />
                      <Link href="/renovation/tasks" className="inline-block text-[13px] font-medium text-indigo-500 hover:text-indigo-600">
                        Open tasks board →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ul className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {roomTasks.map((t) => (
                          <li key={t.id}>
                            <Link
                              href="/renovation/tasks"
                              className="group flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
                              dir="auto"
                            >
                              <span className="truncate">{t.title}</span>
                              {t.status !== 'done' && (
                                <span className="shrink-0 text-[11px] font-medium text-slate-400 group-hover:text-indigo-500">
                                  {t.status.replace('_', ' ')}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <RoomInlineTaskAdd roomId={selectedId} onAdd={addTaskToRoom} />
                    </div>
                  )}
                </div>

                {/* Subtasks */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Subtasks</p>
                    <span className="text-[12px] font-semibold text-slate-400 tabular-nums">{roomSubtasks.length}</span>
                  </div>
                  {roomSubtasks.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-center">
                      <p className="text-[14px] text-slate-400">No subtasks linked to this room</p>
                    </div>
                  ) : (
                    <ul className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                      {roomSubtasks.map((st) => (
                        <li
                          key={st.id}
                          className="group flex items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-700"
                          dir="auto"
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            st.is_done ? 'border-[#0052cc] bg-[#0052cc]' : 'border-slate-300 bg-white'
                          }`}>
                            {st.is_done && (
                              <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                          <span className={`truncate flex-1 ${st.is_done ? 'line-through decoration-slate-300 text-slate-400' : ''}`}>{st.title}</span>
                          {st.task_title && (
                            <span className="shrink-0 text-[11px] font-medium text-slate-400 truncate max-w-[140px]">{st.task_title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Needs */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Needs</p>
                    <span className="text-[12px] font-semibold text-slate-400 tabular-nums">{roomNeeds.length}</span>
                  </div>
                  {roomNeeds.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-center">
                      <div>
                        <p className="text-[14px] text-slate-400">No items needed</p>
                        <Link href="/renovation/needs" className="mt-1 inline-block text-[13px] font-medium text-emerald-500 hover:text-emerald-600">Add needs →</Link>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-1 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                      {roomNeeds.map((n) => (
                        <li key={n.id}>
                          <Link
                            href="/renovation/needs"
                            className={`group flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[14px] transition-colors ${
                              n.completed
                                ? 'bg-slate-50/60 text-slate-400'
                                : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                            }`}
                            dir="auto"
                          >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              n.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'
                            }`}>
                              {n.completed && (
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              )}
                            </div>
                            <span className={`truncate ${n.completed ? 'line-through decoration-slate-300' : ''}`}>{n.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Photos */}
              {(roomPhotos.length > 0) && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Photos</p>
                    <span className="text-[12px] font-semibold text-slate-400 tabular-nums">{roomPhotos.length}</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {roomPhotos.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLightbox(item)}
                        className="group relative h-32 w-32 shrink-0 snap-center overflow-hidden rounded-lg bg-slate-100 transition-all duration-200 hover:opacity-90 active:scale-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.public_url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="h-10 w-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <h2 className="text-lg font-semibold text-slate-600">Select a space</h2>
              <p className="mt-1 text-sm text-slate-400 max-w-xs">Choose a room above to see its details.</p>
            </div>
          )}
        </div>
      )}

      <RoomIconPickerDialog
        open={iconPickerOpen && !!selectedRoom}
        onClose={() => setIconPickerOpen(false)}
        value={editIconKey}
        onChange={setEditIconKey}
      />

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
