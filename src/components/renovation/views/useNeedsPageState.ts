'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createNeed, deleteNeed, listNeeds, listRooms, updateNeed } from '@/lib/renovation'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'

export function useNeedsPageState() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationNeed[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newRoomId, setNewRoomId] = useState('')
  const [adding, setAdding] = useState(false)

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

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !newTitle.trim()) return
    setAdding(true)
    try {
      await createNeed(project.id, newTitle.trim(), newRoomId || null)
      setNewTitle('')
      setNewRoomId('')
      await load()
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
    try {
      await updateNeed(need.id, { title: t })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not save')
    }
  }

  const saveRoom = async (need: RenovationNeed, roomId: string) => {
    try {
      await updateNeed(need.id, { room_id: roomId || null })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not update room')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this item?')) return
    try {
      await deleteNeed(id)
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not delete')
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
  }
}
