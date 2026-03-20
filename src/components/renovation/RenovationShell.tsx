'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRenovation } from './RenovationContext'
import { RenovationProfileGate } from './RenovationProfileGate'
import { ExpenseModal } from './ExpenseModal'
import { TaskModal } from './TaskModal'
import { QuickUploadModal } from './QuickUploadModal'
import { listTeamMembers, listRooms, listLabels, listProviders } from '@/lib/renovation'
import type { RenovationTeamMember, RenovationRoom, RenovationLabel, RenovationProvider } from '@/types/renovation'

const nav = [
  { href: '/renovation', label: 'Overview', icon: HomeIcon, match: (p: string) => p === '/renovation' },
  { href: '/renovation/expenses', label: 'Expenses', icon: CardIcon, match: (p: string) => p.startsWith('/renovation/expenses') },
  { href: '/renovation/tasks', label: 'Tasks', icon: CheckIcon, match: (p: string) => p.startsWith('/renovation/tasks') },
  { href: '/renovation/providers', label: 'Providers', icon: ProvidersIcon, match: (p: string) => p.startsWith('/renovation/providers') },
  { href: '/renovation/gallery', label: 'Photos', icon: PhotoIcon, match: (p: string) => p.startsWith('/renovation/gallery') },
  { href: '/renovation/files', label: 'Files', icon: FilesIcon, match: (p: string) => p.startsWith('/renovation/files') },
  { href: '/renovation/needs', label: 'Needs', icon: NeedsIcon, match: (p: string) => p.startsWith('/renovation/needs') },
  { href: '/renovation/rooms', label: 'Rooms', icon: RoomIcon, match: (p: string) => p.startsWith('/renovation/rooms') },
  { href: '/renovation/settings', label: 'Settings', icon: GearIcon, match: (p: string) => p.startsWith('/renovation/settings') },
]

export function RenovationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { 
    loading, 
    project, 
    profileBootstrapDone,
    teamMembers,
    activeProfile,
    needsProfilePick,
    selectProfile,
    openProfilePicker,
    isTaskModalOpen, 
    setTaskModalOpen, 
    isExpenseModalOpen, 
    setExpenseModalOpen,
    isQuickUploadOpen,
    quickUploadFile,
    setQuickUploadFile,
    refresh
  } = useRenovation()

  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [providers, setProviders] = useState<RenovationProvider[]>([])

  const loadModalsData = useCallback(async () => {
    if (!project) return
    const [m, r, l, prov] = await Promise.all([
      listTeamMembers(project.id),
      listRooms(project.id),
      listLabels(project.id),
      listProviders(project.id).catch(() => []),
    ])
    setMembers(m)
    setRooms(r)
    setLabels(l)
    setProviders(prov)
  }, [project])

  useEffect(() => {
    if (isTaskModalOpen || isExpenseModalOpen) { // Load data if either modal is open
      loadModalsData()
    }
  }, [isTaskModalOpen, isExpenseModalOpen, loadModalsData]) // Added isExpenseModalOpen to dependencies

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      
      if (e.key === 'n') {
        e.preventDefault()
        setExpenseModalOpen(true)
      }
      if (e.key === 'c') {
        e.preventDefault()
        setTaskModalOpen(true)
      }
      if (e.key === 'Escape') {
        setExpenseModalOpen(false)
        setTaskModalOpen(false)
      }
    }
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            setQuickUploadFile(file)
            break
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeys)
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('keydown', handleKeys)
      window.removeEventListener('paste', handlePaste)
    }
  }, [setExpenseModalOpen, setTaskModalOpen, setQuickUploadFile])

  if (loading || (project && !profileBootstrapDone)) {
    return (
      <div className="reno-app min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex justify-center items-center w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide uppercase animate-pulse">Loading</p>
      </div>
    )
  }

  return (
    <div className="reno-app min-h-screen bg-slate-50/50 text-slate-900 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64 flex selection:bg-indigo-100 selection:text-indigo-900">
      {/* Desktop Sidebar Dashboard Menu */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-white/70 backdrop-blur-3xl border-r border-slate-200/60 pt-safe z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
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
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-2 scrollbar-hide min-h-0">
          {nav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded text-[15px] font-medium transition-all duration-300 relative overflow-hidden ${
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
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-extrabold shrink-0">
                {activeProfile.name
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?'}
              </div>
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

      {/* Main Content Pane */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-safe mt-6 md:mt-12 md:pt-6 pb-12 min-h-screen animate-fade-in">
        {project && activeProfile && teamMembers.length > 0 && (
          <div className="md:hidden flex items-center justify-between gap-3 mb-4 -mt-1 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
              <p className="text-[14px] font-bold text-slate-800 truncate" dir="auto">
                {activeProfile.name}
              </p>
            </div>
            <button
              type="button"
              onClick={openProfilePicker}
              className="shrink-0 text-[13px] font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl active:scale-95 transition-all"
            >
              Switch
            </button>
          </div>
        )}
        {children}
      </main>

      {needsProfilePick && teamMembers.length > 0 && (
        <RenovationProfileGate members={teamMembers} onSelect={selectProfile} />
      )}

      {/* Global Modals */}
      {isExpenseModalOpen && (
        <ExpenseModal
          onClose={() => setExpenseModalOpen(false)}
          onSave={() => {
            setExpenseModalOpen(false)
            refresh()
          }}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          members={members}
          rooms={rooms}
          labels={labels}
          providers={providers}
          onClose={() => setTaskModalOpen(false)}
          onSave={() => {
            setTaskModalOpen(false)
            refresh()
          }}
        />
      )}

      {isQuickUploadOpen && quickUploadFile && (
        <QuickUploadModal
          file={quickUploadFile}
          onClose={() => setQuickUploadFile(null)}
          onSave={() => {
            setQuickUploadFile(null)
            refresh()
          }}
        />
      )}

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)] px-3 pointer-events-none">
        <div className="mx-auto max-w-md bg-white/80 backdrop-blur-3xl border border-white shadow-[0_12px_40px_-5px_rgba(0,0,0,0.15)] pointer-events-auto rounded-[2rem] flex justify-between items-center p-1.5 mb-2 relative overflow-hidden ring-1 ring-slate-200/50">
          {nav.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex flex-col items-center justify-center flex-1 h-[3.5rem] transition-all duration-500 rounded-full ${
                  active ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`transition-all duration-500 ${active ? '-translate-y-1.5 scale-110' : 'translate-y-0 scale-100'}`}>
                   <Icon className={`w-[1.35rem] h-[1.35rem] transition-colors duration-500 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} active={active} />
                </div>
                
                <span className={`absolute bottom-1.5 text-[8.5px] sm:text-[9.5px] font-bold tracking-widest uppercase transition-all duration-500 ${
                  active ? 'text-white/90 opacity-100 translate-y-0' : 'text-slate-400 opacity-0 translate-y-2'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
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
function CheckIcon({ className, active }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
