'use client'

import { useEffect, useRef, useState } from 'react'
import type { RenovationRoom } from '@/types/renovation'
import type { VendorBudgetSortDir, VendorBudgetSortKey } from '@/lib/renovation-vendor-budget'
import { cn } from '@/utils/common'

type Props = {
  rooms: RenovationRoom[]
  sortKey: VendorBudgetSortKey
  sortDir: VendorBudgetSortDir
  onSortChange: (key: VendorBudgetSortKey, dir: VendorBudgetSortDir) => void
  /** When empty, no room filter. Otherwise show rows that include at least one selected room. */
  filterRoomIds: string[]
  onFilterRoomIdsChange: (ids: string[]) => void
}

export function VendorBudgetToolbar({
  rooms,
  sortKey,
  sortDir,
  onSortChange,
  filterRoomIds,
  onFilterRoomIdsChange,
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Sort</span>
        <select
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(':') as [VendorBudgetSortKey, VendorBudgetSortDir]
            onSortChange(k, d)
          }}
          className="h-10 min-w-[11rem] rounded-lg border border-slate-200 bg-white px-3 text-[14px] font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          aria-label="Sort rows"
        >
          <option value="vendor:asc">Vendor A → Z</option>
          <option value="vendor:desc">Vendor Z → A</option>
          <option value="rooms:asc">Rooms A → Z</option>
          <option value="rooms:desc">Rooms Z → A</option>
        </select>
      </div>

      <div ref={filterRef} className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Rooms column</span>
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className={cn(
            'h-10 rounded-lg border px-3 text-[14px] font-semibold transition-colors',
            filterActive
              ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
          )}
        >
          {filterActive ? `Show rows (${filterRoomIds.length} rooms)` : 'Filter which rooms…'}
        </button>
        {filterActive && (
          <button
            type="button"
            onClick={() => onFilterRoomIdsChange([])}
            className="text-[13px] font-bold text-rose-600 hover:underline"
          >
            Clear
          </button>
        )}
        {filterOpen && (
          <div className="absolute right-0 top-full z-40 mt-1 max-h-64 min-w-[14rem] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {rooms.length === 0 ? (
              <p className="px-3 py-4 text-[13px] text-slate-500">No rooms in this project.</p>
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
    </div>
  )
}
