import type { RenovationTask, TaskStatus, TaskUrgency } from '@/types/renovation'

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
