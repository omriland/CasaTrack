'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useRenovation } from './RenovationContext'
import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'

const nav = [
  { href: '/renovation', label: 'Overview', icon: HomeIcon, match: (p: string) => p === '/renovation' },
  { href: '/renovation/budget', label: 'Budget', icon: WalletIcon, match: (p: string) => p.startsWith('/renovation/budget') },
  { href: '/renovation/tasks', label: 'Tasks', icon: CheckIcon, match: (p: string) => p.startsWith('/renovation/tasks') },
  { href: '/renovation/calendar', label: 'Calendar', icon: CalendarIcon, match: (p: string) => p.startsWith('/renovation/calendar') },
  { href: '/renovation/providers', label: 'Providers', icon: ProvidersIcon, match: (p: string) => p.startsWith('/renovation/providers') },
  { href: '/renovation/gallery', label: 'Photos', icon: PhotoIcon, match: (p: string) => p.startsWith('/renovation/gallery') },
  { href: '/renovation/files', label: 'Files', icon: FilesIcon, match: (p: string) => p.startsWith('/renovation/files') },
  { href: '/renovation/needs', label: 'Needs', icon: NeedsIcon, match: (p: string) => p.startsWith('/renovation/needs') },
  { href: '/renovation/rooms', label: 'Rooms', icon: RoomIcon, match: (p: string) => p.startsWith('/renovation/rooms') },
  { href: '/renovation/settings', label: 'Settings', icon: GearIcon, match: (p: string) => p.startsWith('/renovation/settings') },
]

export function RenovationDesktopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { project, activeProfile, teamMembers, openProfilePicker } = useRenovation()

  return (
    <div className="reno-app min-h-screen bg-slate-50/50 text-slate-900 pb-0 pl-60 flex selection:bg-indigo-100 selection:text-indigo-900">
      <aside className="flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white/70 backdrop-blur-3xl border-r border-slate-200/60 pt-safe z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-white to-transparent">
          <Link href="/" className="group inline-flex items-center text-[13px] font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Property Hunt
          </Link>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Renovation</h1>
              <p className="text-[13px] font-medium text-slate-500 mt-1 line-clamp-1">{project?.name || 'Project Hub'}</p>
            </div>
            {project && (
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" title="Active Project"></div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-2 scrollbar-hide min-h-0">
          {nav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 px-3.5 py-2.5 rounded text-[15px] font-medium transition-all duration-300 relative overflow-hidden ${
                  active
                    ? 'text-indigo-700 bg-indigo-50/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(79,70,229,0.05)] ring-1 ring-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-r-full" />}
                <div className={`p-1.5 rounded transition-colors ${active ? 'bg-indigo-600/10 text-indigo-600' : 'bg-slate-100 group-hover:bg-white text-slate-400 group-hover:text-slate-600 shadow-sm'}`}>
                  <Icon className="w-5 h-5" active={active} />
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {project && activeProfile && teamMembers.length > 0 && (
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-slate-200/80 bg-white/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Profile</p>
            <button
              type="button"
              onClick={openProfilePicker}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group"
            >
              <MemberAvatarTile
                name={activeProfile.name}
                className="h-9 w-9 shrink-0 rounded-lg text-[11px] font-extrabold shadow-inner"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-800 truncate" dir="auto">
                  {activeProfile.name}
                </p>
                <p className="text-[11px] font-semibold text-indigo-600 group-hover:text-indigo-500">Switch profile</p>
              </div>
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-safe mt-12 pt-6 pb-12 min-h-screen animate-fade-in">
        {children}
      </main>
    </div>
  )
}

function HomeIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function CardIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function WalletIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8zm0-4a2 2 0 012-2h11l5 5v1H3V6z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14h.01" />
    </svg>
  )
}
function CheckIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}
function CalendarIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
function ProvidersIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}
function PhotoIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function FilesIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
function NeedsIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}
function RoomIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}
function GearIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
