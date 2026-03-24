'use client'

import React from 'react'
import { renovationPublicUrl } from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import type { RenovationExpense } from '@/types/renovation'
import { useExpenseForm } from '@/components/renovation/useExpenseForm'

interface ExpenseModalProps {
  editing?: RenovationExpense | null
  onClose: () => void
  onSave: () => void
  onAttachmentsChanged?: () => void
}

/** Desktop-only expense form (centered modal). Mobile uses `ExpenseModalMobile`. */
export function ExpenseModal({ editing, onClose, onSave, onAttachmentsChanged }: ExpenseModalProps) {
  const {
    amount,
    handleAmountChange,
    date,
    setDate,
    vendor,
    setVendor,
    category,
    setCategory,
    notes,
    setNotes,
    payment,
    setPayment,
    saving,
    uploadingAttach,
    attachments,
    pendingFiles,
    editing: editingRow,
    onFilesSelectedForNew,
    onFilesSelectedForEdit,
    handleDroppedFiles,
    removePendingAt,
    removeAttachment,
    save,
  } = useExpenseForm({ editing, onSave, onAttachmentsChanged })

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity"
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
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pt-0 animate-zoom-in"
      >
        <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative py-3">
          <h2 className="font-bold text-slate-800 tracking-tight text-[18px] mt-0">
            {editingRow ? 'Edit Expense' : 'New Expense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200 active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center mt-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={save} className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">
          <div className="flex flex-col items-center justify-center py-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</label>
            <div className="relative group inline-block">
              <span className="absolute -left-5 top-1/2 -translate-y-1/2 font-light text-slate-300 text-[32px]">₪</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="bg-transparent text-center font-bold text-slate-800 outline-none px-3 py-1 placeholder-slate-200 transition-all leading-none w-[220px] text-[44px]"
                placeholder="0.00"
                required
                autoFocus
              />
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 group-focus-within:bg-indigo-500 transition-all duration-300 scale-x-50 group-focus-within:scale-x-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Vendor</label>
              <input
                dir="auto"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Store name..."
                className="w-full h-11 px-3 rounded border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Category</label>
              <input
                dir="auto"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Materials..."
                className="w-full h-11 px-3 rounded border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Date</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment</label>
              <input
                dir="auto"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="Credit, Cash..."
                className="w-full h-11 px-3 rounded border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes</label>
            <textarea
              dir="auto"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any extra details..."
              rows={2}
              className="w-full px-3 py-3 rounded border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="rounded border border-dashed border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Files & receipts</label>
              <span className="text-[11px] text-slate-400">Drop files here or choose</span>
            </div>

            {editingRow?.receipt_storage_path && (
              <div className="flex items-center gap-2 text-[13px]">
                <a
                  href={renovationPublicUrl(editingRow.receipt_storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Legacy receipt (gallery)
                </a>
              </div>
            )}

            {editingRow?.id && attachments.length > 0 && (
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-2 text-[13px] bg-white rounded px-2 py-1.5 border border-slate-100">
                    <a
                      href={att.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-indigo-600 font-medium hover:underline"
                      dir="auto"
                    >
                      {att.file_name}
                    </a>
                    <button type="button" onClick={() => removeAttachment(att)} className="text-rose-500 text-[12px] font-bold shrink-0">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {pendingFiles.length > 0 && (
              <ul className="space-y-1.5">
                <p className="text-[11px] text-slate-500 font-semibold">Will upload on save</p>
                {pendingFiles.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between text-[13px] bg-white rounded px-2 py-1 border border-slate-100">
                    <span className="truncate" dir="auto">
                      {f.name}
                    </span>
                    <button type="button" onClick={() => removePendingAt(i)} className="text-slate-400 hover:text-rose-500 text-[12px]">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="relative flex items-center justify-center w-full min-h-10 py-2 rounded bg-white border border-slate-200 text-[14px] font-semibold text-indigo-600 cursor-pointer hover:bg-slate-50 overflow-hidden shadow-sm">
              <span className="pointer-events-none select-none">{uploadingAttach ? 'Uploading…' : '+ Add files'}</span>
              <input
                type="file"
                multiple
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={!!uploadingAttach || saving}
                onChange={(ev) => {
                  const list = ev.target.files
                  if (editingRow?.id) void onFilesSelectedForEdit(list)
                  else onFilesSelectedForNew(list)
                  ev.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingAttach}
              className="flex-1 h-12 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
