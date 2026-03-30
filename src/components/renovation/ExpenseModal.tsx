'use client'

import type { RenovationExpense } from '@/types/renovation'
import { ExpenseFormFields } from '@/components/renovation/ExpenseFormFields'
import { useExpenseForm } from '@/components/renovation/useExpenseForm'

interface ExpenseModalProps {
  editing?: RenovationExpense | null
  onClose: () => void
  onSave: () => void
  onAttachmentsChanged?: () => void
}

/** Desktop-only expense form (centered modal). Mobile uses `ExpenseModalMobile`. */
export function ExpenseModal({ editing, onClose, onSave, onAttachmentsChanged }: ExpenseModalProps) {
  const form = useExpenseForm({ editing, onSave, onAttachmentsChanged })
  const { save, saving, uploadingAttach, handleDroppedFiles, editing: editingRow } = form

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        onDragOver={(ev) => ev.preventDefault()}
        onDrop={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          handleDroppedFiles(ev.dataTransfer.files)
        }}
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white pt-0 shadow-2xl animate-zoom-in"
      >
        <div className="relative flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <h2 className="mt-0 text-[18px] font-bold tracking-tight text-slate-800">
            {editingRow ? 'Edit Expense' : 'New Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 mt-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 active:scale-90"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <ExpenseFormFields form={form} autoFocusAmount />
          </div>
          <div className="flex shrink-0 gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded border border-slate-200 bg-white text-[15px] font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingAttach}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 text-[15px] font-bold text-white shadow-md disabled:opacity-50"
            >
              {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
