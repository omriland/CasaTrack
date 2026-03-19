'use client'

import React, { useState, useEffect } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createExpense, updateExpense } from '@/lib/renovation'
import { DatePicker } from '@/components/renovation/DatePicker'
import type { RenovationExpense } from '@/types/renovation'

interface ExpenseModalProps {
  editing?: RenovationExpense | null
  onClose: () => void
  onSave: () => void
}

export function ExpenseModal({ editing, onClose, onSave }: ExpenseModalProps) {
  const { project } = useRenovation()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('')
  const [saving, setSaving] = useState(false)

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
    }
  }, [editing])

  const handleAmountChange = (val: string) => {
    const raw = val.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    if (parts.length > 2) return // Prevent multiple dots
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    // Limits decimal to 2 places if typed
    if (parts[1]?.length > 2) {
      parts[1] = parts[1].slice(0, 2)
    }
    
    setAmount(parts.join('.'))
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
      } else {
        await createExpense(project.id, {
          amount: n,
          expense_date: date,
          vendor: vendor || null,
          category: category || null,
          notes: notes || null,
          payment_method: payment || null,
        })
      }
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
        className="w-full md:max-w-[480px] bg-white rounded-t-xl md:rounded-lg shadow-2xl overflow-hidden flex flex-col pt-2 md:pt-0 animate-fade-in-up md:animate-zoom-in"
      >
        {/* Header */}
        <div className="px-6 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2 md:hidden" />
          <h2 className="text-[18px] md:text-[20px] font-bold text-slate-800 tracking-tight mt-2 md:mt-0">{editing ? 'Edit Expense' : 'New Expense'}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200 mt-2 md:mt-0 active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={save} className="p-6 overflow-y-auto max-h-[85vh] space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          
          {/* Giant Amount Field */}
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

          {/* Grid 1: Vendor & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Vendor</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <input dir="auto" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Store name..." className="w-full h-11 pl-10 pr-3 rounded bg-slate-50 text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Category</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <input dir="auto" value={category} onChange={e => setCategory(e.target.value)} placeholder="Materials..." className="w-full h-11 pl-10 pr-3 rounded bg-slate-50 text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white" />
              </div>
            </div>
          </div>

          {/* Grid 2: Date & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Date</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <DatePicker value={date} onChange={setDate} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
                <input dir="auto" value={payment} onChange={e => setPayment(e.target.value)} placeholder="Credit, Cash..." className="w-full h-11 pl-10 pr-3 rounded bg-slate-50 text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes</label>
            <div className="relative">
               <div className="absolute left-3.5 top-3.5 text-slate-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
               </div>
               <textarea dir="auto" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any extra details..." rows={2} className="w-full pl-10 pr-3 py-3 rounded bg-slate-50 text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white resize-none" />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-12 rounded bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
