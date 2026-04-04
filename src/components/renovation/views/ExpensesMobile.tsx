'use client'

import { ExpenseModalMobile } from '@/components/renovation/ExpenseModalMobile'
import { ExpenseDetailDrawer } from '@/components/renovation/ExpenseDetailDrawer'
import { MobileStickyFooter } from '@/components/renovation/mobile/MobileStickyFooter'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'
import type { RenovationExpense } from '@/types/renovation'
import { useExpensesPageState } from './useExpensesPageState'

export function ExpensesMobile() {
  const {
    project,
    list,
    loading,
    sheet,
    setSheet,
    viewing,
    load,
    attachmentCount,
    openNew,
    openView,
    closeView,
  } = useExpensesPageState()

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <a href="/renovation" className="text-indigo-600 font-semibold">
          Create a project first
        </a>
      </p>
    )
  }

  const total = list.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Expenses</h1>
        <p className="text-[14px] text-slate-500 mt-1">Tap any expense to view or edit</p>
      </header>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
          <p className="text-[16px] font-bold text-slate-700">No expenses yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Log your spending as you go.</p>
          <button
            type="button"
            onClick={openNew}
            className="mt-5 min-h-[48px] w-full max-w-xs rounded-xl bg-emerald-600 text-white text-[16px] font-bold active:scale-[0.98] transition-transform"
          >
            Add expense
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-2xl bg-white border border-slate-200/60 px-5 py-4 shadow-sm">
            <p className="text-[14px] font-medium text-slate-500">Total spent</p>
            <p className="text-[24px] font-bold text-slate-900 tabular-nums">{formatIls(total)}</p>
          </div>

          {/* Expense list */}
          <div className="rounded-2xl border border-slate-200/60 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
            {list.map((row: RenovationExpense) => {
              const attCount = attachmentCount(row)
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openView(row)}
                  className="w-full flex items-center gap-3 p-4 text-left active:bg-slate-50 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0 text-[14px]">
                    {(row.vendor || row.category || 'E')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-slate-900 truncate" dir="auto">
                      {row.vendor || row.category || 'General Expense'}
                    </p>
                    <p className="text-[14px] text-slate-500 mt-0.5 tabular-nums">{formatDateDisplay(row.expense_date)}</p>
                    {(row.category || attCount > 0) && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {row.category && (
                          <span className="text-[13px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{row.category}</span>
                        )}
                        {attCount > 0 && (
                          <span className="text-[13px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {attCount} file{attCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[16px] font-bold text-slate-900 tabular-nums shrink-0">{formatIls(Number(row.amount))}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <MobileStickyFooter>
        <button
          type="button"
          onClick={openNew}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-600 text-white text-[16px] font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          aria-label="Add new expense"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add expense
        </button>
      </MobileStickyFooter>

      {sheet && (
        <ExpenseModalMobile
          editing={viewing}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
          onAttachmentsChanged={() => load()}
        />
      )}

      {viewing && !sheet && (
        <ExpenseDetailDrawer
          expense={viewing}
          onClose={closeView}
          onSaved={() => void load()}
          onAttachmentsChanged={() => void load()}
          onDeleted={() => void load()}
        />
      )}
    </div>
  )
}
