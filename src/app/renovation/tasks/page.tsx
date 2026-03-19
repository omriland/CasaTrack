'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  listLabels,
  listRooms,
  listTasks,
  listTeamMembers,
  updateTask,
} from '@/lib/renovation'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { formatDateDisplay } from '@/lib/renovation-format'
import type { RenovationLabel, RenovationRoom, RenovationTask, RenovationTeamMember, TaskStatus, TaskUrgency } from '@/types/renovation'

const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']
const URGENCY_WEIGHT: Record<TaskUrgency, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function sortTasks(a: RenovationTask, b: RenovationTask) {
  // 1. Done state (done at bottom)
  if (a.status === 'done' && b.status !== 'done') return 1
  if (a.status !== 'done' && b.status === 'done') return -1

  // 2. Urgency/Severity (high weight first)
  const aw = URGENCY_WEIGHT[a.urgency] || 0
  const bw = URGENCY_WEIGHT[b.urgency] || 0
  if (aw !== bw) return bw - aw

  // 3. Due Date (earliest first)
  if (a.due_date && b.due_date) {
    if (a.due_date < b.due_date) return -1
    if (a.due_date > b.due_date) return 1
  }
  if (a.due_date && !b.due_date) return -1
  if (!a.due_date && b.due_date) return 1

  return 0
}

export default function TasksPage() {
  const { project, setTaskModalOpen } = useRenovation()
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'status' | 'assignee' | 'list'>('status')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterLabel, setFilterLabel] = useState<string>('')
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationTask | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [t, m, l, r] = await Promise.all([
        listTasks(project.id),
        listTeamMembers(project.id),
        listLabels(project.id),
        listRooms(project.id),
      ])
      setTasks(t)
      setMembers(m)
      setLabels(l)
      setRooms(r)
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

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverStatus(null)
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    
    try {
      await updateTask(taskId, { status: newStatus })
      // No need to reload, optimistic update is enough unless there's an error
    } catch (err) {
      console.error(err)
      await load() // Rollback on error
    }
  }

  const renderCard = (t: RenovationTask) => {
    const isDone = t.status === 'done'
    const overdue = t.due_date && !isDone && new Date(t.due_date + 'T23:59:59') < new Date()
    return (
      <button
        key={t.id}
        draggable
        onDragStart={(e) => onDragStart(e, t.id)}
        type="button"
        onClick={() => openEdit(t)}
        className={`w-full text-left bg-white rounded-md border border-slate-200/60 p-4 transition-all shadow-sm hover:shadow-md hover:border-indigo-200 active:scale-[0.98] cursor-grab active:cursor-grabbing ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div className="flex gap-3.5 items-start">
          <div className={`shrink-0 mt-0.5 ${isDone ? 'opacity-40 grayscale' : 'opacity-90'}`}>{PRIORITY_ICONS[t.urgency]}</div>
          <div className="flex-1 min-w-0">
            <p className={`text-[15px] font-bold leading-snug text-slate-800 ${isDone ? 'line-through text-slate-500' : ''}`} dir="auto">
              {t.title}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {t.room && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[100px]">{t.room.name}</span>
              )}
              {t.assignee && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{t.assignee.name.split(' ')[0]}</span>
              )}
              {t.due_date && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded tabular-nums ${overdue ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                  {formatDateDisplay(t.due_date)}
                </span>
              )}
              {(t.label_ids || []).map((lid) => {
                const lb = labels.find((l) => l.id === lid)
                return lb ? (
                  <span
                    key={lid}
                    className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                    style={{ backgroundColor: lb.color }}
                  >
                    {lb.name}
                  </span>
                ) : null
              })}
            </div>
            {view !== 'status' && !isDone && (
              <div className="mt-2.5 flex">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t.status.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </button>
    )
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee && t.assignee_id !== filterAssignee) return false
    if (filterLabel && !t.label_ids?.includes(filterLabel)) return false
    return true
  })

  if (!project) {
    return (
      <p className="text-center text-black/45 py-16">
        <a href="/renovation" className="text-[#007AFF]">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Work</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[28px] font-semibold tracking-tight">Tasks</h1>
            {(filterAssignee || filterLabel) && (
              <span className="text-[14px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full animate-fade-in">
                Showing {filteredTasks.length} / {tasks.length}
              </span>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setTaskModalOpen(true)} className="h-10 px-4 rounded bg-[#007AFF] text-white text-[15px] font-semibold">
          Add task
        </button>
      </div>

      <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
        {(['status', 'assignee', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all capitalize shadow-sm border ${
              view === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            By {v}
          </button>
        ))}
        
        <div className="ml-auto flex gap-2">
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="h-8 pl-2 pr-6 rounded border border-slate-200 bg-white text-[12px] font-bold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Assignees</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="h-8 pl-2 pr-6 rounded border border-slate-200 bg-white text-[12px] font-bold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Tags</option>
              {labels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-md border border-slate-200" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-md border border-slate-200 border-dashed p-10 text-center text-[15px] text-slate-500 mt-4 font-medium">
          No tasks yet. Get started by adding one!
        </div>
      ) : (
        <div className="mt-4">
          {view === 'list' && (
            <div className="space-y-2">
              {[...filteredTasks].sort(sortTasks).map(renderCard)}
            </div>
          )}

          {view === 'status' && (
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 items-start snap-x scrollbar-hide">
              {STATUSES.map(s => {
                const paneTasks = filteredTasks.filter(t => t.status === s).sort(sortTasks)
                const isDraggingOver = dragOverStatus === s
                return (
                  <div 
                    key={s} 
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverStatus(s)
                    }}
                    onDragLeave={() => setDragOverStatus(null)}
                    onDrop={(e) => onDrop(e, s)}
                    className={`w-[85vw] md:w-[320px] shrink-0 p-3 rounded-lg flex flex-col gap-3 snap-center border-2 transition-all min-h-[400px] ${
                      isDraggingOver 
                        ? 'bg-indigo-50/80 border-indigo-400 border-dashed scale-[1.02] shadow-lg' 
                        : 'bg-slate-100/60 border-transparent shadow-none'
                    }`}
                  >
                    <h3 className="font-bold text-slate-700 capitalize px-1 flex justify-between items-center text-[14px]">
                      <span>{s.replace('_', ' ')}</span>
                      <span className="text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full text-[12px]">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-2 flex-1">
                      {paneTasks.map(renderCard)}
                      {paneTasks.length === 0 && (
                        <div className="py-4 text-center text-[13px] text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-md">Empty</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'assignee' && (
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 items-start snap-x scrollbar-hide">
              {[{ id: 'unassigned', name: 'Unassigned' }, ...members].map(m => {
                const paneTasks = filteredTasks.filter(t => m.id === 'unassigned' ? !t.assignee_id : t.assignee_id === m.id).sort(sortTasks)
                if (paneTasks.length === 0) return null
                return (
                  <div key={m.id} className="w-[85vw] md:w-[320px] shrink-0 bg-slate-100/60 p-3 rounded-lg flex flex-col gap-3 snap-center border border-slate-200/60">
                    <h3 className="font-bold text-slate-700 px-1 flex justify-between items-center text-[14px]">
                      <span>{m.name}</span>
                      <span className="text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full text-[12px]">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {paneTasks.map(renderCard)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {sheet && (
        <TaskModal
          editing={editing}
          members={members}
          labels={labels}
          rooms={rooms}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
        />
      )}
    </div>
  )
}
