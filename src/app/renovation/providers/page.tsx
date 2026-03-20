'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createProvider, deleteProvider, listProviders, updateProvider } from '@/lib/renovation'
import type { RenovationProvider } from '@/types/renovation'

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase()
  const p = parts[0] || '?'
  return p.slice(0, 2).toUpperCase()
}

function sectionKey(name: string): string {
  const t = name.trim()
  if (!t) return '#'
  const c = t[0]!.toLocaleUpperCase('en-US')
  if (/[A-Z]/.test(c)) return c
  if (/[0-9]/.test(c)) return '#'
  return c
}

function sortSectionKeys(a: string, b: string) {
  if (a === '#') return 1
  if (b === '#') return -1
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

function matchesQuery(p: RenovationProvider, q: string): boolean {
  if (!q.trim()) return true
  const n = q.trim().toLowerCase()
  const hay = [p.name, p.description, p.phone, p.email, p.additional_info]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(n)
}

/** Stable pastel from name for avatar */
function avatarTint(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 360
  return `hsl(${h} 55% 92%)`
}

function avatarTextColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * (i + 1)) % 360
  return `hsl(${h} 45% 32%)`
}

function ProviderFormModal({
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
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="w-full md:max-w-[480px] bg-white rounded-t-[2rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up md:animate-zoom-in"
      >
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <h2 className="text-[16px] font-bold text-slate-800">{initial ? 'Edit provider' : 'New provider'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/80"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={save} className="p-5 overflow-y-auto space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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

export default function RenovationProvidersPage() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RenovationProvider | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      setItems(await listProviders(project.id))
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => items.filter((p) => matchesQuery(p, search)), [items, search])

  const grouped = useMemo(() => {
    const m = new Map<string, RenovationProvider[]>()
    for (const p of filtered) {
      const k = sectionKey(p.name)
      const list = m.get(k) || []
      list.push(p)
      m.set(k, list)
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    }
    return [...m.entries()].sort((a, b) => sortSectionKeys(a[0], b[0]))
  }, [filtered])

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <Link href="/renovation" className="text-indigo-600 font-medium">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 animate-fade-in-up">
      <header className="space-y-1">
        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Contacts</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[30px] md:text-[34px] font-bold tracking-tight text-slate-900">Providers</h1>
            <p className="text-[15px] text-slate-500 mt-0.5 max-w-md">
              Service providers and contractors — link them to tasks from the task form.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="h-11 px-5 rounded-full bg-indigo-600 text-white text-[14px] font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all shrink-0"
          >
            + Add provider
          </button>
        </div>
      </header>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email, notes…"
          className="w-full h-14 pl-12 pr-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm text-[16px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[4.5rem] bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white/80 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <p className="font-bold text-slate-700">No providers yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Add plumbers, electricians, and others — then attach them to tasks.</p>
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="mt-6 text-indigo-600 font-bold text-[14px] bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full"
          >
            + Add your first provider
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-500 py-12 text-[15px]">No matches for “{search.trim()}”.</p>
      ) : (
        <div className="space-y-6 pt-1">
          {grouped.map(([letter, rows]) => (
            <section key={letter}>
              <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 mb-2">
                <span className="text-[13px] font-extrabold text-indigo-600 tabular-nums">{letter}</span>
              </div>
              <ul className="space-y-2">
                {rows.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p)
                        setModalOpen(true)
                      }}
                      className="w-full text-left flex items-stretch gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:border-indigo-200 hover:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.15)] active:scale-[0.99] transition-all group"
                    >
                      <div
                        className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-[15px] font-extrabold tracking-tight shadow-inner"
                        style={{ backgroundColor: avatarTint(p.name), color: avatarTextColor(p.name) }}
                      >
                        {initials(p.name)}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-[16px] font-bold text-slate-900 truncate" dir="auto">
                          {p.name}
                        </p>
                        {p.description && (
                          <p className="text-[13px] text-slate-500 line-clamp-2 mt-0.5" dir="auto">
                            {p.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[12px] font-semibold">
                          {p.phone && (
                            <a
                              href={`tel:${p.phone.replace(/\s/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 hover:text-indigo-500 tabular-nums inline-flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              {p.phone}
                            </a>
                          )}
                          {p.email && (
                            <a
                              href={`mailto:${p.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 hover:text-indigo-500 truncate max-w-[200px]"
                            >
                              {p.email}
                            </a>
                          )}
                        </div>
                        {p.additional_info && (
                          <p className="text-[11px] text-slate-400 mt-1.5 font-medium line-clamp-1" dir="auto">
                            {p.additional_info}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 self-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ProviderFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSaved={load}
      />

      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(79,70,229,0.4)]"
          aria-label="Add provider"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
