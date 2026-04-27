'use client'

import { addDays, addMonths, addWeeks, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarEventDetailDrawer } from '@/components/renovation/CalendarEventDetailDrawer'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { RenovationFullCalendar } from '@/components/renovation/RenovationFullCalendar'
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
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
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

  return (
    <div className="flex flex-col gap-0 bg-white pb-8 animate-fade-in-up">
      <header className="px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="shrink-0 text-[18px] leading-none tracking-[-0.02em] text-[oklch(0.13_0_0)] font-[family-name:var(--font-varela-round)]">
              Calendar
            </h1>
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
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-black/10 text-[oklch(0.40_0_0)] transition-colors hover:border-black/20 hover:text-[oklch(0.13_0_0)]"
              aria-label={calendarView === 'month' ? 'Previous month' : calendarView === 'week' ? 'Previous week' : 'Previous day'}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="h-8 shrink-0 rounded-[6px] border border-black/10 px-[10px] text-[12px] text-[oklch(0.40_0_0)] transition-colors hover:border-black/20 hover:text-[oklch(0.13_0_0)]"
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
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] border border-black/10 text-[oklch(0.40_0_0)] transition-colors hover:border-black/20 hover:text-[oklch(0.13_0_0)]"
              aria-label={calendarView === 'month' ? 'Next month' : calendarView === 'week' ? 'Next week' : 'Next day'}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <h2 className="truncate pl-1 text-[16px] leading-none tracking-[-0.01em] text-[oklch(0.13_0_0)]">
              {calendarView === 'month'
                ? format(cursor, 'MMMM yyyy')
                : calendarView === 'week'
                  ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                  : format(cursor, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTasks(!showTasks)}
              className={`inline-flex items-center gap-1 rounded-full border px-[11px] py-[5px] text-[12px] transition-colors ${
                showTasks
                  ? 'border-[oklch(0.65_0.18_163)] bg-[oklch(0.95_0.06_163)] text-[oklch(0.45_0.18_163)]'
                  : 'border-black/10 text-[oklch(0.60_0_0)] hover:border-black/20 hover:text-[oklch(0.40_0_0)]'
              }`}
            >
              {showTasks && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                </svg>
              )}
              Tasks
            </button>
            <button
              type="button"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              disabled={!showTasks}
              className={`inline-flex items-center gap-1 rounded-full border px-[11px] py-[5px] text-[12px] transition-colors ${
                !showTasks
                  ? 'cursor-not-allowed border-black/10 text-[oklch(0.75_0_0)] opacity-70'
                  : showCompletedTasks
                    ? 'border-black/15 bg-[oklch(0.94_0_0)] text-[oklch(0.40_0_0)]'
                    : 'border-black/10 text-[oklch(0.60_0_0)] hover:border-black/20 hover:text-[oklch(0.40_0_0)]'
              }`}
            >
              {showCompletedTasks && showTasks && (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                </svg>
              )}
              Completed
            </button>

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setViewMenuOpen((o) => !o)}
                className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-black/10 px-[10px] text-[12px] text-[oklch(0.40_0_0)] transition-colors hover:border-black/20 hover:text-[oklch(0.13_0_0)]"
              >
                {calendarView === 'month' ? 'Month' : calendarView === 'week' ? 'Week' : 'Day'}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {viewMenuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 h-full w-full cursor-default bg-transparent"
                    onClick={() => setViewMenuOpen(false)}
                    aria-label="Close menu"
                    tabIndex={-1}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-[8px] border border-black/[0.09] bg-white py-1 shadow-[0_12px_28px_-18px_rgba(0,0,0,0.5)] animate-fade-in">
                    {(['month', 'week', 'day'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCalendarView(mode)
                          setViewMenuOpen(false)
                        }}
                        className={`block w-full px-3 py-2 text-left text-[13px] transition-colors ${
                          calendarView === mode
                            ? 'bg-[oklch(0.97_0_0)] text-[oklch(0.13_0_0)]'
                            : 'text-[oklch(0.40_0_0)] hover:bg-[oklch(0.98_0_0)]'
                        }`}
                      >
                        {mode === 'month' ? 'Month' : mode === 'week' ? 'Week' : 'Day'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => openNewEvent(null)}
              className="inline-flex items-center gap-[5px] rounded-[8px] bg-[oklch(0.13_0_0)] px-[14px] py-[7px] text-[13px] text-white transition-[filter] hover:brightness-110"
            >
              <svg className="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
          <RenovationFullCalendar
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
            onCreateForDay={dayKey => openNewEvent(dayKey)}
            onEventUpdated={() => load()}
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

      {eventModalOpen && (
        <CalendarEventModal
          open={eventModalOpen}
          projectId={project.id}
          providers={providers}
          editing={null}
          initialDayKey={initialDayKey}
          initialTimedRange={initialTimedRange}
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

