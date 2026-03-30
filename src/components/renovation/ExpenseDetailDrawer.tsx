'use client'

import React, { useState, useEffect, useRef } from 'react'
import { deleteExpense, updateExpense, renovationPublicUrl } from '@/lib/renovation'
import { formatDateDisplay, formatIls } from '@/lib/renovation-format'
import type { RenovationExpense } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'
import { useExpenseForm } from '@/components/renovation/useExpenseForm'
import { DatePicker } from '@/components/renovation/DatePicker'

export interface ExpenseDetailDrawerProps {
  expense: RenovationExpense
  onClose: () => void
  onSaved: () => void
  onAttachmentsChanged?: () => void
  onDeleted: () => void
}

export function ExpenseDetailDrawer({
  expense,
  onClose,
  onSaved,
  onAttachmentsChanged,
  onDeleted,
}: ExpenseDetailDrawerProps) {
  const confirmAction = useConfirm()
  const [deleting, setDeleting] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingAmount, setEditingAmount] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  
  const [titleDraft, setTitleDraft] = useState(expense.vendor || '')
  const [amountDraft, setAmountDraft] = useState(String(expense.amount))
  const [notesDraft, setNotesDraft] = useState(expense.notes || '')
  
  const [detailPickerOpen, setDetailPickerOpen] = useState<'category' | 'date' | 'payment' | null>(null)
  const categoryPickerRef = useRef<HTMLDivElement>(null)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const paymentPickerRef = useRef<HTMLDivElement>(null)
  
  const [categoryDraft, setCategoryDraft] = useState(expense.category || '')
  const [paymentDraft, setPaymentDraft] = useState(expense.payment_method || '')

  const form = useExpenseForm({
    editing: expense,
    onSave: onSaved,
    onAttachmentsChanged,
  })
  const { attachments, uploadingAttach, onFilesSelectedForEdit, handleDroppedFiles, removeAttachment } = form

  useEffect(() => {
    setTitleDraft(expense.vendor || '')
    setAmountDraft(String(expense.amount))
    setNotesDraft(expense.notes || '')
    setCategoryDraft(expense.category || '')
    setPaymentDraft(expense.payment_method || '')
  }, [expense])

  useEffect(() => {
    if (!detailPickerOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (detailPickerOpen === 'category' && categoryPickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'date' && datePickerRef.current?.contains(n)) return
      if (detailPickerOpen === 'payment' && paymentPickerRef.current?.contains(n)) return
      setDetailPickerOpen(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailPickerOpen(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [detailPickerOpen])

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

  const commitTitle = async () => {
    setEditingTitle(false)
    const v = titleDraft.trim() || null
    if (v === expense.vendor) {
      setTitleDraft(expense.vendor || '')
      return
    }
    await updateExpense(expense.id, { vendor: v }).catch(console.error)
    onSaved()
  }

  const commitAmount = async () => {
    setEditingAmount(false)
    const n = Number(amountDraft.replace(/,/g, ''))
    if (Number.isNaN(n) || n === Number(expense.amount)) {
      setAmountDraft(String(expense.amount))
      return
    }
    await updateExpense(expense.id, { amount: n }).catch(console.error)
    onSaved()
  }

  const commitNotes = async () => {
    setEditingNotes(false)
    const n = notesDraft.trim() || null
    if (n === expense.notes) {
      setNotesDraft(expense.notes || '')
      return
    }
    await updateExpense(expense.id, { notes: n }).catch(console.error)
    onSaved()
  }

  const commitCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDetailPickerOpen(null)
    const c = categoryDraft.trim() || null
    if (c === expense.category) return
    await updateExpense(expense.id, { category: c }).catch(console.error)
    onSaved()
  }

  const commitPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setDetailPickerOpen(null)
    const p = paymentDraft.trim() || null
    if (p === expense.payment_method) return
    await updateExpense(expense.id, { payment_method: p }).catch(console.error)
    onSaved()
  }

  const commitDate = async (newDate: string) => {
    setDetailPickerOpen(null)
    if (newDate === expense.expense_date) return
    await updateExpense(expense.id, { expense_date: newDate }).catch(console.error)
    onSaved()
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none z-[200] transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-y-0 right-0 z-[210] w-[100vw] md:w-[576px] lg:w-[720px] bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)] flex flex-col transition-transform animate-slide-in-right"
        onDragOver={(ev) => ev.preventDefault()}
        onDrop={(ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          handleDroppedFiles(ev.dataTransfer.files)
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <button
                type="button"
                className="group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 focus:outline-none"
              >
                <span className="rounded px-2 py-1 text-[12px] font-bold uppercase text-[#42526e] bg-[#dfe1e6]">
                  EXPENSE
                </span>
                <svg
                  className="h-4 w-4 shrink-0 text-[#5e6c84] opacity-70 transition-opacity group-hover:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <span className="truncate font-mono text-[13px] font-semibold uppercase tracking-widest text-[#5e6c84]">
              {expense.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert('Double-click text fields to edit inline')
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md text-[14px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors ml-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-[65%] shrink-0 px-8 py-6 space-y-6 bg-white">
            <div className="space-y-4">
              {editingTitle ? (
                <textarea
                  autoFocus
                  dir="rtl"
                  className="w-full text-right text-[24px] font-medium text-[#172b4d] leading-snug rounded px-2 py-1 outline-none resize-none bg-slate-100 shadow-inner block"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(expense.vendor || '') }
                  }}
                  rows={2}
                />
              ) : (
                <h1 
                  className="text-right text-[24px] font-medium text-[#172b4d] leading-snug break-words px-2 py-1 hover:bg-slate-50 cursor-text rounded transition-colors block" 
                  dir="rtl"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double click to edit"
                >
                  {expense.vendor || 'General Expense'}
                </h1>
              )}
              
              <div 
                className="flex items-center justify-end px-2"
              >
                {editingAmount ? (
                  <div className="flex items-center gap-2 relative bg-slate-100 rounded shadow-inner px-2 py-1">
                    <span className="text-[28px] font-bold text-slate-800">₪</span>
                    <input
                      autoFocus
                      type="text"
                      inputMode="decimal"
                      dir="ltr"
                      className="w-[150px] text-right text-[28px] font-bold text-slate-800 leading-none outline-none bg-transparent placeholder:text-slate-300"
                      value={amountDraft}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        const parts = val.split('.')
                        if (parts.length > 2) return
                        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                        if (parts[1]?.length > 2) parts[1] = parts[1].slice(0, 2)
                        setAmountDraft(parts.join('.'))
                      }}
                      onBlur={commitAmount}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commitAmount() }
                        if (e.key === 'Escape') { setEditingAmount(false); setAmountDraft(String(expense.amount)) }
                      }}
                    />
                  </div>
                ) : (
                  <span 
                    className="text-[28px] font-bold text-[#172b4d] tabular-nums leading-none px-2 py-1 hover:bg-slate-50 cursor-text rounded transition-colors" 
                    onDoubleClick={() => setEditingAmount(true)}
                    title="Double click to edit amount"
                  >
                    {formatIls(Number(expense.amount))}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-[15px] font-medium text-[#172b4d] mb-4 text-left">Description</h2>
              {editingNotes ? (
                <div className="px-2">
                  <textarea
                    autoFocus
                    dir="rtl"
                    className="w-full text-right text-[14px] leading-relaxed text-[#172b4d] bg-slate-100 rounded-md outline-none p-3 resize-y min-h-[160px] shadow-inner"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setEditingNotes(false); setNotesDraft(expense.notes || '') }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitNotes() }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 flex-row-reverse">
                    <span className="text-[11px] text-slate-400 font-medium px-1" dir="rtl">טיפ: לחץ Cmd/Ctrl + Enter לשמירה</span>
                    <div className="flex justify-start gap-2 flex-row-reverse">
                      <button onClick={commitNotes} className="px-3 py-1.5 rounded-md bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold text-[13px] transition-colors shadow-sm">Save</button>
                      <button onClick={() => { setEditingNotes(false); setNotesDraft(expense.notes || '') }} className="px-3 py-1.5 rounded-md hover:bg-slate-100 font-semibold text-slate-600 text-[13px] transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
               ) : expense.notes ? (
                 <div 
                   className="text-[14px] text-right leading-relaxed text-[#172b4d] whitespace-pre-wrap hover:bg-slate-50 p-2 rounded-md cursor-text transition-colors" 
                   dir="rtl"
                   onDoubleClick={() => setEditingNotes(true)}
                   title="Double click to edit"
                 >
                   {expense.notes}
                 </div>
              ) : (
                <div 
                  className="text-[14px] text-right text-slate-500 hover:bg-slate-50 cursor-pointer p-3 rounded-md transition-colors flex items-center justify-end gap-2 font-medium"
                  dir="rtl"
                  onDoubleClick={() => setEditingNotes(true)}
                  onClick={() => setEditingNotes(true)}
                  title="Double click to edit"
                >
                  Add a description...
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </div>
              )}
            </div>

            <div className="px-2 pt-6">
              <h2 className="text-[15px] font-medium text-[#172b4d] mb-4 text-left">Attachments</h2>
              <div className="space-y-3">
                {expense.receipt_storage_path && (
                  <div className="flex items-center gap-2 text-[13px]">
                    <a
                      href={renovationPublicUrl(expense.receipt_storage_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-indigo-600 hover:text-indigo-800 underline transition-colors"
                    >
                      View Original Receipt (legacy)
                    </a>
                  </div>
                )}
                {attachments.length > 0 && (
                  <ul className="grid grid-cols-1 gap-2">
                    {attachments.map((att) => (
                      <li key={att.id} className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-[13px] group hover:border-slate-300 transition-colors shadow-sm">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <a
                          href={att.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex-1 truncate font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                          dir="auto"
                        >
                          {att.file_name}
                        </a>
                        <button type="button" onClick={() => removeAttachment(att)} className="shrink-0 text-[12px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="relative flex min-h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-indigo-300 transition-all text-[14px] font-semibold text-slate-500 hover:text-indigo-600 shadow-sm group">
                  <div className="flex items-center gap-2">
                    {uploadingAttach ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600/30 border-t-indigo-600" />
                    ) : (
                      <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    )}
                    <span className="pointer-events-none select-none">{uploadingAttach ? 'Uploading…' : 'Drop files here or choose'}</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    disabled={!!uploadingAttach}
                    onChange={(ev) => {
                      const list = ev.target.files
                      if (list) void onFilesSelectedForEdit(list)
                      ev.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

          </div>

          <div className="w-full md:w-[35%] shrink-0 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6">
            <div className="space-y-6">
              <h3 className="text-[12px] font-semibold text-[#5e6c84] uppercase tracking-wider">Details</h3>
              
              <div className="grid grid-cols-1 gap-5">
                
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-medium text-[#5e6c84]">Category</span>
                  <div className="relative" ref={categoryPickerRef}>
                    <button
                      type="button"
                      onClick={() => setDetailPickerOpen((o) => (o === 'category' ? null : 'category'))}
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left -mx-2 transition-colors hover:bg-slate-200/50 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff]/50 focus-visible:ring-offset-0"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-dashed border-[#dfe1e6] shadow-sm">
                         <span className="text-[10px] text-slate-400 font-bold">{expense.category ? expense.category[0].toUpperCase() : '?'}</span>
                      </div>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-[#172b4d]" dir="auto">
                        {expense.category || <span className="text-[#5e6c84]">No category</span>}
                      </span>
                    </button>
                    {detailPickerOpen === 'category' && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200/80 bg-white/98 p-2 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in origin-top">
                        <form onSubmit={commitCategory} className="flex flex-col gap-2">
                          <input autoFocus dir="auto" value={categoryDraft} onChange={(e) => setCategoryDraft(e.target.value)} placeholder="Category..." className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#4c9aff]/50 transition-all font-medium text-[#172b4d]" />
                          <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white text-[13px] font-semibold rounded py-1.5 transition-colors">Save</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-medium text-[#5e6c84]">Expense Date</span>
                  <div className="relative" ref={datePickerRef}>
                    <button
                      type="button"
                      onClick={() => setDetailPickerOpen((o) => (o === 'date' ? null : 'date'))}
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left -mx-2 transition-colors hover:bg-slate-200/50 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff]/50 focus-visible:ring-offset-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] text-[#172b4d]" dir="auto">
                        {formatDateDisplay(expense.expense_date)}
                      </span>
                    </button>
                    {detailPickerOpen === 'date' && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200/80 bg-white/98 p-2 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in origin-top">
                        <DatePicker value={expense.expense_date} onChange={commitDate} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] font-medium text-[#5e6c84]">Payment</span>
                  <div className="relative" ref={paymentPickerRef}>
                    <button
                      type="button"
                      onClick={() => setDetailPickerOpen((o) => (o === 'payment' ? null : 'payment'))}
                      className="group flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left -mx-2 transition-colors hover:bg-slate-200/50 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff]/50 focus-visible:ring-offset-0"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-dashed border-[#dfe1e6] shadow-sm">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      </div>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-[#172b4d]" dir="auto">
                        {expense.payment_method || <span className="text-[#5e6c84]">No provider</span>}
                      </span>
                    </button>
                    {detailPickerOpen === 'payment' && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-slate-200/80 bg-white/98 p-2 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in origin-top">
                        <form onSubmit={commitPayment} className="flex flex-col gap-2">
                          <input autoFocus dir="auto" value={paymentDraft} onChange={(e) => setPaymentDraft(e.target.value)} placeholder="Payment method..." className="w-full text-[14px] bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#4c9aff]/50 transition-all font-medium text-[#172b4d]" />
                          <button type="submit" className="w-full bg-[#0052cc] hover:bg-[#0047b3] text-white text-[13px] font-semibold rounded py-1.5 transition-colors">Save</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-200/60 pt-5 mt-4">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md font-semibold text-[13px] transition-colors"
                >
                  Delete Expense
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </>
  )
}
