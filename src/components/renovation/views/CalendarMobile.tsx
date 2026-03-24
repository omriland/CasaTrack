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
import { useCallback, useEffect, useState } from 'react'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { CalendarWeekGrid } from '@/components/renovation/CalendarWeekGrid'
import { calendarEventOnLocalDay, dayKey, isWeekendFriSat, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { TaskModalMobile } from '@/components/renovation/TaskModalMobile'
import { formatTaskDue } from '@/lib/renovation-format'
import { listLabels, listRooms, listTeamMembers } from '@/lib/renovation'
import type { RenovationLabel, RenovationRoom, RenovationTeamMember } from '@/types/renovation'
import { useCalendarPageState } from './useCalendarPageState'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export function CalendarMobile() {
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

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetKey, setSheetKey] = useState<string | null>(null)
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

  const itemsForDay = (d: Date) => ({
    events: events.filter((e) => calendarEventOnLocalDay(e, d)),
    tasks: showTasks ? tasks.filter((t) => taskDueOnLocalDay(t, d)) : [],
  })

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  if (!project) {
    return (
      <p className="py-12 text-center text-[14px] text-slate-500">
        <a href="/renovation" className="font-bold text-indigo-600">
          Create a project first
        </a>
      </p>
    )
  }

  const sheetDate = sheetKey ? new Date(sheetKey + 'T12:00:00') : null
  const sheetItems = sheetKey && sheetDate ? itemsForDay(sheetDate) : { events: [], tasks: [] }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="text-[22px] font-bold text-slate-900">Calendar</h1>
        <p className="mt-0.5 text-[13px] font-medium text-slate-500">Sun–Thu work week · Fri–Sat weekend</p>
      </div>

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 text-[12px] font-bold">
        <button
          type="button"
          onClick={() => setCalendarView('month')}
          className={`flex-1 rounded-lg py-2 ${calendarView === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setCalendarView('week')}
          className={`flex-1 rounded-lg py-2 ${calendarView === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
        >
          Week
        </button>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
        <input
          type="checkbox"
          checked={showTasks}
          onChange={(e) => setShowTasks(e.target.checked)}
          className="rounded border-slate-300"
        />
        Show tasks
      </label>

      <label
        className={`flex items-center gap-2 text-[13px] font-bold ${!showTasks ? 'pointer-events-none opacity-40' : 'text-slate-600'}`}
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

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
        <button
          type="button"
          onClick={() => setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100"
          aria-label={calendarView === 'month' ? 'Previous month' : 'Previous week'}
        >
          ←
        </button>
        <span className="max-w-[55%] text-center text-[14px] font-bold text-slate-900">
          {calendarView === 'month'
            ? format(cursor, 'MMMM yyyy')
            : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d')}`}
        </span>
        <button
          type="button"
          onClick={() => setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 active:bg-slate-100"
          aria-label={calendarView === 'month' ? 'Next month' : 'Next week'}
        >
          →
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCursor(new Date())}
        className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[14px] font-bold text-indigo-700 active:bg-indigo-100"
      >
        Jump to today
      </button>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: calendarView === 'week' ? 7 : 35 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-slate-200" />
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
          compact
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-100 p-1">
          <div className="grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={`${wd}-${i}`}
                className={`py-1 text-center text-[10px] font-extrabold ${i >= 5 ? 'text-slate-400' : 'text-slate-500'}`}
              >
                {wd}
              </div>
            ))}
            {days.map((d) => {
              const key = dayKey(d)
              const inMonth = isSameMonth(d, cursor)
              const wknd = isWeekendFriSat(d)
              const { events: evs, tasks: tks } = itemsForDay(d)
              const n = evs.length + tks.length
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSheetKey(key)
                    setSheetOpen(true)
                  }}
                  className={`flex aspect-square flex-col items-center rounded-lg p-0.5 text-center transition-colors ${
                    wknd ? 'bg-violet-100/80' : 'bg-white'
                  } ${!inMonth ? 'opacity-35' : ''} active:ring-2 active:ring-indigo-300`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                      isToday(d) ? 'bg-indigo-600 text-white' : 'text-slate-800'
                    }`}
                  >
                    {format(d, 'd')}
                  </span>
                  {n > 0 && (
                    <span className="mt-auto mb-0.5 text-[9px] font-extrabold text-indigo-600">{n > 9 ? '9+' : n}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => openNewEvent(null)}
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-[15px] font-bold text-white shadow-sm active:scale-[0.99]"
      >
        + Add event
      </button>

      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setSheetKey(null)
        }}
        title={sheetDate ? format(sheetDate, 'EEE, MMM d') : ''}
      >
        <div className="max-h-[min(60vh,480px)] space-y-3 overflow-y-auto px-4 pb-4">
          <button
            type="button"
            onClick={() => {
              const k = sheetKey
              setSheetOpen(false)
              setSheetKey(null)
              openNewEvent(k)
            }}
            className="w-full rounded-xl bg-indigo-600 py-3 text-[14px] font-bold text-white"
          >
            Add event this day
          </button>
          {sheetItems.events.length === 0 && (!showTasks || sheetItems.tasks.length === 0) ? (
            <p className="text-center text-[13px] font-medium text-slate-400">Nothing on this day.</p>
          ) : (
            <ul className="space-y-2">
              {sheetItems.events.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false)
                      openEditEvent(e)
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-right active:bg-slate-100"
                    dir="auto"
                  >
                    <CalendarEventTitleAddress
                      title={e.title}
                      address={e.address}
                      titleClassName="text-[14px] font-bold text-slate-900"
                      addressClassName="text-[12px] font-medium text-slate-600 truncate"
                    />
                    <p className="mt-1 text-[12px] text-slate-500">
                      {e.is_all_day
                        ? 'All day'
                        : e.starts_at
                          ? format(new Date(e.starts_at), 'p')
                          : ''}
                      {e.provider ? ` · ${e.provider.name}` : ''}
                    </p>
                  </button>
                </li>
              ))}
              {showTasks &&
                sheetItems.tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSheetOpen(false)
                        openEditTask(t)
                      }}
                      className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-right active:bg-emerald-100"
                      dir="auto"
                    >
                      <p className="text-[14px] font-bold text-emerald-900">Task · {t.title}</p>
                      <p className="text-[12px] text-emerald-700">
                        {t.due_date && formatTaskDue(t.due_date, { isDone: t.status === 'done' }).label}
                      </p>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </MobileBottomSheet>

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
        <TaskModalMobile
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
