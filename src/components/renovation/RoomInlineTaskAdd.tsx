'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/utils/common'

type Props = {
  roomId: string | null
  onAdd: (roomId: string, title: string) => Promise<boolean>
  /** e.g. desktop vs mobile density */
  variant?: 'desktop' | 'mobile'
  className?: string
}

/** Todoist-style single-line task add: type title, Enter to save. */
export function RoomInlineTaskAdd({ roomId, onAdd, variant = 'desktop', className }: Props) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setValue('')
  }, [roomId])

  const submit = useCallback(async () => {
    if (!roomId || busy) return
    const t = value.trim()
    if (!t) return
    setBusy(true)
    try {
      const ok = await onAdd(roomId, t)
      if (ok) setValue('')
    } finally {
      setBusy(false)
    }
  }, [roomId, value, busy, onAdd])

  const isMobile = variant === 'mobile'

  return (
    <div className={cn(isMobile ? 'px-1' : '', className)}>
      <input
        dir="auto"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void submit()
          }
        }}
        placeholder="Add task…"
        disabled={!roomId || busy}
        aria-label="Add task to this room"
        className={cn(
          'w-full rounded-lg border border-dashed border-slate-300 bg-white text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 disabled:opacity-50',
          isMobile
            ? 'min-h-[44px] px-3 py-2.5 text-[15px] font-medium'
            : 'px-3 py-2 text-[14px] font-medium',
        )}
      />
    </div>
  )
}
