'use client'

import { addDays, format, isSameDay } from 'date-fns'
import { AlignLeft, CalendarDays, Clock, MapPin, User } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { FcAppEvent } from '@/components/renovation/renovation-fullcalendar-map'
import { cn } from '@/utils/common'
import type { RenovationCalendarEvent, RenovationTask } from '@/types/renovation'

type FcEvent = FcAppEvent

const HIDE_DELAY_MS = 220
const CARD_W = 320
const SIDE_GAP = 10
const VIEWPORT_MARGIN = 10

export type CalendarHoverModel =
  | { kind: 'holiday'; title: string; when: string }
  | { kind: 'task'; task: RenovationTask; when: string }
  | { kind: 'calendar'; ev: RenovationCalendarEvent; when: string }

type CalendarHoverContextValue = {
  onMouseEnter: (event: FcEvent, el: HTMLElement) => void
  onMouseLeave: () => void
  /** Clears the hover card immediately (e.g. before opening a context menu). */
  dismissHoverNow: () => void
}

export const CalendarHoverContext = createContext<CalendarHoverContextValue>({
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  dismissHoverNow: () => {},
})

export function useCalendarHover() {
  return useContext(CalendarHoverContext)
}

function stripPreviewText(raw: string | null | undefined, maxLen: number): string | null {
  if (!raw?.trim()) return null
  const t = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t) return null
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

function formatWhen(event: FcEvent): string {
  const { start, end, allDay } = event
  if (allDay) {
    // Our SxAppEvent stores `end` as an exclusive day-after marker (so
    // `end < now` works for `isPast`), so subtract one day for display.
    const endInc = addDays(end, -1)
    return isSameDay(start, endInc)
      ? format(start, 'EEEE, MMM d, yyyy')
      : `${format(start, 'MMM d, yyyy')} – ${format(endInc, 'MMM d, yyyy')}`
  }
  if (isSameDay(start, end)) {
    return `${format(start, 'EEE, MMM d, yyyy')} · ${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`
  }
  return `${format(start, 'EEE, MMM d · HH:mm')} – ${format(end, 'EEE, MMM d · HH:mm')}`
}

function buildHoverModel(event: FcEvent): CalendarHoverModel | null {
  if (event.kind === 'holiday') {
    return { kind: 'holiday', title: event.title, when: formatWhen(event) }
  }
  if (event.kind === 'task' && event.task) {
    return { kind: 'task', task: event.task, when: formatWhen(event) }
  }
  if (event.kind === 'calendar' && event.renovationEvent) {
    return { kind: 'calendar', ev: event.renovationEvent, when: formatWhen(event) }
  }
  return null
}

function getAnchorRect(el: HTMLElement): DOMRect {
  const anchor = el.closest<HTMLElement>('.fc-event') ?? el
  return anchor.getBoundingClientRect()
}

/**
 * Place the hover card to the right or left of the anchor — never above or
 * below — vertically centred against the anchor and clamped to the viewport.
 * Picks whichever side has the most room; if neither side can hold the full
 * card width, the card width is reduced to fit the wider side.
 */
function computeHoverStyle(rect: DOMRect): CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const spaceRight = vw - rect.right - VIEWPORT_MARGIN
  const spaceLeft = rect.left - VIEWPORT_MARGIN
  const fitsRight = spaceRight >= CARD_W + SIDE_GAP
  const fitsLeft = spaceLeft >= CARD_W + SIDE_GAP

  let placeRight: boolean
  if (fitsRight && fitsLeft) placeRight = spaceRight >= spaceLeft
  else if (fitsRight) placeRight = true
  else if (fitsLeft) placeRight = false
  else placeRight = spaceRight >= spaceLeft

  // Width — shrink only when the card cannot fit the chosen side at all.
  const availableSide = placeRight ? spaceRight : spaceLeft
  const width = Math.min(CARD_W, Math.max(220, availableSide - SIDE_GAP))

  const left = placeRight
    ? Math.min(rect.right + SIDE_GAP, vw - width - VIEWPORT_MARGIN)
    : Math.max(VIEWPORT_MARGIN, rect.left - SIDE_GAP - width)

  // Vertical centring against the anchor, clamped so the card stays fully
  // on-screen.  We assume an upper-bound card height; the actual card is
  // typically 140–260 px tall.  Using a generous estimate keeps the clamp
  // gentle — a tiny visual drift is preferable to either edge clipping.
  const estCardH = 240
  const halfH = estCardH / 2
  const anchorMid = rect.top + rect.height / 2
  const top = Math.max(VIEWPORT_MARGIN + halfH, Math.min(anchorMid, vh - VIEWPORT_MARGIN - halfH))

  return {
    top,
    left,
    width,
    // Translate up by half the card's own height — keeps it centred on the
    // anchor regardless of the actual rendered height.
    transform: 'translateY(-50%)',
    maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
    overflowY: 'auto',
  }
}

const TASK_STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In progress', blocked: 'Blocked', done: 'Done',
}

function typeBadge(model: CalendarHoverModel): { label: string; className: string } {
  if (model.kind === 'holiday') return { label: 'Holiday', className: 'bg-slate-100 text-slate-700' }
  if (model.kind === 'task') return { label: 'Task', className: 'bg-emerald-50 text-emerald-800' }
  if (model.kind === 'calendar' && model.ev.event_type === 'provider_meeting')
    return { label: 'Provider meeting', className: 'bg-violet-50 text-violet-900' }
  if (model.kind === 'calendar' && model.ev.event_type === 'supervision')
    return { label: 'Supervision', className: 'bg-lime-50 text-lime-900' }
  return { label: 'Event', className: 'bg-sky-50 text-sky-950' }
}

function accentClass(model: CalendarHoverModel): string {
  if (model.kind === 'holiday') return 'border-r-slate-400'
  if (model.kind === 'task') return 'border-r-emerald-600'
  if (model.kind === 'calendar' && model.ev.event_type === 'provider_meeting') return 'border-r-violet-600'
  if (model.kind === 'calendar' && model.ev.event_type === 'supervision') return 'border-r-lime-600'
  return 'border-r-sky-600'
}

function HoverCardBody({ model }: { model: CalendarHoverModel }) {
  const badge = typeBadge(model)
  const title =
    model.kind === 'holiday' ? model.title
    : model.kind === 'task' ? model.task.title
    : model.ev.title || 'Untitled'
  const preview =
    model.kind === 'task' ? stripPreviewText(model.task.body, 220)
    : model.kind === 'calendar' ? stripPreviewText(model.ev.body, 220)
    : null
  const address = model.kind === 'calendar' ? model.ev.address?.trim() || null : null
  const providerName =
    model.kind === 'calendar' ? model.ev.provider?.name?.trim() || null
    : model.kind === 'task' ? model.task.provider?.name?.trim() || null
    : null
  const roomName = model.kind === 'task' ? model.task.room?.name?.trim() || null : null
  const statusLabel = model.kind === 'task' ? TASK_STATUS_LABEL[model.task.status] ?? model.task.status : null

  return (
    <div
      dir="auto"
      className={cn(
        'overflow-hidden rounded-xl border border-[#dadce0] bg-white text-right shadow-lg',
        'animate-in fade-in zoom-in-95 duration-150',
        'border-r-4 pl-3 pr-3.5 py-3',
        accentClass(model),
      )}
    >
      <div className="mb-2 flex flex-row-reverse items-center gap-2">
        <span className={cn('inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide', badge.className)}>
          {badge.label}
        </span>
        {statusLabel && <span className="truncate text-[11px] font-medium text-slate-500">{statusLabel}</span>}
      </div>
      <h3 className="text-[15px] font-semibold leading-snug text-[#202124]">{title}</h3>
      <div className="mt-2 flex flex-row-reverse items-start gap-2 text-[12px] text-[#5f6368]">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
        <span className="flex-1 leading-snug">{model.when}</span>
      </div>
      {roomName && (
        <div className="mt-1.5 flex flex-row-reverse items-start gap-2 text-[12px] text-[#5f6368]">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="flex-1 leading-snug">{roomName}</span>
        </div>
      )}
      {address && (
        <div className="mt-1.5 flex flex-row-reverse items-start gap-2 text-[12px] text-[#5f6368]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="flex-1 leading-snug">{address}</span>
        </div>
      )}
      {providerName && (
        <div className="mt-1.5 flex flex-row-reverse items-start gap-2 text-[12px] text-[#5f6368]">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <span className="flex-1 leading-snug">{providerName}</span>
        </div>
      )}
      {preview && (
        <div className="mt-2.5 flex flex-row-reverse items-start gap-2 border-t border-[#e8eaed] pt-2.5 text-[12px] leading-relaxed text-[#3c4043]">
          <AlignLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70757a]" aria-hidden />
          <p className="line-clamp-5 flex-1 whitespace-pre-wrap">{preview}</p>
        </div>
      )}
    </div>
  )
}

type HoverState = { rect: DOMRect; model: CalendarHoverModel }

export function useCalendarEventHover(): {
  hoverContextValue: CalendarHoverContextValue
  hoverPortal: ReactNode
} {
  const [state, setState] = useState<HoverState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHide = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHide()
    hideTimer.current = setTimeout(() => setState(null), HIDE_DELAY_MS)
  }, [clearHide])

  const onMouseEnter = useCallback((event: FcEvent, el: HTMLElement) => {
    clearHide()
    const model = buildHoverModel(event)
    if (!model) return
    setState({ rect: getAnchorRect(el), model })
  }, [clearHide])

  const dismissHoverNow = useCallback(() => {
    clearHide()
    setState(null)
  }, [clearHide])

  const hoverContextValue = useMemo(
    () => ({ onMouseEnter, onMouseLeave: scheduleHide, dismissHoverNow }),
    [onMouseEnter, scheduleHide, dismissHoverNow],
  )

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
          document.body,
        )
      : null

  return { hoverContextValue, hoverPortal }
}
