import { addDays, format } from 'date-fns'
import type { EventInput } from '@fullcalendar/core'
import { updateCalendarEvent } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

/**
 * Renovation calendar event-mapping helpers for FullCalendar v6.
 *
 * The DB shape (`RenovationCalendarEvent`) stores either a timed range
 * (`starts_at` / `ends_at` ISO) or an inclusive day range
 * (`start_date` / `end_date` YYYY-MM-DD). FullCalendar uses an
 * **exclusive** end for all-day events, so we add one day on the way in
 * and subtract on the way out.
 *
 * Tasks contribute read-only all-day chips on their `due_date`.
 *
 * No timezone math — FullCalendar consumes plain JS Dates / ISO strings
 * in the local timezone, which is exactly what the rest of the app
 * speaks.
 */

export type FcEventKind = 'calendar' | 'task' | 'holiday'

/**
 * Lightweight in-app event shape consumed by the hover card and any
 * callers that want to reason about an event without depending on
 * FullCalendar internal types.  Round-tripped via `extendedProps.app`.
 */
export type FcAppEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay: boolean
  kind: FcEventKind
  isDraggable: boolean
  isResizable: boolean
  isPast: boolean
  eventType?: 'general' | 'provider_meeting'
  renovationEvent?: RenovationCalendarEvent
  task?: RenovationTask
}

/** Anchor info for the inline quick-create popover. */
export type QuickCreateAnchor = {
  rect: DOMRect
  isAllDay: boolean
  startIso: string
  endIso: string
  whenLabel: string
}

const COLOR = {
  general: '#4f46e5',
  provider_meeting: '#7c3aed',
  task: '#059669',
  holiday: '#16a34a',
} as const

function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Convert a YYYY-MM-DD string to a JS Date at local midnight. */
function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map((s) => Number.parseInt(s, 10))
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

// ---------------------------------------------------------------------------
// RenovationCalendarEvent → FullCalendar EventInput
// ---------------------------------------------------------------------------

export function calendarEventToFc(e: RenovationCalendarEvent): EventInput {
  const now = new Date()
  const eventType = e.event_type
  const color = COLOR[eventType] ?? COLOR.general

  if (e.is_all_day && e.start_date) {
    const startKey = e.start_date
    const endInclusiveKey =
      e.end_date && e.end_date >= e.start_date ? e.end_date : e.start_date
    const startDate = dateFromKey(startKey)
    const endDateExclusive = addDays(dateFromKey(endInclusiveKey), 1)
    const app: FcAppEvent = {
      id: e.id,
      title: e.title,
      start: startDate,
      end: endDateExclusive,
      allDay: true,
      kind: 'calendar',
      isDraggable: true,
      isResizable: true,
      isPast: endDateExclusive < now,
      eventType,
      renovationEvent: e,
    }
    return {
      id: e.id,
      title: e.title,
      start: startKey,
      end: format(endDateExclusive, 'yyyy-MM-dd'),
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      classNames: [
        'reno-ev',
        'reno-ev-kind--calendar',
        `reno-ev-type--${eventType}`,
        ...(app.isPast ? ['reno-ev--past'] : []),
      ],
      extendedProps: { kind: 'calendar', app, renovationEvent: e },
    }
  }

  // Timed (or malformed) event.
  if (!e.starts_at) {
    // Defensive: render as a one-day all-day chip on today.
    const todayKey = format(now, 'yyyy-MM-dd')
    const startDate = dateFromKey(todayKey)
    const endDateExclusive = addDays(startDate, 1)
    const app: FcAppEvent = {
      id: e.id,
      title: e.title,
      start: startDate,
      end: endDateExclusive,
      allDay: true,
      kind: 'calendar',
      isDraggable: false,
      isResizable: false,
      isPast: false,
      eventType,
      renovationEvent: e,
    }
    return {
      id: e.id,
      title: e.title,
      start: todayKey,
      end: format(endDateExclusive, 'yyyy-MM-dd'),
      allDay: true,
      editable: false,
      startEditable: false,
      durationEditable: false,
      backgroundColor: color,
      borderColor: color,
      classNames: [
        'reno-ev',
        'reno-ev-kind--calendar',
        `reno-ev-type--${eventType}`,
        'reno-ev--locked',
      ],
      extendedProps: { kind: 'calendar', app, renovationEvent: e },
    }
  }

  const startDate = new Date(e.starts_at)
  const endDate = e.ends_at ? new Date(e.ends_at) : new Date(startDate.getTime() + 3600000)
  const app: FcAppEvent = {
    id: e.id,
    title: e.title,
    start: startDate,
    end: endDate,
    allDay: false,
    kind: 'calendar',
    isDraggable: true,
    isResizable: true,
    isPast: endDate < now,
    eventType,
    renovationEvent: e,
  }
  return {
    id: e.id,
    title: e.title,
    start: startDate,
    end: endDate,
    allDay: false,
    backgroundColor: color,
    borderColor: color,
    classNames: [
      'reno-ev',
      'reno-ev-kind--calendar',
      `reno-ev-type--${eventType}`,
      ...(app.isPast ? ['reno-ev--past'] : []),
    ],
    extendedProps: { kind: 'calendar', app, renovationEvent: e },
  }
}

// ---------------------------------------------------------------------------
// RenovationTask → FullCalendar EventInput (read-only chip on due_date)
// ---------------------------------------------------------------------------

export function taskToFc(t: RenovationTask & { due_date: string }): EventInput {
  const startDate = dateFromKey(t.due_date)
  const endDateExclusive = addDays(startDate, 1)
  const app: FcAppEvent = {
    id: `task-${t.id}`,
    title: t.title,
    start: startDate,
    end: endDateExclusive,
    allDay: true,
    kind: 'task',
    isDraggable: false,
    isResizable: false,
    isPast: endDateExclusive < new Date(),
    task: t,
  }
  return {
    id: `task-${t.id}`,
    title: t.title,
    start: t.due_date,
    end: format(endDateExclusive, 'yyyy-MM-dd'),
    allDay: true,
    editable: false,
    startEditable: false,
    durationEditable: false,
    backgroundColor: COLOR.task,
    borderColor: COLOR.task,
    classNames: ['reno-ev', 'reno-ev-kind--task', ...(app.isPast ? ['reno-ev--past'] : [])],
    extendedProps: { kind: 'task', app, task: t },
  }
}

export function buildFcEvents(
  events: RenovationCalendarEvent[],
  tasks: RenovationTask[],
  showTasks: boolean,
): EventInput[] {
  const evs = events.map(calendarEventToFc)
  const tks = showTasks
    ? tasks
        .filter((t): t is RenovationTask & { due_date: string } => Boolean(t.due_date))
        .map(taskToFc)
    : []
  return [...evs, ...tks]
}

// ---------------------------------------------------------------------------
// Persistence — translate a FullCalendar drag/resize back to the DB row.
// ---------------------------------------------------------------------------

export async function persistCalendarChange(
  prev: RenovationCalendarEvent,
  start: Date,
  end: Date | null,
  allDay: boolean,
): Promise<void> {
  const addressVal = prev.address?.trim() || null

  if (allDay) {
    // FullCalendar exclusive end → subtract a day for our inclusive `end_date`.
    const endExclusive = end ?? addDays(start, 1)
    const lastDay = addDays(endExclusive, -1)
    const startKey = dayKey(start)
    const endKey = dayKey(lastDay < start ? start : lastDay)
    await updateCalendarEvent(prev.id, {
      event_type: prev.event_type,
      title: prev.title,
      body: prev.body,
      address: addressVal,
      provider_id: prev.provider_id,
      is_all_day: true,
      start_date: startKey,
      end_date: endKey,
    })
  } else {
    const endAt = end && end.getTime() > start.getTime() ? end : new Date(start.getTime() + 3600000)
    await updateCalendarEvent(prev.id, {
      event_type: prev.event_type,
      title: prev.title,
      body: prev.body,
      address: addressVal,
      provider_id: prev.provider_id,
      is_all_day: false,
      starts_at: start.toISOString(),
      ends_at: endAt.toISOString(),
    })
  }
}
