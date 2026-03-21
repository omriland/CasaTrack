'use client'

import Link from 'next/link'
import { Lightbox } from '@/components/renovation/Lightbox'
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
    <div className="space-y-6 pb-8 animate-fade-in-up">
      <header className="flex flex-row items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900 font-sans">Rooms</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">See tasks, shopping needs, and photos for each space.</p>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-md border border-slate-200/60" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-md border border-slate-200/60 p-10 text-center">
          <p className="text-[15px] text-slate-500">No rooms yet.</p>
          <Link href="/renovation/settings" className="mt-3 inline-block text-indigo-600 font-semibold text-[15px]">
            Add rooms in Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
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
                  className={`text-left rounded-2xl border p-5 transition-all shadow-sm active:scale-[0.98] ${
                    active
                      ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-200 shadow-md shadow-amber-500/10'
                      : 'bg-white border-slate-200/60 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-md'
                  }`}
                >
                  <p className="font-bold text-[18px] text-slate-900 truncate" dir="auto">
                    {room.name}
                  </p>
                  <div className="flex flex-col gap-0.5 mt-2">
                    <p className={`text-[12px] font-medium ${active ? 'text-amber-700/70' : 'text-slate-500'}`}>
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </p>
                    <p className={`text-[12px] font-medium ${active ? 'text-amber-700/70' : 'text-slate-500'}`}>
                      {needCount} need{needCount !== 1 ? 's' : ''}
                    </p>
                    <p className={`text-[12px] font-medium ${active ? 'text-amber-700/70' : 'text-slate-500'}`}>
                      {photoCount} photo{photoCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedRoom && (
            <div className="bg-white rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-sm animate-fade-in-up">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 relative">
                <div className="flex flex-row items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <input
                      dir="auto"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveRoom}
                      placeholder="Room Name"
                      className="w-full text-[24px] font-bold text-slate-900 bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-amber-500 focus:outline-none px-0 py-1 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={saveRoom}
                    disabled={saving || editName.trim() === selectedRoom.name}
                    className="ml-auto w-auto h-9 px-4 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Room notes</label>
                  <textarea
                    dir="auto"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onBlur={saveRoom}
                    placeholder="Add a paragraph about this room (plans, specs, ideas…)"
                    rows={4}
                    className="w-full px-3 py-2.5 rounded border border-slate-200 bg-slate-50/50 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-2">Tasks in this room ({roomTasks.length})</h3>
                  {roomTasks.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-2">No tasks linked to this room.</p>
                  ) : (
                    <ul className="space-y-2">
                      {roomTasks.map((t) => (
                        <li key={t.id}>
                          <Link
                            href="/renovation/tasks"
                            className="block px-3 py-2 rounded bg-slate-50 border border-slate-100 hover:bg-indigo-50/50 hover:border-indigo-100 text-[15px] font-medium text-slate-800 capitalize"
                            dir="auto"
                          >
                            {t.title}
                            {t.status !== 'done' && <span className="ml-2 text-[12px] text-slate-400">— {t.status.replace('_', ' ')}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-2">Needs for this room ({roomNeeds.length})</h3>
                  {roomNeeds.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-2">No needs linked to this room.</p>
                  ) : (
                    <ul className="space-y-2">
                      {roomNeeds.map((n) => (
                        <li key={n.id}>
                          <Link
                            href="/renovation/needs"
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded bg-slate-50 border border-slate-100 hover:bg-emerald-50/50 hover:border-emerald-100 text-[15px] font-medium text-slate-800"
                            dir="auto"
                          >
                            <span className={n.completed ? 'line-through text-slate-400 decoration-slate-300' : ''}>{n.title}</span>
                            {n.completed && (
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Done
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wide mb-2">Photos in this room ({roomPhotos.length})</h3>
                  {roomPhotos.length === 0 ? (
                    <p className="text-[14px] text-slate-400 py-2">No photos in this room.</p>
                  ) : (
                    <div className="grid grid-cols-6 gap-2">
                      {roomPhotos.map((item) => (
                        <button key={item.id} type="button" onClick={() => setLightbox(item)} className="aspect-square rounded overflow-hidden bg-slate-100 border border-slate-200/60 active:scale-95 transition-all">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.public_url} alt="" className="w-full h-full object-cover pointer-events-none" />
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
