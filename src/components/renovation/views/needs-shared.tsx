'use client'

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
