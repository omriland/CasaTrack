'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, format } from 'date-fns'
import type { RenovationMilestone } from '@/types/renovation'
import {
  buildAxis,
  buildWeekHeaders,
  colForEnd,
  colForStart,
  computeAxisRange,
  formatRange,
  toYmd,
} from '@/components/renovation/views/roadmap-shared'

const LEFT_W = 220
const COL_W = 46
const ROW_H = 48
const WEEK_W = COL_W * 5
const HEADER_H = 56

interface RoadmapGanttProps {
  milestones: RenovationMilestone[]
  hideDone: boolean
  className?: string
  /** When true, the chart is view-only: no drag, no create, no editing. */
  readOnly?: boolean
  onOpen?: (milestone: RenovationMilestone) => void
  onCreateDraft?: (startYmd: string, endYmd: string) => void
  onPersist?: (id: string, patch: { start_date: string; end_date: string }) => void
}

type DragState =
  | {
      kind: 'move' | 'resize-start' | 'resize-end'
      id: string
      origLeft: number
      origRight: number
      anchorCol: number
      left: number
      right: number
      moved: boolean
    }
  | {
      kind: 'create'
      anchorCol: number
      left: number
      right: number
      moved: boolean
    }
  | null

export function RoadmapGantt({
  milestones,
  hideDone,
  className,
  readOnly = false,
  onOpen,
  onCreateDraft,
  onPersist,
}: RoadmapGanttProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState>(null)
  const dragRef = useRef<DragState>(null)

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  const { startSunday, weeks } = useMemo(() => computeAxisRange(milestones), [milestones])
  const cols = useMemo(() => buildAxis(startSunday, weeks), [startSunday, weeks])
  const weekHeaders = useMemo(() => buildWeekHeaders(startSunday, weeks), [startSunday, weeks])
  const totalW = cols.length * COL_W
  const maxCol = cols.length - 1

  const rows = useMemo(() => {
    const list = hideDone ? milestones.filter((m) => !m.done) : milestones
    return [...list].sort(
      (a, b) => a.start_date.localeCompare(b.start_date) || a.sort_order - b.sort_order
    )
  }, [milestones, hideDone])

  const weekItems = useMemo(() => {
    const map = new Map<number, RenovationMilestone[]>()
    for (const w of weekHeaders) {
      const ws = toYmd(w.start)
      const we = toYmd(addDays(w.start, 6))
      map.set(
        w.weekIndex,
        milestones
          .filter((m) => m.start_date <= we && m.end_date >= ws)
          .sort((a, b) => a.start_date.localeCompare(b.start_date))
      )
    }
    return map
  }, [weekHeaders, milestones])

  const todayCol = useMemo(() => {
    const today = toYmd(new Date())
    if (cols.length === 0) return null
    if (today < cols[0].ymd) return null
    if (today > cols[cols.length - 1].ymd) return null
    return colForStart(cols, today)
  }, [cols])

  const colAtClientX = (clientX: number): number => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const c = Math.floor((clientX - rect.left) / COL_W)
    return Math.max(0, Math.min(maxCol, c))
  }

  const barGeometry = (m: RenovationMilestone) => {
    const left = colForStart(cols, m.start_date)
    let right = colForEnd(cols, m.end_date)
    if (right < left) right = left
    return { left, right }
  }

  const startBarDrag = (
    e: React.PointerEvent,
    m: RenovationMilestone,
    kind: 'move' | 'resize-start' | 'resize-end'
  ) => {
    if (readOnly) return
    e.preventDefault()
    e.stopPropagation()
    const { left, right } = barGeometry(m)
    const anchorCol = colAtClientX(e.clientX)
    setDrag({ kind, id: m.id, origLeft: left, origRight: right, anchorCol, left, right, moved: false })
  }

  const startCreateDrag = (e: React.PointerEvent) => {
    if (readOnly || e.button !== 0) return
    e.preventDefault()
    const anchorCol = colAtClientX(e.clientX)
    setDrag({ kind: 'create', anchorCol, left: anchorCol, right: anchorCol, moved: false })
  }

  useEffect(() => {
    if (!drag) return

    const onMove = (e: PointerEvent) => {
      const curCol = colAtClientX(e.clientX)
      setDrag((prev) => {
        if (!prev) return prev
        if (prev.kind === 'create') {
          const left = Math.min(prev.anchorCol, curCol)
          const right = Math.max(prev.anchorCol, curCol)
          return { ...prev, left, right, moved: prev.moved || curCol !== prev.anchorCol }
        }
        const span = prev.origRight - prev.origLeft
        const dCol = curCol - prev.anchorCol
        let left = prev.origLeft
        let right = prev.origRight
        if (prev.kind === 'move') {
          left = Math.max(0, Math.min(maxCol - span, prev.origLeft + dCol))
          right = left + span
        } else if (prev.kind === 'resize-start') {
          left = Math.max(0, Math.min(prev.origRight, curCol))
          right = prev.origRight
        } else {
          left = prev.origLeft
          right = Math.max(prev.origLeft, Math.min(maxCol, curCol))
        }
        const moved = prev.moved || left !== prev.origLeft || right !== prev.origRight
        return { ...prev, left, right, moved }
      })
    }

    const onUp = () => {
      const prev = dragRef.current
      setDrag(null)
      if (!prev) return
      if (prev.kind === 'create') {
        onCreateDraft?.(cols[prev.left].ymd, cols[prev.right].ymd)
      } else if (prev.moved) {
        onPersist?.(prev.id, { start_date: cols[prev.left].ymd, end_date: cols[prev.right].ymd })
      } else {
        const m = milestones.find((x) => x.id === prev.id)
        if (m) onOpen?.(m)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    document.body.style.userSelect = 'none'
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, cols, maxCol, milestones])

  const dayLines: React.CSSProperties = {
    backgroundImage: `repeating-linear-gradient(90deg, rgba(148,163,184,0.16) 0 1px, transparent 1px ${COL_W}px)`,
  }

  // Shared timeline background: alternating week bands, day lines, week separators, today line.
  const TimelineBackground = () => (
    <div className="pointer-events-none absolute inset-0">
      {weekHeaders.map((w) => (
        <div
          key={w.weekIndex}
          className={w.weekIndex % 2 === 1 ? 'absolute inset-y-0 bg-slate-50/70' : 'absolute inset-y-0'}
          style={{ left: w.weekIndex * WEEK_W, width: WEEK_W }}
        />
      ))}
      <div className="absolute inset-0" style={dayLines} />
      {weekHeaders.map((w) => (
        <div
          key={`sep-${w.weekIndex}`}
          className="absolute inset-y-0 w-px bg-slate-200"
          style={{ left: w.weekIndex * WEEK_W }}
        />
      ))}
      {todayCol !== null && (
        <div
          className="absolute inset-y-0 w-[2px] bg-indigo-500/70"
          style={{ left: todayCol * COL_W }}
        />
      )}
    </div>
  )

  return (
    <div
      className={`scrollbar-hide overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm ${className ?? ''}`}
    >
      <div className="relative flex min-h-full min-w-full flex-col" style={{ width: LEFT_W + totalW }}>
        {/* Header */}
        <div className="sticky top-0 z-30 flex shrink-0" style={{ height: HEADER_H }}>
          <div
            className="sticky left-0 z-40 flex shrink-0 items-end border-b border-r border-slate-200 bg-white px-4 pb-2"
            style={{ width: LEFT_W }}
          >
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Milestone
            </span>
          </div>
          <div className="relative shrink-0 border-b border-slate-200 bg-white" style={{ width: totalW }}>
            <div className="flex">
              {weekHeaders.map((w) => {
                const items = weekItems.get(w.weekIndex) ?? []
                const isLastWeeks = w.weekIndex >= weekHeaders.length - 2
                return (
                  <div
                    key={w.weekIndex}
                    className={`group/week relative flex items-center border-l border-slate-200 px-2 ${
                      w.weekIndex % 2 === 1 ? 'bg-slate-50/70' : ''
                    }`}
                    style={{ width: WEEK_W, height: HEADER_H - 26 }}
                  >
                    <span className="cursor-default text-[12px] font-bold text-slate-600 group-hover/week:text-indigo-600">
                      {w.label}
                    </span>
                    <div
                      className={`absolute top-full z-50 mt-1.5 hidden w-72 group-hover/week:block ${
                        isLastWeeks ? 'right-2' : 'left-2'
                      }`}
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)]">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3.5 py-2.5">
                          <span className="text-[12px] font-bold text-slate-700">
                            Week of {w.label}
                          </span>
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        {items.length === 0 ? (
                          <p className="px-3.5 py-4 text-[12px] text-slate-400">
                            No milestones this week.
                          </p>
                        ) : (
                          <ul className="max-h-72 space-y-px overflow-y-auto py-1.5">
                            {items.map((m) => (
                              <li
                                key={m.id}
                                className="flex items-center gap-2.5 px-3.5 py-1.5"
                              >
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: m.color, opacity: m.done ? 0.4 : 1 }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`truncate text-[13px] font-semibold ${
                                      m.done ? 'text-slate-400 line-through' : 'text-slate-800'
                                    }`}
                                    dir="auto"
                                  >
                                    {m.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {formatRange(m.start_date, m.end_date)}
                                  </p>
                                </div>
                                {m.done && (
                                  <svg
                                    className="h-4 w-4 shrink-0 text-emerald-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex">
              {cols.map((c, i) => {
                const isToday = todayCol === i
                return (
                  <div
                    key={c.ymd}
                    className={`flex flex-col items-center justify-center border-l border-slate-100 ${
                      c.isWeekStart ? 'border-l-slate-200' : ''
                    } ${isToday ? 'bg-indigo-50' : ''}`}
                    style={{ width: COL_W, height: 26 }}
                  >
                    <span
                      className={`text-[11px] font-bold leading-none tabular-nums ${
                        isToday ? 'text-indigo-600' : 'text-slate-600'
                      }`}
                    >
                      {format(c.date, 'd')}
                    </span>
                    <span
                      className={`mt-0.5 text-[9px] font-semibold uppercase leading-none ${
                        isToday ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    >
                      {format(c.date, 'EEEEE')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {/* Shared background spanning all rows + filler, offset to the timeline. */}
          <div className="absolute inset-y-0 z-0" style={{ left: LEFT_W, width: totalW }}>
            <TimelineBackground />
          </div>

          {rows.map((m) => {
            const isDragTarget = drag && 'id' in drag && drag.id === m.id
            const geo = isDragTarget ? { left: drag.left, right: drag.right } : barGeometry(m)
            const left = geo.left * COL_W
            const width = (geo.right - geo.left + 1) * COL_W
            return (
              <div key={m.id} className="relative z-10 flex shrink-0" style={{ height: ROW_H }}>
                <div
                  className="sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-b border-r border-slate-200 bg-white px-4"
                  style={{ width: LEFT_W }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: m.color, opacity: m.done ? 0.4 : 1 }}
                  />
                  {readOnly ? (
                    <span
                      className={`min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold ${
                        m.done ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}
                      dir="auto"
                      title={m.title}
                    >
                      {m.title}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpen?.(m)}
                      className={`min-w-0 flex-1 truncate text-left text-[13.5px] font-semibold transition-colors hover:text-indigo-600 ${
                        m.done ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}
                      dir="auto"
                      title={m.title}
                    >
                      {m.title}
                    </button>
                  )}
                </div>
                <div className="relative shrink-0 border-b border-slate-100" style={{ width: totalW }}>
                  <div className="group absolute top-1.5 bottom-1.5 z-[2]" style={{ left, width }}>
                    <div
                      role={readOnly ? undefined : 'button'}
                      tabIndex={readOnly ? undefined : 0}
                      onPointerDown={readOnly ? undefined : (e) => startBarDrag(e, m, 'move')}
                      onKeyDown={
                        readOnly
                          ? undefined
                          : (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onOpen?.(m)
                              }
                            }
                      }
                      className={`absolute inset-0 flex items-center overflow-hidden rounded-lg px-2.5 ring-1 ring-black/5 transition-all ${
                        readOnly ? 'cursor-default' : 'cursor-grab hover:brightness-105 hover:shadow-md active:cursor-grabbing'
                      }`}
                      style={{
                        backgroundColor: m.color,
                        opacity: m.done ? 0.55 : 1,
                      }}
                    >
                      {!readOnly && (
                        <span
                          onPointerDown={(e) => startBarDrag(e, m, 'resize-start')}
                          className="absolute left-0 top-0 bottom-0 z-[3] flex w-2.5 cursor-ew-resize items-center justify-center"
                          aria-hidden="true"
                        >
                          <span className="h-3.5 w-0.5 rounded-full bg-white/0 transition-colors group-hover:bg-white/60" />
                        </span>
                      )}
                      {m.done && (
                        <svg
                          className="mr-1 h-3.5 w-3.5 shrink-0 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span
                        className={`truncate text-[12px] font-semibold text-white ${m.done ? 'line-through' : ''}`}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.22)' }}
                        dir="auto"
                      >
                        {m.title}
                      </span>
                      {!readOnly && (
                        <span
                          onPointerDown={(e) => startBarDrag(e, m, 'resize-end')}
                          className="absolute right-0 top-0 bottom-0 z-[3] flex w-2.5 cursor-ew-resize items-center justify-center"
                          aria-hidden="true"
                        >
                          <span className="h-3.5 w-0.5 rounded-full bg-white/0 transition-colors group-hover:bg-white/60" />
                        </span>
                      )}
                    </div>
                    <div
                      className="pointer-events-none absolute bottom-full left-0 z-[20] mb-1.5 hidden max-w-[320px] truncate whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-lg group-hover:block"
                      dir="auto"
                    >
                      {m.title}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Create surface fills the remaining height. */}
          <div className="relative z-10 flex min-h-0 flex-1" style={{ minHeight: ROW_H }}>
            <div
              className="sticky left-0 z-20 flex shrink-0 items-start border-r border-slate-200 bg-white px-4 pt-3"
              style={{ width: LEFT_W }}
            >
              {!readOnly && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Drag to create
                </span>
              )}
            </div>
            <div
              ref={timelineRef}
              className={`relative shrink-0 ${readOnly ? '' : 'cursor-crosshair'}`}
              style={{ width: totalW }}
              onPointerDown={startCreateDrag}
            >
              {rows.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                  <span className="rounded-full bg-white/80 px-4 py-2 text-[13px] font-medium text-slate-400 shadow-sm ring-1 ring-slate-200">
                    {readOnly ? 'No milestones yet.' : 'No milestones yet — drag here or use “New milestone”.'}
                  </span>
                </div>
              )}
              {drag?.kind === 'create' && (
                <div
                  className="pointer-events-none absolute top-2 z-[2] h-9 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-200/50"
                  style={{ left: drag.left * COL_W, width: (drag.right - drag.left + 1) * COL_W }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
