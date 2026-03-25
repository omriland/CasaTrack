'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { RoomIconGlyph, ROOM_ICON_TILE, normalizeRoomIconKey } from '@/components/renovation/room-icons'
import { RoomIconPickerGrid } from '@/components/renovation/RoomIconPicker'
import { useRoomsPageState } from './useRoomsPageState'

export function RoomsMobile() {
  const {
    project,
    rooms,
    tasks,
    needs,
    gallery,
    tags,
    loading,
    selectedId,
    setSelectedId,
    lightbox,
    setLightbox,
    editName,
    setEditName,
    editNotes,
    setEditNotes,
    editIconKey,
    setEditIconKey,
    saving,
    load,
    selectedRoom,
    roomTasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
  } = useRoomsPageState()

  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center py-24">
        <div className="mb-4 rounded-full bg-indigo-100 p-4 text-indigo-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-[17px] font-medium text-slate-600">No project found</p>
        <Link href="/renovation" className="mt-4 rounded-full bg-indigo-600 px-6 py-3 font-bold text-white shadow-sm active:scale-95">
          Create a project first
        </Link>
      </div>
    )
  }

  const roomLightboxIndex = lightbox ? roomPhotos.findIndex((i) => i.id === lightbox.id) : -1

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up">
      <header className="px-1">
        <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900">Spaces</h1>
        <p className="text-[15px] font-medium text-slate-500 mt-1 leading-snug">Tasks, needs, and photos per room.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 animate-pulse px-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-200/80 bg-white p-10 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 ring-8 ring-indigo-50/50">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-[16px] font-bold text-slate-800">No rooms yet</p>
          <Link href="/renovation/settings" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-[15px] font-bold text-white shadow-sm active:scale-95">
            Add in Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-1">
            {rooms.map((room) => {
              const taskCount = tasks.filter((t) => t.room_id === room.id).length
              const needCount = needs.filter((n) => n.room_id === room.id).length
              const photoCount = gallery.filter((p) => p.room_id === room.id).length
              const active = selectedId === room.id
              const ri = normalizeRoomIconKey(room.room_icon_key)
              
              return (
                <div
                  key={room.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(room.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedId(room.id)
                    }
                  }}
                  className={`group relative flex min-h-[120px] cursor-pointer flex-col justify-between overflow-hidden rounded-[1.5rem] border p-4 text-left outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.97] ${
                    active 
                      ? 'bg-white border-transparent shadow-[0_4px_20px_-4px_rgba(79,70,229,0.2)] ring-2 ring-indigo-500/20' 
                      : 'bg-white border-slate-200/60 shadow-sm'
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50" />
                  )}
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <button
                      type="button"
                      title="Change room icon"
                      aria-label="Change room icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedId(room.id)
                        setIconPickerOpen(true)
                      }}
                      className={`flex h-[3.25rem] w-[3.25rem] cursor-pointer items-center justify-center rounded-2xl transition-[transform,box-shadow] hover:scale-105 hover:ring-2 hover:ring-indigo-400/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${ROOM_ICON_TILE[ri]} shadow-sm`}
                    >
                      <RoomIconGlyph roomKey={ri} className="h-7 w-7 drop-shadow-sm" />
                    </button>
                    {active && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative z-10 mt-3 pt-1">
                    <p className={`line-clamp-2 text-[15px] font-bold leading-tight ${active ? 'text-indigo-950' : 'text-slate-800'}`} dir="auto">
                      {room.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 overflow-hidden text-[10px] font-bold text-slate-500">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5">{taskCount} tasks</span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5">{needCount} needs</span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5">{photoCount} photos</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedRoom && (
            <div className="mt-8 rounded-[2rem] border border-slate-200/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl pb-6">
              <div className="sticky top-0 z-10 border-b border-slate-100/50 bg-white/90 p-4 backdrop-blur-xl rounded-t-[2rem]">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setSelectedId(null)} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-slate-100 pl-3 pr-4 text-[13px] font-bold text-slate-700 active:scale-95">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveRoom}
                    disabled={saving}
                    className="flex h-10 items-center justify-center rounded-full bg-indigo-600 px-5 text-[13px] font-bold text-white shadow-sm active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-70"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-5">
                {/* Header Edit Area */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIconPickerOpen(true)}
                    className={`flex h-[4.5rem] w-[4.5rem] shrink-0 cursor-pointer items-center justify-center rounded-[1.25rem] shadow-sm transition-transform active:scale-95 ${ROOM_ICON_TILE[editIconKey]}`}
                  >
                    <RoomIconGlyph roomKey={editIconKey} className="h-10 w-10 drop-shadow-sm" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Space Name</label>
                    <input
                      dir="auto"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveRoom}
                      className="mt-0.5 w-full border-b-2 border-transparent bg-transparent py-1 text-[24px] font-extrabold tracking-tight text-slate-900 outline-none transition-colors focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Notes Block */}
                <div className="rounded-[1.25rem] border border-slate-200/50 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <label className="text-[12px] font-black uppercase tracking-widest text-slate-500">Notes</label>
                  </div>
                  <textarea
                    dir="auto"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onBlur={saveRoom}
                    placeholder="Plans, specs, ideas..."
                    rows={4}
                    className="w-full resize-y rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-[15px] outline-none transition-colors focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Tasks Block */}
                <div className="rounded-[1.25rem] border border-slate-200/50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500">
                      <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Tasks
                    </h3>
                    <span className="flex h-6 items-center rounded-full bg-sky-50 px-2.5 text-[11px] font-bold text-sky-600 ring-1 ring-sky-100/50">
                      {roomTasks.length}
                    </span>
                  </div>
                  {roomTasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-[14px] font-medium text-slate-400">None linked.</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {roomTasks.map((t) => (
                        <li key={t.id}>
                          <Link href="/renovation/tasks" className="flex min-h-[48px] items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-[14px] font-medium text-slate-700 active:scale-95" dir="auto">
                            <span className="truncate">{t.title}</span>
                            {t.status !== 'done' && (
                              <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-400 shadow-sm ring-1 ring-slate-200/50">
                                {t.status.replace('_', ' ')}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Needs Block */}
                <div className="rounded-[1.25rem] border border-slate-200/50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500">
                      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Shopping Needs
                    </h3>
                    <span className="flex h-6 items-center rounded-full bg-emerald-50 px-2.5 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-100/50">
                      {roomNeeds.length}
                    </span>
                  </div>
                  {roomNeeds.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                      <p className="text-[14px] font-medium text-slate-400">None linked.</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {roomNeeds.map((n) => (
                        <li key={n.id}>
                          <Link
                            href="/renovation/needs"
                            className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-4 font-medium active:scale-95 transition-colors ${n.completed ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-100 text-slate-700'}`}
                            dir="auto"
                          >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${n.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-slate-50'}`}>
                              {n.completed && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className={`truncate ${n.completed ? 'line-through decoration-slate-300' : ''}`}>{n.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Photos Block */}
                <div className="rounded-[1.25rem] border border-slate-200/50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-500">
                      <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Gallery
                    </h3>
                    {roomPhotos.length > 0 && (
                      <span className="flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600">
                        {roomPhotos.length}
                      </span>
                    )}
                  </div>
                  {roomPhotos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-[14px] font-medium text-slate-400">No photos in this room.</p>
                    </div>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
                      {roomPhotos.map((item) => (
                        <button key={item.id} type="button" onClick={() => setLightbox(item)} className="relative h-[120px] w-[120px] shrink-0 snap-center rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/80 active:scale-95 transition-transform">
                          <div className="absolute inset-0 bg-slate-900/0 active:bg-slate-900/10 z-10 transition-colors" />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.public_url} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <MobileBottomSheet
        open={iconPickerOpen && !!selectedRoom}
        onClose={() => setIconPickerOpen(false)}
        title="Room icon"
      >
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
        <RoomIconPickerGrid
          dense
          value={editIconKey}
          onChange={setEditIconKey}
          onPick={() => setIconPickerOpen(false)}
        />
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
