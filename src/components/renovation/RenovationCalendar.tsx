'use client'

import dynamic from 'next/dynamic'
import type { RenovationCalendarInnerProps } from '@/components/renovation/RenovationCalendarInner'

const RenovationCalendarInner = dynamic(
  () =>
    import('@/components/renovation/RenovationCalendarInner').then(
      (m) => m.RenovationCalendarInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="reno-cal min-h-[480px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
    ),
  },
)

export type RenovationCalendarProps = RenovationCalendarInnerProps

export function RenovationCalendar(props: RenovationCalendarProps) {
  return <RenovationCalendarInner {...props} />
}

export type { QuickCreateAnchor } from '@/components/renovation/renovation-fullcalendar-map'
