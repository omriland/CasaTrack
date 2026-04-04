'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  deleteExpense,
  listExpenses,
  listExpenseAttachmentsForExpenses,
  sumPlannedExpenses,
  sumSpentExpenses,
  uploadExpenseAttachment,
} from '@/lib/renovation'
import type { RenovationExpense, RenovationExpenseAttachment } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'

export type ExpenseListFilter = 'all' | 'spent' | 'planned'

export function useExpensesPageState() {
  const { project } = useRenovation()
  const [list, setList] = useState<RenovationExpense[]>([])
  const [allAttachments, setAllAttachments] = useState<RenovationExpenseAttachment[]>([])
  const confirmAction = useConfirm()
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  /** Desktop + mobile: right detail drawer for an existing expense */
  const [viewing, setViewing] = useState<RenovationExpense | null>(null)
  const [expenseFilter, setExpenseFilter] = useState<ExpenseListFilter>('all')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const exps = await listExpenses(project.id)
      const atts = await listExpenseAttachmentsForExpenses(exps.map((e) => e.id))
      setList(exps)
      setAllAttachments(atts)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const viewingId = viewing?.id
  useEffect(() => {
    if (!viewingId) return
    const u = list.find((e) => e.id === viewingId)
    if (u) setViewing(u)
    else setViewing(null)
  }, [list, viewingId])

  const filteredList = useMemo(() => {
    if (expenseFilter === 'spent') return list.filter((e) => !e.is_planned)
    if (expenseFilter === 'planned') return list.filter((e) => e.is_planned)
    return list
  }, [list, expenseFilter])

  const spentTotal = useMemo(() => sumSpentExpenses(list), [list])
  const plannedTotal = useMemo(() => sumPlannedExpenses(list), [list])

  const attachmentCount = useCallback(
    (exp: RenovationExpense) => {
      const n = allAttachments.filter((a) => a.expense_id === exp.id).length
      return n + (exp.receipt_storage_path ? 1 : 0)
    },
    [allAttachments]
  )

  const openNew = () => {
    setViewing(null)
    setSheet(true)
  }

  const openView = (e: RenovationExpense) => {
    setSheet(false)
    setViewing(e)
  }

  const closeView = () => setViewing(null)

  const addFilesToExpense = async (exp: RenovationExpense, files: FileList | null) => {
    if (!project || !files?.length) return
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadExpenseAttachment(project.id, exp.id, files[i]!)
      }
      await load()
    } catch (err) {
      console.error(err)
      alert('Upload failed. Run 05_expense_attachments.sql and check storage bucket renovation-files.')
    }
  }

  const remove = async (id: string) => {
    if (!(await confirmAction('Delete this expense?'))) return
    await deleteExpense(id)
    setViewing((v) => (v?.id === id ? null : v))
    await load()
  }

  return {
    project,
    list,
    filteredList,
    expenseFilter,
    setExpenseFilter,
    spentTotal,
    plannedTotal,
    loading,
    sheet,
    setSheet,
    viewing,
    dragOverId,
    setDragOverId,
    load,
    attachmentCount,
    openNew,
    openView,
    closeView,
    addFilesToExpense,
    remove,
  }
}
