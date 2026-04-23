'use client'

import type {
  DateSelectArg,
  EventChangeArg,
  EventClickArg,
  EventContentArg,
} from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import { format } from 'date-fns'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useCalendarEventHover } from '@/components/renovation/CalendarEventHoverCard'
import FullCalendarReactSafe from '@/components/renovation/fullcalendar/FullCalendarReactSafe'
import { isWeekendFriSat } from '@/components/renovation/calendar-shared'
import {
  buildFullCalendarEventInputs,
  persistCalendarEventFromFullCalendar,
} from '@/components/renovation/renovation-fullcalendar-map'
import type { CalendarViewMode } from '@/components/renovation/views/useCalendarPageState'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'
import { buildIsraelHolidayEventInputs } from '@/lib/israeli-holiday-events'

const SLOT_MIN = '06:00:00'
const SLOT_MAX = '22:00:00'

export type RenovationFullCalendarInnerProps = {
  view: CalendarViewMode
  cursor: Date
  events: RenovationCalendarEvent[]
  tasks: RenovationTask[]
  showTasks: boolean
  compact?: boolean
  onDateClick?: (dayKey: string) => void
  onEditEvent: (e: RenovationCalendarEvent) => void
  onEditTask: (t: RenovationTask) => void
  onCreateTimedRange: (startIso: string, endIso: string) => void
  onCreateForDay: (dayKey: string) => void
  onEventUpdated: () => void
}

function timedDurationMs(arg: EventContentArg): number | null {
  const { event } = arg
  if (event.allDay) return null
  const s = event.start
  if (!s) return null
  const e = event.end
  const end = e ?? new Date(s.getTime() + 3600000)
  return end.getTime() - s.getTime()
}

export function RenovationFullCalendarInner({
  view,
  cursor,
  events,
  tasks,
  showTasks,
  compact = false,
  onDateClick,
  onEditEvent,
  onEditTask,
  onCreateTimedRange,
  onCreateForDay,
  onEventUpdated,
}: RenovationFullCalendarInnerProps) {
  const ref = useRef<FullCalendarReactSafe>(null)
  const { eventMouseEnter, eventMouseLeave, hoverPortal } = useCalendarEventHover()

  const fcEvents = useMemo(
    () => buildFullCalendarEventInputs(events, tasks, showTasks),
    [events, tasks, showTasks]
  )
  const holidayEvents = useMemo(() => buildIsraelHolidayEventInputs(cursor), [cursor])
  const mergedEvents = useMemo(() => [...holidayEvents, ...fcEvents], [holidayEvents, fcEvents])

  // Sync date + view after FullCalendar mounts/updates. useLayoutEffect runs before paint so the grid matches the toolbar.
  useLayoutEffect(() => {
    const api = ref.current?.getApi()
    if (!api) return
    const want =
      view === 'week' ? 'timeGridWeek' : view === 'day' ? 'timeGridDay' : 'dayGridMonth'
    if (api.view.type !== want) api.changeView(want)
    api.gotoDate(cursor)
  }, [cursor, view])

  const handleSelect = (info: DateSelectArg) => {
    ref.current?.getApi().unselect()
    if (!info.allDay && String(info.view.type).includes('timeGrid')) {
      onCreateTimedRange(info.start.toISOString(), info.end.toISOString())
      return
    }
    onCreateForDay(format(info.start, 'yyyy-MM-dd'))
  }

  const handleDateClick = (info: { date: Date }) => {
    onDateClick?.(format(info.date, 'yyyy-MM-dd'))
  }

  const handleEventClick = (info: EventClickArg) => {
    const ep = info.event.extendedProps as Record<string, unknown>
    if (!ep || typeof ep !== 'object' || (ep.kind !== 'task' && ep.kind !== 'calendar')) return
    if (ep.kind === 'task' && ep.task && typeof ep.task === 'object') {
      onEditTask(ep.task as RenovationTask)
      return
    }
    if (ep.kind === 'calendar' && ep.event && typeof ep.event === 'object') {
      onEditEvent(ep.event as RenovationCalendarEvent)
    }
  }

  const handleEventChange = async (arg: EventChangeArg) => {
    const ep = arg.event.extendedProps as { kind?: string; event?: RenovationCalendarEvent }
    if (ep.kind !== 'calendar' || !ep.event) {
      arg.revert()
      return
    }
    try {
      await persistCalendarEventFromFullCalendar(
        ep.event,
        arg.event.allDay,
        arg.event.start,
        arg.event.end
      )
      onEventUpdated()
    } catch {
      arg.revert()
    }
  }

  const titleSize = compact ? 'text-[10px] font-medium' : 'text-[11px] font-medium'
  const addressSize = compact ? 'text-[9px] font-normal' : 'text-[10px] font-normal text-[#5f6368]'

  const monthOpts =
    view === 'month'
      ? { aspectRatio: compact ? 0.92 : 1.42, dayMaxEvents: true as const }
      : { contentHeight: compact ? (view === 'day' ? 644 : 598) : 828 }

  return (
    <div
      className={`reno-cal reno-cal-gcal overflow-hidden ${compact ? 'reno-cal--compact text-[12px]' : ''}`}
    >
      <FullCalendarReactSafe
        key={view}
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={
          view === 'week' ? 'timeGridWeek' : view === 'day' ? 'timeGridDay' : 'dayGridMonth'
        }
        initialDate={cursor}
        headerToolbar={false}
        firstDay={0}
        height="auto"
        slotMinTime={SLOT_MIN}
        slotMaxTime={SLOT_MAX}
        scrollTime="07:00:00"
        nowIndicator={view === 'week' || view === 'day'}
        eventMinHeight={compact ? 20 : 24}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        selectable
        selectMirror
        {...(compact ? { selectLongPressDelay: 450 } : {})}
        editable
        eventResizableFromStart
        {...monthOpts}
        events={mergedEvents}
        dayHeaderContent={arg => {
          if (arg.view.type !== 'timeGridWeek' && arg.view.type !== 'timeGridDay') return arg.text
          const dow = format(arg.date, 'EEE').toUpperCase()
          const d = format(arg.date, 'd')
          if (compact) {
            return (
              <div className="flex flex-col items-center gap-0.5 py-1.5">
                <span
                  className={
                    arg.isToday
                      ? 'text-[10px] font-medium tracking-wide text-[#1a73e8]'
                      : 'text-[10px] font-medium tracking-wide text-[#70757a]'
                  }
                >
                  {dow}
                </span>
                {arg.isToday ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f0fe] text-[13px] font-medium leading-none text-[#1a73e8]">
                    {d}
                  </span>
                ) : (
                  <span className="py-0.5 text-[13px] font-normal leading-none text-[#3c4043]">
                    {d}
                  </span>
                )}
              </div>
            )
          }
          return (
            <div className="flex flex-col items-center gap-0.5 py-2">
              <span
                className={
                  arg.isToday
                    ? 'text-[11px] font-medium tracking-wide text-[#1a73e8]'
                    : 'text-[11px] font-medium tracking-wide text-[#70757a]'
                }
              >
                {dow}
              </span>
              {arg.isToday ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[18px] font-normal leading-none text-[#1a73e8]">
                  {d}
                </span>
              ) : (
                <span className="py-0.5 text-[18px] font-normal leading-none text-[#3c4043]">
                  {d}
                </span>
              )}
            </div>
          )
        }}
        select={handleSelect}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventMouseEnter={eventMouseEnter}
        eventMouseLeave={eventMouseLeave}
        eventChange={handleEventChange}
        dayCellClassNames={arg => (isWeekendFriSat(arg.date) ? 'reno-cal-weekend' : '')}
        eventClassNames={arg => {
          const classes = ['reno-cal-event-root']
          if (arg.isPast) classes.push('reno-cal-event--past')
          return classes
        }}
        dayHeaderClassNames={arg =>
          arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay'
            ? ['reno-cal-gcal-day-header']
            : []
        }
        eventContent={arg => {
          const ep = arg.event.extendedProps as Record<string, unknown>
          if (!ep || typeof ep !== 'object' || (ep.kind !== 'task' && ep.kind !== 'calendar'))
            return true

          const timeText = !arg.event.allDay && arg.timeText ? arg.timeText : ''
          const isWeekTimed =
            (arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay') &&
            !arg.event.allDay &&
            (timedDurationMs(arg) ?? 0) >= 3600000
          const titleClass = isWeekTimed
            ? `line-clamp-2 max-h-[2.6em] whitespace-normal break-words ${titleSize} leading-snug`
            : `truncate ${titleSize} leading-snug`

          if (ep.kind === 'task') {
            return (
              <div
                dir="auto"
                className={`flex w-full flex-col items-end justify-start px-1.5 py-0.5 text-right leading-snug ${titleSize}`}
              >
                <div className="truncate w-full text-right block text-current">{arg.event.title}</div>
              </div>
            )
          }

          const ev = ep.event as RenovationCalendarEvent | undefined
          if (!ev) return true
          const addr = ev.address?.trim()

          return (
            <div dir="auto" className="flex w-full flex-col items-end justify-start px-1.5 py-0.5 text-right text-current">
              <div className={`w-full text-right text-current ${titleClass}`}>{ev.title || arg.event.title}</div>
              {timeText ? (
                <div
                  className={`reno-cal-event-time mt-0.5 w-full text-left text-current opacity-90 ${compact ? 'text-[9px]' : 'text-[10px]'}`}
                >
                  {timeText}
                </div>
              ) : null}
              {addr ? <div className={`mt-0.5 w-full text-right text-current opacity-90 truncate ${addressSize}`}>{addr}</div> : null}
            </div>
          )
        }}
      />
      {hoverPortal}
    </div>
  )
}
