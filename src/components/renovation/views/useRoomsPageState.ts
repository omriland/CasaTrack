'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listGalleryItems, listNeeds, listRooms, listTasks, listGalleryTags, updateRoom } from '@/lib/renovation'
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
      return
    }
    const room = rooms.find((x) => x.id === selectedId)
    if (room) {
      setEditName(room.name)
      setEditNotes(room.notes || '')
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
      await updateRoom(selectedId, { name: editName.trim() || selectedRoom.name, notes: editNotes || null })
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
    saving,
    load,
    selectedRoom,
    roomTasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
  }
}
