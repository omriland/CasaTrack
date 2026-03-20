'use client'

import Link from 'next/link'
import { deleteProjectFile } from '@/lib/renovation'
import type { RenovationFile } from '@/types/renovation'
import {
  formatBytes,
  getFileIcon,
  IconExternal,
  IconGridView,
  IconListView,
  IconTrash,
  IconUpload,
} from './files-shared'
import { useRenovationFilesPageState } from './useRenovationFilesPageState'

export function FilesDesktop() {
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
    viewMode,
    setViewMode,
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-sm text-center">
          <p className="text-slate-500 mb-4">You need an active project to manage files.</p>
          <Link href="/renovation" className="h-11 px-6 inline-flex items-center rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
            Go to projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-row items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-slate-900 font-sans">Project Files</h1>
          <p className="text-[15px] font-medium text-slate-400 mt-1 max-w-md">Keep all your receipts, contracts, and blueprints in one place.</p>
        </div>

        {rooms.length > 0 && (
          <div className="glass-subtle px-4 py-3 rounded-2xl flex items-center gap-3 border-white/50 shadow-sm animate-scale-in">
            <span className="text-[13px] font-semibold text-slate-500">Auto-assign Room:</span>
            <select
              value={defaultRoom}
              onChange={(e) => setDefaultRoom(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white/50 text-slate-700 text-[13px] focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="">None</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

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
        className={`relative group rounded-[2rem] border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center py-10 px-6 ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50/80 scale-[1.01] shadow-xl shadow-indigo-500/10'
            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'
        }`}
      >
        <div className={`p-4 rounded-2xl ${dragOver ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-indigo-500 group-hover:bg-indigo-50'} transition-all mb-2`}>
          <IconUpload />
        </div>
        <p className="text-[16px] font-semibold text-slate-700">{dragOver ? 'Drop files to upload' : 'Drag and drop files here'}</p>
        <p className="text-[13px] text-slate-400 mt-1">
          Select or drop <span className="font-semibold text-slate-500">multiple files</span> at once — PDF, images, docs, and more.
        </p>

        <label className="cursor-pointer mt-4">
          <span className="h-10 px-6 inline-flex items-center rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-colors shadow-sm active:scale-95">
            Choose files
          </span>
          <input
            type="file"
            multiple
            name="files"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>

        {uploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-4 text-center">
            <div className="w-full max-w-[220px] h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-indigo-600 rounded-full transition-[width] duration-200 ease-out"
                style={{
                  width:
                    uploadProgress && uploadProgress.total > 0 ? `${(100 * uploadProgress.done) / uploadProgress.total}%` : '40%',
                }}
              />
            </div>
            <p className="text-[14px] font-bold text-indigo-600 uppercase tracking-widest">Uploading…</p>
            {uploadProgress && uploadProgress.total > 1 && (
              <p className="text-[13px] font-semibold text-slate-500 mt-2 tabular-nums">
                {uploadProgress.done} / {uploadProgress.total} files
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-row items-center justify-between gap-4 glass p-2 rounded-2xl border-white/60">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-100 bg-white text-[14px] outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
          </div>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-100 bg-white text-[14px] font-medium text-slate-600 outline-none hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <option value="">All rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
          <button type="button" onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="List view">
            <IconListView />
          </button>
          <button type="button" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`} title="Grid view">
            <IconGridView />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-3'}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-slate-50/50 rounded-2xl border border-slate-100/60 animate-pulse ${viewMode === 'grid' ? 'aspect-[4/5]' : 'h-20'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 p-16 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full text-slate-300 mb-4 scale-110">
            {getFileIcon(null)}
          </div>
          <p className="text-[16px] font-bold text-slate-600 uppercase tracking-tight">No documents found</p>
          <p className="text-[14px] text-slate-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms, or upload some files above.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-4 gap-4 animate-fade-in-up">
          {filtered.map((f, idx) => (
            <div
              key={f.id}
              className="group glass p-4 rounded-3xl border border-slate-200/50 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/[0.04] animate-spring-in flex flex-col items-center text-center gap-3 relative"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="p-5 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors w-full flex items-center justify-center aspect-square">
                <div className="scale-150 transform group-hover:scale-[1.7] transition-transform duration-500">{getFileIcon(f.mime_type)}</div>
              </div>

              <div className="w-full space-y-1">
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
                    className="w-full text-[14px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg text-center outline-none px-2 py-0.5"
                  />
                ) : (
                  <span
                    onDoubleClick={() => startEditing(f)}
                    title="Double click to rename"
                    className="block w-full text-[14px] font-bold text-slate-900 truncate text-center cursor-edit hover:text-indigo-600 transition-colors"
                  >
                    {f.display_name}
                  </span>
                )}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatBytes(f.file_size)}</p>
              </div>

              <div className="w-full flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-50">
                <select
                  value={f.room_id || ''}
                  onChange={(e) => saveRoom(f, e.target.value)}
                  className="flex-1 h-7 bg-white/50 rounded-lg text-[11px] font-bold text-slate-500 outline-none border border-transparent hover:border-slate-100 transition-all px-1 cursor-pointer"
                >
                  <option value="">No room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1">
                  {f.public_url && (
                    <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Open file">
                      <IconExternal />
                    </a>
                  )}
                  <button type="button" onClick={() => confirm('Delete this file?') && deleteProjectFile(f).then(load)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete file">
                    <IconTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 overflow-hidden animate-fade-in-up">
          <div className="divide-y divide-slate-50">
            {filtered.map((f: RenovationFile, idx) => (
              <div key={f.id} className="group p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-all animate-spring-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">{getFileIcon(f.mime_type)}</div>

                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
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
                        className="flex-1 text-[15px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none"
                      />
                    ) : (
                      <span onDoubleClick={() => startEditing(f)} title="Double click to rename" className="flex-1 text-[15px] font-bold text-slate-900 cursor-edit hover:text-indigo-600 transition-colors truncate">
                        {f.display_name}
                      </span>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-medium text-slate-400">{formatBytes(f.file_size)}</span>
                      {f.room && (
                        <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">{f.room.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={f.room_id || ''}
                    onChange={(e) => saveRoom(f, e.target.value)}
                    className="h-9 px-3 rounded-xl border border-transparent bg-slate-50 text-[13px] font-medium text-slate-500 outline-none hover:bg-white hover:border-slate-100 transition-all cursor-pointer min-w-[120px]"
                  >
                    <option value="">Assign to Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    {f.public_url && (
                      <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all" title="Open file">
                        <IconExternal />
                      </a>
                    )}
                    <button type="button" onClick={() => confirm('Delete this file?') && deleteProjectFile(f).then(load)} className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100" title="Delete file">
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
