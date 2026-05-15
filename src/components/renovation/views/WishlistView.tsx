'use client'

import Link from 'next/link'
import { useEffect, useState, type KeyboardEvent } from 'react'
import { ChevronDown, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { formatIls } from '@/lib/renovation-format'
import type { RenovationWishlistItem } from '@/types/renovation'
import { useWishlistPageState, type WishlistLinkDraft } from './useWishlistPageState'

function linkLabel(link: { label: string | null; url: string }) {
  if (link.label?.trim()) return link.label
  try {
    return new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    return link.url
  }
}

function editableInputClass(extra = '') {
  return [
    'w-full rounded-none border-0 bg-transparent px-2 py-2 text-[14px] text-slate-900 outline-none',
    'transition-colors placeholder:text-slate-400 hover:bg-slate-50 focus:bg-indigo-50/60 focus:ring-0',
    extra,
  ].join(' ')
}

function commitOnEnter(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    event.currentTarget.blur()
  }
}

function LinksEditor({
  item,
  onSave,
}: {
  item: RenovationWishlistItem
  onSave: (item: RenovationWishlistItem, links: WishlistLinkDraft[]) => Promise<void>
}) {
  const [drafts, setDrafts] = useState<WishlistLinkDraft[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDrafts(
      item.links.length > 0
        ? item.links.map(link => ({ label: link.label ?? '', url: link.url }))
        : [{ label: '', url: '' }]
    )
  }, [item])

  const updateDraft = (index: number, field: keyof WishlistLinkDraft, value: string) => {
    setDrafts(prev => prev.map((draft, i) => (i === index ? { ...draft, [field]: value } : draft)))
  }

  const removeDraft = (index: number) => {
    setDrafts(prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [{ label: '', url: '' }]
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(item, drafts)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Links</p>
        <button
          type="button"
          onClick={() => setDrafts(prev => [...prev, { label: '', url: '' }])}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add link
        </button>
      </div>

      <div className="space-y-2">
        {drafts.map((draft, index) => (
          <div key={index} className="grid grid-cols-[180px_minmax(320px,1fr)_44px] gap-2">
            <input
              dir="auto"
              value={draft.label}
              onChange={event => updateDraft(index, 'label', event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-start text-[14px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Label"
            />
            <input
              dir="ltr"
              value={draft.url}
              onChange={event => updateDraft(index, 'url', event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="https://..."
              type="url"
            />
            <button
              type="button"
              onClick={() => removeDraft(index)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Remove link"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="min-h-10 rounded-xl bg-slate-900 px-4 text-[13px] font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save links'}
        </button>
      </div>
    </div>
  )
}

function LinksCell({
  item,
  expanded,
  onToggle,
}: {
  item: RenovationWishlistItem
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex min-h-[44px] w-full items-center gap-1.5 px-2 py-1.5 transition hover:bg-slate-50">
      <div className="flex min-w-0 flex-1 flex-wrap gap-1">
        {item.links.length === 0 ? (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-dashed border-slate-200 px-2 py-1 text-[12px] font-semibold text-slate-400 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            Add links
          </button>
        ) : (
          item.links.slice(0, 2).map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-[150px] items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              dir="auto"
            >
              <span className="truncate">{linkLabel(link)}</span>
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
            </a>
          ))
        )}
        {item.links.length > 2 && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[12px] font-semibold text-slate-500">
            +{item.links.length - 2}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label={expanded ? 'Collapse link editor' : 'Edit links'}
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

function InsertRowControl({
  index,
  disabled,
  onInsert,
}: {
  index: number
  disabled: boolean
  onInsert: (index: number) => void
}) {
  return (
    <div className="group relative h-0">
      <div className="absolute inset-x-0 top-[-10px] z-10 flex h-5 items-center justify-center">
        <div className="h-px flex-1 bg-transparent transition-colors group-hover:bg-indigo-200" />
        <button
          type="button"
          onClick={() => onInsert(index)}
          disabled={disabled}
          className="mx-2 inline-flex h-6 w-6 scale-90 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 opacity-0 shadow-sm transition group-hover:scale-100 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          aria-label={`Insert row at position ${index + 1}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="h-px flex-1 bg-transparent transition-colors group-hover:bg-indigo-200" />
      </div>
    </div>
  )
}

function WishlistTable({ mobile }: { mobile: boolean }) {
  const {
    project,
    items,
    loading,
    saving,
    error,
    summary,
    rowTotals,
    saveItemField,
    saveItemLinks,
    createBlankItemAt,
    remove,
  } = useWishlistPageState()
  const [expandedLinksId, setExpandedLinksId] = useState<string | null>(null)
  const [focusItemId, setFocusItemId] = useState<string | null>(null)

  const tableWidthClass = mobile ? 'min-w-[980px]' : 'w-full'
  const gridColsClass = mobile
    ? 'grid-cols-[220px_260px_260px_120px_90px_130px_72px]'
    : 'grid-cols-[minmax(150px,1.15fr)_minmax(170px,1.25fr)_minmax(170px,1fr)_112px_84px_118px_64px]'

  if (!project) {
    return (
      <p className="py-16 text-center text-slate-500">
        <Link href="/renovation" className="font-semibold text-indigo-600">
          Create a project first
        </Link>
      </p>
    )
  }

  const insertRow = async (index: number) => {
    const item = await createBlankItemAt(index)
    if (item) setFocusItemId(item.id)
  }

  return (
    <div className="space-y-4">
      <header className={mobile ? 'space-y-3' : 'flex items-end justify-between gap-4'}>
        <div>
          <h1
            className={
              mobile
                ? 'text-[24px] font-bold tracking-tight text-slate-900'
                : 'text-[30px] font-bold tracking-tight text-slate-900'
            }
          >
            Wishlist
          </h1>
          <p className="mt-1 text-[14px] text-slate-500">
            English interface. Hebrew item text is supported inside the cells.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Total</p>
          <p className="mt-1 font-[family-name:var(--font-jetbrains-mono)] text-[24px] font-bold tabular-nums text-slate-950">
            {formatIls(summary.total)}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div
        className={`${mobile ? 'overflow-x-auto' : 'overflow-visible'} rounded-2xl border border-slate-200 bg-white shadow-sm`}
      >
        <div className={tableWidthClass}>
          <div
            dir="rtl"
            className={`grid ${gridColsClass} border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500`}
          >
            <div className="px-3 py-2 text-center">Item</div>
            <div className="px-3 py-2 text-center">Description</div>
            <div className="px-3 py-2 text-center">Links</div>
            <div className="px-3 py-2 text-center">Unit price</div>
            <div className="px-3 py-2 text-center">Amount</div>
            <div className="px-3 py-2 text-center">Total</div>
            <div className="px-3 py-2 text-center">Actions</div>
          </div>

          {loading ? (
            <div className="space-y-px bg-slate-100">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 animate-pulse bg-white" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[14px] font-semibold text-slate-500">
              <button
                type="button"
                onClick={() => void insertRow(0)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-[14px] font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add first row
              </button>
            </div>
          ) : (
            <>
              <InsertRowControl
                index={0}
                disabled={saving}
                onInsert={index => void insertRow(index)}
              />
              {items.map((item, index) => {
                const expanded = expandedLinksId === item.id
                return (
                  <div key={item.id} className="border-b border-slate-100 last:border-b-0">
                    <div dir="rtl" className={`grid ${gridColsClass}`}>
                      <input
                        key={`${item.id}-title-${item.title}`}
                        dir="auto"
                        defaultValue={item.title}
                        ref={node => {
                          if (node && focusItemId === item.id) {
                            node.focus()
                            setFocusItemId(null)
                          }
                        }}
                        onBlur={event => void saveItemField(item, 'title', event.target.value)}
                        onKeyDown={commitOnEnter}
                        className={editableInputClass('font-semibold text-start')}
                        placeholder="New item..."
                      />
                      <textarea
                        key={`${item.id}-description-${item.description ?? ''}`}
                        dir="auto"
                        defaultValue={item.description ?? ''}
                        onBlur={event =>
                          void saveItemField(item, 'description', event.target.value)
                        }
                        onKeyDown={commitOnEnter}
                        className={editableInputClass(
                          'min-h-[44px] resize-none text-start leading-snug'
                        )}
                      />
                      <LinksCell
                        item={item}
                        expanded={expanded}
                        onToggle={() => setExpandedLinksId(expanded ? null : item.id)}
                      />
                      <input
                        key={`${item.id}-price-${item.unit_price}`}
                        dir="ltr"
                        defaultValue={item.unit_price || ''}
                        onBlur={event => void saveItemField(item, 'unit_price', event.target.value)}
                        onKeyDown={commitOnEnter}
                        className={editableInputClass(
                          'text-right font-[family-name:var(--font-jetbrains-mono)] tabular-nums'
                        )}
                        inputMode="decimal"
                        type="number"
                        min="0"
                      />
                      <input
                        key={`${item.id}-quantity-${item.quantity}`}
                        dir="ltr"
                        defaultValue={item.quantity}
                        onBlur={event => void saveItemField(item, 'quantity', event.target.value)}
                        onKeyDown={commitOnEnter}
                        className={editableInputClass(
                          'text-right font-[family-name:var(--font-jetbrains-mono)] tabular-nums'
                        )}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                      />
                      <div className="flex items-center justify-end px-3 font-[family-name:var(--font-jetbrains-mono)] text-[14px] font-bold tabular-nums text-slate-950">
                        {formatIls(rowTotals[item.id] ?? 0)}
                      </div>
                      <div className="flex items-center justify-end px-2">
                        <button
                          type="button"
                          onClick={() => void remove(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Delete ${item.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {expanded && <LinksEditor item={item} onSave={saveItemLinks} />}
                    <InsertRowControl
                      index={index + 1}
                      disabled={saving}
                      onInsert={insertAt => void insertRow(insertAt)}
                    />
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function WishlistView({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={`animate-fade-in ${mobile ? 'pb-28' : ''}`}>
      <WishlistTable mobile={mobile} />
    </div>
  )
}
