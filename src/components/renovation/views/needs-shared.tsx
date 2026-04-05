'use client'

import { useToast } from '@/components/ui/Toast'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'
import { formatNeedsAsCopyList } from './needs-page-shared'

type Props = {
  completed: boolean
  onToggle: () => void
  /** Larger hit area on touch */
  mobile?: boolean
}

export function NeedDoneToggle({ completed, onToggle, mobile }: Props) {
  return (
    <button
      type="button"
      aria-pressed={completed}
      aria-label={completed ? 'Mark as not done' : 'Mark as done'}
      onClick={onToggle}
      className={
        mobile
          ? 'shrink-0 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100/80 active:bg-slate-100'
          : 'shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100/80'
      }
    >
      <span
        className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border transition-colors ${
          completed
            ? 'border-emerald-500 bg-emerald-500 shadow-sm shadow-emerald-500/20'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        {completed ? (
          <svg
            viewBox="0 0 16 16"
            className="h-[11px] w-[11px] text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M3.5 8.2 L6.4 11 L12.5 4.5" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

export function NeedsCopyListButton({
  items,
  rooms,
  disabled,
  label,
  className,
}: {
  items: RenovationNeed[]
  rooms: RenovationRoom[]
  disabled: boolean
  label: string
  className?: string
}) {
  const toast = useToast()

  const copy = async () => {
    const text = formatNeedsAsCopyList(items, rooms)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('List copied')
    } catch (e) {
      console.error(e)
      toast.error('Could not copy')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      disabled={disabled}
      className={className}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      <span>{label}</span>
    </button>
  )
}
