'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Dropdown } from '@/components/renovation/Dropdown'
import { formatDateDisplay } from '@/lib/renovation-format'
import { updateGalleryItem, deleteGalleryItem, updateGalleryItemAnnotations, createGalleryTag } from '@/lib/renovation'
import { useRenovation } from '@/components/renovation/RenovationContext'
import type { RenovationGalleryItem, RenovationRoom, RenovationGalleryTag } from '@/types/renovation'
import { ImageAnnotator, AnnotationShape } from '@/components/renovation/ImageAnnotator'
import { useRenovationMobileMedia } from '@/components/renovation/use-renovation-mobile'
import { useConfirm } from '@/providers/ConfirmProvider'

import YarlLightbox, { CloseIcon, stopNavigationEventsPropagation } from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import 'yet-another-react-lightbox/plugins/thumbnails.css'

/** Match YARL's internal index wrapping; JS `arr[-1]` is undefined, which crashed the lightbox UI. */
function clampSlideIndex(i: number, len: number): number {
  if (len <= 0) return 0
  if (i >= 0 && i < len) return i
  return ((i % len) + len) % len
}

function normalizeAnnotationShapes(raw: unknown): AnnotationShape[] {
  if (raw == null) return []
  if (!Array.isArray(raw)) return []
  return raw as AnnotationShape[]
}

interface LightboxProps {
  images: RenovationGalleryItem[]
  initialIndex: number
  rooms: RenovationRoom[]
  tags: RenovationGalleryTag[]
  onClose: () => void
  onChanged: () => void
}

export function Lightbox({ images, initialIndex, rooms, tags, onClose, onChanged }: LightboxProps) {
  const { project } = useRenovation()
  const isMobile = useRenovationMobileMedia()
  const confirmAction = useConfirm()
  const [index, setIndex] = useState(() => clampSlideIndex(initialIndex, images.length))
  const slideIndex = images.length > 0 ? clampSlideIndex(index, images.length) : 0
  const current = images.length > 0 ? images[slideIndex] : undefined

  const [editCaption, setEditCaption] = useState('')
  const [editRoom, setEditRoom] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [showDetails, setShowDetails] = useState(false)
  const [showAnnotator, setShowAnnotator] = useState(false)
  const [showMarkings, setShowMarkings] = useState(true)
  const [mounted, setMounted] = useState(false)

  // We maintain a local copy of annotations to instantly show updates
  const [localAnnotations, setLocalAnnotations] = useState<Record<string, AnnotationShape[]>>({})
  const [imageSizes, setImageSizes] = useState<Record<string, { w: number, h: number }>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (current) {
      setEditCaption(current.caption || '')
      setEditRoom(current.room_id || '')
      setEditTags(Array.isArray(current.tag_ids) ? current.tag_ids : [])
    }
  }, [current, index])

  // YARL Zoom needs width/height on each slide (custom render.slide skips ImageSlide).
  const slides = useMemo(
    () =>
      images.map((img) => {
        const dims = imageSizes[img.id]
        return {
          src: img.public_url || '',
          alt: img.caption || 'Gallery photo',
          itemData: img,
          ...(dims ? { width: dims.w, height: dims.h } : {}),
        }
      }),
    [images, imageSizes]
  )

  if (!images.length || !current) return null

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
    if (!(await confirmAction('Permanently delete this photo?'))) return
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

  const handleSaveAnnotations = async (shapes: AnnotationShape[], _isUploading?: boolean) => {
    try {
      await updateGalleryItemAnnotations(current.id, shapes)
      setLocalAnnotations(prev => ({ ...prev, [current.id]: shapes }))
      setShowAnnotator(false)
      onChanged()
    } catch (e) {
      console.error(e)
      alert('Failed to save markings')
    }
  }

  const mobileToolbarNavStop = isMobile ? stopNavigationEventsPropagation() : null

  return (
    <>
      <YarlLightbox
        open={true}
        close={onClose}
        index={slideIndex}
        slides={slides}
        on={{ view: ({ index: currentIndex }) => setIndex(currentIndex) }}
        plugins={isMobile ? [Zoom] : [Zoom, Thumbnails]}
        carousel={isMobile ? { padding: '12px', spacing: 0 } : undefined}
        zoom={{
          scrollToZoom: true,
          maxZoomPixelRatio: 5,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          zoomInMultiplier: 2,
          doubleClickMaxStops: 2,
        }}
        thumbnails={{
          border: 0,
          padding: 0,
          gap: 12,
          width: 56,
          height: 56,
          vignette: false,
        }}
        styles={{
          root: {
            backgroundColor: '#000',
          },
          // Solid paint + stacking context reduces iOS WebKit “noise strips” beside pinch-zoom layers
          container: {
            backgroundColor: '#000',
            isolation: 'isolate',
          },
          slide: {
            backgroundColor: '#000',
          },
        }}
        toolbar={{
          buttons: [
            <button
              key="toggle-markings"
              type="button"
              className={`yarl__button ${!showMarkings ? 'opacity-40' : ''}`}
              {...(mobileToolbarNavStop ?? {})}
              onClick={() => setShowMarkings(!showMarkings)}
              title={showMarkings ? "Hide Markings" : "Show Markings"}
            >
              {showMarkings ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 001 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                </svg>
              )}
            </button>,
            ...(isMobile
              ? []
              : [
                  <button
                    key="annotate"
                    type="button"
                    className="yarl__button"
                    onClick={() => setShowAnnotator(true)}
                    title="Draw / Annotate"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                    </svg>
                  </button>,
                ]),
            <button
              key="edit"
              type="button"
              className="yarl__button"
              {...(mobileToolbarNavStop ?? {})}
              onClick={() => setShowDetails(true)}
              title="Edit Details"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </button>,
            ...(isMobile ? [] : ['zoom']),
            'close',
          ],
        }}
        render={{
          ...(isMobile
            ? {
                buttonClose: () => (
                  <button
                    type="button"
                    aria-label="Close"
                    className="yarl__button yarl__button_close"
                    {...stopNavigationEventsPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                  >
                    <CloseIcon />
                  </button>
                ),
              }
            : {}),
          buttonPrev: images.length <= 1 ? () => null : undefined,
          buttonNext: images.length <= 1 ? () => null : undefined,
          slideHeader: () => null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          slide: ({ slide }: { slide: any }) => {
            const currentImg = slide.itemData as RenovationGalleryItem | undefined
            if (!currentImg || !currentImg.public_url) return null

            const shapes: AnnotationShape[] = normalizeAnnotationShapes(
              localAnnotations[currentImg.id] ?? currentImg.annotations
            )

            const room = rooms.find(r => r.id === currentImg.room_id)
            const tagIds = Array.isArray(currentImg.tag_ids) ? currentImg.tag_ids : []
            const itemTags = tagIds.map((tid) => tags.find((x) => x.id === tid)).filter(Boolean) as RenovationGalleryTag[]
            const hasMetadata = !!(currentImg.caption || room || itemTags.length > 0 || currentImg.taken_at)

            return (
              <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-black">
                {/* Image takes all available space — bg-black fills letterboxing (avoids iOS compositor gaps) */}
                <div className="flex-1 relative flex items-center justify-center min-h-0 w-full bg-black px-3 sm:px-6 pt-2 pb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentImg.public_url} 
                    className="reno-lb-img max-w-full max-h-full object-contain select-none rounded-lg" 
                    alt="" 
                    onLoad={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      if (target.naturalWidth && target.naturalHeight) {
                        setImageSizes(prev => ({
                          ...prev,
                          [currentImg.id]: { w: target.naturalWidth, h: target.naturalHeight }
                        }))
                      }
                    }}
                  />
                  
                  {showMarkings && shapes.length > 0 && imageSizes[currentImg.id] && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                      <svg
                        viewBox={`0 0 ${imageSizes[currentImg.id].w} ${imageSizes[currentImg.id].h}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 100 }}
                      >
                        {shapes.map((shape) => {
                          if (shape.type === 'line' && Array.isArray(shape.points) && shape.points.length > 0) {
                            return (
                              <polyline
                                key={shape.id}
                                points={shape.points.join(',')}
                                stroke={shape.color}
                                strokeWidth={6}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )
                          }
                          if (shape.type === 'rect') {
                            return (
                              <rect
                                key={shape.id}
                                x={shape.x}
                                y={shape.y}
                                width={shape.width}
                                height={shape.height}
                                stroke={shape.color}
                                strokeWidth={4}
                                fill="none"
                              />
                            )
                          }
                          if (shape.type === 'text') {
                            return (
                              <text
                                key={shape.id}
                                x={shape.x}
                                y={(shape.y || 0) + 24}
                                fill={shape.color}
                                fontSize={36}
                                fontWeight="bold"
                                fontFamily="system-ui, -apple-system, sans-serif"
                                style={{ textShadow: '1px 1px 2px black' }}
                              >
                                {shape.text}
                              </text>
                            )
                          }
                          return null
                        })}
                      </svg>
                    </div>
                  )}
                </div>

                {/* Clean metadata strip - Apple Photos style */}
                {hasMetadata && (
                  <div className="shrink-0 w-full" dir="rtl">
                    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex flex-col gap-1.5">
                      {currentImg.caption && (
                        <p className="text-white/90 text-[15px] sm:text-base font-medium leading-snug text-right">
                          {currentImg.caption}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {room && (
                          <span className="text-white/50 text-[12px] sm:text-[13px] font-medium">
                            {room.name}
                          </span>
                        )}
                        {room && itemTags.length > 0 && (
                          <span className="text-white/20 text-[12px]">·</span>
                        )}
                        {itemTags.map((t, i) => (
                          <span key={t.id} className="flex items-center gap-1">
                            <span className="text-white/40 text-[12px] sm:text-[13px] font-medium">{t.name}</span>
                            {i < itemTags.length - 1 && <span className="text-white/15 text-[12px] mr-1">,</span>}
                          </span>
                        ))}
                        
                        {currentImg.taken_at && (
                          <span className="text-white/30 text-[12px] font-normal mr-auto">
                            {formatDateDisplay(currentImg.taken_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          }
        }}
      />
      <style>{`
        /* styles.root is applied to .yarl__portal (not .yarl__root) */
        .yarl__portal {
          --yarl__color_backdrop: #000;
          --yarl__container_background_color: #000;
          background-color: #000 !important;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        /* iOS / Safari: pinch-zoom uses transform: scale(); unpainted edges can show GPU garbage — paint black + contain layers */
        .yarl__container {
          background-color: #000 !important;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        .yarl__carousel {
          background-color: #000 !important;
        }
        .yarl__slide {
          background-color: #000 !important;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .yarl__slide_wrapper,
        .yarl__slide_wrapper_interactive {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .reno-lb-img {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        .yarl__toolbar {
          background: transparent !important;
          border-bottom: none !important;
          padding: 12px 16px !important;
          box-shadow: none !important;
          gap: 2px !important;
        }
        .yarl__button {
          background: transparent !important;
          border: none !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          margin: 0 1px !important;
          color: rgba(255, 255, 255, 0.75) !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: color 0.15s ease, background-color 0.15s ease !important;
        }
        .yarl__button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          transform: none !important;
        }
        .yarl__button:active {
          background: rgba(255, 255, 255, 0.15) !important;
          transform: scale(0.92) !important;
        }
        .yarl__navigation_prev,
        .yarl__navigation_next {
          background: transparent !important;
          border: none !important;
          border-radius: 50% !important;
          width: 44px !important;
          height: 44px !important;
          color: rgba(255, 255, 255, 0.6) !important;
          padding: 0 !important;
        }
        .yarl__navigation_prev:hover,
        .yarl__navigation_next:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: white !important;
        }
        .yarl__thumbnails_container {
          background: transparent !important;
          border-top: none !important;
          padding-top: 8px !important;
          padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
        }
        .yarl__thumbnail {
          border-radius: 6px !important;
          border: 2px solid transparent !important;
          opacity: 0.5 !important;
          transition: opacity 0.2s ease, border-color 0.2s ease !important;
        }
        .yarl__thumbnail:hover {
          opacity: 0.8 !important;
        }
        .yarl__thumbnail_active {
          border-color: white !important;
          opacity: 1 !important;
        }
      `}</style>

      {mounted && showAnnotator && current.public_url && createPortal(
        <ImageAnnotator
          imageUrl={current.public_url}
          initialAnnotations={localAnnotations[current.id] || current.annotations || []}
          onSave={handleSaveAnnotations}
          onCancel={() => setShowAnnotator(false)}
        />,
        document.body
      )}

      {mounted && showDetails && createPortal(
        <div
          className={
            isMobile
              ? 'fixed inset-0 z-[10000] flex items-end justify-center p-0 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto'
              : 'fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto'
          }
          onClick={() => !saving && setShowDetails(false)}
        >
          <div 
            className={
              isMobile
                ? 'w-full max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] bg-[#1a1a1c] border border-white/10 border-b-0 rounded-t-[1.5rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up text-white/90'
                : 'w-full max-w-md bg-[#1a1a1c] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in text-white/90'
            }
            onClick={(e) => e.stopPropagation()}
            style={isMobile ? { paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' } : undefined}
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
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest pl-1">Tags</label>
                
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="New label..."
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const saveBtn = document.getElementById('lb-create-tag-btn')
                        if (saveBtn) saveBtn.click()
                      }
                    }}
                    className="flex-1 bg-black/40 border border-white/10 p-2 rounded-md text-[14px] text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner"
                  />
                  <button
                    id="lb-create-tag-btn"
                    type="button"
                    disabled={!newTag.trim() || saving || !project}
                    onClick={async () => {
                      if (!newTag.trim() || !project) return
                      setSaving(true)
                      try {
                        const created = await createGalleryTag(project.id, newTag.trim())
                        setNewTag('')
                        setEditTags(prev => [...prev, created.id])
                        onChanged() // Refreshes tags in bg
                      } catch (err) {
                        console.error(err)
                        alert('Create label failed')
                      } finally {
                        setSaving(false)
                      }
                    }}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
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
                )}
              </div>
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
