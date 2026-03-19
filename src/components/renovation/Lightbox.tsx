'use client'

import React, { useState, useEffect } from 'react'
import { Dropdown } from '@/components/renovation/Dropdown'
import { formatDateDisplay } from '@/lib/renovation-format'
import { updateGalleryItem, deleteGalleryItem } from '@/lib/renovation'
import type { RenovationGalleryItem, RenovationRoom, RenovationGalleryTag } from '@/types/renovation'

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
  const [activeTab, setActiveTab] = useState<'info' | 'grid'>('info')

  useEffect(() => {
    if (current) {
      setEditCaption(current.caption || '')
      setEditRoom(current.room_id || '')
      setEditTags(current.tag_ids || [])
    }
  }, [current, index])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [images.length, onClose])

  if (!current) return null

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex((i) => (i + 1) % images.length)
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIndex((i) => (i - 1 + images.length) % images.length)
  }

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
        // Adjust index if we deleted the last item
        setIndex((i) => (i === images.length - 1 ? i - 1 : i))
      }
    } catch (e) {
      console.error(e)
      alert('Delete failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row animate-fade-in">
      
      {/* Top Mobile Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex justify-between items-center z-50 md:hidden bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="text-white/60 text-[13px] font-medium px-2 pointer-events-auto bg-black/20 rounded-full py-1 backdrop-blur-md">
          {index + 1} of {images.length}
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all pointer-events-auto active:scale-95">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Main Image Viewer */}
      <div className="flex-1 relative flex items-center justify-center min-h-[50vh] md:min-h-full" onClick={onClose}>
        {/* Navigation Overlays */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-0 top-0 bottom-0 w-1/4 md:w-32 z-40 flex items-center justify-start pl-2 md:pl-8 group outline-none"
              onClick={handlePrev}
            >
              <div className="w-12 h-12 rounded-full bg-black/0 group-hover:bg-black/40 group-focus:bg-black/40 text-white/0 group-hover:text-white group-focus:text-white transition-all flex items-center justify-center backdrop-blur-sm -translate-x-4 group-hover:translate-x-0 group-focus:translate-x-0 duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </div>
            </button>
            <button
              className="absolute right-0 top-0 bottom-0 w-1/4 md:w-32 z-40 flex items-center justify-end pr-2 md:pr-8 group outline-none"
              onClick={handleNext}
            >
              <div className="w-12 h-12 rounded-full bg-black/0 group-hover:bg-black/40 group-focus:bg-black/40 text-white/0 group-hover:text-white group-focus:text-white transition-all flex items-center justify-center backdrop-blur-sm translate-x-4 group-hover:translate-x-0 group-focus:translate-x-0 duration-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7 7 7" /></svg>
              </div>
            </button>
          </>
        )}

        {/* The Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id} // Forces re-render animation
          src={current.public_url}
          alt={current.caption || 'Gallery photo'}
          className="max-w-full max-h-full object-contain md:p-8 animate-zoom-in pointer-events-none drop-shadow-2xl"
        />
      </div>

      {/* Side / Bottom Info Drawer */}
      <div 
        className="w-full md:w-[400px] lg:w-[450px] bg-[#1a1a1c]/90 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col z-50 shadow-2xl transition-all h-[55vh] md:h-full animate-slide-up md:animate-slide-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle for mobile pure visual */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full md:hidden pointer-events-none" />

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center p-6 border-b border-white/10">
          <div className="text-white/60 text-[14px] font-semibold tracking-wide">
            PHOTO {index + 1} OF {images.length}
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tab Switcher (Mobile & Desktop) */}
        {images.length > 1 && (
          <div className="flex px-6 pt-6 md:pt-4 pb-2 border-b border-white/10 gap-6">
            <button 
              onClick={() => setActiveTab('info')} 
              className={`pb-3 text-[14px] font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'info' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              Details
              {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('grid')} 
              className={`pb-3 text-[14px] font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'grid' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              More Photos
              {activeTab === 'grid' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {activeTab === 'info' && (
            <div className="space-y-6 animate-fade-in text-white">
              {/* Date String */}
              {current.taken_at && (
                <p className="text-[13px] font-medium text-indigo-300/80 tracking-widest uppercase">
                  {formatDateDisplay(current.taken_at)}
                </p>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Caption</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  </div>
                  <textarea
                    dir="auto"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Describe this photo..."
                    className="w-full h-24 pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[15px] placeholder:text-white/30 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none outline-none text-white font-medium shadow-inner"
                  />
                </div>
              </div>

              {/* Room Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Room Assignment</label>
                <div className="relative">
                  <Dropdown
                    value={editRoom}
                    onChange={(val) => setEditRoom(val)}
                    options={[{ value: '', label: 'No Room' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-[15px] font-bold text-white focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:bg-white/10 transition-all shadow-sm !placeholder-white/30"
                  />
                </div>
              </div>

              {/* Tags Selector */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Tags</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((t) => {
                      const isActive = editTags.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEditTags((prev) => (prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]))}
                          className={`text-[13px] font-bold px-4 py-1.5 rounded-full transition-all active:scale-95 ${
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

              {/* Action Buttons */}
              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="w-14 h-14 shrink-0 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
                  title="Delete Photo"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="flex-1 h-14 rounded-xl bg-white text-black font-bold text-[16px] shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in content-start">
              {images.map((item, i) => {
                const isActive = i === index
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setIndex(i)
                      setActiveTab('info')
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isActive ? 'border-white opacity-100 scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.public_url} alt="" className="w-full h-full object-cover" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
