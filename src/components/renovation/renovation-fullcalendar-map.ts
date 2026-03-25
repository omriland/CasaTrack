import { addDays, format } from 'date-fns'
import type { EventInput } from '@fullcalendar/core'
import { updateCalendarEvent } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** FullCalendar all-day `end` is exclusive; DB stores inclusive `end_date`. */
function toExclusiveEnd(inclusiveEnd: string): string {
  return format(addDays(parseDayKey(inclusiveEnd), 1), 'yyyy-MM-dd')
}

export function calendarEventToEventInput(e: RenovationCalendarEvent): EventInput {
  const base = {
    id: e.id,
    extendedProps: { kind: 'calendar' as const, event: e },
  }
  if (e.is_all_day && e.start_date) {
    const endInc = e.end_date && e.end_date >= e.start_date ? e.end_date : e.start_date
    return {
      ...base,
      title: e.title,
      allDay: true,
      start: e.start_date,
      end: toExclusiveEnd(endInc),
      editable: true,
      startEditable: true,
      durationEditable: true,
      classNames: [
        'reno-cal-event',
        e.event_type === 'provider_meeting'
          ? 'reno-cal-event--provider'
          : 'reno-cal-event--general',
      ],
      textColor: e.event_type === 'provider_meeting' ? '#4c1d95' : '#001d35',
    }
  }
  if (!e.starts_at) {
    return {
      ...base,
      title: e.title,
      allDay: true,
      start: format(new Date(), 'yyyy-MM-dd'),
      end: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      editable: false,
      classNames: ['reno-cal-event', 'reno-cal-event--general'],
      textColor: '#001d35',
    }
  }
  const endMs = e.ends_at
    ? new Date(e.ends_at).getTime()
    : new Date(e.starts_at).getTime() + 3600000
  return {
    ...base,
    title: e.title,
    allDay: false,
    start: e.starts_at,
    end: new Date(endMs).toISOString(),
    editable: true,
    startEditable: true,
    durationEditable: true,
    classNames: [
      'reno-cal-event',
      e.event_type === 'provider_meeting' ? 'reno-cal-event--provider' : 'reno-cal-event--general',
    ],
    textColor: e.event_type === 'provider_meeting' ? '#4c1d95' : '#001d35',
  }
}

export function taskToEventInput(t: RenovationTask & { due_date: string }): EventInput {
  return {
    id: `task-${t.id}`,
    title: `Task · ${t.title}`,
    allDay: true,
    start: t.due_date,
    end: format(addDays(parseDayKey(t.due_date), 1), 'yyyy-MM-dd'),
    editable: false,
    startEditable: false,
    durationEditable: false,
    display: 'block',
    extendedProps: { kind: 'task' as const, task: t },
    classNames: ['reno-cal-event', 'reno-cal-event--task'],
    /** FullCalendar sets --fc-event-text-color from this; avoids default light-on-green contrast. */
    textColor: '#14532d',
  }
}

export function buildFullCalendarEventInputs(
  events: RenovationCalendarEvent[],
  tasks: RenovationTask[],
  showTasks: boolean
): EventInput[] {
  const evs = events.map(calendarEventToEventInput)
  const tks = showTasks
    ? tasks
        .filter((t): t is RenovationTask & { due_date: string } => Boolean(t.due_date))
        .map(taskToEventInput)
    : []
  return [...evs, ...tks]
}

export async function persistCalendarEventFromFullCalendar(
  prev: RenovationCalendarEvent,
  allDay: boolean,
  start: Date | null,
  end: Date | null
): Promise<void> {
  if (!start) return
  const addressVal = prev.address?.trim() || null
  if (allDay) {
    const start_date = format(
      new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      'yyyy-MM-dd'
    )
    let endExclusiveDay: Date
    if (end) {
      endExclusiveDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    } else {
      endExclusiveDay = addDays(parseDayKey(start_date), 1)
    }
    const endInclusive = format(addDays(endExclusiveDay, -1), 'yyyy-MM-dd')
    const end_date = endInclusive < start_date ? start_date : endInclusive
    await updateCalendarEvent(prev.id, {
      event_type: prev.event_type,
      title: prev.title,
      body: prev.body,
      address: addressVal,
      provider_id: prev.provider_id,
      is_all_day: true,
      start_date,
      end_date,
    })
  } else {
    const endAt = end ?? new Date(start.getTime() + 3600000)
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
