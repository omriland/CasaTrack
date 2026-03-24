'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listCalendarEvents, listProviders, listTasks } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationProvider, RenovationTask } from '@/types/renovation'

export type CalendarViewMode = 'month' | 'week'

export function useCalendarPageState() {
  const { project } = useRenovation()
  const [cursor, setCursor] = useState(() => new Date())
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('month')
  const [events, setEvents] = useState<RenovationCalendarEvent[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [providers, setProviders] = useState<RenovationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<RenovationCalendarEvent | null>(null)
  const [initialDayKey, setInitialDayKey] = useState<string | null>(null)
  const [initialTimedRange, setInitialTimedRange] = useState<{ start: string; end: string } | null>(null)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<RenovationTask | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const evP = listCalendarEvents(project.id)
      const provP = listProviders(project.id)
      const taskP = showTasks ? listTasks(project.id) : Promise.resolve([] as RenovationTask[])
      const [ev, p, t] = await Promise.all([evP, provP, taskP])
      setEvents(ev)
      setProviders(p)
      setTasks(t)
    } catch (e) {
      console.error(e)
      setEvents([])
      setTasks([])
      setProviders([])
    } finally {
      setLoading(false)
    }
  }, [project, showTasks])

  useEffect(() => {
    load()
  }, [load])

  const visibleTasks = useMemo(
    () => (showCompletedTasks ? tasks : tasks.filter((x) => x.status !== 'done')),
    [tasks, showCompletedTasks]
  )

  const openNewEvent = (dayKey?: string | null) => {
    setEditingEvent(null)
    setInitialTimedRange(null)
    setInitialDayKey(dayKey ?? null)
    setEventModalOpen(true)
  }

  const openNewEventTimed = (startIso: string, endIso: string) => {
    setEditingEvent(null)
    setInitialDayKey(null)
    setInitialTimedRange({ start: startIso, end: endIso })
    setEventModalOpen(true)
  }

  const openEditEvent = (ev: RenovationCalendarEvent) => {
    setEditingEvent(ev)
    setInitialDayKey(null)
    setInitialTimedRange(null)
    setEventModalOpen(true)
  }

  const closeEventModal = () => {
    setEventModalOpen(false)
    setEditingEvent(null)
    setInitialDayKey(null)
    setInitialTimedRange(null)
  }

  const openEditTask = (task: RenovationTask) => {
    setEditingTask(task)
    setTaskSheetOpen(true)
  }

  const closeTaskSheet = () => {
    setTaskSheetOpen(false)
    setEditingTask(null)
  }

  return {
    project,
    cursor,
    setCursor,
    calendarView,
    setCalendarView,
    events,
    tasks: visibleTasks,
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
  }
}
