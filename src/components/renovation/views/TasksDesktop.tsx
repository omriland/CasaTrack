'use client'

import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { formatTaskDue } from '@/lib/renovation-format'
import { memberAvatarChipStyle, memberAvatarLetter } from '@/lib/member-avatar'
import type { RenovationLabel, RenovationTask } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, sortTasks } from './tasks-page-shared'

export function TasksDesktop() {
  const {
    project,
    setTaskModalOpen,
    tasks,
    setTasks,
    members,
    labels,
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
  } = useTasksPageState()

  const renderCard = (t: RenovationTask) => {
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    const createdByTitle = t.created_by ? `Created by ${t.created_by.name}` : undefined

    return (
      <div
        key={t.id}
        draggable
        onDragStart={(e) => onDragStart(e, t.id)}
        className={`w-full text-left bg-white rounded-[5px] border border-[#dfe1e6] p-3 transition-colors hover:bg-slate-50 cursor-grab active:cursor-grabbing group relative ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div onClick={() => openView(t)} role="button" tabIndex={0} title={createdByTitle} className="flex flex-col gap-2 cursor-pointer focus:outline-none">
          <p className={`text-[14px] text-right font-medium leading-snug text-[#172b4d] ${isDone ? 'line-through text-slate-500' : ''}`} dir="rtl">
            {t.title}
          </p>

          {(t.room || (t.label_ids && t.label_ids.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {t.room && (
                <span className="text-[11px] font-bold px-1.5 py-[2px] rounded-[3px] bg-[#dfe1e6] text-[#42526e] truncate max-w-[120px]">
                  {t.room.name}
                </span>
              )}
              {(t.label_ids || []).map((lid) => {
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
              })}
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

            <div className="flex items-center shrink-0">
              {t.assignee ? (
                <div
                  className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold shadow-sm"
                  style={memberAvatarChipStyle(t.assignee.name)}
                  title={t.assignee.name}
                >
                  <span className="leading-none">{memberAvatarLetter(t.assignee.name)}</span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-dashed border-[#dfe1e6] flex items-center justify-center bg-[#f4f5f7]" title="Unassigned">
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
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900 font-sans">Tasks</h1>
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
              className={`h-10 px-4 rounded-full text-[14px] font-bold transition-all capitalize whitespace-nowrap ${
                view === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              By {v}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
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
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
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
          {view === 'list' && <div className="space-y-2">{[...filteredTasks].sort(sortTasks).map(renderCard)}</div>}

          {view === 'status' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-start scrollbar-hide">
              {STATUSES.map((s) => {
                const paneTasks = filteredTasks.filter((t) => t.status === s).sort(sortTasks)
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
                    className={`w-[282px] shrink-0 p-2 rounded-sm flex flex-col gap-2 transition-colors min-h-[50vh] ${
                      isDraggingOver
                        ? 'bg-[#ebf3ff]'
                        : 'bg-[#f4f5f7]'
                    }`}
                  >
                    <h3 className="font-semibold text-[#5e6c84] uppercase tracking-wider px-2 pt-2 pb-1 flex items-center gap-2 text-[12px]">
                      <span>{s.replace('_', ' ')}</span>
                      <span className="text-[#172b4d] font-semibold">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-2 flex-1">
                      {paneTasks.map(renderCard)}
                      {paneTasks.length === 0 && (
                        <div className="py-6 text-center text-[14px] text-slate-400 font-bold">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {view === 'assignee' && (
            <div className="flex gap-4 overflow-x-auto pb-6 items-start scrollbar-hide">
              {[{ id: 'unassigned', name: 'Unassigned' }, ...members].map((m) => {
                const paneTasks = filteredTasks
                  .filter((t) => (m.id === 'unassigned' ? !t.assignee_id : t.assignee_id === m.id))
                  .sort(sortTasks)
                if (paneTasks.length === 0) return null
                return (
                  <div key={m.id} className="w-[282px] shrink-0 p-2 rounded-sm flex flex-col gap-2 bg-[#f4f5f7] min-h-[50vh]">
                    <h3 className="font-semibold text-[#5e6c84] uppercase tracking-wider px-2 pt-2 pb-1 flex items-center gap-2 text-[12px]">
                      <span>{m.name}</span>
                      <span className="text-[#172b4d] font-semibold">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-2">{paneTasks.map(renderCard)}</div>
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
        />
      )}
    </div>
  )
}
