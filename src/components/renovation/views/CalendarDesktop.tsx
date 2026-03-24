'use client'

import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { CalendarWeekGrid } from '@/components/renovation/CalendarWeekGrid'
import { TaskModal } from '@/components/renovation/TaskModal'
import { calendarEventOnLocalDay, dayKey, isWeekendFriSat, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
import { formatTaskDue } from '@/lib/renovation-format'
import { listLabels, listRooms, listTeamMembers } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationLabel, RenovationRoom, RenovationTask, RenovationTeamMember } from '@/types/renovation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCalendarPageState } from './useCalendarPageState'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

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

  const monthStart = startOfMonth(cursor)
  const monthEnd = endOfMonth(cursor)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const itemsForDay = useMemo(() => {
    const fn = (d: Date) => {
      const evs = events.filter((e) => calendarEventOnLocalDay(e, d))
      const tks = showTasks ? tasks.filter((t) => taskDueOnLocalDay(t, d)) : []
      return { events: evs, tasks: tks }
    }
    return fn
  }, [events, tasks, showTasks])

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  if (!project) {
    return (
      <p className="py-16 text-center text-black/45">
        <a href="/renovation" className="text-[#007AFF]">
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
    <div className="space-y-6 pb-8 animate-fade-in-up">
      <header className="flex flex-row flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-[32px] font-bold tracking-tight text-slate-900">Calendar</h1>
          <p className="mt-1 max-w-md text-[15px] font-medium text-slate-400">
            Events, provider meetings, and task due dates. Work week Sun–Thu; Fri–Sat are weekend.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-[13px] font-bold shadow-sm">
            <button
              type="button"
              onClick={() => setCalendarView('month')}
              className={`rounded-full px-3 py-2 transition-colors ${
                calendarView === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarView('week')}
              className={`rounded-full px-3 py-2 transition-colors ${
                calendarView === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Week
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold text-slate-600 shadow-sm">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(e) => setShowTasks(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show tasks
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[13px] font-bold shadow-sm ${
              !showTasks ? 'pointer-events-none opacity-40' : 'text-slate-600'
            }`}
          >
            <input
              type="checkbox"
              checked={showCompletedTasks}
              disabled={!showTasks}
              onChange={(e) => setShowCompletedTasks(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show completed tasks
          </label>
          <button
            type="button"
            onClick={() => openNewEvent(null)}
            className="h-11 rounded-full bg-indigo-600 px-6 text-[15px] font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95"
          >
            + Add event
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50"
            aria-label={calendarView === 'month' ? 'Previous month' : 'Previous week'}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50"
            aria-label={calendarView === 'month' ? 'Next month' : 'Next week'}
          >
            →
          </button>
        </div>
        <h2 className="text-center text-[18px] font-bold text-slate-900">
          {calendarView === 'month'
            ? format(cursor, 'MMMM yyyy')
            : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`}
        </h2>
        <button
          type="button"
          onClick={() => setCursor(new Date())}
          className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[13px] font-bold text-indigo-700 hover:bg-indigo-100"
        >
          Today
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
          {Array.from({ length: calendarView === 'week' ? 7 : 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] animate-pulse bg-white" />
          ))}
        </div>
      ) : calendarView === 'week' ? (
        <CalendarWeekGrid
          weekStart={weekStart}
          events={events}
          tasks={tasks}
          showTasks={showTasks}
          onEditEvent={openEditEvent}
          onEditTask={openEditTask}
          onCreateTimedRange={(start, end) => openNewEventTimed(start, end)}
          onEventUpdated={() => load()}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm">
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {WEEKDAYS.map((wd, i) => (
                <div
                  key={wd}
                  className={`bg-slate-50 py-2 text-center text-[11px] font-bold uppercase tracking-wider ${
                    i >= 5 ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {wd}
                </div>
              ))}
              {days.map((d) => {
                const key = dayKey(d)
                const inMonth = isSameMonth(d, cursor)
                const wknd = isWeekendFriSat(d)
                const { events: evs, tasks: tks } = itemsForDay(d)
                const isSel = selectedKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    className={`min-h-[112px] w-full p-1.5 text-left align-top transition-colors ${
                      wknd ? 'bg-violet-50/90' : 'bg-white'
                    } ${!inMonth ? 'opacity-40' : ''} ${isSel ? 'ring-2 ring-inset ring-indigo-400' : ''} hover:bg-indigo-50/50`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${
                          isToday(d) ? 'bg-indigo-600 text-white' : 'text-slate-800'
                        }`}
                      >
                        {format(d, 'd')}
                      </span>
                    </div>
                    <ul className="mt-1 space-y-0.5 overflow-hidden">
                      {evs.slice(0, 3).map((e) => (
                        <li
                          key={e.id}
                          className="rounded px-1 py-0.5 text-[10px] leading-tight text-indigo-900 bg-indigo-100/90 text-right"
                          title={[e.title, e.address?.trim()].filter(Boolean).join(' — ')}
                          dir="auto"
                        >
                          <p className="truncate font-bold">
                            {!e.is_all_day && e.starts_at ? `${format(new Date(e.starts_at), 'HH:mm')} ` : ''}
                            {e.event_type === 'provider_meeting' ? '· ' : ''}
                            {e.title}
                          </p>
                          {e.address?.trim() ? (
                            <p className="truncate text-[9px] font-normal text-indigo-800/90">{e.address.trim()}</p>
                          ) : null}
                        </li>
                      ))}
                      {tks.slice(0, Math.max(0, 3 - evs.length)).map((t) => {
                        const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone: t.status === 'done' }) : null
                        return (
                          <li
                            key={t.id}
                            className="truncate rounded px-1 py-0.5 text-right text-[10px] font-bold leading-tight bg-emerald-100/90 text-emerald-900"
                            title={t.title}
                            dir="auto"
                          >
                            Task · {t.title}
                            {dueMeta ? ` (${dueMeta.label})` : ''}
                          </li>
                        )
                      })}
                      {evs.length + tks.length > 3 && (
                        <li className="text-[10px] font-bold text-slate-500">+{evs.length + tks.length - 3} more</li>
                      )}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedKey && selectedDate && calendarView === 'month' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[17px] font-bold text-slate-900">{format(selectedDate, 'EEEE, MMM d, yyyy')}</h3>
                <button
                  type="button"
                  onClick={() => openNewEvent(selectedKey)}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-indigo-700"
                >
                  Add event this day
                </button>
              </div>
              {selectedItems.events.length === 0 && selectedItems.tasks.length === 0 ? (
                <p className="text-[14px] font-medium text-slate-400">
                  Nothing scheduled. Add an event
                  {showTasks ? ' or set task due dates.' : ' (turn on “Show tasks” to see dues here).'}
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedItems.events.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => openEditEvent(e)}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-right transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
                        dir="auto"
                      >
                        <CalendarEventTitleAddress
                          title={e.title}
                          address={e.address}
                          titleClassName="text-[14px] font-bold text-slate-900"
                          addressClassName="text-[12px] font-medium text-slate-600 truncate"
                        />
                        <p className="mt-1 text-[12px] font-semibold text-slate-500">
                          {e.is_all_day
                            ? 'All day'
                            : e.starts_at
                              ? `${format(new Date(e.starts_at), 'p')}${e.ends_at ? ` – ${format(new Date(e.ends_at), 'p')}` : ''}`
                              : ''}
                          {e.event_type === 'provider_meeting' && e.provider ? ` · ${e.provider.name}` : ''}
                        </p>
                      </button>
                    </li>
                  ))}
                  {selectedItems.tasks.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => openEditTask(t)}
                        className="w-full rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-right transition-colors hover:border-emerald-200"
                        dir="auto"
                      >
                        <p className="text-[14px] font-bold text-emerald-900">Task · {t.title}</p>
                        <p className="text-[12px] font-semibold text-emerald-700">Due {t.due_date}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
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
