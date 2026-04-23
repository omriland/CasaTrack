'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { ChevronDown, Check, Plus, Search, Trash2 } from 'lucide-react'
import type { RenovationNeed, RenovationRoom } from '@/types/renovation'
import { NeedsCopyListButton } from './needs-shared'
import { groupNeedsByRoom, type NeedsRoomGroup } from './needs-page-shared'
import { useNeedsPageState } from './useNeedsPageState'
import { needRoomOklch } from './needs-room-color'

function NeedsRoomDropdown({
  rooms,
  value,
  onChange,
  placeholder = 'No room',
}: {
  rooms: RenovationRoom[]
  value: string | null
  onChange: (roomId: string | null) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, minW: 150 })
  const selected = value ? rooms.find((r) => r.id === value) : null

  const updateMenuPos = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, left: r.left, minW: Math.max(150, r.width) })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuPos()
    const onScroll = () => updateMenuPos()
    const onResize = () => updateMenuPos()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, updateMenuPos])

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const n = e.target as Node
      if (ref.current?.contains(n) || portalRef.current?.contains(n)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const border = open ? 'border-black/[0.18]' : 'border-black/10'
  const bg = selected
    ? `color-mix(in oklch, ${needRoomOklch(selected.name)} 6%, white)`
    : 'oklch(0.97 0 0)'

  const menuContent =
    open && typeof document !== 'undefined' ? (
      <div
        ref={portalRef}
        className="fixed z-[10050] min-w-0 max-h-[min(320px,calc(100dvh-24px))] overflow-y-auto rounded-lg border border-black/[0.09] bg-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.04] animate-fade-in"
        style={{
          top: menuPos.top,
          left: menuPos.left,
          minWidth: menuPos.minW,
          animationDuration: '140ms',
        }}
        role="listbox"
      >
        <button
          type="button"
          onClick={() => {
            onChange(null)
            setOpen(false)
          }}
          className={`w-full px-3 py-[7px] text-left font-[family-name:var(--font-varela-round)] text-[12px] transition-colors hover:bg-[oklch(0.94_0_0)] ${
            !value ? 'bg-[oklch(0.97_0_0)] text-[oklch(0.60_0_0)]' : 'text-[oklch(0.60_0_0)]'
          }`}
        >
          No room
        </button>
        {rooms.map((r) => {
          const dot = needRoomOklch(r.name)
          const active = value === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange(r.id)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-3 py-[7px] text-left font-[family-name:var(--font-varela-round)] text-[12px] text-[oklch(0.13_0_0)] transition-colors hover:bg-[oklch(0.94_0_0)] ${
                active ? 'bg-[oklch(0.97_0_0)]' : ''
              }`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: dot }} />
              <span dir="auto" className="min-w-0 truncate">
                {r.name}
              </span>
            </button>
          )
        })}
      </div>
    ) : null

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 font-[family-name:var(--font-varela-round)] text-[12px] transition-all duration-100 ${border}`}
        style={{
          background: bg,
          color: selected ? needRoomOklch(selected.name) : 'oklch(0.60 0 0)',
        }}
      >
        {selected?.name ?? placeholder}
        <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-70" strokeWidth={2} />
      </button>
      {menuContent && createPortal(menuContent, document.body)}
    </div>
  )
}

function SectionHeader({
  title,
  count,
  doneCount,
  collapsed,
  onToggle,
  dotColor,
}: {
  title: string
  count: number
  doneCount: number
  collapsed: boolean
  onToggle: () => void
  dotColor: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full cursor-pointer select-none items-center gap-2 border-t border-black/[0.06] px-3.5 pb-1.5 pt-2.5 text-left"
    >
      <span
        className="flex shrink-0 text-[oklch(0.60_0_0)] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
      >
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: dotColor }} />
      <span className="min-w-0 flex-1 font-[family-name:var(--font-varela-round)] text-[11px] font-medium uppercase tracking-[0.06em] text-[oklch(0.40_0_0)]">
        {title}
      </span>
      <span className="shrink-0 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[oklch(0.60_0_0)] tabular-nums">
        {doneCount > 0 ? `${doneCount}/${count}` : count}
      </span>
    </button>
  )
}

function NeedRow({
  need,
  rooms,
  onToggle,
  onSaveTitle,
  onChangeRoom,
  onDelete,
}: {
  need: RenovationNeed
  rooms: RenovationRoom[]
  onToggle: () => void
  onSaveTitle: (v: string) => void
  onChangeRoom: (roomId: string | null) => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)
  const hasRoom = Boolean(need.room_id)

  return (
    <div
      className="group animate-needs-fade-up flex items-center gap-2.5 border-b border-black/[0.045] px-3.5 py-2 transition-colors duration-100 hover:bg-[oklch(0.97_0_0)]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        aria-pressed={need.completed}
        onClick={onToggle}
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-all duration-100 ${
          need.completed ? 'border-[oklch(0.13_0_0)] bg-[oklch(0.13_0_0)]' : 'border-black/20 bg-transparent'
        }`}
      >
        {need.completed ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.5} /> : null}
      </button>
      <div className="relative min-w-0 flex-1">
        <input
          dir="auto"
          defaultValue={need.title}
          key={`${need.id}-${need.title}-${need.completed}`}
          onBlur={(e) => onSaveTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          className={`w-full bg-transparent font-assistant text-[14px] leading-[1.4] tracking-normal outline-none ring-0 transition-colors duration-200 placeholder:text-[oklch(0.60_0_0)] focus:ring-0 ${
            need.completed
              ? 'text-[oklch(0.60_0_0)] line-through decoration-black/25'
              : 'text-[oklch(0.13_0_0)]'
          }`}
          style={{ direction: 'rtl' }}
        />
      </div>
      <div className={`shrink-0 transition-opacity duration-100 ${hover || hasRoom ? 'opacity-100' : 'opacity-50'}`}>
        <NeedsRoomDropdown
          rooms={rooms}
          value={need.room_id}
          onChange={(id) => onChangeRoom(id)}
          placeholder="Room"
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        className={`flex shrink-0 rounded p-0.5 text-[oklch(0.60_0_0)] transition-[opacity,color] duration-100 hover:text-[oklch(0.55_0.22_15)] ${
          hover ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Delete"
      >
        <Trash2 className="h-[13px] w-[13px]" strokeWidth={1.5} />
      </button>
    </div>
  )
}

function AddBar({
  rooms,
  newTitle,
  setNewTitle,
  newRoomId,
  setNewRoomId,
  adding,
  onAdd,
}: {
  rooms: RenovationRoom[]
  newTitle: string
  setNewTitle: (s: string) => void
  newRoomId: string
  setNewRoomId: (s: string) => void
  adding: boolean
  onAdd: () => void
}) {
  const [foc, setFoc] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    if (!newTitle.trim()) return
    void onAdd()
  }, [newTitle, onAdd])

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[rgba(0,0,0,0.07)] bg-[oklch(0.97_0_0)] px-3.5 py-2.5">
      <NeedsRoomDropdown
        rooms={rooms}
        value={newRoomId || null}
        onChange={(id) => setNewRoomId(id ?? '')}
        placeholder="Room"
      />
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') {
              setNewTitle('')
              inputRef.current?.blur()
            }
          }}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          dir="rtl"
          placeholder="Add a need… (Enter to save)"
          disabled={adding}
          className="w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 font-assistant text-[14px] text-[oklch(0.13_0_0)] outline-none transition-[border-color,box-shadow] duration-100 placeholder:text-[oklch(0.60_0_0)]"
          style={{
            borderColor: foc ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.10)',
            boxShadow: foc ? '0 0 0 3px rgba(0,0,0,0.05)' : 'none',
          }}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!newTitle.trim() || adding}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border-none px-3.5 py-1.5 font-[family-name:var(--font-varela-round)] text-[13px] transition-colors duration-100 ${
          newTitle.trim() && !adding
            ? 'cursor-pointer bg-[oklch(0.13_0_0)] text-white'
            : 'cursor-default bg-[oklch(0.94_0_0)] text-[oklch(0.60_0_0)]'
        }`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        {adding ? '…' : 'Add'}
      </button>
    </div>
  )
}

export function NeedsDesktop() {
  const {
    project,
    items,
    rooms,
    loading,
    newTitle,
    setNewTitle,
    newRoomId,
    setNewRoomId,
    adding,
    addItem,
    saveTitle,
    saveRoom,
    remove,
    toggleCompleted,
  } = useNeedsPageState()

  const [query, setQuery] = useState('')
  const [filterRoomId, setFilterRoomId] = useState<string | null>(null)
  const [showDone, setShowDone] = useState(true)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [rooms],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((n) => {
      if (!showDone && n.completed) return false
      if (filterRoomId && n.room_id !== filterRoomId) return false
      if (!q) return true
      const roomLabel = n.room?.name || rooms.find((r) => r.id === n.room_id)?.name || ''
      return (
        n.title.toLowerCase().includes(q) ||
        (roomLabel && roomLabel.toLowerCase().includes(q))
      )
    })
  }, [items, showDone, filterRoomId, query, rooms])

  const groups = useMemo(() => groupNeedsByRoom(visible, rooms), [visible, rooms])

  const total = items.length
  const totalDone = useMemo(() => items.filter((n) => n.completed).length, [items])
  const progressPct = total ? Math.round((totalDone / total) * 100) : 0

  const addFromBar = useCallback(() => {
    void addItem()
  }, [addItem])

  const toggleSection = (key: string) => {
    setCollapsed((p) => ({ ...p, [key]: !p[key] }))
  }

  const groupKey = (g: NeedsRoomGroup) => (g.kind === 'room' ? g.roomId : 'unassigned')

  const groupTitle = (g: NeedsRoomGroup) => (g.kind === 'room' ? g.name : 'No room')

  const groupDot = (g: NeedsRoomGroup) =>
    g.kind === 'room' ? needRoomOklch(g.name) : 'oklch(0.55 0 0)'

  if (!project) {
    return (
      <p className="py-16 text-center text-slate-500">
        <Link href="/renovation" className="font-medium text-indigo-600">
          Create a project first
        </Link>
      </p>
    )
  }

  return (
    <div className="flex h-[min(100dvh,1200px)] max-h-[calc(100dvh-5rem)] w-[calc(100%+2rem)] max-w-none min-w-0 -mx-4 flex-col overflow-hidden bg-[oklch(0.995_0_0)] font-[family-name:var(--font-varela-round)] sm:-mx-8 sm:w-[calc(100%+4rem)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[rgba(0,0,0,0.07)] px-6 pb-3.5 pt-5 sm:px-6">
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-varela-round)] text-[22px] font-bold tracking-[-0.02em] text-[oklch(0.13_0_0)]">
              Needs
            </h1>
            <p className="mt-0.5 font-[family-name:var(--font-varela-round)] text-[12px] text-[oklch(0.60_0_0)]">
              What you need from the apartment — add items and link to a room.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-[family-name:var(--font-jetbrains-mono)] text-[12px] text-[oklch(0.60_0_0)] tabular-nums">
              {totalDone}/{total}
            </span>
            <NeedsCopyListButton
              items={visible}
              rooms={rooms}
              disabled={loading || visible.length === 0}
              label="Copy list"
              copiedLabel="Copied!"
              showToast={false}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-transparent px-3 py-1.5 font-[family-name:var(--font-varela-round)] text-[12px] text-[oklch(0.40_0_0)] transition-all duration-100 enabled:hover:bg-black/[0.02] disabled:pointer-events-none disabled:opacity-40"
            />
          </div>
        </div>
        <div className="mb-3.5 h-[3px] overflow-hidden rounded-sm bg-[oklch(0.94_0_0)]">
          <div
            className="h-full rounded-sm bg-[oklch(0.13_0_0)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[oklch(0.60_0_0)]"
              strokeWidth={2}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search needs…"
              className="w-full rounded-lg border border-black/10 bg-white py-1.5 pl-7 pr-2 font-[family-name:var(--font-varela-round)] text-[12px] text-[oklch(0.13_0_0)] outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterRoomId(null)}
              className={`cursor-pointer rounded-full px-2.5 py-0.5 font-[family-name:var(--font-varela-round)] text-[11px] transition-all duration-100 ${
                !filterRoomId
                  ? 'border border-[oklch(0.13_0_0)] bg-[oklch(0.13_0_0)] text-white'
                  : 'border border-black/10 bg-transparent text-[oklch(0.60_0_0)]'
              }`}
            >
              All
            </button>
            {sortedRooms.map((r) => {
              const c = needRoomOklch(r.name)
              const on = filterRoomId === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setFilterRoomId((prev) => (prev === r.id ? null : r.id))}
                  className="cursor-pointer rounded-full border px-2.5 py-0.5 font-[family-name:var(--font-varela-round)] text-[11px] transition-all duration-100"
                  style={{
                    background: on ? c : 'transparent',
                    color: on ? '#fff' : 'oklch(0.60 0 0)',
                    borderColor: on ? c : 'rgba(0,0,0,0.1)',
                  }}
                >
                  {r.name}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowDone((s) => !s)}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-black/10 px-2.5 py-0.5 font-[family-name:var(--font-varela-round)] text-[11px] text-[oklch(0.60_0_0)] transition-all duration-100 ${
              !showDone ? 'bg-[oklch(0.94_0_0)]' : 'bg-transparent'
            }`}
          >
            {showDone ? 'Hide done' : 'Show done'}
          </button>
        </div>
      </div>

      <AddBar
        rooms={rooms}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newRoomId={newRoomId}
        setNewRoomId={setNewRoomId}
        adding={adding}
        onAdd={addFromBar}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-0 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 animate-pulse border-b border-[#f1f3f4]">
                <div className="h-2.5 w-1/2 rounded bg-[oklch(0.94_0_0)]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center font-[family-name:var(--font-varela-round)] text-[13px] text-[oklch(0.60_0_0)]">
            No needs yet — add the first one above.
          </p>
        ) : groups.length === 0 ? (
          <p className="px-6 py-12 text-center font-[family-name:var(--font-varela-round)] text-[13px] text-[oklch(0.60_0_0)]">
            No matches for your filters.
          </p>
        ) : (
          groups.map((group) => {
            const gk = groupKey(group)
            const isCol = !!collapsed[gk]
            const doneC = group.needs.filter((n) => n.completed).length
            return (
              <div key={gk}>
                <SectionHeader
                  title={groupTitle(group)}
                  count={group.needs.length}
                  doneCount={doneC}
                  collapsed={isCol}
                  onToggle={() => toggleSection(gk)}
                  dotColor={groupDot(group)}
                />
                {!isCol &&
                  group.needs.map((need) => (
                    <NeedRow
                      key={need.id}
                      need={need}
                      rooms={rooms}
                      onToggle={() => void toggleCompleted(need)}
                      onSaveTitle={(v) => void saveTitle(need, v)}
                      onChangeRoom={(rid) => void saveRoom(need, rid || '')}
                      onDelete={() => void remove(need.id)}
                    />
                  ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
