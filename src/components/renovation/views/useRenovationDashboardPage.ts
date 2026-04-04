'use client'

import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createProject,
  effectiveBudget,
  listCalendarEvents,
  listExpenses,
  listGalleryItems,
  listTasks,
  expensesThisMonth,
  sumPlannedExpenses,
  sumSpentExpenses,
} from '@/lib/renovation'
import { taskDueCalendarDiffDays } from '@/lib/renovation-format'
import type {
  RenovationCalendarEvent,
  RenovationExpense,
  RenovationGalleryItem,
  RenovationTask,
} from '@/types/renovation'

function eventStartMs(ev: RenovationCalendarEvent): number | null {
  if (!ev.is_all_day && ev.starts_at) {
    const t = new Date(ev.starts_at).getTime()
    return Number.isNaN(t) ? null : t
  }
  if (ev.is_all_day && ev.start_date) {
    const t = parseISO(`${ev.start_date}T12:00:00`).getTime()
    return Number.isNaN(t) ? null : t
  }
  return null
}

function isEventUpcoming(ev: RenovationCalendarEvent, now: Date): boolean {
  const todayStr = format(now, 'yyyy-MM-dd')
  if (!ev.is_all_day && ev.starts_at) {
    return new Date(ev.starts_at).getTime() >= now.getTime()
  }
  if (ev.is_all_day && ev.start_date) {
    return ev.start_date >= todayStr
  }
  return false
}

/** Label for dashboard list (24h time). */
export function formatUpcomingEventWhen(ev: RenovationCalendarEvent): string {
  if (ev.is_all_day && ev.start_date) {
    const d = parseISO(`${ev.start_date}T12:00:00`)
    if (isToday(d)) return 'Today · All day'
    if (isTomorrow(d)) return 'Tomorrow · All day'
    return `${format(d, 'EEE, MMM d')} · All day`
  }
  if (ev.starts_at) {
    const d = new Date(ev.starts_at)
    if (Number.isNaN(d.getTime())) return ''
    if (isToday(d)) return `Today · ${format(d, 'HH:mm')}`
    if (isTomorrow(d)) return `Tomorrow · ${format(d, 'HH:mm')}`
    return format(d, 'EEE, MMM d · HH:mm')
  }
  return ''
}

export function useRenovationDashboardPage() {
  const { project, loading, refresh, activeProfile } = useRenovation()
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [contingency, setContingency] = useState('')
  const [creating, setCreating] = useState(false)
  const [spent, setSpent] = useState(0)
  const [plannedTotal, setPlannedTotal] = useState(0)
  const [monthSpend, setMonthSpend] = useState(0)
  const [recentExpenses, setRecentExpenses] = useState<RenovationExpense[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [calendarEvents, setCalendarEvents] = useState<RenovationCalendarEvent[]>([])
  const [gallery, setGallery] = useState<RenovationGalleryItem[]>([])
  const [dashLoading, setDashLoading] = useState(false)

  const loadDash = useCallback(async () => {
    if (!project) return
    setDashLoading(true)
    try {
      const [ex, t, cal, g] = await Promise.all([
        listExpenses(project.id),
        listTasks(project.id),
        listCalendarEvents(project.id).catch(() => [] as RenovationCalendarEvent[]),
        listGalleryItems(project.id),
      ])
      setSpent(sumSpentExpenses(ex))
      setPlannedTotal(sumPlannedExpenses(ex))
      setMonthSpend(expensesThisMonth(ex))
      setRecentExpenses(ex.slice(0, 5))
      setTasks(t)
      setCalendarEvents(cal)
      setGallery(g.slice(0, 6))
    } catch (e) {
      console.error(e)
    } finally {
      setDashLoading(false)
    }
  }, [project])

  useEffect(() => {
    loadDash()
  }, [loadDash])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      await createProject({
        name: name.trim(),
        total_budget: Number(budget) || 0,
        contingency_amount: Number(contingency) || 0,
      })
      await refresh()
      setName('')
      setBudget('')
      setContingency('')
    } catch (err) {
      console.error(err)
      alert('Could not create project. Did you run the SQL migration in Supabase?')
    } finally {
      setCreating(false)
    }
  }

  const {
    cap,
    committedTotal,
    over,
    remainingBalance,
    remainingExcludingPlanned,
    budgetOverAmount,
    spentBarPct,
    plannedBarPct,
  } = useMemo(() => {
    const capVal = project ? effectiveBudget(project) : 0
    const committed = spent + plannedTotal
    const overVal = project ? committed > capVal && capVal > 0 : false

    let spentBarPct = capVal > 0 ? (spent / capVal) * 100 : 0
    let plannedBarPct = capVal > 0 ? (plannedTotal / capVal) * 100 : 0
    if (spentBarPct + plannedBarPct > 100) {
      const t = spentBarPct + plannedBarPct
      spentBarPct = (spentBarPct / t) * 100
      plannedBarPct = (plannedBarPct / t) * 100
    }

    return {
      cap: capVal,
      committedTotal: committed,
      over: overVal,
      remainingBalance: capVal - committed,
      remainingExcludingPlanned: capVal - spent,
      budgetOverAmount: Math.max(0, committed - capVal),
      spentBarPct,
      plannedBarPct,
    }
  }, [project, spent, plannedTotal])

  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return taskDueCalendarDiffDays(t.due_date) < 0
  }).length
  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 4)

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return calendarEvents
      .filter((e) => isEventUpcoming(e, now))
      .sort((a, b) => (eventStartMs(a) ?? 0) - (eventStartMs(b) ?? 0))
      .slice(0, 5)
  }, [calendarEvents])

  return {
    project,
    loading,
    refresh,
    activeProfile,
    name,
    setName,
    budget,
    setBudget,
    contingency,
    setContingency,
    creating,
    handleCreate,
    spent,
    plannedTotal,
    monthSpend,
    recentExpenses,
    tasks,
    gallery,
    dashLoading,
    loadDash,
    cap,
    committedTotal,
    over,
    remainingBalance,
    remainingExcludingPlanned,
    budgetOverAmount,
    spentBarPct,
    plannedBarPct,
    openTasks,
    overdue,
    upcoming,
    upcomingEvents,
  }
}
