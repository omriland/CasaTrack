'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  archiveProject,
  createBudgetLine,
  effectiveBudget,
  getArchivedProjects,
  listBudgetLines,
  listExpenses,
  listGalleryTags,
  listLabels,
  listRooms,
  listTeamMembers,
  sumPlannedExpenses,
  sumSpentExpenses,
  updateProject,
} from '@/lib/renovation'
import type {
  RenovationBudgetLine,
  RenovationGalleryTag,
  RenovationLabel,
  RenovationProject,
  RenovationRoom,
  RenovationTeamMember,
} from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'

export function useRenovationSettingsPageState() {
  const router = useRouter()
  const { project, refresh } = useRenovation()
  const confirmAction = useConfirm()
  const [archived, setArchived] = useState<RenovationProject[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [gTags, setGTags] = useState<RenovationGalleryTag[]>([])
  const [lines, setLines] = useState<RenovationBudgetLine[]>([])
  const [spent, setSpent] = useState(0)
  const [plannedTotal, setPlannedTotal] = useState(0)
  const [total, setTotal] = useState('')
  const [cont, setCont] = useState('')
  const [loading, setLoading] = useState(true)
  const [newCat, setBudgetCat] = useState('')
  const [newAmt, setBudgetAmt] = useState('')
  const [nm, setNm] = useState({ name: '', phone: '', email: '' })
  const [roomName, setRoomName] = useState('')
  const [roomNotes, setRoomNotes] = useState('')
  const [lbName, setLbName] = useState('')
  const [lbColor, setLbColor] = useState('#6366f1')
  const [gtName, setGtName] = useState('')
  const [projNotes, setProjNotes] = useState('')
  const [projAddr, setProjAddr] = useState('')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [m, r, l, g, bl, ex] = await Promise.all([
        listTeamMembers(project.id),
        listRooms(project.id),
        listLabels(project.id),
        listGalleryTags(project.id),
        listBudgetLines(project.id),
        listExpenses(project.id),
      ])
      setMembers(m)
      setRooms(r)
      setLabels(l)
      setGTags(g)
      setLines(bl)
      setSpent(sumSpentExpenses(ex))
      setPlannedTotal(sumPlannedExpenses(ex))
      setTotal(String(project.total_budget))
      setCont(String(project.contingency_amount))
      setProjNotes(project.notes || '')
      setProjAddr(project.address_text || '')
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getArchivedProjects().then(setArchived)
  }, [project?.id])

  const saveProjectMeta = async () => {
    if (!project) return
    await updateProject(project.id, { notes: projNotes || null, address_text: projAddr || null })
    await refresh()
  }

  const saveTotals = async () => {
    if (!project) return
    try {
      await updateProject(project.id, {
        total_budget: Number(total) || 0,
        contingency_amount: Number(cont) || 0,
      })
      await refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to save totals')
    }
  }

  const addBudgetLine = async () => {
    if (!project || !newCat.trim()) return
    try {
      await createBudgetLine(project.id, newCat.trim(), Number(newAmt) || 0)
      setBudgetCat('')
      setBudgetAmt('')
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to add budget line')
    }
  }

  const lineSum = lines.reduce((s, l) => s + Number(l.amount_allocated), 0)
  const cap = project ? effectiveBudget({ ...project, total_budget: Number(total) || 0, contingency_amount: Number(cont) || 0 }) : 0

  const archiveCurrent = async () => {
    if (!project) return
    if (!(await confirmAction('Archive this project and start fresh later?'))) return
    await archiveProject(project.id)
    await refresh()
    router.push('/renovation')
  }

  return {
    project,
    refresh,
    archived,
    members,
    rooms,
    labels,
    gTags,
    lines,
    spent,
    plannedTotal,
    total,
    setTotal,
    cont,
    setCont,
    loading,
    newCat,
    setBudgetCat,
    newAmt,
    setBudgetAmt,
    nm,
    setNm,
    roomName,
    setRoomName,
    roomNotes,
    setRoomNotes,
    lbName,
    setLbName,
    lbColor,
    setLbColor,
    gtName,
    setGtName,
    projNotes,
    setProjNotes,
    projAddr,
    setProjAddr,
    load,
    saveProjectMeta,
    saveTotals,
    addBudgetLine,
    lineSum,
    cap,
    archiveCurrent,
  }
}

export type RenovationSettingsPageCtx = ReturnType<typeof useRenovationSettingsPageState>
