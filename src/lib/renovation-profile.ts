/** Per-project team member id stored when user picks "who is using" the renovation app. */
export function renovationProfileStorageKey(projectId: string): string {
  return `reno-profile:${projectId}`
}

export function getStoredProfileMemberId(projectId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(renovationProfileStorageKey(projectId))
    return v && v.length > 0 ? v : null
  } catch {
    return null
  }
}

export function setStoredProfileMemberId(projectId: string, memberId: string): void {
  try {
    localStorage.setItem(renovationProfileStorageKey(projectId), memberId)
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredProfileMemberId(projectId: string): void {
  try {
    localStorage.removeItem(renovationProfileStorageKey(projectId))
  } catch {
    /* ignore */
  }
}

/** First token of name for greetings */
export function profileFirstName(fullName: string): string {
  const p = fullName.trim().split(/\s+/)[0]
  return p || fullName.trim() || 'there'
}

export type TimeGreetingKey = 'morning' | 'afternoon' | 'evening' | 'night'

export function timeOfDayGreeting(date = new Date()): { label: string; key: TimeGreetingKey } {
  const h = date.getHours()
  if (h >= 5 && h < 12) return { label: 'Good morning', key: 'morning' }
  if (h >= 12 && h < 17) return { label: 'Good afternoon', key: 'afternoon' }
  if (h >= 17 && h < 22) return { label: 'Good evening', key: 'evening' }
  return { label: 'Good night', key: 'night' }
}

/** First-name match (Latin, accent-stripped) for who may see vendor budget UI and project budget totals in Settings. */
const BUDGET_ACCESS_FIRST_NAMES = new Set(['omri', 'tamar'])

/** Hebrew given name for Tamar — matches when the stored first token is exactly this. */
const BUDGET_ACCESS_FIRST_NAMES_HEBREW = new Set(['תמר'])

/** Hardcoded: these first names get Spanish greetings on the renovation overview */
const SPANISH_GREETING_FIRST_NAMES = new Set(['tamar', 'rinat'])

export function profileUsesSpanishGreeting(fullName: string | null | undefined): boolean {
  if (!fullName?.trim()) return false
  const first = profileFirstName(fullName)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return SPANISH_GREETING_FIRST_NAMES.has(first)
}

/**
 * Vendor budget page, overview budget widget, and **Budget Totals** in Settings (first name).
 * **Budget by Category** (including room links) is visible to every profile with a project.
 */
export function profileCanViewBudget(fullName: string | null | undefined): boolean {
  if (!fullName?.trim()) return false
  const rawFirst = profileFirstName(fullName).trim()
  if (BUDGET_ACCESS_FIRST_NAMES_HEBREW.has(rawFirst)) return true
  const ascii = rawFirst
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return BUDGET_ACCESS_FIRST_NAMES.has(ascii)
}

const SPANISH_BY_SLOT: Record<TimeGreetingKey, string> = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas tardes',
  night: 'Buenas noches',
}

/** Time-of-day greeting in English, or Spanish for Tamar / Rinat (first name match, case-insensitive). */
export function timeGreetingForProfile(
  activeProfileFullName: string | null | undefined,
  date = new Date()
): { label: string; key: TimeGreetingKey } {
  const slot = timeOfDayGreeting(date)
  if (!profileUsesSpanishGreeting(activeProfileFullName)) return slot
  return { label: SPANISH_BY_SLOT[slot.key], key: slot.key }
}
