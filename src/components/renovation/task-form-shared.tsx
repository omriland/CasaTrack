import React from 'react'
import type { TaskStatus, TaskUrgency } from '@/types/renovation'

export const STATUSES: TaskStatus[] = ['open', 'in_progress', 'blocked', 'done']
export const URGENCY: TaskUrgency[] = ['low', 'medium', 'high', 'critical']

export const PRIORITY_ICONS: Record<TaskUrgency, React.ReactNode> = {
  critical: (
    <svg className="h-[14px] w-[14px] text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11l8-8 8 8M4 19l8-8 8 8" />
    </svg>
  ),
  high: (
    <svg className="h-[14px] w-[14px] text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15l8-8 8 8" />
    </svg>
  ),
  medium: (
    <svg className="h-[14px] w-[14px] text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16M4 15h16" />
    </svg>
  ),
  low: (
    <svg className="h-[14px] w-[14px] text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 9l8 8 8-8" />
    </svg>
  ),
}

export function addDaysToIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function formatStatusLabel(s: TaskStatus) {
  return s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export function formatUrgencyLabel(u: TaskUrgency) {
  return u.replace(/\b\w/g, (l) => l.toUpperCase())
}
