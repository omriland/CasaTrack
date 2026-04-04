'use client'

import Link from 'next/link'
import { deleteProjectFile } from '@/lib/renovation'
import type { RenovationFile } from '@/types/renovation'
import { formatBytes, getFileIcon, IconExternal, IconTrash, IconUpload } from './files-shared'
import { useRenovationFilesPageState } from './useRenovationFilesPageState'
import { useConfirm } from '@/providers/ConfirmProvider'

export function FilesMobile() {
  const {
    project,
    loading,
    uploading,
    uploadProgress,
    filterRoom,
    setFilterRoom,
    defaultRoom,
    setDefaultRoom,
    searchQuery,
    setSearchQuery,
    load,
    handleFiles,
    saveRoom,
    filtered,
    rooms,
  } = useRenovationFilesPageState()
  const confirmAction = useConfirm()

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] py-8">
        <p className="text-slate-500 text-center px-4 text-[16px]">You need an active project.</p>
        <Link href="/renovation" className="mt-4 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white font-semibold text-[16px] inline-flex items-center">
          Go to overview
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      <header>
        <h1 className="text-[24px] font-bold text-slate-900">Files</h1>
        <p className="text-[14px] text-slate-500 mt-1">Contracts, PDFs, and scans in one place.</p>
      </header>

      {/* Upload button */}
      <div className="rounded-2xl bg-white border border-slate-200/60 p-5 shadow-sm flex flex-col items-center gap-3">
        <div className="p-3 rounded-xl bg-slate-100 text-slate-500">
          <IconUpload />
        </div>
        <label className="min-h-[48px] w-full max-w-xs rounded-xl bg-indigo-600 text-white text-[16px] font-bold flex items-center justify-center cursor-pointer active:scale-[0.98] transition-transform">
          {uploading ? (
            <span className="tabular-nums">{uploadProgress ? `${uploadProgress.done}/${uploadProgress.total}` : 'Uploading…'}</span>
          ) : (
            'Choose files to upload'
          )}
          <input
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      </div>

      {rooms.length > 0 && (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-4 flex flex-col gap-2 shadow-sm">
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Default room for uploads</span>
          <select value={defaultRoom} onChange={(e) => setDefaultRoom(e.target.value)} className="min-h-[48px] px-3 rounded-xl border border-slate-200 text-[16px] bg-slate-50">
            <option value="">None</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Search & filter */}
      <div className="space-y-3">
        <input
          type="search"
          placeholder="Search files…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 text-[16px] outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {rooms.length > 0 && (
          <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="w-full min-h-[48px] px-3 rounded-xl border border-slate-200 text-[16px] bg-white">
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white p-10 text-center shadow-sm">
          {searchQuery || filterRoom ? (
            <>
              <p className="text-[16px] font-bold text-slate-700">No files match</p>
              <p className="text-[14px] text-slate-500 mt-1">Try a different search or filter.</p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-bold text-slate-700">No files yet</p>
              <p className="text-[14px] text-slate-500 mt-1">Upload your first file above.</p>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((f: RenovationFile) => (
            <li key={f.id} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-slate-50 rounded-xl shrink-0">{getFileIcon(f.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-slate-900 truncate" dir="auto">{f.display_name}</p>
                  <p className="text-[14px] text-slate-400 font-medium mt-0.5">{formatBytes(f.file_size)}</p>
                  {rooms.length > 0 && (
                    <select
                      value={f.room_id || ''}
                      onChange={(e) => saveRoom(f, e.target.value)}
                      className="mt-3 w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50"
                    >
                      <option value="">No room</option>
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2 mt-3">
                    {f.public_url && (
                      <a
                        href={f.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-200 font-bold text-[14px] text-indigo-600 flex items-center justify-center gap-2 active:bg-slate-50"
                      >
                        <IconExternal />
                        Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => (await confirmAction('Delete this file?')) && deleteProjectFile(f).then(load)}
                      className="flex-1 min-h-[44px] rounded-xl bg-rose-50 text-rose-600 font-bold text-[14px] flex items-center justify-center gap-2 active:bg-rose-100"
                    >
                      <IconTrash />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
