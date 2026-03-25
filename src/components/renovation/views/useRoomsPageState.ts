'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listGalleryItems, listNeeds, listRooms, listTasks, listGalleryTags, updateRoom } from '@/lib/renovation'
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
  }
}
