'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createGalleryItem,
  deleteGalleryItem,
  listGalleryItems,
  listGalleryTags,
  listRooms,
  updateGalleryItem,
  uploadGalleryPhoto,
} from '@/lib/renovation'
import { Dropdown } from '@/components/renovation/Dropdown'
import { formatDateDisplay } from '@/lib/renovation-format'
import type { RenovationGalleryItem, RenovationGalleryTag, RenovationRoom } from '@/types/renovation'

export default function GalleryPage() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationGalleryItem[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [tags, setTags] = useState<RenovationGalleryTag[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<RenovationGalleryItem | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterTag, setFilterTag] = useState<string>('')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [i, r, t] = await Promise.all([
        listGalleryItems(project.id),
        listRooms(project.id),
        listGalleryTags(project.id),
      ])
      setItems(i)
      setRooms(r)
      setTags(t)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const onFiles = async (files: FileList | null) => {
    if (!project || !files?.length) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const path = await uploadGalleryPhoto(project.id, files[i]!)
        await createGalleryItem(project.id, { storage_path: path })
      }
      await load()
    } catch (e) {
      console.error(e)
      alert('Upload failed. Check storage bucket and SQL.')
    } finally {
      setUploading(false)
    }
  }

  const openLightbox = (item: RenovationGalleryItem) => {
    setLightbox(item)
    setEditCaption(item.caption || '')
    setEditRoom(item.room_id || '')
    setEditTags(item.tag_ids || [])
  }

  const saveMeta = async () => {
    if (!lightbox) return
    await updateGalleryItem(
      lightbox.id,
      {
        caption: editCaption || null,
        taken_at: lightbox.taken_at,
        room_id: editRoom || null,
      },
      editTags
    )
    setLightbox(null)
    await load()
  }

  const filtered = items.filter((it) => {
    if (filterRoom && it.room_id !== filterRoom) return false
    if (filterTag && !it.tag_ids?.includes(filterTag)) return false
    return true
  })

  if (!project) {
    return (
      <p className="text-center text-black/45 py-16">
        <a href="/renovation" className="text-[#007AFF]">
          Create a project first
        </a>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end gap-3 flex-wrap">
        <div>
          <p className="text-[13px] font-semibold text-black/45 uppercase tracking-wide">Progress</p>
          <h1 className="text-[28px] font-semibold tracking-tight">Photos</h1>
        </div>
        <label className="h-10 px-4 rounded-md bg-[#007AFF] text-white text-[15px] font-semibold flex items-center cursor-pointer active:scale-[0.98]">
          {uploading ? 'Uploading…' : 'Add photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              onFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {(rooms.length > 0 || tags.length > 0) && (
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="relative z-[90]">
            <Dropdown
              value={filterRoom}
              onChange={(val) => setFilterRoom(val)}
              options={[{ value: '', label: 'All Rooms' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
              className="w-[140px] h-10 rounded-md border border-slate-200 bg-white text-[14px] font-medium text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            />
          </div>
          <div className="relative z-[80]">
            <Dropdown
              value={filterTag}
              onChange={(val) => setFilterTag(val)}
              options={[{ value: '', label: 'All Tags' }, ...tags.map(t => ({ value: t.id, label: t.name }))]}
              className="w-[140px] h-10 rounded-md border border-slate-200 bg-white text-[14px] font-medium text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-md bg-white border border-black/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-md border border-black/[0.06] p-12 text-center text-[15px] text-black/45">
          No photos yet. Add from your phone or desktop.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openLightbox(item)}
              className="aspect-square rounded-md overflow-hidden bg-black/[0.06] active:scale-[0.97] transition-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.public_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[110] bg-black/95 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          <div className="flex justify-end p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button type="button" className="text-white text-[17px] font-medium px-4" onClick={() => setLightbox(null)}>
              Done
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.public_url} alt="" className="max-w-full max-h-[50vh] object-contain rounded-md" />
          </div>
          <div
            className="bg-[#1C1C1E] rounded-t-[14px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white space-y-3 max-h-[45vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.taken_at && <p className="text-[13px] text-white/50">{formatDateDisplay(lightbox.taken_at)}</p>}
            <input
              dir="auto"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Caption"
              className="w-full h-11 px-3 rounded-md bg-white/10 border border-white/20 text-[16px] placeholder:text-white/40"
            />
            <div>
              <p className="text-[13px] text-slate-400 font-semibold uppercase tracking-widest mb-2">Room</p>
              <div className="relative">
                <Dropdown
                  value={editRoom}
                  onChange={(val) => setEditRoom(val)}
                  options={[{ value: '', label: 'Unassigned' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
                  className="w-full h-12 rounded-md bg-white/10 border border-white/20 text-[15px] font-medium text-white focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-sm"
                />
              </div>
            </div>
            {tags.length > 0 && (
              <div>
                <p className="text-[13px] text-white/50 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setEditTags((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))
                      }
                      className={`text-[13px] px-3 py-1.5 rounded-full ${
                        editTags.includes(t.id) ? 'bg-[#007AFF] text-white' : 'bg-white/15 text-white/80'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Delete this photo?')) return
                  await deleteGalleryItem(lightbox)
                  setLightbox(null)
                  await load()
                }}
                className="text-[#FF453A] text-[15px] font-medium px-2"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={saveMeta}
                className="flex-1 h-12 rounded-md bg-[#007AFF] text-white font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
