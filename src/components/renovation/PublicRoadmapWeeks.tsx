'use client'

import { useMemo } from 'react'
import { addDays, format, isSameDay } from 'date-fns'
import type { RenovationMilestone } from '@/types/renovation'
import {
  buildWeekHeaders,
  categoryLabelForColor,
  computeAxisRange,
  currentWeekStart,
  durationLabel,
  formatRange,
  parseYmd,
} from '@/components/renovation/views/roadmap-shared'

interface WeekBucket {
  key: string
  /** Sunday that opens the week. */
  start: Date
  /** Saturday that closes the week. */
  end: Date
  label: string
  isCurrent: boolean
  items: RenovationMilestone[]
}

/**
 * Read-only, mobile-friendly roadmap: a vertical list of weeks, each showing
 * the milestones active during that week. Spanning milestones appear in every
 * week they overlap. Weeks with nothing happening are omitted.
 */
export function PublicRoadmapWeeks({ milestones }: { milestones: RenovationMilestone[] }) {
  const weeks = useMemo<WeekBucket[]>(() => {
    const { startSunday, weeks: weekCount } = computeAxisRange(milestones)
    const headers = buildWeekHeaders(startSunday, weekCount)
    const today = currentWeekStart()

    const buckets = headers.map<WeekBucket>((h) => {
      const start = h.start
      const end = addDays(start, 6)
      const items = milestones
        .filter((m) => {
          const s = parseYmd(m.start_date)
          const e = parseYmd(m.end_date)
          return s <= end && e >= start
        })
        .sort(
          (a, b) =>
            a.start_date.localeCompare(b.start_date) ||
            a.sort_order - b.sort_order ||
            a.title.localeCompare(b.title)
        )
      return {
        key: format(start, 'yyyy-MM-dd'),
        start,
        end,
        label: `${format(start, 'MMM d')} – ${format(addDays(start, 4), 'MMM d')}`,
        isCurrent: isSameDay(start, today),
        items,
      }
    })

    return buckets.filter((b) => b.items.length > 0)
  }, [milestones])

  if (milestones.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-[14px] text-slate-400">No milestones yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {weeks.map((w) => (
        <section key={w.key}>
          <div className="sticky top-0 z-10 -mx-4 mb-2.5 flex items-center gap-2 bg-[oklch(0.995_0_0)] px-4 py-1.5">
            <h2 className="text-[12px] font-extrabold uppercase tracking-wider text-slate-400">{w.label}</h2>
            {w.isCurrent && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                This week
              </span>
            )}
          </div>

          <div className="space-y-2">
            {w.items.map((m) => {
              const startsBefore = parseYmd(m.start_date) < w.start
              const endsAfter = parseYmd(m.end_date) > w.end
              const taskCount = m.task_ids.length
              const subject = categoryLabelForColor(m.color)
              return (
                <div
                  key={m.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm"
                >
                  <span
                    className="mt-0.5 h-9 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: m.color, opacity: m.done ? 0.4 : 1 }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-[15px] font-semibold ${
                          m.done ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                        dir="auto"
                      >
                        {m.title}
                      </p>
                      {m.done && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                          <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                    {subject && (
                      <span
                        className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                        dir="rtl"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.color }} />
                        {subject}
                      </span>
                    )}
                    <p className="mt-0.5 text-[13px] text-slate-500">
                      {formatRange(m.start_date, m.end_date)} · {durationLabel(m.start_date, m.end_date)}
                      {taskCount > 0 && ` · ${taskCount} task${taskCount > 1 ? 's' : ''}`}
                    </p>
                    {(startsBefore || endsAfter) && (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {startsBefore && endsAfter
                          ? 'Continues through this week'
                          : startsBefore
                            ? 'Continued from earlier'
                            : 'Continues next week'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
