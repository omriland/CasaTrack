import type { RenovationRoom, RenovationSubtask, RenovationTask, TaskUrgency } from '@/types/renovation'

const URGENCY_WEIGHT: Record<TaskUrgency, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function sortOpenTasksForExport(a: RenovationTask, b: RenovationTask): number {
  if (a.due_date && b.due_date) {
    if (a.due_date < b.due_date) return -1
    if (a.due_date > b.due_date) return 1
  }
  if (a.due_date && !b.due_date) return -1
  if (!a.due_date && b.due_date) return 1

  const aw = URGENCY_WEIGHT[a.urgency] || 0
  const bw = URGENCY_WEIGHT[b.urgency] || 0
  if (aw !== bw) return bw - aw

  return a.title.localeCompare(b.title)
}

function sortSubtasksForExport(a: RenovationSubtask, b: RenovationSubtask): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return a.created_at.localeCompare(b.created_at)
}

const ACTIVE = new Set<RenovationTask['status']>(['open', 'in_progress'])

function isOpenOrInProgress(t: RenovationTask): boolean {
  return ACTIVE.has(t.status)
}

export type TaskWithOpenSubtasks = {
  task: RenovationTask
  openSubtasks: RenovationSubtask[]
}

export type OpenTasksPrintModel = {
  unassigned: TaskWithOpenSubtasks[]
  byRoom: { room: RenovationRoom; tasks: TaskWithOpenSubtasks[] }[]
}

/**
 * Shapes open / in_progress tasks for print: unassigned (no room) first, then per room by task.room_id.
 * Incomplete subtasks only, nested under parent. Subtask.room_id is ignored for grouping.
 */
export function buildOpenTasksPrintModel(
  tasks: RenovationTask[],
  subtasks: RenovationSubtask[],
  rooms: RenovationRoom[],
): OpenTasksPrintModel {
  const activeTasks = tasks.filter(isOpenOrInProgress)
  const byTaskId = new Map<string, RenovationSubtask[]>()
  for (const st of subtasks) {
    if (st.is_done) continue
    const list = byTaskId.get(st.task_id) ?? []
    list.push(st)
    byTaskId.set(st.task_id, list)
  }
  for (const list of byTaskId.values()) {
    list.sort(sortSubtasksForExport)
  }

  const wrap = (t: RenovationTask): TaskWithOpenSubtasks => ({
    task: t,
    openSubtasks: byTaskId.get(t.id) ?? [],
  })

  const unassigned = activeTasks
    .filter((t) => t.room_id == null)
    .sort(sortOpenTasksForExport)
    .map(wrap)

  const sortedRooms = [...rooms].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )

  const byRoom: OpenTasksPrintModel['byRoom'] = []
  for (const room of sortedRooms) {
    const roomTasks = activeTasks
      .filter((t) => t.room_id === room.id)
      .sort(sortOpenTasksForExport)
      .map(wrap)
    if (roomTasks.length === 0) continue
    byRoom.push({ room, tasks: roomTasks })
  }

  return { unassigned, byRoom }
}
