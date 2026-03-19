'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRenovation } from '@/components/renovation/RenovationContext'
import {
  deleteProjectFile,
  listProjectFiles,
  listRooms,
  updateProjectFile,
  uploadProjectFile,
} from '@/lib/renovation'
import type { RenovationFile, RenovationRoom } from '@/types/renovation'

// --- Icons ---
const IconFile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
)
const IconImage = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
)
const IconPdf = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 13v4"/><path d="M12 13v4"/><path d="M15 13v4"/></svg>
)
const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
)
const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
)
const IconExternal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
)
const IconListView = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
)
const IconGridView = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
)

function formatBytes(n: number | null): string {
  if (n == null || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <IconFile />
  if (mimeType.startsWith('image/')) return <IconImage />
  if (mimeType === 'application/pdf') return <IconPdf />
  return <IconFile />
}

export default function RenovationFilesPage() {
  const { project } = useRenovation()
  const [files, setFiles] = useState<RenovationFile[]>([])
  const [rooms, setRooms] = useState<RenovationRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [filterRoom, setFilterRoom] = useState<string>('')
  const [defaultRoom, setDefaultRoom] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState('')

  const load = useCallback(async () => {
    if (!project) return
    setLoading(true)
    try {
      const [f, r] = await Promise.all([listProjectFiles(project.id), listRooms(project.id)])
      setFiles(f)
      setRooms(r)
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    load()
  }, [load])

  const handleFiles = async (list: FileList | null) => {
    if (!project || !list?.length) return
    setUploading(true)
    try {
      const room = defaultRoom || null
      for (let i = 0; i < list.length; i++) {
        await uploadProjectFile(project.id, list[i]!, room)
      }
      await load()
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : String(e)
      alert(`Upload failed: ${msg}`)
    } finally {
      setUploading(false)
    }
  }

  const saveName = async (f: RenovationFile, name: string) => {
    const trimmed = name.trim()
    setEditingFileId(null)
    if (!trimmed || trimmed === f.display_name) return
    try {
      await updateProjectFile(f.id, { display_name: trimmed })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not rename')
    }
  }

  const startEditing = (f: RenovationFile) => {
    setEditingFileId(f.id)
    setEditingFileName(f.display_name)
  }

  const saveRoom = async (f: RenovationFile, roomId: string) => {
    try {
      await updateProjectFile(f.id, { room_id: roomId || null })
      await load()
    } catch (e) {
      console.error(e)
      alert('Could not update room')
    }
  }

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesRoom = !filterRoom || f.room_id === filterRoom
      const matchesSearch = !searchQuery || f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesRoom && matchesSearch
    })
  }, [files, filterRoom, searchQuery])

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
      {/* Header section with Glass Effect */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-1">Documentation Hub</p>
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

      {/* Upload Zone */}
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
        <p className="text-[16px] font-semibold text-slate-700">
          {dragOver ? 'Drop files to upload' : 'Drag and drop files here'}
        </p>
        <p className="text-[13px] text-slate-400 mt-1 mb-4">Supports PDF, JPG, PNG, and more</p>
        
        <label className="cursor-pointer">
          <span className="h-10 px-6 inline-flex items-center rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-colors shadow-sm active:scale-95">
            Choose from device
          </span>
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
        
        {uploading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
             <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
               <div className="h-full bg-indigo-600 rounded-full animate-progress" />
             </div>
             <p className="text-[14px] font-bold text-indigo-600 uppercase tracking-widest">Uploading Files...</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-2 rounded-2xl border-white/60">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            title="List view"
          >
            <IconListView />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            title="Grid view"
          >
            <IconGridView />
          </button>
        </div>
      </div>

      {/* Files List/Grid */}
      {loading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3"}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-slate-50/50 rounded-2xl border border-slate-100/60 animate-pulse ${viewMode === 'grid' ? 'aspect-[4/5]' : 'h-20'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/50 rounded-[2.5rem] border border-slate-100 p-16 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 bg-slate-50 rounded-full text-slate-300 mb-4 scale-110">
            <IconFile />
          </div>
          <p className="text-[16px] font-bold text-slate-600 uppercase tracking-tight">No documents found</p>
          <p className="text-[14px] text-slate-400 mt-1 max-w-xs mx-auto">Try adjusting your filters or search terms, or upload some files above.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
           {filtered.map((f, idx) => (
             <div 
               key={f.id} 
               className="group glass p-4 rounded-3xl border border-slate-200/50 transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/[0.04] animate-spring-in flex flex-col items-center text-center gap-3 relative"
               style={{ animationDelay: `${idx * 0.05}s` }}
             >
                <div className="p-5 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors w-full flex items-center justify-center aspect-square">
                   <div className="scale-150 transform group-hover:scale-[1.7] transition-transform duration-500">
                    {getFileIcon(f.mime_type)}
                   </div>
                </div>
                
                <div className="w-full space-y-1">
                  <input
                    dir="auto"
                    defaultValue={f.display_name}
                    onBlur={(e) => saveName(f, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    className="w-full text-[14px] font-bold text-slate-900 bg-transparent border-none text-center outline-none p-0 h-auto overflow-hidden text-ellipsis whitespace-nowrap"
                  />
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
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  
                  <div className="flex gap-1">
                    {f.public_url && (
                      <a href={f.public_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Open file">
                        <IconExternal />
                      </a>
                    )}
                    <button 
                      onClick={() => confirm('Delete this file?') && deleteProjectFile(f).then(load)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete file"
                    >
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
            {filtered.map((f, idx) => (
              <div 
                key={f.id} 
                className="group p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-all animate-spring-in"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all shrink-0">
                  {getFileIcon(f.mime_type)}
                </div>
                
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <input
                      dir="auto"
                      defaultValue={f.display_name}
                      onBlur={(e) => saveName(f, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      className="flex-1 text-[15px] font-bold text-slate-900 bg-transparent border-none outline-none p-0 focus:text-indigo-600 transition-colors truncate"
                    />
                    <div className="hidden lg:flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-medium text-slate-400">{formatBytes(f.file_size)}</span>
                      {f.room && (
                        <span className="text-[11px] font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                          {f.room.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={f.room_id || ''}
                    onChange={(e) => saveRoom(f, e.target.value)}
                    className="hidden md:block h-9 px-3 rounded-xl border border-transparent bg-slate-50 text-[13px] font-medium text-slate-500 outline-none hover:bg-white hover:border-slate-100 transition-all cursor-pointer min-w-[120px]"
                  >
                    <option value="">Assign to Room</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  
                  <div className="flex items-center gap-1 group/actions">
                    {f.public_url && (
                      <a 
                        href={f.public_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
                        title="Open file"
                      >
                        <IconExternal />
                      </a>
                    )}
                    <button 
                      onClick={() => confirm('Delete this file?') && deleteProjectFile(f).then(load)}
                      className="h-9 w-9 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 group-hover/actions:opacity-100 transition-opacity"
                      title="Delete file"
                    >
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
