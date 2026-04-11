'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createTask,
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
import { notesContentEqual, notesToEditorHtml } from '@/lib/room-notes-html'
import type {
  RenovationGalleryItem,
  RenovationGalleryTag,
  RenovationNeed,
  RenovationRoom,
  RenovationTask,
} from '@/types/renovation'

export function useRoomsPageState() {
  const { project, activeProfile } = useRenovation()
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
  const [saveAck, setSaveAck] = useState(false)
  const saveAckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSelectedRoomIdRef = useRef<string | null>(null)

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
    setSaveAck(false)
  }, [selectedId])

  useEffect(() => {
    return () => {
      if (saveAckTimerRef.current) {
        clearTimeout(saveAckTimerRef.current)
        saveAckTimerRef.current = null
      }
    }
  }, [])

  /** Only reset the form when switching rooms — not when `rooms` updates in place after save (avoids TipTap flash). */
  useEffect(() => {
    if (!selectedId) {
      prevSelectedRoomIdRef.current = null
      setEditName('')
      setEditNotes('')
      setEditIconKey(DEFAULT_ROOM_ICON)
      return
    }
    const room = rooms.find((x) => x.id === selectedId)
    if (!room) return

    const switched = prevSelectedRoomIdRef.current !== selectedId
    prevSelectedRoomIdRef.current = selectedId

    if (switched) {
      setEditName(room.name)
      setEditNotes(room.notes ? notesToEditorHtml(room.notes) : '')
      setEditIconKey(normalizeRoomIconKey(room.room_icon_key))
    }
  }, [selectedId, rooms])

  /** Prefer this over setSelectedId when picking a room so note fields update in the same render (TipTap key + content). */
  const selectRoom = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      if (!id) {
        setEditName('')
        setEditNotes('')
        setEditIconKey(DEFAULT_ROOM_ICON)
        return
      }
      const room = rooms.find((x) => x.id === id)
      if (room) {
        setEditName(room.name)
        setEditNotes(room.notes ? notesToEditorHtml(room.notes) : '')
        setEditIconKey(normalizeRoomIconKey(room.room_icon_key))
      }
    },
    [rooms],
  )

  const selectedRoom = selectedId ? rooms.find((r) => r.id === selectedId) : null
  const roomTasks = selectedId
    ? tasks.filter((t) => t.room_id === selectedId && t.status !== 'done')
    : []
  const roomNeeds = selectedId ? needs.filter((n) => n.room_id === selectedId) : []
  const roomPhotos = selectedId ? gallery.filter((p) => p.room_id === selectedId) : []

  const saveRoom = async () => {
    if (!selectedId || !selectedRoom) return
    const name = editName.trim() || selectedRoom.name
    const notes = editNotes || null
    const room_icon_key = editIconKey
    if (
      name === selectedRoom.name &&
      notesContentEqual(editNotes, selectedRoom.notes) &&
      normalizeRoomIconKey(selectedRoom.room_icon_key) === room_icon_key
    ) {
      return
    }
    setSaving(true)
    setSaveAck(false)
    try {
      await updateRoom(selectedId, {
        name,
        notes,
        room_icon_key,
      })
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedId ? { ...r, name, notes, room_icon_key } : r,
        ),
      )
      setSaveAck(true)
      if (saveAckTimerRef.current) clearTimeout(saveAckTimerRef.current)
      saveAckTimerRef.current = setTimeout(() => {
        setSaveAck(false)
        saveAckTimerRef.current = null
      }, 2200)
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

  const addTaskToRoom = useCallback(
    async (roomId: string, title: string): Promise<boolean> => {
      if (!project) return false
      const trimmed = title.trim()
      if (!trimmed) return false
      try {
        await createTask(project.id, {
          title: trimmed,
          room_id: roomId,
          created_by_member_id: activeProfile?.id ?? null,
        })
        const next = await listTasks(project.id)
        setTasks(next)
        return true
      } catch (e) {
        console.error(e)
        alert('Failed to add task')
        return false
      }
    },
    [project, activeProfile],
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
    selectRoom,
    lightbox,
    setLightbox,
    editName,
    setEditName,
    editNotes,
    setEditNotes,
    editIconKey,
    setEditIconKey,
    saving,
    saveAck,
    load,
    selectedRoom,
    roomTasks,
    roomNeeds,
    roomPhotos,
    saveRoom,
    saveTaskTitle,
    addTaskToRoom,
    saveNeedTitle,
    toggleNeedCompleted,
  }
}
