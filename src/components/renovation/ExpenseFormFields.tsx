'use client'

import { renovationPublicUrl } from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import { useExpenseForm } from '@/components/renovation/useExpenseForm'

export type ExpenseFormFieldsModel = ReturnType<typeof useExpenseForm>

type ExpenseFormFieldsProps = {
  form: ExpenseFormFieldsModel
  /** When false, amount field is not auto-focused (e.g. detail drawer). Default true. */
  autoFocusAmount?: boolean
}

/** Shared expense form fields (amount, vendor, category, date, payment, notes, attachments). */
export function ExpenseFormFields({ form, autoFocusAmount = true }: ExpenseFormFieldsProps) {
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
    removePendingAt,
    removeAttachment,
  } = form

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-2">
        <label className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Amount</label>
        <div className="group relative inline-block">
          <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-[32px] font-light text-slate-300">₪</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-[220px] bg-transparent px-3 py-1 text-center text-[44px] font-bold leading-none text-slate-800 outline-none transition-all placeholder:text-slate-200"
            placeholder="0.00"
            required
            autoFocus={autoFocusAmount}
          />
          <div className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-50 bg-slate-100 transition-all duration-300 group-focus-within:scale-x-100 group-focus-within:bg-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Vendor</label>
          <input
            dir="auto"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Store name..."
            className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Category</label>
          <input
            dir="auto"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Materials..."
            className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Date</label>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <div className="space-y-1.5">
          <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Payment</label>
          <input
            dir="auto"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            placeholder="Credit, Cash..."
            className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Notes</label>
        <textarea
          dir="auto"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any extra details..."
          rows={2}
          className="w-full resize-none rounded border border-slate-200 bg-slate-50 px-3 py-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="space-y-3 rounded border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Files & receipts</span>
          <span className="text-[11px] text-slate-400">Drop files here or choose</span>
        </div>

        {editingRow?.receipt_storage_path && (
          <div className="flex items-center gap-2 text-[13px]">
            <a
              href={renovationPublicUrl(editingRow.receipt_storage_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Legacy receipt (gallery)
            </a>
          </div>
        )}

        {editingRow?.id && attachments.length > 0 && (
          <ul className="max-h-32 space-y-1.5 overflow-y-auto">
            {attachments.map((att) => (
              <li key={att.id} className="flex items-center gap-2 rounded border border-slate-100 bg-white px-2 py-1.5 text-[13px]">
                <a
                  href={att.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate font-medium text-indigo-600 hover:underline"
                  dir="auto"
                >
                  {att.file_name}
                </a>
                <button type="button" onClick={() => removeAttachment(att)} className="shrink-0 text-[12px] font-bold text-rose-500">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {pendingFiles.length > 0 && (
          <ul className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-500">Will upload on save</p>
            {pendingFiles.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded border border-slate-100 bg-white px-2 py-1 text-[13px]">
                <span className="truncate" dir="auto">
                  {f.name}
                </span>
                <button type="button" onClick={() => removePendingAt(i)} className="text-[12px] text-slate-400 hover:text-rose-500">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="relative flex min-h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded border border-slate-200 bg-white py-2 text-[14px] font-semibold text-indigo-600 shadow-sm hover:bg-slate-50">
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
    </div>
  )
}
