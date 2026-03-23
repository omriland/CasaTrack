'use client'

import Link from 'next/link'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import type { RenovationNeed } from '@/types/renovation'
import { NeedDoneToggle } from './needs-shared'
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
    toggleCompleted,
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
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500 text-[15px]">Nothing here yet. Use the bar below to add.</div>
      ) : (
        <ul dir="rtl" className="rounded-xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((need: RenovationNeed) => (
            <li key={need.id} className="p-3 space-y-2.5">
              <div className="flex flex-row items-center gap-1 min-h-[48px]">
                <NeedDoneToggle mobile completed={need.completed} onToggle={() => toggleCompleted(need)} />
                <input
                  dir="auto"
                  defaultValue={need.title}
                  key={`${need.id}-${need.title}-${need.completed}`}
                  onBlur={(e) => saveTitle(need, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className={`flex-1 min-w-0 min-h-[44px] bg-transparent text-[16px] font-semibold border-0 rounded-lg px-2 py-2 outline-none ring-0 focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0 ${
                    need.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'
                  }`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 pr-[3px]">
                {rooms.length > 0 && (
                  <select
                    value={need.room_id || ''}
                    onChange={(e) => saveRoom(need, e.target.value)}
                    dir={need.room_id ? 'auto' : 'ltr'}
                    className={`min-h-[44px] flex-1 min-w-[140px] pl-4 pr-10 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.25rem_1.25rem] rounded-full border border-slate-200/80 text-[14px] bg-slate-50/70 hover:bg-slate-100 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer ${
                      need.room_id ? 'font-medium text-slate-700' : 'font-normal text-slate-400 text-left'
                    }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
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
                <button type="button" onClick={() => remove(need.id)} className="min-h-[44px] px-4 rounded-full text-[14px] font-bold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 transition-colors">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MobileStickyFooter>
        <form onSubmit={addItem} className="rounded-xl bg-white border border-slate-200 shadow-lg p-3 space-y-2" dir="rtl">
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
              dir={newRoomId ? 'auto' : 'ltr'}
              className={`w-full min-h-[48px] pl-4 pr-10 appearance-none bg-no-repeat bg-[right_1.25rem_center] bg-[length:1.25rem_1.25rem] rounded-full border border-slate-200 bg-white text-[15px] shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                newRoomId ? 'font-medium text-slate-700' : 'font-normal text-slate-400 text-left'
              }`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
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
