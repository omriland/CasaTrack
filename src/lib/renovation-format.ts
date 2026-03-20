export function formatIls(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}

export function formatIlsFull(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDateDisplay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}/${m}/${y}`
}

/** Calendar date from YYYY-MM-DD in local time */
export function parseLocalISODate(isoDate: string): Date | null {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d || Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  return new Date(y, m - 1, d)
}

/** Whole days from today to due date (negative = overdue). */
export function taskDueCalendarDiffDays(isoDate: string): number {
  const due = parseLocalISODate(isoDate)
  if (!due) return 0
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime()
  return Math.round((startDue - startToday) / 86400000)
}

export type TaskDueTone = 'overdue' | 'soon' | 'normal'

export function formatTaskDue(
  isoDate: string,
  opts?: { isDone?: boolean }
): { label: string; tone: TaskDueTone; title: string } {
  const due = parseLocalISODate(isoDate)
  const fullTitle = due
    ? due.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : isoDate

  if (opts?.isDone) {
    return { label: due ? due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : isoDate, tone: 'normal', title: fullTitle }
  }

  const diff = taskDueCalendarDiffDays(isoDate)
  if (diff < 0) {
    return {
      label:
        diff === -1
          ? 'Yesterday'
          : diff >= -5 && due
            ? due.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
            : formatDateDisplay(isoDate),
      tone: 'overdue',
      title: fullTitle,
    }
  }
  if (diff === 0) {
    return { label: 'Today', tone: 'soon', title: fullTitle }
  }
  if (diff === 1) {
    return { label: 'Tomorrow', tone: 'soon', title: fullTitle }
  }
  if (diff === 2) {
    return { label: 'In 2 days', tone: 'soon', title: fullTitle }
  }
  if (diff <= 13 && due) {
    const weekday = due.toLocaleDateString('en-US', { weekday: 'short' })
    const monthDay = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const prefix = diff >= 7 ? 'Next ' : ''
    return { label: `${prefix}${weekday}, ${monthDay}`, tone: 'normal', title: fullTitle }
  }
  if (due) {
    const now = new Date()
    const sameYear = due.getFullYear() === now.getFullYear()
    return {
      label: due.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(sameYear ? {} : { year: 'numeric' }),
      }),
      tone: 'normal',
      title: fullTitle,
    }
  }
  return { label: isoDate, tone: 'normal', title: fullTitle }
}
