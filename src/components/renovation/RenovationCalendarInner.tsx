'use client'

import { format, isSameDay } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { MapPin } from 'lucide-react'
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventMountArg,
  EventInput,
} from '@fullcalendar/core'
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction'

import {
  CalendarHoverContext,
  useCalendarEventHover,
} from '@/components/renovation/CalendarEventHoverCard'
import {
  buildFcEvents,
  isShortTimedCalendarMinutes,
  persistCalendarChange,
  type FcAppEvent,
  type QuickCreateAnchor,
} from '@/components/renovation/renovation-fullcalendar-map'
import { buildIsraelHolidayEvents } from '@/lib/israeli-holiday-events'
import { deleteCalendarEvent } from '@/lib/renovation'
import type { CalendarViewMode } from '@/components/renovation/views/useCalendarPageState'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

export type { QuickCreateAnchor } from '@/components/renovation/renovation-fullcalendar-map'

export type RenovationCalendarInnerProps = {
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
  onQuickCreate?: (anchor: QuickCreateAnchor) => void
  onCursorChange?: (date: Date) => void
}

const FC_VIEW: Record<CalendarViewMode, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  day: 'timeGridDay',
}

function dayKeyOf(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function whenLabel(start: Date, end: Date, allDay: boolean): string {
  if (allDay) return format(start, 'EEEE, MMMM d')
  return isSameDay(start, end)
    ? `${format(start, 'EEE, MMM d')} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
    : `${format(start, 'MMM d HH:mm')} – ${format(end, 'MMM d HH:mm')}`
}

function rectFromTarget(target: EventTarget | null): DOMRect {
  if (target instanceof Element) return target.getBoundingClientRect()
  return new DOMRect(window.innerWidth / 2 - 160, window.innerHeight / 2 - 100, 1, 1)
}

// ---------------------------------------------------------------------------
// Custom day header — Google Calendar style: SUN / 9 (today highlighted).
// ---------------------------------------------------------------------------

function renderDayHeader(arg: { date: Date; text: string; isToday: boolean; view: { type: string } }) {
  const isMonth = arg.view.type === 'dayGridMonth'
  const dayName = format(arg.date, 'EEE').toUpperCase()
  const dayNum = format(arg.date, 'd')
  if (isMonth) {
    return {
      html: `<div class="reno-dh reno-dh--month"><span class="reno-dh__name">${dayName}</span></div>`,
    }
  }
  const todayCls = arg.isToday ? ' reno-dh__num--today' : ''
  return {
    html: `<div class="reno-dh reno-dh--week"><span class="reno-dh__name">${dayName}</span><span class="reno-dh__num${todayCls}">${dayNum}</span></div>`,
  }
}

// ---------------------------------------------------------------------------
// Event renderer — Google-Calendar-style chip with RTL support.
// ---------------------------------------------------------------------------

function renderEventContent(arg: EventContentArg) {
  const app = (arg.event.extendedProps?.app ?? null) as FcAppEvent | null
  const title = arg.event.title || '(untitled)'
  const isAllDay = arg.event.allDay
  const isMonth = arg.view.type === 'dayGridMonth'
  const start = arg.event.start
  const end = arg.event.end ?? start
  const isHoliday = app?.kind === 'holiday'

  if (isMonth) {
    if (isAllDay) {
      return (
        <div className="reno-ev-chip reno-ev-chip--month-allday" title={title}>
          <span className="reno-ev-chip__title" dir="auto">{title}</span>
        </div>
      )
    }
    const timeStr = start ? format(start, 'HH:mm') : ''
    return (
      <div className="reno-ev-chip reno-ev-chip--month" title={title}>
        <span className="reno-ev-chip__dot" aria-hidden />
        {timeStr && <span className="reno-ev-chip__time">{timeStr}</span>}
        <span className="reno-ev-chip__title" dir="auto">{title}</span>
      </div>
    )
  }

  if (isAllDay) {
    return (
      <div
        className={`reno-ev-chip reno-ev-chip--allday${isHoliday ? ' reno-ev-chip--holiday' : ''}`}
        title={title}
      >
        <span className="reno-ev-chip__title" dir="auto">{title}</span>
      </div>
    )
  }

  const compactTimed =
    Boolean(start && end && isShortTimedCalendarMinutes(start, end))
  const range =
    !compactTimed && start && end
      ? `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
      : ''
  const address: string | null = compactTimed
    ? null
    : (app?.renovationEvent?.address?.trim() || null)
  return (
    <div className="reno-ev-chip reno-ev-chip--time">
      <div className="reno-ev-chip__title" dir="auto">{title}</div>
      {range ? <div className="reno-ev-chip__time">{range}</div> : null}
      {address ? (
        <div className="reno-ev-chip__loc" dir="ltr">
          <span className="reno-ev-chip__loc-text" dir="auto">{address}</span>
          <MapPin className="reno-ev-chip__loc-icon" aria-hidden />
        </div>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------

export function RenovationCalendarInner({
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
  onCreateForDay: _onCreateForDay,
  onEventUpdated,
  onQuickCreate,
  onCursorChange,
}: RenovationCalendarInnerProps) {
  void _onCreateForDay // kept on the public API; quick-create owns new-event creation
  const { hoverContextValue, hoverPortal } = useCalendarEventHover()
  const [eventMenu, setEventMenu] = useState<{
    x: number
    y: number
    ev: RenovationCalendarEvent
  } | null>(null)
  const calendarRef = useRef<FullCalendar | null>(null)
  /** Latest renovation calendar rows — used when FC's `extendedProps` are incomplete during drag/resize. */
  const eventsRef = useRef(events)
  eventsRef.current = events

  // Latest callbacks captured in refs so the FullCalendar option closures
  // always see the freshest values without forcing a re-mount.
  const cb = useRef({
    onDateClick,
    onEditEvent,
    onEditTask,
    onCreateTimedRange,
    onQuickCreate,
    onCursorChange,
    onEventUpdated,
  })
  useEffect(() => {
    cb.current = {
      onDateClick,
      onEditEvent,
      onEditTask,
      onCreateTimedRange,
      onQuickCreate,
      onCursorChange,
      onEventUpdated,
    }
  }, [
    onDateClick,
    onEditEvent,
    onEditTask,
    onCreateTimedRange,
    onQuickCreate,
    onCursorChange,
    onEventUpdated,
  ])

  useEffect(() => {
    if (!eventMenu) return
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('[data-reno-cal-event-menu="1"]')) return
      setEventMenu(null)
    }
    const t = setTimeout(() => window.addEventListener('mousedown', close), 0)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', close)
    }
  }, [eventMenu])

  // Memoise the merged event array so FullCalendar doesn't see a new
  // identity on unrelated re-renders.
  const fcEvents: EventInput[] = useMemo(() => {
    return [...buildFcEvents(events, tasks, showTasks), ...buildIsraelHolidayEvents(cursor)]
  }, [events, tasks, showTasks, cursor])

  // Sync `view` and `cursor` imperatively — never rebuild the calendar.
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (api.view.type !== FC_VIEW[view]) api.changeView(FC_VIEW[view])
  }, [view])

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    const current = api.getDate()
    if (
      current.getFullYear() !== cursor.getFullYear() ||
      current.getMonth() !== cursor.getMonth() ||
      current.getDate() !== cursor.getDate()
    ) {
      api.gotoDate(cursor)
    }
  }, [cursor])

  // ------------------------------------------------------------------------
  // FullCalendar callbacks
  // ------------------------------------------------------------------------

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const c = cb.current
    const target = (arg.jsEvent?.target as Element | null) ?? null
    const rect = rectFromTarget(target)
    const startIso = arg.start.toISOString()
    const endIso = arg.end.toISOString()
    const isAllDay = arg.allDay
    if (c.onQuickCreate) {
      c.onQuickCreate({
        rect,
        isAllDay,
        startIso,
        endIso,
        whenLabel: whenLabel(arg.start, arg.end, isAllDay),
      })
    } else if (!isAllDay) {
      c.onCreateTimedRange(startIso, endIso)
    }
    // Clear the visible selection so it doesn't linger behind the popover.
    arg.view.calendar.unselect()
  }, [])

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const c = cb.current
    const key = dayKeyOf(arg.date)
    c.onDateClick?.(key)
    // Month view doubles as quick-create on a tap — week/day already
    // surface that through `select`.
    if (arg.view.type !== 'dayGridMonth') return
    if (!c.onQuickCreate) return
    const start = new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate(), 9, 0, 0)
    const end = new Date(arg.date.getFullYear(), arg.date.getMonth(), arg.date.getDate(), 10, 0, 0)
    const target = (arg.jsEvent?.target as Element | null) ?? null
    c.onQuickCreate({
      rect: rectFromTarget(target),
      isAllDay: true,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
      whenLabel: format(arg.date, 'EEEE, MMMM d'),
    })
  }, [])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const c = cb.current
    const ext = arg.event.extendedProps as {
      app?: FcAppEvent
      renovationEvent?: RenovationCalendarEvent
    }
    const app = ext.app ?? null
    const renovationEvent = ext.renovationEvent ?? app?.renovationEvent ?? null
    if (!app) return
    if (app.kind === 'holiday') return
    if (app.kind === 'task' && app.task) {
      c.onEditTask(app.task)
      return
    }
    if (app.kind === 'calendar' && renovationEvent) {
      c.onEditEvent(renovationEvent)
    }
  }, [])

  // FullCalendar fires `datesSet` synchronously during its own render pass
  // (FC v6's React adapter is built on Preact + a `flushSync` shim), so any
  // parent `setState` invoked from here would land while React is mid-render
  // and trip the "flushSync was called from inside a lifecycle method"
  // warning. Defer the callback to a microtask to break out of that pass.
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    const start = arg.view.currentStart
    queueMicrotask(() => {
      cb.current.onCursorChange?.(start)
    })
  }, [])

  const persistDropOrResize = useCallback(
    async (
      info: EventDropArg | EventResizeDoneArg,
    ) => {
      const c = cb.current
      const eventId = String(info.event.id)
      if (eventId.startsWith('task-') || eventId.startsWith('il-holiday-')) {
        info.revert()
        return
      }

      const ext = info.event.extendedProps as {
        app?: FcAppEvent
        renovationEvent?: RenovationCalendarEvent
        kind?: string
      }
      const renovationEvent =
        ext.renovationEvent ??
        ext.app?.renovationEvent ??
        eventsRef.current.find((e) => e.id === eventId) ??
        null

      if (!renovationEvent) {
        info.revert()
        return
      }

      const start = info.event.start
      const end = info.event.end
      if (!start) {
        info.revert()
        return
      }
      try {
        await persistCalendarChange(renovationEvent, start, end ?? null, info.event.allDay)
        // Defer parent refetch so FullCalendar can finish its drop/resize bookkeeping before
        // we replace `events` (avoids snap-back when the grid stays mounted — silent reload).
        window.setTimeout(() => {
          c.onEventUpdated()
        }, 0)
      } catch (err) {
        console.error('[reno-cal] persist failed', err)
        info.revert()
      }
    },
    [],
  )

  // Hover + context menu — bind / unbind on every mount so the anchor is the live DOM node.
  const handleEventDidMount = useCallback(
    (arg: EventMountArg) => {
      const app = (arg.event.extendedProps?.app ?? null) as FcAppEvent | null
      if (!app) return
      const enter = () => hoverContextValue.onMouseEnter(app, arg.el)
      const leave = () => hoverContextValue.onMouseLeave()
      const onCtxMenu = (e: MouseEvent) => {
        const ext = arg.event.extendedProps as {
          app?: FcAppEvent
          renovationEvent?: RenovationCalendarEvent
        }
        const liveApp = ext.app ?? null
        const liveEv = ext.renovationEvent ?? liveApp?.renovationEvent ?? null
        if (!liveApp || liveApp.kind !== 'calendar' || !liveEv) return
        e.preventDefault()
        hoverContextValue.dismissHoverNow()
        setEventMenu({ x: e.clientX, y: e.clientY, ev: liveEv })
      }
      arg.el.addEventListener('mouseenter', enter)
      arg.el.addEventListener('mouseleave', leave)
      arg.el.addEventListener('contextmenu', onCtxMenu)
      // Stash so we can clean up on unmount.
      ;(arg.el as HTMLElement & {
        __renoCalDom?: { enter: () => void; leave: () => void; onCtxMenu: (e: MouseEvent) => void }
      }).__renoCalDom = { enter, leave, onCtxMenu }
    },
    [hoverContextValue],
  )
  const handleEventWillUnmount = useCallback((arg: EventMountArg) => {
    const wired = (arg.el as HTMLElement & {
      __renoCalDom?: { enter: () => void; leave: () => void; onCtxMenu: (e: MouseEvent) => void }
    }).__renoCalDom
    if (!wired) return
    arg.el.removeEventListener('mouseenter', wired.enter)
    arg.el.removeEventListener('mouseleave', wired.leave)
    arg.el.removeEventListener('contextmenu', wired.onCtxMenu)
  }, [])

  // Tag Fri/Sat day cells so we can shade them.
  const dayCellClassNames = useCallback((arg: { date: Date }) => {
    const dow = arg.date.getDay()
    return dow === 5 || dow === 6 ? ['reno-fri-sat'] : []
  }, [])

  return (
    <CalendarHoverContext.Provider value={hoverContextValue}>
      <div className={`reno-cal${compact ? ' reno-cal--compact' : ''}`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={FC_VIEW[view]}
          initialDate={cursor}
          headerToolbar={false}
          firstDay={0}
          locale="en-GB"
          height="auto"
          expandRows
          nowIndicator
          allDaySlot
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          dayMaxEvents={3}
          eventOverlap
          selectable
          selectMirror
          editable
          eventResizableFromStart={false}
          dragRevertDuration={0}
          longPressDelay={250}
          events={fcEvents}
          dayHeaderContent={renderDayHeader}
          dayCellClassNames={dayCellClassNames}
          eventContent={renderEventContent}
          select={handleSelect}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          eventDragStart={() => hoverContextValue.dismissHoverNow()}
          eventResizeStart={() => hoverContextValue.dismissHoverNow()}
          eventDrop={persistDropOrResize}
          eventResize={persistDropOrResize}
          eventDidMount={handleEventDidMount}
          eventWillUnmount={handleEventWillUnmount}
        />
      </div>
      {hoverPortal}
      {eventMenu && (
        <div
          data-reno-cal-event-menu="1"
          role="menu"
          dir="ltr"
          className="fixed z-[270] min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-start"
          style={{
            left: Math.min(
              eventMenu.x,
              typeof window !== 'undefined' ? window.innerWidth - 220 : eventMenu.x,
            ),
            top: Math.min(
              eventMenu.y,
              typeof window !== 'undefined' ? window.innerHeight - 120 : eventMenu.y,
            ),
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-start text-[14px] font-semibold text-rose-600 hover:bg-slate-50"
            onClick={() => {
              const ev = eventMenu.ev
              if (!window.confirm('Delete this event?')) return
              setEventMenu(null)
              void (async () => {
                try {
                  await deleteCalendarEvent(ev.id)
                  cb.current.onEventUpdated()
                } catch (err) {
                  console.error(err)
                  alert('Could not delete.')
                }
              })()
            }}
          >
            Delete event
          </button>
        </div>
      )}
    </CalendarHoverContext.Provider>
  )
}
