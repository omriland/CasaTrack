import type { RenovationLabel, RenovationTask, TaskStatus, TaskUrgency } from '@/types/renovation'

export const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']

export const URGENCY_WEIGHT: Record<TaskUrgency, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function sortTasks(a: RenovationTask, b: RenovationTask) {
  if (a.status === 'done' && b.status !== 'done') return 1
  if (a.status !== 'done' && b.status === 'done') return -1

  const aw = URGENCY_WEIGHT[a.urgency] || 0
  const bw = URGENCY_WEIGHT[b.urgency] || 0
  if (aw !== bw) return bw - aw

  if (a.due_date && b.due_date) {
    if (a.due_date < b.due_date) return -1
    if (a.due_date > b.due_date) return 1
  }
  if (a.due_date && !b.due_date) return -1
  if (!a.due_date && b.due_date) return 1

  return 0
}

/** Swimlanes for Epic view: labels act as epics; first lane is unlabeled tasks. Label lanes with only `done` tasks are omitted. */
export type EpicSwimlane = {
  id: 'none' | string
  title: string
  color: string | null
  tasks: RenovationTask[]
}

export function buildEpicSwimlanes(tasks: RenovationTask[], labels: RenovationLabel[]): EpicSwimlane[] {
  const sortedLabels = [...labels].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
  )
  const noLabelTasks = tasks.filter((t) => !t.label_ids?.length).sort(sortTasks)
  const lanes: EpicSwimlane[] = [
    { id: 'none', title: 'No labels', color: null, tasks: noLabelTasks },
  ]
  for (const lb of sortedLabels) {
    const laneTasks = tasks.filter((t) => t.label_ids?.includes(lb.id)).sort(sortTasks)
    if (laneTasks.length === 0) continue
    if (laneTasks.every((t) => t.status === 'done')) continue
    lanes.push({ id: lb.id, title: lb.name, color: lb.color, tasks: laneTasks })
  }
  return lanes
}
