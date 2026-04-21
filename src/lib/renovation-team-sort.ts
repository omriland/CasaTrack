import type { RenovationTeamMember } from '@/types/renovation'

/** Stable sort: team sort_order, then name. */
export function sortTeamMembersDefault(members: RenovationTeamMember[]): RenovationTeamMember[] {
  return [...members].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

/** Workspace profile first (when set), then default order for everyone else. */
export function sortTeamMembersForAssigneePicker(
  members: RenovationTeamMember[],
  activeProfile: RenovationTeamMember | null,
): RenovationTeamMember[] {
  const sorted = sortTeamMembersDefault(members)
  if (!activeProfile) return sorted
  const idx = sorted.findIndex((m) => m.id === activeProfile.id)
  if (idx <= 0) return sorted
  const next = [...sorted]
  const [me] = next.splice(idx, 1)
  return [me, ...next]
}
