'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createExpense,
  updateExpense,
  listExpenseAttachmentsForExpense,
  uploadExpenseAttachment,
  deleteExpenseAttachment,
  renovationPublicUrl,
} from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import type { RenovationExpense, RenovationExpenseAttachment } from '@/types/renovation'

interface ExpenseModalProps {
  editing?: RenovationExpense | null
  onClose: () => void
  onSave: () => void
  onAttachmentsChanged?: () => void
}

export function ExpenseModal({ editing, onClose, onSave, onAttachmentsChanged }: ExpenseModalProps) {
  const { project } = useRenovation()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('')
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<RenovationExpenseAttachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingAttach, setUploadingAttach] = useState(false)

  const loadAttachments = useCallback(async () => {
    if (!editing?.id) {
      setAttachments([])
      return
    }
    try {
      setAttachments(await listExpenseAttachmentsForExpense(editing.id))
    } catch (e) {
      console.error(e)
    }
  }, [editing?.id])

  useEffect(() => {
    if (editing) {
      setAmount(
        String(editing.amount)
          .split('.')
          .map((part, i) => (i === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : part))
          .join('.')
      )
      setDate(editing.expense_date)
      setVendor(editing.vendor || '')
      setCategory(editing.category || '')
      setNotes(editing.notes || '')
      setPayment(editing.payment_method || '')
    } else {
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setVendor('')
      setCategory('')
      setNotes('')
      setPayment('')
    }
    setPendingFiles([])
  }, [editing])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const handleAmountChange = (val: string) => {
    const raw = val.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    if (parts.length > 2) return
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if (parts[1]?.length > 2) {
      parts[1] = parts[1].slice(0, 2)
    }
    setAmount(parts.join('.'))
  }

  const attachPendingToExpenseId = async (expenseId: string) => {
    if (!project || pendingFiles.length === 0) return
    for (const f of pendingFiles) {
      await uploadExpenseAttachment(project.id, expenseId, f)
    }
    setPendingFiles([])
  }

  const onFilesSelectedForNew = (files: FileList | null) => {
    if (!files?.length) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
  }

  const onFilesSelectedForEdit = async (files: FileList | null) => {
    if (!project || !editing?.id || !files?.length) return
    setUploadingAttach(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadExpenseAttachment(project.id, editing.id, files[i]!)
      }
      await loadAttachments()
      onAttachmentsChanged?.()
    } catch (e) {
      console.error(e)
      alert('Could not upload file(s). Run 05_expense_attachments.sql and ensure renovation-files bucket exists.')
    } finally {
      setUploadingAttach(false)
    }
  }

  const removePendingAt = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeAttachment = async (att: RenovationExpenseAttachment) => {
    if (!confirm('Remove this file from the expense?')) return
    try {
      await deleteExpenseAttachment(att)
      await loadAttachments()
      onAttachmentsChanged?.()
    } catch (e) {
      console.error(e)
      alert('Could not remove file')
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    const n = Number(amount.replace(/,/g, ''))
    if (Number.isNaN(n)) return
    setSaving(true)
    try {
      if (editing) {
        await updateExpense(editing.id, {
          amount: n,
          expense_date: date,
          vendor: vendor || null,
          category: category || null,
          notes: notes || null,
          payment_method: payment || null,
        })
        await attachPendingToExpenseId(editing.id)
        await loadAttachments()
      } else {
        const created = await createExpense(project.id, {
          amount: n,
          expense_date: date,
          vendor: vendor || null,
          category: category || null,
          notes: notes || null,
          payment_method: payment || null,
        })
        await attachPendingToExpenseId(created.id)
      }
      onAttachmentsChanged?.()
      onSave()
    } catch (err) {
      console.error(err)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        onDragOver={(ev) => ev.preventDefault()}
        onDrop={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          if (editing?.id) onFilesSelectedForEdit(ev.dataTransfer.files)
          else onFilesSelectedForNew(ev.dataTransfer.files)
        }}
        className="w-full md:max-w-[480px] bg-white rounded-t-[2rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col pt-2 md:pt-0 animate-fade-in-up md:animate-zoom-in"
      >
        <div className="px-6 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2 md:hidden" />
          <h2 className="text-[18px] md:text-[20px] font-bold text-slate-800 tracking-tight mt-2 md:mt-0">{editing ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200 mt-2 md:mt-0 active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={save} className="p-6 overflow-y-auto max-h-[85vh] space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col items-center justify-center py-2 md:py-4">
            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</label>
            <div className="relative group inline-block">
              <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[32px] md:text-[40px] font-light text-slate-300">₪</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-[200px] md:w-[240px] bg-transparent text-center text-[48px] md:text-[54px] font-bold text-slate-800 outline-none px-4 py-2 placeholder-slate-200 transition-all"
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
              <input dir="auto" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Store name..." className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Category</label>
              <input dir="auto" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Materials..." className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Date</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment</label>
              <input dir="auto" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="Credit, Cash..." className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes</label>
            <textarea dir="auto" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any extra details..." rows={2} className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
          </div>

          {/* Attachments */}
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Files & receipts</label>
              <span className="text-[11px] text-slate-400">Drop files here or choose</span>
            </div>

            {editing?.receipt_storage_path && (
              <div className="flex items-center gap-2 text-[13px]">
                <a
                  href={renovationPublicUrl(editing.receipt_storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Legacy receipt (gallery)
                </a>
              </div>
            )}

            {editing?.id && attachments.length > 0 && (
              <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                {attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-2 text-[13px] bg-white rounded-lg px-2 py-1.5 border border-slate-100">
                    <a href={att.public_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-indigo-600 font-medium hover:underline" dir="auto">
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
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between text-[13px] bg-white rounded-lg px-2 py-1 border border-slate-100">
                    <span className="truncate" dir="auto">{f.name}</span>
                    <button type="button" onClick={() => removePendingAt(i)} className="text-slate-400 hover:text-rose-500 text-[12px]">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="inline-flex items-center justify-center w-full h-10 rounded-lg bg-white border border-slate-200 text-[14px] font-semibold text-indigo-600 cursor-pointer hover:bg-slate-50">
              {uploadingAttach ? 'Uploading…' : '+ Add files'}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={!!uploadingAttach || saving}
                onChange={(ev) => {
                  if (editing?.id) void onFilesSelectedForEdit(ev.target.files)
                  else onFilesSelectedForNew(ev.target.files)
                  ev.target.value = ''
                }}
              />
            </label>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploadingAttach} className="flex-1 h-12 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
