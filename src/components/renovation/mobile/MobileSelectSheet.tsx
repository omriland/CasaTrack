'use client'

import type { ReactNode } from 'react'
import { MobileBottomSheet } from './MobileBottomSheet'

export type MobileSelectOption = { value: string; label: string; icon?: ReactNode }

type MobileSelectSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  value: string
  onChange: (value: string) => void
  options: MobileSelectOption[]
  emptyLabel?: string
}

export function MobileSelectSheet({
  open,
  onClose,
  title,
  value,
  onChange,
  options,
  emptyLabel = 'No options',
}: MobileSelectSheetProps) {
  return (
    <MobileBottomSheet open={open} onClose={onClose} title={title}>
      <div className="space-y-0.5">
        {options.length === 0 ? (
          <p className="text-center text-slate-400 py-8 text-[15px] font-medium">{emptyLabel}</p>
        ) : (
          options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value || '__empty'}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  onClose()
                }}
                className={`w-full flex items-center gap-3 min-h-[52px] px-4 rounded-2xl text-left transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-800 font-bold' : 'text-slate-800 active:bg-slate-100 font-medium'
                }`}
              >
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="text-[16px] truncate">{opt.label}</span>
              </button>
            )
          })
        )}
      </div>
    </MobileBottomSheet>
  )
}
