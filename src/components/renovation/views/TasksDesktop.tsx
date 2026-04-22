'use client'

import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createTask, deleteTask, updateTask } from '@/lib/renovation'
import { sortTeamMembersForAssigneePicker } from '@/lib/renovation-team-sort'
import { formatTaskDue } from '@/lib/renovation-format'
import { MemberAvatarChip } from '@/components/renovation/MemberAvatar'
import type { RenovationLabel, RenovationTask, TaskStatus } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, buildEpicSwimlanes, sortTasks } from './tasks-page-shared'

/** Desktop board columns (status / assignee / epic swimlanes). */
const TASK_BOARD_COL_CLASS = 'w-[380px]'
const TASK_BOARD_COL_COMPACT_CLASS = 'w-[340px]'

const PRIORITY_BORDER: Record<RenovationTask['urgency'], string> = {
  critical: 'oklch(0.55 0.22 15)',
  high: 'oklch(0.55 0.22 15)',
  medium: 'oklch(0.72 0.16 73)',
  low: 'oklch(0.65 0.18 163)',
}

const VIEW_TABS: Array<{ id: 'status' | 'assignee' | 'list' | 'epic'; label: string }> = [
  { id: 'status', label: 'By status' },
  { id: 'assignee', label: 'By assignee' },
  { id: 'list', label: 'By list' },
  { id: 'epic', label: 'Epic view' },
]

const toDayKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function TasksDesktop() {
  const { activeProfile } = useRenovation()

  const {
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
    dragOverStatus,
    setDragOverStatus,
    sheet,
    setSheet,
    editing,
    openEdit,
    viewing,
    setViewing,
    openView,
    onDragStart,
    onDrop,
    toggleTaskDone,
  } = useTasksPageState({ defaultView: 'epic' })

  const membersForAssigneePickers = useMemo(
    () => sortTeamMembersForAssigneePicker(members, activeProfile),
    [members, activeProfile],
  )

  const [assigneePicker, setAssigneePicker] = useState<{ taskId: string; rect: DOMRect } | null>(null)

  useEffect(() => {
    if (!assigneePicker) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAssigneePicker(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [assigneePicker])

  useEffect(() => {
    if (!assigneePicker) return
    if (!tasks.some((t) => t.id === assigneePicker.taskId)) setAssigneePicker(null)
  }, [assigneePicker, tasks])

  const commitAssigneeFromBoard = async (taskId: string, assigneeId: string | null) => {
    const task = tasks.find((x) => x.id === taskId)
    if (!task) {
      setAssigneePicker(null)
      return
    }
    if (task.assignee_id === assigneeId) {
      setAssigneePicker(null)
      return
    }
    const member = assigneeId ? members.find((m) => m.id === assigneeId) ?? null : null
    setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, assignee_id: assigneeId, assignee: member } : x)))
    setViewing((v) => (v?.id === taskId ? { ...v, assignee_id: assigneeId, assignee: member } : v))
    setAssigneePicker(null)
    try {
      await updateTask(taskId, { assignee_id: assigneeId })
    } catch {
      await load()
    }
  }

  const [doneLaneCollapsed, setDoneLaneCollapsed] = useState(true)
  const [collapsedEpicIds, setCollapsedEpicIds] = useState<Record<string, boolean>>({})
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [ctxMenu, setCtxMenu] = useState<{ taskId: string; x: number; y: number } | null>(null)
  const [ctxConfirmDelete, setCtxConfirmDelete] = useState(false)
  const [ctxSubmenu, setCtxSubmenu] = useState<'due' | null>(null)
  const [ctxDeleting, setCtxDeleting] = useState(false)

  const handleCardContext = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setAssigneePicker(null)
    setCtxConfirmDelete(false)
    setCtxSubmenu(null)
    setCtxMenu({ taskId, x: e.clientX, y: e.clientY })
  }

  const closeCtxMenu = () => {
    setCtxMenu(null)
    setCtxConfirmDelete(false)
    setCtxSubmenu(null)
  }
  const ctxTask = ctxMenu ? tasks.find((t) => t.id === ctxMenu.taskId) : null

  const handleCtxEdit = () => { if (ctxTask) { closeCtxMenu(); openEdit(ctxTask) } }

  const handleCtxDelete = async () => {
    if (!ctxTask || ctxDeleting) return
    setCtxDeleting(true)
    try {
      await deleteTask(ctxTask.id)
      setTasks((prev) => prev.filter((t) => t.id !== ctxTask.id))
    } catch { /* ignore */ }
    setCtxDeleting(false)
    closeCtxMenu()
  }

  const handleCtxToggleDone = () => {
    if (!ctxTask) return
    closeCtxMenu()
    toggleTaskDone(ctxTask.id, ctxTask.status === 'done')
  }

  const handleCtxSetDueDate = async (dueDate: string) => {
    if (!ctxTask) return
    const normalized = dueDate.trim() || null
    if (ctxTask.due_date === normalized) {
      closeCtxMenu()
      return
    }
    const taskId = ctxTask.id
    closeCtxMenu()
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, due_date: normalized } : t)))
    setViewing((v) => (v?.id === taskId ? { ...v, due_date: normalized } : v))
    try {
      await updateTask(taskId, { due_date: normalized })
    } catch {
      await load()
    }
  }

  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null)
  const [quickAddValue, setQuickAddValue] = useState('')
  const [quickAddSaving, setQuickAddSaving] = useState(false)
  const quickAddInputRef = useRef<HTMLInputElement>(null)
  const toggleEpicCollapsed = (epicId: string) => {
    setCollapsedEpicIds((prev) => ({ ...prev, [epicId]: !prev[epicId] }))
  }

  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (selectedAssignees.length > 0 && (!t.assignee_id || !selectedAssignees.includes(t.assignee_id))) {
          return false
        }
        if (selectedLabelIds.length > 0) {
          const labelsForTask = t.label_ids ?? []
          if (!labelsForTask.some((id) => selectedLabelIds.includes(id))) return false
        }
        return true
      }),
    [selectedAssignees, selectedLabelIds, tasks],
  )

  const handleQuickAdd = async (status: TaskStatus, _columnKey: string, extra?: { assigneeId?: string | null; labelIds?: string[] }) => {
    const title = quickAddValue.trim()
    if (!title || !project || quickAddSaving) return
    setQuickAddSaving(true)
    try {
      const created = await createTask(project.id, {
        title,
        status,
        assignee_id: extra?.assigneeId ?? null,
        label_ids: extra?.labelIds,
      })
      const newTask: RenovationTask = {
        ...created,
        label_ids: extra?.labelIds ?? [],
        assignee: extra?.assigneeId ? members.find((m) => m.id === extra.assigneeId) ?? null : null,
        subtask_total: 0,
        subtask_done: 0,
      }
      setTasks((prev) => [newTask, ...prev])
      setQuickAddValue('')
      setQuickAddColumn(null)
    } catch { /* ignore */ }
    setQuickAddSaving(false)
  }

  const renderQuickAdd = (status: TaskStatus, columnKey: string, extra?: { assigneeId?: string | null; labelIds?: string[] }) => {
    const isOpen = quickAddColumn === columnKey
    if (!isOpen) {
      return (
        <button
          type="button"
          onClick={() => { setQuickAddColumn(columnKey); setQuickAddValue(''); setTimeout(() => quickAddInputRef.current?.focus(), 0) }}
          className="flex w-full items-center gap-1.5 rounded-[6px] px-3 py-2 text-[13px] font-semibold text-[oklch(0.60_0_0)] opacity-0 group-hover/col:opacity-100 hover:!opacity-100 hover:bg-[oklch(0.94_0_0)] hover:text-[oklch(0.40_0_0)] transition-all focus:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      )
    }
    return (
      <div className="rounded-[6px] border border-black/20 bg-white p-1.5 shadow-sm animate-fade-in">
        <input
          ref={quickAddInputRef}
          autoFocus
          dir="auto"
          type="text"
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(status, columnKey, extra) }
            if (e.key === 'Escape') { setQuickAddColumn(null); setQuickAddValue('') }
          }}
          onBlur={() => { if (!quickAddValue.trim()) { setQuickAddColumn(null) } }}
          placeholder="Task title…"
          disabled={quickAddSaving}
          className="w-full rounded px-2 py-1.5 text-[14px] font-medium text-[oklch(0.13_0_0)] outline-none placeholder:text-[oklch(0.60_0_0)]"
        />
      </div>
    )
  }

  const renderCard = (t: RenovationTask, opts?: { draggable?: boolean }) => {
    const draggable = opts?.draggable !== false
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    const createdByTitle = t.created_by ? `Created by ${t.created_by.name}` : undefined
    const urgencyBorder = PRIORITY_BORDER[t.urgency] || PRIORITY_BORDER.medium

    const labelChipEls = (t.label_ids || []).map((lid) => {
      const lb = labels.find((l: RenovationLabel) => l.id === lid)
      return lb ? (
        <span
          key={lid}
          className="text-[10px] px-1.5 py-[2px] rounded-[4px] bg-[oklch(0.94_0_0)] text-[oklch(0.40_0_0)] whitespace-nowrap font-[family-name:var(--font-assistant)]"
          style={{ border: `1px solid ${lb.color}22` }}
        >
          {lb.name}
        </span>
      ) : null
    })

    return (
      <div
        key={t.id}
        draggable={draggable}
        onDragStart={draggable ? (e) => onDragStart(e, t.id) : undefined}
        onContextMenu={(e) => handleCardContext(e, t.id)}
        className={`group relative w-full rounded-[8px] border bg-white px-[10px] py-[10px] text-left transition-[filter,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-[0.975] hover:translate-x-[1px] hover:-translate-y-[1px] ${
          isDone ? 'opacity-60 bg-[oklch(0.97_0_0)]' : ''
        } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          borderColor: 'rgba(0,0,0,0.06)',
          borderRightWidth: '3px',
          borderRightColor: urgencyBorder,
        }}
      >
        <div
          onClick={() => openView(t)}
          role="button"
          tabIndex={0}
          title={createdByTitle}
          className="flex cursor-pointer flex-col gap-2 focus:outline-none"
        >
          <div className="flex items-start gap-2" dir="rtl">
            <p className={`flex-1 min-w-0 text-right text-[13.5px] leading-[1.55] text-[oklch(0.13_0_0)] font-[family-name:var(--font-assistant)] ${isDone ? 'line-through text-slate-500' : ''}`}>
              {t.title}
            </p>
            {t.room && (
              <span className="max-w-[120px] shrink-0 truncate rounded-[4px] bg-[oklch(0.97_0_0)] px-1.5 py-[2px] text-[10px] font-semibold text-[oklch(0.40_0_0)]">
                {t.room.name}
              </span>
            )}
          </div>

          {labelChipEls.length > 0 && (
            <div className="mt-[1px] flex flex-wrap justify-end gap-1" dir="rtl">
              {labelChipEls}
            </div>
          )}

          <div className="mt-0.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-[7px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTaskDone(t.id, isDone)
                }}
                className={`grid h-[18px] w-[18px] place-items-center rounded-[4px] border transition-all ${
                  isDone
                    ? 'border-[oklch(0.65_0.18_163)] bg-[oklch(0.65_0.18_163)] text-white'
                    : 'border-black/15 bg-white text-transparent hover:border-black/30 hover:text-[oklch(0.40_0_0)]'
                }`}
                aria-label={isDone ? 'Mark as open' : 'Mark as done'}
              >
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>

              {t.assignee ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setAssigneePicker((prev) => (prev?.taskId === t.id ? null : { taskId: t.id, rect }))
                  }}
                  className="shrink-0 rounded-[5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                  title={t.assignee ? t.assignee.name : 'Assign'}
                  aria-label={t.assignee ? `Assignee: ${t.assignee.name}. Change assignee` : 'Assign someone'}
                >
                  <MemberAvatarChip
                    name={t.assignee.name}
                    className="grid h-5 w-5 place-items-center rounded-[5px] text-[9px] font-bold"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setAssigneePicker((prev) => (prev?.taskId === t.id ? null : { taskId: t.id, rect }))
                  }}
                  className="grid h-5 w-5 place-items-center rounded-[5px] border border-dashed border-black/15 text-[oklch(0.60_0_0)]"
                  aria-label="Assign someone"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}

              {(t.subtask_total ?? 0) > 0 && (
                <div
                  title={`${t.subtask_done ?? 0} of ${t.subtask_total} subtasks done`}
                  className={`flex items-center gap-1 text-[11px] font-[family-name:var(--font-jetbrains-mono)] ${
                    t.subtask_done === t.subtask_total ? 'text-[oklch(0.65_0.18_163)]' : 'text-[oklch(0.60_0_0)]'
                  }`}
                >
                  <svg className="h-[11px] w-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12h6M9 16h4" />
                  </svg>
                  {t.subtask_done ?? 0}/{t.subtask_total}
                </div>
              )}

              {!!t.body?.trim() && (
                <div title="Has description" className="text-[oklch(0.60_0_0)]">
                  <svg className="h-[12px] w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
                  </svg>
                </div>
              )}

              <div className="scale-75 opacity-85">{PRIORITY_ICONS[t.urgency]}</div>
            </div>

            <div className="flex items-center gap-2">
              {t.provider && (
                <span className="max-w-[90px] truncate text-[11px] font-medium text-[oklch(0.60_0_0)]">
                  {t.provider.name}
                </span>
              )}
              {dueMeta && (
                <div
                  title={dueMeta.title}
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    dueMeta.tone === 'overdue'
                      ? 'text-[oklch(0.55_0.22_15)]'
                      : dueMeta.tone === 'soon'
                        ? 'text-[oklch(0.72_0.16_73)]'
                        : 'text-[oklch(0.60_0_0)]'
                  }`}
                >
                  <svg className="h-[11px] w-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                  {dueMeta.label}
                </div>
              )}
              </div>
          </div>
        </div>
      </div>
    )
  }

  /** Status columns (open → done); `keyPrefix` keeps React keys unique per epic swimlane row. */
  const renderStatusBoardColumns = (
    taskPool: RenovationTask[],
    keyPrefix: string,
    colMinHeight: string,
    laneLabel?: { id: string },
    compact = false,
  ) =>
    STATUSES.map((s) => {
      const paneTasks = taskPool.filter((t) => t.status === s).sort(sortTasks)
      const isDraggingOver = dragOverStatus === s
      const isDoneLane = s === 'done'
      const collapsed = isDoneLane && doneLaneCollapsed

      if (collapsed) {
        return (
          <div
            key={`${keyPrefix}-${s}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOverStatus(s)
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => onDrop(e, s)}
            className={`flex w-[36px] shrink-0 flex-col border-r border-black/[0.07] p-1 transition-colors ${colMinHeight} ${
              isDraggingOver ? 'bg-[oklch(0.94_0_0)]' : 'bg-transparent'
            }`}
          >
            <button
              type="button"
              onClick={() => setDoneLaneCollapsed(false)}
              className="flex min-h-0 flex-1 flex-col items-center gap-2 rounded-md py-3 text-[oklch(0.60_0_0)] transition-colors hover:text-[oklch(0.13_0_0)] focus:outline-none"
              title="Expand Done column"
              aria-expanded="false"
              aria-label="Expand Done column"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.60_0_0)] [writing-mode:vertical-rl] rotate-180">
                Done
              </span>
              <span className="text-[12px] tabular-nums text-[oklch(0.65_0.18_163)] font-[family-name:var(--font-jetbrains-mono)]">
                {paneTasks.length}
              </span>
            </button>
          </div>
        )
      }

      return (
        <div
          key={`${keyPrefix}-${s}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOverStatus(s)
          }}
          onDragLeave={() => setDragOverStatus(null)}
          onDrop={(e) => onDrop(e, s)}
          className={`group/col ${compact ? TASK_BOARD_COL_COMPACT_CLASS : TASK_BOARD_COL_CLASS} shrink-0 p-2 flex flex-col gap-2 transition-colors ${colMinHeight} ${
            isDraggingOver ? 'bg-[oklch(0.94_0_0)]' : 'bg-transparent'
          }`}
        >
          <h3 className="flex items-center justify-between gap-2 px-1 pb-1 pt-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.60_0_0)]">
            <span className="flex items-center gap-2 min-w-0">
              {s === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.22_250)]" />}
              {s === 'blocked' && <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.22_15)]" />}
              {s === 'done' && <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.65_0.18_163)]" />}
              <span>{s.replace('_', ' ')}</span>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[oklch(0.60_0_0)]">{paneTasks.length}</span>
            </span>
            {isDoneLane && (
              <button
                type="button"
                onClick={() => setDoneLaneCollapsed(true)}
                className="shrink-0 rounded p-1 text-[oklch(0.60_0_0)] hover:bg-[oklch(0.94_0_0)] hover:text-[oklch(0.13_0_0)] focus:outline-none"
                title="Collapse Done column"
                aria-expanded="true"
                aria-label="Collapse Done column"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </h3>
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {paneTasks.map((t) => renderCard(t))}
            {paneTasks.length === 0 && (
              <div className="rounded-[8px] border border-dashed border-black/10 py-6 text-center text-[12px] text-[oklch(0.60_0_0)]">
                Drop tasks here
              </div>
            )}
          </div>
          {renderQuickAdd(s, `${keyPrefix}-${s}`, laneLabel ? { labelIds: [laneLabel.id] } : undefined)}
        </div>
      )
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
    <div className="pb-8 animate-fade-in-up">
      <header className="border-b border-black/[0.07] pb-0">
        <div className="mb-4 flex items-start justify-between gap-4 pt-1">
          <h1 className="text-[22px] tracking-[-0.02em] text-[oklch(0.13_0_0)] font-[family-name:var(--font-varela-round)]">
            Tasks
          </h1>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-[8px] bg-[oklch(0.13_0_0)] px-[14px] py-[7px] text-[13px] tracking-[-0.01em] text-white transition-[filter] duration-150 hover:brightness-110"
          >
            <svg className="h-[13px] w-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add task
          </button>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
                className={`mb-[-1px] border-b-2 px-[14px] py-[8px] text-[13px] tracking-[-0.01em] whitespace-nowrap transition-colors ${
                  view === tab.id
                    ? 'border-[oklch(0.13_0_0)] text-[oklch(0.13_0_0)]'
                    : 'border-transparent text-[oklch(0.60_0_0)] hover:text-[oklch(0.40_0_0)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mb-1 flex items-center gap-1.5">
            <TaskMultiFilterDropdown
              label={
                selectedAssignees.length === 0
                  ? 'All assignees'
                  : selectedAssignees.length === 1
                    ? membersForAssigneePickers.find((m) => m.id === selectedAssignees[0])?.name || '1 assignee'
                    : `${selectedAssignees.length} assignees`
              }
              active={selectedAssignees.length > 0}
              triggerIcon={
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              }
            >
              {membersForAssigneePickers.map((m) => {
                const selected = selectedAssignees.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSelectedAssignees((prev) =>
                        selected ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                      )
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                      selected ? 'bg-[oklch(0.97_0_0)] text-[oklch(0.13_0_0)]' : 'hover:bg-[oklch(0.98_0_0)] text-[oklch(0.40_0_0)]'
                    }`}
                  >
                    <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[oklch(0.13_0_0)] bg-[oklch(0.13_0_0)] text-white' : 'border-black/20'}`}>
                      {selected && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <MemberAvatarChip name={m.name} className="grid h-5 w-5 place-items-center rounded-[5px] text-[9px] font-bold" />
                    <span>{m.name}</span>
                  </button>
                )
              })}
            </TaskMultiFilterDropdown>

            <TaskMultiFilterDropdown
              label={
                selectedLabelIds.length === 0
                  ? 'All tags'
                  : selectedLabelIds.length === 1
                    ? labels.find((l) => l.id === selectedLabelIds[0])?.name || '1 tag'
                    : `${selectedLabelIds.length} tags`
              }
              active={selectedLabelIds.length > 0}
              triggerIcon={
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />
                </svg>
              }
            >
              {labels.map((lb) => {
                const selected = selectedLabelIds.includes(lb.id)
                return (
                  <button
                    key={lb.id}
                    type="button"
                    onClick={() =>
                      setSelectedLabelIds((prev) =>
                        selected ? prev.filter((id) => id !== lb.id) : [...prev, lb.id],
                      )
                    }
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                      selected ? 'bg-[oklch(0.97_0_0)] text-[oklch(0.13_0_0)]' : 'hover:bg-[oklch(0.98_0_0)] text-[oklch(0.40_0_0)]'
                    }`}
                  >
                    <span className={`grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? 'border-[oklch(0.13_0_0)] bg-[oklch(0.13_0_0)] text-white' : 'border-black/20'}`}>
                      {selected && (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lb.color }} />
                    <span>{lb.name}</span>
                  </button>
                )
              })}
            </TaskMultiFilterDropdown>
          </div>
        </div>
      </header>

      <div className="pt-4">

      {loading ? (
        <div className="space-y-3 animate-pulse mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 p-16 text-center mt-6">
          <div className="inline-flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-[16px] font-bold text-slate-600 uppercase tracking-tight">No tasks yet</p>
            <p className="text-[14px] text-slate-400 mt-1 max-w-xs mx-auto">Get started by creating your first task.</p>
            <button
              type="button"
              onClick={() => setTaskModalOpen(true)}
              className="mt-6 text-indigo-600 font-bold text-[14px] bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors"
            >
              + Add Task
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {view === 'list' && (
            <div className="group/col space-y-2">
              {[...visibleTasks].sort(sortTasks).map((t) => renderCard(t))}
              {renderQuickAdd('open', 'list-bottom')}
            </div>
          )}

          {view === 'status' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-stretch scrollbar-hide">
              {renderStatusBoardColumns(visibleTasks, 'board', 'min-h-[50vh]')}
            </div>
          )}

          {view === 'assignee' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-stretch scrollbar-hide">
              {[{ id: 'unassigned', name: 'Unassigned' }, ...members].map((m) => {
                const paneTasks = visibleTasks
                  .filter((t) => (m.id === 'unassigned' ? !t.assignee_id : t.assignee_id === m.id))
                  .sort(sortTasks)
                if (paneTasks.length === 0) return null
                return (
                  <div key={m.id} className={`group/col flex ${TASK_BOARD_COL_CLASS} shrink-0 flex-col gap-2 p-2 min-h-[50vh]`}>
                    <h3 className="flex items-center gap-2 px-1 pb-1 pt-0 text-[11px] font-semibold uppercase tracking-[0.06em] text-[oklch(0.60_0_0)]">
                      <span>{m.name}</span>
                      <span className="font-[family-name:var(--font-jetbrains-mono)]">{paneTasks.length}</span>
                    </h3>
                    <div className="flex min-h-0 flex-1 flex-col gap-2">{paneTasks.map((t) => renderCard(t))}</div>
                    {renderQuickAdd('open', `assignee-${m.id}`, { assigneeId: m.id === 'unassigned' ? null : m.id })}
                  </div>
                )
              })}
            </div>
          )}

          {view === 'epic' && (
            <div className="flex flex-col gap-6 pb-6">
              {buildEpicSwimlanes(visibleTasks, labels).map((lane) => (
                <div key={lane.id} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleEpicCollapsed(lane.id)}
                    className="inline-flex w-fit items-center gap-2 px-0.5 py-0.5 text-left"
                  >
                    <svg
                      className={`h-3.5 w-3.5 text-[oklch(0.60_0_0)] transition-transform duration-200 ${collapsedEpicIds[lane.id] ? '-rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                    {lane.color ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: lane.color }} />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-black/20 bg-white" />
                    )}
                    <span className="truncate text-[12px] uppercase tracking-[0.05em] text-[oklch(0.40_0_0)]">{lane.title}</span>
                    <span className="text-[11px] font-[family-name:var(--font-jetbrains-mono)] text-[oklch(0.60_0_0)]">{lane.tasks.length}</span>
                  </button>
                  {!collapsedEpicIds[lane.id] && (
                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide items-stretch">
                      {renderStatusBoardColumns(
                        lane.tasks,
                        lane.id,
                        'min-h-[300px]',
                        lane.id !== 'none' ? { id: lane.id } : undefined,
                        true,
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {sheet && (
        <TaskModal
          editing={editing}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={() => setSheet(false)}
          onSave={() => {
            setSheet(false)
            load()
          }}
        />
      )}

      {viewing && (
        <TaskDetailDrawer
          task={viewing}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setViewing(null)
            openEdit(viewing)
          }}
          onTaskChange={(updatedTask) => {
            setViewing(updatedTask)
            setTasks((prev) => prev.map((pt) => pt.id === updatedTask.id ? updatedTask : pt))
          }}
          onLabelCreated={(lb) =>
            setLabels((prev) =>
              [...prev, lb].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
            )
          }
        />
      )}

      {assigneePicker &&
        tasks.some((t) => t.id === assigneePicker.taskId) &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[285]" aria-hidden onClick={() => setAssigneePicker(null)} />
            <div
              role="listbox"
              aria-label="Assign task"
              className="fixed z-[290] w-[min(260px,calc(100vw-16px))] max-h-56 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.2)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
              style={{
                left: (() => {
                  const menuW = 260
                  const vw = window.innerWidth
                  return Math.max(8, Math.min(assigneePicker.rect.right - menuW, vw - menuW - 8))
                })(),
                top: assigneePicker.rect.bottom + 6,
              }}
            >
              {(() => {
                const taskForPicker = tasks.find((x) => x.id === assigneePicker.taskId)
                if (!taskForPicker) return null
                return (
                  <>
                    <button
                      type="button"
                      role="option"
                      aria-selected={!taskForPicker.assignee_id}
                      onClick={() => commitAssigneeFromBoard(assigneePicker.taskId, null)}
                      className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] font-medium transition-colors last:mb-0 ${
                        !taskForPicker.assignee_id
                          ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[#dfe1e6] bg-white">
                        <svg
                          className="h-3.5 w-3.5 text-[#a5adba]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      Unassigned
                    </button>
                    {membersForAssigneePickers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="option"
                        aria-selected={taskForPicker.assignee_id === m.id}
                        onClick={() => commitAssigneeFromBoard(assigneePicker.taskId, m.id)}
                        className={`mb-0.5 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-[14px] transition-colors last:mb-0 ${
                          taskForPicker.assignee_id === m.id
                            ? 'bg-[#e9f2ff] font-semibold text-[#0052cc]'
                            : 'font-medium text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <MemberAvatarChip
                          name={m.name}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                        />
                        <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </>
                )
              })()}
            </div>
          </>,
          document.body,
        )}

      {ctxMenu && (
        <>
          <div className="fixed inset-0 z-[300]" onClick={closeCtxMenu} onContextMenu={(e) => { e.preventDefault(); closeCtxMenu() }} />
          <div
            className="fixed z-[310] min-w-[180px] rounded-lg border border-slate-200/80 bg-white/98 p-1 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.25)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onMouseLeave={() => setCtxSubmenu(null)}
          >
            <button
              type="button"
              onClick={handleCtxEdit}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit task
            </button>
            <button
              type="button"
              onClick={() => { if (ctxTask) { setCtxMenu(null); openView(ctxTask) } }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View detail
            </button>
            <button
              type="button"
              onClick={handleCtxToggleDone}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {ctxTask?.status === 'done' ? 'Mark as open' : 'Mark as done'}
            </button>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setCtxSubmenu('due')}
                onClick={() => setCtxSubmenu((v) => (v === 'due' ? null : 'due'))}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due date
                <svg className="ml-auto h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {ctxSubmenu === 'due' && (
                <div className="absolute left-full top-0 ml-1 min-w-[140px] rounded-lg border border-slate-200/80 bg-white/98 p-1 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.25)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in">
                  {(() => {
                    const today = new Date()
                    const tomorrow = new Date(today)
                    tomorrow.setDate(today.getDate() + 1)
                    const daysUntilNextSunday = ((7 - today.getDay()) % 7) || 7
                    const nextSunday = new Date(today)
                    nextSunday.setDate(today.getDate() + daysUntilNextSunday)
                    const presets = [
                      { label: 'Today', value: toDayKey(today) },
                      { label: 'Tomorrow', value: toDayKey(tomorrow) },
                      { label: 'Next Sun', value: toDayKey(nextSunday) },
                    ]
                    return presets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleCtxSetDueDate(preset.value)}
                        className="mb-0.5 flex w-full items-center rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-100 transition-colors last:mb-0"
                      >
                        {preset.label}
                      </button>
                    ))
                  })()}
                </div>
              )}
            </div>
            <div className="my-1 border-t border-slate-100" />
            {ctxConfirmDelete ? (
              <div className="flex flex-col gap-1 p-1">
                <p className="px-2 py-1 text-[12px] font-semibold text-slate-500">Delete this task?</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleCtxDelete}
                    disabled={ctxDeleting}
                    className="flex-1 rounded-md px-3 py-1.5 text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {ctxDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCtxConfirmDelete(false)}
                    className="flex-1 rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCtxConfirmDelete(true)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete task
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function TaskMultiFilterDropdown({
  label,
  active,
  triggerIcon,
  children,
}: {
  label: string
  active?: boolean
  triggerIcon?: ReactNode
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-[5px] text-[12px] transition-colors ${
          open || active
            ? 'bg-[oklch(0.94_0_0)] border-black/20 text-[oklch(0.13_0_0)]'
            : 'bg-transparent border-black/10 text-[oklch(0.40_0_0)] hover:border-black/20 hover:text-[oklch(0.13_0_0)]'
        }`}
      >
        {triggerIcon}
        <span>{label}</span>
        <svg className="h-[11px] w-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+5px)] z-[120] min-w-[190px] overflow-hidden rounded-[8px] border border-black/[0.09] bg-white shadow-[0_10px_24px_-16px_rgba(0,0,0,0.45)] animate-fade-in">
          <div className="max-h-[280px] overflow-y-auto py-1">{children}</div>
        </div>
      )}
    </div>
  )
}
