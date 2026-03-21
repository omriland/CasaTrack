'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  deleteExpense,
  listExpenses,
  listExpenseAttachmentsForExpenses,
  uploadExpenseAttachment,
} from '@/lib/renovation'
import type { RenovationExpense, RenovationExpenseAttachment } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'

export function useExpensesPageState() {
  const { project } = useRenovation()
  const [list, setList] = useState<RenovationExpense[]>([])
  const [allAttachments, setAllAttachments] = useState<RenovationExpenseAttachment[]>([])
  const confirmAction = useConfirm()
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(false)
  const [editing, setEditing] = useState<RenovationExpense | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

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

  const attachmentCount = useCallback(
    (exp: RenovationExpense) => {
      const n = allAttachments.filter((a) => a.expense_id === exp.id).length
      return n + (exp.receipt_storage_path ? 1 : 0)
    },
    [allAttachments]
  )

  const openNew = () => {
    setEditing(null)
    setSheet(true)
  }

  const openEdit = (e: RenovationExpense) => {
    setEditing(e)
    setSheet(true)
  }

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
    await load()
  }

  return {
    project,
    list,
    loading,
    sheet,
    setSheet,
    editing,
    dragOverId,
    setDragOverId,
    load,
    attachmentCount,
    openNew,
    openEdit,
    addFilesToExpense,
    remove,
  }
}
