'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
import { RoomIconGlyph, ROOM_ICON_TILE, normalizeRoomIconKey } from '@/components/renovation/room-icons'
import { RoomIconPickerDialog } from '@/components/renovation/RoomIconPicker'
import { useRoomsPageState } from './useRoomsPageState'

export function RoomsDesktop() {
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

  useEffect(() => {
    if (loading || rooms.length === 0 || selectedId) return
    setSelectedId(rooms[0]!.id)
  }, [loading, rooms, selectedId, setSelectedId])

  if (!project) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50">
        <div className="mb-4 rounded-full bg-indigo-100 p-4 text-indigo-500">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-lg font-medium text-slate-600">No project found</p>
        <Link href="/renovation" className="mt-4 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95">
          Create a project first
        </Link>
      </div>
    )
  }

  const roomLightboxIndex = lightbox ? roomPhotos.findIndex((i) => i.id === lightbox.id) : -1

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      <header className="flex flex-col gap-1.5 px-2">
        <h1 className="text-[36px] font-extrabold tracking-tight text-slate-900 font-sans">Spaces</h1>
        <p className="text-[16px] font-medium text-slate-500 max-w-2xl">
          Manage your rooms. Select a space on the left to view and edit its notes, tasks, needs, and photos.
        </p>
      </header>

      {loading ? (
        <div className="flex min-h-[700px] gap-6 overflow-hidden rounded-[2rem] bg-white/50 p-2 animate-pulse">
          <div className="w-[320px] shrink-0 rounded-3xl bg-slate-100/50 p-4 space-y-4">
            <div className="h-6 w-24 rounded-md bg-slate-200" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/60" />
            ))}
          </div>
          <div className="flex-1 rounded-3xl bg-slate-50/80 p-8">
            <div className="mb-8 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-200" />
              <div className="h-10 w-64 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="col-span-2 h-40 rounded-3xl bg-slate-200/50" />
              <div className="h-64 rounded-3xl bg-slate-200/50" />
              <div className="h-64 rounded-3xl bg-slate-200/50" />
            </div>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[2rem] border border-slate-200/60 bg-white p-10 text-center shadow-sm">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-500 ring-8 ring-indigo-50/50">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">No rooms added yet</h3>
          <p className="mt-2 text-[15px] max-w-sm text-slate-500">Go to Settings to add the rooms and spaces involved in this renovation.</p>
          <Link href="/renovation/settings" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 font-semibold text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95">
            Add rooms in Settings
          </Link>
        </div>
      ) : (
        <div className="flex min-h-[min(780px,calc(100vh-10rem))] gap-6">
          
          {/* Sidebar (Left Rail) */}
          <aside
            className="flex w-[340px] shrink-0 flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
            aria-label="Rooms Sidebar"
          >
            <div className="shrink-0 border-b border-slate-100 bg-white/50 px-6 py-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold uppercase tracking-widest text-slate-500">Spaces</p>
                <div className="flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[12px] font-bold text-slate-600">
                  {rooms.length}
                </div>
              </div>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
              <ul className="flex flex-col gap-2.5">
                {rooms.map((room) => {
                  const taskCount = tasks.filter((t) => t.room_id === room.id).length
                  const needCount = needs.filter((n) => n.room_id === room.id).length
                  const photoCount = gallery.filter((p) => p.room_id === room.id).length
                  const active = selectedId === room.id
                  const ri = normalizeRoomIconKey(room.room_icon_key)
                  
                  return (
                    <li key={room.id} className="group relative">
                      {active && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 blur-md transition-opacity duration-500" />
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(room.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedId(room.id)
                          }
                        }}
                        className={`relative flex cursor-pointer items-start gap-3.5 rounded-2xl p-3.5 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                          active
                            ? 'bg-white shadow-[0_2px_12px_-4px_rgba(79,70,229,0.15)] ring-1 ring-indigo-100'
                            : 'border border-transparent hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100'
                        }`}
                      >
                        <button
                          type="button"
                          title="Change icon"
                          aria-label="Change room icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedId(room.id)
                            setIconPickerOpen(true)
                          }}
                          className={`flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-[1rem] transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${ROOM_ICON_TILE[ri]} ${active ? 'shadow-md' : 'shadow-sm group-hover:shadow-md'}`}
                        >
                          <RoomIconGlyph roomKey={ri} className="h-6 w-6" />
                        </button>
                        
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className={`truncate text-[15px] font-bold ${active ? 'text-indigo-950' : 'text-slate-700 group-hover:text-slate-900'} transition-colors`} dir="auto">
                            {room.name}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-medium leading-none">
                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${active && taskCount > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}>
                              <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {taskCount}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${active && needCount > 0 ? 'bg-purple-50 text-purple-700' : 'bg-slate-50 text-slate-500'}`}>
                              <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {needCount}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${active && photoCount > 0 ? 'bg-sky-50 text-sky-700' : 'bg-slate-50 text-slate-500'}`}>
                              <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {photoCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>

          {/* Main workspace (Right Area) - Bento Grid Style */}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            {selectedRoom ? (
              <div className="flex h-full flex-col animate-fade-in-up">
                
                {/* Fixed Premium Header */}
                <div className="sticky top-0 z-10 border-b border-slate-100/50 bg-white/80 px-8 py-5 backdrop-blur-xl">
                  <div className="flex flex-row items-center gap-5">
                    <button
                      type="button"
                      title="Change room icon"
                      aria-label="Change room icon"
                      onClick={() => setIconPickerOpen(true)}
                      className={`group relative flex h-[4.5rem] w-[4.5rem] shrink-0 cursor-pointer items-center justify-center rounded-[1.25rem] shadow-sm transition-all duration-300 hover:scale-[1.05] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 ${ROOM_ICON_TILE[editIconKey]}`}
                    >
                      <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-black/5" />
                      <RoomIconGlyph roomKey={editIconKey} className="h-10 w-10 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                    </button>
                    
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Scope</p>
                      <input
                        dir="auto"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveRoom}
                        placeholder="Space name"
                        className="w-full truncate border-b-2 border-transparent bg-transparent px-0 pb-1 text-[28px] font-extrabold tracking-tight text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-0"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={saveRoom}
                      disabled={
                        saving ||
                        (editName.trim() === selectedRoom.name &&
                          (editNotes || '') === (selectedRoom.notes || '') &&
                          normalizeRoomIconKey(selectedRoom.room_icon_key) === editIconKey)
                      }
                      className="group relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 px-7 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:bg-slate-800 hover:shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:hover:scale-100"
                    >
                      <span className="relative z-10">{saving ? 'Saving…' : 'Save Changes'}</span>
                      {!saving && (
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Area - Bento Layout */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                    
                    {/* Notes Card - Full Width */}
                    <div className="col-span-1 lg:col-span-2 rounded-[1.5rem] border border-slate-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <label className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-500">
                          <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Room Notes
                        </label>
                      </div>
                      <textarea
                        dir="auto"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        onBlur={saveRoom}
                        placeholder="Plans, specs, dimensions, ideas for this space…"
                        rows={4}
                        className="w-full resize-y rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4 text-[16px] leading-relaxed text-slate-800 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 custom-scrollbar"
                      />
                    </div>

                    {/* Tasks Card */}
                    <div className="col-span-1 flex flex-col rounded-[1.5rem] border border-slate-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-500">
                          <svg className="h-5 w-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Tasks
                        </h3>
                        <span className="flex h-6 items-center rounded-full bg-sky-50 px-2.5 text-[12px] font-bold text-sky-600 ring-1 ring-sky-100/50">
                          {roomTasks.length}
                        </span>
                      </div>
                      
                      {roomTasks.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 p-6 text-center">
                          <p className="text-[14px] font-medium text-slate-400">No tasks linked</p>
                          <Link href="/renovation/tasks" className="mt-2 text-[13px] font-semibold text-sky-500 hover:text-sky-600">Add tasks →</Link>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-2 custom-scrollbar overflow-y-auto max-h-[220px] pr-2">
                          {roomTasks.map((t) => (
                            <li key={t.id}>
                              <Link
                                href="/renovation/tasks"
                                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3.5 text-[15px] font-medium text-slate-700 transition-all hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-900"
                                dir="auto"
                              >
                                <span className="truncate">{t.title}</span>
                                {t.status !== 'done' && (
                                  <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/60 group-hover:bg-sky-100 group-hover:text-sky-700 group-hover:ring-sky-200/60">
                                    {t.status.replace('_', ' ')}
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Needs Card */}
                    <div className="col-span-1 flex flex-col rounded-[1.5rem] border border-slate-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-500">
                          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
                          Needs
                        </h3>
                        <span className="flex h-6 items-center rounded-full bg-emerald-50 px-2.5 text-[12px] font-bold text-emerald-600 ring-1 ring-emerald-100/50">
                          {roomNeeds.length}
                        </span>
                      </div>
                      
                      {roomNeeds.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 p-6 text-center">
                          <p className="text-[14px] font-medium text-slate-400">No items needed</p>
                          <Link href="/renovation/needs" className="mt-2 text-[13px] font-semibold text-emerald-500 hover:text-emerald-600">Add needs →</Link>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-2 custom-scrollbar overflow-y-auto max-h-[220px] pr-2">
                          {roomNeeds.map((n) => (
                            <li key={n.id}>
                              <Link
                                href="/renovation/needs"
                                className={`group flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3.5 text-[15px] font-medium transition-all hover:bg-emerald-50/50 hover:border-emerald-200 ${n.completed ? 'bg-slate-50/50 text-slate-400' : 'bg-white text-slate-700 hover:text-emerald-900'}`}
                                dir="auto"
                              >
                                <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${n.completed ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white group-hover:border-emerald-400'}`}>
                                  {n.completed && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={`truncate ${n.completed ? 'line-through decoration-slate-300' : ''}`}>
                                  {n.title}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Photos Card - Full Width */}
                    <div className="col-span-1 lg:col-span-2 rounded-[1.5rem] border border-slate-200/50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-slate-500">
                          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Gallery
                        </h3>
                        {roomPhotos.length > 0 && (
                          <span className="flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[12px] font-bold text-slate-600">
                            {roomPhotos.length} Photos
                          </span>
                        )}
                      </div>
                      
                      {roomPhotos.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                          <p className="text-[14px] font-medium text-slate-400">No photos added yet.</p>
                        </div>
                      ) : (
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                          {roomPhotos.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setLightbox(item)}
                              className="group relative h-40 w-40 shrink-0 snap-center overflow-hidden rounded-2xl border border-slate-200/60 bg-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                            >
                              <div className="absolute inset-0 bg-slate-900/0 transition-colors duration-300 group-hover:bg-slate-900/10 z-10" />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.public_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-50/30 p-8 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                  <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-700">No Space Selected</h2>
                  <p className="max-w-xs mt-2 text-sm text-slate-500 leading-relaxed">Choose a room from the sidebar to view detailed notes, linked tasks, and photos.</p>
                </div>
              </div>
            )}
          </main>
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
