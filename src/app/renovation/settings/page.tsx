'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  archiveProject,
  createGalleryTag,
  createLabel,
  createRoom,
  createTeamMember,
  deleteGalleryTag,
  deleteLabel,
  deleteRoom,
  deleteTeamMember,
  getArchivedProjects,
  listGalleryTags,
  listLabels,
  listRooms,
  listTeamMembers,
  updateProject,
} from '@/lib/renovation'
import type { RenovationGalleryTag, RenovationLabel, RenovationProject, RenovationRoom, RenovationTeamMember } from '@/types/renovation'

export default function RenovationSettingsPage() {
  const router = useRouter()
  const { project, refresh } = useRenovation()
  const [archived, setArchived] = useState<RenovationProject[]>([])
  const [members, setMembers] = useState<RenovationTeamMember[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [labels, setLabels] = useState<RenovationLabel[]>([])
  const [gTags, setGTags] = useState<RenovationGalleryTag[]>([])
  const [nm, setNm] = useState({ name: '', phone: '', email: '' })
  const [roomName, setRoomName] = useState('')
  const [lbName, setLbName] = useState('')
  const [lbColor, setLbColor] = useState('#6366f1') // Default to indigo-500
  const [gtName, setGtName] = useState('')
  const [projNotes, setProjNotes] = useState('')
  const [projAddr, setProjAddr] = useState('')

  const load = useCallback(async () => {
    if (!project) return
    const [m, r, l, g] = await Promise.all([
      listTeamMembers(project.id),
      listRooms(project.id),
      listLabels(project.id),
      listGalleryTags(project.id),
    ])
    setMembers(m)
    setRooms(r)
    setLabels(l)
    setGTags(g)
    setProjNotes(project.notes || '')
    setProjAddr(project.address_text || '')
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getArchivedProjects().then(setArchived)
  }, [project?.id])

  const saveProjectMeta = async () => {
    if (!project) return
    await updateProject(project.id, { notes: projNotes || null, address_text: projAddr || null })
    await refresh()
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto pt-8 text-center">
        <p className="text-black/45">No active project.</p>
        <a href="/renovation" className="text-[#007AFF] font-medium mt-2 inline-block">
          Start one
        </a>
        {archived.length > 0 && (
          <div className="mt-10 text-left">
            <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide mb-2">Archived</p>
            <ul className="bg-white rounded-md border border-black/[0.06] divide-y divide-black/[0.06]">
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
    <div className="space-y-8 max-w-xl pb-8">
      <header>
        <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Project</p>
        <h1 className="text-[28px] font-semibold tracking-tight">Settings</h1>
      </header>

      <section className="bg-white rounded-md border border-black/[0.06] p-4 space-y-3">
        <h2 className="text-[17px] font-semibold">Details</h2>
        <div>
          <label className="text-[13px] text-black/45">Notes</label>
          <textarea
            dir="auto"
            value={projNotes}
            onChange={(e) => setProjNotes(e.target.value)}
            onBlur={saveProjectMeta}
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-md border border-black/[0.12] text-[15px]"
          />
        </div>
        <div>
          <label className="text-[13px] text-black/45">Address</label>
          <input
            dir="auto"
            value={projAddr}
            onChange={(e) => setProjAddr(e.target.value)}
            onBlur={saveProjectMeta}
            className="mt-1 w-full h-11 px-3 rounded-md border border-black/[0.12] text-[15px]"
          />
        </div>
      </section>

      <section className="bg-white rounded-md border border-black/[0.06] overflow-hidden">
        <div className="p-4 border-b border-black/[0.06]">
          <h2 className="text-[17px] font-semibold">Team</h2>
          <p className="text-[13px] text-black/45 mt-0.5">Assign tasks to people</p>
        </div>
        <div className="divide-y divide-black/[0.06]">
          {members.map((m) => (
            <div key={m.id} className="flex justify-between items-center p-4 gap-2">
              <div className="min-w-0" dir="auto">
                <p className="font-medium text-[15px]">{m.name}</p>
                {(m.phone || m.email) && (
                  <p className="text-[13px] text-black/45 truncate">{m.phone || m.email}</p>
                )}
              </div>
              <button type="button" onClick={() => deleteTeamMember(m.id).then(load)} className="text-[#FF3B30] text-[13px] shrink-0">
                Remove
              </button>
            </div>
          ))}
          <div className="p-4 space-y-2">
            <input
              dir="auto"
              placeholder="Name"
              value={nm.name}
              onChange={(e) => setNm((s) => ({ ...s, name: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
            />
            <div className="flex gap-2">
              <input
                placeholder="Phone"
                value={nm.phone}
                onChange={(e) => setNm((s) => ({ ...s, phone: e.target.value }))}
                className="flex-1 h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
              />
              <input
                placeholder="Email"
                value={nm.email}
                onChange={(e) => setNm((s) => ({ ...s, email: e.target.value }))}
                className="flex-1 h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
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
              className="w-full h-10 rounded-md bg-[#007AFF] text-white font-semibold text-[15px]"
            >
              Add person
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-md border border-black/[0.06] overflow-hidden">
        <div className="p-4 border-b border-black/[0.06]">
          <h2 className="text-[17px] font-semibold">Rooms</h2>
          <p className="text-[13px] text-black/45 mt-0.5">For photo organization</p>
        </div>
        <div className="divide-y divide-black/[0.06]">
          {rooms.map((r) => (
            <div key={r.id} className="flex justify-between items-center p-4">
              <span dir="auto">{r.name}</span>
              <button type="button" onClick={() => deleteRoom(r.id).then(load)} className="text-[#FF3B30] text-[13px]">
                Remove
              </button>
            </div>
          ))}
          <div className="p-4 flex gap-2">
            <input
              dir="auto"
              placeholder="Kitchen, bath…"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
            />
            <button
              type="button"
              onClick={async () => {
                if (!roomName.trim()) return
                await createRoom(project.id, roomName.trim())
                setRoomName('')
                await load()
              }}
              className="h-10 px-4 rounded-md bg-[#007AFF] text-white font-semibold text-[15px]"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-md border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-[17px] font-bold text-slate-800">Task labels</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Organize tasks with customizable colored tags.</p>
        </div>
        <div className="p-4 flex flex-wrap gap-2 min-h-[4rem] items-center">
          {labels.length === 0 && <p className="text-[13px] text-slate-400 font-medium italic">No labels created yet.</p>}
          {labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-2.5 py-1 rounded-md shadow-sm"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
              <button type="button" className="opacity-70 hover:opacity-100 hover:scale-110 transition-transform" onClick={() => deleteLabel(l.id).then(load)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Create New Label</label>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-8 gap-1.5 max-w-[280px]">
              {[
                '#ef4444', '#f97316', '#f59e0b', '#eab308', 
                '#84cc16', '#22c55e', '#10b981', '#14b8a6',
                '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
                '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
              ].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setLbColor(color)}
                  className={`w-7 h-7 rounded-sm transition-all focus:outline-none ${lbColor === color ? 'border-2 border-white ring-2 ring-slate-900 scale-110 shadow-md' : 'border border-black/10 hover:scale-110 shadow-sm'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                dir="auto"
                placeholder="Ex: Urgent, Plumbing..."
                value={lbName}
                onChange={(e) => setLbName(e.target.value)}
                className="flex-1 min-w-[140px] h-11 px-3.5 rounded-md border border-slate-200 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-white"
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
                className="h-11 px-5 rounded-md bg-indigo-600 text-white font-bold text-[14px] hover:bg-indigo-500 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                Add Label
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-md border border-black/[0.06] overflow-hidden">
        <div className="p-4 border-b border-black/[0.06]">
          <h2 className="text-[17px] font-semibold">Photo tags</h2>
        </div>
        <div className="divide-y divide-black/[0.06]">
          {gTags.map((t) => (
            <div key={t.id} className="flex justify-between items-center p-4">
              <span dir="auto">{t.name}</span>
              <button type="button" onClick={() => deleteGalleryTag(t.id).then(load)} className="text-[#FF3B30] text-[13px]">
                Remove
              </button>
            </div>
          ))}
          <div className="p-4 flex gap-2">
            <input
              dir="auto"
              placeholder="Tag name"
              value={gtName}
              onChange={(e) => setGtName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-md border border-black/[0.12] text-[15px]"
            />
            <button
              type="button"
              onClick={async () => {
                if (!gtName.trim()) return
                await createGalleryTag(project.id, gtName.trim())
                setGtName('')
                await load()
              }}
              className="h-10 px-4 rounded-md bg-[#007AFF] text-white font-semibold text-[15px]"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-md border border-black/[0.06] p-4 space-y-3">
        <h2 className="text-[17px] font-semibold text-[#FF3B30]">Archive project</h2>
        <p className="text-[14px] text-black/45">
          Archives this project so you can start a new one. Data stays in your archive list.
        </p>
        <button
          type="button"
          onClick={async () => {
            if (!confirm('Archive this project and start fresh later?')) return
            await archiveProject(project.id)
            await refresh()
            router.push('/renovation')
          }}
          className="w-full h-12 rounded-md bg-[#FF3B30]/10 text-[#FF3B30] font-semibold text-[16px]"
        >
          Archive current project
        </button>
      </section>

      {archived.length > 0 && (
        <section>
          <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide mb-2">Archived projects</p>
          <ul className="bg-white rounded-md border border-black/[0.06] divide-y divide-black/[0.06]">
            {archived.map((p) => (
              <li key={p.id} className="p-4 text-[15px]" dir="auto">
                {p.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
