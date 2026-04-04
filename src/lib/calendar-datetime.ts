/** Seconds for `<input type="datetime-local" step>` — 5-minute increments */
export const CALENDAR_DATETIME_LOCAL_STEP_SEC = 300

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromDatetimeLocal(s: string): string {
  return new Date(s).toISOString()
}

export function defaultTimedEnd(startsAtIso: string): string {
  const d = new Date(startsAtIso)
  if (Number.isNaN(d.getTime())) return startsAtIso
  return new Date(d.getTime() + 60 * 60 * 1000).toISOString()
}

/** Keep the same span between start and end when the user changes only the start. */
export function endsAtPreservingDuration(
  previousStartIso: string,
  previousEndIso: string | null | undefined,
  newStartIso: string
): string {
  const prevStartMs = new Date(previousStartIso).getTime()
  if (Number.isNaN(prevStartMs)) return defaultTimedEnd(newStartIso)

  const prevEndMs = previousEndIso
    ? new Date(previousEndIso).getTime()
    : new Date(defaultTimedEnd(previousStartIso)).getTime()
  if (Number.isNaN(prevEndMs)) return defaultTimedEnd(newStartIso)

  const durationMs = prevEndMs - prevStartMs
  const newStartMs = new Date(newStartIso).getTime()
  if (Number.isNaN(newStartMs)) return defaultTimedEnd(newStartIso)

  return new Date(newStartMs + durationMs).toISOString()
}
