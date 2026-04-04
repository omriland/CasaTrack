'use client'

import { useState } from 'react'
import { TaskModalMobile } from '@/components/renovation/TaskModalMobile'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { MobileFilterButton } from '@/components/renovation/mobile/MobileFilterButton'
import { formatTaskDue } from '@/lib/renovation-format'
import { MemberAvatarChip } from '@/components/renovation/MemberAvatar'
import type { RenovationTask, TaskStatus, TaskUrgency } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, buildEpicSwimlanes, sortTasks } from './tasks-page-shared'

type StatusTab = 'all' | TaskStatus
type TasksLayoutMode = 'list' | 'epic'

const PRIORITY_LABELS: Record<TaskUrgency, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Urgent',
}

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

  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [layoutMode, setLayoutMode] = useState<TasksLayoutMode>('epic')
  const [doneLaneCollapsed, setDoneLaneCollapsed] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const listTasksFiltered = filteredTasks.filter((t) => (statusTab === 'all' ? true : t.status === statusTab))
  const actionsActiveCount =
    (filterAssignee ? 1 : 0) +
    (filterLabel ? 1 : 0) +
    (layoutMode !== 'epic' ? 1 : 0) +
    (statusTab !== 'all' ? 1 : 0)

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <a href="/renovation" className="text-indigo-600 font-semibold">Create a project first</a>
      </p>
    )
  }

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Tasks</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Tap a task to view details</p>
        </div>
        <MobileFilterButton
          onClick={() => setFilterOpen(true)}
          activeCount={actionsActiveCount}
          label="Actions"
          icon="sliders"
        />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
          <p className="text-[16px] font-bold text-slate-700">No tasks yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Create your first task to get organized.</p>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="mt-5 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white text-[16px] font-bold w-full max-w-xs"
          >
            Add task
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <p className="text-[16px] font-semibold text-slate-600">No tasks match</p>
          <p className="text-[14px] text-slate-500 mt-1">Try clearing filters.</p>
        </div>
      ) : layoutMode === 'list' && listTasksFiltered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <p className="text-[16px] font-semibold text-slate-600">No tasks here</p>
          <p className="text-[14px] text-slate-500 mt-1">Try another status or clear filters.</p>
        </div>
      ) : layoutMode === 'list' ? (
        <div className="space-y-2">
          {[...listTasksFiltered].sort(sortTasks).map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onTap={() => openView(t)}
              onToggleDone={() => toggleTaskDone(t.id, t.status === 'done')}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5 pb-2">
          {buildEpicSwimlanes(filteredTasks, labels).map((lane) => (
            <div key={lane.id} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 px-0.5 text-[12px] font-bold uppercase tracking-wider text-slate-500">
                {lane.color ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: lane.color }} />
                ) : (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-dashed border-slate-300 bg-white" />
                )}
                <span className="min-w-0 truncate" dir="auto">
                  {lane.title}
                </span>
                <span className="font-bold text-slate-800">{lane.tasks.length}</span>
              </h2>
              <MobileEpicStatusRow
                laneId={lane.id}
                taskPool={lane.tasks}
                openView={openView}
                toggleTaskDone={toggleTaskDone}
                doneLaneCollapsed={doneLaneCollapsed}
                setDoneLaneCollapsed={setDoneLaneCollapsed}
              />
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setTaskModalOpen(true)}
        className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.45)] transition-transform active:scale-95 right-4"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Add task"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <MobileBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Actions">
        <div className="space-y-6 pb-4">
          <div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">View</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${layoutMode === 'list' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('epic')}
                className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${layoutMode === 'epic' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                Epic
              </button>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Status</p>
            <p className="text-[12px] text-slate-500 mb-2 px-1">Filters the list view</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusTab('all')}
                className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${statusTab === 'all' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                All ({filteredTasks.length})
              </button>
              {STATUSES.map((s) => {
                const c = filteredTasks.filter((t) => t.status === s).length
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusTab(s)}
                    className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold capitalize border ${statusTab === s ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
                  >
                    {s.replace('_', ' ')} ({c})
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Assignee</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterAssignee('')}
                className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${!filterAssignee ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                Everyone
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFilterAssignee(m.id)}
                  className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${filterAssignee === m.id ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
                  dir="auto"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Tag</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterLabel('')}
                className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${!filterLabel ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                All tags
              </button>
              {labels.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setFilterLabel(l.id)}
                  className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${filterLabel === l.id ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-700'}`}
                  style={filterLabel === l.id ? { backgroundColor: l.color } : undefined}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterAssignee('')
              setFilterLabel('')
              setLayoutMode('epic')
              setStatusTab('all')
            }}
            className="w-full min-h-[48px] rounded-xl border border-slate-200 text-[16px] font-bold text-slate-600"
          >
            Reset all
          </button>
        </div>
      </MobileBottomSheet>

      {sheet && (
        <TaskModalMobile
          editing={editing}
          members={members}
          labels={labels}
          rooms={rooms}
          providers={providers}
          onClose={() => setSheet(false)}
          onSave={() => { setSheet(false); load() }}
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
          onEdit={() => { setViewing(null); openEdit(viewing) }}
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
    </div>
  )
}

function MobileEpicStatusRow({
  laneId,
  taskPool,
  openView,
  toggleTaskDone,
  doneLaneCollapsed,
  setDoneLaneCollapsed,
}: {
  laneId: string
  taskPool: RenovationTask[]
  openView: (t: RenovationTask) => void
  toggleTaskDone: (id: string, isDone: boolean) => void
  doneLaneCollapsed: boolean
  setDoneLaneCollapsed: (v: boolean) => void
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-hide -mx-1 px-1 items-stretch">
      {STATUSES.map((s) => {
        const paneTasks = taskPool.filter((t) => t.status === s).sort(sortTasks)
        const isDoneLane = s === 'done'
        const collapsed = isDoneLane && doneLaneCollapsed

        if (collapsed) {
          return (
            <div
              key={`${laneId}-${s}`}
              className="flex w-[52px] shrink-0 flex-col rounded-xl bg-slate-100/90 p-1.5 min-h-[200px]"
            >
              <button
                type="button"
                onClick={() => setDoneLaneCollapsed(false)}
                className="flex min-h-0 flex-1 flex-col items-center gap-2 rounded-lg py-3 text-slate-500 transition-colors active:bg-white/80"
                aria-expanded="false"
                aria-label="Expand Done column"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 [writing-mode:vertical-rl] rotate-180">
                  Done
                </span>
                <span className="text-[15px] font-bold tabular-nums text-slate-800">{paneTasks.length}</span>
              </button>
            </div>
          )
        }

        return (
          <div
            key={`${laneId}-${s}`}
            className="flex w-[min(280px,82vw)] max-w-[300px] shrink-0 flex-col rounded-xl bg-slate-100/90 p-2 min-h-[200px]"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-1">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span className="capitalize">{s.replace('_', ' ')}</span>
                <span className="ml-1.5 font-bold text-slate-800">{paneTasks.length}</span>
              </h3>
              {isDoneLane && (
                <button
                  type="button"
                  onClick={() => setDoneLaneCollapsed(true)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-500 active:bg-white/80"
                  aria-expanded="true"
                  aria-label="Collapse Done column"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {paneTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onTap={() => openView(t)}
                  onToggleDone={() => toggleTaskDone(t.id, t.status === 'done')}
                />
              ))}
              {paneTasks.length === 0 && (
                <p className="py-6 text-center text-[13px] font-semibold text-slate-400">Empty</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskCard({ task: t, onTap, onToggleDone }: { task: RenovationTask; onTap: () => void; onToggleDone: () => void }) {
  const isDone = t.status === 'done'
  const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
  const priorityLabel = PRIORITY_LABELS[t.urgency] || ''

  return (
    <div className={`rounded-2xl bg-white border border-slate-200/60 shadow-sm overflow-hidden transition-opacity ${isDone ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2.5 p-3.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleDone() }}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${isDone ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-transparent active:border-indigo-400'}`}
          aria-label={isDone ? 'Mark as open' : 'Mark as done'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        {/* Card content - tap to open */}
        <button type="button" onClick={onTap} className="flex-1 min-w-0 text-left">
          <p className={`text-[16px] font-semibold leading-snug text-slate-900 ${isDone ? 'line-through text-slate-500' : ''}`} dir="auto">
            {t.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {dueMeta && (
              <span className={`text-[13px] font-semibold tabular-nums ${
                dueMeta.tone === 'overdue' ? 'text-rose-600' : dueMeta.tone === 'soon' ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {dueMeta.label}
              </span>
            )}
            {priorityLabel && t.urgency !== 'medium' && (
              <span className={`text-[13px] font-semibold ${t.urgency === 'critical' ? 'text-rose-600' : t.urgency === 'high' ? 'text-amber-600' : 'text-slate-400'}`}>
                {priorityLabel}
              </span>
            )}
            {t.room && (
              <span className="text-[13px] font-medium text-slate-500 truncate max-w-[120px]">{t.room.name}</span>
            )}
          </div>
        </button>

        {/* Assignee */}
        {t.assignee ? (
          <div className="shrink-0" title={t.assignee.name}>
            <MemberAvatarChip
              name={t.assignee.name}
              className="grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold"
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50">
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
