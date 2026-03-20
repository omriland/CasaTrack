'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createProject,
  effectiveBudget,
  listExpenses,
  listGalleryItems,
  listTasks,
  expensesThisMonth,
} from '@/lib/renovation'
import { taskDueCalendarDiffDays } from '@/lib/renovation-format'
import type { RenovationExpense, RenovationGalleryItem, RenovationTask } from '@/types/renovation'

export function useRenovationDashboardPage() {
  const { project, loading, refresh, activeProfile } = useRenovation()
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [contingency, setContingency] = useState('')
  const [creating, setCreating] = useState(false)
  const [spent, setSpent] = useState(0)
  const [monthSpend, setMonthSpend] = useState(0)
  const [recentExpenses, setRecentExpenses] = useState<RenovationExpense[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [gallery, setGallery] = useState<RenovationGalleryItem[]>([])
  const [dashLoading, setDashLoading] = useState(false)

  const loadDash = useCallback(async () => {
    if (!project) return
    setDashLoading(true)
    try {
      const [ex, t, g] = await Promise.all([
        listExpenses(project.id),
        listTasks(project.id),
        listGalleryItems(project.id),
      ])
      setSpent(ex.reduce((s, e) => s + Number(e.amount), 0))
      setMonthSpend(expensesThisMonth(ex))
      setRecentExpenses(ex.slice(0, 5))
      setTasks(t)
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

  const cap = project ? effectiveBudget(project) : 0
  const pct = cap > 0 ? Math.min(100, (spent / cap) * 100) : 0
  const over = project ? spent > cap && cap > 0 : false
  const openTasks = tasks.filter((t) => t.status !== 'done').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return taskDueCalendarDiffDays(t.due_date) < 0
  }).length
  const upcoming = tasks
    .filter((t) => t.due_date && t.status !== 'done')
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 4)

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
    monthSpend,
    recentExpenses,
    tasks,
    gallery,
    dashLoading,
    loadDash,
    cap,
    pct,
    over,
    openTasks,
    overdue,
    upcoming,
  }
}
