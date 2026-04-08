'use client'

import { addDays, addMonths, addWeeks, format, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
      <h1 className="text-[32px] font-bold tracking-tight text-slate-900 pb-2">Calendar</h1>
      {/* Top Controls Header (Google Style) */}
      <header className="flex flex-col items-start gap-4 border-[#dadce0] pb-4 pt-1 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openNewEvent(null)}
              className="mr-3 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dadce0] bg-white px-4 shadow-sm transition-all hover:bg-[#f8f9fa] hover:shadow-md"
              style={{
                boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)'
              }}
            >
              <svg
                className="h-5 w-5 shrink-0 block"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  fill="#34A853"
                  d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                />
              </svg>
              <span className="text-[14px] font-medium leading-none text-[#3c4043] tracking-wide">
                Create
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="h-10 rounded-md border border-[#dadce0] px-4 text-[14px] font-medium text-[#3c4043] hover:bg-[#f1f3f4] transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1 ml-1 h-10">
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    calendarView === 'month'
                      ? subMonths(cursor, 1)
                      : calendarView === 'week'
                        ? subWeeks(cursor, 1)
                        : subDays(cursor, 1)
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                aria-label={
                  calendarView === 'month'
                    ? 'Previous month'
                    : calendarView === 'week'
                      ? 'Previous week'
                      : 'Previous day'
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursor(
                    calendarView === 'month'
                      ? addMonths(cursor, 1)
                      : calendarView === 'week'
                        ? addWeeks(cursor, 1)
                        : addDays(cursor, 1)
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
                aria-label={
                  calendarView === 'month'
                    ? 'Next month'
                    : calendarView === 'week'
                      ? 'Next week'
                      : 'Next day'
                }
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </button>
            </div>
            <h2 className="ml-2 mt-1 text-[22px] font-normal leading-none text-[#3c4043]">
              {calendarView === 'month'
                ? format(cursor, 'MMMM yyyy')
                : calendarView === 'week'
                  ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
                  : format(cursor, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
        </div>
        
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
          {/* Scroll only the filter pills — the Month/Week menu must stay outside overflow-x-auto or the dropdown is clipped and clicks fail */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 py-1 scrollbar-hide md:min-w-0 md:flex-none md:overflow-visible md:pb-0">
            <button
              type="button"
              onClick={() => setShowTasks(!showTasks)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[14px] font-semibold transition-colors ${
                showTasks
                  ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333]'
                  : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]'
              }`}
            >
              {showTasks && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              Tasks
            </button>

            <button
              type="button"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              disabled={!showTasks}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[14px] font-semibold transition-colors ${
                !showTasks
                  ? 'cursor-not-allowed border-[#dadce0] bg-white text-[#9aa0a6] opacity-50'
                  : showCompletedTasks
                    ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333]'
                    : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]'
              }`}
            >
              {showCompletedTasks && showTasks && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              Completed
            </button>
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setViewMenuOpen((o) => !o)}
              className="flex h-10 items-center gap-2 rounded-md border border-[#dadce0] px-3 text-[14px] font-semibold text-[#3c4043] transition-colors hover:bg-[#f1f3f4] focus:outline-none"
            >
              {calendarView === 'month' ? 'Month' : calendarView === 'week' ? 'Week' : 'Day'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#5f6368]">
                <path d="M7 10l5 5 5-5z" />
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
                <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-[#dadce0] bg-white py-1.5 shadow-lg animate-fade-in">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCalendarView('month')
                      setViewMenuOpen(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-[14px] font-semibold hover:bg-[#f1f3f4] ${calendarView === 'month' ? 'bg-[#f8f9fa] text-[#1a73e8]' : 'text-[#3c4043]'}`}
                  >
                    Month
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCalendarView('week')
                      setViewMenuOpen(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-[14px] font-semibold hover:bg-[#f1f3f4] ${calendarView === 'week' ? 'bg-[#f8f9fa] text-[#1a73e8]' : 'text-[#3c4043]'}`}
                  >
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCalendarView('day')
                      setViewMenuOpen(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-[14px] font-semibold hover:bg-[#f1f3f4] ${calendarView === 'day' ? 'bg-[#f8f9fa] text-[#1a73e8]' : 'text-[#3c4043]'}`}
                  >
                    Day
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mt-2 w-full">
        {loading ? (
          <div className="reno-cal reno-cal-gcal min-h-[600px] animate-pulse rounded-lg border border-[#dadce0] bg-[#f8f9fa]" />
        ) : (
          <RenovationFullCalendar
            view={calendarView}
            cursor={cursor}
            events={events}
            tasks={tasks}
            showTasks={showTasks}
            onDateClick={k => setSelectedKey(k)}
            onEditEvent={openEditEvent}
            onEditTask={openEditTask}
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

