'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Armchair,
  Baby,
  Bath,
  Bed,
  BedDouble,
  Blinds,
  ChefHat,
  House,
  LampDesk,
  MonitorSmartphone,
  ShieldHalf,
  ShowerHead,
  Sun,
  Utensils,
} from 'lucide-react'

/** Keys stored in `renovation_rooms.room_icon_key` — keep in sync with DB + SQL comment. */
export const ROOM_ICON_KEYS = [
  'shield_half',
  'house',
  'bath',
  'shower_head',
  'sun',
  'bed_double',
  'lamp_desk',
  'monitor_smartphone',
  'bed',
  'blinds',
  'armchair',
  'chef_hat',
  'utensils',
  'baby',
] as const

export type RoomIconKey = (typeof ROOM_ICON_KEYS)[number]

export const DEFAULT_ROOM_ICON: RoomIconKey = 'house'

/** Map UI keys → Lucide icons (https://lucide.dev — MIT). */
const ROOM_LUCIDE: Record<RoomIconKey, LucideIcon> = {
  shield_half: ShieldHalf,
  house: House,
  bath: Bath,
  shower_head: ShowerHead,
  sun: Sun,
  bed_double: BedDouble,
  lamp_desk: LampDesk,
  monitor_smartphone: MonitorSmartphone,
  bed: Bed,
  blinds: Blinds,
  armchair: Armchair,
  chef_hat: ChefHat,
  utensils: Utensils,
  baby: Baby,
}

/** Tile tints — soft zone colors behind icons. */
export const ROOM_ICON_TILE: Record<RoomIconKey, string> = {
  shield_half: 'bg-slate-100 text-slate-700',
  house: 'bg-indigo-50 text-indigo-700',
  bath: 'bg-sky-50 text-sky-700',
  shower_head: 'bg-cyan-50 text-cyan-800',
  sun: 'bg-amber-50 text-amber-700',
  bed_double: 'bg-violet-50 text-violet-700',
  lamp_desk: 'bg-orange-50 text-orange-800',
  monitor_smartphone: 'bg-teal-50 text-teal-800',
  bed: 'bg-blue-50 text-blue-700',
  blinds: 'bg-stone-100 text-stone-700',
  armchair: 'bg-rose-50 text-rose-800',
  chef_hat: 'bg-lime-50 text-lime-900',
  utensils: 'bg-fuchsia-50 text-fuchsia-800',
  baby: 'bg-pink-50 text-pink-700',
}

export function normalizeRoomIconKey(raw: string | null | undefined): RoomIconKey {
  if (raw && ROOM_ICON_KEYS.includes(raw as RoomIconKey)) return raw as RoomIconKey
  return DEFAULT_ROOM_ICON
}

export function RoomIconGlyph({ roomKey, className }: { roomKey: RoomIconKey; className?: string }) {
  const Icon = ROOM_LUCIDE[roomKey]
  return <Icon className={className} strokeWidth={1.65} absoluteStrokeWidth aria-hidden />
}
