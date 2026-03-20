'use client'

import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { formatTaskDue } from '@/lib/renovation-format'
import type { RenovationLabel, RenovationTask } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, sortTasks } from './tasks-page-shared'

export function TasksDesktop() {
  const {
    project,
    setTaskModalOpen,
    tasks,
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
    onDragStart,
    onDrop,
    filteredTasks,
  } = useTasksPageState()

  const renderCard = (t: RenovationTask) => {
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    return (
      <button
        key={t.id}
        draggable
        onDragStart={(e) => onDragStart(e, t.id)}
        type="button"
        onClick={() => openEdit(t)}
        className={`w-full text-left bg-white rounded-xl border border-slate-200/60 p-5 transition-all shadow-sm hover:shadow-md hover:border-indigo-200 active:scale-[0.98] cursor-grab active:cursor-grabbing ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div className="flex gap-3.5 items-start">
          <div className={`shrink-0 mt-0.5 ${isDone ? 'opacity-40 grayscale' : 'opacity-90'}`}>{PRIORITY_ICONS[t.urgency]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-1.5">
              {t.room && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 truncate max-w-[100px] border border-slate-200/50">
                  {t.room.name}
                </span>
              )}
              {(t.label_ids || []).map((lid) => {
                const lb = labels.find((l: RenovationLabel) => l.id === lid)
                return lb ? (
                  <span
                    key={lid}
                    className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm text-white whitespace-nowrap shadow-sm"
                    style={{ backgroundColor: lb.color }}
                  >
                    {lb.name}
                  </span>
                ) : null
              })}
            </div>

            <p className={`text-[16px] font-bold leading-snug text-slate-800 ${isDone ? 'line-through text-slate-500' : ''}`} dir="auto">
              {t.title}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5">
              {t.assignee && (
                <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-md border border-indigo-100" title="Assignee">
                  <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold text-indigo-800">
                    {t.assignee.name.charAt(0)}
                  </div>
                  <span className="text-[11px] font-bold tracking-tight">{t.assignee.name.split(' ')[0]}</span>
                </div>
              )}

              {t.provider && (
                <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2 py-1 rounded-md border border-teal-200/60" title="Service Provider">
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[11px] font-bold truncate max-w-[100px]">{t.provider.name}</span>
                </div>
              )}

              {dueMeta && (
                <div
                  title={dueMeta.title}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-bold tabular-nums ${
                    dueMeta.tone === 'overdue'
                      ? 'bg-rose-50 text-rose-600 border-rose-200/80'
                      : dueMeta.tone === 'soon'
                        ? 'bg-amber-50 text-amber-900 border-amber-200/70'
                        : 'bg-slate-100 text-slate-500 border-slate-200/60'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {dueMeta.label}
                </div>
              )}
            </div>

            {view !== 'status' && !isDone && (
              <div className="mt-2.5 flex">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full shadow-sm">
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
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
          {view === 'list' && <div className="space-y-3">{[...filteredTasks].sort(sortTasks).map(renderCard)}</div>}

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
                    className={`w-[320px] shrink-0 p-4 rounded-2xl flex flex-col gap-4 border-2 transition-all min-h-[50vh] ${
                      isDraggingOver
                        ? 'bg-indigo-50/80 border-indigo-400 border-dashed scale-[1.02] shadow-lg'
                        : 'bg-slate-100/60 border-transparent shadow-sm'
                    }`}
                  >
                    <h3 className="font-bold text-slate-700 capitalize px-1 flex justify-between items-center text-[16px]">
                      <span>{s.replace('_', ' ')}</span>
                      <span className="text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full text-[12px]">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-3 flex-1">
                      {paneTasks.map(renderCard)}
                      {paneTasks.length === 0 && (
                        <div className="py-6 text-center text-[14px] text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
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
                  <div key={m.id} className="w-[320px] shrink-0 bg-slate-100/60 p-4 rounded-2xl flex flex-col gap-4 shadow-sm">
                    <h3 className="font-bold text-slate-700 px-1 flex justify-between items-center text-[16px]">
                      <span>{m.name}</span>
                      <span className="text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full text-[12px]">{paneTasks.length}</span>
                    </h3>
                    <div className="space-y-3">{paneTasks.map(renderCard)}</div>
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
    </div>
  )
}
