'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getActiveProject, listTeamMembers } from '@/lib/renovation'
import {
  getStoredProfileMemberId,
  setStoredProfileMemberId,
} from '@/lib/renovation-profile'
import type { RenovationProject, RenovationTeamMember } from '@/types/renovation'

function resolveProfileFromMembers(
  projectId: string,
  members: RenovationTeamMember[]
): { active: RenovationTeamMember | null; needsPick: boolean } {
  const stored = getStoredProfileMemberId(projectId)
  const match = stored ? members.find((m) => m.id === stored) ?? null : null
  if (match) return { active: match, needsPick: false }
  if (members.length > 0) return { active: null, needsPick: true }
  return { active: null, needsPick: false }
}

type Ctx = {
  project: RenovationProject | null
  loading: boolean
  /** False until team + profile choice resolved for current project */
  profileBootstrapDone: boolean
  teamMembers: RenovationTeamMember[]
  /** Selected assignee / “who is using” the app */
  activeProfile: RenovationTeamMember | null
  /** Full-screen picker required (team exists, no valid stored profile) */
  needsProfilePick: boolean
  selectProfile: (member: RenovationTeamMember) => void
  openProfilePicker: () => void
  refresh: () => Promise<void>
  isTaskModalOpen: boolean
  isExpenseModalOpen: boolean
  isQuickUploadOpen: boolean
  quickUploadFile: File | null
  setTaskModalOpen: (open: boolean) => void
  setExpenseModalOpen: (open: boolean) => void
  setQuickUploadFile: (file: File | null) => void
}

const RenovationContext = createContext<Ctx | null>(null)

export function RenovationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [project, setProject] = useState<RenovationProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileBootstrapDone, setProfileBootstrapDone] = useState(false)
  const [teamMembers, setTeamMembers] = useState<RenovationTeamMember[]>([])
  const [activeProfile, setActiveProfile] = useState<RenovationTeamMember | null>(null)
  const [needsProfilePick, setNeedsProfilePick] = useState(false)

  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [isExpenseModalOpen, setExpenseModalOpen] = useState(false)
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null)

  const refresh = useCallback(async () => {
    try {
      const p = await getActiveProject()
      setProject(p)
      if (!p) {
        setTeamMembers([])
        setActiveProfile(null)
        setNeedsProfilePick(false)
        return
      }
      try {
        const members = await listTeamMembers(p.id)
        setTeamMembers(members)
        const { active, needsPick } = resolveProfileFromMembers(p.id, members)
        setActiveProfile(active)
        setNeedsProfilePick(needsPick)
      } catch (e) {
        console.error(e)
        setTeamMembers([])
        setActiveProfile(null)
        setNeedsProfilePick(false)
      }
    } catch (e) {
      console.error(e)
      setProject(null)
      setTeamMembers([])
      setActiveProfile(null)
      setNeedsProfilePick(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname + window.location.search
        router.replace(`/?next=${encodeURIComponent(path)}`)
      } else {
        router.replace('/')
      }
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const p = await getActiveProject()
        if (cancelled) return
        setProject(p)
      } catch {
        if (!cancelled) setProject(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    let cancelled = false
    if (!project) {
      setProfileBootstrapDone(true)
      setTeamMembers([])
      setActiveProfile(null)
      setNeedsProfilePick(false)
      return
    }

    setProfileBootstrapDone(false)
    ;(async () => {
      try {
        const members = await listTeamMembers(project.id)
        if (cancelled) return
        setTeamMembers(members)
        const { active, needsPick } = resolveProfileFromMembers(project.id, members)
        setActiveProfile(active)
        setNeedsProfilePick(needsPick)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setTeamMembers([])
          setActiveProfile(null)
          setNeedsProfilePick(false)
        }
      } finally {
        if (!cancelled) setProfileBootstrapDone(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [project?.id])

  const selectProfile = useCallback(
    (member: RenovationTeamMember) => {
      if (!project) return
      setStoredProfileMemberId(project.id, member.id)
      setActiveProfile(member)
      setNeedsProfilePick(false)
    },
    [project]
  )

  const openProfilePicker = useCallback(() => {
    if (!project || teamMembers.length === 0) return
    setNeedsProfilePick(true)
  }, [project, teamMembers.length])

  return (
    <RenovationContext.Provider
      value={{
        project,
        loading,
        profileBootstrapDone,
        teamMembers,
        activeProfile,
        needsProfilePick,
        selectProfile,
        openProfilePicker,
        refresh,
        isTaskModalOpen,
        isExpenseModalOpen,
        isQuickUploadOpen: !!quickUploadFile,
        quickUploadFile,
        setTaskModalOpen,
        setExpenseModalOpen,
        setQuickUploadFile,
      }}
    >
      {children}
    </RenovationContext.Provider>
  )
}

export function useRenovation() {
  const c = useContext(RenovationContext)
  if (!c) throw new Error('useRenovation outside provider')
  return c
}
