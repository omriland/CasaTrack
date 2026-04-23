'use client'

import { useState } from 'react'
import { TaskModalMobile } from '@/components/renovation/TaskModalMobile'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { deleteTask } from '@/lib/renovation'
import { formatTaskDue } from '@/lib/renovation-format'
import { MemberAvatarChip } from '@/components/renovation/MemberAvatar'
import type { RenovationLabel, RenovationTask, TaskStatus, TaskUrgency } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, sortTasks } from './tasks-page-shared'

// ─── Status display config ────────────────────────────────────────────────────
const STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  open: 'oklch(0.13 0 0)',
  in_progress: 'oklch(0.55 0.22 250)',
  blocked: 'oklch(0.55 0.22 15)',
  done: 'oklch(0.65 0.18 163)',
}

const PRIORITY_COLOR: Record<TaskUrgency, string> = {
  critical: 'oklch(0.55 0.22 15)',
  high: 'oklch(0.55 0.22 15)',
  medium: 'oklch(0.72 0.16 73)',
  low: 'oklch(0.65 0.18 163)',
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TasksMobile() {
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
    filterAssignee,
    setFilterAssignee,
    filterLabel,
    setFilterLabel,
    sheet,
    setSheet,
    editing,
    openEdit,
    viewing,
    setViewing,
    openView,
    filteredTasks,
    toggleTaskDone,
  } = useTasksPageState()

  const [statusTab, setStatusTab] = useState<TaskStatus>('open')
  const [filterOpen, setFilterOpen] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ taskId: string; x: number; y: number } | null>(null)
  const [ctxConfirmDelete, setCtxConfirmDelete] = useState(false)
  const [ctxDeleting, setCtxDeleting] = useState(false)

  const ctxTask = ctxMenu ? tasks.find((t) => t.id === ctxMenu.taskId) : null

  const handleCardContext = (e: React.MouseEvent | React.TouchEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxConfirmDelete(false)
    const coords =
      'clientX' in e
        ? { x: e.clientX, y: e.clientY }
        : { x: e.touches[0].clientX, y: e.touches[0].clientY }
    setCtxMenu({ taskId, ...coords })
  }

  const closeCtxMenu = () => {
    setCtxMenu(null)
    setCtxConfirmDelete(false)
  }

  const handleCtxEdit = () => {
    if (ctxTask) { closeCtxMenu(); openEdit(ctxTask) }
  }

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
    if (ctxTask) { closeCtxMenu(); toggleTaskDone(ctxTask.id, ctxTask.status === 'done') }
  }

  const activeFilters = (filterAssignee ? 1 : 0) + (filterLabel ? 1 : 0)

  const statusCounts = {} as Record<TaskStatus, number>
  STATUSES.forEach((s) => {
    statusCounts[s] = filteredTasks.filter((t) => t.status === s).length
  })

  const visibleTasks = [...filteredTasks.filter((t) => t.status === statusTab)].sort(sortTasks)

  if (!project) {
    return (
      <p className="py-16 text-center text-slate-500">
        <a href="/renovation" className="font-semibold text-indigo-600">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <>
      {/* Sticky header + status tabs */}
      <div className="sticky top-0 z-10 -mx-4 bg-[#f5f6f8]">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <h1
            className="text-[20px] font-bold tracking-tight text-slate-900"
            style={{ letterSpacing: '-0.02em' }}
          >
            Tasks
          </h1>
          <div className="flex items-center gap-2">
            {/* Filter button — only shown when filters are active */}
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500"
                aria-label="Filter"
              >
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                  {activeFilters}
                </span>
              </button>
            )}
            {activeFilters === 0 && (
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400"
                aria-label="Filter"
              >
                <svg
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
              </button>
            )}
            {/* Add button */}
            <button
              type="button"
              onClick={() => setTaskModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: 'oklch(0.13 0 0)', padding: '6px 12px' }}
            >
              <svg
                width={13}
                height={13}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add
            </button>
          </div>
        </div>

        {/* Status tabs — scrollable, underline style */}
        <div
          className="flex overflow-x-auto"
          style={{
            scrollbarWidth: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            paddingLeft: 16,
          }}
        >
          {(STATUSES as TaskStatus[]).map((s) => {
            const isActive = s === statusTab
            const color = STATUS_COLOR[s]
            const count = statusCounts[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusTab(s)}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap transition-colors"
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                  padding: '8px 14px',
                  fontSize: 12.5,
                  color: isActive ? color : 'oklch(0.60 0 0)',
                  marginBottom: -1,
                }}
              >
                {STATUS_LABEL[s]}
                <span
                  className="rounded-full px-1.5 py-0 font-mono text-[10px]"
                  style={{
                    color: isActive ? color : 'oklch(0.60 0 0)',
                    background: isActive
                      ? `color-mix(in oklch, ${color} 10%, white)`
                      : 'oklch(0.94 0 0)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
          <div style={{ width: 16, flexShrink: 0 }} />
        </div>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2 pb-28 pt-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-[10px] bg-white/70" />
            ))}
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[14px] text-slate-400">No tasks here</p>
          </div>
        ) : (
          visibleTasks.map((t, i) => (
            <TaskCard
              key={t.id}
              task={t}
              labels={labels}
              delay={i * 30}
              onTap={() => openView(t)}
              onContextMenu={(e) => handleCardContext(e, t.id)}
            />
          ))
        )}
      </div>

      {/* Filter bottom sheet */}
      <MobileBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter">
        <div className="space-y-6 pb-4">
          <div>
            <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Assignee
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterAssignee('')}
                className={`min-h-[44px] rounded-xl border px-4 text-[14px] font-semibold ${
                  !filterAssignee
                    ? 'border-transparent bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Everyone
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFilterAssignee(m.id)}
                  className={`min-h-[44px] rounded-xl border px-4 text-[14px] font-semibold ${
                    filterAssignee === m.id
                      ? 'border-transparent bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                  dir="auto"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {labels.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Tag
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterLabel('')}
                  className={`min-h-[44px] rounded-xl border px-4 text-[14px] font-semibold ${
                    !filterLabel
                      ? 'border-transparent bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  All tags
                </button>
                {labels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setFilterLabel(l.id)}
                    className={`min-h-[44px] rounded-xl border px-4 text-[14px] font-semibold ${
                      filterLabel === l.id
                        ? 'border-transparent text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                    style={filterLabel === l.id ? { backgroundColor: l.color } : undefined}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(filterAssignee || filterLabel) && (
            <button
              type="button"
              onClick={() => {
                setFilterAssignee('')
                setFilterLabel('')
              }}
              className="w-full min-h-[48px] rounded-xl border border-slate-200 text-[15px] font-bold text-slate-600"
            >
              Reset filters
            </button>
          )}
        </div>
      </MobileBottomSheet>

      {/* Edit modal (for editing existing tasks via context menu) */}
      {sheet && (
        <TaskModalMobile
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

      {/* Task detail drawer */}
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
            setTasks((prev) =>
              prev.map((pt) => (pt.id === updatedTask.id ? updatedTask : pt)),
            )
          }}
          onLabelCreated={(lb) =>
            setLabels((prev) =>
              [...prev, lb].sort(
                (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
              ),
            )
          }
        />
      )}

      {/* Context menu */}
      {ctxMenu && (
        <>
          <div
            className="fixed inset-0 z-[300]"
            onClick={closeCtxMenu}
            onContextMenu={(e) => {
              e.preventDefault()
              closeCtxMenu()
            }}
          />
          <div
            className="fixed z-[310] min-w-[200px] animate-fade-in rounded-2xl border border-slate-200/80 bg-white/98 p-1.5 shadow-[0_10px_40px_-10px_rgba(9,30,66,0.25)] ring-1 ring-black/[0.04] backdrop-blur-xl"
            style={{
              left: Math.min(ctxMenu.x, window.innerWidth - 220),
              top: Math.min(ctxMenu.y, window.innerHeight - 250),
            }}
          >
            <button
              type="button"
              onClick={handleCtxEdit}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors active:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit task
            </button>
            <button
              type="button"
              onClick={() => { if (ctxTask) { setCtxMenu(null); openView(ctxTask) } }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors active:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View detail
            </button>
            <button
              type="button"
              onClick={handleCtxToggleDone}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-medium text-slate-700 transition-colors active:bg-slate-100"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {ctxTask?.status === 'done' ? 'Mark as open' : 'Mark as done'}
            </button>
            <div className="my-1 border-t border-slate-100" />
            {ctxConfirmDelete ? (
              <div className="flex flex-col gap-1.5 p-1.5">
                <p className="px-2 py-1 text-[13px] font-semibold text-slate-500">
                  Delete this task?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCtxDelete}
                    disabled={ctxDeleting}
                    className="flex-1 rounded-xl bg-rose-600 px-3 py-2.5 text-[15px] font-bold text-white transition-colors active:bg-rose-700 disabled:opacity-50"
                  >
                    {ctxDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCtxConfirmDelete(false)}
                    className="flex-1 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-slate-600 transition-colors active:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCtxConfirmDelete(true)}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[15px] font-medium text-rose-600 transition-colors active:bg-rose-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete task
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task: t,
  labels,
  delay = 0,
  onTap,
  onContextMenu,
}: {
  task: RenovationTask
  labels: RenovationLabel[]
  delay?: number
  onTap: () => void
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent) => void
}) {
  const isDone = t.status === 'done'
  const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
  const priorityColor = PRIORITY_COLOR[t.urgency]

  const taskLabels = (t.label_ids ?? [])
    .map((id) => labels.find((l) => l.id === id))
    .filter(Boolean) as RenovationLabel[]

  return (
    <div
      onClick={onTap}
      onContextMenu={onContextMenu as React.MouseEventHandler}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10,
        borderRight: `3px solid ${priorityColor}`,
        padding: '11px 12px 10px 11px',
        cursor: 'pointer',
        opacity: isDone ? 0.6 : 1,
        direction: 'rtl',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Title */}
      <p
        className="mb-2 text-[14px] leading-snug"
        style={{
          fontFamily: 'var(--font-assistant, var(--heb, sans-serif))',
          color: 'oklch(0.13 0 0)',
          textDecoration: isDone ? 'line-through' : 'none',
          letterSpacing: 0,
        }}
      >
        {t.title}
      </p>

      {/* Tags / labels */}
      {taskLabels.length > 0 && (
        <div className="mb-2 flex flex-wrap justify-end gap-1">
          {taskLabels.map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{
                fontFamily: 'var(--font-assistant, sans-serif)',
                background: `color-mix(in srgb, ${label.color} 15%, white)`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer: assignee + subtasks | due date */}
      <div
        className="flex items-center justify-between gap-1.5"
        style={{ direction: 'ltr' }}
      >
        <div className="flex items-center gap-1.5">
          {t.assignee && (
            <MemberAvatarChip
              name={t.assignee.name}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-[6px] text-[9px] font-bold"
            />
          )}
          {(t.subtask_total ?? 0) > 0 && (
            <span
              className="flex items-center gap-0.5 font-mono text-[11px]"
              style={{
                color:
                  t.subtask_done === t.subtask_total
                    ? 'oklch(0.65 0.18 163)'
                    : 'oklch(0.60 0 0)',
              }}
            >
              <svg
                width={11}
                height={11}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 12h6M9 16h4" />
              </svg>
              {t.subtask_done ?? 0}/{t.subtask_total}
            </span>
          )}
        </div>

        {dueMeta && (
          <span
            className="flex items-center gap-0.5 text-[11px]"
            style={{
              color:
                dueMeta.tone === 'overdue'
                  ? 'oklch(0.55 0.22 15)'
                  : dueMeta.tone === 'soon'
                    ? 'oklch(0.72 0.16 73)'
                    : 'oklch(0.60 0 0)',
              direction: 'ltr',
            }}
          >
            <svg
              width={11}
              height={11}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
            </svg>
            {dueMeta.label}
          </span>
        )}
      </div>
    </div>
  )
}
