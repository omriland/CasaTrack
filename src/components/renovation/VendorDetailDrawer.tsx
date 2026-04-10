'use client'

import { useState, useEffect } from 'react'
import { 
  updateVendorExpenseMeta, 
  listExpenseAttachmentsForExpenses, 
  ensureVendorExpenseForAttachments, 
  uploadExpenseAttachment, 
  deleteExpenseAttachment,
  renovationPublicUrl
} from '@/lib/renovation'
import type { VendorBudgetRowModel } from '@/lib/renovation-vendor-budget'
import type { RenovationExpenseAttachment } from '@/types/renovation'

export interface VendorDetailDrawerProps {
  projectId: string
  vendorRow: VendorBudgetRowModel
  onClose: () => void
  onSaved: () => void
}

export function VendorDetailDrawer({ projectId, vendorRow, onClose, onSaved }: VendorDetailDrawerProps) {
  const [vendor, setVendor] = useState(vendorRow.displayVendor)
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('')

  const [saving, setSaving] = useState(false)
  const [uploadingAttach, setUploadingAttach] = useState(false)
  const [attachments, setAttachments] = useState<RenovationExpenseAttachment[]>([])

  // Find the first expense to seed the initial form values
  useEffect(() => {
    const defaultEx = vendorRow.plannedChronological[0] ?? vendorRow.spentChronological[0]
    setCategory(defaultEx?.category ?? '')
    setNotes(defaultEx?.notes ?? '')
    setPayment(defaultEx?.payment_method ?? '')
  }, [vendorRow])

  // Load attachments
  const loadAttachments = async () => {
    const ids = [
      ...vendorRow.plannedChronological.map(e => e.id),
      ...vendorRow.spentChronological.map(e => e.id)
    ]
    if (ids.length === 0) {
      setAttachments([])
      return
    }
    const atts = await listExpenseAttachmentsForExpenses(ids)
    setAttachments(atts)
  }

  useEffect(() => {
    void loadAttachments()
  }, [vendorRow])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateVendorExpenseMeta(projectId, vendorRow.displayVendor, {
        category: category.trim() || null,
        notes: notes.trim() || null,
        payment_method: payment.trim() || null
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Could not save vendor details')
    } finally {
      setSaving(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!vendorRow.displayVendor.trim()) {
      alert('Vendor must have a name before attaching files.')
      return
    }
    setUploadingAttach(true)
    try {
      const targetId = await ensureVendorExpenseForAttachments(projectId, vendorRow.displayVendor)
      const list = Array.from(files)
      for (const f of list) {
        await uploadExpenseAttachment(projectId, targetId, f)
      }
      await loadAttachments()
      onSaved() // notify parent 
    } catch (err) {
      console.error(err)
      alert('Could not upload files')
    } finally {
      setUploadingAttach(false)
    }
  }

  const removeAttachment = async (att: RenovationExpenseAttachment) => {
    if (!confirm('Delete this file?')) return
    try {
      await deleteExpenseAttachment(att)
      setAttachments(a => a.filter(x => x.id !== att.id))
      onSaved()
    } catch (e) {
      console.error(e)
      alert('Failed to delete file')
    }
  }

  // See if any legacy receipt paths exist
  const legacyReceipts = [
    ...vendorRow.plannedChronological,
    ...vendorRow.spentChronological
  ].map(e => e.receipt_storage_path).filter(Boolean) as string[]

  return (
    <>
      <div className="animate-fade-in fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-sm transition-opacity md:bg-transparent md:backdrop-blur-none" onClick={onClose} aria-hidden />
      <div className="animate-slide-in-right fixed inset-y-0 right-0 z-[210] flex w-[100vw] flex-col bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)] md:w-[480px] lg:w-[500px]">
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Vendor Group</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100" aria-label="Close">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="w-full min-w-0 text-right leading-tight">
            <p className="text-[22px] font-bold tracking-tight text-slate-900" dir="auto">{vendorRow.displayVendor || 'New Vendor'}</p>
          </div>
        </header>

        <form onSubmit={save} onDragOver={ev => ev.preventDefault()} onDrop={ev => { ev.preventDefault(); handleFiles(ev.dataTransfer.files) }} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Title</label>
                <input dir="auto" value={vendor} onChange={e => setVendor(e.target.value)} disabled className="opacity-60 h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-800 shadow-sm" />
                <p className="px-1 text-[10px] text-slate-400">Edit directly in grid to rename</p>
              </div>
              <div className="space-y-1.5">
                <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Vendor</label>
                <input dir="auto" value={category} onChange={e => setCategory(e.target.value)} placeholder="Materials..." className="h-11 w-full rounded border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Notes (applies to all items for this vendor)</label>
              <textarea dir="auto" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any extra details..." rows={3} className="w-full resize-none rounded border border-slate-200 bg-slate-50 px-3 py-3 text-[14px] font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>

            <div className="space-y-3 rounded border border-dashed border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Files & receipts</span>
                <span className="text-[11px] text-slate-400">Drop files here or choose</span>
              </div>

              {legacyReceipts.map((path, i) => (
                <div key={i} className="flex items-center gap-2 text-[13px]">
                  <a href={renovationPublicUrl(path)} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Legacy receipt (gallery)</a>
                </div>
              ))}

              {attachments.length > 0 && (
                <ul className="max-h-32 space-y-1.5 overflow-y-auto">
                  {attachments.map(att => (
                    <li key={att.id} className="flex items-center gap-2 rounded border border-slate-100 bg-white px-2 py-1.5 text-[13px]">
                      <a href={att.public_url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-medium text-indigo-600 hover:underline" dir="auto">{att.file_name}</a>
                      <button type="button" onClick={() => removeAttachment(att)} className="shrink-0 text-[12px] font-bold text-rose-500 hover:underline">Remove</button>
                    </li>
                  ))}
                </ul>
              )}

              <label className="relative flex min-h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded border border-slate-200 bg-white py-2 text-[14px] font-semibold text-indigo-600 shadow-sm hover:bg-slate-50">
                <span className="pointer-events-none select-none">{uploadingAttach ? 'Uploading…' : '+ Add files'}</span>
                <input type="file" multiple className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0" disabled={!!uploadingAttach || saving} onChange={ev => { handleFiles(ev.target.files); ev.target.value = '' }} />
              </label>
            </div>

          </div>
          <div className="flex shrink-0 gap-3 border-t border-slate-200 bg-white px-5 py-4 md:px-6">
            <button type="button" onClick={onClose} className="h-12 flex-[0.8] rounded-lg border border-slate-200 bg-white text-[15px] font-bold text-slate-600 transition-colors hover:bg-slate-50 active:scale-[0.99]">Close</button>
            <button type="submit" disabled={saving || uploadingAttach} className="flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-[15px] font-bold text-white disabled:opacity-50">
              {saving ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Save Details'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
