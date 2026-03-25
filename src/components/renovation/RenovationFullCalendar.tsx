'use client'

import dynamic from 'next/dynamic'
import type { RenovationFullCalendarInnerProps } from '@/components/renovation/RenovationFullCalendarInner'

const RenovationFullCalendarInner = dynamic(
  () =>
    import('@/components/renovation/RenovationFullCalendarInner').then(
      m => m.RenovationFullCalendarInner
    ),
  {
    ssr: false,
    loading: () => (
      <div className="reno-cal reno-cal-gcal min-h-[320px] animate-pulse rounded-xl border border-[#dadce0] bg-[#f8f9fa]" />
    ),
  }
)

export type RenovationFullCalendarProps = RenovationFullCalendarInnerProps

export function RenovationFullCalendar(props: RenovationFullCalendarProps) {
  return <RenovationFullCalendarInner {...props} />
}
