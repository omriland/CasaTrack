'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Property, PropertyStatus, Note, Attachment } from '@/types/property'
import { PROPERTY_STATUS_OPTIONS, getStatusLabel } from '@/constants/statuses'
import { getPropertyNotes, createNote, updateNote, deleteNote, updatePropertyStatus, updateProperty } from '@/lib/properties'
import { getPropertyAttachments, getAttachmentUrl, deleteAttachment, uploadAttachment } from '@/lib/attachments'
import StarRating from './StarRating'

interface PropertyDetailModalProps {
  property: Property
  onClose: () => void
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onStatusUpdate?: (propertyId: string, newStatus: PropertyStatus) => void
  onPropertyUpdate?: (updatedProperty: Property) => void
  onRatingUpdate?: (propertyId: string, rating: number) => void
  onDataRefresh?: () => void
  onNotesChanged?: () => void
  onNotesDelta?: (propertyId: string, delta: number) => void
}

export default function PropertyDetailModal({
  property,
  onClose,
  onEdit,
  onDelete,
  onStatusUpdate,
  onPropertyUpdate,
  onRatingUpdate,
  onDataRefresh,
  onNotesChanged,
  onNotesDelta
}: PropertyDetailModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempDescription, setTempDescription] = useState(property.description || '')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [isMac, setIsMac] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null)
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)

  useEffect(() => {
    loadNotes()
    loadAttachments()
  }, [property.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAttachments = async () => {
    setAttachmentsLoading(true)
    try {
      const data = await getPropertyAttachments(property.id)
      setAttachments(data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    setDeletingAttachment(attachmentId)
    try {
      await deleteAttachment(attachmentId)
      setAttachments(attachments.filter(a => a.id !== attachmentId))
      if (selectedAttachmentIndex !== null && attachments[selectedAttachmentIndex]?.id === attachmentId) {
        setSelectedAttachmentIndex(null)
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete attachment')
    } finally {
      setDeletingAttachment(null)
    }
  }

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2, // Maximum size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true,
      fileType: file.type,
    }

    try {
      const compressedFile = await imageCompression(file, options)
      console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      return compressedFile
    } catch (error) {
      console.error('Error compressing image:', error)
      // Return original file if compression fails
      return file
    }
  }

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current

    try {
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      return ffmpeg
    } catch (error) {
      console.error('Error loading FFmpeg:', error)
      throw error
    }
  }

  const compressVideo = async (file: File): Promise<File> => {
    // Only compress videos larger than 50MB to avoid unnecessary processing
    const MAX_SIZE_BEFORE_COMPRESSION = 50 * 1024 * 1024 // 50MB
    if (file.size <= MAX_SIZE_BEFORE_COMPRESSION) {
      return file
    }

    try {
      const ffmpeg = await loadFFmpeg()
      if (!ffmpeg) {
        console.warn('FFmpeg not loaded, returning original file')
        return file
      }

      // Write input file to FFmpeg's virtual file system
      const inputFileName = 'input.' + file.name.split('.').pop()
      const outputFileName = 'output.mp4'

      await ffmpeg.writeFile(inputFileName, await fetchFile(file))

      // Compress video: reduce bitrate and resolution if needed
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vf', 'scale=1920:-2', // Scale down to max 1920px width, maintain aspect ratio
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '28', // Balance between quality and file size (18-28 is good range)
        '-c:a', 'aac',
        '-b:a', '128k', // Audio bitrate
        '-movflags', '+faststart', // Optimize for web playback
        outputFileName
      ])

      // Read the compressed file
      const data = await ffmpeg.readFile(outputFileName)
      // Convert FileData to ArrayBuffer for Blob constructor
      let arrayBuffer: ArrayBuffer
      if (data instanceof Uint8Array) {
        // Create a new ArrayBuffer by copying the data
        arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
      } else if (typeof data === 'string') {
        arrayBuffer = new TextEncoder().encode(data).buffer
      } else {
        arrayBuffer = data as ArrayBuffer
      }
      const compressedBlob = new Blob([arrayBuffer], { type: 'video/mp4' })

      // Clean up virtual files
      await ffmpeg.deleteFile(inputFileName)
      await ffmpeg.deleteFile(outputFileName)

      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.mp4'), {
        type: 'video/mp4',
        lastModified: Date.now()
      })

      console.log(`Video compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)

      // If compression didn't reduce size significantly, return original
      if (compressedFile.size >= file.size * 0.9) {
        console.log('Compression did not reduce size significantly, using original')
        return file
      }

      return compressedFile
    } catch (error) {
      console.error('Error compressing video:', error)
      // Return original file if compression fails
      return file
    }
  }

  const processAndUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    setUploadingAttachment(true)
    try {
      // Process each file (compress images and videos)
      const processedFiles: File[] = []
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file)
          processedFiles.push(compressed)
        } else if (file.type.startsWith('video/')) {
          // Compress videos (only if larger than 50MB)
          const compressed = await compressVideo(file)
          processedFiles.push(compressed)
        } else if (file.type === 'application/pdf') {
          // PDFs don't need compression
          processedFiles.push(file)
        } else {
          processedFiles.push(file)
        }
      }

      // Upload processed files
      const uploadPromises = processedFiles.map(file => uploadAttachment(property.id, file))
      const newAttachments = await Promise.all(uploadPromises)
      setAttachments(prev => [...prev, ...newAttachments])
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setUploadingAttachment(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    await processAndUploadFiles(files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the modal itself
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processAndUploadFiles(files)
    }
  }

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}?property=${property.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      } catch (err) {
        alert('Failed to copy URL. Please copy manually: ' + url)
      }
      document.body.removeChild(textArea)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Detect Mac for keyboard shortcut display
    setIsMac(typeof navigator !== 'undefined' && navigator.platform.includes('Mac'))

    // Detect mobile for placeholder display
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Focus the contentEditable div when editing starts
  useEffect(() => {
    if (editingDescription) {
      const editableDiv = document.querySelector('[contenteditable="true"]') as HTMLDivElement
      if (editableDiv) {
        editableDiv.focus()
        // Clear placeholder if it exists
        if (editableDiv.innerHTML.includes('Add a description for this property')) {
          editableDiv.innerHTML = tempDescription || ''
        }
      }
    }
  }, [editingDescription, tempDescription])

  // Handle click outside for status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }

    if (showStatusDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusDropdown])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await getPropertyNotes(property.id)
      setNotes(data)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    try {
      setSubmitting(true)
      const note = await createNote(property.id, newNote.trim())
      setNotes(prev => [note, ...prev])
      setNewNote('')
      // Trigger data refresh to update notes count on cards
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
      // Trigger data refresh to update notes count on cards
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note. Please try again.')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id)
    setEditingNoteContent(note.content)
  }

  const handleSaveNoteEdit = async () => {
    if (!editingNoteId || !editingNoteContent.trim()) return

    try {
      const updatedNote = await updateNote(editingNoteId, editingNoteContent.trim())
      setNotes(prev => prev.map(note => note.id === editingNoteId ? updatedNote : note))
      setEditingNoteId(null)
      setEditingNoteContent('')
      // Trigger data refresh to ensure consistency
      if (onDataRefresh) {
        await onDataRefresh()
      }
    } catch (error) {
      console.error('Error updating note:', error)
      alert('Error updating note. Please try again.')
    }
  }

  const handleCancelNoteEdit = () => {
    setEditingNoteId(null)
    setEditingNoteContent('')
  }

  const handleNoteEditKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      await handleSaveNoteEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelNoteEdit()
    }
  }

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(property.id, newStatus)
      } else {
        await updatePropertyStatus(property.id, newStatus)
      }
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating property status:', error)
      alert('Error updating property status. Please try again.')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    })
  }

  const formatNoteDate = (dateString: string) => {
    const now = new Date()
    const noteDate = new Date(dateString)
    const diffMs = now.getTime() - noteDate.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Less than a minute ago
    if (diffMinutes < 1) {
      return 'Just now'
    }

    // Less than an hour ago - show minutes
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`
    }

    // Less than 24 hours ago - show hours
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }

    // Yesterday
    if (diffDays === 1) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `Yesterday, ${timeStr}`
    }

    // Today (more than 24 hours but same calendar day)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate())
    if (today.getTime() === noteDay.getTime()) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `Today, ${timeStr}`
    }

    // Within a couple of days (2-3 days)
    if (diffDays <= 3) {
      const timeStr = noteDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      return `${diffDays} days ago, ${timeStr}`
    }

    // Older than a couple of days - use full date format
    return formatDate(dateString)
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = now.getTime() - then.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const getStatusColor = (status: PropertyStatus) => {
    const colors = {
      'Seen': 'bg-slate-100 text-slate-700 border-slate-200',
      'Interested': 'bg-emerald-100 text-emerald-800 border-emerald-400 font-semibold',
      'Contacted Realtor': 'bg-blue-50 text-blue-700 border-blue-200',
      'Visited': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      'On Hold': 'bg-orange-100 text-orange-700 border-orange-200',
      'Irrelevant': 'bg-red-50 text-red-700 border-red-200',
      'Purchased': 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const handleDescriptionEdit = () => {
    setEditingDescription(true)
    setTempDescription(property.description || '')
  }

  const handleDescriptionSave = async () => {
    try {
      const updatedProperty = await updateProperty(property.id, { description: tempDescription })
      if (onPropertyUpdate) {
        onPropertyUpdate(updatedProperty)
      }
      setEditingDescription(false)
    } catch (error) {
      console.error('Error updating description:', error)
      alert('Error updating description. Please try again.')
    }
  }

  const handleDescriptionCancel = () => {
    setEditingDescription(false)
    setTempDescription(property.description || '')
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Cmd+B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
      // Update the temp description with the new HTML content
      const element = e.currentTarget
      setTempDescription(element.innerHTML)
    }

    // Handle Enter for line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertHTML', false, '<br>')
      // Update the temp description with the new HTML content
      const element = e.currentTarget
      setTempDescription(element.innerHTML)
    }
  }

  const handleDescriptionInput = (e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    let content = element.innerHTML

    // Remove placeholder content if it exists
    if (content.includes('Add a description for this property')) {
      content = ''
      element.innerHTML = ''
    }

    setTempDescription(content)
  }

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    // Clear placeholder on focus
    if (element.innerHTML.includes('Add a description for this property')) {
      element.innerHTML = ''
      setTempDescription('')
    }
  }

  const handleNoteKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (newNote.trim() && !submitting) {
        // Submit the note directly instead of calling handleAddNote with keyboard event
        try {
          setSubmitting(true)
          const note = await createNote(property.id, newNote.trim())
          setNotes(prev => [note, ...prev])
          setNewNote('')
          // Trigger data refresh to update notes count on cards
          if (onDataRefresh) {
            await onDataRefresh()
          }
        } catch (error) {
          console.error('Error adding note:', error)
          alert('Error adding note. Please try again.')
        } finally {
          setSubmitting(false)
        }
      }
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4 z-50 animate-fade-in"
        onClick={onClose}
      >
        <div
          className={`bg-white md:rounded-lg md:shadow-2xl md:border md:border-slate-200 w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] overflow-hidden flex flex-col animate-fade-in relative ${
            isDragging ? 'ring-4 ring-primary ring-offset-2' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-lg z-50 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <svg className="w-16 h-16 text-primary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-semibold text-primary">Drop files here to upload</p>
                <p className="text-sm text-slate-600 mt-2">Images, Videos, or PDFs</p>
              </div>
            </div>
          )}
          {/* Header - Purple Gradient */}
          <div className="relative bg-gradient-to-r from-[oklch(0.4_0.22_280)] to-[oklch(0.5_0.22_280)] px-4 py-4 md:px-10 md:py-6">
            {/* Action Buttons - Top Right Corner */}
            <div className="absolute top-4 right-4 md:top-6 md:right-10 flex items-center space-x-2 z-10">
              {/* Copy URL Button */}
              <button
                onClick={handleCopyUrl}
                className={`p-2 text-white hover:bg-white/20 rounded-lg transition-all ${
                  copiedUrl ? 'bg-white/30' : ''
                }`}
                title={copiedUrl ? 'URL Copied!' : 'Copy shareable link'}
              >
                {copiedUrl ? (
                  <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-all"
                title="Close"
              >
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col space-y-2 md:space-y-3 pr-10">
              {/* Title */}
              <h2 className="text-lg md:text-2xl font-bold text-white line-clamp-2 leading-tight">
                {property.title}
              </h2>

              {/* Location with pin icon */}
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white line-clamp-1" title={property.address}>
                  {property.address}
                </span>
              </div>

              {/* Status Button */}
              <div className="relative inline-block" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${property.status === 'Interested'
                      ? 'bg-[oklch(0.6_0.22_280)] text-white hover:bg-[oklch(0.65_0.22_280)] status-highlight'
                      : property.status === 'Contacted Realtor'
                        ? 'bg-[oklch(0.6_0.22_280)] text-white hover:bg-[oklch(0.65_0.22_280)]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {getStatusLabel(property.status)}
                  <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 animate-fade-in">
                    {PROPERTY_STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2 ${status.value === property.status ? 'bg-slate-50 font-medium' : ''
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.value).split(' ')[0].replace('bg-', 'bg-')}`}></div>
                        <span>{status.label}</span>
                        {status.value === property.status && (
                          <svg className="w-3 h-3 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50 md:bg-white">
            <div className="px-4 py-4 md:px-10 md:py-6 bg-white">
              {/* Rating Section */}
              <div className="mb-4 md:mb-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Rating</h3>
                    <p className="text-xs text-slate-500">Click stars to rate this property</p>
                  </div>
                  <StarRating
                    rating={property.rating}
                    onRatingChange={(rating) => onRatingUpdate?.(property.id, rating)}
                    size="lg"
                    interactive={true}
                  />
                </div>
              </div>
              {/* Asking Price Section - Mobile: Single Column, Desktop: 3 Columns */}
              {property.asked_price !== null && property.asked_price !== 1 ? (
                <div className="bg-gray-50 rounded-lg p-4 md:bg-gray-50 md:rounded md:p-6 mb-4 md:mb-6 pb-4 md:pb-6 border-b md:border md:border-gray-300 md:border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Price Column */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Asking Price</div>
                      <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        <span>{formatPrice(property.asked_price)}</span>₪
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        {property.price_per_meter !== null && property.asked_price !== null && property.asked_price !== 1 && property.square_meters !== null && property.square_meters !== 1 ? (
                          <span>{formatPrice(Math.round(property.price_per_meter))}₪ per m²</span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </div>
                    {/* Size Column */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Size</div>
                      <div className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                        {property.square_meters && property.square_meters !== 1 ? (
                          <>
                            <span>{property.square_meters}</span> m²
                          </>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </div>
                      {property.balcony_square_meters && property.balcony_square_meters !== 1 && property.balcony_square_meters > 0 && (
                        <div className="text-xs text-gray-500">
                          <span>{property.balcony_square_meters}</span> m² balcony
                        </div>
                      )}
                    </div>
                    {/* Rooms Column */}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Rooms</div>
                      <div className="text-lg md:text-xl font-bold text-gray-900">
                        <span>{property.rooms}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Asking Price</div>
                  <div className="text-sm text-gray-500">—</div>
                </div>
              )}

              {/* Details Section - Tabular Format */}
              <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200 space-y-3">
                <div className="text-xs text-gray-500 mb-3 uppercase font-semibold md:hidden">Details</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Type</span>
                  <span className="text-sm text-gray-700">{property.property_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Source</span>
                  <span className="text-sm text-gray-700">{property.source}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Broker</span>
                  <span className="text-sm text-gray-700">{property.apartment_broker ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Added</span>
                  <span className="text-sm text-gray-700">{getRelativeTime(property.created_at)}</span>
                </div>
                {property.url && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Listing</span>
                    <a
                      href={property.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Link
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                <div className="text-xs text-gray-500 mb-3 uppercase font-semibold">Description</div>
                {editingDescription ? (
                  <div className="space-y-4">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Add a description for this property..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent text-base text-right text-gray-900 min-h-[150px] max-h-[300px]"
                      dir="rtl"
                      rows={6}
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleDescriptionCancel}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDescriptionSave}
                        className="px-4 py-2 bg-[oklch(0.5_0.22_280)] text-white rounded-lg hover:bg-[oklch(0.45_0.22_280)] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDoubleClick={handleDescriptionEdit}
                    className="cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors"
                  >
                    {property.description ? (
                      <div
                        className="text-gray-700 leading-relaxed text-base w-full text-right"
                        dir="rtl"
                        style={{ unicodeBidi: 'plaintext' }}
                        dangerouslySetInnerHTML={{ __html: property.description }}
                      />
                    ) : (
                      <p className="text-gray-400 italic text-left">
                        No description yet. Double-click to add one.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Photos Section - Mobile */}
              <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200 md:hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500 uppercase font-semibold">
                    {attachments.length > 0 ? `Photos (${attachments.length})` : 'Photos'}
                  </div>
                  <div className="flex items-center gap-3">
                    {attachments.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedAttachmentIndex(0)
                          setIsZoomed(false)
                        }}
                        className="text-sm text-[oklch(0.5_0.22_280)] font-medium"
                      >
                        View All
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingAttachment}
                      className="hidden"
                      id="mobile-attachment-upload"
                    />
                    <label
                      htmlFor="mobile-attachment-upload"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploadingAttachment
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[oklch(0.5_0.22_280)] text-white hover:bg-[oklch(0.45_0.22_280)]'
                        }`}
                    >
                      {uploadingAttachment ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {attachments.slice(0, 4).map((attachment, index) => {
                      const url = getAttachmentUrl(attachment.file_path)
                      return (
                        <div
                          key={attachment.id}
                          className="aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                          onClick={() => {
                            setSelectedAttachmentIndex(attachments.findIndex(a => a.id === attachment.id))
                            setIsZoomed(false)
                          }}
                        >
                          {attachment.file_type === 'image' ? (
                            <img
                              src={url}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover"
                            />
                          ) : attachment.file_type === 'video' ? (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-1">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <p className="text-[10px] font-medium text-gray-600 mt-1 px-1 text-center truncate w-full">
                                {attachment.file_name.length > 15 
                                  ? `${attachment.file_name.substring(0, 15)}...` 
                                  : attachment.file_name}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500">No photos yet</p>
                  </div>
                )}
              </div>

              {/* Contact Section */}
              {property.contact_name && (
                <div className="mb-4 md:mb-6">
                  <div className="text-xs text-gray-500 mb-3 uppercase font-semibold">Contact</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{property.contact_name}</span>
                    </div>
                    {property.contact_phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-sm text-[oklch(0.5_0.22_280)]">{property.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Section - Desktop Only */}
              <div className="mb-8 mt-8 hidden md:block">
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Attachments</h3>
                    <div className="flex items-center space-x-3">
                      {attachments.length > 0 && (
                        <span className="text-xs text-slate-500">{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,application/pdf"
                        onChange={handleFileUpload}
                        disabled={uploadingAttachment}
                        className="hidden"
                        id="detail-attachment-upload"
                      />
                      <label
                        htmlFor="detail-attachment-upload"
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${uploadingAttachment
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                      >
                        {uploadingAttachment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Add Files</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {attachmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2 text-sm text-slate-600">Loading attachments...</span>
                    </div>
                  ) : attachments.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {attachments.map((attachment) => {
                        const url = getAttachmentUrl(attachment.file_path)
                        const isDeleting = deletingAttachment === attachment.id
                        return (
                          <div
                            key={attachment.id}
                            className={`relative group aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer transition-all hover:shadow-lg ${isDeleting ? 'opacity-50' : ''
                              }`}
                            onClick={() => {
                              setSelectedAttachmentIndex(attachments.findIndex(a => a.id === attachment.id))
                              setIsZoomed(false)
                            }}
                          >
                            {attachment.file_type === 'image' ? (
                              <img
                                src={url}
                                alt={attachment.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : attachment.file_type === 'video' ? (
                              <>
                                <video
                                  src={url}
                                  className="w-full h-full object-cover"
                                  muted
                                >
                                  <source src={url} type={attachment.mime_type} />
                                </video>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-2">
                                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <p className="text-xs font-medium text-slate-600 mt-2 px-2 text-center truncate w-full">
                                  {attachment.file_name.length > 15 
                                    ? `${attachment.file_name.substring(0, 15)}...` 
                                    : attachment.file_name}
                                </p>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAttachment(attachment.id)
                              }}
                              disabled={isDeleting}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                              title="Delete attachment"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-slate-500">No attachments yet</p>
                      <p className="text-xs text-slate-400 mt-1">Click &quot;Add Files&quot; to upload photos or videos</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-900">Notes</h3>
                  <span className="text-sm text-slate-500">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
                </div>

                {/* Notes List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-slate-500">Loading notes...</div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-slate-500 mb-2">No notes yet</div>
                    <div className="text-sm text-slate-400">Add your first note above</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm text-slate-500 font-medium">
                            {formatNoteDate(note.created_at)}
                          </div>
                          <div className="flex items-center space-x-1">
                            {editingNoteId === note.id && (
                              <>
                                <button
                                  onClick={handleSaveNoteEdit}
                                  className="text-slate-400 hover:text-primary transition-colors p-1 hover:bg-primary/10 rounded-lg"
                                  title="Save changes"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleCancelNoteEdit}
                                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-lg"
                                  title="Cancel editing"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded-lg"
                              title="Delete note"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              onKeyDown={handleNoteEditKeyDown}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none text-base"
                              rows={4}
                              dir="auto"
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2 text-xs text-slate-500">
                              <span>{mounted && isMac ? 'Cmd' : 'Ctrl'}+Enter to save</span>
                              <span>•</span>
                              <span>ESC to cancel</span>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-slate-900 whitespace-pre-wrap leading-relaxed text-base cursor-pointer hover:bg-slate-50 -m-2 p-2 rounded-lg transition-colors"
                            dir="auto"
                            onDoubleClick={() => handleEditNote(note)}
                            title="Double-click to edit"
                          >
                            {note.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Note Form (moved below notes) */}
                <div className="mt-8">
                  <form onSubmit={handleAddNote} className="space-y-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={handleNoteKeyDown}
                      placeholder={mounted && isMobile ? 'Add a note...' : mounted ? `Add a note... (${isMac ? 'Cmd' : 'Ctrl'}+Enter to submit)` : 'Add a note...'}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                      disabled={submitting}
                      dir="auto"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting || !newNote.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {submitting ? 'Adding...' : 'Add Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons - Mobile and Desktop */}
          <div className="flex items-center justify-between gap-3 md:gap-4 px-4 md:px-10 py-4 bg-white border-t border-gray-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 md:px-6 py-3 bg-white border border-red-300 md:border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-red-600 md:text-gray-900 font-medium"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
            <button
              onClick={() => onEdit(property)}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 md:px-6 py-3 bg-[oklch(0.5_0.22_280)] text-white rounded-lg hover:bg-[oklch(0.45_0.22_280)] transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {/* Attachment Lightbox with Navigation and Zoom */}
      {selectedAttachmentIndex !== null && attachments[selectedAttachmentIndex] && (() => {
        const currentAttachment = attachments[selectedAttachmentIndex]
        const hasPrev = selectedAttachmentIndex > 0
        const hasNext = selectedAttachmentIndex < attachments.length - 1

        const handlePrev = () => {
          if (hasPrev) {
            setSelectedAttachmentIndex(selectedAttachmentIndex - 1)
            setIsZoomed(false)
          }
        }

        const handleNext = () => {
          if (hasNext) {
            setSelectedAttachmentIndex(selectedAttachmentIndex + 1)
            setIsZoomed(false)
          }
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            handlePrev()
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            handleNext()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setSelectedAttachmentIndex(null)
            setIsZoomed(false)
          }
        }

        const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
          e.stopPropagation()
          if (!isZoomed) {
            // Calculate click position as percentage
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            setZoomPosition({ x, y })
          }
          setIsZoomed(!isZoomed)
        }

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
          if (!isZoomed) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setZoomPosition({ x, y })
        }

        // Touch swipe handling for mobile
        const handleTouchStart = (e: React.TouchEvent) => {
          touchStartX.current = e.touches[0].clientX
          touchEndX.current = e.touches[0].clientX
        }

        const handleTouchMove = (e: React.TouchEvent) => {
          touchEndX.current = e.touches[0].clientX
        }

        const handleTouchEnd = () => {
          const swipeThreshold = 50
          const diff = touchStartX.current - touchEndX.current

          if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && hasNext) {
              // Swiped left - go to next
              handleNext()
            } else if (diff < 0 && hasPrev) {
              // Swiped right - go to previous
              handlePrev()
            }
          }
        }

        return (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in"
            onClick={() => {
              setSelectedAttachmentIndex(null)
              setIsZoomed(false)
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            ref={(el) => el?.focus()}
          >
            <div
              className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedAttachmentIndex(null)
                  setIsZoomed(false)
                }}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Previous Button - hidden on mobile/tablet */}
              {hasPrev && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className="hidden lg:block absolute left-[20px] top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-all z-10 group"
                  title="Previous (←)"
                >
                  <svg className="w-10 h-10 group-hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Button - hidden on mobile/tablet */}
              {hasNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="hidden lg:block absolute right-[20px] top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-all z-10 group"
                  title="Next (→)"
                >
                  <svg className="w-10 h-10 group-hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Image/Video/PDF Display with Zoom */}
              {currentAttachment.file_type === 'image' ? (
                <div
                  className={`relative overflow-hidden ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                  onMouseMove={handleMouseMove}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                >
                  <img
                    src={getAttachmentUrl(currentAttachment.file_path)}
                    alt={currentAttachment.file_name}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg select-none transition-transform duration-200"
                    draggable={false}
                    onClick={handleImageClick}
                    style={isZoomed ? {
                      transform: 'scale(2.5)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    } : undefined}
                  />
                </div>
              ) : currentAttachment.file_type === 'video' ? (
                <video
                  src={getAttachmentUrl(currentAttachment.file_path)}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                >
                  <source src={getAttachmentUrl(currentAttachment.file_path)} type={currentAttachment.mime_type} />
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center max-w-full max-h-[85vh] p-8">
                  <svg className="w-24 h-24 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium text-slate-700 mb-2">{currentAttachment.file_name}</p>
                  <a
                    href={getAttachmentUrl(currentAttachment.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Open PDF
                  </a>
                </div>
              )}

              {/* Bottom Info Bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                {/* Filename - hidden on mobile/tablet */}
                <div className="hidden lg:block bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                  {currentAttachment.file_name}
                </div>
                {/* Image counter - always visible */}
                {attachments.length > 1 && (
                  <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    {selectedAttachmentIndex + 1} / {attachments.length}
                  </div>
                )}
                {/* Zoom hint - hidden on mobile/tablet */}
                {currentAttachment.file_type === 'image' && (
                  <div className="hidden lg:block bg-black/50 text-white px-3 py-2 rounded-lg text-xs">
                    {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
                  </div>
                )}
                {/* PDF hint - hidden on mobile/tablet */}
                {currentAttachment.file_type === 'pdf' && (
                  <div className="hidden lg:block bg-black/50 text-white px-3 py-2 rounded-lg text-xs">
                    Click &quot;Open PDF&quot; to view
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl border border-slate-200 p-6 max-w-sm w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Property</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong>{property.title}</strong>? All associated notes and data will be permanently removed.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(property.id)
                  setShowDeleteConfirm(false)
                  onClose()
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}