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
