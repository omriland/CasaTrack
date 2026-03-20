'use client'

import Link from 'next/link'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import type { RenovationNeed } from '@/types/renovation'
import { useNeedsPageState } from './useNeedsPageState'

export function NeedsMobile() {
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
    <div className="space-y-4 pb-32">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Needs</h1>
        <p className="text-[14px] text-slate-500 mt-1">Shopping list for the project — link items to rooms if you like.</p>
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 text-[15px]">Nothing here yet. Use the bar below to add.</div>
      ) : (
        <ul className="rounded-2xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((need: RenovationNeed) => (
            <li key={need.id} className="p-4 space-y-3">
              <input
                dir="auto"
                defaultValue={need.title}
                key={`${need.id}-${need.title}`}
                onBlur={(e) => saveTitle(need, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                className="w-full min-h-[48px] text-[16px] font-semibold text-slate-900 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
              <div className="flex flex-wrap items-center gap-2">
                {rooms.length > 0 && (
                  <select
                    value={need.room_id || ''}
                    onChange={(e) => saveRoom(need, e.target.value)}
                    className="min-h-[44px] flex-1 min-w-[140px] px-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50"
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
                <button type="button" onClick={() => remove(need.id)} className="min-h-[44px] px-4 rounded-xl text-[14px] font-bold text-rose-600 bg-rose-50">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MobileStickyFooter>
        <form onSubmit={addItem} className="rounded-2xl bg-white border border-slate-200 shadow-lg p-3 space-y-2">
          <input
            dir="auto"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New item…"
            className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 text-[16px] outline-none focus:ring-2 focus:ring-indigo-500/25"
          />
          {rooms.length > 0 && (
            <select
              value={newRoomId}
              onChange={(e) => setNewRoomId(e.target.value)}
              className="w-full min-h-[48px] px-3 rounded-xl border border-slate-200 bg-slate-50 text-[15px]"
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
            className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white text-[16px] font-bold disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add to list'}
          </button>
        </form>
      </MobileStickyFooter>
    </div>
  )
}
