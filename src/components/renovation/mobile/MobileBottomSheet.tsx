'use client'

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'

type MobileBottomSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function MobileBottomSheet({ open, onClose, title, children }: MobileBottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const t = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 10)
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus?.()
    }
  }, [open, onKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] md:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute left-0 right-0 bottom-0 max-h-[min(85vh,calc(100dvh-env(safe-area-inset-top)))] flex flex-col rounded-t-[1.5rem] bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.12)] outline-none overflow-hidden overscroll-contain animate-fade-in-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="shrink-0 flex flex-col items-center pt-2 pb-1">
          <span className="w-10 h-1 rounded-full bg-slate-200" aria-hidden />
        </div>
        <div className="shrink-0 px-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <h2 id={titleId} className="text-[18px] font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 text-[15px] font-semibold"
          >
            Done
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">{children}</div>
      </div>
    </div>
  )
}
