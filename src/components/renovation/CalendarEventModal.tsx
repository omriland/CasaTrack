'use client'

import { useEffect, useRef, useState } from 'react'
import { AlignLeft, Calendar as CalendarIcon, ClipboardList, Clock, MapPin, Users, X } from 'lucide-react'
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
  initialDayKey: string | null
  initialTimedRange: { start: string; end: string } | null
  /** Optional pre-filled title (carried over from quick-create). */
  initialTitle?: string
  onClose: () => void
  onSaved: () => void
}

const inputBase =
  'box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[14px] font-medium text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 placeholder:text-slate-400'

function FieldRow({
  icon,
  children,
  align = 'center',
}: {
  icon: React.ReactNode
  children: React.ReactNode
  align?: 'center' | 'top'
}) {
  return (
    <div className={`flex gap-3 ${align === 'top' ? 'items-start pt-1' : 'items-center'}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center text-slate-400">{icon}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function CalendarEventModal({
  open,
  projectId,
  providers,
  editing,
  initialDayKey,
  initialTimedRange,
  initialTitle = '',
  onClose,
  onSaved,
}: Props) {
  const isMobile = useRenovationMobileMedia()
  const { activeProfile } = useRenovation()
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [body, setBody] = useState('')
  const [providerId, setProviderId] = useState('')
  const [isSupervision, setIsSupervision] = useState(false)
  const [isAllDay, setIsAllDay] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (editing) {
      setTitle(editing.title)
      setAddress(editing.address?.trim() ? editing.address : '')
      setBody(editing.body || '')
      setProviderId(editing.provider_id ?? '')
      setIsSupervision(editing.event_type === 'supervision')
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
      setTitle(initialTitle)
      setAddress('')
      setBody('')
      setProviderId('')
      setIsSupervision(false)
      setIsAllDay(false)
      setStartDate('')
      setEndDate('')
      setStartLocal(toDatetimeLocalValue(initialTimedRange.start))
      setEndLocal(toDatetimeLocalValue(initialTimedRange.end))
    } else {
      setTitle(initialTitle)
      setAddress('')
      setBody('')
      setProviderId('')
      setIsSupervision(false)
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
    // Autofocus the title field for new events.
    if (editing) return
    const t = setTimeout(() => titleRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [open, editing, initialDayKey, initialTimedRange, initialTitle])

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const eventType: CalendarEventType = isSupervision
      ? 'supervision'
      : providerId.trim()
        ? 'provider_meeting'
        : 'general'
    const payload: CalendarEventPayload = {
      event_type: eventType,
      title: title.trim(),
      body: body.trim() || null,
      address: address.trim() || null,
      provider_id: eventType === 'provider_meeting' ? providerId.trim() || null : null,
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

  const sortedProviders = [...providers].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  )

  const formBody = (
    <form id="calendar-event-form" onSubmit={submit} className="flex flex-col gap-1">
      {error && (
        <p className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-700" role="alert">
          {error}
        </p>
      )}

      {/* Title — borderless headline */}
      <div className="mb-1 px-1">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-0 border-b-2 border-transparent bg-transparent pb-2 pt-1 text-[22px] font-bold leading-tight text-slate-900 outline-none transition-colors placeholder:font-semibold placeholder:text-slate-300 focus:border-indigo-500"
          placeholder="Add title"
          required
          dir="auto"
        />
      </div>

      {/* All-day toggle */}
      <FieldRow icon={<Clock className="h-4 w-4" />}>
        <label className="flex cursor-pointer items-center gap-3">
          <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="peer sr-only"
            />
            <span className="block h-5 w-9 rounded-full bg-slate-200 transition-colors peer-checked:bg-indigo-600" />
            <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </span>
          <span className="text-[14px] font-semibold text-slate-700">All day</span>
        </label>
      </FieldRow>

      {/* Date / time */}
      {isAllDay ? (
        <FieldRow icon={<CalendarIcon className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Start</p>
              <DatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">End (optional)</p>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Same as start" />
            </div>
          </div>
        </FieldRow>
      ) : (
        <FieldRow icon={<CalendarIcon className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Starts</p>
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
                      fromDatetimeLocal(next),
                    )
                    setEndLocal(toDatetimeLocalValue(newEndIso))
                  } else if (!endLocal.trim()) {
                    const startD = new Date(fromDatetimeLocal(next))
                    startD.setHours(startD.getHours() + 1)
                    setEndLocal(toDatetimeLocalValue(startD.toISOString()))
                  }
                  setStartLocal(next)
                }}
                className={inputBase}
                required
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Ends</p>
              <input
                type="datetime-local"
                step={CALENDAR_DATETIME_LOCAL_STEP_SEC}
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>
        </FieldRow>
      )}

      {/* Supervision (mutually exclusive with provider meeting) */}
      <FieldRow icon={<ClipboardList className="h-4 w-4" />}>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isSupervision}
            onChange={(e) => {
              const on = e.target.checked
              setIsSupervision(on)
              if (on) setProviderId('')
            }}
            className="h-4 w-4 rounded border-slate-300 text-lime-600 focus:ring-indigo-500"
          />
          <span className="text-[14px] font-semibold text-slate-700">Supervision</span>
        </label>
      </FieldRow>

      {/* Provider */}
      {sortedProviders.length > 0 && (
        <FieldRow icon={<Users className="h-4 w-4" />}>
          <select
            value={providerId}
            disabled={isSupervision}
            onChange={(e) => {
              setProviderId(e.target.value)
              if (e.target.value) setIsSupervision(false)
            }}
            className={`${inputBase} appearance-none bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='12'%20height='12'%20fill='none'%20stroke='%2364748b'%20stroke-width='2'%20viewBox='0%200%2024%2024'%3e%3cpath%20stroke-linecap='round'%20stroke-linejoin='round'%20d='m6%209%206%206%206-6'/%3e%3c/svg%3e")] bg-[length:12px_12px] bg-[right_0.85rem_center] bg-no-repeat pr-9 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="">No provider — general event</option>
            {sortedProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FieldRow>
      )}

      {/* Address */}
      <FieldRow icon={<MapPin className="h-4 w-4" />}>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputBase}
          placeholder="Add location"
          dir="auto"
        />
      </FieldRow>

      {/* Notes */}
      <FieldRow icon={<AlignLeft className="h-4 w-4" />} align="top">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className={`${inputBase} min-h-[88px] resize-y`}
          placeholder="Add a description"
          dir="auto"
        />
      </FieldRow>

      {editing?.created_by && (
        <p className="mt-3 px-1 text-[12px] font-medium text-slate-500" dir="auto">
          Created by <span className="font-semibold text-slate-700">{editing.created_by.name}</span>
        </p>
      )}
    </form>
  )

  const footer = (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-5 py-3">
      <div>
        {editing && (
          <button
            type="button"
            disabled={saving || deleting}
            onClick={handleDelete}
            className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-500 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="calendar-event-form"
          disabled={saving || deleting}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save' : 'Add event'}
        </button>
      </div>
    </div>
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
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">{formBody}</div>
        {footer}
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.4)] animate-zoom-in"
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <h2 className="text-[15px] font-bold text-slate-800">{editing ? 'Edit event' : 'New event'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{formBody}</div>
        {footer}
      </div>
    </div>
  )
}
