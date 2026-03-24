'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createTask, updateTask, setTaskLabels, deleteTask } from '@/lib/renovation'
import type { RenovationTask, TaskStatus, TaskUrgency } from '@/types/renovation'

export function useTaskForm({
  editing,
  onSave,
}: {
  editing?: RenovationTask | null
  onSave: () => void
}) {
  const { project, activeProfile } = useRenovation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TaskStatus>('open')
  const [urgency, setUrgency] = useState<TaskUrgency>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [providerId, setProviderId] = useState('')
  const [due, setDue] = useState('')
  const [selLabels, setSelLabels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const editingKey = editing?.id ?? 'new'

  useEffect(() => {
    if (editing) {
      setTitle(editing.title)
      setBody(editing.body || '')
      setStatus(editing.status)
      setUrgency(editing.urgency)
      setAssigneeId(editing.assignee_id || '')
      setRoomId(editing.room_id || '')
      setProviderId(editing.provider_id || '')
      setDue(editing.due_date || '')
      setSelLabels(editing.label_ids || [])
    } else {
      setTitle('')
      setBody('')
      setStatus('open')
      setUrgency('medium')
      setAssigneeId('')
      setRoomId('')
      setProviderId('')
      setDue('')
      setSelLabels([])
    }
    setConfirmDelete(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when switching task only
  }, [editingKey])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !title.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateTask(editing.id, {
          title: title.trim(),
          body: body || null,
          status,
          urgency,
          assignee_id: assigneeId || null,
          room_id: roomId || null,
          provider_id: providerId || null,
          due_date: due || null,
        })
        await setTaskLabels(editing.id, selLabels)
      } else {
        await createTask(project.id, {
          title: title.trim(),
          body: body || null,
          status,
          urgency,
          assignee_id: assigneeId || null,
          created_by_member_id: activeProfile?.id ?? null,
          room_id: roomId || null,
          provider_id: providerId || null,
          due_date: due || null,
          label_ids: selLabels,
        })
      }
      onSave()
    } catch (err) {
      console.error(err)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleLabel = useCallback((id: string) => {
    setSelLabels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const handleDeleteClick = useCallback(async () => {
    if (!editing) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    await deleteTask(editing.id)
    onSave()
  }, [editing, confirmDelete, onSave])

  return {
    title,
    setTitle,
    body,
    setBody,
    status,
    setStatus,
    urgency,
    setUrgency,
    assigneeId,
    setAssigneeId,
    roomId,
    setRoomId,
    providerId,
    setProviderId,
    due,
    setDue,
    selLabels,
    saving,
    confirmDelete,
    save,
    toggleLabel,
    handleDeleteClick,
    editing,
  }
}
