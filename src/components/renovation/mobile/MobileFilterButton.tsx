'use client'

type MobileFilterButtonProps = {
  onClick: () => void
  activeCount?: number
  label?: string
}

export function MobileFilterButton({ onClick, activeCount = 0, label = 'Filters' }: MobileFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-2xl bg-white border border-slate-200 text-[14px] font-bold text-slate-700 shadow-sm active:scale-[0.98] transition-transform"
    >
      <svg className="w-[18px] h-[18px] text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      {label}
      {activeCount > 0 && (
        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center tabular-nums">
          {activeCount}
        </span>
      )}
    </button>
  )
}
