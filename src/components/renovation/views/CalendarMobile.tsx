'use client'

import { addDays, addMonths, format, subDays, subMonths } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { CalendarEventModal } from '@/components/renovation/CalendarEventModal'
import { CalendarEventTitleAddress } from '@/components/renovation/CalendarEventText'
import { RenovationFullCalendar } from '@/components/renovation/RenovationFullCalendar'
import { calendarEventOnLocalDay, taskDueOnLocalDay } from '@/components/renovation/calendar-shared'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { TaskModalMobile } from '@/components/renovation/TaskModalMobile'
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
  } = useCalendarPageState()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetKey, setSheetKey] = useState<string | null>(null)
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])

  /** Week view is desktop-only; fall back to month on mobile. */
  useEffect(() => {
    if (calendarView === 'week') setCalendarView('month')
  }, [calendarView, setCalendarView])

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
    if (viewingTask) loadMeta()
  }, [viewingTask, loadMeta])

  const itemsForDay = (d: Date) => ({
    events: events.filter(e => calendarEventOnLocalDay(e, d)),
    tasks: showTasks ? tasks.filter(t => taskDueOnLocalDay(t, d)) : [],
  })

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <h3 className="mb-2 text-xl font-medium text-slate-700">No Project</h3>
        <p className="text-center text-[14px] text-slate-500">
          <a href="/renovation" className="font-medium text-indigo-600">
            Create a project first
          </a>
        </p>
      </div>
    )
  }

  const sheetDate = sheetKey ? new Date(sheetKey + 'T12:00:00') : null
  const sheetItems = sheetKey && sheetDate ? itemsForDay(sheetDate) : { events: [], tasks: [] }

  return (
    <div className="flex h-full flex-col overflow-hidden pb-16">
      <header className="sticky top-0 z-10 flex flex-col border-b border-slate-200/60 bg-white pt-2 px-3 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between gap-2 min-h-[48px]">
          <h1 className="min-w-0 text-[24px] font-bold tracking-tight leading-tight text-slate-900">
            {calendarView === 'month' ? format(cursor, 'MMMM yyyy') : format(cursor, 'EEE, MMM d')}
          </h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subDays(cursor, 1))
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
              aria-label={calendarView === 'month' ? 'Previous month' : 'Previous day'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              type="button"
              onClick={() => setCursor(new Date())}
              className="min-h-[44px] px-4 text-[14px] font-semibold text-indigo-600 rounded-xl border border-slate-200 active:bg-slate-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() =>
                setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addDays(cursor, 1))
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
              aria-label={calendarView === 'month' ? 'Next month' : 'Next day'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <div className="mt-1 flex w-full rounded-xl bg-slate-100/90 p-1">
          <button
            type="button"
            onClick={() => setCalendarView('month')}
            className={`min-h-[40px] flex-1 rounded-lg text-[14px] font-semibold transition-all ${
              calendarView === 'month'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setCalendarView('day')}
            className={`min-h-[40px] flex-1 rounded-lg text-[14px] font-semibold transition-all ${
              calendarView === 'day'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Day
          </button>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setShowTasks(!showTasks)}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full border min-h-[44px] px-4 text-[14px] font-semibold transition-colors ${
              showTasks
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {showTasks && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            Tasks
          </button>

          <button
            type="button"
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            disabled={!showTasks}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full border min-h-[44px] px-4 text-[14px] font-semibold transition-colors ${
              !showTasks ? 'opacity-50 border-slate-200 bg-white text-slate-400' :
              showCompletedTasks
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {showCompletedTasks && showTasks && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            Completed
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-hidden p-1 pb-24">
        {loading ? (
          <div className="reno-cal reno-cal-gcal min-h-[400px] animate-pulse rounded-lg border-0 bg-[#f8f9fa]" />
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
      </div>

      <button
        onClick={() => openNewEvent(null)}
        className="fixed right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.45)] active:scale-95 transition-transform"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Add event"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false)
          setSheetKey(null)
        }}
        title=""
      >
        <div className="max-h-[min(70vh,500px)] space-y-4 overflow-y-auto px-4 pb-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-[18px] font-semibold text-slate-900 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-xl text-white font-bold">
                {sheetDate ? format(sheetDate, 'd') : ''}
              </span>
              <span className="flex flex-col">
                <span className="text-[13px] text-slate-500 font-medium leading-tight">
                  {sheetDate ? format(sheetDate, 'EEEE') : ''}
                </span>
                <span className="text-[16px] leading-tight text-slate-800">
                  {sheetDate ? format(sheetDate, 'MMMM yyyy') : ''}
                </span>
              </span>
            </h3>
          </div>

          {sheetItems.events.length === 0 && (!showTasks || sheetItems.tasks.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="mb-3 w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[14px] font-medium text-slate-500">No events this day</p>
            </div>
          ) : (
            <ul className="space-y-0">
              {sheetItems.events.map(e => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false)
                      openEditEvent(e)
                    }}
                    className="flex w-full items-start gap-4 min-h-[48px] py-3 active:bg-slate-50 rounded-lg text-left"
                    dir="auto"
                  >
                    <div className="mt-1.5 flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full ${e.event_type === 'provider_meeting' ? 'bg-purple-500' : 'bg-indigo-500'}`} />
                    </div>
                    <div className="flex-1 border-b border-slate-100 pb-3">
                      <CalendarEventTitleAddress
                        title={e.title}
                        address={e.address}
                        titleClassName="text-[16px] font-medium text-slate-900"
                        addressClassName="text-[14px] font-normal text-slate-500 truncate max-w-[90%]"
                      />
                      <p className="mt-0.5 text-[14px] font-normal text-slate-500">
                        {e.is_all_day
                          ? 'All day'
                          : e.starts_at
                            ? `${format(new Date(e.starts_at), 'HH:mm')}${e.ends_at ? ` – ${format(new Date(e.ends_at), 'HH:mm')}` : ''}`
                            : ''}
                        {e.provider ? ` · ${e.provider.name}` : ''}
                      </p>
                    </div>
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
                      className="flex w-full items-start gap-4 min-h-[48px] py-3 active:bg-slate-50 rounded-lg text-left"
                      dir="auto"
                    >
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-4 w-4 rounded-[4px] border-2 border-emerald-600 flex items-center justify-center">
                           {t.status === 'done' && <div className="h-2 w-2 bg-emerald-600 rounded-sm" />}
                        </div>
                      </div>
                      <div className="flex-1 border-b border-slate-100 pb-3">
                        <p className="text-[16px] font-medium text-slate-900">{t.title}</p>
                        <p className="mt-0.5 text-[14px] font-normal text-emerald-600">Task</p>
                      </div>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </MobileBottomSheet>

      {(eventModalOpen || viewingEvent) && (
        <CalendarEventModal
          open={!!(eventModalOpen || viewingEvent)}
          projectId={project.id}
          providers={providers}
          editing={viewingEvent}
          initialDayKey={viewingEvent ? null : initialDayKey}
          initialTimedRange={viewingEvent ? null : initialTimedRange}
          onClose={() => {
            closeEventModal()
            closeEventView()
          }}
          onSaved={() => load()}
        />
      )}

      {viewingTask && (
        <TaskModalMobile
          editing={viewingTask}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={closeTaskView}
          onSave={() => {
            closeTaskView()
            load()
          }}
        />
      )}
    </div>
  )
}
