import type { CSSProperties } from 'react'
import { stringAvatarHue } from '@/lib/avatar-hue'

/** 1–2 letter initials for larger tiles (profile gate, sidebar, settings). */
export function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase()
  }
  const p = parts[0] || '?'
  return p.slice(0, 2).toUpperCase()
}

/** Single visible letter for very small (24px) chips — matches task cards. */
export function memberAvatarLetter(name: string): string {
  const t = name.trim()
  if (!t) return '?'
  return t[0]!.toLocaleUpperCase('en-US')
}

/** Large / soft surfaces: profile gate, sidebar profile, settings team rows. */
export function memberAvatarTileStyle(name: string): CSSProperties {
  const h = stringAvatarHue(name)
  return {
    backgroundColor: `hsl(${h} 58% 92%)`,
    color: `hsl(${h} 50% 28%)`,
  }
}

/** Small circles on cards and task drawer: solid fill + white text. */
export function memberAvatarChipStyle(name: string): CSSProperties {
  const h = stringAvatarHue(name)
  return {
    backgroundColor: `hsl(${h} 72% 46%)`,
    color: '#ffffff',
  }
}
