'use client'

import { ExpenseDetailDrawer } from '@/components/renovation/ExpenseDetailDrawer'
import { ExpenseModal } from '@/components/renovation/ExpenseModal'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'
import type { RenovationExpense } from '@/types/renovation'
import { useExpensesPageState } from './useExpensesPageState'

export function ExpensesDesktop() {
  const {
    project,
    list,
    loading,
    sheet,
    setSheet,
    dragOverId,
    setDragOverId,
    load,
    attachmentCount,
    openNew,
    openView,
    closeView,
    viewing,
    addFilesToExpense,
    remove,
  } = useExpensesPageState()

  if (!project) {
    return (
      <p className="text-center text-black/45 py-16">
        <a href="/renovation" className="text-[#007AFF]">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in-up">
      <header className="flex flex-row items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900 font-sans">Expenses</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">Track every shekel spent</p>
        </div>
        <div>
          <button
            type="button"
            onClick={openNew}
            className="h-11 px-6 rounded-full bg-emerald-600 text-white text-[15px] font-bold shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            + Add Expense
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 p-16 text-center mt-6">
          <div className="inline-flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-[16px] font-bold text-slate-600 uppercase tracking-tight">No expenses found</p>
            <p className="text-[14px] text-slate-400 mt-1 max-w-xs mx-auto">Click below to log your first expense.</p>
            <button type="button" onClick={openNew} className="mt-6 text-emerald-600 font-bold text-[14px] bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors">
              + Add expense
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50 mt-6 shadow-sm">
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
                onDragLeave={() => {
                  setDragOverId((id) => (id === row.id ? null : id))
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOverId(null)
                  void addFilesToExpense(row, e.dataTransfer.files)
                }}
                className={`flex flex-row items-center gap-3 p-5 transition-colors group ${
                  isDrag ? 'bg-indigo-50 ring-2 ring-indigo-300 ring-inset' : 'hover:bg-slate-50/50'
                }`}
              >
                <button type="button" onClick={() => openView(row)} className="flex-1 text-left min-w-0 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg uppercase shrink-0">
                    {(row.vendor || row.category || 'E')[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-slate-900 truncate" dir="auto">
                      {row.vendor || row.category || 'General Expense'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-[13px] text-slate-400 font-medium tabular-nums">{formatDateDisplay(row.expense_date)}</p>
                      {row.category && (
                        <>
                          <span className="text-slate-300">•</span>
                          <p className="text-[13px] text-slate-500">{row.category}</p>
                        </>
                      )}
                      {attCount > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {attCount} file{attCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      {isDrag && <span className="text-[12px] font-bold text-indigo-600">Drop to attach</span>}
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-end gap-4 shrink-0">
                  <span className="text-[18px] font-extrabold text-slate-900 tabular-nums">{formatIls(Number(row.amount))}</span>

                  <div className="flex items-center gap-2">
                    <label className="shrink-0 flex items-center justify-center h-9 px-3 rounded-lg bg-slate-100 text-slate-700 text-[12px] font-bold cursor-pointer hover:bg-slate-200 transition-colors">
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
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Expense"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sheet && (
        <ExpenseModal
          editing={null}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
          onAttachmentsChanged={() => load()}
        />
      )}

      {viewing && (
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
