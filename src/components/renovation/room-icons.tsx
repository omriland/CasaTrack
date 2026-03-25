'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Bath,
  BedDouble,
  BedSingle,
  ChefHat,
  Fence,
  Laptop,
  LayoutGrid,
  ShowerHead,
  Sofa,
  Toilet,
  WashingMachine,
  Warehouse,
  Wine,
} from 'lucide-react'

/** Keys stored in `renovation_rooms.room_icon_key` — keep in sync with DB + SQL comment. */
export const ROOM_ICON_KEYS = [
  'home_all',
  'living',
  'kitchen',
  'master',
  'kids',
  'desk',
  'bedroom',
  'shower',
  'bath',
  'balcony',
  'dining',
  'laundry',
  'storage',
  'wc',
] as const

export type RoomIconKey = (typeof ROOM_ICON_KEYS)[number]

export const DEFAULT_ROOM_ICON: RoomIconKey = 'home_all'

export const ROOM_ICON_OPTIONS: { key: RoomIconKey; label: string; hint: string }[] = [
  { key: 'home_all', label: 'Whole home', hint: 'Everything / floor plan' },
  { key: 'living', label: 'Living room', hint: 'Sofa & lounge' },
  { key: 'kitchen', label: 'Kitchen', hint: 'Cook & dine prep' },
  { key: 'dining', label: 'Dining', hint: 'Table & meals' },
  { key: 'master', label: 'Master suite', hint: 'Primary bedroom' },
  { key: 'bedroom', label: 'Bedroom', hint: 'Guest / spare' },
  { key: 'kids', label: "Kids' room", hint: 'Play & sleep' },
  { key: 'desk', label: 'Desk / office', hint: 'Work corner' },
  { key: 'shower', label: 'Shower', hint: 'Walk-in / stall' },
  { key: 'bath', label: 'Bath', hint: 'Tub room' },
  { key: 'wc', label: 'WC', hint: 'Powder / toilet' },
  { key: 'balcony', label: 'Balcony', hint: 'Outdoor space' },
  { key: 'laundry', label: 'Laundry', hint: 'Washer area' },
  { key: 'storage', label: 'Storage', hint: 'Closet / pantry' },
]

/** Map UI keys → Lucide icons (https://lucide.dev — MIT, already in the project). */
const ROOM_LUCIDE: Record<RoomIconKey, LucideIcon> = {
  home_all: LayoutGrid,
  living: Sofa,
  kitchen: ChefHat,
  dining: Wine,
  master: BedDouble,
  bedroom: BedSingle,
  kids: Baby,
  desk: Laptop,
  shower: ShowerHead,
  bath: Bath,
  wc: Toilet,
  balcony: Fence,
  laundry: WashingMachine,
  storage: Warehouse,
}

/** Tile tints — soft zone colors behind icons. */
export const ROOM_ICON_TILE: Record<RoomIconKey, string> = {
  home_all: 'bg-slate-100 text-slate-600',
  living: 'bg-amber-50 text-amber-700',
  kitchen: 'bg-orange-50 text-orange-700',
  dining: 'bg-rose-50 text-rose-700',
  master: 'bg-violet-50 text-violet-700',
  bedroom: 'bg-indigo-50 text-indigo-700',
  kids: 'bg-pink-50 text-pink-700',
  desk: 'bg-cyan-50 text-cyan-800',
  shower: 'bg-sky-50 text-sky-700',
  bath: 'bg-blue-50 text-blue-700',
  wc: 'bg-slate-100 text-slate-600',
  balcony: 'bg-emerald-50 text-emerald-700',
  laundry: 'bg-teal-50 text-teal-700',
  storage: 'bg-yellow-50 text-yellow-800',
}

export function normalizeRoomIconKey(raw: string | null | undefined): RoomIconKey {
  if (raw && ROOM_ICON_KEYS.includes(raw as RoomIconKey)) return raw as RoomIconKey
  return DEFAULT_ROOM_ICON
}

export function RoomIconGlyph({ roomKey, className }: { roomKey: RoomIconKey; className?: string }) {
  const Icon = ROOM_LUCIDE[roomKey]
  return <Icon className={className} strokeWidth={1.65} absoluteStrokeWidth aria-hidden />
}
