'use client'

import { addDays, addMonths, addWeeks, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarEventDetailDrawer } from '@/components/renovation/CalendarEventDetailDrawer'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { CalendarQuickCreatePopover } from '@/components/renovation/CalendarQuickCreatePopover'
import { RenovationCalendar } from '@/components/renovation/RenovationCalendar'
import type { QuickCreateAnchor } from '@/components/renovation/renovation-fullcalendar-map'
import { calendarEventOnLocalDay, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { TaskModal } from '@/components/renovation/TaskModal'
import { listLabels, listRooms, listTeamMembers } from '@/lib/renovation'
import type {
  RenovationCalendarEvent,
  RenovationLabel,
  RenovationRoom,
  RenovationTask,
  RenovationTeamMember,
} from '@/types/renovation'
import { useCalendarPageState } from './useCalendarPageState'

export function CalendarDesktop() {
  const {
    project,
    cursor,
    setCursor,
    calendarView,
    setCalendarView,
    events,
    tasks,
    providers,
    loading,
    load,
    showTasks,
    setShowTasks,
    showCompletedTasks,
    setShowCompletedTasks,
    eventModalOpen,
    viewingEvent,
    initialDayKey,
    initialTimedRange,
    initialTitle,
    openNewEvent,
    openNewEventTimed,
    openEditEvent,
    closeEventModal,
    closeEventView,
    viewingTask,
    closeTaskView,
    openEditTask,
    openTaskFormModal,
    taskFormModalOpen,
    editingTask,
    closeTaskFormModal,
    setTasks,
  } = useCalendarPageState()

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [quickAnchor, setQuickAnchor] = useState<QuickCreateAnchor | null>(null)
  /** FullCalendar can fire `dateClick` after `eventClick`; skip selecting that day when opening an event. */
  const suppressNextDateClickRef = useRef(false)

  const handleCalendarEditEvent = (ev: RenovationCalendarEvent) => {
    suppressNextDateClickRef.current = true
    openEditEvent(ev)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        suppressNextDateClickRef.current = false
      })
    })
  }

  const loadMeta = useCallback(async () => {
    if (!project) return
    try {
      const [m, l, r] = await Promise.all([
        listTeamMembers(project.id),
        listLabels(project.id),
        listRooms(project.id),
      ])
      setMembers(m)
      setLabels(l)
      setRooms(r)
    } catch (e) {
      console.error(e)
    }
  }, [project])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  useEffect(() => {
    if (taskFormModalOpen || viewingTask) loadMeta()
  }, [taskFormModalOpen, viewingTask, loadMeta])

  const itemsForDay = useMemo(() => {
    const fn = (d: Date) => {
      const evs = events.filter(e => calendarEventOnLocalDay(e, d))
      const tks = showTasks ? tasks.filter(t => taskDueOnLocalDay(t, d)) : []
      return { events: evs, tasks: tks }
    }
    return fn
  }, [events, tasks, showTasks])

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  const viewingEventLive = useMemo(
    () => (viewingEvent ? events.find((e) => e.id === viewingEvent.id) ?? viewingEvent : null),
    [events, viewingEvent],
  )

  const viewingTaskLive = useMemo(
    () => (viewingTask ? tasks.find((t) => t.id === viewingTask.id) ?? viewingTask : null),
    [tasks, viewingTask],
  )

  if (!project) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-[#dadce0] bg-[#f8f9fa]">
        <h3 className="mb-2 text-xl font-medium text-[#3c4043]">No Project Assigned</h3>
        <p className="text-[14px] text-[#5f6368]">
          <a href="/renovation" className="font-medium text-[#1a73e8] hover:underline">
            Create or select a project first
          </a>
        </p>
      </div>
    )
  }

  const selectedDate = selectedKey ? new Date(selectedKey + 'T12:00:00') : null
  const selectedItems = selectedKey
    ? itemsForDay(selectedDate!)
    : { events: [] as RenovationCalendarEvent[], tasks: [] as RenovationTask[] }

  const isToday = (() => {
    const today = new Date()
    if (calendarView === 'month') {
      return cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth()
    }
    if (calendarView === 'day') {
      return (
        cursor.getFullYear() === today.getFullYear() &&
        cursor.getMonth() === today.getMonth() &&
        cursor.getDate() === today.getDate()
      )
    }
    const ws = startOfWeek(today, { weekStartsOn: 0 })
    const cs = startOfWeek(cursor, { weekStartsOn: 0 })
    return ws.getTime() === cs.getTime()
  })()

  return (
    <div className="flex flex-col gap-0 bg-white pb-8 animate-fade-in-up">
      <header className="px-4 pt-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="shrink-0 text-[20px] font-bold leading-none tracking-[-0.02em] text-slate-900 font-[family-name:var(--font-varela-round)]">
              Calendar
            </h1>

            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    calendarView === 'month'
                      ? subMonths(cursor, 1)
                      : calendarView === 'week'
                        ? subWeeks(cursor, 1)
                        : subDays(cursor, 1),
                  )
                }
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label={calendarView === 'month' ? 'Previous month' : calendarView === 'week' ? 'Previous week' : 'Previous day'}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setCursor(new Date())}
                disabled={isToday}
                className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-colors ${
                  isToday
                    ? 'cursor-default text-slate-400'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    calendarView === 'month'
                      ? addMonths(cursor, 1)
                      : calendarView === 'week'
                        ? addWeeks(cursor, 1)
                        : addDays(cursor, 1),
                  )
                }
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label={calendarView === 'month' ? 'Next month' : calendarView === 'week' ? 'Next week' : 'Next day'}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <h2 className="truncate text-[18px] font-semibold leading-none tracking-[-0.015em] text-slate-900">
              {calendarView === 'month'
                ? format(cursor, 'MMMM yyyy')
                : calendarView === 'week'
                  ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                  : format(cursor, 'EEEE, MMM d, yyyy')}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Filters */}
            <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setShowTasks(!showTasks)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-all ${
                  showTasks
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {showTasks && (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                Tasks
              </button>
              <button
                type="button"
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                disabled={!showTasks}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-all ${
                  !showTasks
                    ? 'cursor-not-allowed text-slate-300'
                    : showCompletedTasks
                      ? 'bg-white text-slate-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {showCompletedTasks && showTasks && (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                  </svg>
                )}
                Completed
              </button>
            </div>

            {/* View switcher — segmented control */}
            <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarView(mode)}
                  className={`h-8 rounded-lg px-3 text-[13px] font-semibold transition-all ${
                    calendarView === mode
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'Day'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openNewEvent(null)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_-2px_rgba(79,70,229,0.55)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
            >
              <svg className="h-[14px] w-[14px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Create
            </button>
          </div>
        </div>
      </header>

      <div className="mt-3 w-full">
        {loading ? (
          <div className="reno-cal reno-cal-gcal min-h-[620px] animate-pulse rounded-[8px] border border-black/[0.07] bg-[oklch(0.97_0_0)]" />
        ) : (
          <RenovationCalendar
            view={calendarView}
            cursor={cursor}
            events={events}
            tasks={tasks}
            showTasks={showTasks}
            onDateClick={(k) => {
              if (suppressNextDateClickRef.current) return
              setSelectedKey(k)
            }}
            onEditEvent={handleCalendarEditEvent}
            onEditTask={(t) => {
              suppressNextDateClickRef.current = true
              openEditTask(t)
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  suppressNextDateClickRef.current = false
                })
              })
            }}
            onCreateTimedRange={openNewEventTimed}
            onCreateForDay={(dayKey) => openNewEvent(dayKey)}
            onEventUpdated={() => load()}
            onCursorChange={(d) => setCursor(d)}
            onQuickCreate={(anchor) => {
              suppressNextDateClickRef.current = true
              setQuickAnchor(anchor)
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  suppressNextDateClickRef.current = false
                })
              })
            }}
          />
        )}
      </div>

      {selectedKey && selectedDate && calendarView === 'month' && (
        <div className="mt-8 rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm animate-fade-in">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f3f4] pb-4">
            <h3 className="text-[18px] font-normal text-[#3c4043] flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a73e8] text-xl text-white">
                {format(selectedDate, 'd')}
              </span>
              {format(selectedDate, 'EEEE, MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={() => openNewEvent(selectedKey)}
              className="rounded-full bg-white border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa] hover:border-[#d2e3fc] transition-colors"
            >
              Add event to date
            </button>
          </div>
          {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 ? (
            <p className="py-8 text-center text-[14px] font-normal text-[#5f6368]">
              Nothing scheduled. Add an event
              {showTasks ? ' or set task due dates.' : ' (turn on “Show tasks” to see dues here).'}
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedItems.events.map(e => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => openEditEvent(e)}
                    className="group relative flex w-full items-center gap-3 rounded-lg border border-transparent hover:border-[#dadce0] p-2 text-left transition-colors hover:bg-[#f8f9fa]"
                    dir="auto"
                  >
                    <div className={`h-3 w-3 rounded-full ${e.event_type === 'provider_meeting' ? 'bg-[#9333ea]' : 'bg-[#1a73e8]'}`} />
                    <div className="flex-1">
                      <CalendarEventTitleAddress
                        title={e.title}
                        address={e.address}
                        titleClassName="text-[14px] font-medium text-[#3c4043] group-hover:text-[#1a73e8] transition-colors"
                        addressClassName="text-[12px] font-normal text-[#5f6368] truncate"
                      />
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-[13px] font-normal text-[#5f6368]">
                        {e.is_all_day
                          ? 'All day'
                          : e.starts_at
                            ? `${format(new Date(e.starts_at), 'HH:mm')}${e.ends_at ? `–${format(new Date(e.ends_at), 'HH:mm')}` : ''}`
                            : ''}
                      </p>
                      {e.event_type === 'provider_meeting' && e.provider && (
                        <p className="text-[11px] text-[#70757a]">{e.provider.name}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
              {selectedItems.tasks.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openEditTask(t)}
                    className="group relative flex w-full items-center gap-3 rounded-lg border border-transparent hover:border-[#ceead6] p-2 text-left transition-colors hover:bg-[#e6f4ea]"
                    dir="auto"
                  >
                    <div className="h-3 w-3 flex-shrink-0 rounded-[4px] bg-[#137333]" />
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-[#3c4043] group-hover:text-[#0d652d] transition-colors">{t.title}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                       <p className="text-[13px] font-normal text-[#137333]">Due</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {quickAnchor && (
        <CalendarQuickCreatePopover
          anchor={quickAnchor}
          projectId={project.id}
          providers={providers}
          onClose={() => setQuickAnchor(null)}
          onCreated={() => load()}
          onMoreOptions={(initialTitle) => {
            const anchor = quickAnchor
            setQuickAnchor(null)
            if (anchor.isAllDay) {
              openNewEvent(anchor.startIso.slice(0, 10), initialTitle)
            } else {
              openNewEventTimed(anchor.startIso, anchor.endIso, initialTitle)
            }
          }}
        />
      )}

      {eventModalOpen && (
        <CalendarEventModal
          open={eventModalOpen}
          projectId={project.id}
          providers={providers}
          editing={null}
          initialDayKey={initialDayKey}
          initialTimedRange={initialTimedRange}
          initialTitle={initialTitle}
          onClose={closeEventModal}
          onSaved={() => load()}
        />
      )}

      {viewingEventLive && (
        <CalendarEventDetailDrawer
          event={viewingEventLive}
          providers={providers}
          onClose={closeEventView}
          onUpdated={() => load()}
        />
      )}

      {viewingTaskLive && (
        <TaskDetailDrawer
          task={viewingTaskLive}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={closeTaskView}
          onEdit={() => openTaskFormModal(viewingTaskLive)}
          onTaskChange={(updatedTask) => {
            setTasks((prev) => prev.map((pt) => (pt.id === updatedTask.id ? updatedTask : pt)))
          }}
          onLabelCreated={(lb) =>
            setLabels((prev) =>
              [...prev, lb].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
            )
          }
        />
      )}

      {taskFormModalOpen && editingTask && (
        <TaskModal
          editing={editingTask}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={closeTaskFormModal}
          onSave={() => {
            closeTaskFormModal()
            load()
          }}
        />
      )}
    </div>
  )
}

