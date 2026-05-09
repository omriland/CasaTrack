'use client'

import './print.css'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Phone, Printer } from 'lucide-react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  buildOpenTasksPrintModel,
  filterTasksByProviderKeys,
  PRINT_NO_PROVIDER_KEY,
} from '@/lib/renovation-tasks-export'
import { formatDateDisplay } from '@/lib/renovation-format'
import { notesHasVisibleContent, notesToEditorHtml } from '@/lib/room-notes-html'
import { listProviders, listRooms, listSubtasksByProject, listTasks } from '@/lib/renovation'
import type { RenovationProvider, RenovationSubtask, RenovationTask } from '@/types/renovation'

function providerFilterSummary(selected: ReadonlySet<string>, providers: RenovationProvider[]): string {
  const nameById = new Map(providers.map((p) => [p.id, p.name]))
  const parts: string[] = []
  if (selected.has(PRINT_NO_PROVIDER_KEY)) parts.push('No provider')
  for (const id of selected) {
    if (id === PRINT_NO_PROVIDER_KEY) continue
    parts.push(nameById.get(id) ?? id)
  }
  return parts.join(', ')
}

function ProviderFilterMultiSelect({
  providers,
  selectedKeys,
  onToggle,
  onSelectAll,
  onClear,
}: {
  providers: RenovationProvider[]
  selectedKeys: ReadonlySet<string>
  onToggle: (key: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const sorted = useMemo(
    () =>
      [...providers].sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [providers],
  )

  const label = (() => {
    if (selectedKeys.size === 0) return 'All providers'
    if (selectedKeys.size === 1) {
      const k = [...selectedKeys][0]
      if (k === PRINT_NO_PROVIDER_KEY) return 'No provider'
      return providers.find((p) => p.id === k)?.name ?? '1 provider'
    }
    return `${selectedKeys.size} providers`
  })()

  const active = selectedKeys.size > 0
  const s = search.trim()
  const noLabel = 'ללא ספק · No provider'
  const noProviderVisible =
    s.length === 0 ||
    noLabel.toLowerCase().includes(s.toLowerCase()) ||
    noLabel.includes(s)
  const q = s.toLowerCase()
  const filteredProviders = q
    ? sorted.filter((p) => p.name.toLowerCase().includes(q))
    : sorted

  const optionRow = (key: string, name: ReactNode) => {
    const selected = selectedKeys.has(key)
    return (
      <button
        key={key}
        type="button"
        onClick={() => onToggle(key)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
          selected ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
            selected ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white'
          }`}
        >
          {selected && (
            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate" dir="auto">
          {name}
        </span>
      </button>
    )
  }

  return (
    <div className="relative min-w-0" ref={ref} dir="ltr" lang="en">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex w-full min-w-[200px] max-w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-left text-[13px] font-medium transition-colors sm:min-w-[220px] ${
          open || active
            ? 'border-slate-300 text-slate-900 shadow-sm'
            : 'border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-[200] w-[min(100vw-2rem,320px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-fade-in sm:min-w-[280px] sm:max-w-[min(100vw-2rem,360px)]"
          role="listbox"
        >
          <div className="border-b border-slate-100 p-1.5">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search providers…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[12px] text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200"
              autoComplete="off"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={onSelectAll}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={onClear}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-[min(50vh,280px)] overflow-y-auto py-1" dir="rtl">
            {noProviderVisible ? optionRow(PRINT_NO_PROVIDER_KEY, 'ללא ספק · No provider') : null}
            {filteredProviders.map((p) => optionRow(p.id, p.name))}
            {q && !noProviderVisible && filteredProviders.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-slate-500" dir="ltr">
                No matches
              </div>
            ) : null}
            {!q && providers.length === 0 ? (
              <p className="px-3 py-2 text-[11px] text-slate-500" dir="ltr">
                No saved providers. “No provider” still filters tasks with no provider.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

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
      {body && notesHasVisibleContent(body) ? (
        <div
          className="reno-task-body-html mt-2 break-words text-[13px] leading-relaxed text-slate-700"
          dir="auto"
          dangerouslySetInnerHTML={{ __html: notesToEditorHtml(body) }}
        />
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
  const [providers, setProviders] = useState<RenovationProvider[]>([])
  const [selectedProviderKeys, setSelectedProviderKeys] = useState<Set<string>>(() => new Set())
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
        const [t, st, r, prov] = await Promise.all([
          listTasks(project.id),
          listSubtasksByProject(project.id),
          listRooms(project.id),
          listProviders(project.id).catch(() => [] as RenovationProvider[]),
        ])
        if (!cancelled) {
          setTasks(t)
          setSubtasks(st)
          setRooms(r)
          setProviders(prov)
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

  const tasksForExport = useMemo(
    () => filterTasksByProviderKeys(tasks, selectedProviderKeys),
    [tasks, selectedProviderKeys],
  )

  const model = useMemo(
    () => buildOpenTasksPrintModel(tasksForExport, subtasks, rooms),
    [tasksForExport, subtasks, rooms],
  )

  const toggleProviderKey = (key: string) => {
    setSelectedProviderKeys((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  const selectAllProviderFilters = () => {
    setSelectedProviderKeys(
      new Set([PRINT_NO_PROVIDER_KEY, ...providers.map((p) => p.id)]),
    )
  }

  const clearProviderFilter = () => setSelectedProviderKeys(new Set())

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
  const hasActiveProviderFilter = selectedProviderKeys.size > 0

  return (
    <div
      className="reno-tasks-print-root mx-auto max-w-3xl px-4 py-6 sm:px-8"
      dir="rtl"
      lang="he"
    >
      <div className="reno-tasks-print-toolbar mb-6 space-y-4 border-b border-slate-200 pb-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="max-w-md rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 sm:px-4">
          <p className="mb-2 text-[12px] font-bold text-slate-600" dir="ltr" lang="en">
            Filter by provider
          </p>
          <p className="mb-2 text-[11px] text-slate-500" dir="ltr" lang="en">
            Leave as “All providers” to export every task, or open the menu and check specific providers. Clear
            selection there to reset to all.
          </p>
          <ProviderFilterMultiSelect
            providers={providers}
            selectedKeys={selectedProviderKeys}
            onToggle={toggleProviderKey}
            onSelectAll={selectAllProviderFilters}
            onClear={clearProviderFilter}
          />
        </div>
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
            {hasActiveProviderFilter ? (
              <p className="mt-1 text-[12px] text-slate-600" dir="ltr" lang="en">
                Filter: {providerFilterSummary(selectedProviderKeys, providers)}
              </p>
            ) : null}
          </header>

          {isEmpty ? (
            <p className="text-[15px] text-slate-600" dir="ltr" lang="en">
              {hasActiveProviderFilter
                ? 'No tasks match the selected providers (open & in progress only).'
                : 'No open or in-progress tasks to export.'}
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
