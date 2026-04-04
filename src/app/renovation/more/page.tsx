'use client'

import Link from 'next/link'
import { useRenovationMobile } from '@/components/renovation/RenovationViewportContext'
import {
  CalendarIcon,
  ProvidersIcon,
  FilesIcon,
  NeedsIcon,
  RoomIcon,
  GearIcon,
} from '@/components/renovation/RenovationMobileShell'

const sections = [
  { href: '/renovation/calendar', label: 'Calendar', description: 'Events & schedule', icon: CalendarIcon },
  { href: '/renovation/providers', label: 'Providers', description: 'Contacts & contractors', icon: ProvidersIcon },
  { href: '/renovation/files', label: 'Files', description: 'Documents & uploads', icon: FilesIcon },
  { href: '/renovation/needs', label: 'Needs', description: 'Shopping list', icon: NeedsIcon },
  { href: '/renovation/rooms', label: 'Rooms', description: 'Spaces & areas', icon: RoomIcon },
  { href: '/renovation/settings', label: 'Settings', description: 'Project settings', icon: GearIcon },
  { href: '/', label: 'Property Hunt', description: 'Back to properties', icon: BackIcon },
]

export default function MorePage() {
  const isMobile = useRenovationMobile()

  if (!isMobile) {
    return null
  }

  return (
    <div className="animate-fade-in pb-8">
      <h1 className="text-[24px] font-bold tracking-tight text-slate-900 mb-6">More</h1>
      <div className="space-y-2">
        {sections.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 min-h-[64px] px-4 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-sm transition-colors active:bg-slate-50"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-slate-900">{item.label}</p>
                <p className="text-[14px] text-slate-500">{item.description}</p>
              </div>
              <svg className="h-5 w-5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}
