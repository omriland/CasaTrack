import { addDays, differenceInCalendarWeeks, format, startOfWeek } from 'date-fns'
import type { RenovationMilestone } from '@/types/renovation'

/** Working week is Sun-Thu (JS getDay 0..4). Fri/Sat are not rendered. */
export const WORKING_DAYS_PER_WEEK = 5

/** Default number of weeks shown forward from the current week. */
export const DEFAULT_HORIZON_WEEKS = 14

export const MILESTONE_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
]

/** Parse a YYYY-MM-DD string into a local Date (no timezone drift). */
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function toYmd(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export interface DayCol {
  date: Date
  ymd: string
  /** 0-based index of the week this column belongs to. */
  weekIndex: number
  /** True for the Sunday column that starts a week. */
  isWeekStart: boolean
}

export interface WeekHeader {
  weekIndex: number
  /** Sunday that starts the week. */
  start: Date
  label: string
}

/** Build the Sun-Thu working-day columns for `weeks` weeks starting at a Sunday. */
export function buildAxis(startSunday: Date, weeks: number): DayCol[] {
  const cols: DayCol[] = []
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(startSunday, w * 7)
    for (let i = 0; i < WORKING_DAYS_PER_WEEK; i++) {
      const date = addDays(weekStart, i)
      cols.push({ date, ymd: toYmd(date), weekIndex: w, isWeekStart: i === 0 })
    }
  }
  return cols
}

export function buildWeekHeaders(startSunday: Date, weeks: number): WeekHeader[] {
  const headers: WeekHeader[] = []
  for (let w = 0; w < weeks; w++) {
    const start = addDays(startSunday, w * 7)
    headers.push({ weekIndex: w, start, label: format(start, 'MMM d') })
  }
  return headers
}

/** Sunday that opens the current week. */
export function currentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 0 })
}

/**
 * Compute the axis (start Sunday + week count) so it always shows the default
 * horizon and also fully contains every milestone.
 */
export function computeAxisRange(milestones: RenovationMilestone[]): {
  startSunday: Date
  weeks: number
} {
  const today = currentWeekStart()
  let firstSunday = today
  let lastSunday = addDays(today, (DEFAULT_HORIZON_WEEKS - 1) * 7)

  for (const m of milestones) {
    const s = startOfWeek(parseYmd(m.start_date), { weekStartsOn: 0 })
    const e = startOfWeek(parseYmd(m.end_date), { weekStartsOn: 0 })
    if (s < firstSunday) firstSunday = s
    if (e > lastSunday) lastSunday = e
  }

  const weeks = differenceInCalendarWeeks(lastSunday, firstSunday, { weekStartsOn: 0 }) + 1
  return { startSunday: firstSunday, weeks: Math.max(weeks, DEFAULT_HORIZON_WEEKS) }
}

/** First column whose date is on/after the target (clamped). Used for a bar's left edge. */
export function colForStart(cols: DayCol[], ymd: string): number {
  const t = parseYmd(ymd).getTime()
  for (let i = 0; i < cols.length; i++) {
    if (cols[i].date.getTime() >= t) return i
  }
  return cols.length - 1
}

/** Last column whose date is on/before the target (clamped). Used for a bar's right edge. */
export function colForEnd(cols: DayCol[], ymd: string): number {
  const t = parseYmd(ymd).getTime()
  for (let i = cols.length - 1; i >= 0; i--) {
    if (cols[i].date.getTime() <= t) return i
  }
  return 0
}

/** Human-readable inclusive range, e.g. "May 4 - May 12" or "May 4" for a single day. */
export function formatRange(startYmd: string, endYmd: string): string {
  const s = parseYmd(startYmd)
  const e = parseYmd(endYmd)
  if (startYmd === endYmd) return format(s, 'MMM d')
  const sameYear = s.getFullYear() === e.getFullYear()
  const sameMonth = sameYear && s.getMonth() === e.getMonth()
  if (sameMonth) return `${format(s, 'MMM d')} - ${format(e, 'd')}`
  if (sameYear) return `${format(s, 'MMM d')} - ${format(e, 'MMM d')}`
  return `${format(s, 'MMM d, yyyy')} - ${format(e, 'MMM d, yyyy')}`
}

/** Inclusive count of working days (Sun-Thu) the milestone touches in the axis. */
export function durationLabel(startYmd: string, endYmd: string): string {
  const cols: number[] = []
  let cur = parseYmd(startYmd)
  const end = parseYmd(endYmd)
  let count = 0
  // Cap the loop defensively.
  for (let i = 0; i < 3650 && cur <= end; i++) {
    const day = cur.getDay()
    if (day >= 0 && day <= 4) count++
    cur = addDays(cur, 1)
  }
  void cols
  return count === 1 ? '1 work day' : `${count} work days`
}
