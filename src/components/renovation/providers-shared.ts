import type { RenovationProvider } from '@/types/renovation'
import { stringAvatarHue } from '@/lib/avatar-hue'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase()
  const p = parts[0] || '?'
  return p.slice(0, 2).toUpperCase()
}

export function sectionKey(name: string): string {
  const t = name.trim()
  if (!t) return '#'
  const c = t[0]!.toLocaleUpperCase('en-US')
  if (/[A-Z]/.test(c)) return c
  if (/[0-9]/.test(c)) return '#'
  return c
}

export function sortSectionKeys(a: string, b: string) {
  if (a === '#') return 1
  if (b === '#') return -1
  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

export function matchesQuery(p: RenovationProvider, q: string): boolean {
  if (!q.trim()) return true
  const n = q.trim().toLowerCase()
  const hay = [p.name, p.description, p.phone, p.email, p.additional_info]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(n)
}

export function avatarTint(name: string): string {
  const h = stringAvatarHue(name)
  return `hsl(${h} 55% 92%)`
}

export function avatarTextColor(name: string): string {
  const h = stringAvatarHue(name)
  return `hsl(${h} 45% 32%)`
}
