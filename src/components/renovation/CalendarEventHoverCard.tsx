'use client'

import type { EventApi } from '@fullcalendar/core'
import type { EventClickArg } from '@fullcalendar/core'
import { addDays, format, isSameDay } from 'date-fns'
import { AlignLeft, CalendarDays, Clock, MapPin, User } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/common'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

const HIDE_DELAY_MS = 220
const CARD_W = 320
/** Prefer showing below the event if at least this much space exists under the anchor */
const MIN_SPACE_BELOW = 100

export type CalendarHoverModel =
  | { kind: 'holiday'; title: string; when: string }
  | { kind: 'task'; task: RenovationTask; when: string }
  | { kind: 'calendar'; ev: RenovationCalendarEvent; when: string }

function stripPreviewText(raw: string | null | undefined, maxLen: number): string | null {
  if (!raw?.trim()) return null
  const t = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return null
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

function formatWhenFromApi(event: EventApi): string {
  const start = event.start
  if (!start) return ''
  if (event.allDay) {
    const endExc = event.end ?? addDays(start, 1)
    const endInc = addDays(endExc, -1)
    return isSameDay(start, endInc)
      ? format(start, 'EEEE, MMM d, yyyy')
      : `${format(start, 'MMM d, yyyy')} – ${format(endInc, 'MMM d, yyyy')}`
  }
  const end = event.end ?? new Date(start.getTime() + 3600000)
  const dayPart = 'EEE, MMM d, yyyy'
  if (isSameDay(start, end)) {
    return `${format(start, dayPart)} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
  }
  return `${format(start, `${dayPart} · HH:mm`)} – ${format(end, `${dayPart} · HH:mm`)}`
}

function buildHoverModel(event: EventApi): CalendarHoverModel | null {
  const ep = event.extendedProps as Record<string, unknown>
  if (!ep || typeof ep !== 'object') return null
  if (ep.kind === 'holiday') {
    return { kind: 'holiday', title: event.title || 'Holiday', when: formatWhenFromApi(event) }
  }
  if (ep.kind === 'task' && ep.task && typeof ep.task === 'object') {
    return {
      kind: 'task',
      task: ep.task as RenovationTask,
      when: formatWhenFromApi(event),
    }
  }
  if (ep.kind === 'calendar' && ep.event && typeof ep.event === 'object') {
    return {
      kind: 'calendar',
      ev: ep.event as RenovationCalendarEvent,
      when: formatWhenFromApi(event),
    }
  }
  return null
}

/**
 * FullCalendar may pass the inner custom-render root; use the real event box for week/day grid.
 */
function getEventAnchorRect(el: HTMLElement): DOMRect {
  const anchor =
    el.closest<HTMLElement>('.fc-timegrid-event') ??
    el.closest<HTMLElement>('.fc-daygrid-event') ??
    el
  return anchor.getBoundingClientRect()
}

/**
 * Place below when there is room; otherwise pin above the event using translateY(-100%)
 * so the gap does not depend on estimated card height (fixes week-view “floating” tooltip).
 */
function computeHoverStyle(rect: DOMRect): CSSProperties {
  const margin = 10
  const gap = 6
  const left = Math.max(
    margin,
    Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.innerWidth - CARD_W - margin)
  )
  const spaceBelow = window.innerHeight - margin - rect.bottom
  const spaceAbove = rect.top - margin

  const placeBelow = spaceBelow >= MIN_SPACE_BELOW || spaceBelow >= spaceAbove

  if (placeBelow) {
    return { top: rect.bottom + gap, left, width: CARD_W }
  }
  return {
    top: rect.top,
    left,
    width: CARD_W,
    transform: `translateY(calc(-100% - ${gap}px))`,
  }
}

const TASK_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

function typeBadge(model: CalendarHoverModel): { label: string; className: string } {
  if (model.kind === 'holiday') {
    return { label: 'Holiday', className: 'bg-slate-100 text-slate-700' }
  }
  if (model.kind === 'task') {
    return { label: 'Task', className: 'bg-emerald-50 text-emerald-800' }
  }
  if (model.ev.event_type === 'provider_meeting') {
    return { label: 'Provider meeting', className: 'bg-violet-50 text-violet-900' }
  }
  return { label: 'Event', className: 'bg-sky-50 text-sky-950' }
}

function accentClass(model: CalendarHoverModel): string {
  if (model.kind === 'holiday') return 'border-l-slate-400'
  if (model.kind === 'task') return 'border-l-emerald-600'
  if (model.kind === 'calendar' && model.ev.event_type === 'provider_meeting') {
    return 'border-l-violet-600'
  }
  return 'border-l-sky-600'
}

function HoverCardBody({ model }: { model: CalendarHoverModel }) {
  const badge = typeBadge(model)

  const title =
    model.kind === 'holiday'
      ? model.title
      : model.kind === 'task'
        ? model.task.title
        : model.ev.title || 'Untitled'

  const preview =
    model.kind === 'task'
      ? stripPreviewText(model.task.body, 220)
      : model.kind === 'calendar'
        ? stripPreviewText(model.ev.body, 220)
        : null

  const address = model.kind === 'calendar' ? model.ev.address?.trim() || null : null
  const providerName =
    model.kind === 'calendar'
      ? model.ev.provider?.name?.trim() || null
      : model.kind === 'task'
        ? model.task.provider?.name?.trim() || null
        : null
  const roomName = model.kind === 'task' ? model.task.room?.name?.trim() || null : null
  const statusLabel =
    model.kind === 'task' ? TASK_STATUS_LABEL[model.task.status] ?? model.task.status : null

  return (
    <div
      dir="auto"
      className={cn(
        'overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-lg',
        'animate-in fade-in zoom-in-95 duration-150',
        'border-l-4 pl-3 pr-3.5 py-3',
        accentClass(model)
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide',
            badge.className
          )}
        >
          {badge.label}
        </span>
        {statusLabel ? (
          <span className="truncate text-[11px] font-medium text-slate-500">{statusLabel}</span>
        ) : null}
      </div>
      <h3 className="text-[15px] font-semibold leading-snug text-[#202124]">{title}</h3>
      <div className="mt-2 flex items-start gap-2 text-[12px] text-[#5f6368]">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
        <span className="leading-snug">{model.when}</span>
      </div>
      {roomName ? (
        <div className="mt-1.5 flex items-start gap-2 text-[12px] text-[#5f6368]">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="leading-snug">{roomName}</span>
        </div>
      ) : null}
      {address ? (
        <div className="mt-1.5 flex items-start gap-2 text-[12px] text-[#5f6368]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="leading-snug">{address}</span>
        </div>
      ) : null}
      {providerName ? (
        <div className="mt-1.5 flex items-start gap-2 text-[12px] text-[#5f6368]">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="leading-snug">{providerName}</span>
        </div>
      ) : null}
      {preview ? (
        <div className="mt-2.5 flex items-start gap-2 border-t border-[#e8eaed] pt-2.5 text-[12px] leading-relaxed text-[#3c4043]">
          <AlignLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <p className="line-clamp-5 whitespace-pre-wrap">{preview}</p>
        </div>
      ) : null}
    </div>
  )
}

type HoverState = { rect: DOMRect; model: CalendarHoverModel }

export function useCalendarEventHover(): {
  eventMouseEnter: (info: EventClickArg) => void
  eventMouseLeave: (info: EventClickArg) => void
  hoverPortal: ReactNode
} {
  const [state, setState] = useState<HoverState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHide()
    hideTimer.current = setTimeout(() => setState(null), HIDE_DELAY_MS)
  }, [clearHide])

  const eventMouseEnter = useCallback(
    (info: EventClickArg) => {
      clearHide()
      const model = buildHoverModel(info.event)
      if (!model) return
      setState({ rect: getEventAnchorRect(info.el as HTMLElement), model })
    },
    [clearHide]
  )

  const eventMouseLeave = useCallback(() => {
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => () => clearHide(), [clearHide])

  useEffect(() => {
    if (!state) return
    const dismiss = () => setState(null)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [state])

  const hoverStyle = useMemo(() => (state ? computeHoverStyle(state.rect) : null), [state])

  const hoverPortal =
    state && hoverStyle && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="pointer-events-auto fixed z-[500]"
            style={hoverStyle}
            onMouseEnter={clearHide}
            onMouseLeave={scheduleHide}
            role="region"
            aria-label="Calendar event details"
          >
            <HoverCardBody model={state.model} />
          </div>,
          document.body
        )
      : null

  return { eventMouseEnter, eventMouseLeave, hoverPortal }
}
