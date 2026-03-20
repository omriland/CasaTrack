'use client'

import { useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createProvider, deleteProvider, updateProvider } from '@/lib/renovation'
import type { RenovationProvider } from '@/types/renovation'

export function ProviderFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  initial: RenovationProvider | null
  onClose: () => void
  onSaved: () => void
}) {
  const { project } = useRenovation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setName(initial.name)
      setDescription(initial.description || '')
      setPhone(initial.phone || '')
      setEmail(initial.email || '')
      setAdditionalInfo(initial.additional_info || '')
    } else {
      setName('')
      setDescription('')
      setPhone('')
      setEmail('')
      setAdditionalInfo('')
    }
    setConfirmDelete(false)
  }, [open, initial])

  if (!open) return null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !name.trim()) return
    setSaving(true)
    try {
      if (initial) {
        await updateProvider(initial.id, {
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          additional_info: additionalInfo.trim() || null,
        })
      } else {
        await createProvider(project.id, {
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          additional_info: additionalInfo.trim() || null,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Could not save. Run 07_providers.sql in Supabase if you have not yet.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!initial) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    try {
      await deleteProvider(initial.id)
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      alert('Could not delete')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[280] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm md:z-[100] md:items-center md:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="flex w-full max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl animate-fade-in-up md:max-h-[90vh] md:max-w-[480px] md:rounded-2xl md:animate-zoom-in"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <h2 className="text-[16px] font-bold text-slate-800">{initial ? 'Edit provider' : 'New provider'}</h2>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80 md:min-h-0 md:min-w-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          onSubmit={save}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Name</label>
            <input
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Company or contact name"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Description</label>
            <textarea
              dir="auto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[15px] text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              placeholder="What they do — e.g. electrical, plumbing…"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone</label>
              <input
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 tabular-nums"
                placeholder="050-0000000"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
              <input
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[16px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Additional info</label>
            <input
              dir="auto"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="mt-1 w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Short note — license #, hours, language…"
            />
          </div>
          <div className="flex gap-3 pt-2">
            {initial && (
              <button
                type="button"
                onClick={remove}
                className={`h-12 shrink-0 rounded-xl flex items-center justify-center px-4 font-bold transition-all ${
                  confirmDelete ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}
              >
                {confirmDelete ? 'Tap again' : 'Delete'}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
