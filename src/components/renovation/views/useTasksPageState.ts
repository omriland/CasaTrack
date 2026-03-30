'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  listLabels,
  listProviders,
  listRooms,
  listTasks,
  listTeamMembers,
  updateTask,
} from '@/lib/renovation'
import type {
  RenovationLabel,
  RenovationProvider,
  RenovationRoom,
  RenovationTask,
  RenovationTeamMember,
  TaskStatus,
} from '@/types/renovation'

export type TasksBoardView = 'status' | 'assignee' | 'list' | 'epic'

export function useTasksPageState(options?: { defaultView?: TasksBoardView }) {
  const { project, setTaskModalOpen } = useRenovation()
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [providers, setProviders] = useState<RenovationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<TasksBoardView>(options?.defaultView ?? 'status')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterLabel, setFilterLabel] = useState<string>('')
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationTask | null>(null)

  const [viewing, setViewing] = useState<RenovationTask | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [t, m, l, r, p] = await Promise.all([
        listTasks(project.id),
        listTeamMembers(project.id),
        listLabels(project.id),
        listRooms(project.id),
        listProviders(project.id),
      ])
      setTasks(t)
      setMembers(m)
      setLabels(l)
      setRooms(r)
      setProviders(p)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const openEdit = (t: RenovationTask) => {
    setEditing(t)
    setSheet(true)
  }

  const openView = (t: RenovationTask) => {
    setViewing(t)
  }

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverStatus(null)
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    try {
      await updateTask(taskId, { status: newStatus })
    } catch (err) {
      console.error(err)
      await load()
    }
  }

  const toggleTaskDone = async (taskId: string, isDone: boolean) => {
    const newStatus = isDone ? 'open' : 'done'
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))
    try {
      await updateTask(taskId, { status: newStatus })
    } catch (err) {
      console.error(err)
      await load()
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee && t.assignee_id !== filterAssignee) return false
    if (filterLabel && !t.label_ids?.includes(filterLabel)) return false
    return true
  })

  return {
    project,
    setTaskModalOpen,
    tasks,
    setTasks,
    members,
    labels,
    setLabels,
    rooms,
    providers,
    loading,
    load,
    view,
    setView,
    filterAssignee,
    setFilterAssignee,
    filterLabel,
    setFilterLabel,
    dragOverStatus,
    setDragOverStatus,
    sheet,
    setSheet,
    editing,
    setEditing,
    viewing,
    setViewing,
    openEdit,
    openView,
    onDragStart,
    onDrop,
    filteredTasks,
    toggleTaskDone,
  }
}
