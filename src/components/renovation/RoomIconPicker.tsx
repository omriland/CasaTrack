'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/common'
import {
  ROOM_ICON_KEYS,
  RoomIconGlyph,
  ROOM_ICON_TILE,
  type RoomIconKey,
} from '@/components/renovation/room-icons'

function iconAriaLabel(key: RoomIconKey): string {
  return key.replace(/_/g, ' ')
}

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
      className="grid grid-cols-5 gap-2.5"
      role="listbox"
      aria-label="Room icons"
    >
      {ROOM_ICON_KEYS.map((key) => {
        const selected = key === value
        return (
          <button
            key={key}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={iconAriaLabel(key)}
            title={iconAriaLabel(key)}
            onClick={() => handle(key)}
            className={cn(
              'group flex aspect-square max-h-[5.25rem] w-full items-center justify-center rounded-2xl border-2 p-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
              ROOM_ICON_TILE[key],
              selected
                ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.22)] ring-1 ring-indigo-300/60'
                : 'border-white/60 shadow-sm hover:border-slate-200/90 hover:shadow-md active:scale-[0.97]',
            )}
          >
            <RoomIconGlyph roomKey={key} className={dense ? 'h-7 w-7' : 'h-8 w-8'} />
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
              Tap an icon to apply. Save the room to keep your choice.
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
