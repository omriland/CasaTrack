'use client'

import Link from 'next/link'
import type { RenovationNeed } from '@/types/renovation'
import { useNeedsPageState } from './useNeedsPageState'

export function NeedsDesktop() {
  const {
    project,
    items,
    rooms,
    loading,
    newTitle,
    setNewTitle,
    newRoomId,
    setNewRoomId,
    adding,
    addItem,
    saveTitle,
    saveRoom,
    remove,
  } = useNeedsPageState()

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <Link href="/renovation" className="text-indigo-600 font-medium">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Needs</h1>
        <p className="text-[15px] text-slate-500 mt-1">What you need from the apartment — add items and optionally link them to a room.</p>
      </header>

      <form onSubmit={addItem} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-row gap-2 items-stretch">
          <input
            dir="auto"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add an item…"
            className="flex-1 min-h-11 px-4 rounded-xl border border-slate-200 text-[16px] outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500"
          />
          {rooms.length > 0 && (
            <select
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              className="h-11 px-3 rounded-xl border border-slate-200 bg-white text-[15px] min-w-[10rem]"
              aria-label="Room"
            >
              <option value="">No room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id} dir="auto">
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="h-11 px-5 rounded-xl bg-indigo-600 text-white text-[15px] font-semibold disabled:opacity-50 shrink-0"
          >
            {adding ? '…' : 'Add'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">No items yet. Add one above.</div>
      ) : (
        <ul className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((need: RenovationNeed) => (
            <li key={need.id} className="p-4 flex flex-row items-center gap-3">
              <div className="flex-1 min-w-0">
                <input
                  dir="auto"
                  defaultValue={need.title}
                  key={`${need.id}-${need.title}`}
                  onBlur={(e) => saveTitle(need, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className="w-full text-[16px] font-medium text-slate-900 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-lg px-2 py-1.5 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {rooms.length > 0 && (
                  <select
                    value={need.room_id || ''}
                    onChange={(e) => saveRoom(need, e.target.value)}
                    className="h-10 px-2 rounded-lg border border-slate-200 text-[14px] bg-slate-50/50 max-w-[10rem]"
                    aria-label="Room"
                  >
                    <option value="">— Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id} dir="auto">
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
                <button type="button" onClick={() => remove(need.id)} className="h-10 px-3 text-[14px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
