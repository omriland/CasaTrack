'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Dropdown } from '@/components/renovation/Dropdown'
import { formatDateDisplay } from '@/lib/renovation-format'
import { updateGalleryItem, deleteGalleryItem } from '@/lib/renovation'
import type { RenovationGalleryItem, RenovationRoom, RenovationGalleryTag } from '@/types/renovation'

import YarlLightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'

interface LightboxProps {
  images: RenovationGalleryItem[]
  initialIndex: number
  rooms: RenovationRoom[]
  tags: RenovationGalleryTag[]
  onClose: () => void
  onChanged: () => void
}

export function Lightbox({ images, initialIndex, rooms, tags, onClose, onChanged }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const current = images[index]

  const [editCaption, setEditCaption] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  
  const [showDetails, setShowDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (current) {
      setEditCaption(current.caption || '')
      setEditRoom(current.room_id || '')
      setEditTags(current.tag_ids || [])
    }
  }, [current, index])

  if (!current) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateGalleryItem(
        current.id,
        {
          caption: editCaption || null,
          taken_at: current.taken_at,
          room_id: editRoom || null,
        },
        editTags
      )
      onChanged()
      setShowDetails(false)
    } catch (e) {
      console.error(e)
      alert('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this photo?')) return
    setSaving(true)
    try {
      await deleteGalleryItem(current)
      onChanged()
      if (images.length === 1) {
        onClose()
      } else {
        setShowDetails(false)
        setIndex((i) => (i === images.length - 1 ? i - 1 : i))
      }
    } catch (e) {
      console.error(e)
      alert('Delete failed')
    } finally {
      setSaving(false)
    }
  }

  const slides = images.map(img => ({
    src: img.public_url || '',
    alt: img.caption || 'Gallery photo',
    itemData: img
  }))

  return (
    <>
      <YarlLightbox
        open={true}
        close={onClose}
        index={index}
        slides={slides}
        on={{ view: ({ index: currentIndex }) => setIndex(currentIndex) }}
        plugins={[Zoom, Thumbnails]}
        toolbar={{
          buttons: [
            <button
              key="edit"
              type="button"
              className="yarl__button"
              onClick={() => setShowDetails(true)}
              title="Edit Details"
            >
              <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>,
            "zoom",
            "close"
          ]
        }}
        render={{
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
          slideHeader: ({ slide }) => {
            const currentImg = (slide as any).itemData as RenovationGalleryItem | undefined
            if (!currentImg) return null
            const room = rooms.find(r => r.id === currentImg.room_id)
            const itemTags = currentImg.tag_ids?.map(tid => tags.find(x => x.id === tid)).filter(Boolean) || []
            
            if (!room && itemTags.length === 0 && !currentImg.caption) return null

            return (
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50 pointer-events-none flex flex-col items-start text-left max-w-sm">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {room && (
                    <span className="bg-indigo-500 text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-lg border border-indigo-400 pointer-events-auto">
                      {room.name}
                    </span>
                  )}
                  {itemTags.map(t => (
                    <span key={t!.id} className="bg-black/60 backdrop-blur-xl text-white px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-lg border border-white/10 pointer-events-auto">
                      {t!.name}
                    </span>
                  ))}
                </div>
                {currentImg.caption && <p className="text-white text-[14px] font-medium bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl shadow-lg border border-white/10 pointer-events-auto">{currentImg.caption}</p>}
              </div>
            )
          }
        }}
      />

      {mounted && showDetails && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => !saving && setShowDetails(false)}>
          <div 
            className="w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in text-white/90"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/20">
              <h3 className="font-bold tracking-wide">Edit Details</h3>
              <button onClick={() => setShowDetails(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {/* Date String */}
              {current.taken_at && (
                <p className="text-[13px] font-medium text-indigo-300/80 tracking-widest uppercase">
                  Taken: {formatDateDisplay(current.taken_at)}
                </p>
              )}

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Caption</label>
                <textarea
                  dir="auto"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Describe this photo..."
                  className="w-full h-24 p-3 rounded-md bg-black/40 border border-white/10 text-[15px] placeholder:text-white/30 focus:bg-black/60 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none outline-none text-white font-medium shadow-inner"
                />
              </div>

              {/* Room Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Room Assignment</label>
                <Dropdown
                  value={editRoom}
                  onChange={(val) => setEditRoom(val)}
                  options={[{ value: '', label: 'No Room' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
                  className="w-full h-12 rounded-md bg-[#1a1a1c] border border-white/10 text-[15px] font-bold text-white focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-black/40 transition-all shadow-sm !placeholder-white/30"
                />
              </div>

              {/* Tags Selector */}
              {tags.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Tags</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((t) => {
                      const isActive = editTags.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditTags((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}
                          className={`text-[13px] font-bold px-4 py-1.5 rounded transition-all active:scale-95 ${
                            isActive 
                            ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105 border border-transparent' 
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
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

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="w-12 h-12 shrink-0 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                title="Delete Photo"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 h-12 rounded-md bg-white text-black font-bold text-[15px] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
