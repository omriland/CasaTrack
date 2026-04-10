'use client'

import { useEffect, useRef, useState } from 'react'
import type { RenovationRoom } from '@/types/renovation'
import { cn } from '@/utils/common'

export function BudgetLineRoomsPicker({
  rooms,
  selectedIds,
  onCommit,
  disabled,
  className,
}: {
  rooms: RenovationRoom[]
  selectedIds: string[]
  onCommit: (next: string[]) => void | Promise<void>
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const labelText =
    rooms.length === 0
      ? 'No rooms yet'
      : selectedIds.length === 0
        ? '—'
        : selectedIds
            .map((id) => rooms.find((r) => r.id === id)?.name)
            .filter(Boolean)
            .join(', ')

  const toggle = (roomId: string) => {
    const next = selectedIds.includes(roomId)
      ? selectedIds.filter((id) => id !== roomId)
      : [...selectedIds, roomId]
    void onCommit(next)
  }

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <button
        type="button"
        disabled={disabled || rooms.length === 0}
        onClick={() => rooms.length > 0 && !disabled && setOpen((o) => !o)}
        className={cn(
          'flex w-full min-h-[44px] sm:min-h-12 items-center justify-between gap-2 rounded-lg border px-3 text-left text-[14px] font-medium transition-all',
          rooms.length === 0 || disabled
            ? 'cursor-not-allowed border-slate-100 bg-slate-50/80 text-slate-400'
            : open
              ? 'border-indigo-500 bg-white text-slate-900 ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 truncate" dir="auto">
          {labelText}
        </span>
        <svg
          className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && rooms.length > 0 && (
        <ul
          className="absolute right-0 top-full z-30 mt-1 max-h-56 min-w-[100%] max-w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-multiselectable
        >
          {rooms.map((r) => {
            const checked = selectedIds.includes(r.id)
            return (
              <li key={r.id} role="option" aria-selected={checked}>
                <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-[14px] hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span className="min-w-0 font-medium text-slate-800" dir="auto">
                    {r.name}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
