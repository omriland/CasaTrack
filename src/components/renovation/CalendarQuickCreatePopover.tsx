'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronDown, MapPin, Users, X } from 'lucide-react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { createCalendarEvent } from '@/lib/renovation'
import type { QuickCreateAnchor } from '@/components/renovation/renovation-fullcalendar-map'
import type { RenovationProvider } from '@/types/renovation'

const CARD_W = 360
const MARGIN = 12

type Props = {
  anchor: QuickCreateAnchor
  projectId: string
  providers: RenovationProvider[]
  onClose: () => void
  onCreated: () => void
  /** Open the full editor instead of a quick save. Title carried over. */
  onMoreOptions: (initialTitle: string) => void
}

function computeStyle(rect: DOMRect): CSSProperties {
  const left = Math.max(
    MARGIN,
    Math.min(rect.left + rect.width / 2 - CARD_W / 2, window.innerWidth - CARD_W - MARGIN),
  )
  const spaceBelow = window.innerHeight - MARGIN - rect.bottom
  const spaceAbove = rect.top - MARGIN
  const placeBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove
  if (placeBelow) {
    return { left, top: Math.min(rect.bottom + 6, window.innerHeight - 220 - MARGIN), width: CARD_W }
  }
  return {
    left,
    top: Math.max(MARGIN, rect.top - 6),
    width: CARD_W,
    transform: 'translateY(-100%)',
  }
}

export function CalendarQuickCreatePopover({
  anchor,
  projectId,
  providers,
  onClose,
  onCreated,
  onMoreOptions,
}: Props) {
  const { activeProfile } = useRenovation()
  const [title, setTitle] = useState('')
  const [providerId, setProviderId] = useState<string>('')
  const [providerOpen, setProviderOpen] = useState(false)
  const [providerQuery, setProviderQuery] = useState('')
  const [providerHighlight, setProviderHighlight] = useState(0)
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const providerRef = useRef<HTMLDivElement>(null)
  const providerInputRef = useRef<HTMLInputElement>(null)

  const sortedProviders = useMemo(
    () => [...providers].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [providers],
  )

  const filteredProviders = useMemo(() => {
    const q = providerQuery.trim().toLowerCase()
    if (!q) return sortedProviders
    return sortedProviders.filter((p) => {
      const haystack = `${p.name} ${p.description ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [sortedProviders, providerQuery])

  // Keep the highlight in bounds whenever the filtered list changes.
  useEffect(() => {
    setProviderHighlight((h) => Math.min(h, Math.max(0, filteredProviders.length - 1)))
  }, [filteredProviders.length])

  const style = useMemo(() => computeStyle(anchor.rect), [anchor.rect])

  // Autofocus on mount.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [])

  // Esc closes; click outside closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    const onPointer = (e: MouseEvent) => {
      const node = e.target as Node
      if (rootRef.current?.contains(node)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [onClose])

  // Close provider menu on outside click within the popover.
  useEffect(() => {
    if (!providerOpen) return
    const onClick = (e: MouseEvent) => {
      const node = e.target as Node
      if (providerRef.current?.contains(node)) return
      setProviderOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [providerOpen])

  const save = async () => {
    const t = title.trim()
    if (!t) {
      setError('Add a title')
      inputRef.current?.focus()
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createCalendarEvent(projectId, {
        event_type: providerId ? 'provider_meeting' : 'general',
        title: t,
        body: null,
        address: address.trim() || null,
        provider_id: providerId || null,
        created_by_member_id: activeProfile?.id ?? null,
        is_all_day: anchor.isAllDay,
        start_date: anchor.isAllDay ? anchor.startIso.slice(0, 10) : null,
        end_date: anchor.isAllDay ? anchor.startIso.slice(0, 10) : null,
        starts_at: anchor.isAllDay ? null : anchor.startIso,
        ends_at: anchor.isAllDay ? null : anchor.endIso,
      })
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      void save()
    }
  }

  const selectedProvider = providerId ? sortedProviders.find((p) => p.id === providerId) ?? null : null

  // When the provider menu opens (or the query changes), reset the highlight.
  const openProviderMenu = () => {
    setProviderOpen(true)
    setProviderHighlight(0)
  }

  const commitProviderSelection = (id: string) => {
    setProviderId(id)
    setProviderOpen(false)
    setProviderQuery('')
  }

  const onProviderInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!providerOpen) openProviderMenu()
      setProviderHighlight((h) => Math.min(h + 1, filteredProviders.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setProviderHighlight((h) => Math.max(h - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (providerOpen) {
        const pick = filteredProviders[providerHighlight]
        if (pick) commitProviderSelection(pick.id)
        else setProviderOpen(false)
        return
      }
      void save()
      return
    }
    if (e.key === 'Escape' && providerOpen) {
      e.preventDefault()
      e.stopPropagation()
      setProviderOpen(false)
      setProviderQuery('')
      return
    }
    if (e.key === 'Backspace' && !providerQuery && providerId) {
      e.preventDefault()
      setProviderId('')
      openProviderMenu()
    }
  }

  const onAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      void save()
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div ref={rootRef} className="reno-quickcreate" style={style} role="dialog" aria-label="Quick add event">
      <div className="flex flex-row-reverse items-start gap-2 border-b border-slate-100 px-4 py-3">
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Add title"
            dir="auto"
            className="w-full bg-transparent text-right text-[16px] font-semibold text-slate-900 outline-none placeholder:font-medium placeholder:text-slate-400"
          />
          <p className="mt-0.5 text-right text-[12px] font-medium text-slate-500" dir="auto">
            {anchor.whenLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-ml-1 -mt-1 grid h-7 w-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 px-4 py-3">
        {sortedProviders.length > 0 && (
          <div className="relative" ref={providerRef}>
            <div
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={providerOpen}
              aria-controls="reno-quickcreate-provider-list"
              onClick={() => {
                if (!providerOpen) openProviderMenu()
                providerInputRef.current?.focus()
              }}
              className={`flex w-full flex-row-reverse items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-colors ${
                providerOpen ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4 shrink-0 text-slate-500" />
              {selectedProvider && !providerOpen ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    openProviderMenu()
                    providerInputRef.current?.focus()
                  }}
                  className="flex-1 truncate text-right text-[13px] font-semibold text-slate-800"
                  dir="auto"
                  aria-label="Change provider"
                >
                  {selectedProvider.name}
                </button>
              ) : (
                <input
                  ref={providerInputRef}
                  value={providerQuery}
                  onChange={(e) => {
                    setProviderQuery(e.target.value)
                    if (!providerOpen) setProviderOpen(true)
                  }}
                  onFocus={() => openProviderMenu()}
                  onKeyDown={onProviderInputKeyDown}
                  placeholder={selectedProvider ? selectedProvider.name : 'Add provider (optional)'}
                  dir="auto"
                  aria-autocomplete="list"
                  aria-controls="reno-quickcreate-provider-list"
                  className="flex-1 bg-transparent text-right text-[13px] font-medium text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-500"
                />
              )}
              {selectedProvider && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProviderId('')
                    setProviderQuery('')
                    providerInputRef.current?.focus()
                  }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear provider"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform"
                style={{ transform: providerOpen ? 'rotate(180deg)' : undefined }}
              />
            </div>
            {providerOpen && (
              <div
                id="reno-quickcreate-provider-list"
                role="listbox"
                className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-[0_10px_30px_-8px_rgba(15,23,42,0.18)]"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={!providerId}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitProviderSelection('')}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-[13px] transition-colors ${!providerId ? 'bg-indigo-50 font-semibold text-indigo-700' : 'font-medium text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="flex-1 text-right">None — general event</span>
                </button>
                {filteredProviders.length === 0 ? (
                  <div className="px-3 py-2 text-right text-[12px] font-medium text-slate-400" dir="auto">
                    No providers match “{providerQuery}”
                  </div>
                ) : (
                  filteredProviders.map((pr, idx) => {
                    const isSelected = providerId === pr.id
                    const isHighlighted = idx === providerHighlight
                    return (
                      <button
                        key={pr.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setProviderHighlight(idx)}
                        onClick={() => commitProviderSelection(pr.id)}
                        className={`flex w-full flex-row-reverse items-center gap-2 rounded-lg px-3 py-2 text-right text-[13px] transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 font-semibold text-indigo-700'
                            : isHighlighted
                              ? 'bg-slate-100 font-medium text-slate-800'
                              : 'font-medium text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-700">
                          {pr.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate" dir="auto">{pr.name}</span>
                        {pr.description && (
                          <span className="mr-auto truncate text-[11px] font-medium text-slate-400" dir="auto">
                            {pr.description}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}

        <label className="flex flex-row-reverse items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 hover:bg-slate-50">
          <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={onAddressKeyDown}
            placeholder="Add address (optional)"
            dir="auto"
            className="flex-1 bg-transparent text-right text-[13px] font-medium text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-500"
          />
        </label>

        <p className="px-1 text-right text-[11px] font-medium text-slate-400">
          Press <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[10px]">Enter</kbd> to save ·{' '}
          <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-mono text-[10px]">Esc</kbd> to cancel
        </p>

        {error && <p className="text-right text-[12px] font-semibold text-rose-600" role="alert">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
        <button
          type="button"
          onClick={() => onMoreOptions(title.trim())}
          className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          More options
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-[13px] font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
