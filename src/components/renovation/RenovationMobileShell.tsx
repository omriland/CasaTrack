'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { profileCanViewBudget } from '@/lib/renovation-profile'
import { useRenovation } from './RenovationContext'
import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'
import { cn } from '@/utils/common'

const primaryNav = [
  { href: '/renovation', label: 'Home', icon: HomeIcon, match: (p: string) => p === '/renovation' },
  { href: '/renovation/tasks', label: 'Tasks', icon: CheckIcon, match: (p: string) => p.startsWith('/renovation/tasks') },
  { href: '/renovation/budget', label: 'Budget', icon: WalletIcon, match: (p: string) => p.startsWith('/renovation/budget') },
  { href: '/renovation/gallery', label: 'Photos', icon: PhotoIcon, match: (p: string) => p.startsWith('/renovation/gallery') },
  { href: '/renovation/more', label: 'More', icon: MoreIcon, match: (p: string) => p === '/renovation/more' || moreMatches(p) },
] as const

const moreRoutes = [
  '/renovation/providers',
  '/renovation/calendar',
  '/renovation/files',
  '/renovation/needs',
  '/renovation/rooms',
  '/renovation/settings',
]

function moreMatches(pathname: string) {
  return moreRoutes.some((r) => pathname.startsWith(r))
}

export function RenovationMobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { project, activeProfile, teamMembers, openProfilePicker } = useRenovation()

  if (pathname === '/renovation/tasks/print') {
    return (
      <div className="reno-app min-h-dvh min-h-0 w-full overflow-y-auto bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </div>
    )
  }

  return (
    <div className="reno-app flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-[#f5f6f8] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/*
        Header and bottom nav are real flex children (NOT position:fixed). This guarantees
        `main` sits exactly between them and content can never render behind the nav on any
        page, regardless of the page's own bottom padding. It also keeps the nav a distinct
        tap region so taps are not captured by the scrolling `main` container.
      */}
      <header className="relative z-50 shrink-0 border-b border-slate-200/60 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-xl pt-[max(0.5rem,env(safe-area-inset-top))] pb-2.5">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 min-h-[48px]">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[18px] font-bold leading-tight text-slate-900">{project?.name || 'Renovation'}</h1>
          </div>
          {project && activeProfile && teamMembers.length > 0 && (
            <button
              type="button"
              onClick={openProfilePicker}
              className="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm transition-transform active:scale-95"
              aria-label="Switch profile"
            >
              <MemberAvatarTile
                name={activeProfile.name}
                className="h-full w-full min-h-0 min-w-0 rounded-2xl text-[13px] font-extrabold"
              />
            </button>
          )}
        </div>
      </header>

      {/*
        No `z-index` on main: any explicit z-index on a positioned element creates a new
        stacking context that traps descendants' own z-indexes (e.g. `z-[210]` on the
        task/expense/vendor drawers) beneath its own level, which meant fixed drawers were
        painted BEHIND the shell header/nav. Leaving main without a stacking context lets
        those drawers paint correctly above header/nav when opened.
      */}
      <main className="reno-mobile-main min-h-0 flex-1 w-full max-w-lg mx-auto overflow-y-auto overscroll-y-contain px-4 pt-4">
        {children}
      </main>

      {/*
        Solid bottom tab bar. Opaque background + clear top border + shrink-0 flex child
        means `main` always ends exactly at the top edge of this bar — content can never
        render behind or under it, on any page or at any scroll position.
      */}
      <nav
        className="relative z-40 shrink-0 border-t border-slate-200 bg-white shadow-[0_-2px_16px_-10px_rgba(15,23,42,0.12)] pb-[env(safe-area-inset-bottom,0px)]"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch">
          {primaryNav
            .filter(
              (item) =>
                item.href !== '/renovation/budget' || profileCanViewBudget(activeProfile?.name),
            )
            .map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors touch-manipulation select-none [-webkit-tap-highlight-color:transparent] ${active ? 'text-indigo-600' : 'text-slate-500 active:text-slate-700 active:bg-slate-50'
                  }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-[3px] w-8 rounded-b-full bg-indigo-600"
                  />
                )}
                <Icon className="h-[22px] w-[22px]" active={active} />
                <span className="text-[11px] font-semibold leading-tight tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function MoreIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={cn(className, 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}
function ProvidersIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

export { CalendarIcon, ProvidersIcon, FilesIcon, NeedsIcon, RoomIcon, GearIcon }
