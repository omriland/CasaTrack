'use client'

import { useEffect, useState } from 'react'
import { DatePicker } from '@/components/renovation/DatePicker'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { useRenovationMobileMedia } from '@/components/renovation/use-renovation-mobile'
import {
  CALENDAR_DATETIME_LOCAL_STEP_SEC,
  endsAtPreservingDuration,
  fromDatetimeLocal,
  toDatetimeLocalValue,
} from '@/lib/calendar-datetime'
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from '@/lib/renovation'
import { CalendarEventPayloadSchema, type CalendarEventPayload } from '@/lib/validation'
import type { CalendarEventType, RenovationCalendarEvent, RenovationProvider } from '@/types/renovation'

const selectField =
  'box-border w-full min-w-0 max-w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[16px] font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/20'

function defaultDayStartIso(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number)
  if (!y || !m || !d) return new Date().toISOString()
  return new Date(y, m - 1, d, 9, 0, 0, 0).toISOString()
}

type Props = {
  open: boolean
  projectId: string
  providers: RenovationProvider[]
  editing: RenovationCalendarEvent | null
  /** When creating from a day cell */
  initialDayKey: string | null
  /** When creating from week grid drag (timed) */
  initialTimedRange: { start: string; end: string } | null
  onClose: () => void
  onSaved: () => void
}

export function CalendarEventModal({
  open,
  projectId,
  providers,
  editing,
  initialDayKey,
  initialTimedRange,
  onClose,
  onSaved,
}: Props) {
  const isMobile = useRenovationMobileMedia()
  const { activeProfile } = useRenovation()
  const [eventType, setEventType] = useState<CalendarEventType>('general')
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [body, setBody] = useState('')
  const [providerId, setProviderId] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setEventType(editing.event_type)
      setTitle(editing.title)
      setAddress(editing.address?.trim() ? editing.address : '')
      setBody(editing.body || '')
      setProviderId(editing.provider_id || '')
      setIsAllDay(editing.is_all_day)
      if (editing.is_all_day) {
        setStartDate(editing.start_date || '')
        setEndDate(editing.end_date && editing.end_date !== editing.start_date ? editing.end_date : '')
      } else {
        setStartDate('')
        setEndDate('')
        setStartLocal(editing.starts_at ? toDatetimeLocalValue(editing.starts_at) : '')
        setEndLocal(editing.ends_at ? toDatetimeLocalValue(editing.ends_at) : '')
      }
    } else if (initialTimedRange) {
      setEventType('general')
      setTitle('')
      setAddress('')
      setBody('')
      setProviderId('')
      setIsAllDay(false)
      setStartDate('')
      setEndDate('')
      setStartLocal(toDatetimeLocalValue(initialTimedRange.start))
      setEndLocal(toDatetimeLocalValue(initialTimedRange.end))
    } else {
      setEventType('general')
      setTitle('')
      setAddress('')
      setBody('')
      setProviderId('')
      const day = initialDayKey || ''
      if (day) {
        setIsAllDay(true)
        setStartDate(day)
        setEndDate('')
        setStartLocal(toDatetimeLocalValue(defaultDayStartIso(day)))
        setEndLocal('')
      } else {
        setIsAllDay(false)
        setStartDate('')
        setEndDate('')
        const now = new Date()
        now.setMinutes(0, 0, 0)
        setStartLocal(toDatetimeLocalValue(now.toISOString()))
        now.setHours(now.getHours() + 1)
        setEndLocal(toDatetimeLocalValue(now.toISOString()))
      }
    }
  }, [open, editing, initialDayKey, initialTimedRange])

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload: CalendarEventPayload = {
      event_type: eventType,
      title: title.trim(),
      body: body.trim() || null,
      address: address.trim() || null,
      provider_id: eventType === 'provider_meeting' ? providerId || null : null,
      is_all_day: isAllDay,
      start_date: isAllDay ? startDate || null : null,
      end_date: isAllDay && endDate.trim() ? endDate.trim() : null,
      starts_at: !isAllDay && startLocal ? fromDatetimeLocal(startLocal) : null,
      ends_at: !isAllDay && endLocal.trim() ? fromDatetimeLocal(endLocal.trim()) : null,
    }
    const parsed = CalendarEventPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
      const first = Object.values(msg).flat()[0]
      setError(first || 'Check the form')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateCalendarEvent(editing.id, {
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
      } else {
        await createCalendarEvent(projectId, {
          event_type: parsed.data.event_type,
          title: parsed.data.title,
          body: parsed.data.body,
          address: parsed.data.address ?? null,
          provider_id: parsed.data.provider_id,
          created_by_member_id: activeProfile?.id ?? null,
          is_all_day: parsed.data.is_all_day,
          start_date: parsed.data.start_date,
          end_date: parsed.data.end_date,
          starts_at: parsed.data.starts_at,
          ends_at: parsed.data.ends_at,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing || !window.confirm('Delete this event?')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteCalendarEvent(editing.id)
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not delete.')
    } finally {
      setDeleting(false)
    }
  }

  const formBody = (
    <form id="calendar-event-form" onSubmit={submit} className="space-y-4">
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</label>
        <select
          value={eventType}
          onChange={(e) => {
            const t = e.target.value as CalendarEventType
            setEventType(t)
            if (t === 'general') setProviderId('')
          }}
          className={`${selectField} mt-1`}
        >
          <option value="general">General</option>
          <option value="provider_meeting">Meeting with provider</option>
        </select>
      </div>

      {eventType === 'provider_meeting' && (
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Provider</label>
          <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={`${selectField} mt-1`} required>
            <option value="">Select…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${selectField} mt-1`}
          placeholder="Event title"
          required
        />
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`${selectField} mt-1`}
          placeholder="Optional — address or location"
        />
      </div>

      {editing?.created_by && (
        <p className="text-[12px] font-medium text-slate-500" dir="auto">
          Created by <span className="font-semibold text-slate-700">{editing.created_by.name}</span>
        </p>
      )}

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Notes</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className={`${selectField} mt-1 min-h-[88px] resize-y py-2 text-[15px]`}
          placeholder="Optional"
        />
      </div>

      <label className="flex items-center gap-2 text-[14px] font-semibold text-slate-700">
        <input type="checkbox" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="rounded border-slate-300" />
        All day
      </label>

      {isAllDay ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Start date</p>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">End date (optional)</p>
            <DatePicker value={endDate} onChange={setEndDate} placeholder="Same as start" />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Starts</label>
            <input
              type="datetime-local"
              step={CALENDAR_DATETIME_LOCAL_STEP_SEC}
              value={startLocal}
              onChange={(e) => {
                const next = e.target.value
                if (!next) {
                  setStartLocal('')
                  return
                }
                if (startLocal.trim() && endLocal.trim()) {
                  const newEndIso = endsAtPreservingDuration(
                    fromDatetimeLocal(startLocal),
                    fromDatetimeLocal(endLocal.trim()),
                    fromDatetimeLocal(next)
                  )
                  setEndLocal(toDatetimeLocalValue(newEndIso))
                } else if (!endLocal.trim()) {
                  const startD = new Date(fromDatetimeLocal(next))
                  startD.setHours(startD.getHours() + 1)
                  setEndLocal(toDatetimeLocalValue(startD.toISOString()))
                }
                setStartLocal(next)
              }}
              className={`${selectField} mt-1`}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ends (optional)</label>
            <input
              type="datetime-local"
              step={CALENDAR_DATETIME_LOCAL_STEP_SEC}
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className={`${selectField} mt-1`}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || deleting}
          className="h-11 rounded-full bg-indigo-600 px-6 text-[15px] font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : editing ? 'Save' : 'Add event'}
        </button>
        {editing && (
          <button
            type="button"
            disabled={saving || deleting}
            onClick={handleDelete}
            className="h-11 rounded-full border border-rose-200 bg-white px-5 text-[14px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[280] flex w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-white overscroll-x-none"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <header className="relative flex h-12 w-full shrink-0 items-center justify-center border-b border-slate-100 bg-white px-3">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-[17px] font-bold text-slate-900">{editing ? 'Edit event' : 'New event'}</h1>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{formBody}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-zoom-in"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <h2 className="text-[15px] font-bold text-slate-800">{editing ? 'Edit event' : 'New event'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6">{formBody}</div>
      </div>
    </div>
  )
}
