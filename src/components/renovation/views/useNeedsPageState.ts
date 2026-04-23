'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createNeed, deleteNeed, listNeeds, listRooms, updateNeed } from '@/lib/renovation'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'
import { useConfirm } from '@/providers/ConfirmProvider'

export function useNeedsPageState() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationNeed[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newRoomId, setNewRoomId] = useState('')
  const [adding, setAdding] = useState(false)
  const confirmAction = useConfirm()

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [n, r] = await Promise.all([listNeeds(project.id), listRooms(project.id)])
      setItems(n)
      setRooms(r)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const addItem = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!project || !newTitle.trim()) return
    setAdding(true)
    try {
      const row = await createNeed(project.id, newTitle.trim(), newRoomId || null)
      const roomId = row.room_id || null
      const room = roomId ? rooms.find((r) => r.id === roomId) ?? null : null
      setItems((prev) => [
        ...prev,
        {
          ...row,
          completed: row.completed ?? false,
          room,
        },
      ])
      setNewTitle('')
      setNewRoomId('')
    } catch (err) {
      console.error(err)
      alert('Could not add. Run 06_needs.sql in Supabase.')
    } finally {
      setAdding(false)
    }
  }

  const saveTitle = async (need: RenovationNeed, title: string) => {
    const t = title.trim()
    if (!t || t === need.title) return
    const prevTitle = need.title
    setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, title: t } : n)))
    try {
      await updateNeed(need.id, { title: t })
    } catch (e) {
      console.error(e)
      setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, title: prevTitle } : n)))
      alert('Could not save')
    }
  }

  const saveRoom = async (need: RenovationNeed, roomId: string) => {
    const rid = roomId || null
    const room = rid ? rooms.find((r) => r.id === rid) ?? null : null
    const revert = { room_id: need.room_id, room: need.room ?? null }
    setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, room_id: rid, room } : n)))
    try {
      await updateNeed(need.id, { room_id: rid })
    } catch (e) {
      console.error(e)
      setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, ...revert } : n)))
      alert('Could not update room')
    }
  }

  const remove = async (id: string) => {
    if (!(await confirmAction('Remove this item?'))) return
    try {
      await deleteNeed(id)
      setItems((prev) => prev.filter((n) => n.id !== id))
    } catch (e) {
      console.error(e)
      alert('Could not delete')
    }
  }

  const toggleCompleted = async (need: RenovationNeed) => {
    const next = !need.completed
    setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, completed: next } : n)))
    try {
      await updateNeed(need.id, { completed: next })
    } catch (e) {
      console.error(e)
      setItems((prev) => prev.map((n) => (n.id === need.id ? { ...n, completed: need.completed } : n)))
      alert('Could not update')
    }
  }

  return {
    project,
    items,
    rooms,
    loading,
    newTitle,
    setNewTitle,
    newRoomId,
    setNewRoomId,
    adding,
    addItem,
    saveTitle,
    saveRoom,
    remove,
    toggleCompleted,
  }
}
