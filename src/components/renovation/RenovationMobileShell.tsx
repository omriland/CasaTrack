'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useState, type ReactNode } from 'react'
import { useRenovation } from './RenovationContext'
import { memberAvatarTileStyle, memberInitials } from '@/lib/member-avatar'
import { MobileBottomSheet } from './mobile/MobileBottomSheet'

const primaryNav = [
  { href: '/renovation', label: 'Home', icon: HomeIcon, match: (p: string) => p === '/renovation' },
  { href: '/renovation/expenses', label: 'Spend', icon: CardIcon, match: (p: string) => p.startsWith('/renovation/expenses') },
  { href: '/renovation/tasks', label: 'Tasks', icon: CheckIcon, match: (p: string) => p.startsWith('/renovation/tasks') },
  { href: '/renovation/gallery', label: 'Photos', icon: PhotoIcon, match: (p: string) => p.startsWith('/renovation/gallery') },
] as const

const moreNav = [
  { href: '/renovation/providers', label: 'Providers', icon: ProvidersIcon },
  { href: '/renovation/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/renovation/files', label: 'Files', icon: FilesIcon },
  { href: '/renovation/needs', label: 'Needs', icon: NeedsIcon },
  { href: '/renovation/rooms', label: 'Rooms', icon: RoomIcon },
  { href: '/renovation/settings', label: 'Settings', icon: GearIcon },
] as const

function moreMatches(pathname: string) {
  return moreNav.some((item) => pathname.startsWith(item.href))
}

export function RenovationMobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { project, activeProfile, teamMembers, openProfilePicker } = useRenovation()
  const [moreOpen, setMoreOpen] = useState(false)
  const closeMore = useCallback(() => setMoreOpen(false), [])

  const currentPrimary = primaryNav.find((item) => item.match(pathname))
  const currentMore = moreNav.find((item) => pathname.startsWith(item.href))
  const activeTabName = currentPrimary?.label || currentMore?.label || project?.name || 'Renovation'

  return (
    <div className="reno-app flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#f0f2f6] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="z-30 shrink-0 border-b border-black/[0.08] bg-white/85 backdrop-blur-[32px] saturate-[1.8] pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 px-1 transition-all">
        <div className="mx-auto flex max-w-lg items-center justify-between min-h-[44px] relative">
          
          {/* Left: Back Button */}
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-400 active:text-black transition-colors"
            aria-label="Back to Property Hunt"
          >
            <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Center: Title (Absolutely centered) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <h1 className="truncate text-[17px] font-semibold tracking-[-0.4px] text-black">
              {activeTabName}
            </h1>
          </div>

          {/* Right: Profile Avatar or Empty Slot */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            {project && activeProfile && teamMembers.length > 0 && (
              <button
                type="button"
                onClick={openProfilePicker}
                className="grid h-[30px] w-[30px] place-items-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-transform active:scale-90"
                style={memberAvatarTileStyle(activeProfile.name)}
                aria-label="Switch profile"
              >
                <span className="text-[11px] font-bold leading-none tabular-nums opacity-90">
                  {memberInitials(activeProfile.name)}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="reno-mobile-main min-h-0 flex-1 w-full max-w-lg mx-auto overflow-y-auto overscroll-y-contain px-3 pt-3 animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* Native-style tab bar — full width, heavily blurred, Apple grayscale style */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/50 bg-white/85 backdrop-blur-2xl saturate-150 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-between">
          {primaryNav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={`group flex flex-[1_1_20%] flex-col items-center justify-center gap-[4px] transition-colors ${
                  active ? 'text-black' : 'text-[#999999] active:text-[#666666]'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`h-[26px] w-[26px] transition-transform duration-200 ${active ? 'scale-105' : 'scale-100 group-active:scale-95'}`} active={active} />
                </div>
                <span className={`text-[10px] tracking-tight transition-all duration-200 ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`group flex flex-[1_1_20%] flex-col items-center justify-center gap-[4px] transition-colors ${
              moreMatches(pathname) ? 'text-black' : 'text-[#999999] active:text-[#666666]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MoreIcon className={`h-[26px] w-[26px] transition-transform duration-200 ${moreMatches(pathname) ? 'scale-105' : 'scale-100 group-active:scale-95'}`} active={moreMatches(pathname)} />
            </div>
            <span className={`text-[10px] tracking-tight transition-all duration-200 ${moreMatches(pathname) ? 'font-semibold' : 'font-medium'}`}>More</span>
          </button>
        </div>
      </nav>

      <MobileBottomSheet open={moreOpen} onClose={closeMore} title="More">
        <div className="space-y-1 pb-[env(safe-area-inset-bottom)]">
          {moreNav.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMore}
                className={`flex items-center gap-4 min-h-[52px] px-4 rounded-2xl transition-colors ${
                  active ? 'bg-slate-100/80 text-black' : 'text-slate-700 active:bg-slate-100/50'
                }`}
              >
                <div className={`p-2 rounded-xl ${active ? 'bg-white shadow-sm text-black' : 'bg-slate-100/80 text-slate-500'}`}>
                  <Icon className="w-5 h-5" active={active} />
                </div>
                <span className="text-[16px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </MobileBottomSheet>
    </div>
  )
}

function MoreIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
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
