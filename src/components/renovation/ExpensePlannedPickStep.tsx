'use client'

import type { RenovationExpense } from '@/types/renovation'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'

type ExpensePlannedPickStepProps = {
  planned: RenovationExpense[]
  loading: boolean
  onPick: (row: RenovationExpense) => void
  onSkip: () => void
  layout?: 'mobile' | 'desktop'
}

/** Step 1 for new spent: link to a planned row or skip (unplanned spend). */
export function ExpensePlannedPickStep({
  planned,
  loading,
  onPick,
  onSkip,
  layout = 'desktop',
}: ExpensePlannedPickStepProps) {
  const isMobile = layout === 'mobile'

  return (
    <div className={isMobile ? 'flex min-h-0 flex-1 flex-col' : 'flex flex-col'}>
      <div className={isMobile ? 'border-b border-slate-100 px-4 py-3' : 'px-6 pb-2'}>
        <p className={isMobile ? 'text-[15px] font-semibold text-slate-700' : 'text-[14px] font-semibold text-slate-600'}>
          Apply this payment to a planned cost?
        </p>
        <p className="mt-1 text-[13px] text-slate-500">
          Linking keeps your plan row and records spend separately. You can skip if this isn&apos;t for an existing plan.
        </p>
      </div>

      <div className={isMobile ? 'min-h-0 flex-1 overflow-y-auto px-4 py-3' : 'max-h-[min(360px,50vh)] overflow-y-auto px-6 py-3'}>
        {loading ? (
          <div className="space-y-2 animate-pulse py-2">
            <div className="h-14 rounded-xl bg-slate-100" />
            <div className="h-14 rounded-xl bg-slate-100" />
          </div>
        ) : planned.length === 0 ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-[14px] text-amber-950">
            No planned costs yet. Add them on the Budget tab, or skip to log unplanned spend.
          </p>
        ) : (
          <ul className="space-y-2">
            {planned.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onPick(row)}
                  className={
                    isMobile
                      ? 'flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left active:bg-slate-50'
                      : 'flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40'
                  }
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[13px] font-bold text-amber-900">
                    {(row.vendor || row.category || 'P')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-slate-900" dir="auto">
                      {row.vendor || row.category || 'Planned'}
                    </p>
                    <p className="text-[13px] text-slate-500 tabular-nums">{formatDateDisplay(row.expense_date)}</p>
                  </div>
                  <span className="shrink-0 text-[15px] font-bold tabular-nums text-amber-950">{formatIls(Number(row.amount))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        className={
          isMobile
            ? 'shrink-0 border-t border-slate-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            : 'shrink-0 border-t border-slate-100 px-6 py-4'
        }
      >
        <button
          type="button"
          onClick={onSkip}
          className={
            isMobile
              ? 'w-full min-h-[52px] rounded-xl border border-slate-200 text-[16px] font-bold text-slate-800 active:bg-slate-50'
              : 'h-11 w-full rounded-lg border border-slate-200 text-[14px] font-bold text-slate-700 hover:bg-slate-50'
          }
        >
          Skip — unplanned spend
        </button>
      </div>
    </div>
  )
}
