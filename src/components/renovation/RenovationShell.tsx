'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRenovation } from './RenovationContext'
import { RenovationProfileGate } from './RenovationProfileGate'
import { ExpenseModal } from './ExpenseModal'
import { TaskModal } from './TaskModal'
import { QuickUploadModal } from './QuickUploadModal'
import { listTeamMembers, listRooms, listLabels, listProviders } from '@/lib/renovation'
import type { RenovationTeamMember, RenovationRoom, RenovationLabel, RenovationProvider } from '@/types/renovation'
import { RenovationDesktopShell } from './RenovationDesktopShell'
import { RenovationMobileShell } from './RenovationMobileShell'
import { RenovationViewportProvider } from './RenovationViewportContext'

const MOBILE_MQ = '(max-width: 767px)'

export function RenovationShell({ children }: { children: ReactNode }) {
  const {
    loading,
    project,
    profileBootstrapDone,
    teamMembers,
    needsProfilePick,
    selectProfile,
    isTaskModalOpen,
    setTaskModalOpen,
    isExpenseModalOpen,
    setExpenseModalOpen,
    isQuickUploadOpen,
    quickUploadFile,
    setQuickUploadFile,
    refresh,
  } = useRenovation()

  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [providers, setProviders] = useState<RenovationProvider[]>([])

  const [viewportReady, setViewportReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    if (isTaskModalOpen || isExpenseModalOpen) {
      loadModalsData()
    }
  }, [isTaskModalOpen, isExpenseModalOpen, loadModalsData])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const apply = () => setIsMobile(mq.matches)
    apply()
    setViewportReady(true)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (window.matchMedia(MOBILE_MQ).matches) return
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

  if (!viewportReady) {
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
    <RenovationViewportProvider isMobile={isMobile}>
      {isMobile ? <RenovationMobileShell>{children}</RenovationMobileShell> : <RenovationDesktopShell>{children}</RenovationDesktopShell>}

      {needsProfilePick && teamMembers.length > 0 && (
        <RenovationProfileGate members={teamMembers} onSelect={selectProfile} />
      )}

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
    </RenovationViewportProvider>
  )
}
