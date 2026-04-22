'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  Home,
  DollarSign,
  ClipboardList,
  Calendar,
  Phone,
  Image,
  FileText,
  Star,
  DoorOpen,
  Settings,
  ChevronsLeft,
  ChevronLeft,
} from 'lucide-react'
import { profileCanViewBudget } from '@/lib/renovation-profile'
import { useRenovation } from './RenovationContext'
import { ProfileSelector } from './ProfileSelector'

const COLLAPSED_KEY = 'reno-sidebar-collapsed'
const SIDEBAR_W = 220
const SIDEBAR_W_COLLAPSED = 56

const nav = [
  { href: '/renovation', label: 'Overview', icon: Home, match: (p: string) => p === '/renovation' },
  { href: '/renovation/budget', label: 'Budget', icon: DollarSign, match: (p: string) => p.startsWith('/renovation/budget') },
  { href: '/renovation/tasks', label: 'Tasks', icon: ClipboardList, match: (p: string) => p.startsWith('/renovation/tasks') },
  { href: '/renovation/calendar', label: 'Calendar', icon: Calendar, match: (p: string) => p.startsWith('/renovation/calendar') },
  { href: '/renovation/providers', label: 'Providers', icon: Phone, match: (p: string) => p.startsWith('/renovation/providers') },
  { href: '/renovation/gallery', label: 'Photos', icon: Image, match: (p: string) => p.startsWith('/renovation/gallery') },
  { href: '/renovation/files', label: 'Files', icon: FileText, match: (p: string) => p.startsWith('/renovation/files') },
  { href: '/renovation/needs', label: 'Needs', icon: Star, match: (p: string) => p.startsWith('/renovation/needs') },
  { href: '/renovation/rooms', label: 'Rooms', icon: DoorOpen, match: (p: string) => p.startsWith('/renovation/rooms') },
  { href: '/renovation/settings', label: 'Settings', icon: Settings, match: (p: string) => p.startsWith('/renovation/settings') },
]

export function RenovationDesktopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { project, activeProfile, teamMembers, selectProfile } = useRenovation()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  })

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      if (e.key === '[' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleCollapsed()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toggleCollapsed])

  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W

  return (
    <div
      className="reno-app min-h-screen bg-[oklch(0.995_0_0)] text-slate-900 flex transition-[padding-left] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ paddingLeft: sidebarW }}
    >
      <aside
        data-collapsed={collapsed}
        className="group/sidebar fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-black/[0.07] overflow-hidden pt-safe transition-[width] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: sidebarW }}
      >
        <div
          className={[
            'flex border-b border-black/[0.05] py-[14px]',
            collapsed ? 'justify-center px-0' : 'justify-start px-4',
          ].join(' ')}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] text-[oklch(0.60_0_0)] hover:text-[oklch(0.13_0_0)] transition-colors duration-[120ms] cursor-pointer font-[family-name:var(--font-varela-round)] tracking-[-0.01em]"
          >
            <ChevronLeft size={13} strokeWidth={2} />
            {!collapsed && <span>Property Hunt</span>}
          </Link>
        </div>

        <div
          className={[
            'flex flex-col border-b border-black/[0.05] pt-[18px] pb-[14px] gap-[3px]',
            collapsed ? 'items-center px-0' : 'items-start px-4',
          ].join(' ')}
        >
          {collapsed ? (
            <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.18_163)]" />
          ) : (
            <>
              <div className="flex items-center justify-between w-full">
                <span className="font-[family-name:var(--font-varela-round)] text-[20px] tracking-[-0.02em] text-[oklch(0.13_0_0)] leading-[1.2] line-clamp-1">
                  {project?.name || 'Renovation'}
                </span>
                <div className="w-[7px] h-[7px] rounded-full bg-[oklch(0.65_0.18_163)] flex-shrink-0" />
              </div>
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[oklch(0.60_0_0)] tracking-[0.01em] line-clamp-1">
                {project?.address_text || 'Project Hub'}
              </span>
            </>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto min-h-0 scrollbar-hide">
          {nav
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
                title={collapsed ? item.label : undefined}
                className={[
                  'w-full relative flex items-center gap-[10px] border-none',
                  'font-[family-name:var(--font-varela-round)] text-[13px] tracking-[-0.01em]',
                  'transition-[background,color,border-color] duration-[120ms] select-none',
                  active
                    ? 'bg-[oklch(0.97_0_0)] text-[oklch(0.13_0_0)]'
                    : 'bg-transparent text-[oklch(0.40_0_0)] hover:bg-[oklch(0.98_0_0)]',
                  collapsed ? 'justify-center px-0 py-[9px]' : 'px-4 py-[8px]',
                ].join(' ')}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-sm bg-[oklch(0.13_0_0)]" />
                )}
                <span className={active ? 'text-[oklch(0.13_0_0)]' : 'text-[oklch(0.60_0_0)]'}>
                  <Icon size={15} strokeWidth={1.5} />
                </span>
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        <div className="h-px bg-black/[0.06]" />

        {project && activeProfile && teamMembers.length > 0 && (
          <div className={collapsed ? 'py-2 flex justify-center' : 'px-4 pt-[10px] pb-1'}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-[0.07em] text-[oklch(0.60_0_0)] mb-[6px] font-[family-name:var(--font-varela-round)]">
                Profile
              </p>
            )}
            <ProfileSelector
              profiles={teamMembers.map((member) => ({ id: member.id, name: member.name }))}
              activeProfileId={activeProfile.id}
              collapsed={collapsed}
              onSelect={(id) => {
                const selected = teamMembers.find((member) => member.id === id)
                if (selected) selectProfile(selected)
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar (⌘[)' : 'Collapse sidebar (⌘[)'}
          className={[
            'flex items-center gap-2 border-t border-black/[0.05] cursor-pointer',
            'text-[12px] text-[oklch(0.60_0_0)] hover:text-[oklch(0.13_0_0)]',
            'transition-colors duration-[120ms] select-none bg-transparent border-x-0 border-b-0',
            'font-[family-name:var(--font-varela-round)] tracking-[-0.005em]',
            collapsed ? 'justify-center px-0 py-3' : 'px-4 py-[10px]',
          ].join(' ')}
        >
          <span
            className="flex transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronsLeft size={14} strokeWidth={1.5} />
          </span>
          {!collapsed && 'Collapse'}
        </button>
      </aside>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-safe mt-12 pt-6 pb-12 min-h-screen animate-fade-in">
        {children}
      </main>
    </div>
  )
}
