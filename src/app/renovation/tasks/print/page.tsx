'use client'

import './print.css'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { buildOpenTasksPrintModel } from '@/lib/renovation-tasks-export'
import { formatDateDisplay } from '@/lib/renovation-format'
import { listRooms, listSubtasksByProject, listTasks } from '@/lib/renovation'
import type { RenovationSubtask, RenovationTask } from '@/types/renovation'

function TaskPrintBlock({
  title,
  body,
  dueDate,
  status,
  subtasks,
}: {
  title: string
  body: string | null
  dueDate: string | null
  status: string
  subtasks: RenovationSubtask[]
}) {
  return (
    <article className="reno-tasks-print-task mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <h3 className="text-[15px] font-bold leading-snug text-slate-900" dir="auto">
        {title}
      </h3>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500" dir="ltr">
        <span>
          {status === 'in_progress' ? 'In progress' : 'Open'}
          {dueDate ? ` · Due ${formatDateDisplay(dueDate)}` : ''}
        </span>
      </div>
      {body?.trim() ? (
        <p
          className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700"
          dir="auto"
        >
          {body.trim()}
        </p>
      ) : null}
      {subtasks.length > 0 ? (
        <ul className="mt-3 list-none space-y-1.5 border-t border-slate-100 pt-3">
          {subtasks.map((st) => (
            <li key={st.id} className="flex items-start gap-2 text-[13px] text-slate-800" dir="auto">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
              <span>{st.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export default function TasksPrintPage() {
  const { project } = useRenovation()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [subtasks, setSubtasks] = useState<RenovationSubtask[]>([])
  const [rooms, setRooms] = useState<Awaited<ReturnType<typeof listRooms>>>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const [t, st, r] = await Promise.all([
          listTasks(project.id),
          listSubtasksByProject(project.id),
          listRooms(project.id),
        ])
        if (!cancelled) {
          setTasks(t)
          setSubtasks(st)
          setRooms(r)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [project])

  const model = useMemo(() => buildOpenTasksPrintModel(tasks, subtasks, rooms), [tasks, subtasks, rooms])

  const generatedAt = useMemo(() => {
    return new Date().toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  if (!project) {
    return (
      <div className="py-16 text-center text-slate-500">
        <Link href="/renovation" className="font-semibold text-indigo-600">
          Create a project first
        </Link>
      </div>
    )
  }

  const isEmpty = model.unassigned.length === 0 && model.byRoom.length === 0

  return (
    <div
      className="reno-tasks-print-root mx-auto max-w-3xl px-4 py-6 sm:px-8"
      dir="rtl"
      lang="he"
    >
      <div className="reno-tasks-print-toolbar mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/renovation/tasks"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" strokeWidth={2} />
            Print / Save as PDF
          </button>
        </div>
        <p className="text-[12px] text-slate-500" dir="ltr" lang="en">
          Use your browser’s print dialog → Save as PDF
        </p>
      </div>

      {loading ? (
        <p className="text-slate-500" dir="ltr" lang="en">
          Loading…
        </p>
      ) : loadError ? (
        <p className="text-red-600" dir="ltr">
          {loadError}
        </p>
      ) : (
        <>
          <header className="mb-8 border-b border-slate-200 pb-6">
            <h1 className="text-[22px] font-bold text-slate-900">{project.name}</h1>
            {project.address_text ? (
              <p className="mt-1 text-[14px] text-slate-600" dir="auto">
                {project.address_text}
              </p>
            ) : null}
            <p className="mt-3 text-[12px] text-slate-500" dir="ltr" lang="en">
              Open & In progress only · Incomplete subtasks only · {generatedAt}
            </p>
          </header>

          {isEmpty ? (
            <p className="text-[15px] text-slate-600" dir="ltr" lang="en">
              No open or in-progress tasks to export.
            </p>
          ) : (
            <>
              {model.unassigned.length > 0 ? (
                <section className="reno-tasks-print-section-unassigned" aria-label="No room">
                  <h2 className="mb-4 text-[16px] font-bold text-slate-900">ללא חדר · No room</h2>
                  {model.unassigned.map(({ task, openSubtasks }) => (
                    <TaskPrintBlock
                      key={task.id}
                      title={task.title}
                      body={task.body}
                      dueDate={task.due_date}
                      status={task.status}
                      subtasks={openSubtasks}
                    />
                  ))}
                </section>
              ) : null}

              {model.byRoom.map(({ room, tasks: roomTasks }, idx) => (
                <section
                  key={room.id}
                  className={model.unassigned.length === 0 && idx === 0 ? 'mt-0' : 'mt-8'}
                >
                  <h2 className="mb-4 text-[16px] font-bold text-slate-900" dir="auto">
                    {room.name}
                  </h2>
                  {roomTasks.map(({ task, openSubtasks }) => (
                    <TaskPrintBlock
                      key={task.id}
                      title={task.title}
                      body={task.body}
                      dueDate={task.due_date}
                      status={task.status}
                      subtasks={openSubtasks}
                    />
                  ))}
                </section>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
