'use client'

import { useState, useRef, type CSSProperties } from 'react'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { createTask, deleteTask } from '@/lib/renovation'
import { formatTaskDue } from '@/lib/renovation-format'
import { MemberAvatarChip } from '@/components/renovation/MemberAvatar'
import type { RenovationLabel, RenovationTask, TaskStatus } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, buildEpicSwimlanes, sortTasks } from './tasks-page-shared'

/** Native <select> arrows ignore padding; custom chevron inset from the right. */
const FILTER_SELECT_STYLE: CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundSize: '1.125rem 1.125rem',
  backgroundPosition: 'right 0.75rem center',
  backgroundRepeat: 'no-repeat',
}

const FILTER_SELECT_CLASS =
  'h-10 rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-[14px] font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none appearance-none'

export function TasksDesktop() {
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
    filterAssignee,
    setFilterAssignee,
    filterLabel,
    setFilterLabel,
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
    filteredTasks,
    toggleTaskDone,
  } = useTasksPageState({ defaultView: 'epic' })

  const [doneLaneCollapsed, setDoneLaneCollapsed] = useState(true)
  const [ctxMenu, setCtxMenu] = useState<{ taskId: string; x: number; y: number } | null>(null)
  const [ctxConfirmDelete, setCtxConfirmDelete] = useState(false)
  const [ctxDeleting, setCtxDeleting] = useState(false)

  const handleCardContext = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxConfirmDelete(false)
    setCtxMenu({ taskId, x: e.clientX, y: e.clientY })
  }

  const closeCtxMenu = () => { setCtxMenu(null); setCtxConfirmDelete(false) }
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

  const [quickAddColumn, setQuickAddColumn] = useState<string | null>(null)
  const [quickAddValue, setQuickAddValue] = useState('')
  const [quickAddSaving, setQuickAddSaving] = useState(false)
  const quickAddInputRef = useRef<HTMLInputElement>(null)

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
          className="flex w-full items-center gap-1.5 rounded-[5px] px-3 py-2 text-[13px] font-semibold text-slate-400 opacity-0 group-hover/col:opacity-100 hover:!opacity-100 hover:bg-white/80 hover:text-slate-600 transition-all focus:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      )
    }
    return (
      <div className="rounded-[5px] border border-[#4c9aff] bg-white p-1.5 shadow-sm animate-fade-in">
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
          className="w-full rounded px-2 py-1.5 text-[14px] font-medium text-[#172b4d] outline-none placeholder:text-slate-400"
        />
      </div>
    )
  }

  const renderCard = (t: RenovationTask, opts?: { draggable?: boolean }) => {
    const draggable = opts?.draggable !== false
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    const createdByTitle = t.created_by ? `Created by ${t.created_by.name}` : undefined
    const hasLabels = (t.label_ids?.length ?? 0) > 0
    const hasDueAndProvider = Boolean(t.due_date) && Boolean(t.provider_id ?? t.provider)
    const labelsOnOwnRow = hasLabels && hasDueAndProvider

    const labelChipEls = (t.label_ids || []).map((lid) => {
      const lb = labels.find((l: RenovationLabel) => l.id === lid)
      return lb ? (
        <span
          key={lid}
          className="text-[11px] font-bold px-1.5 py-[2px] rounded-[3px] text-white whitespace-nowrap"
          style={{ backgroundColor: lb.color }}
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
        className={`w-full text-left bg-white rounded-[5px] border border-[#dfe1e6] p-3 transition-colors hover:bg-slate-50 group relative ${isDone ? 'opacity-60 bg-slate-50' : ''} ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div onClick={() => openView(t)} role="button" tabIndex={0} title={createdByTitle} className="flex flex-col gap-2 cursor-pointer focus:outline-none">
          <p className={`text-[14px] text-right font-medium leading-snug text-[#172b4d] ${isDone ? 'line-through text-slate-500' : ''}`} dir="rtl">
            {t.title}
          </p>

          {(t.room || labelsOnOwnRow) && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {t.room && (
                <span className="text-[11px] font-bold px-1.5 py-[2px] rounded-[3px] bg-[#dfe1e6] text-[#42526e] truncate max-w-[120px]">
                  {t.room.name}
                </span>
              )}
              {labelsOnOwnRow ? labelChipEls : null}
            </div>
          )}

          <div className="flex items-center justify-between mt-1 h-6">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0 w-[18px] h-[18px]">
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDone ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'}`}>
                  <div className="scale-75">{PRIORITY_ICONS[t.urgency]}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTaskDone(t.id, isDone)
                  }}
                  className={`absolute inset-0 w-full h-full rounded-[3px] border flex items-center justify-center transition-all group/cb ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-600 text-white opacity-100' 
                      : 'bg-white border-[#dfe1e6] hover:border-[#4c9aff] hover:bg-[#ebf3ff] opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                  }`}
                  aria-label={isDone ? 'Mark as open' : 'Mark as done'}
                >
                  <svg 
                    className={`w-3 h-3 transition-all ${isDone ? 'text-white' : 'text-[#0052cc] opacity-0 group-hover/cb:opacity-100 scale-75 group-hover/cb:scale-100'}`} 
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>

              {!!t.body?.trim() && (
                <div title="Has description" className="text-[#5e6c84] flex items-center justify-center">
                  <svg className="w-[15px] h-[15px] opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
                  </svg>
                </div>
              )}

              {(t.subtask_total ?? 0) > 0 && (
                <div
                  title={`${t.subtask_done ?? 0} of ${t.subtask_total} subtasks done`}
                  className={`flex items-center gap-0.5 text-[12px] font-semibold tabular-nums ${
                    t.subtask_done === t.subtask_total ? 'text-emerald-600' : 'text-[#5e6c84]'
                  }`}
                >
                  <svg className="w-[14px] h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t.subtask_done ?? 0}/{t.subtask_total}
                </div>
              )}

              {dueMeta && (
                <div
                  title={dueMeta.title}
                  className={`flex items-center gap-1 text-[12px] font-semibold ${
                    dueMeta.tone === 'overdue'
                      ? 'text-[#de350b]'
                      : dueMeta.tone === 'soon'
                        ? 'text-[#ff991f]'
                        : 'text-[#5e6c84]'
                  }`}
                >
                  {dueMeta.label}
                </div>
              )}
              {t.provider && (
                <span className="text-[12px] text-[#5e6c84] font-medium truncate max-w-[80px]" title="Provider">
                   • {t.provider.name}
                </span>
              )}
            </div>

            <div className="flex min-w-0 max-w-[58%] shrink-0 items-center justify-end gap-1.5">
              {hasLabels && !labelsOnOwnRow && (
                <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-0.5 overflow-hidden" dir="ltr">
                  {(t.label_ids || []).map((lid) => {
                    const lb = labels.find((l: RenovationLabel) => l.id === lid)
                    return lb ? (
                      <span
                        key={lid}
                        className="max-w-[72px] shrink truncate text-[10px] font-bold px-1 py-[1px] rounded-[3px] text-white"
                        style={{ backgroundColor: lb.color }}
                        title={lb.name}
                      >
                        {lb.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
              {t.assignee ? (
                <div className="shrink-0" title={t.assignee.name}>
                  <MemberAvatarChip
                    name={t.assignee.name}
                    className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-[#dfe1e6] bg-[#f4f5f7]" title="Unassigned">
                  <svg className="w-3.5 h-3.5 text-[#a5adba]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /** Status columns (open → done); `keyPrefix` keeps React keys unique per epic swimlane row. */
  const renderStatusBoardColumns = (taskPool: RenovationTask[], keyPrefix: string, colMinHeight: string, laneLabel?: { id: string }) =>
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
            className={`flex w-[52px] shrink-0 flex-col rounded-sm p-1.5 transition-colors ${colMinHeight} ${
              isDraggingOver ? 'bg-[#ebf3ff]' : 'bg-[#f4f5f7]'
            }`}
          >
            <button
              type="button"
              onClick={() => setDoneLaneCollapsed(false)}
              className="flex min-h-0 flex-1 flex-col items-center gap-2 rounded-md py-3 text-[#5e6c84] transition-colors hover:bg-white/90 hover:text-[#172b4d] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
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
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 [writing-mode:vertical-rl] rotate-180">
                Done
              </span>
              <span className="text-[16px] font-bold tabular-nums text-[#172b4d]">{paneTasks.length}</span>
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
          className={`group/col w-[282px] shrink-0 p-2 rounded-sm flex flex-col gap-2 transition-colors ${colMinHeight} ${
            isDraggingOver ? 'bg-[#ebf3ff]' : 'bg-[#f4f5f7]'
          }`}
        >
          <h3 className="font-semibold text-[#5e6c84] uppercase tracking-wider px-2 pt-2 pb-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="flex items-center gap-2 min-w-0">
              <span>{s.replace('_', ' ')}</span>
              <span className="text-[#172b4d] font-semibold">{paneTasks.length}</span>
            </span>
            {isDoneLane && (
              <button
                type="button"
                onClick={() => setDoneLaneCollapsed(true)}
                className="shrink-0 rounded p-1 text-[#5e6c84] hover:bg-white/80 hover:text-[#172b4d] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
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
              <div className="py-6 text-center text-[14px] text-slate-400 font-bold">Drop tasks here</div>
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
    <div className="space-y-6 pb-8 animate-fade-in-up">
      <header className="flex flex-row items-end justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">Tasks</h1>
            {(filterAssignee || filterLabel) && (
              <span className="text-[14px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full animate-fade-in">
                Showing {filteredTasks.length} / {tasks.length}
              </span>
            )}
          </div>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">Track what needs to be done and stay organized.</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="h-11 px-6 rounded-full bg-indigo-600 text-white text-[15px] font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            + Add Task
          </button>
        </div>
      </header>

      <div className="flex flex-row gap-3 items-center pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['status', 'assignee', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`h-10 px-4 rounded-full text-[14px] font-semibold transition-all capitalize whitespace-nowrap ${
                view === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              By {v}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView('epic')}
            className={`h-10 px-4 rounded-full text-[14px] font-semibold transition-all whitespace-nowrap ${
              view === 'epic' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Epic View
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className={FILTER_SELECT_CLASS}
            style={FILTER_SELECT_STYLE}
          >
            <option value="">All Assignees</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            className={FILTER_SELECT_CLASS}
            style={FILTER_SELECT_STYLE}
          >
            <option value="">All Tags</option>
            {labels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
              {[...filteredTasks].sort(sortTasks).map((t) => renderCard(t))}
              {renderQuickAdd('open', 'list-bottom')}
            </div>
          )}

          {view === 'status' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-stretch scrollbar-hide">
              {renderStatusBoardColumns(filteredTasks, 'board', 'min-h-[50vh]')}
            </div>
          )}

          {view === 'assignee' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-stretch scrollbar-hide">
              {[{ id: 'unassigned', name: 'Unassigned' }, ...members].map((m) => {
                const paneTasks = filteredTasks
                  .filter((t) => (m.id === 'unassigned' ? !t.assignee_id : t.assignee_id === m.id))
                  .sort(sortTasks)
                if (paneTasks.length === 0) return null
                return (
                  <div key={m.id} className="group/col flex w-[282px] shrink-0 flex-col gap-2 rounded-sm bg-[#f4f5f7] p-2 min-h-[50vh]">
                    <h3 className="flex items-center gap-2 px-2 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wider text-[#5e6c84]">
                      <span>{m.name}</span>
                      <span className="font-semibold text-[#172b4d]">{paneTasks.length}</span>
                    </h3>
                    <div className="flex min-h-0 flex-1 flex-col gap-2">{paneTasks.map((t) => renderCard(t))}</div>
                    {renderQuickAdd('open', `assignee-${m.id}`, { assigneeId: m.id === 'unassigned' ? null : m.id })}
                  </div>
                )
              })}
            </div>
          )}

          {view === 'epic' && (
            <div className="flex flex-col gap-5 pb-6">
              {buildEpicSwimlanes(filteredTasks, labels).map((lane) => (
                <div key={lane.id} className="flex flex-col gap-1">
                  <h3 className="flex items-center gap-2 px-0.5 pb-1 pt-1 text-[12px] font-semibold uppercase tracking-wider text-[#5e6c84]">
                    {lane.color ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: lane.color }} />
                    ) : (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-[#c1c7d0] bg-white" />
                    )}
                    <span className="min-w-0 truncate" dir="auto">
                      {lane.title}
                    </span>
                    <span className="font-semibold text-[#172b4d]">{lane.tasks.length}</span>
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide items-stretch">
                    {renderStatusBoardColumns(lane.tasks, lane.id, 'min-h-[200px]', lane.id !== 'none' ? { id: lane.id } : undefined)}
                  </div>
                </div>
              ))}
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

      {ctxMenu && (
        <>
          <div className="fixed inset-0 z-[300]" onClick={closeCtxMenu} onContextMenu={(e) => { e.preventDefault(); closeCtxMenu() }} />
          <div
            className="fixed z-[310] min-w-[180px] rounded-lg border border-slate-200/80 bg-white/98 p-1 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.25)] ring-1 ring-black/[0.04] backdrop-blur-xl animate-fade-in"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
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
