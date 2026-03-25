'use client'

import { addDays, addMonths, addWeeks, format, startOfWeek, subMonths, subWeeks } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { RenovationFullCalendar } from '@/components/renovation/RenovationFullCalendar'
import { calendarEventOnLocalDay, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { TaskModalMobile } from '@/components/renovation/TaskModalMobile'
import { formatTaskDue } from '@/lib/renovation-format'
import { listLabels, listRooms, listTeamMembers } from '@/lib/renovation'
import type { RenovationLabel, RenovationRoom, RenovationTeamMember } from '@/types/renovation'
import { useCalendarPageState } from './useCalendarPageState'

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

  const itemsForDay = (d: Date) => ({
    events: events.filter(e => calendarEventOnLocalDay(e, d)),
    tasks: showTasks ? tasks.filter(t => taskDueOnLocalDay(t, d)) : [],
  })

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  if (!project) {
    return (
      <p className="py-12 text-center text-[14px] text-slate-500">
        <a href="/renovation" className="font-medium text-[#1a73e8]">
          Create a project first
        </a>
      </p>
    )
  }

  const sheetDate = sheetKey ? new Date(sheetKey + 'T12:00:00') : null
  const sheetItems = sheetKey && sheetDate ? itemsForDay(sheetDate) : { events: [], tasks: [] }

  return (
    <div className="space-y-3 pb-4">
      <div>
        <h1 className="text-[22px] font-normal text-[#3c4043]">Calendar</h1>
        <p className="mt-0.5 text-[13px] font-normal text-[#5f6368]">
          Sun–Thu work week · Fri–Sat weekend
        </p>
      </div>

      <div className="flex gap-0.5 rounded-lg border border-[#dadce0] bg-[#f1f3f4] p-0.5 text-[12px] font-medium">
        <button
          type="button"
          onClick={() => setCalendarView('month')}
          className={`flex-1 rounded-md py-2 transition-all ${
            calendarView === 'month' ? 'bg-white text-[#3c4043] shadow-sm' : 'text-[#5f6368]'
          }`}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setCalendarView('week')}
          className={`flex-1 rounded-md py-2 transition-all ${
            calendarView === 'week' ? 'bg-white text-[#3c4043] shadow-sm' : 'text-[#5f6368]'
          }`}
        >
          Week
        </button>
      </div>

      <label className="flex items-center gap-2 text-[13px] font-medium text-[#5f6368]">
        <input
          type="checkbox"
          checked={showTasks}
          onChange={e => setShowTasks(e.target.checked)}
          className="rounded border-[#dadce0] text-[#1a73e8]"
        />
        Show tasks
      </label>

      <label
        className={`flex items-center gap-2 text-[13px] font-medium ${!showTasks ? 'pointer-events-none opacity-40' : 'text-[#5f6368]'}`}
      >
        <input
          type="checkbox"
          checked={showCompletedTasks}
          disabled={!showTasks}
          onChange={e => setShowCompletedTasks(e.target.checked)}
          className="rounded border-[#dadce0] text-[#1a73e8]"
        />
        Show completed
      </label>

      <div className="flex items-center justify-between rounded-xl border border-[#dadce0] bg-white px-1 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() =>
            setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))
          }
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] active:bg-[#f1f3f4]"
          aria-label={calendarView === 'month' ? 'Previous month' : 'Previous week'}
        >
          ←
        </button>
        <span className="max-w-[55%] text-center text-[14px] font-normal text-[#3c4043]">
          {calendarView === 'month'
            ? format(cursor, 'MMMM yyyy')
            : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d')}`}
        </span>
        <button
          type="button"
          onClick={() =>
            setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))
          }
          className="flex h-10 w-10 items-center justify-center rounded-full text-[#5f6368] active:bg-[#f1f3f4]"
          aria-label={calendarView === 'month' ? 'Next month' : 'Next week'}
        >
          →
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCursor(new Date())}
        className="w-full rounded-lg py-2.5 text-[14px] font-medium text-[#1a73e8] active:bg-[#f1f3f4]"
      >
        Today
      </button>

      {loading ? (
        <div className="reno-cal reno-cal-gcal min-h-[280px] animate-pulse rounded-xl border border-[#dadce0] bg-[#f8f9fa]" />
      ) : (
        <RenovationFullCalendar
          view={calendarView}
          cursor={cursor}
          events={events}
          tasks={tasks}
          showTasks={showTasks}
          compact
          onDateClick={k => {
            setSheetKey(k)
            setSheetOpen(true)
          }}
          onEditEvent={openEditEvent}
          onEditTask={openEditTask}
          onCreateTimedRange={openNewEventTimed}
          onCreateForDay={dayKey => openNewEvent(dayKey)}
          onEventUpdated={() => load()}
        />
      )}

      <button
        type="button"
        onClick={() => openNewEvent(null)}
        className="w-full rounded-lg bg-[#1a73e8] py-3.5 text-[15px] font-medium text-white shadow-sm hover:bg-[#1557b0] active:bg-[#1557b0]"
      >
        + Create
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
            className="w-full rounded-lg bg-[#1a73e8] py-3 text-[14px] font-medium text-white hover:bg-[#1557b0]"
          >
            Add event
          </button>
          {sheetItems.events.length === 0 && (!showTasks || sheetItems.tasks.length === 0) ? (
            <p className="text-center text-[13px] font-normal text-[#5f6368]">
              Nothing on this day.
            </p>
          ) : (
            <ul className="space-y-2">
              {sheetItems.events.map(e => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false)
                      openEditEvent(e)
                    }}
                    className="w-full rounded-lg border border-[#e8eaed] bg-[#f8f9fa] px-3 py-3 text-right active:bg-white"
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
                          ? format(new Date(e.starts_at), 'HH:mm')
                          : ''}
                      {e.provider ? ` · ${e.provider.name}` : ''}
                    </p>
                  </button>
                </li>
              ))}
              {showTasks &&
                sheetItems.tasks.map(t => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSheetOpen(false)
                        openEditTask(t)
                      }}
                      className="w-full rounded-lg border border-[#ceead6] bg-[#e6f4ea] px-3 py-3 text-right active:bg-[#ceead6]/60"
                      dir="auto"
                    >
                      <p className="text-[14px] font-medium text-[#0d652d]">Task · {t.title}</p>
                      <p className="text-[12px] font-normal text-[#137333]">
                        {t.due_date &&
                          formatTaskDue(t.due_date, { isDone: t.status === 'done' }).label}
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
