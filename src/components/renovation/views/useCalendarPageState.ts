'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listCalendarEvents, listProviders, listTasks } from '@/lib/renovation'
import type { RenovationCalendarEvent, RenovationProvider, RenovationTask } from '@/types/renovation'

export type CalendarViewMode = 'month' | 'week' | 'day'

export function useCalendarPageState() {
  const { project } = useRenovation()
  const [cursor, setCursor] = useState(() => new Date())
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('week')
  const [events, setEvents] = useState<RenovationCalendarEvent[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [providers, setProviders] = useState<RenovationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [showTasks, setShowTasks] = useState(true)
  const [showCompletedTasks, setShowCompletedTasks] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  /** Desktop: right drawer when viewing/editing an existing event. Mobile: passed as `editing` into modal. */
  const [viewingEvent, setViewingEvent] = useState<RenovationCalendarEvent | null>(null)
  const [initialDayKey, setInitialDayKey] = useState<string | null>(null)
  const [initialTimedRange, setInitialTimedRange] = useState<{ start: string; end: string } | null>(null)
  /** Desktop: TaskDetailDrawer. Mobile: TaskModalMobile. */
  const [viewingTask, setViewingTask] = useState<RenovationTask | null>(null)
  /** Desktop only: centered TaskModal opened from drawer "Edit". */
  const [taskFormModalOpen, setTaskFormModalOpen] = useState(false)
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
    setViewingEvent(null)
    setInitialTimedRange(null)
    setInitialDayKey(dayKey ?? null)
    setEventModalOpen(true)
  }

  const openNewEventTimed = (startIso: string, endIso: string) => {
    setViewingEvent(null)
    setInitialDayKey(null)
    setInitialTimedRange({ start: startIso, end: endIso })
    setEventModalOpen(true)
  }

  const openEditEvent = (ev: RenovationCalendarEvent) => {
    setEventModalOpen(false)
    setInitialDayKey(null)
    setInitialTimedRange(null)
    setViewingEvent(ev)
  }

  const closeEventModal = () => {
    setEventModalOpen(false)
    setInitialDayKey(null)
    setInitialTimedRange(null)
  }

  const closeEventView = () => setViewingEvent(null)

  const openEditTask = (task: RenovationTask) => {
    setViewingTask(task)
  }

  const closeTaskView = () => setViewingTask(null)

  /** Open legacy full-screen modal (desktop: from task drawer Edit). */
  const openTaskFormModal = (task: RenovationTask) => {
    setViewingTask(null)
    setEditingTask(task)
    setTaskFormModalOpen(true)
  }

  const closeTaskFormModal = () => {
    setTaskFormModalOpen(false)
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
  }
}
