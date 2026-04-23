'use client'

import { useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createProvider, deleteProvider, updateProvider } from '@/lib/renovation'
import type { RenovationProvider } from '@/types/renovation'

const labelClass =
  'block px-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#70757a]'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-[15px] font-medium text-[#111] outline-none transition-shadow placeholder:text-[#9aa0a6] focus:border-black/20 focus:ring-2 focus:ring-blue-500/20'

const PROFORM_ID = 'renovation-provider-form'

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

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

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
    <div className="fixed inset-0 z-[220] flex" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#0f172a]/[0.18] transition-opacity"
        onClick={onClose}
        aria-label="Close panel"
      />
      <div className="pointer-events-none absolute inset-0 flex max-md:items-end md:justify-end">
        <div
          onClick={(ev) => ev.stopPropagation()}
          className="pointer-events-auto flex w-full max-w-full flex-col border-black/[0.06] bg-white max-md:mt-auto max-md:h-auto max-md:max-h-[min(92dvh,calc(100dvh-1rem))] max-md:rounded-t-2xl max-md:shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] max-md:animate-fade-in-up md:h-full md:max-w-[min(440px,38%)] md:border-l md:shadow-[-8px_0_48px_-12px_rgba(0,0,0,0.12)] md:animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-form-title"
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-5 py-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#c4b5fd] text-[17px] font-bold leading-none text-white">
              ?
            </div>
            <h2 id="provider-form-title" className="min-w-0 flex-1 text-[17px] font-bold tracking-[-0.02em] text-[#0f172a]">
              {initial ? 'Edit provider' : 'New provider'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[#5f6368] transition-colors hover:bg-black/[0.04] hover:text-[#111]"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form
            id={PROFORM_ID}
            onSubmit={save}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
              <div>
                <label className={labelClass} htmlFor="prov-name">Name</label>
                <input
                  id="prov-name"
                  dir="auto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={fieldClass}
                  placeholder="Company or contact name"
                  required
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="prov-desc">Description</label>
                <input
                  id="prov-desc"
                  dir="auto"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={fieldClass}
                  placeholder="What they do — e.g. electrical, plumbing"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                <div>
                  <label className={labelClass} htmlFor="prov-phone">Phone</label>
                  <input
                    id="prov-phone"
                    dir="ltr"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${fieldClass} tabular-nums`}
                    placeholder="050-0000000"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="prov-email">Email</label>
                  <input
                    id="prov-email"
                    dir="ltr"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="prov-notes">Notes</label>
                <textarea
                  id="prov-notes"
                  dir="auto"
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  rows={4}
                  className={`${fieldClass} min-h-[100px] resize-y text-[14px] leading-relaxed`}
                  placeholder="License #, hours, language, referral"
                />
              </div>
              {initial && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={remove}
                    className={`text-[13px] font-semibold underline-offset-2 transition-colors ${
                      confirmDelete ? 'text-rose-700' : 'text-rose-600/80 hover:text-rose-700'
                    }`}
                  >
                    {confirmDelete ? 'Tap again to delete' : 'Delete provider'}
                  </button>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-black/[0.06] bg-white px-5 py-4">
              <div className="flex items-stretch gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 shrink-0 rounded-lg border border-black/10 bg-white px-5 text-[14px] font-semibold text-[#111] transition-colors hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 min-w-0 flex-1 rounded-lg bg-[#0f172a] text-[14px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save provider'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
