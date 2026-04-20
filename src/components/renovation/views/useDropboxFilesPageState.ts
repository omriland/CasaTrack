'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { DropboxEntry, ListResponse } from '@/app/api/renovation/files/list/route'
import type { SearchResponse } from '@/app/api/renovation/files/search/route'

export type { DropboxEntry }

const ROOT_SENTINEL = '__root__'

export type BreadcrumbItem = { name: string; path: string }

export function useDropboxFilesPageState(configured: boolean) {
  const [entries, setEntries] = useState<DropboxEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>(ROOT_SENTINEL)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadIdRef = useRef(0)

  const load = useCallback(
    async (path: string) => {
      if (!configured) return
      const id = ++loadIdRef.current

      setLoading(true)
      setLoadError(null)
      try {
        const url =
          path === ROOT_SENTINEL
            ? '/api/renovation/files/list'
            : `/api/renovation/files/list?path=${encodeURIComponent(path)}`
        const res = await fetch(url)
        if (id !== loadIdRef.current) return
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(j.error || `Error ${res.status}`)
        }
        const data = (await res.json()) as ListResponse
        if (id !== loadIdRef.current) return
        setEntries(data.entries)
      } catch (e) {
        if (id !== loadIdRef.current) return
        setLoadError(e instanceof Error ? e.message : 'Could not load files')
      } finally {
        if (id === loadIdRef.current) setLoading(false)
      }
    },
    [configured]
  )

  useEffect(() => {
    if (configured) load(ROOT_SENTINEL)
    return () => { loadIdRef.current++ }
  }, [configured, load])

  const navigateTo = useCallback(
    (entry: DropboxEntry & { tag: 'folder' }) => {
      setBreadcrumbs((prev) => [
        ...prev,
        { name: entry.name, path: entry.pathLower },
      ])
      setCurrentPath(entry.pathLower)
      setSearchQuery('')
      load(entry.pathLower)
    },
    [load]
  )

  const navigateToIndex = useCallback(
    (index: number) => {
      if (index < 0) {
        // Back to root
        setBreadcrumbs([])
        setCurrentPath(ROOT_SENTINEL)
        setSearchQuery('')
        load(ROOT_SENTINEL)
      } else {
        const crumb = breadcrumbs[index]
        if (!crumb) return
        setBreadcrumbs((prev) => prev.slice(0, index + 1))
        setCurrentPath(crumb.path)
        setSearchQuery('')
        load(crumb.path)
      }
    },
    [breadcrumbs, load]
  )

  const uploadFiles = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return
      setUploading(true)
      setUploadProgress({ done: 0, total: list.length })
      const failures: { name: string; error: string }[] = []

      const folderPath = currentPath === ROOT_SENTINEL ? '' : currentPath

      for (let i = 0; i < list.length; i++) {
        const file = list[i]!
        try {
          const fd = new FormData()
          fd.append('file', file)
          if (folderPath) fd.append('targetPath', folderPath)
          const res = await fetch('/api/renovation/files/upload', { method: 'POST', body: fd })
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(j.error || `Upload error ${res.status}`)
          }
        } catch (e) {
          failures.push({ name: file.name, error: e instanceof Error ? e.message : String(e) })
        } finally {
          setUploadProgress({ done: i + 1, total: list.length })
        }
      }

      await load(currentPath)
      setUploading(false)
      setUploadProgress(null)

      if (failures.length) {
        const lines = failures.map((f) => `• ${f.name}: ${f.error}`).join('\n')
        const ok = list.length - failures.length
        alert(
          ok > 0
            ? `Uploaded ${ok} of ${list.length} file(s).\n\nFailed:\n${lines}`
            : `Upload failed:\n${lines}`
        )
      }
    },
    [currentPath, load]
  )

  const deleteEntry = useCallback(
    async (entry: DropboxEntry) => {
      const res = await fetch('/api/renovation/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: entry.pathLower }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'Delete failed')
      }
      await load(currentPath)
    },
    [currentPath, load]
  )

  const moveEntry = useCallback(
    async (entry: DropboxEntry, targetFolder: DropboxEntry & { tag: 'folder' }) => {
      const toPath = `${targetFolder.pathLower}/${entry.name}`
      const res = await fetch('/api/renovation/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromPath: entry.pathLower, toPath }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error || 'Move failed')
      }
      await load(currentPath)
    },
    [currentPath, load]
  )

  const openFileUrl = (entry: DropboxEntry & { tag: 'file' }) =>
    `/api/renovation/files/open?path=${encodeURIComponent(entry.pathLower)}`

  /* ── Recursive search via Dropbox search_v2 ──────────────────── */
  const [searchResults, setSearchResults] = useState<DropboxEntry[] | null>(null)
  const [searching, setSearching] = useState(false)
  const searchIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const q = searchQuery.trim()
    if (!q || q.length < 2) {
      setSearchResults(null)
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const id = ++searchIdRef.current
      try {
        const scopePath = currentPath === ROOT_SENTINEL ? '' : currentPath
        const url = `/api/renovation/files/search?q=${encodeURIComponent(q)}${scopePath ? `&path=${encodeURIComponent(scopePath)}` : ''}`
        const res = await fetch(url)
        if (id !== searchIdRef.current) return
        if (!res.ok) {
          setSearchResults([])
          return
        }
        const data = (await res.json()) as SearchResponse
        if (id !== searchIdRef.current) return
        setSearchResults(data.entries)
      } catch {
        if (id !== searchIdRef.current) return
        setSearchResults([])
      } finally {
        if (id === searchIdRef.current) setSearching(false)
      }
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, currentPath])

  const isSearching = searchQuery.trim().length >= 2
  const displayEntries = isSearching ? (searchResults ?? []) : entries

  return {
    loading: loading || (searching && searchResults === null),
    loadError,
    entries: displayEntries,
    allEntries: entries,
    isSearching,
    currentPath,
    breadcrumbs,
    uploading,
    uploadProgress,
    dragOver,
    setDragOver,
    searchQuery,
    setSearchQuery,
    navigateTo,
    navigateToIndex,
    uploadFiles,
    deleteEntry,
    moveEntry,
    openFileUrl,
    reload: () => load(currentPath),
  }
}
