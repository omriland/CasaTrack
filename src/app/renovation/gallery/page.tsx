'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  createGalleryItem,
  listGalleryItems,
  listGalleryTags,
  listRooms,
  uploadGalleryPhoto,
  deleteGalleryItems,
  bulkAddTagToGalleryItems,
  bulkUpdateGalleryItemsRoom,
  createGalleryTag
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
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [lightbox, setLightbox] = useState<RenovationGalleryItem | null>(null)
  const [viewMode, setViewMode] = useState<'gallery' | 'all'>('gallery')
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | 'untagged' | null>(null)
  const [newTag, setNewTag] = useState<string>('')
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [filterTag, setFilterTag] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [bulkTagModal, setBulkTagModal] = useState(false)
  const [bulkRoomModal, setBulkRoomModal] = useState(false)

  useEffect(() => {
    const savedSort = localStorage.getItem('casatrack_gallery_sort')
    if (savedSort) setSortBy(savedSort)
    const savedView = localStorage.getItem('casatrack_gallery_view') as 'gallery' | 'all' | null
    if (savedView) setViewMode(savedView)
  }, [])

  const handleViewModeChange = (val: 'gallery' | 'all') => {
    setViewMode(val)
    localStorage.setItem('casatrack_gallery_view', val)
    setSelectedAlbumId(null)
  }

  const handleSortChange = (val: string) => {
    setSortBy(val)
    localStorage.setItem('casatrack_gallery_sort', val)
  }

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

  const isGalleryImageFile = (f: File) => {
    if (f.type.startsWith('image/')) return true
    return /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i.test(f.name)
  }

  const onFiles = async (files: FileList | File[] | null) => {
    if (!project || !files?.length) return
    const raw = Array.from(files)
    const filesArr = raw.filter(isGalleryImageFile)
    const skipped = raw.length - filesArr.length
    if (skipped > 0) {
      alert(`${skipped} file(s) skipped — only images can be added to Photos.`)
    }
    if (filesArr.length === 0) return

    setUploading(true)
    setUploadProgress({ done: 0, total: filesArr.length })
    const failures: { name: string; error: string }[] = []
    try {
      for (let i = 0; i < filesArr.length; i++) {
        const file = filesArr[i]!
        try {
          const path = await uploadGalleryPhoto(project.id, file)
          await createGalleryItem(project.id, { storage_path: path })
        } catch (e) {
          console.error('Gallery upload error:', e)
          const msg = e instanceof Error ? e.message : String(e)
          failures.push({ name: file.name, error: msg })
        } finally {
          setUploadProgress({ done: i + 1, total: filesArr.length })
        }
      }
      await load()
      if (failures.length > 0) {
        const lines = failures.map((f) => `• ${f.name}: ${f.error}`).join('\n')
        const ok = filesArr.length - failures.length
        alert(
          ok > 0
            ? `Uploaded ${ok} of ${filesArr.length} photo(s).\n\nFailed:\n${lines}\n\nIf all failed, ensure 02_storage.sql ran and bucket "renovation-gallery" exists.`
            : `Upload failed for all ${filesArr.length} photo(s):\n\n${lines}\n\nEnsure you ran 02_storage.sql and that the bucket "renovation-gallery" exists.`
        )
      }
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const openLightbox = (item: RenovationGalleryItem) => {
    setLightbox(item)
  }

  /** Must match the visual row order for shift+click range (sortedFiltered or album’s group.items). */
  const handleItemClick = (
    e: React.MouseEvent,
    item: RenovationGalleryItem,
    visibleOrder?: RenovationGalleryItem[]
  ) => {
    const list = visibleOrder ?? sortedFiltered
    if (e.shiftKey && lastSelectedId) {
      e.preventDefault()
      const lastIdx = list.findIndex((i) => i.id === lastSelectedId)
      const currentIdx = list.findIndex((i) => i.id === item.id)
      if (lastIdx > -1 && currentIdx > -1) {
        const start = Math.min(lastIdx, currentIdx)
        const end = Math.max(lastIdx, currentIdx)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          for (let i = start; i <= end; i++) {
            next.add(list[i]!.id)
          }
          return next
        })
        setLastSelectedId(item.id)
      }
      return
    }

    if (e.metaKey || e.ctrlKey || selectedIds.size > 0) {
      e.preventDefault()
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(item.id)) {
          next.delete(item.id)
        } else {
          next.add(item.id)
          setLastSelectedId(item.id)
        }
        return next
      })
      return
    }

    // Default action
    openLightbox(item)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} photos permanently?`)) return
    setUploading(true)
    try {
      const itemsToDelete = items.filter(i => selectedIds.has(i.id))
      await deleteGalleryItems(itemsToDelete)
      setSelectedIds(new Set())
      await load()
    } catch (e) {
      console.error(e)
      alert('Delete failed')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkTag = async (tagId: string) => {
    setUploading(true)
    try {
      await bulkAddTagToGalleryItems(Array.from(selectedIds), tagId)
      setSelectedIds(new Set())
      setBulkTagModal(false)
      await load()
    } catch (e) {
      console.error(e)
      alert('Adding tags failed')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkRoom = async (roomId: string | null) => {
    setUploading(true)
    try {
      await bulkUpdateGalleryItemsRoom(Array.from(selectedIds), roomId)
      setSelectedIds(new Set())
      setBulkRoomModal(false)
      await load()
    } catch (e) {
      console.error(e)
      alert('Assigning room failed')
    } finally {
      setUploading(false)
    }
  }

  const filtered = items.filter((it) => {
    if (filterRoom && it.room_id !== filterRoom) return false
    if (filterTag && !it.tag_ids?.includes(filterTag)) return false
    return true
  })

  const sortedFiltered = useMemo(() => {
    const result = [...filtered]
    if (sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === 'date-asc') {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sortBy === 'room') {
      result.sort((a, b) => {
        const rA = rooms.find(r => r.id === a.room_id)?.name || 'ZZZ'
        const rB = rooms.find(r => r.id === b.room_id)?.name || 'ZZZ'
        return rA.localeCompare(rB)
      })
    } else if (sortBy === 'label') {
      result.sort((a, b) => {
        const aTag = a.tag_ids?.[0]
        const bTag = b.tag_ids?.[0]
        const tA = (aTag ? tags.find(x => x.id === aTag)?.name : 'ZZZ') || 'ZZZ'
        const tB = (bTag ? tags.find(x => x.id === bTag)?.name : 'ZZZ') || 'ZZZ'
        return tA.localeCompare(tB)
      })
    }
    return result
  }, [filtered, sortBy, rooms, tags])

  const groupedItems = useMemo(() => {
    if (viewMode !== 'gallery') return []
    const groups: { tagId: string | null; name: string; items: RenovationGalleryItem[] }[] = []
    
    tags.forEach(t => {
      const itemsForTag = sortedFiltered.filter(i => i.tag_ids?.includes(t.id))
      // Sort items by date desc inside groups
      itemsForTag.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      if (itemsForTag.length > 0) {
        groups.push({ tagId: t.id, name: t.name, items: itemsForTag })
      }
    })

    const untaggedItems = sortedFiltered.filter(i => !i.tag_ids || i.tag_ids.length === 0)
    if (untaggedItems.length > 0) {
      untaggedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      groups.push({ tagId: null, name: 'Untagged', items: untaggedItems })
    }

    return groups
  }, [sortedFiltered, tags, viewMode])

  const renderItem = (item: RenovationGalleryItem, showRoom: boolean = false, selectionOrder?: RenovationGalleryItem[]) => {
    const isSelected = selectedIds.has(item.id)
    return (
      <div
        key={item.id}
        onClick={(e) => handleItemClick(e, item, selectionOrder)}
        className={`aspect-[4/5] sm:aspect-square rounded-2xl md:rounded-[1.5rem] overflow-hidden bg-slate-100 active:scale-[0.96] hover:shadow-md transition-all relative group cursor-pointer shadow-sm border border-slate-200/50 outline-none ${isSelected ? 'ring-4 ring-indigo-500 scale-[0.96] opacity-90' : ''}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.public_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        
        {/* Checkbox overlay — same shift+range as card click (stopPropagation would skip parent otherwise) */}
        <div 
          onClick={(e) => {
            e.stopPropagation()
            const list = selectionOrder ?? sortedFiltered
            if (e.shiftKey && lastSelectedId) {
              e.preventDefault()
              const lastIdx = list.findIndex((i) => i.id === lastSelectedId)
              const currentIdx = list.findIndex((i) => i.id === item.id)
              if (lastIdx > -1 && currentIdx > -1) {
                const start = Math.min(lastIdx, currentIdx)
                const end = Math.max(lastIdx, currentIdx)
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  for (let i = start; i <= end; i++) {
                    next.add(list[i]!.id)
                  }
                  return next
                })
                setLastSelectedId(item.id)
              }
              return
            }
            setSelectedIds((prev) => {
              const next = new Set(prev)
              if (next.has(item.id)) {
                next.delete(item.id)
              } else {
                next.add(item.id)
                setLastSelectedId(item.id)
              }
              return next
            })
          }}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm scale-110' : 'bg-black/20 border-white/80 text-transparent hover:bg-black/40 hover:border-white scale-100 hover:scale-110'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {showRoom && item.room_id && (
          <div className="absolute top-2 left-2 pointer-events-none">
            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2 py-1.5 rounded-md tracking-wide shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              {rooms.find(r => r.id === item.room_id)?.name || 'Room'}
            </span>
          </div>
        )}

        {item.tag_ids && item.tag_ids.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
            {item.tag_ids.slice(0, 3).map(tid => {
              const t = tags.find(x => x.id === tid)
              return t ? (
                <span key={tid} className="bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                  {t.name}
                </span>
              ) : null
            })}
          </div>
        )}
      </div>
    )
  }

  const handleCreateAndApplyTag = async () => {
    if (!newTag.trim() || !project) return
    setUploading(true)
    try {
      const created = await createGalleryTag(project.id, newTag.trim())
      setTags(prev => [...prev, created])
      setNewTag('')
      await bulkAddTagToGalleryItems(Array.from(selectedIds), created.id)
      setSelectedIds(new Set())
      setBulkTagModal(false)
      await load()
    } catch (e) {
      console.error(e)
      alert('Creating and applying label failed')
    } finally {
      setUploading(false)
    }
  }

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
    <div 
      className="space-y-6 pb-20 md:pb-8 animate-fade-in-up relative min-h-[70vh]"
      onDragEnter={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isDragging) setIsDragging(true)
      }}
    >
      {isDragging && (
        <div 
          className="absolute inset-x-0 inset-y-[-20px] md:inset-[-20px] z-[100] flex items-center justify-center bg-indigo-50/90 rounded-[2rem] border-2 border-dashed border-indigo-400 backdrop-blur-sm"
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              onFiles(e.dataTransfer.files)
            }
          }}
        >
          <div className="bg-white/80 px-8 py-6 rounded-2xl shadow-xl flex flex-col items-center pointer-events-none">
            <svg className="w-12 h-12 text-indigo-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-xl font-bold text-slate-700">Drop images here</p>
            <p className="text-sm text-slate-500 mt-1">Release to upload to gallery</p>
          </div>
        </div>
      )}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>

          <h1 className="text-[32px] font-bold tracking-tight text-slate-900 font-sans">Photos</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">
            Snap, tag, and organize progress — add <span className="font-semibold text-slate-500">multiple photos</span> at once.
          </p>
        </div>
        <div className="hidden md:block">
          <label className="h-11 px-6 rounded-full bg-indigo-600 text-white text-[15px] font-bold flex items-center justify-center cursor-pointer hover:bg-indigo-700 shadow-sm active:scale-95 transition-all min-w-[10rem]">
            {uploading
              ? uploadProgress && uploadProgress.total > 1
                ? `${uploadProgress.done}/${uploadProgress.total}`
                : 'Uploading…'
              : '+ Add Photos'}
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
      </header>

      <div className="flex bg-slate-200/50 p-1.5 rounded-xl w-fit mb-2 mt-4">
        <button
          onClick={() => handleViewModeChange('gallery')}
          className={`px-5 py-2 rounded-lg text-[14px] font-bold transition-all ${
            viewMode === 'gallery'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Albums
        </button>
        <button
          onClick={() => handleViewModeChange('all')}
          className={`px-5 py-2 rounded-lg text-[14px] font-bold transition-all ${
            viewMode === 'all'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All Photos
        </button>
      </div>

      {(rooms.length > 0 || tags.length > 0 || items.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative z-[90] flex-1">
            <Dropdown
              value={filterRoom}
              onChange={(val) => setFilterRoom(val)}
              options={[{ value: '', label: 'All Rooms' }, ...rooms.map(r => ({ value: r.id, label: r.name }))]}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
          <div className="relative z-[80] flex-1">
            <Dropdown
              value={filterTag}
              onChange={(val) => setFilterTag(val)}
              options={[{ value: '', label: 'All Tags' }, ...tags.map(t => ({ value: t.id, label: t.name }))]}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
          <div className="relative z-[70] flex-1 sm:max-w-[160px]">
            <Dropdown
              value={sortBy}
              onChange={handleSortChange}
              options={[
                { value: 'date-desc', label: 'Newest First' },
                { value: 'date-asc', label: 'Oldest First' },
                { value: 'room', label: 'Sort by Room' },
                { value: 'label', label: 'Sort by Label' }
              ]}
              className="w-full h-11 rounded-xl border border-slate-200 bg-white text-[15px] font-medium text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white border border-slate-100 shadow-sm animate-pulse" />
          ))}
        </div>
      ) : sortedFiltered.length === 0 ? (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 p-16 text-center mt-6">
           <div className="inline-flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[16px] font-bold text-slate-600 uppercase tracking-tight">No photos yet</p>
              <p className="text-[14px] text-slate-400 mt-1 max-w-xs mx-auto">
                Use <span className="font-semibold text-slate-500">+ Add Photos</span> to pick many images at once, or drag &amp; drop here.
              </p>
           </div>
        </div>
      ) : viewMode === 'gallery' ? (
        <div className="space-y-8 mt-6">
          {!selectedAlbumId ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {groupedItems.map(group => {
                const cover = group.items[0]
                return (
                  <div 
                    key={group.tagId || 'untagged'} 
                    onClick={() => setSelectedAlbumId(group.tagId || 'untagged')}
                    className="cursor-pointer group relative aspect-square rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-100 shadow-sm border border-slate-200/50 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    {cover ? (
                      <img src={cover.public_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 right-4 text-white pointer-events-none">
                      <h3 className="font-bold text-[16px] truncate">{group.name}</h3>
                      <p className="text-[12px] font-medium text-white/80">{group.items.length} photo{group.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
              {groupedItems.length === 0 && (
                <p className="text-slate-400 py-4 col-span-full">No albums match your filters.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button 
                  onClick={() => setSelectedAlbumId(null)} 
                  className="text-[14px] font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 active:scale-95"
                >
                  <svg className="w-4 h-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Albums
                </button>
                {(() => {
                  const group = groupedItems.find(g => (g.tagId || 'untagged') === selectedAlbumId)
                  if (!group) return null
                  return (
                    <>
                      <span className="text-slate-300">/</span>
                      <span className="text-[14px] font-bold text-slate-900">{group.name}</span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{group.items.length}</span>
                    </>
                  )
                })()}
              </div>
              
              {(() => {
                const group = groupedItems.find(g => (g.tagId || 'untagged') === selectedAlbumId)
                if (!group) return <p className="text-slate-400 py-10">Album not found or filtered out.</p>
                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                    {group.items.map((item) => renderItem(item, false, group.items))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 mt-6">
          {sortedFiltered.map(item => renderItem(item, true))}
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-24 right-4 z-40">
        <label
          title={uploading ? 'Uploading photos' : 'Add photos (multiple)'}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-[0_8px_30px_rgba(79,70,229,0.4)] ${uploading ? 'bg-slate-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer'}`}
        >
          {uploading ? (
             <span className="text-[10px] font-extrabold leading-tight text-center px-1 tabular-nums">
               {uploadProgress && uploadProgress.total > 1
                 ? `${uploadProgress.done}/${uploadProgress.total}`
                 : '…'}
             </span>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
             </svg>
          )}
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

      {lightbox && (
        <Lightbox
          images={sortedFiltered}
          initialIndex={sortedFiltered.findIndex(i => i.id === lightbox.id)}
          rooms={rooms}
          tags={tags}
          onClose={() => setLightbox(null)}
          onChanged={() => load()}
        />
      )}

      {/* Floating Action Bar for Bulk Select */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-[110px] md:bottom-8 left-1/2 -translate-x-1/2 z-[90] bg-slate-900 border border-white/10 text-white px-5 py-3 rounded-full shadow-2xl flex items-center justify-center gap-4 animate-slide-up whitespace-nowrap">
          <span className="font-bold text-[14px]">
            <span className="text-indigo-400">{selectedIds.size}</span> Selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={() => setBulkTagModal(true)} disabled={uploading} className="text-[13px] font-bold tracking-wide uppercase px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50">
            Apply Label
          </button>
          <button onClick={() => setBulkRoomModal(true)} disabled={uploading} className="text-[13px] font-bold tracking-wide uppercase px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50">
            Assign Room
          </button>
          <button onClick={handleBulkDelete} disabled={uploading} className="text-[13px] font-bold tracking-wide uppercase px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg transition-colors disabled:opacity-50">
            Delete
          </button>
          <div className="h-4 w-px bg-white/20 ml-1" />
          <button onClick={() => { setSelectedIds(new Set()); setLastSelectedId(null) }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Bulk Tag Modal */}
      {bulkTagModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !uploading && setBulkTagModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl flex flex-col p-6 animate-zoom-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Add Label to {selectedIds.size} photo{selectedIds.size > 1 ? 's' : ''}</h3>
            <p className="text-[13px] text-slate-500 mt-1 mb-4">Select a label to apply to all selected photos.</p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New label name..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTag.trim() && !uploading) {
                    e.preventDefault();
                    handleCreateAndApplyTag();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[14px] outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                disabled={!newTag.trim() || uploading}
                onClick={handleCreateAndApplyTag}
                className="px-4 py-2 bg-indigo-600 text-white text-[13px] font-bold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto w-full">
              {tags.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => handleBulkTag(t.id)}
                  disabled={uploading}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 font-bold transition-all disabled:opacity-50 active:scale-95"
                >
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block mr-2 shadow-sm" />
                  {t.name}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-[14px] text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No labels exist yet.<br/>Create them first in a single photo&apos;s Details panel.
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setBulkTagModal(false)}
                disabled={uploading} 
                className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Room Modal */}
      {bulkRoomModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !uploading && setBulkRoomModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl flex flex-col p-6 animate-zoom-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900">Assign Room to {selectedIds.size} photo{selectedIds.size > 1 ? 's' : ''}</h3>
            <p className="text-[13px] text-slate-500 mt-1 mb-4">Select a room to group these photos.</p>

            {(() => {
              const selectedPhotosRooms = new Set(
                Array.from(selectedIds)
                  .map(id => items.find(i => i.id === id)?.room_id)
                  .filter(Boolean)
              )
              return (
                <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto w-full">
                  <button 
                    onClick={() => handleBulkRoom(null)}
                    disabled={uploading}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-500 hover:text-slate-700 font-bold transition-all disabled:opacity-50 active:scale-95"
                  >
                    No Room (Clear)
                  </button>
                  {rooms.map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => handleBulkRoom(r.id)}
                      disabled={uploading}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 font-bold transition-all disabled:opacity-50 active:scale-95 flex items-center justify-between"
                    >
                      <div>
                        <span className="w-3 h-3 rounded-full bg-slate-300 inline-block mr-2 shadow-sm" />
                        {r.name}
                      </div>
                      {selectedPhotosRooms.has(r.id) && (
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                  {rooms.length === 0 && (
                    <p className="text-[14px] text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No rooms exist yet.<br/>Create them first in settings or the Rooms tab.
                    </p>
                  )}
                </div>
              )
            })()}

            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setBulkRoomModal(false)}
                disabled={uploading} 
                className="px-4 py-2 rounded-lg font-bold text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
