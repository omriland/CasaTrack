'use client'

import { useState } from 'react'
import { TaskModal, PRIORITY_ICONS } from '@/components/renovation/TaskModal'
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
    filteredTasks,
  } = useTasksPageState()

  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const listTasksFiltered = filteredTasks.filter((t) => (statusTab === 'all' ? true : t.status === statusTab))

  const renderCard = (t: RenovationTask) => {
    const isDone = t.status === 'done'
    const dueMeta = t.due_date ? formatTaskDue(t.due_date, { isDone }) : null
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => openEdit(t)}
        className={`w-full text-left bg-white rounded-2xl border border-slate-200/80 p-4 transition-all shadow-sm active:scale-[0.99] ${isDone ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <div className="flex gap-3 items-start">
          <div className={`shrink-0 mt-0.5 ${isDone ? 'opacity-40 grayscale' : ''}`}>{PRIORITY_ICONS[t.urgency]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                {t.status.replace('_', ' ')}
              </span>
              {t.room && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 truncate max-w-[120px]">
                  {t.room.name}
                </span>
              )}
            </div>
            <p className={`text-[16px] font-bold leading-snug text-slate-900 ${isDone ? 'line-through text-slate-500' : ''}`} dir="auto">
              {t.title}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {(t.label_ids || []).map((lid) => {
                const lb = labels.find((l: RenovationLabel) => l.id === lid)
                return lb ? (
                  <span
                    key={lid}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: lb.color }}
                  >
                    {lb.name}
                  </span>
                ) : null
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {t.assignee && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">{t.assignee.name.split(' ')[0]}</span>
              )}
              {dueMeta && (
                <span
                  className={`text-[11px] font-bold tabular-nums px-2 py-1 rounded-lg ${
                    dueMeta.tone === 'overdue'
                      ? 'bg-rose-50 text-rose-700'
                      : dueMeta.tone === 'soon'
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {dueMeta.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
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
        <div className="space-y-3">{[...listTasksFiltered].sort(sortTasks).map(renderCard)}</div>
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
    </div>
  )
}
