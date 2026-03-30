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
    dragOver,
    setDragOver,
    filterRoom,
    setFilterRoom,
    defaultRoom,
    setDefaultRoom,
    searchQuery,
    setSearchQuery,
    editingFileId,
    editingFileName,
    setEditingFileName,
    load,
    handleFiles,
    saveName,
    startEditing,
    saveRoom,
    filtered,
    setEditingFileId,
    rooms,
  } = useRenovationFilesPageState()
  const confirmAction = useConfirm()

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] py-8">
        <p className="text-slate-500 text-center px-4">You need an active project.</p>
        <Link href="/renovation" className="mt-4 min-h-[48px] px-6 rounded-xl bg-indigo-600 text-white font-semibold inline-flex items-center">
          Go to overview
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 animate-fade-in-up">

      {rooms.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Default room for uploads</span>
          <select value={defaultRoom} onChange={(e) => setDefaultRoom(e.target.value)} className="min-h-[48px] px-3 rounded-xl border border-slate-200 text-[15px] bg-slate-50">
            <option value="">None</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`rounded-2xl border-2 border-dashed py-8 px-4 flex flex-col items-center transition-all ${
          dragOver ? 'border-indigo-400 bg-indigo-50/80' : 'border-slate-200 bg-white'
        }`}
      >
        <div className={`p-3 rounded-xl mb-2 ${dragOver ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          <IconUpload />
        </div>
        <p className="text-[15px] font-semibold text-slate-800 text-center">{dragOver ? 'Drop to upload' : 'Drag files here or choose'}</p>
        <label className="mt-3 min-h-[44px] px-6 rounded-xl bg-slate-900 text-white text-[14px] font-bold flex items-center cursor-pointer">
          Choose files
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
        {uploading && uploadProgress && (
          <p className="text-[12px] font-bold text-indigo-600 mt-3 tabular-nums">
            {uploadProgress.done} / {uploadProgress.total}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <input
          type="search"
          placeholder="Search files…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 text-[16px] outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="w-full min-h-[48px] px-3 rounded-xl border border-slate-200 text-[15px] bg-white">
          <option value="">All rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-200/50 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-white p-10 text-center text-slate-500 text-[15px]">No files match.</div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((f: RenovationFile) => (
            <li key={f.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-slate-50 rounded-xl shrink-0">{getFileIcon(f.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  {editingFileId === f.id ? (
                    <input
                      autoFocus
                      dir="auto"
                      value={editingFileName}
                      onChange={(e) => setEditingFileName(e.target.value)}
                      onBlur={() => saveName(f, editingFileName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName(f, editingFileName)
                        if (e.key === 'Escape') setEditingFileId(null)
                      }}
                      className="w-full text-[15px] font-bold text-indigo-700 border border-indigo-200 rounded-lg px-2 py-1.5"
                    />
                  ) : (
                    <button type="button" onClick={() => startEditing(f)} className="text-left w-full">
                      <p className="text-[16px] font-bold text-slate-900 truncate">{f.display_name}</p>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">{formatBytes(f.file_size)}</p>
                    </button>
                  )}
                  <select
                    value={f.room_id || ''}
                    onChange={(e) => saveRoom(f, e.target.value)}
                    className="mt-3 w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-[14px] bg-slate-50"
                  >
                    <option value="">Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2 mt-3">
                    {f.public_url && (
                      <a
                        href={f.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-200 font-bold text-[14px] text-indigo-600 flex items-center justify-center gap-2"
                      >
                        <IconExternal />
                        Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={async () => (await confirmAction('Delete this file?')) && deleteProjectFile(f).then(load)}
                      className="flex-1 min-h-[44px] rounded-xl bg-rose-50 text-rose-600 font-bold text-[14px] flex items-center justify-center gap-2"
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
