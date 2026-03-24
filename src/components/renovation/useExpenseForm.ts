'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createExpense,
  updateExpense,
  listExpenseAttachmentsForExpense,
  uploadExpenseAttachment,
  deleteExpenseAttachment,
} from '@/lib/renovation'
import type { RenovationExpense, RenovationExpenseAttachment } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'

export function useExpenseForm({
  editing,
  onSave,
  onAttachmentsChanged,
}: {
  editing?: RenovationExpense | null
  onSave: () => void
  onAttachmentsChanged?: () => void
}) {
  const { project } = useRenovation()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState('')
  const [saving, setSaving] = useState(false)
  const [attachments, setAttachments] = useState<RenovationExpenseAttachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingAttach, setUploadingAttach] = useState(false)
  const confirmAction = useConfirm()

  const loadAttachments = useCallback(async () => {
    if (!editing?.id) {
      setAttachments([])
      return
    }
    try {
      setAttachments(await listExpenseAttachmentsForExpense(editing.id))
    } catch (e) {
      console.error(e)
    }
  }, [editing?.id])

  const editingKey = editing?.id ?? 'new'

  useEffect(() => {
    if (editing) {
      setAmount(
        String(editing.amount)
          .split('.')
          .map((part, i) => (i === 0 ? part.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : part))
          .join('.')
      )
      setDate(editing.expense_date)
      setVendor(editing.vendor || '')
      setCategory(editing.category || '')
      setNotes(editing.notes || '')
      setPayment(editing.payment_method || '')
    } else {
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setVendor('')
      setCategory('')
      setNotes('')
      setPayment('')
    }
    setPendingFiles([])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form when switching expense only (editingKey); avoid clearing pending on parent re-renders with new object ref
  }, [editingKey])

  useEffect(() => {
    loadAttachments()
  }, [loadAttachments])

  const handleAmountChange = (val: string) => {
    const raw = val.replace(/[^0-9.]/g, '')
    const parts = raw.split('.')
    if (parts.length > 2) return
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    if (parts[1]?.length > 2) {
      parts[1] = parts[1].slice(0, 2)
    }
    setAmount(parts.join('.'))
  }

  const attachPendingToExpenseId = async (expenseId: string) => {
    if (!project || pendingFiles.length === 0) return
    for (const f of pendingFiles) {
      await uploadExpenseAttachment(project.id, expenseId, f)
    }
    setPendingFiles([])
  }

  const onFilesSelectedForNew = (files: FileList | null) => {
    if (!files?.length) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
  }

  const onFilesSelectedForEdit = async (files: FileList | null) => {
    if (!project || !editing?.id || !files?.length) return
    setUploadingAttach(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadExpenseAttachment(project.id, editing.id, files[i]!)
      }
      await loadAttachments()
      onAttachmentsChanged?.()
    } catch (e) {
      console.error(e)
      alert('Could not upload file(s). Run 05_expense_attachments.sql and ensure renovation-files bucket exists.')
    } finally {
      setUploadingAttach(false)
    }
  }

  const handleDroppedFiles = (files: FileList | null) => {
    if (!files?.length) return
    if (editing?.id) void onFilesSelectedForEdit(files)
    else onFilesSelectedForNew(files)
  }

  const removePendingAt = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeAttachment = async (att: RenovationExpenseAttachment) => {
    if (!(await confirmAction('Remove this file from the expense?'))) return
    try {
      await deleteExpenseAttachment(att)
      await loadAttachments()
      onAttachmentsChanged?.()
    } catch (e) {
      console.error(e)
      alert('Could not remove file')
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    const n = Number(amount.replace(/,/g, ''))
    if (Number.isNaN(n)) return
    setSaving(true)
    try {
      if (editing) {
        await updateExpense(editing.id, {
          amount: n,
          expense_date: date,
          vendor: vendor || null,
          category: category || null,
          notes: notes || null,
          payment_method: payment || null,
        })
        await attachPendingToExpenseId(editing.id)
        await loadAttachments()
      } else {
        const created = await createExpense(project.id, {
          amount: n,
          expense_date: date,
          vendor: vendor || null,
          category: category || null,
          notes: notes || null,
          payment_method: payment || null,
        })
        await attachPendingToExpenseId(created.id)
      }
      onAttachmentsChanged?.()
      onSave()
    } catch (err) {
      console.error(err)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  return {
    amount,
    handleAmountChange,
    date,
    setDate,
    vendor,
    setVendor,
    category,
    setCategory,
    notes,
    setNotes,
    payment,
    setPayment,
    saving,
    uploadingAttach,
    attachments,
    pendingFiles,
    editing,
    onFilesSelectedForNew,
    onFilesSelectedForEdit,
    handleDroppedFiles,
    removePendingAt,
    removeAttachment,
    save,
  }
}
