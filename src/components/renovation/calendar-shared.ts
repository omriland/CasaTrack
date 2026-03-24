import { format } from 'date-fns'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

export function dayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Israeli-style weekend: Friday and Saturday (week starts Sunday). */
export function isWeekendFriSat(d: Date): boolean {
  const day = d.getDay()
  return day === 5 || day === 6
}

function localDayBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  return { start, end }
}

export function calendarEventOnLocalDay(event: RenovationCalendarEvent, day: Date): boolean {
  if (event.is_all_day && event.start_date) {
    const key = dayKey(day)
    const end = event.end_date || event.start_date
    return key >= event.start_date && key <= end
  }
  if (!event.is_all_day && event.starts_at) {
    const s = new Date(event.starts_at)
    const e = event.ends_at ? new Date(event.ends_at) : new Date(s.getTime() + 60 * 60 * 1000)
    const { start, end } = localDayBounds(day)
    return s.getTime() < end.getTime() && e.getTime() > start.getTime()
  }
  return false
}

export function taskDueOnLocalDay(task: RenovationTask, day: Date): boolean {
  if (!task.due_date) return false
  return task.due_date === dayKey(day)
}

/** First hour shown in week time grid (inclusive). */
export const CAL_WEEK_SLOT_START_HOUR = 6
/** Last hour edge (exclusive): grid shows up to 22:00, i.e. hours 6..21. */
export const CAL_WEEK_SLOT_END_HOUR = 22

export function timedEventLayoutForDay(
  event: RenovationCalendarEvent,
  day: Date,
  gridPx: number,
  slotStartHour: number = CAL_WEEK_SLOT_START_HOUR,
  slotEndHour: number = CAL_WEEK_SLOT_END_HOUR
): { top: number; height: number } | null {
  if (event.is_all_day || !event.starts_at) return null
  const s = new Date(event.starts_at)
  const e = event.ends_at ? new Date(event.ends_at) : new Date(s.getTime() + 3600000)
  const day0 = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const day1 = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() + 1)
  const vis0 = new Date(Math.max(s.getTime(), day0.getTime()))
  const vis1 = new Date(Math.min(e.getTime(), day1.getTime()))
  if (vis1 <= vis0) return null
  const slot0 = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate(), slotStartHour, 0, 0, 0)
  const slot1 = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate(), slotEndHour, 0, 0, 0)
  const clip0 = new Date(Math.max(vis0.getTime(), slot0.getTime()))
  const clip1 = new Date(Math.min(vis1.getTime(), slot1.getTime()))
  if (clip1 <= clip0) return null
  const totalMin = (slotEndHour - slotStartHour) * 60
  const m0 = (clip0.getTime() - slot0.getTime()) / 60000
  const m1 = (clip1.getTime() - slot0.getTime()) / 60000
  const top = (m0 / totalMin) * gridPx
  const height = ((m1 - m0) / totalMin) * gridPx
  return { top, height: Math.max(height, 6) }
}

export function snapCalendarMinutes(m: number, step: number = 15): number {
  return Math.round(m / step) * step
}
