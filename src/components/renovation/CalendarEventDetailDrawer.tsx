'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DatePicker } from '@/components/renovation/DatePicker'
import { deleteCalendarEvent, updateCalendarEvent } from '@/lib/renovation'
import { CalendarEventPayloadSchema, type CalendarEventPayload } from '@/lib/validation'
import { memberAvatarChipStyle, memberAvatarLetter } from '@/lib/member-avatar'
import type { CalendarEventType, RenovationCalendarEvent, RenovationProvider } from '@/types/renovation'
import { format, parseISO } from 'date-fns'

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(s: string): string {
  return new Date(s).toISOString()
}

function defaultTimedEnd(startIso: string): string {
  const d = new Date(startIso)
  d.setHours(d.getHours() + 1)
  return d.toISOString()
}

type DetailPicker = 'type' | 'provider' | null

const EVENT_TYPE_LABEL: Record<CalendarEventType, string> = {
  general: 'General',
  provider_meeting: 'Provider meeting',
}

function payloadFromEvent(e: RenovationCalendarEvent): CalendarEventPayload {
  return {
    event_type: e.event_type,
    title: e.title,
    body: e.body,
    address: e.address,
    provider_id: e.event_type === 'provider_meeting' ? e.provider_id : null,
    is_all_day: e.is_all_day,
    start_date: e.start_date,
    end_date: e.end_date && e.end_date !== e.start_date ? e.end_date : null,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
  }
}

export interface CalendarEventDetailDrawerProps {
  event: RenovationCalendarEvent
  providers: RenovationProvider[]
  onClose: () => void
  onUpdated: () => void
}

export function CalendarEventDetailDrawer({
  event,
  providers,
  onClose,
  onUpdated,
}: CalendarEventDetailDrawerProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const [titleDraft, setTitleDraft] = useState(event.title)
  const [bodyDraft, setBodyDraft] = useState(event.body || '')
  const [addressDraft, setAddressDraft] = useState(event.address?.trim() ? event.address : '')
  const [detailPicker, setDetailPicker] = useState<DetailPicker>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typePickerRef = useRef<HTMLDivElement>(null)
  const providerPickerRef = useRef<HTMLDivElement>(null)

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [providers],
  )

  useEffect(() => {
    setTitleDraft(event.title)
    setBodyDraft(event.body || '')
    setAddressDraft(event.address?.trim() ? event.address : '')
    setError(null)
    setEditingTitle(false)
    setEditingBody(false)
    setDetailPicker(null)
  }, [event])

  useEffect(() => {
    if (!detailPicker) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailPicker(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailPicker])

  useEffect(() => {
    if (!detailPicker) return
    const onMouseDown = (e: MouseEvent) => {
      const n = e.target as Node
      if (detailPicker === 'type' && typePickerRef.current?.contains(n)) return
      if (detailPicker === 'provider' && providerPickerRef.current?.contains(n)) return
      setDetailPicker(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [detailPicker])

  const persist = async (patch: Partial<CalendarEventPayload>) => {
    setError(null)
    const base = payloadFromEvent(event)
    const next = { ...base, ...patch }
    const parsed = CalendarEventPayloadSchema.safeParse(next)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      setError(Object.values(msg).flat()[0] || 'Check the form')
      return
    }
    setSaving(true)
    try {
      await updateCalendarEvent(event.id, {
        event_type: parsed.data.event_type,
        title: parsed.data.title,
        body: parsed.data.body,
        address: parsed.data.address ?? null,
        provider_id: parsed.data.provider_id,
        is_all_day: parsed.data.is_all_day,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at,
      })
      onUpdated()
    } catch (err) {
      console.error(err)
      setError('Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const commitTitle = () => {
    setEditingTitle(false)
    const t = titleDraft.trim()
    if (!t || t === event.title) {
      setTitleDraft(event.title)
      return
    }
    void persist({ title: t })
  }

  const commitBody = () => {
    setEditingBody(false)
    const b = bodyDraft.trim() || null
    if (b === event.body) {
      setBodyDraft(event.body || '')
      return
    }
    void persist({ body: b })
  }

  const commitAddress = () => {
    const a = addressDraft.trim() || null
    if (a === (event.address?.trim() || null)) return
    void persist({ address: a })
  }

  const commitEventType = (eventType: CalendarEventType) => {
    setDetailPicker(null)
    if (eventType === event.event_type) return
    void persist({
      event_type: eventType,
      provider_id: eventType === 'provider_meeting' ? event.provider_id : null,
    })
  }

  const commitProvider = (providerId: string | null) => {
    setDetailPicker(null)
    if (providerId === event.provider_id) return
    void persist({ provider_id: providerId })
  }

  const commitAllDay = (isAllDay: boolean) => {
    if (isAllDay === event.is_all_day) return
    if (isAllDay) {
      const day =
        event.start_date ||
        (event.starts_at ? format(parseISO(event.starts_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
      void persist({
        is_all_day: true,
        start_date: day,
        end_date: null,
        starts_at: null,
        ends_at: null,
      })
    } else {
      const startIso = event.starts_at || new Date().toISOString()
      void persist({
        is_all_day: false,
        start_date: null,
        end_date: null,
        starts_at: startIso,
        ends_at: event.ends_at || defaultTimedEnd(startIso),
      })
    }
  }

  const providerResolved =
    event.provider ?? (event.provider_id ? sortedProviders.find((p) => p.id === event.provider_id) ?? null : null)

  let lastEditedLabel = event.updated_at
  try {
    lastEditedLabel = format(parseISO(event.updated_at), "MMM d, yyyy '·' HH:mm")
  } catch {
    /* keep raw */
  }

  let whenSummary = '—'
  try {
    whenSummary = event.is_all_day
      ? event.end_date && event.end_date !== event.start_date
        ? `${event.start_date} → ${event.end_date}`
        : (event.start_date ?? '—')
      : event.starts_at
        ? `${format(parseISO(event.starts_at), 'MMM d, yyyy HH:mm')}${event.ends_at ? ` – ${format(parseISO(event.ends_at), 'HH:mm')}` : ''}`
        : '—'
  } catch {
    /* keep — */
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this event?')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCalendarEvent(event.id)
      onUpdated()
      onClose()
    } catch (e) {
      console.error(e)
      setError('Could not delete.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-slate-900/20 backdrop-blur-sm transition-opacity animate-fade-in md:bg-transparent md:backdrop-blur-none"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-[210] flex w-[100vw] md:w-[576px] lg:w-[720px] animate-slide-in-right flex-col bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0" ref={typePickerRef}>
              <button
                type="button"
                onClick={() => setDetailPicker((o) => (o === 'type' ? null : 'type'))}
                className="group flex cursor-pointer items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                aria-haspopup="listbox"
                aria-expanded={detailPicker === 'type'}
              >
                <span
                  className={`rounded px-2 py-1 text-[12px] font-bold uppercase ${
                    event.event_type === 'provider_meeting'
                      ? 'bg-[#f3e8ff] text-[#6b21a8]'
                      : 'bg-[#dfe1e6] text-[#42526e]'
                  }`}
                >
                  {EVENT_TYPE_LABEL[event.event_type]}
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
              {detailPicker === 'type' && (
                <div
                  className="absolute left-0 top-full z-40 mt-1 w-[220px] overflow-hidden rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                  role="listbox"
                >
                  {(['general', 'provider_meeting'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="option"
                      aria-selected={event.event_type === t}
                      onClick={() => commitEventType(t)}
                      className={`mb-0.5 flex w-full items-center rounded-md px-3 py-2.5 text-left text-[14px] font-medium transition-colors last:mb-0 ${
                        event.event_type === t
                          ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {EVENT_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="truncate font-mono text-[13px] font-semibold uppercase tracking-widest text-slate-500">
              {event.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving || deleting}
              onClick={() => void handleDelete()}
              className="rounded-md px-3 py-1.5 text-[14px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="border-b border-rose-100 bg-rose-50 px-6 py-2 text-[13px] font-semibold text-rose-700" role="alert">
            {error}
          </div>
        )}

        <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto md:flex-row">
          <div className="w-full shrink-0 space-y-6 px-8 py-6 md:w-[65%]">
            <div className="space-y-4">
              {editingTitle ? (
                <textarea
                  autoFocus
                  dir="auto"
                  className="w-full resize-none rounded bg-slate-100 px-2 py-1 text-right text-[24px] font-bold leading-snug text-[#172b4d] shadow-inner outline-none"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={() => commitTitle()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void commitTitle()
                    }
                    if (e.key === 'Escape') {
                      setEditingTitle(false)
                      setTitleDraft(event.title)
                    }
                  }}
                  rows={2}
                />
              ) : (
                <h1
                  className="cursor-text rounded px-2 py-1 text-right text-[24px] font-bold leading-snug text-[#172b4d] break-words transition-colors hover:bg-slate-50"
                  dir="auto"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double click to edit"
                >
                  {event.title}
                </h1>
              )}
            </div>

            <div>
              <h2 className="mb-2 px-2 text-[14px] font-bold text-[#172b4d]">Notes</h2>
              {editingBody ? (
                <div className="px-2">
                  <textarea
                    autoFocus
                    dir="auto"
                    className="min-h-[140px] w-full resize-y rounded-md bg-slate-100 p-3 text-right text-[14px] leading-relaxed text-[#172b4d] shadow-inner outline-none"
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingBody(false)
                        setBodyDraft(event.body || '')
                      }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        void commitBody()
                      }
                    }}
                  />
                  <div className="mt-2 flex flex-row-reverse justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => void commitBody()}
                      className="rounded-md bg-[#0052cc] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0047b3]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBody(false)
                        setBodyDraft(event.body || '')
                      }}
                      className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : event.body ? (
                <div
                  className="cursor-text whitespace-pre-wrap rounded-md p-2 text-right text-[14px] leading-relaxed text-[#172b4d] transition-colors hover:bg-slate-50"
                  dir="auto"
                  onDoubleClick={() => setEditingBody(true)}
                  title="Double click to edit"
                >
                  {event.body}
                </div>
              ) : (
                <div
                  className="mx-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 p-3 text-right text-[14px] font-medium text-slate-500 transition-colors hover:bg-slate-50"
                  dir="auto"
                  onClick={() => setEditingBody(true)}
                >
                  Add notes…
                </div>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 border-t border-slate-200 bg-slate-50 p-6 md:w-[35%] md:border-l md:border-t-0">
            <div className="space-y-5">
              <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-[#5e6c84]">Details</h3>
              <div className="grid grid-cols-1 gap-4">
                {event.event_type === 'provider_meeting' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Provider</span>
                    <div className="relative" ref={providerPickerRef}>
                      <button
                        type="button"
                        onClick={() => setDetailPicker((o) => (o === 'provider' ? null : 'provider'))}
                        className="group -mx-2 flex w-full max-w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#dfe1e6]/80 focus:outline-none focus-visible:bg-[#dfe1e6]/80 focus-visible:ring-2 focus-visible:ring-[#4c9aff] focus-visible:ring-offset-0"
                      >
                        {providerResolved ? (
                          <>
                            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                              <span className="leading-none">{providerResolved.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#172b4d]" dir="auto">
                              {providerResolved.name}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-[#dfe1e6] bg-white">
                              <svg
                                className="h-3.5 w-3.5 text-[#a5adba]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>
                            <span className="text-[14px] font-medium italic text-slate-500">Select provider</span>
                          </>
                        )}
                        <svg
                          className="ml-auto h-4 w-4 shrink-0 text-[#5e6c84] opacity-0 transition-opacity group-hover:opacity-70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {detailPicker === 'provider' && (
                        <div
                          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
                          role="listbox"
                        >
                          {sortedProviders.map((pr) => (
                            <button
                              key={pr.id}
                              type="button"
                              role="option"
                              aria-selected={event.provider_id === pr.id}
                              onClick={() => commitProvider(pr.id)}
                              className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                                event.provider_id === pr.id
                                  ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                                  : 'font-medium text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                                <span className="leading-none">{pr.name.charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="truncate" dir="auto">
                                {pr.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Address</span>
                  <input
                    type="text"
                    dir="auto"
                    value={addressDraft}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    onBlur={() => void commitAddress()}
                    placeholder="Location or address"
                    className="-mx-2 w-full max-w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[14px] font-medium text-[#172b4d] outline-none transition-colors placeholder:text-slate-400 focus:border-slate-200 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">All day</span>
                  <label className="flex cursor-pointer items-center gap-2 px-0.5">
                    <input
                      type="checkbox"
                      checked={event.is_all_day}
                      onChange={(e) => commitAllDay(e.target.checked)}
                      className="rounded border-slate-300 text-[#0052cc] focus:ring-[#4c9aff]"
                    />
                    <span className="text-[14px] font-medium text-[#172b4d]">All-day event</span>
                  </label>
                </div>

                {event.is_all_day ? (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="mb-1 block text-[13px] font-semibold text-[#5e6c84]">Start date</span>
                      <DatePicker
                        value={event.start_date || ''}
                        onChange={(v) => {
                          if (!v || v === event.start_date) return
                          void persist({
                            is_all_day: true,
                            start_date: v,
                            end_date:
                              event.end_date && event.end_date >= v ? event.end_date : null,
                            starts_at: null,
                            ends_at: null,
                          })
                        }}
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-[13px] font-semibold text-[#5e6c84]">End date (optional)</span>
                      <DatePicker
                        value={
                          event.end_date && event.end_date !== event.start_date ? event.end_date : ''
                        }
                        onChange={(v) => {
                          void persist({
                            is_all_day: true,
                            start_date: event.start_date || undefined,
                            end_date: v.trim() ? v.trim() : null,
                            starts_at: null,
                            ends_at: null,
                          })
                        }}
                        placeholder="Same as start"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="mb-1 block text-[13px] font-semibold text-[#5e6c84]">Starts</span>
                      <input
                        type="datetime-local"
                        value={event.starts_at ? toDatetimeLocalValue(event.starts_at) : ''}
                        onChange={(e) => {
                          const v = e.target.value
                          if (!v) return
                          const iso = fromDatetimeLocal(v)
                          void persist({
                            is_all_day: false,
                            start_date: null,
                            end_date: null,
                            starts_at: iso,
                            ends_at: event.ends_at || defaultTimedEnd(iso),
                          })
                        }}
                        className="box-border w-full min-h-[40px] rounded-md border border-slate-200 bg-white px-2 py-2 text-[14px] font-semibold text-[#172b4d] shadow-sm focus:border-[#4c9aff] focus:outline-none focus:ring-1 focus:ring-[#4c9aff]"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-[13px] font-semibold text-[#5e6c84]">Ends (optional)</span>
                      <input
                        type="datetime-local"
                        value={event.ends_at ? toDatetimeLocalValue(event.ends_at) : ''}
                        onChange={(e) => {
                          const v = e.target.value
                          void persist({
                            is_all_day: false,
                            start_date: null,
                            end_date: null,
                            starts_at: event.starts_at!,
                            ends_at: v.trim() ? fromDatetimeLocal(v.trim()) : defaultTimedEnd(event.starts_at!),
                          })
                        }}
                        className="box-border w-full min-h-[40px] rounded-md border border-slate-200 bg-white px-2 py-2 text-[14px] font-semibold text-[#172b4d] shadow-sm focus:border-[#4c9aff] focus:outline-none focus:ring-1 focus:ring-[#4c9aff]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-4">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Summary</span>
                  <p className="text-[13px] font-medium text-[#42526e] tabular-nums" dir="auto">
                    {whenSummary}
                  </p>
                </div>

                {event.created_by && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Created by</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold shadow-sm"
                        style={memberAvatarChipStyle(event.created_by.name)}
                      >
                        <span className="leading-none">{memberAvatarLetter(event.created_by.name)}</span>
                      </div>
                      <span className="text-[14px] font-medium text-[#172b4d]" dir="auto">
                        {event.created_by.name}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Last edited</span>
                  <time dateTime={event.updated_at} className="text-[14px] font-medium text-[#172b4d] tabular-nums">
                    {lastEditedLabel}
                  </time>
                </div>
              </div>
            </div>

            {saving && (
              <p className="mt-4 text-center text-[12px] font-semibold text-[#5e6c84]">Saving…</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
