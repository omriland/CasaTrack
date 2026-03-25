'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/common'
import {
  ROOM_ICON_OPTIONS,
  RoomIconGlyph,
  ROOM_ICON_TILE,
  type RoomIconKey,
} from '@/components/renovation/room-icons'

export function RoomIconPickerGrid({
  value,
  onChange,
  dense,
  onPick,
}: {
  value: RoomIconKey
  onChange: (key: RoomIconKey) => void
  dense?: boolean
  /** Called after a choice (e.g. close dialog / sheet). */
  onPick?: (key: RoomIconKey) => void
}) {
  const handle = (key: RoomIconKey) => {
    onChange(key)
    onPick?.(key)
  }

  return (
    <div
      className={cn('grid gap-2', dense ? 'grid-cols-3' : 'grid-cols-4')}
      role="listbox"
      aria-label="Room icons"
    >
      {ROOM_ICON_OPTIONS.map((opt) => {
        const selected = opt.key === value
        return (
          <button
            key={opt.key}
            type="button"
            role="option"
            aria-selected={selected}
            title={`${opt.label} — ${opt.hint}`}
            onClick={() => handle(opt.key)}
            className={cn(
              'group flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80',
              dense ? 'min-h-[88px]' : 'min-h-[96px]',
              selected
                ? 'border-amber-400 bg-gradient-to-b from-amber-50/90 to-white shadow-[0_6px_20px_-8px_rgba(245,158,11,0.35)]'
                : 'border-slate-100/90 bg-white/80 hover:border-slate-200 hover:bg-slate-50/90',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-transform group-active:scale-95',
                dense ? 'h-11 w-11' : 'h-12 w-12',
                ROOM_ICON_TILE[opt.key],
              )}
            >
              <RoomIconGlyph roomKey={opt.key} className={dense ? 'h-6 w-6' : 'h-7 w-7'} />
            </div>
            <span
              className={cn(
                'max-w-[5.5rem] text-center font-bold leading-tight text-slate-600',
                dense ? 'text-[9px]' : 'text-[10px]',
              )}
            >
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Desktop / tablet: centered dialog over blur backdrop. */
export function RoomIconPickerDialog({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean
  onClose: () => void
  value: RoomIconKey
  onChange: (key: RoomIconKey) => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[265] flex items-center justify-center p-4 md:p-6" role="presentation">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-icon-dialog-title"
        className="relative z-10 w-full max-w-lg max-h-[min(560px,85vh)] overflow-y-auto rounded-[1.35rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="room-icon-dialog-title" className="text-[18px] font-bold tracking-tight text-slate-900">
              Choose room icon
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Icons from{' '}
              <a
                href="https://lucide.dev"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline decoration-indigo-200 underline-offset-2 hover:text-indigo-500"
              >
                Lucide
              </a>
              . Tap one to apply; save the room to keep it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-[15px] font-semibold text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <RoomIconPickerGrid value={value} onChange={onChange} onPick={() => onClose()} />
      </div>
    </div>,
    document.body,
  )
}
