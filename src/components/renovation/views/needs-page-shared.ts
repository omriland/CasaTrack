import type { RenovationNeed, RenovationRoom } from '@/types/renovation'

export type NeedsRoomGroup =
  | { kind: 'room'; roomId: string; name: string; needs: RenovationNeed[] }
  | { kind: 'unassigned'; needs: RenovationNeed[] }

/** Order: rooms by sort order, then needs without a room (or unknown room id). */
export function groupNeedsByRoom(items: RenovationNeed[], rooms: RenovationRoom[]): NeedsRoomGroup[] {
  const sortedRooms = [...rooms].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
  const validRoomIds = new Set(sortedRooms.map((r) => r.id))

  const byRoomId = new Map<string, RenovationNeed[]>()
  for (const r of sortedRooms) byRoomId.set(r.id, [])
  const unassigned: RenovationNeed[] = []

  for (const n of items) {
    if (n.room_id && validRoomIds.has(n.room_id)) {
      byRoomId.get(n.room_id)!.push(n)
    } else {
      unassigned.push(n)
    }
  }

  const groups: NeedsRoomGroup[] = []
  for (const r of sortedRooms) {
    const needs = byRoomId.get(r.id)!
    if (needs.length > 0) groups.push({ kind: 'room', roomId: r.id, name: r.name, needs })
  }
  if (unassigned.length > 0) groups.push({ kind: 'unassigned', needs: unassigned })
  return groups
}

/** Plain-text list for clipboard: room sections (when rooms exist) and `- title` lines, `(done)` for completed. */
export function formatNeedsAsCopyList(items: RenovationNeed[], rooms: RenovationRoom[]): string {
  if (items.length === 0) return ''
  const groups = groupNeedsByRoom(items, rooms)
  const blocks: string[] = []

  for (const group of groups) {
    const lines: string[] = []
    if (rooms.length > 0) {
      const heading = group.kind === 'room' ? group.name : 'No room'
      lines.push(heading)
    }
    for (const need of group.needs) {
      const t = need.title.trim()
      if (!t) continue
      lines.push(`- ${t}${need.completed ? ' (done)' : ''}`)
    }
    if (lines.length > 0) blocks.push(lines.join('\n'))
  }

  return blocks.join('\n\n')
}
