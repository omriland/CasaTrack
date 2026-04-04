'use client'

import { useState } from 'react'
import { deleteExpense } from '@/lib/renovation'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'
import type { RenovationExpense } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'
import { ExpenseFormFields } from '@/components/renovation/ExpenseFormFields'
import { useExpenseForm } from '@/components/renovation/useExpenseForm'

export interface ExpenseDetailDrawerProps {
  expense: RenovationExpense
  onClose: () => void
  /** Called after a successful save (reload list in parent). Drawer stays open. */
  onSaved: () => void
  onAttachmentsChanged?: () => void
  /** After delete succeeds */
  onDeleted: () => void
}

/** Right-hand detail panel for viewing/editing an expense (matches TaskDetailDrawer shell). */
export function ExpenseDetailDrawer({
  expense,
  onClose,
  onSaved,
  onAttachmentsChanged,
  onDeleted,
}: ExpenseDetailDrawerProps) {
  const confirmAction = useConfirm()
  const [deleting, setDeleting] = useState(false)
  const form = useExpenseForm({
    editing: expense,
    onSave: onSaved,
    onAttachmentsChanged,
  })
  const { save, saving, uploadingAttach, editing: editingRow } = form

  const title = editingRow?.vendor || editingRow?.category || 'Expense'

  const handleDelete = async () => {
    if (!(await confirmAction('Delete this expense?'))) return
    setDeleting(true)
    try {
      await deleteExpense(expense.id)
      onDeleted()
      onClose()
    } catch (e) {
      console.error(e)
      alert('Could not delete expense')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="animate-fade-in fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-sm transition-opacity md:bg-transparent md:backdrop-blur-none"
        onClick={onClose}
        aria-hidden
      />
      <div className="animate-slide-in-right fixed inset-y-0 right-0 z-[210] flex w-[100vw] flex-col bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)] md:w-[576px] lg:w-[640px]">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Expense</p>
            <h2 className="mt-0.5 truncate text-[22px] font-bold tracking-tight text-slate-900" dir="auto">
              {title}
            </h2>
            <p className="mt-1 text-[14px] font-semibold tabular-nums text-slate-600">
              {formatIls(Number(editingRow?.amount ?? expense.amount))}
              <span className="mx-2 text-slate-300">·</span>
              <span className="font-medium text-slate-500">{formatDateDisplay(editingRow?.expense_date ?? expense.expense_date)}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="flex h-10 min-w-[40px] items-center justify-center rounded-lg px-2 text-[13px] font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              aria-label="Delete expense"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <form
          onSubmit={save}
          onDragOver={(ev) => ev.preventDefault()}
          onDrop={(ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            form.handleDroppedFiles(ev.dataTransfer.files)
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
            <ExpenseFormFields form={form} autoFocusAmount={false} />
          </div>
          <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white px-5 py-4 md:px-6">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-lg border border-slate-200 bg-white text-[15px] font-bold text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.99]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || uploadingAttach}
              className="flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-[15px] font-bold text-white disabled:opacity-50"
            >
              {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
