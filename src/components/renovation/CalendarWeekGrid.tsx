'use client'

import { addDays, format } from 'date-fns'
import { useCallback, useRef, useState } from 'react'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import {
  CAL_WEEK_SLOT_END_HOUR,
  CAL_WEEK_SLOT_START_HOUR,
  calendarEventOnLocalDay,
  dayKey,
  isWeekendFriSat,
  snapCalendarMinutes,
  taskDueOnLocalDay,
  timedEventLayoutForDay,
} from '@/components/renovation/calendar-shared'
import { updateCalendarEvent } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

const SNAP_MIN = 15

function yToMinutes(y: number, colH: number): number {
  const frac = Math.max(0, Math.min(1, y / colH))
  return (
    CAL_WEEK_SLOT_START_HOUR * 60 + frac * (CAL_WEEK_SLOT_END_HOUR - CAL_WEEK_SLOT_START_HOUR) * 60
  )
}

function minutesOnDayToDate(day: Date, minutesFromMidnight: number): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const h = Math.floor(minutesFromMidnight / 60)
  const m = minutesFromMidnight % 60
  d.setHours(h, m, 0, 0)
  return d
}

function slotBounds(day: Date): { start: Date; end: Date } {
  const d0 = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  return {
    start: new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), CAL_WEEK_SLOT_START_HOUR, 0, 0, 0),
    end: new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), CAL_WEEK_SLOT_END_HOUR, 0, 0, 0),
  }
}

type Props = {
  weekStart: Date
  events: RenovationCalendarEvent[]
  tasks: RenovationTask[]
  showTasks: boolean
  onEditEvent: (e: RenovationCalendarEvent) => void
  onEditTask: (t: RenovationTask) => void
  onCreateTimedRange: (startIso: string, endIso: string) => void
  onEventUpdated: () => void
  /** Narrower gutters + shorter grid for mobile */
  compact?: boolean
}

export function CalendarWeekGrid({
  weekStart,
  events,
  tasks,
  showTasks,
  onEditEvent,
  onEditTask,
  onCreateTimedRange,
  onEventUpdated,
  compact = false,
}: Props) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const gridPx = compact ? 560 : 720
  const gutterW = compact ? 40 : 52
  /** Same template on all-day + time rows so columns stay pixel-aligned (flex-1 + min-width:auto caused wider header cells). */
  const gridCols = `${gutterW}px repeat(7, minmax(0, 1fr))`
  const titleSizeTimed = compact ? 'text-[11px]' : 'text-[12px]'
  const addressSizeTimed = compact ? 'text-[10px]' : 'text-[11px]'
  const titleSizeAllDay = compact ? 'text-[11px]' : 'text-[12px]'
  const addressSizeAllDay = compact ? 'text-[10px]' : 'text-[11px]'
  const totalSlotMin = (CAL_WEEK_SLOT_END_HOUR - CAL_WEEK_SLOT_START_HOUR) * 60

  const [draft, setDraft] = useState<{ day: Date; top: number; height: number } | null>(null)
  const createRef = useRef<{
    day: Date
    col: HTMLElement
    y0: number
    pointerId: number
  } | null>(null)

  const [moving, setMoving] = useState<{ id: string; deltaMin: number } | null>(null)
  const moveRef = useRef<{
    event: RenovationCalendarEvent
    day: Date
    startMs: number
    endMs: number
    pointerId: number
    lastY: number
    deltaMin: number
  } | null>(null)
  const skipNextEventClick = useRef(false)

  const finishCreate = useCallback(
    (day: Date, y0: number, y1: number, colH: number) => {
      const lo = snapCalendarMinutes(yToMinutes(Math.min(y0, y1), colH))
      const hi = snapCalendarMinutes(yToMinutes(Math.max(y0, y1), colH))
      const a = lo
      const b = hi <= lo ? lo + SNAP_MIN : hi
      const start = minutesOnDayToDate(day, a)
      const end = minutesOnDayToDate(day, b)
      const { start: slotStart, end: slotEnd } = slotBounds(day)
      if (end.getTime() <= start.getTime()) return
      const clipStart = new Date(Math.max(start.getTime(), slotStart.getTime()))
      const clipEnd = new Date(Math.min(end.getTime(), slotEnd.getTime()))
      if (clipEnd <= clipStart) return
      onCreateTimedRange(clipStart.toISOString(), clipEnd.toISOString())
    },
    [onCreateTimedRange]
  )

  const onColumnPointerDown = (day: Date, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const t = e.target as HTMLElement
    if (t.closest('[data-cal-event]')) return
    const col = e.currentTarget
    const rect = col.getBoundingClientRect()
    const y = e.clientY - rect.top
    createRef.current = { day, col, y0: y, pointerId: e.pointerId }
    col.setPointerCapture(e.pointerId)
    setDraft({ day, top: y, height: 0 })
  }

  const onColumnPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = createRef.current
    if (!c || c.pointerId !== e.pointerId) return
    const rect = c.col.getBoundingClientRect()
    const y = e.clientY - rect.top
    const top = Math.min(c.y0, y)
    const height = Math.abs(y - c.y0)
    setDraft({ day: c.day, top, height })
  }

  const onColumnPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = createRef.current
    if (!c || c.pointerId !== e.pointerId) return
    c.col.releasePointerCapture(e.pointerId)
    const rect = c.col.getBoundingClientRect()
    const y1 = e.clientY - rect.top
    const colH = rect.height
    const dist = Math.abs(y1 - c.y0)
    createRef.current = null
    setDraft(null)
    if (dist < 6) return
    finishCreate(c.day, c.y0, y1, colH)
  }

  const onColumnPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const c = createRef.current
    if (c && c.pointerId === e.pointerId) {
      try {
        c.col.releasePointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
      createRef.current = null
      setDraft(null)
    }
  }

  const onEventPointerDown = (ev: RenovationCalendarEvent, day: Date, e: React.PointerEvent) => {
    if (ev.is_all_day || !ev.starts_at) return
    e.stopPropagation()
    if (e.button !== 0) return
    const startMs = new Date(ev.starts_at).getTime()
    const endMs = ev.ends_at ? new Date(ev.ends_at).getTime() : startMs + 3600000
    moveRef.current = {
      event: ev,
      day,
      startMs,
      endMs,
      pointerId: e.pointerId,
      lastY: e.clientY,
      deltaMin: 0,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setMoving({ id: ev.id, deltaMin: 0 })
  }

  const onEventPointerMove = (e: React.PointerEvent) => {
    const m = moveRef.current
    if (!m || m.pointerId !== e.pointerId) return
    const dy = e.clientY - m.lastY
    m.lastY = e.clientY
    const dMin = Math.round(((dy / gridPx) * totalSlotMin) / SNAP_MIN) * SNAP_MIN
    if (dMin === 0) return
    m.deltaMin += dMin
    setMoving({ id: m.event.id, deltaMin: m.deltaMin })
  }

  const onEventPointerUp = async (e: React.PointerEvent) => {
    const m = moveRef.current
    if (!m || m.pointerId !== e.pointerId) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    moveRef.current = null
    setMoving(null)
    const { event: ev, day, deltaMin, startMs, endMs } = m
    skipNextEventClick.current = true
    if (deltaMin === 0) {
      onEditEvent(ev)
      return
    }
    const start = new Date(startMs)
    const end = new Date(endMs)
    const duration = end.getTime() - start.getTime()
    let newStart = new Date(start.getTime() + deltaMin * 60000)
    let newEnd = new Date(newStart.getTime() + duration)
    const { start: slotStart, end: slotEnd } = slotBounds(day)
    if (newStart < slotStart) {
      newStart = slotStart
      newEnd = new Date(newStart.getTime() + duration)
    }
    if (newEnd > slotEnd) {
      newEnd = slotEnd
      newStart = new Date(newEnd.getTime() - duration)
    }
    if (newEnd <= newStart || newStart < slotStart) return
    try {
      await updateCalendarEvent(ev.id, {
        event_type: ev.event_type,
        title: ev.title,
        body: ev.body,
        address: ev.address ?? null,
        provider_id: ev.provider_id,
        is_all_day: false,
        starts_at: newStart.toISOString(),
        ends_at: newEnd.toISOString(),
      })
      onEventUpdated()
    } catch (err) {
      console.error(err)
    }
  }

  const onEventPointerCancel = (e: React.PointerEvent) => {
    const m = moveRef.current
    if (!m || m.pointerId !== e.pointerId) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    moveRef.current = null
    setMoving(null)
    skipNextEventClick.current = true
  }

  const onEventClick = (ev: RenovationCalendarEvent, e: React.MouseEvent) => {
    if (skipNextEventClick.current) {
      skipNextEventClick.current = false
      e.preventDefault()
      return
    }
    onEditEvent(ev)
  }

  const hours = Array.from(
    { length: CAL_WEEK_SLOT_END_HOUR - CAL_WEEK_SLOT_START_HOUR },
    (_, i) => CAL_WEEK_SLOT_START_HOUR + i
  )

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[720px]">
        {/* All-day row — same grid template as time row */}
        <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: gridCols }}>
          <div className="min-w-0 shrink-0 bg-white" aria-hidden />
          {weekDays.map((d) => {
            const wknd = isWeekendFriSat(d)
            const allDay = events.filter((ev) => ev.is_all_day && calendarEventOnLocalDay(ev, d))
            const dayTasks = showTasks ? tasks.filter((t) => taskDueOnLocalDay(t, d)) : []
            return (
              <div
                key={dayKey(d)}
                className={`min-h-[52px] min-w-0 overflow-hidden border-l border-slate-100 px-1 py-1 ${wknd ? 'bg-violet-50/80' : 'bg-slate-50/50'}`}
              >
                <div className="text-center text-[11px] font-bold text-slate-500">
                  {format(d, 'EEE d')}
                </div>
                <div className="mt-1 space-y-0.5">
                  {allDay.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      data-cal-event
                      onClick={() => onEditEvent(ev)}
                      className="block w-full max-w-full rounded px-1 py-0.5 text-indigo-900 bg-indigo-100/90"
                    >
                      <CalendarEventTitleAddress
                        title={ev.title}
                        address={ev.address}
                        titleClassName={`font-bold text-indigo-900 leading-snug ${titleSizeAllDay}`}
                        addressClassName={`truncate font-normal text-indigo-800/90 leading-snug ${addressSizeAllDay}`}
                      />
                    </button>
                  ))}
                  {dayTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onEditTask(t)}
                      className={`block w-full max-w-full truncate rounded px-1 py-0.5 text-right font-bold text-emerald-900 bg-emerald-100/90 ${titleSizeAllDay}`}
                      dir="auto"
                    >
                      Task · {t.title}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="grid" style={{ gridTemplateColumns: gridCols }}>
          <div className="min-w-0 border-r border-slate-100 pr-1 text-right">
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: gridPx / hours.length }}
                className="flex items-start justify-end pt-0 text-[10px] font-semibold tabular-nums text-slate-400"
              >
                {format(new Date(2000, 0, 1, h, 0), 'HH:mm')}
              </div>
            ))}
          </div>

          {weekDays.map((d) => {
            const wknd = isWeekendFriSat(d)
            const isDraftHere = draft && dayKey(draft.day) === dayKey(d)
            return (
              <div
                key={`col-${dayKey(d)}`}
                className={`relative min-w-0 overflow-hidden border-l border-slate-100 ${wknd ? 'bg-violet-50/40' : ''}`}
              >
                <div
                  role="application"
                  aria-label={`Time slots for ${format(d, 'EEEE, MMM d')}`}
                  className="relative touch-none"
                  style={{ height: gridPx }}
                  onPointerDown={(e) => onColumnPointerDown(d, e)}
                  onPointerMove={onColumnPointerMove}
                  onPointerUp={onColumnPointerUp}
                  onPointerCancel={onColumnPointerCancel}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-b border-slate-100/80"
                      style={{ top: ((h - CAL_WEEK_SLOT_START_HOUR) / hours.length) * gridPx, height: gridPx / hours.length }}
                    />
                  ))}

                  {events.map((ev) => {
                    if (ev.is_all_day) return null
                    const layout = timedEventLayoutForDay(ev, d, gridPx)
                    if (!layout) return null
                    const shift = moving && moving.id === ev.id ? moving.deltaMin : 0
                    const shiftPx = (shift / totalSlotMin) * gridPx
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        data-cal-event
                        style={{
                          top: layout.top + shiftPx,
                          height: layout.height,
                          left: 2,
                          right: 2,
                        }}
                        className="absolute z-10 overflow-hidden rounded-md border border-indigo-200 bg-indigo-500/90 px-1.5 py-1 leading-snug text-white shadow-sm hover:bg-indigo-600 cursor-grab active:cursor-grabbing"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEventClick(ev, e)
                        }}
                        onPointerDown={(e) => onEventPointerDown(ev, d, e)}
                        onPointerMove={onEventPointerMove}
                        onPointerUp={onEventPointerUp}
                        onPointerCancel={onEventPointerCancel}
                      >
                        <CalendarEventTitleAddress
                          title={ev.title}
                          address={ev.address}
                          className="text-white"
                          titleClassName={`font-bold leading-snug text-white ${titleSizeTimed}`}
                          addressClassName={`truncate font-normal leading-snug text-white/90 ${addressSizeTimed}`}
                        />
                      </button>
                    )
                  })}

                  {isDraftHere && draft && (
                    <div
                      className="pointer-events-none absolute left-1 right-1 rounded-md bg-indigo-400/40 ring-2 ring-indigo-500"
                      style={{ top: draft.top, height: Math.max(draft.height, 4) }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="border-t border-slate-100 px-3 py-2 text-[11px] font-medium text-slate-400">
        Drag on empty time to add a timed event. Drag a block vertically to reschedule.
      </p>
    </div>
  )
}
