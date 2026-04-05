'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { renovationPublicUrl } from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import { ExpensePlannedPickStep } from '@/components/renovation/ExpensePlannedPickStep'
import type { RenovationExpense } from '@/types/renovation'
import { useExpenseForm, type ExpenseFormVariant } from '@/components/renovation/useExpenseForm'
import { expenseIsPlanned, listExpenses } from '@/lib/renovation'
import { useRenovation } from '@/components/renovation/RenovationContext'

interface ExpenseModalMobileProps {
  editing?: RenovationExpense | null
  linkToPlanned?: RenovationExpense | null
  pickPlannedForNewSpend?: boolean
  /** New planned row from Budget (skips picker; planned-only form). */
  formVariant?: Extract<ExpenseFormVariant, 'plannedOnly'>
  onClose: () => void
  onSave: () => void
  onAttachmentsChanged?: () => void
}

/** Full-screen mobile expense form; desktop continues to use `ExpenseModal`. */
export function ExpenseModalMobile({
  editing,
  linkToPlanned,
  pickPlannedForNewSpend = false,
  formVariant,
  onClose,
  onSave,
  onAttachmentsChanged,
}: ExpenseModalMobileProps) {
  const { project } = useRenovation()
  const [step, setStep] = useState<'pick' | 'form'>(() =>
    !editing && pickPlannedForNewSpend && formVariant !== 'plannedOnly' ? 'pick' : 'form'
  )
  const [pickedPlan, setPickedPlan] = useState<RenovationExpense | null>(null)
  const [plannedRows, setPlannedRows] = useState<RenovationExpense[]>([])
  const [plannedLoading, setPlannedLoading] = useState(false)

  const effectiveLink = linkToPlanned ?? pickedPlan
  const createLinkedId = editing ? null : effectiveLink?.id ?? null
  const prefillPlanned = editing ? null : effectiveLink ?? null

  const resolvedFormVariant: ExpenseFormVariant =
    formVariant === 'plannedOnly'
      ? 'plannedOnly'
      : editing?.is_planned
        ? 'plannedOnly'
        : editing
          ? 'spentOnly'
          : 'spentOnly'

  const form = useExpenseForm({
    editing,
    onSave,
    onAttachmentsChanged,
    variant: resolvedFormVariant,
    createLinkedPlannedId: createLinkedId,
    prefillPlannedRow: prefillPlanned,
  })
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
  } = form

  useEffect(() => {
    setStep(!editing && pickPlannedForNewSpend && formVariant !== 'plannedOnly' ? 'pick' : 'form')
    setPickedPlan(null)
  }, [editing?.id, pickPlannedForNewSpend, linkToPlanned?.id, formVariant])

  const loadPlanned = useCallback(async () => {
    if (!project) return
    setPlannedLoading(true)
    try {
      const all = await listExpenses(project.id)
      setPlannedRows(all.filter(expenseIsPlanned))
    } catch (e) {
      console.error(e)
      setPlannedRows([])
    } finally {
      setPlannedLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (step === 'pick' && project) void loadPlanned()
  }, [step, project, loadPlanned])

  const showPicker = !editing && pickPlannedForNewSpend && formVariant !== 'plannedOnly' && step === 'pick'
  const canBackToPick = !editing && pickPlannedForNewSpend && step === 'form' && !linkToPlanned

  const title = showPicker
    ? 'New spend'
    : formVariant === 'plannedOnly'
      ? 'New planned cost'
      : editingRow
        ? 'Edit expense'
        : effectiveLink
          ? 'Record spend'
          : 'New expense'

  return (
    <div
      className="fixed inset-0 z-[280] flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-white overscroll-x-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="relative shrink-0 flex w-full min-w-0 max-w-full items-center justify-center border-b border-slate-100 bg-white px-3 h-12">
        <button
          type="button"
          onClick={() => {
            if (canBackToPick) {
              setStep('pick')
              setPickedPlan(null)
            } else onClose()
          }}
          className="absolute left-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
          aria-label={canBackToPick ? 'Back' : 'Close'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[17px] font-bold text-slate-900">{title}</h1>
      </header>

      {showPicker ? (
        <ExpensePlannedPickStep
          layout="mobile"
          planned={plannedRows}
          loading={plannedLoading}
          onPick={(row) => {
            setPickedPlan(row)
            setStep('form')
          }}
          onSkip={() => setStep('form')}
        />
      ) : (
        <>
          <form
            id="expense-form-mobile"
            onSubmit={save}
            onDragOver={(ev) => ev.preventDefault()}
            onDrop={(ev) => {
              ev.preventDefault()
              handleDroppedFiles(ev.dataTransfer.files)
            }}
            className="min-h-0 min-w-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain overscroll-x-none"
          >
            <div className="box-border w-full min-w-0 max-w-full space-y-5 px-4 pt-4 pb-4">
              <div className="box-border w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <label htmlFor="expense-amount-mobile" className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                  Amount
                </label>
                <div className="relative mt-1 flex w-full min-w-0 max-w-full items-baseline justify-center gap-1">
                  <span className="shrink-0 text-[22px] font-light text-slate-400">₪</span>
                  <input
                    id="expense-amount-mobile"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="min-w-0 max-w-full flex-1 bg-transparent text-center text-[36px] font-bold text-slate-900 outline-none box-border placeholder:text-slate-300"
                    placeholder="0"
                    required
                    autoFocus
                    autoComplete="transaction-amount"
                  />
                </div>
              </div>

              <div className="min-w-0 max-w-full space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider px-0.5">Vendor</label>
                  <input
                    dir="auto"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Where did you pay?"
                    className="box-border w-full min-w-0 max-w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:ring-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider px-0.5">Category</label>
                  <input
                    dir="auto"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Materials, Labor"
                    className="box-border w-full min-w-0 max-w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:ring-inset"
                  />
                </div>
                <div className="min-w-0 max-w-full space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider px-0.5">Date</label>
                  <div className="min-w-0 max-w-full">
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider px-0.5">Payment</label>
                  <input
                    dir="auto"
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    placeholder="Card, cash, transfer…"
                    className="box-border w-full min-w-0 max-w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3.5 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:ring-inset"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider px-0.5">Notes</label>
                  <textarea
                    dir="auto"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional details"
                    rows={3}
                    className="box-border w-full min-w-0 max-w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[16px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 focus:ring-inset"
                  />
                </div>
              </div>

              <div className="box-border w-full min-w-0 max-w-full space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 p-3">
                <div className="flex min-w-0 max-w-full items-center justify-between gap-2 px-0.5">
                  <span className="text-[13px] font-bold text-slate-600 uppercase tracking-wider">Receipts</span>
                  <span className="text-[13px] text-slate-400">Tap to add</span>
                </div>

                {editingRow?.receipt_storage_path && (
                  <a
                    href={renovationPublicUrl(editingRow.receipt_storage_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[14px] font-semibold text-emerald-700"
                  >
                    Open legacy receipt
                  </a>
                )}

                {editingRow?.id && attachments.length > 0 && (
                  <ul className="space-y-2">
                    {attachments.map((att) => (
                      <li key={att.id} className="flex min-w-0 max-w-full items-center gap-2 min-h-[44px] rounded-xl border border-slate-100 bg-white px-2">
                        <a
                          href={att.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0 truncate text-[14px] font-semibold text-emerald-700"
                          dir="auto"
                        >
                          {att.file_name}
                        </a>
                        <button type="button" onClick={() => removeAttachment(att)} className="shrink-0 text-[13px] font-bold text-rose-600 px-2 py-1">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pendingFiles.length > 0 && (
                  <ul className="space-y-2">
                    <p className="text-[13px] text-slate-500 font-semibold px-0.5">Uploads after save</p>
                    {pendingFiles.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="flex min-w-0 max-w-full items-center justify-between gap-2 min-h-[44px] rounded-xl border border-slate-100 bg-white px-2">
                        <span className="truncate text-[14px] font-medium text-slate-800" dir="auto">
                          {f.name}
                        </span>
                        <button type="button" onClick={() => removePendingAt(i)} className="shrink-0 text-[13px] font-bold text-slate-500">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <label className="relative flex items-center justify-center w-full min-h-[48px] rounded-xl bg-white border border-slate-200 text-[15px] font-bold text-emerald-700 active:bg-slate-50 overflow-hidden">
                  <span className="pointer-events-none">{uploadingAttach ? 'Uploading…' : '+ Add photos or files'}</span>
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
          </form>

          <div className="box-border flex w-full min-w-0 max-w-full shrink-0 gap-3 border-t border-slate-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[52px] min-w-0 flex-1 rounded-xl border border-slate-200 text-[16px] font-bold text-slate-700 active:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form-mobile"
              disabled={saving || uploadingAttach}
              className="flex min-h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[16px] font-bold text-white shadow-md shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-50"
            >
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
