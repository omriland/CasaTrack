'use client'

import React, { useState, useEffect } from 'react'
import { updateTask } from '@/lib/renovation'
import type {
  RenovationTask,
  RenovationLabel,
  RenovationRoom,
  RenovationProvider,
} from '@/types/renovation'
import { PRIORITY_ICONS } from '@/components/renovation/TaskModal'
import { formatTaskDue } from '@/lib/renovation-format'

interface TaskDetailDrawerProps {
  task: RenovationTask
  labels: RenovationLabel[]
  rooms: RenovationRoom[]
  providers: RenovationProvider[]
  onClose: () => void
  onEdit: () => void
  onTaskChange?: (task: RenovationTask) => void
}

export function TaskDetailDrawer({
  task,
  labels,
  rooms,
  providers,
  onClose,
  onEdit,
  onTaskChange,
}: TaskDetailDrawerProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingBody, setEditingBody] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [bodyDraft, setBodyDraft] = useState(task.body || '')

  useEffect(() => {
    setTitleDraft(task.title)
    setBodyDraft(task.body || '')
  }, [task])

  const commitTitle = async () => {
    setEditingTitle(false)
    const t = titleDraft.trim()
    if (!t || t === task.title) {
      setTitleDraft(task.title)
      return
    }
    const updated = { ...task, title: t }
    onTaskChange?.(updated)
    updateTask(task.id, { title: t }).catch(() => onTaskChange?.(task))
  }

  const commitBody = async () => {
    setEditingBody(false)
    const b = bodyDraft.trim() || null
    if (b === task.body) {
      setBodyDraft(task.body || '')
      return
    }
    const updated = { ...task, body: b }
    onTaskChange?.(updated)
    updateTask(task.id, { body: b }).catch(() => onTaskChange?.(task))
  }

  const isDone = task.status === 'done'
  const dueMeta = task.due_date ? formatTaskDue(task.due_date, { isDone }) : null
  const room = task.room_id ? rooms.find((r) => r.id === task.room_id) : null
  const provider = task.provider_id ? providers.find((p) => p.id === task.provider_id) : null
  
  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none z-[200] transition-opacity animate-fade-in" 
        onClick={onClose} 
      />
      <div 
        className="fixed inset-y-0 right-0 z-[210] w-[100vw] md:w-[576px] lg:w-[720px] bg-white shadow-[-8px_0_24px_-12px_rgba(9,30,66,0.15)] flex flex-col transition-transform animate-slide-in-right"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500 uppercase tracking-widest">
            {task.id.slice(0, 8)}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-md text-[14px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors ml-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full flex flex-col md:flex-row min-h-0">
          <div className="w-full md:w-[65%] shrink-0 px-8 py-6 space-y-6">
            <div className="space-y-4">
              {editingTitle ? (
                <textarea
                  autoFocus
                  dir="rtl"
                  className="w-full text-right text-[24px] font-bold text-[#172b4d] leading-snug rounded px-2 py-1 outline-none resize-none bg-slate-100 shadow-inner"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitTitle() }
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(task.title) }
                  }}
                  rows={2}
                />
              ) : (
                <h1 
                  className="text-right text-[24px] font-bold text-[#172b4d] leading-snug break-words px-2 py-1 hover:bg-slate-50 cursor-text rounded transition-colors" 
                  dir="rtl"
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double click to edit"
                >
                  {task.title}
                </h1>
              )}
              <div className="flex flex-wrap gap-2 px-2">
                 <span className="text-[12px] font-bold px-2 py-1 rounded bg-[#dfe1e6] text-[#42526e] uppercase">
                   {task.status.replace('_', ' ')}
                 </span>
                 {room && (
                   <span className="text-[12px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">
                     {room.name}
                   </span>
                 )}
              </div>
            </div>

            <div>
              <h2 className="text-[14px] font-bold text-[#172b4d] mb-2 px-2">Description</h2>
              {editingBody ? (
                <div className="px-2">
                  <textarea
                    autoFocus
                    dir="rtl"
                    className="w-full text-right text-[14px] leading-relaxed text-[#172b4d] bg-slate-100 rounded-md outline-none p-3 resize-y min-h-[160px] shadow-inner"
                    value={bodyDraft}
                    onChange={(e) => setBodyDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setEditingBody(false); setBodyDraft(task.body || '') }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commitBody() }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2 flex-row-reverse">
                    <span className="text-[11px] text-slate-400 font-medium px-1" dir="rtl">טיפ: לחץ Cmd/Ctrl + Enter לשמירה</span>
                    <div className="flex justify-start gap-2 flex-row-reverse">
                      <button onClick={commitBody} className="px-3 py-1.5 rounded-md bg-[#0052cc] hover:bg-[#0047b3] text-white font-semibold text-[13px] transition-colors shadow-sm">Save</button>
                      <button onClick={() => { setEditingBody(false); setBodyDraft(task.body || '') }} className="px-3 py-1.5 rounded-md hover:bg-slate-100 font-semibold text-slate-600 text-[13px] transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
               ) : task.body ? (
                 <div 
                   className="text-[14px] text-right leading-relaxed text-[#172b4d] whitespace-pre-wrap hover:bg-slate-50 p-2 rounded-md cursor-text transition-colors" 
                   dir="rtl"
                   onDoubleClick={() => setEditingBody(true)}
                   title="Double click to edit"
                 >
                   {task.body}
                 </div>
              ) : (
                <div 
                  className="text-[14px] text-right text-slate-500 hover:bg-slate-50 cursor-pointer p-3 mx-2 rounded-md border border-dashed border-slate-300 transition-colors flex items-center gap-2 font-medium"
                  dir="rtl"
                  onDoubleClick={() => setEditingBody(true)}
                  onClick={() => setEditingBody(true)}
                  title="Double click to edit"
                >
                  <svg className="w-4 h-4 opacity-70 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Add a description...
                </div>
              )}
            </div>

            {task.label_ids && task.label_ids.length > 0 && (
              <div>
                <h2 className="text-[14px] font-bold text-[#172b4d] mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {(task.label_ids || []).map((lid) => {
                    const lb = labels.find((l) => l.id === lid)
                    if (!lb) return null
                    return (
                      <span
                        key={lid}
                        className="text-[13px] font-bold px-2.5 py-1 rounded-sm text-white shadow-sm"
                        style={{ backgroundColor: lb.color }}
                      >
                        {lb.name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-full md:w-[35%] shrink-0 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6">
            <div className="space-y-5">
              <h3 className="text-[12px] font-extrabold text-[#5e6c84] uppercase tracking-wider">Details</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Assignee</span>
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#0052cc] flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[14px] font-medium text-[#172b4d]">{task.assignee.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full border border-dashed border-[#dfe1e6] flex items-center justify-center bg-white"><svg className="w-4 h-4 text-[#a5adba]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                        <span className="text-[14px] text-slate-500 italic">Unassigned</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-[#5e6c84]">Priority</span>
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[#172b4d] capitalize">
                    {PRIORITY_ICONS[task.urgency]}
                    {task.urgency}
                  </div>
                </div>

                {dueMeta && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Due Date</span>
                    <span className={`text-[14px] font-bold ${
                      dueMeta.tone === 'overdue' ? 'text-rose-600' : 
                      dueMeta.tone === 'soon' ? 'text-amber-600' : 'text-[#172b4d]'
                    }`}>
                      {dueMeta.label}
                    </span>
                  </div>
                )}

                {provider && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Provider</span>
                    <span className="text-[14px] font-medium text-[#172b4d]">{provider.name}</span>
                  </div>
                )}
                
                {task.created_by && (
                  <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-200 mt-2">
                    <span className="text-[13px] font-semibold text-[#5e6c84]">Reporter</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {task.created_by.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[14px] font-medium text-[#172b4d]">{task.created_by.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
