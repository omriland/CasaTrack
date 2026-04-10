'use client'

import { useEffect, useRef, useState } from 'react'
import type { RenovationRoom } from '@/types/renovation'
import { cn } from '@/utils/common'

type Props = {
  rooms: RenovationRoom[]
  filterRoomIds: string[]
  onFilterRoomIdsChange: (ids: string[]) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  onExportCsv: () => void
}

export function VendorBudgetToolbar({
  rooms,
  filterRoomIds,
  onFilterRoomIdsChange,
  searchQuery,
  onSearchChange,
  onExportCsv,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filterOpen) return
    const close = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [filterOpen])

  const filterActive = filterRoomIds.length > 0

  const toggleRoom = (roomId: string) => {
    if (filterRoomIds.includes(roomId)) {
      onFilterRoomIdsChange(filterRoomIds.filter((id) => id !== roomId))
    } else {
      onFilterRoomIdsChange([...filterRoomIds, roomId])
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      dir="ltr"
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[140px] max-w-sm">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vendors…"
          className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[14px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Room filter */}
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              'h-10 rounded-lg border px-3 text-[14px] font-semibold transition-colors flex items-center gap-1.5',
              filterActive
                ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
            )}
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            {filterActive
              ? `Rooms (${filterRoomIds.length})`
              : 'Rooms'}
          </button>
          {filterActive && (
            <button
              type="button"
              onClick={() => onFilterRoomIdsChange([])}
              className="ml-1 text-[13px] font-bold text-rose-600 hover:underline"
            >
              Clear
            </button>
          )}
          {filterOpen && (
            <div className="absolute right-0 top-full z-40 mt-1 max-h-64 min-w-[14rem] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {rooms.length === 0 ? (
                <p className="px-3 py-4 text-[13px] text-slate-500">
                  No rooms in this project.
                </p>
              ) : (
                rooms.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-[14px] hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={filterRoomIds.includes(r.id)}
                      onChange={() => toggleRoom(r.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span dir="auto" className="font-medium text-slate-800">
                      {r.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Export CSV */}
        <button
          type="button"
          onClick={onExportCsv}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[14px] font-semibold text-slate-800 hover:border-slate-300 transition-colors flex items-center gap-1.5"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </div>
  )
}
