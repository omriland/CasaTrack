'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  reorderWishlistItems,
  updateWishlistItem,
  type WishlistItemInput,
} from '@/lib/renovation'
import { calculateWishlistSummary } from '@/lib/renovation-wishlist'
import { useConfirm } from '@/providers/ConfirmProvider'
import type { RenovationWishlistItem } from '@/types/renovation'

export type WishlistLinkDraft = {
  label: string
  url: string
}

export type WishlistFormState = {
  title: string
  description: string
  unitPrice: string
  quantity: string
  links: WishlistLinkDraft[]
}

const emptyForm: WishlistFormState = {
  title: '',
  description: '',
  unitPrice: '',
  quantity: '1',
  links: [{ label: '', url: '' }],
}

function parseMoney(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function parseQuantity(value: string) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

function formToInput(form: WishlistFormState): WishlistItemInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    unit_price: parseMoney(form.unitPrice),
    quantity: parseQuantity(form.quantity),
    links: form.links,
  }
}

export function useWishlistPageState() {
  const { project } = useRenovation()
  const confirmAction = useConfirm()
  const [items, setItems] = useState<RenovationWishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<WishlistFormState>(emptyForm)

  const load = useCallback(async () => {
    if (!project) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setItems(await listWishlistItems(project.id))
    } catch (err) {
      console.error(err)
      setError('Could not load wishlist. Run 23_wishlist.sql and 26_wishlist_purchased.sql in Supabase.')
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(
    () =>
      calculateWishlistSummary(
        items.map(item => ({
          id: item.id,
          unit_price: item.unit_price,
          quantity: item.quantity,
        }))
      ),
    [items]
  )

  const pendingTotal = useMemo(
    () =>
      items
        .filter(item => !item.purchased)
        .reduce((sum, item) => sum + (item.unit_price ?? 0) * (item.quantity ?? 0), 0),
    [items]
  )

  const updateField = (field: keyof Omit<WishlistFormState, 'links'>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateLink = (index: number, field: keyof WishlistLinkDraft, value: string) => {
    setForm(prev => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    }))
  }

  const addLink = () => {
    setForm(prev => ({ ...prev, links: [...prev.links, { label: '', url: '' }] }))
  }

  const removeLink = (index: number) => {
    setForm(prev => {
      const links = prev.links.filter((_, i) => i !== index)
      return { ...prev, links: links.length > 0 ? links : [{ label: '', url: '' }] }
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setError(null)
  }

  const saveItem = async (item: RenovationWishlistItem, patch: Partial<WishlistItemInput>) => {
    const next: WishlistItemInput = {
      title: patch.title ?? item.title,
      description: patch.description ?? item.description,
      unit_price: patch.unit_price ?? item.unit_price,
      quantity: patch.quantity ?? item.quantity,
      purchased: patch.purchased ?? item.purchased,
      sort_order: patch.sort_order ?? item.sort_order,
      links: patch.links ?? item.links.map(link => ({ label: link.label, url: link.url })),
    }

    if (!next.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const saved = await updateWishlistItem(item.id, next)
      setItems(prev => prev.map(candidate => (candidate.id === saved.id ? saved : candidate)))
    } catch (err) {
      console.error(err)
      setError('Could not save wishlist item.')
    } finally {
      setSaving(false)
    }
  }

  const saveItemField = async (
    item: RenovationWishlistItem,
    field: 'title' | 'description' | 'unit_price' | 'quantity',
    value: string
  ) => {
    if (field === 'title') {
      const title = value.trim()
      if (!title || title === item.title) return
      await saveItem(item, { title })
      return
    }

    if (field === 'description') {
      const description = value.trim() || null
      if (description === item.description) return
      await saveItem(item, { description })
      return
    }

    if (field === 'unit_price') {
      const unitPrice = parseMoney(value)
      if (unitPrice === item.unit_price) return
      await saveItem(item, { unit_price: unitPrice })
      return
    }

    const quantity = parseQuantity(value)
    if (quantity === item.quantity) return
    await saveItem(item, { quantity })
  }

  const saveItemLinks = async (item: RenovationWishlistItem, links: WishlistLinkDraft[]) => {
    await saveItem(item, { links })
  }

  const createBlankItemAt = async (insertIndex: number): Promise<RenovationWishlistItem | null> => {
    if (!project) return null
    setSaving(true)
    setError(null)
    try {
      const saved = await createWishlistItem(project.id, {
        title: '',
        description: null,
        unit_price: 0,
        quantity: 1,
        sort_order: insertIndex,
        links: [],
      })

      const next = [...items]
      next.splice(insertIndex, 0, saved)
      const ordered = next.map((item, index) => ({ ...item, sort_order: index }))
      setItems(ordered)
      await reorderWishlistItems(ordered.map(item => item.id))
      return { ...saved, sort_order: insertIndex }
    } catch (err) {
      console.error(err)
      setError('Could not create wishlist row.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const submit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!project || !form.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const input = formToInput(form)
      const saved = await createWishlistItem(project.id, input)

      setItems(prev => [...prev, saved])
      resetForm()
    } catch (err) {
      console.error(err)
      setError('Could not save wishlist item.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: RenovationWishlistItem) => {
    if (!(await confirmAction(`Remove "${item.title}" from the wishlist?`))) return
    try {
      await deleteWishlistItem(item.id)
      setItems(prev => prev.filter(candidate => candidate.id !== item.id))
    } catch (err) {
      console.error(err)
      setError('Could not delete wishlist item.')
    }
  }

  const togglePurchased = async (item: RenovationWishlistItem) => {
    await saveItem(item, { purchased: !item.purchased })
  }

  return {
    project,
    items,
    loading,
    saving,
    error,
    form,
    summary,
    pendingTotal,
    rowTotals: summary.rowTotals,
    updateField,
    updateLink,
    addLink,
    removeLink,
    resetForm,
    saveItemField,
    saveItemLinks,
    createBlankItemAt,
    submit,
    remove,
    togglePurchased,
  }
}
