'use client'

import { useState } from 'react'
import type { DropboxEntry } from './useDropboxFilesPageState'
import { useDropboxFilesPageState } from './useDropboxFilesPageState'
import { useConfirm } from '@/providers/ConfirmProvider'
import {
  formatBytes,
  formatDate,
  getFileIcon,
  IconFolderFilled,
  IconTrash,
  IconUpload,
  IconDownload,
} from './files-shared'

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M9 18l6-6-6-6" /></svg>
)
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
)

export function FilesDropboxMobile({ configured }: { configured: boolean }) {
  const {
    loading, loadError, entries, breadcrumbs, uploading, uploadProgress, currentPath,
    searchQuery, setSearchQuery, isSearching, navigateTo, navigateToIndex,
    uploadFiles, deleteEntry, openFileUrl, reload,
  } = useDropboxFilesPageState(configured)

  const confirmAction = useConfirm()
  const isRoot = breadcrumbs.length === 0
  const [showSearch, setShowSearch] = useState(false)

  if (!configured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] py-8 px-4 text-center">
        <IconFolderFilled size={32} />
        <p className="text-[15px] font-semibold text-slate-700 mt-3">Dropbox not configured</p>
        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">Set the required env vars and redeploy.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-28 animate-fade-in">
      {/* ── Upload overlay ── */}
      {uploading && (
        <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur flex flex-col items-center justify-center">
          <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-blue-500 rounded-full transition-[width] duration-300" style={{ width: uploadProgress && uploadProgress.total > 0 ? `${(100 * uploadProgress.done) / uploadProgress.total}%` : '40%' }} />
          </div>
          <p className="text-[13px] font-medium text-slate-600">
            Uploading{uploadProgress && uploadProgress.total > 1 ? ` ${uploadProgress.done}/${uploadProgress.total}` : ''}…
          </p>
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center gap-2 px-1 py-2">
        {!isRoot && (
          <button type="button" onClick={() => navigateToIndex(breadcrumbs.length - 2)} className="h-9 w-9 flex items-center justify-center rounded-xl text-blue-500 active:bg-blue-50 shrink-0">
            <IconChevronLeft />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-[20px] font-bold text-slate-900 truncate" dir="auto">
            {isRoot ? 'Files' : breadcrumbs[breadcrumbs.length - 1]?.name ?? 'Files'}
          </h1>
        </div>
        <button type="button" onClick={() => setShowSearch((v) => !v)} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-500 active:bg-slate-100 shrink-0">
          <IconSearch />
        </button>
        <label className="h-9 w-9 flex items-center justify-center rounded-xl text-blue-500 active:bg-blue-50 shrink-0 cursor-pointer">
          <IconUpload />
          <input type="file" multiple className="hidden" disabled={uploading} onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }} />
        </label>
      </header>

      {/* ── Search ── */}
      {showSearch && (
        <div className="px-1 pb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><IconSearch /></span>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 text-[15px] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
      )}

      {/* ── Breadcrumb trail (non-root) ── */}
      {!isRoot && (
        <div className="flex items-center gap-1 px-3 pb-2 text-[12px] font-medium text-slate-400 overflow-x-auto scrollbar-hide">
          <button type="button" onClick={() => navigateToIndex(-1)} className="shrink-0 text-blue-500">Files</button>
          {breadcrumbs.slice(0, -1).map((c, i) => (
            <span key={c.path} className="flex items-center gap-1 shrink-0">
              <IconChevronRight />
              <button type="button" onClick={() => navigateToIndex(i)} className="text-blue-500">{c.name}</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {loadError && (
        <div className="mx-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-3 text-[13px]">
          <span className="text-rose-600 font-medium flex-1">{loadError}</span>
          <button type="button" onClick={reload} className="font-semibold text-rose-600">Retry</button>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-px px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100/60 animate-pulse rounded-lg" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconFolderFilled size={36} />
          <p className="text-[14px] font-medium text-slate-500 mt-3">{searchQuery ? 'No matching items' : 'This folder is empty'}</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 mx-1 bg-white rounded-xl overflow-hidden">
          {entries.map((e) => (
            <MobileRow
              key={e.pathLower}
              entry={e}
              confirmAction={confirmAction}
              deleteEntry={deleteEntry}
              navigateTo={navigateTo}
              isSearching={isSearching}
              currentPath={currentPath}
              openFileUrl={openFileUrl}
            />
          ))}
        </ul>
      )}

      {/* ── Item count ── */}
      {!loading && entries.length > 0 && (
        <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
          {entries.length} item{entries.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

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

function MobileRow({
  entry: e,
  confirmAction,
  deleteEntry,
  navigateTo,
  openFileUrl,
  isSearching,
  currentPath,
}: {
  entry: DropboxEntry
  confirmAction: (msg: string) => Promise<boolean>
  deleteEntry: (e: DropboxEntry) => Promise<void>
  navigateTo: (e: DropboxEntry & { tag: 'folder' }) => void
  openFileUrl: (e: DropboxEntry & { tag: 'file' }) => string
  isSearching: boolean
  currentPath: string
}) {
  const [swiped, setSwiped] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)

  const handleTouchStart = (ev: React.TouchEvent) => setTouchStartX(ev.touches[0]!.clientX)
  const handleTouchEnd = (ev: React.TouchEvent) => {
    const dx = ev.changedTouches[0]!.clientX - touchStartX
    if (dx < -60) setSwiped(true)
    else if (dx > 40) setSwiped(false)
  }

  const handleTap = () => {
    if (swiped) { setSwiped(false); return }
    if (e.tag === 'folder') navigateTo(e)
    else window.open(openFileUrl(e), '_blank', 'noopener')
  }

  return (
    <li className="relative overflow-hidden">
      {/* Swipe actions (files only) */}
      {e.tag === 'file' && (
        <div className={`absolute inset-y-0 right-0 flex transition-transform duration-200 ${swiped ? 'translate-x-0' : 'translate-x-full'}`}>
          <a
            href={openFileUrl(e)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-16 bg-blue-500 text-white flex flex-col items-center justify-center text-[10px] font-semibold gap-0.5"
            onClick={(ev) => ev.stopPropagation()}
          >
            <IconDownload />
            Open
          </a>
          <button
            type="button"
            onClick={async (ev) => {
              ev.stopPropagation()
              if (await confirmAction(`Delete "${e.name}"?`)) deleteEntry(e)
              setSwiped(false)
            }}
            className="w-16 bg-rose-500 text-white flex flex-col items-center justify-center text-[10px] font-semibold gap-0.5"
          >
            <IconTrash />
            Delete
          </button>
        </div>
      )}

      {/* Row content */}
      <div
        className={`flex items-center gap-3 px-3 py-3 bg-white transition-transform duration-200 active:bg-slate-50 ${swiped && e.tag === 'file' ? '-translate-x-32' : 'translate-x-0'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
      >
        <span className="shrink-0 w-8 h-8 flex items-center justify-center">
          {e.tag === 'folder' ? <IconFolderFilled size={28} /> : <span className="scale-[1.15]">{getFileIcon(e.name)}</span>}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-slate-900 truncate" dir="auto">{e.name}</p>
          {isSearching && (() => {
            const p = parentPath(e, currentPath)
            return p ? <p className="text-[11px] text-blue-400 truncate" dir="auto">{p}</p> : null
          })()}
          <p className="text-[12px] text-slate-400 mt-0.5">
            {e.tag === 'file' ? `${formatBytes(e.size)} · ${formatDate(e.modified)}` : 'Folder'}
          </p>
        </div>
        {e.tag === 'folder' && (
          <span className="shrink-0"><IconChevronRight /></span>
        )}
      </div>
    </li>
  )
}
