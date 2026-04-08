'use client'

import Link from 'next/link'
import { formatIls } from '@/lib/renovation-format'
import {
  createLabel,
  createGalleryTag,
  createRoom,
  createTeamMember,
  deleteBudgetLine,
  deleteGalleryTag,
  deleteLabel,
  deleteRoom,
  deleteTeamMember,
  updateBudgetLine,
} from '@/lib/renovation'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { MemberAvatarTile } from '@/components/renovation/MemberAvatar'
import { RoomNotesMarkdownEditor } from '@/components/renovation/RoomNotesMarkdownEditor'
import { profileCanViewBudget } from '@/lib/renovation-profile'
import type { RenovationSettingsPageCtx } from './useRenovationSettingsPageState'

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

  const sec = mobile ? 'p-4' : 'p-6'
  const head = mobile ? 'p-4' : 'p-6'
  const inp = mobile ? 'min-h-[48px]' : 'h-12'
  const flexRow = mobile ? 'flex-col' : 'flex-row'
  const grid2 = mobile ? 'grid-cols-1' : 'grid-cols-2'

  if (!project) {
    return (
      <div className={`max-w-md mx-auto ${mobile ? 'pt-4' : 'pt-8'} text-center`}>
        <p className="text-black/45">No active project.</p>
        <a href="/renovation" className="text-[#007AFF] font-medium mt-2 inline-block">
          Start one
        </a>
        {archived.length > 0 && (
          <div className="mt-10 text-left">
            <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide mb-2">Archived</p>
            <ul className="bg-white rounded border border-black/[0.06] divide-y divide-black/[0.06]">
              {archived.map((p) => (
                <li key={p.id} className="p-4 text-[15px]" dir="auto">
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
    <div className={`space-y-6 max-w-2xl mx-auto animate-fade-in-up ${mobile ? 'pb-28' : 'pb-8'}`}>
      <header className={`flex ${flexRow} ${mobile ? 'items-start' : 'items-end'} justify-between gap-4`}>
        <div>
          <h1 className={`${mobile ? 'text-[24px]' : 'text-[32px]'} font-bold tracking-tight text-slate-900`}>Settings</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">Manage your team, labels, budget, and project details.</p>
        </div>
      </header>

      <section id="budget" className={`bg-white rounded-[2rem] border border-slate-200/60 shadow-sm ${sec} space-y-4 scroll-mt-4`}>
        <h2 className="text-[18px] font-bold text-slate-900">Details</h2>
        <div>
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Notes</label>
          <textarea
            dir="auto"
            value={projNotes}
            onChange={(e) => setProjNotes(e.target.value)}
            onBlur={saveProjectMeta}
            rows={mobile ? 4 : 2}
            className={`w-full px-4 py-3 rounded-xl border border-slate-200 text-[15px] bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 ${mobile ? 'min-h-[100px]' : ''}`}
          />
        </div>
        <div>
          <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Address</label>
          <input
            dir="auto"
            value={projAddr}
            onChange={(e) => setProjAddr(e.target.value)}
            onBlur={saveProjectMeta}
            className={`w-full ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
          />
        </div>
      </section>

      {profileCanViewBudget(activeProfile?.name) && (
        <>
          <section className={`bg-white rounded-[2rem] border border-slate-200/60 shadow-sm ${sec} space-y-4`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[18px] font-bold text-slate-900">Budget Totals</h2>
              <Link
                href="/renovation/budget"
                className="text-[14px] font-bold text-indigo-600 hover:text-indigo-500 shrink-0"
              >
                Vendor budget vs actual →
              </Link>
            </div>
            <div className={`grid ${grid2} gap-4`}>
              <div>
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Total Budget (₪)</label>
                <input
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  onBlur={saveTotals}
                  className={`w-full ${inp} px-4 rounded-xl border border-slate-200 text-[16px] bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums`}
                />
              </div>
              <div>
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Contingency (₪)</label>
                <input
                  type="number"
                  value={cont}
                  onChange={(e) => setCont(e.target.value)}
                  onBlur={saveTotals}
                  className={`w-full ${inp} px-4 rounded-xl border border-slate-200 text-[16px] bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all tabular-nums`}
                />
              </div>
            </div>
            <div className={`flex ${flexRow} ${mobile ? '' : 'sm:justify-between'} gap-2 text-[15px] pt-2 border-t border-slate-100`}>
              <p className="text-slate-500">
                Effective cap: <span className="font-bold text-slate-900 tabular-nums">{formatIls(cap)}</span>
              </p>
              <p className="text-slate-500">
                Spent: <span className="font-bold text-slate-900 tabular-nums">{loading ? '…' : formatIls(spent)}</span>
              </p>
            </div>
            {plannedTotal > 0 && (
              <p className="text-[15px] text-slate-500 pt-1">
                Planned (upcoming):{' '}
                <span className="font-bold text-amber-900 tabular-nums">{loading ? '…' : formatIls(plannedTotal)}</span>
              </p>
            )}
          </section>

          <section className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className={`${head} border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4`}>
              <div>
                <h2 className="text-[18px] font-bold text-slate-900">Budget by Category</h2>
                <p className="text-[14px] text-slate-500 mt-1">Allocate budget to specific work areas</p>
              </div>
              {lineSum > 0 && cap > 0 && Math.abs(lineSum - cap) > 1 && (
                <span className="text-[12px] font-bold px-2 py-1 rounded bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wider shrink-0">Mismatch</span>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {lines.map((line) => (
                <div key={line.id} className={`flex ${flexRow} ${mobile ? '' : 'sm:items-center'} gap-3 ${mobile ? 'p-4' : 'p-4 sm:p-5'} hover:bg-slate-50/50 transition-colors`}>
                  <input
                    dir="auto"
                    defaultValue={line.category_name}
                    onBlur={async (e) => {
                      const v = e.target.value.trim()
                      if (v && v !== line.category_name) await updateBudgetLine(line.id, { category_name: v })
                      await load()
                    }}
                    className={`flex-1 w-full ${inp} px-3 rounded-lg border border-transparent hover:border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[15px] font-medium bg-transparent focus:bg-white outline-none transition-all`}
                  />
                  <div className={`flex items-center gap-3 ${mobile ? 'w-full' : ''}`}>
                    <input
                      type="number"
                      defaultValue={line.amount_allocated}
                      onBlur={async (e) => {
                        const v = Number(e.target.value)
                        if (!Number.isNaN(v)) await updateBudgetLine(line.id, { amount_allocated: v })
                        await load()
                      }}
                      className={`${mobile ? 'flex-1' : 'w-32'} ${inp} px-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-[15px] tabular-nums text-right outline-none transition-all`}
                    />
                    <button type="button" onClick={() => deleteBudgetLine(line.id).then(load)} className="text-rose-500 text-[14px] font-semibold px-2 hover:bg-rose-50 min-h-[44px] rounded-lg transition-colors shrink-0">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className={`${mobile ? 'p-4' : 'p-4 sm:p-5'} flex ${flexRow} gap-3 bg-slate-50/30`}>
                <input
                  dir="auto"
                  placeholder="Ex: Kitchen Cabinets"
                  value={newCat}
                  onChange={(e) => setBudgetCat(e.target.value)}
                  className={`flex-1 min-w-[150px] ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
                />
                <div className={`flex gap-3 ${mobile ? 'flex-col w-full' : ''}`}>
                  <input
                    type="number"
                    placeholder="₪ amount"
                    value={newAmt}
                    onChange={(e) => setBudgetAmt(e.target.value)}
                    className={`${mobile ? 'w-full' : 'w-full sm:w-32'} ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 tabular-nums`}
                  />
                  <button type="button" onClick={addBudgetLine} className={`${inp} px-6 rounded-xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 transition-colors shrink-0 whitespace-nowrap`}>
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className={`${head} border-b border-slate-100 bg-slate-50/50`}>
          <h2 className="text-[18px] font-bold text-slate-900">Team</h2>
          <p className="text-[14px] text-slate-500 mt-1">Assign tasks to people</p>
        </div>
        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className={`flex justify-between items-center ${mobile ? 'p-4' : 'p-4 sm:p-5'} gap-3 hover:bg-slate-50/50 transition-colors`}>
              <div className="flex min-w-0 items-center gap-3">
                <MemberAvatarTile
                  name={m.name}
                  className="h-11 w-11 shrink-0 rounded-xl text-[13px] font-extrabold shadow-inner"
                />
                <div className="min-w-0" dir="auto">
                  <p className="font-bold text-slate-900 text-[16px]">{m.name}</p>
                  {(m.phone || m.email) && <p className="text-[13px] text-slate-500 truncate mt-0.5">{m.phone || m.email}</p>}
                </div>
              </div>
              <button type="button" onClick={() => deleteTeamMember(m.id).then(load)} className="text-rose-500 hover:bg-rose-50 px-3 min-h-[44px] rounded-lg text-[13px] font-semibold shrink-0 transition-colors">
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:p-5'} space-y-3 bg-slate-50/30`}>
            <input
              dir="auto"
              placeholder="Name"
              value={nm.name}
              onChange={(e) => setNm((s) => ({ ...s, name: e.target.value }))}
              className={`w-full ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
            />
            <div className={`flex ${flexRow} gap-3`}>
              <input
                placeholder="Phone"
                value={nm.phone}
                onChange={(e) => setNm((s) => ({ ...s, phone: e.target.value }))}
                className={`flex-1 ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
              />
              <input
                placeholder="Email"
                value={nm.email}
                onChange={(e) => setNm((s) => ({ ...s, email: e.target.value }))}
                className={`flex-1 ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
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
              className={`w-full ${inp} rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] transition-colors active:scale-[0.98]`}
            >
              Add person
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className={`${head} border-b border-slate-100 bg-slate-50/50 flex justify-between items-start flex-wrap gap-4`}>
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">Rooms</h2>
            <p className="text-[14px] text-slate-500 mt-1 max-w-sm">Link tasks and photos to rooms; add a paragraph per room.</p>
          </div>
          <Link href="/renovation/rooms" className="h-10 px-4 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
            View Rooms →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {rooms.map((r) => (
            <div key={r.id} className={`flex justify-between items-center ${mobile ? 'p-4' : 'p-4 sm:p-5'} hover:bg-slate-50/50 transition-colors`}>
              <span className="font-bold text-slate-900 text-[16px]" dir="auto">
                {r.name}
              </span>
              <button type="button" onClick={() => deleteRoom(r.id).then(load)} className="text-rose-500 hover:bg-rose-50 px-3 min-h-[44px] rounded-lg text-[13px] font-semibold transition-colors">
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:p-5'} space-y-3 bg-slate-50/30`}>
            <input
              dir="auto"
              placeholder="Room name (e.g. Kitchen, Bath)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className={`w-full ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
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
              className={`${inp} px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] transition-colors active:scale-[0.98]`}
            >
              Add room
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className={`${head} border-b border-slate-100 bg-slate-50/50`}>
          <h2 className="text-[18px] font-bold text-slate-900">Task labels</h2>
          <p className="text-[14px] text-slate-500 mt-1">Organize tasks with customizable colored tags.</p>
        </div>
        <div className="p-4 flex flex-wrap gap-2 min-h-[4rem] items-center">
          {labels.length === 0 && <p className="text-[13px] text-slate-400 font-medium italic">No labels created yet.</p>}
          {labels.map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-2.5 py-1 rounded shadow-sm" style={{ backgroundColor: l.color }}>
              {l.name}
              <button type="button" className="opacity-70 hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => deleteLabel(l.id).then(load)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Create New Label</label>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-8 gap-1.5 max-w-[280px]">
              {['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLbColor(color)}
                  className={`${mobile ? 'w-10 h-10' : 'w-7 h-7'} rounded-lg transition-all focus:outline-none ${lbColor === color ? 'border-2 border-white ring-2 ring-slate-900 scale-110 shadow-md' : 'border border-black/10 hover:scale-110 shadow-sm'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className={`flex ${flexRow} gap-3`}>
              <input
                dir="auto"
                placeholder="Ex: Urgent, Plumbing..."
                value={lbName}
                onChange={(e) => setLbName(e.target.value)}
                className={`flex-1 w-full ${inp} px-4 rounded-xl border border-slate-200 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-white`}
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
                className={`${mobile ? 'w-full' : 'w-full sm:w-auto'} ${inp} px-6 rounded-xl bg-slate-900 text-white font-bold text-[14px] hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50`}
              >
                Add Label
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
        <div className={`${head} border-b border-slate-100 bg-slate-50/50`}>
          <h2 className="text-[18px] font-bold text-slate-900">Photo tags</h2>
          <p className="text-[14px] text-slate-500 mt-1">Categorize photos in your gallery.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {gTags.map((t) => (
            <div key={t.id} className={`flex justify-between items-center ${mobile ? 'p-4' : 'p-4 sm:p-5'} hover:bg-slate-50/50 transition-colors`}>
              <span className="font-bold text-slate-900 text-[16px]" dir="auto">
                {t.name}
              </span>
              <button type="button" onClick={() => deleteGalleryTag(t.id).then(load)} className="text-rose-500 hover:bg-rose-50 px-3 min-h-[44px] rounded-lg text-[13px] font-semibold transition-colors">
                Remove
              </button>
            </div>
          ))}
          <div className={`${mobile ? 'p-4' : 'p-4 sm:p-5'} flex ${flexRow} gap-3 bg-slate-50/30`}>
            <input
              dir="auto"
              placeholder="Tag name"
              value={gtName}
              onChange={(e) => setGtName(e.target.value)}
              className={`flex-1 w-full ${inp} px-4 rounded-xl border border-slate-200 text-[15px] bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400`}
            />
            <button
              type="button"
              onClick={async () => {
                if (!gtName.trim()) return
                await createGalleryTag(project.id, gtName.trim())
                setGtName('')
                await load()
              }}
              className={`${mobile ? 'w-full' : 'w-full sm:w-auto'} ${inp} px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] transition-colors active:scale-[0.98]`}
            >
              Add Tag
            </button>
          </div>
        </div>
      </section>

      <section className={`bg-white rounded-[2rem] border border-rose-200 shadow-[0_8px_30px_rgba(225,29,72,0.06)] ${mobile ? 'p-5' : 'p-6 sm:p-8'} space-y-4`}>
        <h2 className="text-[20px] font-bold text-rose-600 flex items-center gap-2">Archive Project</h2>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-md">
          This will move the project to an archived state so you can start a fresh one. All expenses, tasks, and files will remain intact in the archive.
        </p>
        <button type="button" onClick={archiveCurrent} className={`w-full ${mobile ? 'min-h-[52px]' : 'h-14'} rounded-2xl bg-rose-50 text-rose-600 font-bold text-[16px] hover:bg-rose-100 hover:shadow-md transition-all active:scale-[0.98]`}>
          Archive current project
        </button>
      </section>

      {archived.length > 0 && (
        <section className="mb-12">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Archived Projects</p>
          <ul className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {archived.map((p) => (
              <li key={p.id} className="p-5 text-[16px] font-medium text-slate-700 hover:bg-slate-50 transition-colors" dir="auto">
                {p.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
