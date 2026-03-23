'use client'

import Link from 'next/link'
import type { RenovationNeed } from '@/types/renovation'
import { NeedDoneToggle } from './needs-shared'
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
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Needs</h1>
        <p className="text-[15px] text-slate-500 mt-1">What you need from the apartment — add items and optionally link them to a room.</p>
      </header>

      <form onSubmit={addItem} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-row gap-2 items-stretch" dir="rtl">
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
              dir={newRoomId ? 'auto' : 'ltr'}
              className={`h-11 pl-4 pr-10 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.25rem_1.25rem] rounded-full border border-slate-200 bg-white text-[15px] min-w-[10rem] hover:border-slate-300 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer ${
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
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">No items yet. Add one above.</div>
      ) : (
        <ul dir="rtl" className="bg-white rounded-xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {items.map((need: RenovationNeed) => (
            <li key={need.id} className="group flex flex-row items-center gap-1.5 py-2.5 pl-2 pr-3 sm:pl-3 sm:pr-4">
              <NeedDoneToggle completed={need.completed} onToggle={() => toggleCompleted(need)} />
              <div className="flex-1 min-w-0">
                <input
                  dir="auto"
                  defaultValue={need.title}
                  key={`${need.id}-${need.title}-${need.completed}`}
                  onBlur={(e) => saveTitle(need, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className={`w-full bg-transparent text-[16px] font-medium border-0 rounded-md px-1.5 py-1.5 -mx-1.5 outline-none ring-0 transition-shadow focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0 ${
                    need.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900'
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {rooms.length > 0 && (
                  <select
                    value={need.room_id || ''}
                    onChange={(e) => saveRoom(need, e.target.value)}
                    dir={need.room_id ? 'auto' : 'ltr'}
                    className={`h-8 pl-2.5 pr-8 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.15rem_1.15rem] rounded-full border border-slate-200/80 text-[13px] bg-slate-50/70 hover:bg-slate-100 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none max-w-[10rem] cursor-pointer ${
                      need.room_id ? 'font-medium text-slate-700' : 'font-normal text-slate-400 text-left'
                    }`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
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
                <button
                  type="button"
                  onClick={() => remove(need.id)}
                  className="max-w-0 px-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[6rem] group-hover:px-2.5 group-hover:opacity-100 focus:max-w-[6rem] focus:px-2.5 focus:opacity-100 transition-all duration-300 ease-in-out h-8 text-[13px] font-medium text-rose-600/90 hover:text-rose-700 hover:bg-rose-50/80 rounded-md"
                >
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
