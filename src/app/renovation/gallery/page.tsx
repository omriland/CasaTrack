'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createGalleryItem,
  listGalleryItems,
  listGalleryTags,
  listRooms,
  uploadGalleryPhoto,
} from '@/lib/renovation'
import { Dropdown } from '@/components/renovation/Dropdown'
import { Lightbox } from '@/components/renovation/Lightbox'
import type { RenovationGalleryItem, RenovationGalleryTag, RenovationRoom } from '@/types/renovation'

export default function GalleryPage() {
  const { project } = useRenovation()
  const [items, setItems] = useState<RenovationGalleryItem[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [tags, setTags] = useState<RenovationGalleryTag[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<RenovationGalleryItem | null>(null)
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
      console.error('Gallery upload error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Upload failed: ${msg}. Ensure you ran 02_storage.sql and that the bucket "renovation-gallery" exists.`)
    } finally {
      setUploading(false)
    }
  }

  const openLightbox = (item: RenovationGalleryItem) => {
    setLightbox(item)
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
        <label className="h-10 px-4 rounded bg-[#007AFF] text-white text-[15px] font-semibold flex items-center cursor-pointer active:scale-[0.98]">
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
            <div key={i} className="aspect-square rounded bg-white border border-black/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded border border-black/[0.06] p-12 text-center text-[15px] text-black/45">
          No photos yet. Add from your phone or desktop.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openLightbox(item)}
              className="aspect-square rounded overflow-hidden bg-black/[0.06] active:scale-[0.97] transition-transform relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.public_url} alt="" className="w-full h-full object-cover" />
              {item.tag_ids && item.tag_ids.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 pointer-events-none">
                  {item.tag_ids.slice(0, 3).map(tid => {
                    const t = tags.find(x => x.id === tid)
                    return t ? (
                      <span key={tid} className="bg-black/40 backdrop-blur-[2px] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
                        {t.name}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          images={filtered}
          initialIndex={filtered.findIndex(i => i.id === lightbox.id)}
          rooms={rooms}
          tags={tags}
          onClose={() => setLightbox(null)}
          onChanged={() => load()}
        />
      )}
    </div>
  )
}
