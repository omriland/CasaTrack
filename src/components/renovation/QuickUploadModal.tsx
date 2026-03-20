'use client'

import React, { useState, useEffect } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import { uploadGalleryPhoto, createGalleryItem, listRooms, listGalleryTags } from '@/lib/renovation'
import { Dropdown } from '@/components/renovation/Dropdown'
import type { RenovationRoom, RenovationGalleryTag } from '@/types/renovation'

interface QuickUploadModalProps {
  file: File
  onClose: () => void
  onSave: () => void
}

export function QuickUploadModal({ file, onClose, onSave }: QuickUploadModalProps) {
  const { project } = useRenovation()
  const [preview, setPreview] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [roomId, setRoomId] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [tags, setTags] = useState<RenovationGalleryTag[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (project) {
      Promise.all([listRooms(project.id), listGalleryTags(project.id)]).then(([r, t]) => {
        setRooms(r)
        setTags(t)
      })
    }
  }, [project])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return
    setSaving(true)
    try {
      const storagePath = await uploadGalleryPhoto(project.id, file)
      await createGalleryItem(project.id, {
        storage_path: storagePath,
        caption: caption || null,
        room_id: roomId || null,
        tag_ids: tagIds,
      })
      onSave()
    } catch (err) {
      console.error(err)
      alert('Upload failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div
        onClick={(ev) => ev.stopPropagation()}
        className="w-full md:max-w-[480px] bg-white rounded-t-[2rem] md:rounded-2xl shadow-2xl overflow-hidden flex flex-col pt-2 md:pt-0 animate-fade-in-up md:animate-zoom-in"
      >
        {/* Header */}
        <div className="px-6 py-4 md:py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-2 left-1/2 -translate-x-1/2 md:hidden" />
          <h2 className="text-[18px] md:text-[20px] font-bold text-slate-800 tracking-tight mt-2 md:mt-0">Quick Photo Upload</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-200 mt-2 md:mt-0 active:scale-90">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[85vh] space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Image Preview */}
          <div className="relative aspect-video rounded-md overflow-hidden bg-slate-100 border border-slate-200 group">
             {preview && (
               <img src={preview} alt="Upload preview" className="w-full h-full object-contain" />
             )}
             <div className="absolute inset-0 bg-black/5 pointer-events-none" />
          </div>

          <div className="space-y-4">
            {/* Caption */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Caption</label>
              <textarea
                dir="auto"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's this photo about?"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[16px] md:text-[14px] font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white resize-none"
              />
            </div>

            {/* Room Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Room</label>
              <Dropdown
                value={roomId}
                onChange={setRoomId}
                options={[{ value: '', label: 'No Room' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 text-[16px] md:text-[14px] font-semibold text-slate-800 outline-none focus-within:ring-2 focus-within:ring-indigo-500/20"
              />
            </div>

            {/* Tags Selector */}
            {tags.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Tags</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((t) => {
                    const isActive = tagIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTagIds((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}
                        className={`text-[12px] font-bold px-3 py-1.5 rounded transition-all active:scale-95 ${
                          isActive 
                          ? 'bg-indigo-600 text-white shadow-md scale-105' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 h-12 rounded bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Upload Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
