'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  listGalleryItems,
  listNeeds,
  listRooms,
  listTasks,
  listGalleryTags,
  updateNeed,
  updateRoom,
  updateTask,
} from '@/lib/renovation'
import { DEFAULT_ROOM_ICON, normalizeRoomIconKey, type RoomIconKey } from '@/components/renovation/room-icons'
import type {
  RenovationGalleryItem,
  RenovationGalleryTag,
  RenovationNeed,
  RenovationRoom,
  RenovationTask,
} from '@/types/renovation'

export function useRoomsPageState() {
  const { project } = useRenovation()
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [tasks, setTasks] = useState<RenovationTask[]>([])
  const [needs, setNeeds] = useState<RenovationNeed[]>([])
  const [gallery, setGallery] = useState<RenovationGalleryItem[]>([])
  const [tags, setTags] = useState<RenovationGalleryTag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<RenovationGalleryItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editIconKey, setEditIconKey] = useState<RoomIconKey>(DEFAULT_ROOM_ICON)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [r, t, n, g, tagsData] = await Promise.all([
        listRooms(project.id),
        listTasks(project.id),
        listNeeds(project.id),
        listGalleryItems(project.id),
        listGalleryTags(project.id),
      ])
      setRooms(r)
      setTasks(t)
      setNeeds(n)
      setGallery(g)
      setTags(tagsData)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selectedId) {
      setEditName('')
      setEditNotes('')
      setEditIconKey(DEFAULT_ROOM_ICON)
      return
    }
    const room = rooms.find((x) => x.id === selectedId)
    if (room) {
      setEditName(room.name)
      setEditNotes(room.notes || '')
      setEditIconKey(normalizeRoomIconKey(room.room_icon_key))
    }
  }, [selectedId, rooms])

  const selectedRoom = selectedId ? rooms.find((r) => r.id === selectedId) : null
  const roomTasks = selectedId ? tasks.filter((t) => t.room_id === selectedId) : []
  const roomNeeds = selectedId ? needs.filter((n) => n.room_id === selectedId) : []
  const roomPhotos = selectedId ? gallery.filter((p) => p.room_id === selectedId) : []

  const saveRoom = async () => {
    if (!selectedId || !selectedRoom) return
    setSaving(true)
    try {
      await updateRoom(selectedId, {
        name: editName.trim() || selectedRoom.name,
        notes: editNotes || null,
        room_icon_key: editIconKey,
      })
      await load()
    } catch (e) {
      console.error(e)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveTaskTitle = useCallback(
    async (taskId: string, title: string) => {
      const trimmed = title.trim()
      const prev = tasks.find((t) => t.id === taskId)
      if (!prev || !trimmed || trimmed === prev.title) return
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t)))
      try {
        await updateTask(taskId, { title: trimmed })
      } catch (e) {
        console.error(e)
        await load()
        alert('Failed to update task')
      }
    },
    [tasks, load],
  )

  const saveNeedTitle = useCallback(
    async (needId: string, title: string) => {
      const trimmed = title.trim()
      const prev = needs.find((n) => n.id === needId)
      if (!prev || !trimmed || trimmed === prev.title) return
      setNeeds((ns) => ns.map((n) => (n.id === needId ? { ...n, title: trimmed } : n)))
      try {
        await updateNeed(needId, { title: trimmed })
      } catch (e) {
        console.error(e)
        await load()
        alert('Failed to update need')
      }
    },
    [needs, load],
  )

  const toggleNeedCompleted = useCallback(
    async (needId: string, completed: boolean) => {
      setNeeds((ns) => ns.map((n) => (n.id === needId ? { ...n, completed } : n)))
      try {
        await updateNeed(needId, { completed })
      } catch (e) {
        console.error(e)
        await load()
        alert('Failed to update need')
      }
    },
    [load],
  )

  return {
    project,
    rooms,
    tasks,
    needs,
    gallery,
    tags,
    loading,
    selectedId,
    setSelectedId,
    lightbox,
    setLightbox,
    editName,
    setEditName,
    editNotes,
    setEditNotes,
    editIconKey,
    setEditIconKey,
    saving,
    load,
    selectedRoom,
    roomTasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
    saveTaskTitle,
    saveNeedTitle,
    toggleNeedCompleted,
  }
}
