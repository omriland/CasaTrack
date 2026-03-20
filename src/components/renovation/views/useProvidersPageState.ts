'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { listProviders } from '@/lib/renovation'
import type { RenovationProvider } from '@/types/renovation'
import { matchesQuery, sectionKey, sortSectionKeys } from '@/components/renovation/providers-shared'

export function useProvidersPageState() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RenovationProvider | null>(null)

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      setItems(await listProviders(project.id))
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => items.filter((p) => matchesQuery(p, search)), [items, search])

  const grouped = useMemo(() => {
    const m = new Map<string, RenovationProvider[]>()
    for (const p of filtered) {
      const k = sectionKey(p.name)
      const list = m.get(k) || []
      list.push(p)
      m.set(k, list)
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    }
    return [...m.entries()].sort((a, b) => sortSectionKeys(a[0], b[0]))
  }, [filtered])

  const openNew = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (p: RenovationProvider) => {
    setEditing(p)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  return {
    project,
    items,
    loading,
    search,
    setSearch,
    modalOpen,
    editing,
    grouped,
    load,
    openNew,
    openEdit,
    closeModal,
  }
}
