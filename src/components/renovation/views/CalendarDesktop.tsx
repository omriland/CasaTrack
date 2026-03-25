'use client'

import { addDays, addMonths, addWeeks, format, startOfWeek, subMonths, subWeeks } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { RenovationFullCalendar } from '@/components/renovation/RenovationFullCalendar'
import { calendarEventOnLocalDay, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
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
    editingEvent,
    initialDayKey,
    initialTimedRange,
    openNewEvent,
    openNewEventTimed,
    openEditEvent,
    closeEventModal,
    taskSheetOpen,
    editingTask,
    openEditTask,
    closeTaskSheet,
  } = useCalendarPageState()

  const [selectedKey, setSelectedKey] = useState<string | null>(null)
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
    if (taskSheetOpen) loadMeta()
  }, [taskSheetOpen, loadMeta])

  const itemsForDay = useMemo(() => {
    const fn = (d: Date) => {
      const evs = events.filter(e => calendarEventOnLocalDay(e, d))
      const tks = showTasks ? tasks.filter(t => taskDueOnLocalDay(t, d)) : []
      return { events: evs, tasks: tks }
    }
    return fn
  }, [events, tasks, showTasks])

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  if (!project) {
    return (
      <p className="py-16 text-center text-black/45">
        <a href="/renovation" className="font-medium text-[#1a73e8]">
          Create a project first
        </a>
      </p>
    )
  }

  const selectedDate = selectedKey ? new Date(selectedKey + 'T12:00:00') : null
  const selectedItems = selectedKey
    ? itemsForDay(selectedDate!)
    : { events: [] as RenovationCalendarEvent[], tasks: [] as RenovationTask[] }

  return (
    <div className="space-y-5 pb-8 animate-fade-in-up">
      <header className="flex flex-row flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-normal tracking-tight text-[#3c4043] md:text-[32px]">
            Calendar
          </h1>
          <p className="mt-1 max-w-md text-[14px] font-normal leading-snug text-[#5f6368]">
            Events, provider meetings, and task due dates. Sun–Thu work week; Fri–Sat weekend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#dadce0] bg-[#f1f3f4] p-0.5 text-[13px] font-medium">
            <button
              type="button"
              onClick={() => setCalendarView('month')}
              className={`rounded-md px-3 py-2 transition-all ${
                calendarView === 'month'
                  ? 'bg-white text-[#3c4043] shadow-sm'
                  : 'text-[#5f6368] hover:text-[#3c4043]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`rounded-md px-3 py-2 transition-all ${
                calendarView === 'week'
                  ? 'bg-white text-[#3c4043] shadow-sm'
                  : 'text-[#5f6368] hover:text-[#3c4043]'
              }`}
            >
              Week
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-[13px] font-medium text-[#5f6368] shadow-sm">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={e => setShowTasks(e.target.checked)}
              className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
            />
            Show tasks
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-lg border border-[#dadce0] bg-white px-3 py-2 text-[13px] font-medium shadow-sm ${
              !showTasks ? 'pointer-events-none opacity-40' : 'text-[#5f6368]'
            }`}
          >
            <input
              type="checkbox"
              checked={showCompletedTasks}
              disabled={!showTasks}
              onChange={e => setShowCompletedTasks(e.target.checked)}
              className="rounded border-[#dadce0] text-[#1a73e8] focus:ring-[#1a73e8]"
            />
            Show completed
          </label>
          <button
            type="button"
            onClick={() => openNewEvent(null)}
            className="h-10 rounded-lg bg-[#1a73e8] px-5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#1557b0] active:bg-[#1557b0]"
          >
            + Create
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dadce0] bg-white px-3 py-2.5 shadow-sm md:px-4 md:py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            aria-label={calendarView === 'month' ? 'Previous month' : 'Previous week'}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
            aria-label={calendarView === 'month' ? 'Next month' : 'Next week'}
          >
            →
          </button>
        </div>
        <h2 className="text-center text-[16px] font-normal text-[#3c4043] md:text-[18px]">
          {calendarView === 'month'
            ? format(cursor, 'MMMM yyyy')
            : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
        </h2>
        <button
          type="button"
          onClick={() => setCursor(new Date())}
          className="rounded-md px-3 py-2 text-[13px] font-medium text-[#1a73e8] hover:bg-[#f1f3f4]"
        >
          Today
        </button>
      </div>

      {loading ? (
        <div className="reno-cal reno-cal-gcal min-h-[400px] animate-pulse rounded-xl border border-[#dadce0] bg-[#f8f9fa]" />
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

      {selectedKey && selectedDate && calendarView === 'month' && (
        <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[16px] font-medium text-[#3c4043]">
              {format(selectedDate, 'EEEE, MMM d, yyyy')}
            </h3>
            <button
              type="button"
              onClick={() => openNewEvent(selectedKey)}
              className="rounded-lg bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1557b0]"
            >
              Add event
            </button>
          </div>
          {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 ? (
            <p className="text-[14px] font-normal text-[#5f6368]">
              Nothing scheduled. Add an event
              {showTasks ? ' or set task due dates.' : ' (turn on “Show tasks” to see dues here).'}
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedItems.events.map(e => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => openEditEvent(e)}
                    className="w-full rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-4 py-3 text-right transition-colors hover:border-[#dadce0] hover:bg-white"
                    dir="auto"
                  >
                    <CalendarEventTitleAddress
                      title={e.title}
                      address={e.address}
                      titleClassName="text-[14px] font-medium text-[#3c4043]"
                      addressClassName="text-[12px] font-normal text-[#5f6368] truncate"
                    />
                    <p className="mt-1 text-[12px] font-normal text-[#70757a]">
                      {e.is_all_day
                        ? 'All day'
                        : e.starts_at
                          ? `${format(new Date(e.starts_at), 'HH:mm')}${e.ends_at ? ` – ${format(new Date(e.ends_at), 'HH:mm')}` : ''}`
                          : ''}
                      {e.event_type === 'provider_meeting' && e.provider
                        ? ` · ${e.provider.name}`
                        : ''}
                    </p>
                  </button>
                </li>
              ))}
              {selectedItems.tasks.map(t => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openEditTask(t)}
                    className="w-full rounded-lg border border-[#ceead6] bg-[#e6f4ea] px-4 py-3 text-right transition-colors hover:border-[#137333]/40"
                    dir="auto"
                  >
                    <p className="text-[14px] font-medium text-[#0d652d]">Task · {t.title}</p>
                    <p className="text-[12px] font-normal text-[#137333]">Due {t.due_date}</p>
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
          editing={editingEvent}
          initialDayKey={initialDayKey}
          initialTimedRange={initialTimedRange}
          onClose={closeEventModal}
          onSaved={() => load()}
        />
      )}

      {taskSheetOpen && editingTask && (
        <TaskModal
          editing={editingTask}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={closeTaskSheet}
          onSave={() => {
            closeTaskSheet()
            load()
          }}
        />
      )}
    </div>
  )
}
