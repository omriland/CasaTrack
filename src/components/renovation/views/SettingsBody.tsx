'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { formatIls } from '@/lib/renovation-format'
import { BudgetLineRoomsPicker } from '@/components/renovation/BudgetLineRoomsPicker'
import {
  createLabel,
  updateLabel,
  createGalleryTag,
  createRoom,
  createTeamMember,
  deleteBudgetLine,
  deleteGalleryTag,
  deleteLabel,
  deleteRoom,
  deleteTeamMember,
  setBudgetLineRooms,
  updateBudgetLine,
} from '@/lib/renovation'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'
import { RoomNotesMarkdownEditor } from '@/components/renovation/RoomNotesMarkdownEditor'
import { profileCanViewBudget } from '@/lib/renovation-profile'
import type { RenovationSettingsPageCtx } from './useRenovationSettingsPageState'

/** Matches Needs / Providers / Task modal: Varela + oklch, 8px radius; centered column for readable width */
const S = {
  page: 'w-full min-w-0 max-w-2xl mx-auto bg-[oklch(0.995_0_0)]',
  h1: "font-[family-name:var(--font-varela-round)] text-[24px] sm:text-[28px] font-bold tracking-[-0.02em] text-[oklch(0.13_0_0)]",
  sub: 'mt-1 max-w-md text-[12px] sm:text-[13px] font-medium text-[oklch(0.60_0_0)]',
  card: 'overflow-hidden rounded-lg border border-black/[0.08] bg-white',
  head: 'border-b border-black/[0.06] bg-[oklch(0.98_0_0)]',
  h2: "font-[family-name:var(--font-varela-round)] text-[17px] font-bold text-[oklch(0.13_0_0)]",
  desc: 'mt-0.5 text-[13px] text-[oklch(0.60_0_0)]',
  label: 'mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.07em] text-[oklch(0.60_0_0)]',
  inp: (h: string) =>
    `w-full ${h} rounded-lg border border-black/10 bg-white px-3.5 text-[15px] text-[oklch(0.13_0_0)] outline-none transition-shadow placeholder:text-[oklch(0.60_0_0)] focus:border-black/20 focus:ring-2 focus:ring-blue-500/20`,
  btn: (h: string) =>
    `${h} inline-flex items-center justify-center rounded-lg bg-[oklch(0.13_0_0)] px-5 text-[14px] font-semibold text-white shadow-[0_0_0_1px_rgba(59,130,246,0.25)] transition-[opacity,transform] hover:opacity-95 active:scale-[0.99] disabled:opacity-50`,
  row: 'transition-colors hover:bg-[oklch(0.985_0_0)]',
  link: 'text-[13px] font-semibold text-[oklch(0.40_0_0)] transition-colors hover:text-[oklch(0.13_0_0)]',
  danger: 'text-[13px] font-semibold text-rose-600 transition-colors hover:bg-rose-50/80 rounded-lg px-2 min-h-10',
} as const

const TASK_LABEL_SWATCHES = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
] as const

export function SettingsBody({ ctx, mobile }: { ctx: RenovationSettingsPageCtx; mobile: boolean }) {
  const { activeProfile } = useRenovation()
  const {
    project,
    archived,
    members,
    rooms,
    labels,
    gTags,
    lines,
    spent,
    plannedTotal,
    total,
    setTotal,
    cont,
    setCont,
    loading,
    newCat,
    setBudgetCat,
    newAmt,
    setBudgetAmt,
    nm,
    setNm,
    roomName,
    setRoomName,
    roomNotes,
    setRoomNotes,
    lbName,
    setLbName,
    lbColor,
    setLbColor,
    gtName,
    setGtName,
    projNotes,
    setProjNotes,
    projAddr,
    setProjAddr,
    load,
    saveProjectMeta,
    saveTotals,
    addBudgetLine,
    lineSum,
    cap,
    archiveCurrent,
  } = ctx

  const [openColorLabelId, setOpenColorLabelId] = useState<string | null>(null)
  const openLabelRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (openColorLabelId == null) return
    const onDoc = (e: MouseEvent) => {
      if (openLabelRowRef.current && !openLabelRowRef.current.contains(e.target as Node)) {
        setOpenColorLabelId(null)
      }
    }
    document.addEventListener('mousedown', onDoc, true)
    return () => document.removeEventListener('mousedown', onDoc, true)
  }, [openColorLabelId])

  const sec = mobile ? 'p-4' : 'px-5 py-5'
  const headPad = mobile ? 'p-4' : 'px-5 py-4'
  const inp = mobile ? 'min-h-[48px] py-3' : 'h-12 py-0'
  const flexRow = mobile ? 'flex-col' : 'flex-row'
  const grid2 = mobile ? 'grid-cols-1' : 'grid-cols-2'

  if (!project) {
    return (
      <div className={`${S.page} mx-auto ${mobile ? 'pt-4' : 'pt-6'} text-center`}>
        <p className="text-[oklch(0.50_0_0)]">No active project.</p>
        <a href="/renovation" className={`${S.link} mt-2 inline-block`}>
          Start one
        </a>
        {archived.length > 0 && (
          <div className="mx-auto mt-10 max-w-md text-left">
            <p className={`${S.label} text-center`}>Archived</p>
            <ul className="overflow-hidden rounded-lg border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
              {archived.map((p) => (
                <li key={p.id} className="p-4 text-[15px] text-[oklch(0.13_0_0)]" dir="auto">
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${S.page} space-y-4 px-4 sm:px-0 animate-fade-in-up ${mobile ? 'pb-28' : 'pb-8'}`}>
      <header className={`flex ${flexRow} ${mobile ? 'items-start' : 'items-end'} justify-between gap-3`}>
        <div>
          <h1 className={S.h1}>Settings</h1>
          <p className={S.sub}>Team, labels, budget, and project details in one place.</p>
        </div>
      </header>

      <section id="budget" className={`${S.card} ${sec} space-y-4 scroll-mt-4`}>
        <h2 className={S.h2}>Details</h2>
        <div>
          <label className={S.label}>Notes</label>
          <textarea
            dir="auto"
            value={projNotes}
            onChange={(e) => setProjNotes(e.target.value)}
            onBlur={saveProjectMeta}
            rows={mobile ? 4 : 2}
            className={`${S.inp(mobile ? 'min-h-[100px] py-3' : 'min-h-[72px] py-2.5')} resize-none`}
          />
        </div>
        <div>
          <label className={S.label}>Address</label>
          <input
            dir="auto"
            value={projAddr}
            onChange={(e) => setProjAddr(e.target.value)}
            onBlur={saveProjectMeta}
            className={S.inp(inp)}
          />
        </div>
      </section>

      {profileCanViewBudget(activeProfile?.name) && (
        <section className={`${S.card} ${sec} space-y-4`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className={S.h2}>Budget totals</h2>
              <Link
                href="/renovation/budget"
                className={`${S.link} shrink-0 text-[14px]`}
              >
                Vendor budget vs actual →
              </Link>
            </div>
            <div className={`grid ${grid2} gap-4`}>
              <div>
                <label className={S.label}>Total budget (₪)</label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  onBlur={saveTotals}
                  className={`${S.inp(inp)} tabular-nums text-[16px]`}
                />
              </div>
              <div>
                <label className={S.label}>Contingency (₪)</label>
                <input
                  type="number"
                  value={cont}
                  onChange={(e) => setCont(e.target.value)}
                  onBlur={saveTotals}
                  className={`${S.inp(inp)} tabular-nums text-[16px]`}
                />
              </div>
            </div>
            <div className={`flex ${flexRow} ${mobile ? '' : 'sm:justify-between'} gap-2 border-t border-black/[0.06] pt-3 text-[14px] text-[oklch(0.50_0_0)]`}>
              <p>
                Effective cap: <span className="font-semibold text-[oklch(0.13_0_0)] tabular-nums">{formatIls(cap)}</span>
              </p>
              <p>
                Spent: <span className="font-semibold text-[oklch(0.13_0_0)] tabular-nums">{loading ? '…' : formatIls(spent)}</span>
              </p>
            </div>
            {plannedTotal > 0 && (
              <p className="pt-0.5 text-[14px] text-[oklch(0.50_0_0)]">
                Planned (upcoming):{' '}
                <span className="font-semibold text-amber-900/90 tabular-nums">{loading ? '…' : formatIls(plannedTotal)}</span>
              </p>
            )}
        </section>
      )}

      <section
        id="budget-by-category"
        className={`${S.card} scroll-mt-4`}
      >
            <div className={`${headPad} ${S.head} flex items-start justify-between gap-4`}>
              <div>
                <h2 className={S.h2}>Budget by category</h2>
                <p className={S.desc}>Allocate budget to specific work areas.</p>
              </div>
              {profileCanViewBudget(activeProfile?.name) &&
                lineSum > 0 &&
                cap > 0 &&
                Math.abs(lineSum - cap) > 1 && (
                <span className="shrink-0 rounded border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">Mismatch</span>
              )}
            </div>
            <div className="divide-y divide-black/[0.045]">
              <div className="hidden border-b border-black/[0.06] bg-[oklch(0.985_0_0)] sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_7rem_auto] sm:items-center sm:gap-3 sm:px-5 sm:py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.60_0_0)]">Category</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.60_0_0)]">Rooms</span>
                <span className="text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.60_0_0)]">Amount (₪)</span>
                <span className="sr-only">Actions</span>
              </div>
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`${S.row} flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_7rem_auto] sm:items-center sm:gap-3 ${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-3.5'}`}
                >
                  <input
                    dir="auto"
                    defaultValue={line.category_name}
                    onBlur={async (e) => {
                      const v = e.target.value.trim()
                      if (v && v !== line.category_name) await updateBudgetLine(line.id, { category_name: v })
                      await load()
                    }}
                    className={`min-w-0 w-full ${S.inp(inp)} border border-transparent bg-transparent font-medium hover:border-black/10 focus:border-black/15 focus:bg-white`}
                  />
                  <div className="flex min-w-0 flex-col gap-1 sm:gap-0">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[oklch(0.60_0_0)] sm:hidden">Rooms</span>
                    <BudgetLineRoomsPicker
                      rooms={rooms}
                      selectedIds={line.room_ids ?? []}
                      onCommit={async (next) => {
                        await setBudgetLineRooms(line.id, next)
                        await load()
                      }}
                    />
                  </div>
                  <div className={`flex items-center gap-3 ${mobile ? 'w-full' : ''}`}>
                    <input
                      type="number"
                      defaultValue={line.amount_allocated}
                      onBlur={async (e) => {
                        const v = Number(e.target.value)
                        if (!Number.isNaN(v)) await updateBudgetLine(line.id, { amount_allocated: v })
                        await load()
                      }}
                      className={`${mobile ? 'flex-1' : 'w-full sm:w-32'} ${S.inp(inp)} tabular-nums text-right`}
                    />
                    <button type="button" onClick={() => deleteBudgetLine(line.id).then(load)} className={S.danger}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div
                className={`${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-4'} flex flex-col gap-3 border-t border-black/[0.06] bg-[oklch(0.985_0_0)] sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_7rem_auto] sm:items-center sm:gap-3`}
              >
                <input
                  dir="auto"
                  placeholder="Ex: Kitchen Cabinets"
                  value={newCat}
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className={`min-w-0 w-full ${S.inp(inp)}`}
                />
                <p className="hidden text-[12px] leading-snug text-[oklch(0.60_0_0)] sm:block sm:px-1">
                  Save the line, then assign rooms.
                </p>
                <input
                  type="number"
                  placeholder="₪ amount"
                  value={newAmt}
                  onChange={(e) => setBudgetAmt(e.target.value)}
                  className={`w-full sm:w-32 ${S.inp(inp)} tabular-nums`}
                />
                <button type="button" onClick={addBudgetLine} className={`${S.btn(inp)} w-full shrink-0 whitespace-nowrap sm:w-auto`}>
                  Add item
                </button>
              </div>
            </div>
      </section>

      <section className={S.card}>
        <div className={`${headPad} ${S.head}`}>
          <h2 className={S.h2}>Team</h2>
          <p className={S.desc}>Assign tasks to people.</p>
        </div>
        <div className="divide-y divide-black/[0.045]">
          {members.map((m) => (
            <div key={m.id} className={`${S.row} flex items-center justify-between gap-3 ${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-3.5'}`}>
              <div className="flex min-w-0 items-center gap-3">
                <MemberAvatarTile
                  name={m.name}
                  className="h-11 w-11 shrink-0 rounded-lg text-[13px] font-extrabold shadow-inner"
                />
                <div className="min-w-0" dir="auto">
                  <p className="text-[16px] font-semibold text-[oklch(0.13_0_0)]">{m.name}</p>
                  {(m.phone || m.email) && <p className="mt-0.5 truncate text-[13px] text-[oklch(0.50_0_0)]">{m.phone || m.email}</p>}
                </div>
              </div>
              <button type="button" onClick={() => deleteTeamMember(m.id).then(load)} className={`${S.danger} shrink-0`}>
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-4'} space-y-3 border-t border-black/[0.06] bg-[oklch(0.985_0_0)]`}>
            <input
              dir="auto"
              placeholder="Name"
              value={nm.name}
              onChange={(e) => setNm((s) => ({ ...s, name: e.target.value }))}
              className={S.inp(inp)}
            />
            <div className={`flex ${flexRow} gap-3`}>
              <input
                placeholder="Phone"
                value={nm.phone}
                onChange={(e) => setNm((s) => ({ ...s, phone: e.target.value }))}
                className={`flex-1 ${S.inp(inp)}`}
              />
              <input
                placeholder="Email"
                value={nm.email}
                onChange={(e) => setNm((s) => ({ ...s, email: e.target.value }))}
                className={`flex-1 ${S.inp(inp)}`}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!nm.name.trim()) return
                await createTeamMember(project.id, nm)
                setNm({ name: '', phone: '', email: '' })
                await load()
              }}
              className={`w-full ${S.btn(inp)}`}
            >
              Add person
            </button>
          </div>
        </div>
      </section>

      <section className={S.card}>
        <div className={`${headPad} ${S.head} flex flex-wrap items-start justify-between gap-4`}>
          <div>
            <h2 className={S.h2}>Rooms</h2>
            <p className={`${S.desc} max-w-sm`}>Link tasks and photos to rooms; add a paragraph per room.</p>
          </div>
          <Link
            href="/renovation/rooms"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white px-3.5 text-[13px] font-semibold text-[oklch(0.30_0_0)] transition-colors hover:border-black/20 hover:bg-[oklch(0.99_0_0)]"
          >
            View rooms →
          </Link>
        </div>
        <div className="divide-y divide-black/[0.045]">
          {rooms.map((r) => (
            <div key={r.id} className={`${S.row} flex items-center justify-between ${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-3.5'}`}>
              <span className="text-[16px] font-semibold text-[oklch(0.13_0_0)]" dir="auto">
                {r.name}
              </span>
              <button type="button" onClick={() => deleteRoom(r.id).then(load)} className={S.danger}>
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-4'} space-y-3 border-t border-black/[0.06] bg-[oklch(0.985_0_0)]`}>
            <input
              dir="auto"
              placeholder="Room name (e.g. Kitchen, Bath)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={S.inp(inp)}
            />
            <RoomNotesMarkdownEditor
              instanceKey="settings-add-room"
              variant="compact"
              placeholder="Optional notes for this room…"
              value={roomNotes}
              onChange={setRoomNotes}
              className="w-full"
            />
            <button
              type="button"
              onClick={async () => {
                if (!roomName.trim()) return
                await createRoom(project.id, roomName.trim(), roomNotes.trim() || null)
                setRoomName('')
                setRoomNotes('')
                await load()
              }}
              className={S.btn(inp)}
            >
              Add room
            </button>
          </div>
        </div>
      </section>

      <section className={S.card}>
        <div className={`${headPad} ${S.head}`}>
          <h2 className={S.h2}>Task labels</h2>
          <p className={S.desc}>Colored tags for organizing tasks.</p>
        </div>
        <div className="flex min-h-[3.5rem] flex-wrap items-center gap-2 p-4 sm:px-5 sm:py-4">
          {labels.length === 0 && <p className="text-[13px] font-medium italic text-[oklch(0.60_0_0)]">No labels created yet.</p>}
          {labels.map((l) => (
            <div
              key={l.id}
              className="relative"
              ref={openColorLabelId === l.id ? openLabelRowRef : undefined}
            >
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-white shadow-sm"
                style={{ backgroundColor: l.color }}
              >
                <button
                  type="button"
                  onClick={() => setOpenColorLabelId((id) => (id === l.id ? null : l.id))}
                  className="h-5 w-5 shrink-0 rounded border border-white/35 transition hover:brightness-110"
                  style={{ backgroundColor: l.color }}
                  aria-expanded={openColorLabelId === l.id}
                  aria-haspopup="listbox"
                  aria-label={`Change color for ${l.name}`}
                />
                {l.name}
                <button
                  type="button"
                  className="flex min-h-9 min-w-9 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
                  onClick={() => deleteLabel(l.id).then(load)}
                >
                  ×
                </button>
              </span>
              {openColorLabelId === l.id && (
                <div
                  className="absolute left-0 top-full z-30 mt-1 min-w-[220px] rounded-lg border border-black/10 bg-white p-2 shadow-lg"
                  role="listbox"
                  aria-label={`Colors for ${l.name}`}
                >
                  <div className="grid grid-cols-8 gap-1">
                    {TASK_LABEL_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={async () => {
                          await updateLabel(l.id, { color })
                          setOpenColorLabelId(null)
                          await load()
                        }}
                        className={`${mobile ? 'h-9 w-9' : 'h-7 w-7'} rounded-md border border-black/10 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
                          l.color.toLowerCase() === color.toLowerCase()
                            ? 'ring-2 ring-[oklch(0.13_0_0)] ring-offset-1'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Use color ${color}`}
                        aria-selected={l.color.toLowerCase() === color.toLowerCase()}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.06] bg-[oklch(0.985_0_0)] p-4 sm:px-5 sm:py-4">
          <label className={`${S.label} mb-3`}>New label</label>
          <div className="flex flex-col gap-4">
            <div className="grid max-w-[280px] grid-cols-8 gap-1.5">
              {TASK_LABEL_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLbColor(color)}
                  className={`${mobile ? 'h-10 w-10' : 'h-7 w-7'} rounded-md transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${lbColor === color ? 'scale-110 ring-2 ring-[oklch(0.13_0_0)] ring-offset-1' : 'border border-black/10 hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className={`flex ${flexRow} gap-3`}>
              <input
                dir="auto"
                placeholder="Ex: Urgent, Plumbing…"
                value={lbName}
                onChange={(e) => setLbName(e.target.value)}
                className={`w-full flex-1 ${S.inp(inp)} font-medium`}
              />
              <button
                type="button"
                onClick={async () => {
                  if (!lbName.trim()) return
                  await createLabel(project.id, lbName.trim(), lbColor)
                  setLbName('')
                  await load()
                }}
                disabled={!lbName.trim()}
                className={`${mobile ? 'w-full' : 'w-full sm:w-auto'} ${S.btn(inp)} sm:min-w-[7.5rem]`}
              >
                Add label
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={S.card}>
        <div className={`${headPad} ${S.head}`}>
          <h2 className={S.h2}>Photo tags</h2>
          <p className={S.desc}>Categorize photos in the gallery.</p>
        </div>
        <div className="divide-y divide-black/[0.045]">
          {gTags.map((t) => (
            <div key={t.id} className={`${S.row} flex items-center justify-between ${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-3.5'}`}>
              <span className="text-[16px] font-semibold text-[oklch(0.13_0_0)]" dir="auto">
                {t.name}
              </span>
              <button type="button" onClick={() => deleteGalleryTag(t.id).then(load)} className={S.danger}>
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:px-5 sm:py-4'} flex ${flexRow} gap-3 border-t border-black/[0.06] bg-[oklch(0.985_0_0)]`}>
            <input
              dir="auto"
              placeholder="Tag name"
              value={gtName}
              onChange={(e) => setGtName(e.target.value)}
              className={`w-full flex-1 ${S.inp(inp)}`}
            />
            <button
              type="button"
              onClick={async () => {
                if (!gtName.trim()) return
                await createGalleryTag(project.id, gtName.trim())
                setGtName('')
                await load()
              }}
              className={`${mobile ? 'w-full' : 'w-full sm:w-auto'} ${S.btn(inp)} sm:min-w-[6.5rem]`}
            >
              Add tag
            </button>
          </div>
        </div>
      </section>

      <section
        className={`space-y-3 overflow-hidden rounded-lg border border-rose-200/70 bg-rose-50/40 ${mobile ? 'p-4' : 'p-5'}`}
      >
        <h2 className="font-[family-name:var(--font-varela-round)] text-[17px] font-bold text-rose-800">Archive project</h2>
        <p className="max-w-md text-[14px] leading-relaxed text-[oklch(0.50_0_0)]">
          Moves the project to archived so you can start a new one. Expenses, tasks, and files stay in the archive.
        </p>
        <button
          type="button"
          onClick={archiveCurrent}
          className={`w-full rounded-lg border border-rose-200/80 bg-white py-3 text-[15px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 ${mobile ? 'min-h-12' : 'min-h-12'}`}
        >
          Archive current project
        </button>
      </section>

      {archived.length > 0 && (
        <section className="mb-10 sm:mb-12">
          <p className={`${S.label} mb-2 px-0.5`}>Archived projects</p>
          <ul className="overflow-hidden rounded-lg border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
            {archived.map((p) => (
              <li key={p.id} className="p-4 text-[15px] font-medium text-[oklch(0.20_0_0)] transition-colors sm:px-5 sm:py-3.5 hover:bg-[oklch(0.99_0_0)]" dir="auto">
                {p.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
