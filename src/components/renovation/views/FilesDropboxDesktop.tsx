'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { DropboxEntry } from './useDropboxFilesPageState'
import { useDropboxFilesPageState } from './useDropboxFilesPageState'
import { useConfirm } from '@/providers/ConfirmProvider'
import {
  formatBytes,
  formatDate,
  getFileIcon,
  IconFolderFilled,
  IconDownload,
  IconTrash,
  IconUpload,
  IconListView,
  IconGridView,
} from './files-shared'

/* ── Toolbar icons ──────────────────────────────────────────────── */

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
)
const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)
const IconSortAsc = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7-7 7 7" /></svg>
)
const IconSortDesc = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
)
const IconBreadcrumbSep = () => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" className="text-slate-300">
    <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ── Types ──────────────────────────────────────────────────────── */

type SortField = 'name' | 'modified' | 'size'
type SortDir = 'asc' | 'desc'

const INTERNAL_DRAG_TYPE = 'application/x-dbx-entry'

function sortEntries(entries: DropboxEntry[], field: SortField, dir: SortDir): DropboxEntry[] {
  const folders = entries.filter((e) => e.tag === 'folder')
  const files = entries.filter((e) => e.tag === 'file')

  const cmp = (a: DropboxEntry, b: DropboxEntry) => {
    let v = 0
    if (field === 'name') {
      v = a.name.localeCompare(b.name, 'he')
    } else if (field === 'modified') {
      const am = a.tag === 'file' ? a.modified : ''
      const bm = b.tag === 'file' ? b.modified : ''
      v = am.localeCompare(bm)
    } else if (field === 'size') {
      const as_ = a.tag === 'file' ? a.size : 0
      const bs = b.tag === 'file' ? b.size : 0
      v = as_ - bs
    }
    return dir === 'asc' ? v : -v
  }

  folders.sort(cmp)
  files.sort(cmp)
  return [...folders, ...files]
}

/** Extract the parent folder portion of a pathDisplay, relative to a scope path. */
function parentPath(entry: DropboxEntry, scopePath: string): string {
  const full = entry.pathDisplay || entry.pathLower
  const idx = full.lastIndexOf('/')
  if (idx <= 0) return ''
  const parent = full.slice(0, idx)
  const scopeNorm = scopePath.replace(/\/+$/, '')
  if (parent.toLowerCase() === scopeNorm.toLowerCase()) return ''
  if (parent.toLowerCase().startsWith(scopeNorm.toLowerCase() + '/')) {
    return parent.slice(scopeNorm.length + 1)
  }
  return parent
}

/* ── Main component ─────────────────────────────────────────────── */

export function FilesDropboxDesktop({ configured }: { configured: boolean }) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)

  const state = useDropboxFilesPageState(configured)
  const {
    loading, loadError, entries, breadcrumbs, uploading, uploadProgress, currentPath,
    dragOver, setDragOver, searchQuery, setSearchQuery, isSearching,
    navigateTo, navigateToIndex, uploadFiles, deleteEntry, moveEntry, openFileUrl, reload,
  } = state

  const confirmAction = useConfirm()
  const uploadFilesRef = useRef(uploadFiles)
  useEffect(() => { uploadFilesRef.current = uploadFiles }, [uploadFiles])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sorted = sortEntries(entries, sortField, sortDir)
  const folderCount = entries.filter((e) => e.tag === 'folder').length
  const fileCount = entries.filter((e) => e.tag === 'file').length

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }, [sortField])

  const handleOpen = useCallback((e: DropboxEntry) => {
    if (e.tag === 'folder') navigateTo(e)
    else window.open(openFileUrl(e), '_blank', 'noopener')
  }, [navigateTo, openFileUrl])

  const handleDelete = useCallback(async (e: DropboxEntry) => {
    if (e.tag === 'folder') return
    if (await confirmAction(`Delete "${e.name}"?`)) {
      await deleteEntry(e)
      setSelected(null)
    }
  }, [confirmAction, deleteEntry])

  /* ── Internal drag-to-folder handlers ─────────────────────────── */

  const handleDragStart = useCallback((ev: React.DragEvent, entry: DropboxEntry) => {
    ev.dataTransfer.setData(INTERNAL_DRAG_TYPE, JSON.stringify(entry))
    ev.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleFolderDragOver = useCallback((ev: React.DragEvent, folderPath: string) => {
    if (!ev.dataTransfer.types.includes(INTERNAL_DRAG_TYPE)) return
    ev.preventDefault()
    ev.dataTransfer.dropEffect = 'move'
    setDropTarget(folderPath)
  }, [])

  const handleFolderDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleFolderDrop = useCallback(async (ev: React.DragEvent, targetFolder: DropboxEntry & { tag: 'folder' }) => {
    ev.preventDefault()
    ev.stopPropagation()
    setDropTarget(null)

    const raw = ev.dataTransfer.getData(INTERNAL_DRAG_TYPE)
    if (!raw) return
    const entry = JSON.parse(raw) as DropboxEntry
    if (entry.pathLower === targetFolder.pathLower) return

    setMoving(true)
    try {
      await moveEntry(entry, targetFolder)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Move failed')
    } finally {
      setMoving(false)
    }
  }, [moveEntry])

  /* ── External file upload via drag ────────────────────────────── */
  useEffect(() => {
    const onDragOver = (ev: DragEvent) => {
      if (ev.dataTransfer?.types.includes(INTERNAL_DRAG_TYPE)) return
      ev.preventDefault()
      setDragOver(true)
    }
    const onDragLeave = (ev: DragEvent) => {
      ev.preventDefault()
      if (!ev.relatedTarget || (ev.relatedTarget as HTMLElement).nodeName === 'HTML') setDragOver(false)
    }
    const onDrop = (ev: DragEvent) => {
      ev.preventDefault()
      setDragOver(false)
      if (ev.dataTransfer?.files.length) uploadFilesRef.current(ev.dataTransfer.files)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => { window.removeEventListener('dragover', onDragOver); window.removeEventListener('dragleave', onDragLeave); window.removeEventListener('drop', onDrop) }
  }, [setDragOver])

  /* clear selection on navigate */
  useEffect(() => { setSelected(null) }, [breadcrumbs])

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 flex flex-col items-center max-w-sm text-center gap-3">
          <IconFolderFilled size={32} />
          <p className="text-[15px] font-semibold text-slate-700">Dropbox not configured</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">Set <code className="text-indigo-600 bg-indigo-50 px-1 rounded text-[12px]">NEXT_PUBLIC_RENOVATION_FILES_STORAGE=dropbox</code> and the <code className="text-indigo-600 bg-indigo-50 px-1 rounded text-[12px]">DROPBOX_*</code> env vars.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* ── External drop overlay ── */}
      {dragOver && (
        <div className="fixed inset-0 z-[100] bg-blue-50/90 backdrop-blur-sm border-4 border-dashed border-blue-400 flex flex-col items-center justify-center pointer-events-none rounded-xl">
          <IconFolderFilled size={48} />
          <p className="text-[18px] font-semibold text-blue-700 mt-4">Drop files to upload</p>
        </div>
      )}

      {/* ── Upload / moving overlay ── */}
      {(uploading || moving) && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          {uploading ? (
            <>
              <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-blue-500 rounded-full transition-[width] duration-300" style={{ width: uploadProgress && uploadProgress.total > 0 ? `${(100 * uploadProgress.done) / uploadProgress.total}%` : '40%' }} />
              </div>
              <p className="text-[13px] font-medium text-slate-600">
                Uploading{uploadProgress && uploadProgress.total > 1 ? ` ${uploadProgress.done} of ${uploadProgress.total}` : ''}…
              </p>
            </>
          ) : (
            <p className="text-[13px] font-medium text-slate-600">Moving…</p>
          )}
        </div>
      )}

      {/* ── Finder toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 rounded-t-xl sticky top-0 z-10">
        {/* Nav arrows */}
        <div className="flex items-center gap-0.5 mr-2">
          <button
            type="button"
            onClick={() => navigateToIndex(breadcrumbs.length - 2)}
            disabled={breadcrumbs.length === 0}
            className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Back"
          >
            <IconChevronLeft />
          </button>
          <button type="button" disabled className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 opacity-30 pointer-events-none">
            <IconChevronRight />
          </button>
        </div>

        {/* Breadcrumb path */}
        <nav className="flex items-center gap-1 min-w-0 flex-1 text-[13px] font-medium overflow-hidden" aria-label="Folder path">
          <button type="button" onClick={() => navigateToIndex(-1)} className="text-slate-500 hover:text-slate-900 shrink-0 transition-colors">
            Files
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1 min-w-0">
              <IconBreadcrumbSep />
              <button
                type="button"
                onClick={() => navigateToIndex(i)}
                className={`truncate transition-colors ${i === breadcrumbs.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>

        {/* Right tools */}
        <div className="flex items-center gap-1 shrink-0">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100/80 rounded-md p-0.5">
            <button type="button" onClick={() => setViewMode('list')} className={`h-6 w-6 flex items-center justify-center rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="List"><IconListView /></button>
            <button type="button" onClick={() => setViewMode('grid')} className={`h-6 w-6 flex items-center justify-center rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`} title="Grid"><IconGridView /></button>
          </div>

          {/* Upload */}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors" title="Upload files">
            <IconUpload />
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" disabled={uploading} onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }} />

          {/* Search */}
          <div className="relative ml-1 flex items-center">
            <span className="absolute left-2 pointer-events-none"><IconSearch /></span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-36 pl-7 pr-2 rounded-md border border-slate-200 bg-slate-50/80 text-[13px] outline-none focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {loadError && (
        <div className="mx-3 mt-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 flex items-center gap-3 text-[13px]">
          <span className="text-rose-600 font-medium flex-1">{loadError}</span>
          <button type="button" onClick={reload} className="font-semibold text-rose-600 hover:underline">Retry</button>
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-auto px-0.5">
        {loading ? (
          <div className="space-y-px mt-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-50 animate-pulse mx-1 rounded" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <IconFolderFilled size={40} />
            <p className="text-[14px] font-medium text-slate-500 mt-3">{searchQuery ? 'No matching items' : 'This folder is empty'}</p>
            {!searchQuery && <p className="text-[12px] text-slate-400 mt-1">Drop files here or click the upload button</p>}
          </div>
        ) : viewMode === 'list' ? (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-1.5 pl-3 pr-2">
                  <button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    Name {sortField === 'name' && (sortDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />)}
                  </button>
                </th>
                <th className="py-1.5 px-2 w-40">
                  <button type="button" onClick={() => toggleSort('modified')} className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                    Date Modified {sortField === 'modified' && (sortDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />)}
                  </button>
                </th>
                <th className="py-1.5 px-2 w-24 text-right">
                  <button type="button" onClick={() => toggleSort('size')} className="flex items-center gap-1 ml-auto hover:text-slate-600 transition-colors">
                    Size {sortField === 'size' && (sortDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />)}
                  </button>
                </th>
                <th className="py-1.5 px-2 w-16" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => {
                const isDropHover = e.tag === 'folder' && dropTarget === e.pathLower
                return (
                  <tr
                    key={e.pathLower}
                    draggable
                    onDragStart={(ev) => handleDragStart(ev, e)}
                    onDragOver={e.tag === 'folder' ? (ev) => handleFolderDragOver(ev, e.pathLower) : undefined}
                    onDragLeave={e.tag === 'folder' ? handleFolderDragLeave : undefined}
                    onDrop={e.tag === 'folder' ? (ev) => handleFolderDrop(ev, e) : undefined}
                    className={`group cursor-default border-b border-slate-50 transition-colors ${
                      isDropHover
                        ? 'bg-blue-100 ring-2 ring-inset ring-blue-400'
                        : selected === e.pathLower
                          ? 'bg-blue-500/10'
                          : 'hover:bg-slate-50/80'
                    }`}
                    onClick={() => setSelected(e.pathLower)}
                    onDoubleClick={() => handleOpen(e)}
                  >
                    <td className="py-1.5 pl-3 pr-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 w-5 flex items-center justify-center">
                          {e.tag === 'folder' ? <IconFolderFilled /> : getFileIcon(e.name)}
                        </span>
                        <div className="min-w-0">
                          <span className="truncate font-medium text-slate-800 block" dir="auto">{e.name}</span>
                          {isSearching && (() => {
                            const p = parentPath(e, currentPath)
                            return p ? <span className="text-[11px] text-slate-400 truncate block" dir="auto">{p}</span> : null
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-slate-400 tabular-nums">{e.tag === 'file' ? formatDate(e.modified) : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-slate-400 tabular-nums">{e.tag === 'file' ? formatBytes(e.size) : '—'}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {e.tag === 'file' && (
                          <>
                            <a href={openFileUrl(e)} target="_blank" rel="noopener noreferrer" className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download" onClick={(ev) => ev.stopPropagation()}>
                              <IconDownload />
                            </a>
                            <button type="button" onClick={(ev) => { ev.stopPropagation(); handleDelete(e) }} className="h-6 w-6 flex items-center justify-center rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="Delete">
                              <IconTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-5 gap-3 p-3">
            {sorted.map((e) => {
              const isDropHover = e.tag === 'folder' && dropTarget === e.pathLower
              return (
                <div
                  key={e.pathLower}
                  draggable
                  onDragStart={(ev) => handleDragStart(ev, e)}
                  onDragOver={e.tag === 'folder' ? (ev) => handleFolderDragOver(ev, e.pathLower) : undefined}
                  onDragLeave={e.tag === 'folder' ? handleFolderDragLeave : undefined}
                  onDrop={e.tag === 'folder' ? (ev) => handleFolderDrop(ev, e) : undefined}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-default text-center ${
                    isDropHover
                      ? 'bg-blue-100 ring-2 ring-blue-400 scale-105'
                      : selected === e.pathLower
                        ? 'bg-blue-500/10 ring-1 ring-blue-300'
                        : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelected(e.pathLower)}
                  onDoubleClick={() => handleOpen(e)}
                >
                  <span className="flex items-center justify-center w-12 h-12">
                    {e.tag === 'folder' ? <IconFolderFilled size={40} /> : <span className="scale-[1.8]">{getFileIcon(e.name)}</span>}
                  </span>
                  <span className="text-[12px] font-medium text-slate-700 truncate w-full leading-tight" dir="auto">{e.name}</span>
                  {isSearching && (() => {
                    const p = parentPath(e, currentPath)
                    return p ? <span className="text-[10px] text-slate-400 truncate w-full block" dir="auto">{p}</span> : null
                  })()}
                  {e.tag === 'file' && <span className="text-[10px] text-slate-400">{formatBytes(e.size)}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/70 backdrop-blur-xl border-t border-slate-200/80 rounded-b-xl text-[11px] text-slate-400 font-medium">
        <span>
          {folderCount > 0 && `${folderCount} folder${folderCount > 1 ? 's' : ''}`}
          {folderCount > 0 && fileCount > 0 && ', '}
          {fileCount > 0 && `${fileCount} file${fileCount > 1 ? 's' : ''}`}
          {folderCount === 0 && fileCount === 0 && (loading ? 'Loading…' : 'No items')}
        </span>
        {selected && (
          <span className="text-blue-500">
            {entries.find((e) => e.pathLower === selected)?.name}
          </span>
        )}
      </div>
    </div>
  )
}
