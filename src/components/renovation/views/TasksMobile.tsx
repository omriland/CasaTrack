'use client'

import { useState } from 'react'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { TaskDetailDrawer } from '@/components/renovation/TaskDetailDrawer'
import { MobileBottomSheet } from '@/components/renovation/mobile/MobileBottomSheet'
import { MobileFilterButton } from '@/components/renovation/mobile/MobileFilterButton'
import { formatTaskDue } from '@/lib/renovation-format'
import type { RenovationLabel, RenovationTask, TaskStatus } from '@/types/renovation'
import { useTasksPageState } from './useTasksPageState'
import { STATUSES, sortTasks } from './tasks-page-shared'

type StatusTab = 'all' | TaskStatus

export function TasksMobile() {
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
  const [filterOpen, setFilterOpen] = useState(false)

  const listTasksFiltered = filteredTasks.filter((t) => (statusTab === 'all' ? true : t.status === statusTab))

  const renderCard = (t: RenovationTask) => {
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    const createdByTitle = t.created_by ? `Created by ${t.created_by.name}` : undefined

    return (
      <div
        key={t.id}
        className={`w-full text-left bg-white rounded-[6px] border border-[#dfe1e6] p-3 transition-colors active:bg-slate-50 relative ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div onClick={() => openView(t)} role="button" tabIndex={0} title={createdByTitle} className="flex flex-col gap-2 cursor-pointer focus:outline-none">
          <p className={`text-[15px] text-right font-medium leading-snug text-[#172b4d] ${isDone ? 'line-through text-slate-500' : ''}`} dir="rtl">
            {t.title}
          </p>

          <div className="flex flex-wrap gap-1 mt-0.5">
            <span className="text-[11px] font-bold px-1.5 py-[2px] rounded-[3px] bg-slate-100 text-[#5e6c84] uppercase">
              {t.status.replace('_', ' ')}
            </span>
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

          <div className="flex items-center justify-between mt-1 h-6">
            <div className="flex items-center gap-2">
              <div className="relative shrink-0 w-6 h-6">
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isDone ? 'opacity-0' : 'opacity-100'}`}>
                   <div className="scale-90">{PRIORITY_ICONS[t.urgency]}</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleTaskDone(t.id, isDone)
                  }}
                  className={`absolute inset-0 w-full h-full rounded-[4px] border flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-white/40 border-slate-300/60 shadow-sm opacity-0 active:opacity-100'
                  }`}
                  aria-label={isDone ? 'Mark as open' : 'Mark as done'}
                >
                  {isDone && (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>

              {!!t.body?.trim() && (
                <div className="text-[#5e6c84] flex items-center justify-center">
                  <svg className="w-[15px] h-[15px] opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h8" />
                  </svg>
                </div>
              )}

              {dueMeta && (
                <div
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
                <span className="text-[12px] text-[#5e6c84] font-medium truncate max-w-[100px]" title="Provider">
                   • {t.provider.name}
                </span>
              )}
            </div>

            <div className="flex items-center shrink-0">
              {t.assignee ? (
                <div className="w-6 h-6 rounded-full bg-[#0052cc] flex items-center justify-center text-[10px] font-bold text-white shadow-sm" title={t.assignee.name}>
                  {t.assignee.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-dashed border-[#dfe1e6] flex items-center justify-center bg-[#f4f5f7]">
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

  const filterActiveCount = (filterAssignee ? 1 : 0) + (filterLabel ? 1 : 0)

  if (!project) {
    return (
      <p className="text-center text-slate-500 py-16">
        <a href="/renovation" className="text-indigo-600 font-semibold">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-4 pb-28 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-900">Tasks</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Tap a task to edit status, dates, and more.</p>
        </div>
        <MobileFilterButton onClick={() => setFilterOpen(true)} activeCount={filterActiveCount} />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setStatusTab('all')}
          className={`shrink-0 h-10 px-4 rounded-full text-[13px] font-bold transition-colors ${
            statusTab === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
          }`}
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
              className={`shrink-0 h-10 px-4 rounded-full text-[13px] font-bold capitalize transition-colors ${
                statusTab === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {s.replace('_', ' ')} ({c})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
          <p className="text-[16px] font-bold text-slate-700">No tasks yet</p>
          <p className="text-[14px] text-slate-500 mt-1">Create your first task to get organized.</p>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="mt-5 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white text-[15px] font-bold w-full max-w-xs"
          >
            + Add task
          </button>
        </div>
      ) : listTasksFiltered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-10 text-center">
          <p className="text-[15px] font-semibold text-slate-600">No tasks in this column</p>
          <p className="text-[13px] text-slate-500 mt-1">Try another status or clear filters.</p>
        </div>
      ) : (
        <div className="space-y-2">{[...listTasksFiltered].sort(sortTasks).map(renderCard)}</div>
      )}

      <button
        type="button"
        onClick={() => setTaskModalOpen(true)}
        className="fixed z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.45)] transition-transform active:scale-95 right-4"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Add task"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <MobileBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div className="space-y-6 pb-4">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Assignee</p>
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
                  className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${
                    filterAssignee === m.id ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                  dir="auto"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Tag</p>
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
                  className={`min-h-[44px] px-4 rounded-xl text-[14px] font-semibold border ${
                    filterLabel === l.id ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-700'
                  }`}
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
            }}
            className="w-full min-h-[48px] rounded-xl border border-slate-200 text-[15px] font-bold text-slate-600"
          >
            Clear filters
          </button>
        </div>
      </MobileBottomSheet>

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
