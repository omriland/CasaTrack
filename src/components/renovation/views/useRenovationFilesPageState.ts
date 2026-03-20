'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listProjectFiles, listRooms, updateProjectFile, uploadProjectFile } from '@/lib/renovation'
import type { RenovationFile, RenovationRoom } from '@/types/renovation'

export function useRenovationFilesPageState() {
  const { project } = useRenovation()
  const [files, setFiles] = useState<RenovationFile[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [defaultRoom, setDefaultRoom] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState('')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [f, r] = await Promise.all([listProjectFiles(project.id), listRooms(project.id)])
      setFiles(f)
      setRooms(r)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const handleFiles = async (list: FileList | null) => {
    if (!project || !list?.length) return
    const filesArr = Array.from(list)
    setUploading(true)
    setUploadProgress({ done: 0, total: filesArr.length })
    const room = defaultRoom || null
    const failures: { name: string; error: string }[] = []
    try {
      for (let i = 0; i < filesArr.length; i++) {
        const file = filesArr[i]!
        try {
          await uploadProjectFile(project.id, file, room)
        } catch (e) {
          console.error(e)
          const msg = e instanceof Error ? e.message : String(e)
          failures.push({ name: file.name, error: msg })
        } finally {
          setUploadProgress({ done: i + 1, total: filesArr.length })
        }
      }
      await load()
      if (failures.length > 0) {
        const lines = failures.map((f) => `• ${f.name}: ${f.error}`).join('\n')
        const ok = filesArr.length - failures.length
        alert(
          ok > 0
            ? `Uploaded ${ok} of ${filesArr.length} file(s).\n\nFailed:\n${lines}`
            : `Upload failed for all ${filesArr.length} file(s):\n\n${lines}`
        )
      }
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const saveName = async (f: RenovationFile, name: string) => {
    const trimmed = name.trim()
    setEditingFileId(null)
    if (!trimmed || trimmed === f.display_name) return
    try {
      await updateProjectFile(f.id, { display_name: trimmed })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not rename')
    }
  }

  const startEditing = (f: RenovationFile) => {
    setEditingFileId(f.id)
    setEditingFileName(f.display_name)
  }

  const saveRoom = async (f: RenovationFile, roomId: string) => {
    try {
      await updateProjectFile(f.id, { room_id: roomId || null })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not update room')
    }
  }

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesRoom = !filterRoom || f.room_id === filterRoom
      const matchesSearch =
        !searchQuery ||
        f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesRoom && matchesSearch
    })
  }, [files, filterRoom, searchQuery])

  return {
    project,
    files,
    rooms,
    loading,
    uploading,
    uploadProgress,
    dragOver,
    setDragOver,
    filterRoom,
    setFilterRoom,
    defaultRoom,
    setDefaultRoom,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    editingFileId,
    editingFileName,
    setEditingFileName,
    load,
    handleFiles,
    saveName,
    startEditing,
    saveRoom,
    filtered,
    setEditingFileId,
  }
}
