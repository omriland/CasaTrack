'use client'

import { ExpenseModal } from '@/components/renovation/ExpenseModal'
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
    editing,
    dragOverId,
    setDragOverId,
    load,
    attachmentCount,
    openNew,
    openEdit,
    addFilesToExpense,
    remove,
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

  return (
    <div className="space-y-4 pb-28 animate-fade-in-up">
      <header className="space-y-0.5">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Expenses</h1>
        <p className="text-[13px] text-slate-500">Tap to edit • + Files for receipts</p>
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
          <p className="text-[16px] font-bold text-slate-700">No expenses yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Log spend as you go.</p>
          <button type="button" onClick={openNew} className="mt-5 min-h-[48px] w-full max-w-xs rounded-xl bg-emerald-600 text-white text-[15px] font-bold">
            + Add expense
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
          {list.map((row: RenovationExpense) => {
            const attCount = attachmentCount(row)
            const isDrag = dragOverId === row.id
            return (
              <div
                key={row.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverId(row.id)
                }}
                onDragLeave={() => setDragOverId((id) => (id === row.id ? null : id))}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOverId(null)
                  void addFilesToExpense(row, e.dataTransfer.files)
                }}
                className={`p-4 transition-colors ${isDrag ? 'bg-indigo-50 ring-2 ring-indigo-200 ring-inset' : ''}`}
              >
                <button type="button" onClick={() => openEdit(row)} className="w-full text-left">
                  <div className="flex gap-3 items-start">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
                      {(row.vendor || row.category || 'E')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-bold text-slate-900 truncate" dir="auto">
                        {row.vendor || row.category || 'General Expense'}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5 tabular-nums">{formatDateDisplay(row.expense_date)}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {row.category && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{row.category}</span>
                        )}
                        {attCount > 0 && (
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {attCount} file{attCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {isDrag && <span className="text-[11px] font-bold text-indigo-600">Drop to attach</span>}
                      </div>
                    </div>
                    <span className="text-[17px] font-extrabold text-slate-900 tabular-nums shrink-0">{formatIls(Number(row.amount))}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 mt-3 pl-14">
                  <label className="min-h-[44px] px-4 rounded-xl bg-slate-100 text-slate-800 text-[13px] font-bold flex items-center cursor-pointer active:bg-slate-200">
                    + Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(ev) => {
                        void addFilesToExpense(row, ev.target.files)
                        ev.target.value = ''
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="min-h-[44px] px-4 rounded-xl text-[13px] font-bold text-rose-600 bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MobileStickyFooter>
        <button
          type="button"
          onClick={openNew}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-600 text-white text-[16px] font-bold shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add expense
        </button>
      </MobileStickyFooter>

      {sheet && (
        <ExpenseModal
          editing={editing}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
          onAttachmentsChanged={() => load()}
        />
      )}
    </div>
  )
}
