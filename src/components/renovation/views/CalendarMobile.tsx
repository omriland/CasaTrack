'use client'

import { addMonths, addWeeks, format, startOfWeek, subMonths, subWeeks } from 'date-fns'
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
    taskSheetOpen,
    editingTask,
    openEditTask,
    closeTaskSheet,
  } = useCalendarPageState()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetKey, setSheetKey] = useState<string | null>(null)
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
    if (taskSheetOpen) loadMeta()
  }, [taskSheetOpen, loadMeta])

  const itemsForDay = (d: Date) => ({
    events: events.filter(e => calendarEventOnLocalDay(e, d)),
    tasks: showTasks ? tasks.filter(t => taskDueOnLocalDay(t, d)) : [],
  })

  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 })

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <h3 className="mb-2 text-xl font-medium text-[#3c4043]">No Project</h3>
        <p className="text-center text-[14px] text-slate-500">
          <a href="/renovation" className="font-medium text-[#1a73e8]">
            Create a project first
          </a>
        </p>
      </div>
    )
  }

  const sheetDate = sheetKey ? new Date(sheetKey + 'T12:00:00') : null
  const sheetItems = sheetKey && sheetDate ? itemsForDay(sheetDate) : { events: [], tasks: [] }

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden pb-16">
      <header className="flex flex-col border-b border-[#dadce0] bg-white pt-2 px-1">
        <div className="flex items-center justify-between px-3 h-12">
          <div className="flex items-center gap-3">
            <button aria-label="Menu" className="p-1 -ml-1 text-[#5f6368] active:bg-[#f1f3f4] rounded-full">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
            </button>
            <h1 className="text-[20px] font-normal leading-none text-[#3c4043]">
              {calendarView === 'month' ? format(cursor, 'MMMM') : format(weekStart, 'MMM')} 
              <span className="text-[20px] ml-1">{format(calendarView === 'month' ? cursor : weekStart, 'yyyy')}</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(calendarView === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))}
              className="p-1 text-[#5f6368] active:bg-[#f1f3f4] rounded-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button
              onClick={() => setCursor(new Date())}
              className="px-2 py-1 text-[13px] font-medium text-[#3c4043] rounded border border-[#dadce0] active:bg-[#f1f3f4]"
            >
              Today
            </button>
            <button
              onClick={() => setCursor(calendarView === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))}
              className="p-1 text-[#5f6368] active:bg-[#f1f3f4] rounded-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
            <div className="relative ml-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMenuOpen((o) => !o)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[14px] font-medium text-[#3c4043] transition-colors focus:outline-none active:bg-[#f1f3f4]"
              >
                {calendarView === 'month' ? 'Month' : 'Week'}
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
                  <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-[#dadce0] bg-white py-1.5 shadow-lg animate-fade-in">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCalendarView('week')
                        setViewMenuOpen(false)
                      }}
                      className={`block w-full px-4 py-2 text-left text-[14px] active:bg-[#f1f3f4] ${calendarView === 'week' ? 'bg-[#f8f9fa] font-medium text-[#1a73e8]' : 'text-[#3c4043]'}`}
                    >
                      Week
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCalendarView('month')
                        setViewMenuOpen(false)
                      }}
                      className={`block w-full px-4 py-2 text-left text-[14px] active:bg-[#f1f3f4] ${calendarView === 'month' ? 'bg-[#f8f9fa] font-medium text-[#1a73e8]' : 'text-[#3c4043]'}`}
                    >
                      Month
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide gap-2 px-3 pb-3 pt-1">
          <button 
            type="button"
            onClick={() => setShowTasks(!showTasks)}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              showTasks 
                ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333]' 
                : 'border-[#dadce0] bg-white text-[#5f6368]'
            }`}
          >
            {showTasks && <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
            Tasks
          </button>
          
          <button 
            type="button"
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            disabled={!showTasks}
            className={`flex whitespace-nowrap items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              !showTasks ? 'opacity-50 border-[#dadce0] bg-white text-[#9aa0a6]' :
              showCompletedTasks 
                ? 'border-[#ceead6] bg-[#e6f4ea] text-[#137333]' 
                : 'border-[#dadce0] bg-white text-[#5f6368]'
            }`}
          >
            {showCompletedTasks && showTasks && <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
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

      {/* Floating Action Button */}
      <button
        onClick={() => openNewEvent(null)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg active:scale-95 transition-transform"
        style={{
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 2px 6px 2px rgba(60,64,67,0.15)'
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path fill="#34A853" d="M16 16v14h4V20h10v-4H20V6h-4v10H6v4h10z" />
          <path fill="#4285F4" d="M30 16H20v-4h10z" />
          <path fill="#FBBC05" d="M6 16v4h10v-4z" />
          <path fill="#EA4335" d="M20 16V6h-4v10z" />
          <path fill="none" d="M0 0h36v36H0z" />
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
          <div className="flex items-center justify-between pb-2 border-b border-[#f1f3f4]">
            <h3 className="text-[18px] font-normal text-[#3c4043] flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a73e8] text-xl text-white">
                {sheetDate ? format(sheetDate, 'd') : ''}
              </span>
              <span className="flex flex-col">
                <span className="text-[12px] text-[#5f6368] font-medium leading-tight">
                  {sheetDate ? format(sheetDate, 'EEEE') : ''}
                </span>
                <span className="text-[15px] leading-tight">
                  {sheetDate ? format(sheetDate, 'MMMM yyyy') : ''}
                </span>
              </span>
            </h3>
          </div>

          {sheetItems.events.length === 0 && (!showTasks || sheetItems.tasks.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="mb-3 text-[#dadce0]" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z"/>
              </svg>
              <p className="text-[14px] font-normal text-[#5f6368]">
                No events
              </p>
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
                    className="flex w-full items-start gap-4 py-3 active:bg-[#f1f3f4] text-left"
                    dir="auto"
                  >
                    <div className="mt-1 flex-shrink-0">
                      <div className={`h-3.5 w-3.5 rounded-full ${e.event_type === 'provider_meeting' ? 'bg-[#9333ea]' : 'bg-[#1a73e8]'}`} />
                    </div>
                    <div className="flex-1 border-b border-[#f1f3f4] pb-3">
                      <CalendarEventTitleAddress
                        title={e.title}
                        address={e.address}
                        titleClassName="text-[15px] font-medium text-[#3c4043]"
                        addressClassName="text-[13px] font-normal text-[#5f6368] truncate max-w-[90%]"
                      />
                      <p className="mt-0.5 text-[13px] font-normal text-[#70757a]">
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
                      className="flex w-full items-start gap-4 py-3 active:bg-[#f1f3f4] text-left"
                      dir="auto"
                    >
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-4 w-4 rounded-[4px] border-2 border-[#137333] flex items-center justify-center" >
                           {t.status === 'done' && <div className="h-2 w-2 bg-[#137333]" />}
                        </div>
                      </div>
                      <div className="flex-1 border-b border-[#f1f3f4] pb-3">
                        <p className="text-[15px] font-medium text-[#3c4043]">{t.title}</p>
                        <p className="mt-0.5 text-[13px] font-normal text-[#137333]">
                           Task
                        </p>
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
