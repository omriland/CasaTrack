'use client'

import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
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
    saving,
    load,
    selectedRoom,
    roomTasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
  } = useRoomsPageState()

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <Link href="/renovation" className="text-indigo-600 font-medium">
          Create a project first
        </Link>
      </p>
    )
  }

  const roomLightboxIndex = lightbox ? roomPhotos.findIndex((i) => i.id === lightbox.id) : -1

  return (
    <div className="space-y-5 pb-8 animate-fade-in-up">
      <header>
        <h1 className="text-[24px] font-bold text-slate-900">Rooms</h1>
        <p className="text-[14px] text-slate-500 mt-1">Tasks, needs, and photos per room.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/60" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center">
          <p className="text-[15px] text-slate-600">No rooms yet.</p>
          <Link href="/renovation/settings" className="mt-4 inline-block min-h-[48px] px-5 rounded-xl bg-indigo-600 text-white font-bold text-[15px] leading-[48px]">
            Add in Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room) => {
              const taskCount = tasks.filter((t) => t.room_id === room.id).length
              const needCount = needs.filter((n) => n.room_id === room.id).length
              const photoCount = gallery.filter((p) => p.room_id === room.id).length
              const active = selectedId === room.id
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedId(room.id)}
                  className={`text-left rounded-2xl border p-4 min-h-[100px] transition-all active:scale-[0.98] ${
                    active ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}
                >
                  <p className="font-bold text-[15px] text-slate-900 line-clamp-2" dir="auto">
                    {room.name}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-2 leading-snug">
                    {taskCount} tasks · {needCount} needs · {photoCount} photos
                  </p>
                </button>
              )
            })}
          </div>

          {selectedRoom && (
            <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-2">
                <button type="button" onClick={() => setSelectedId(null)} className="text-[13px] font-bold text-indigo-600 shrink-0 min-h-[44px] px-2 -ml-2">
                  ← Rooms
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Name</label>
                  <input
                    dir="auto"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={saveRoom}
                    className="mt-1 w-full min-h-[48px] text-[18px] font-bold text-slate-900 border border-slate-200 rounded-xl px-3 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveRoom}
                  disabled={saving}
                  className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white text-[15px] font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save room'}
                </button>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Notes</label>
                  <textarea
                    dir="auto"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onBlur={saveRoom}
                    rows={4}
                    className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 text-[15px] outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-600 mb-2">Tasks ({roomTasks.length})</h3>
                  {roomTasks.length === 0 ? (
                    <p className="text-[14px] text-slate-400">None linked.</p>
                  ) : (
                    <ul className="space-y-2">
                      {roomTasks.map((t) => (
                        <li key={t.id}>
                          <Link href="/renovation/tasks" className="block min-h-[44px] px-3 rounded-xl bg-slate-50 border border-slate-100 font-medium text-slate-800 flex items-center" dir="auto">
                            {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-600 mb-2">Needs ({roomNeeds.length})</h3>
                  {roomNeeds.length === 0 ? (
                    <p className="text-[14px] text-slate-400">None linked.</p>
                  ) : (
                    <ul className="space-y-2">
                      {roomNeeds.map((n) => (
                        <li key={n.id}>
                          <Link
                            href="/renovation/needs"
                            className="flex min-h-[44px] items-center justify-between gap-2 px-3 rounded-xl bg-slate-50 border border-slate-100 font-medium text-slate-800"
                            dir="auto"
                          >
                            <span className={n.completed ? 'line-through text-slate-400' : ''}>{n.title}</span>
                            {n.completed && (
                              <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-600">Done</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-600 mb-2">Photos ({roomPhotos.length})</h3>
                  {roomPhotos.length === 0 ? (
                    <p className="text-[14px] text-slate-400">None in this room.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {roomPhotos.map((item) => (
                        <button key={item.id} type="button" onClick={() => setLightbox(item)} className="aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200/80">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.public_url} alt="" className="w-full h-full object-cover" />
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
