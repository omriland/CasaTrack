'use client'

import { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Property, PropertyStatus, Note, Attachment } from '@/types/property'
import { PROPERTY_STATUS_OPTIONS, getStatusLabel, getStatusColor } from '@/constants/statuses'
import { getPropertyNotes, createNote, updateNote, deleteNote, updatePropertyStatus, updateProperty, togglePropertyFlag } from '@/lib/properties'
import { getPropertyAttachments, getAttachmentUrl, deleteAttachment, uploadAttachment } from '@/lib/attachments'
import { formatPhoneForWhatsApp } from '@/lib/phone'
import StarRating from './StarRating'

interface PropertyDetailModalProps {
  property: Property
  onClose: () => void
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onStatusUpdate?: (propertyId: string, newStatus: PropertyStatus) => void
  onPropertyUpdate?: (updatedProperty: Property) => void
  onRatingUpdate?: (propertyId: string, rating: number) => void
  onFlagToggle?: (propertyId: string, isFlagged: boolean) => void
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
  onFlagToggle,
  onDataRefresh,
  onNotesChanged: _onNotesChanged,
  onNotesDelta: _onNotesDelta
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

  // Handle paste event to attach images from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle paste when modal is open
      const modalElement = document.querySelector('[data-property-modal]')
      if (!modalElement) return

      // Don't intercept paste if user is typing in an input/textarea
      const activeElement = document.activeElement
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable))
      ) {
        return
      }

      const items = e.clipboardData?.items
      if (!items) return

      // Check if clipboard contains image data
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault()
          e.stopPropagation()

          const blob = item.getAsFile()
          if (!blob) continue

          // Convert blob to File with a proper name
          const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type || 'image/png' })
          
          // Upload the pasted image using the existing upload function
          setUploadingAttachment(true)
          try {
            // Process the file (compress if needed)
            let processedFile: File = file
            if (file.type.startsWith('image/')) {
              processedFile = await compressImage(file)
            }
            
            // Upload the file
            const newAttachment = await uploadAttachment(property.id, processedFile)
            setAttachments(prev => [...prev, newAttachment])
          } catch (error) {
            console.error('Error uploading pasted image:', error)
            alert(error instanceof Error ? error.message : 'Failed to upload pasted image')
          } finally {
            setUploadingAttachment(false)
          }
          break
        }
      }
    }

    // Add paste event listener to window (works even when modal doesn't have focus)
    window.addEventListener('paste', handlePaste)
    
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [property.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      } catch {
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
    const diffInSeconds = Math.floor((now.getTime() - noteDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return noteDate.toLocaleDateString()
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
          data-property-modal
          className={`md:rounded-2xl md:shadow-2xl md:border w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] overflow-hidden flex flex-col animate-fade-in relative ${
            isDragging ? 'ring-4 ring-black ring-offset-2' : ''
          } ${
            property.is_flagged 
              ? 'bg-[#FFFCF2] md:border-[#FEF3C7]' 
              : 'bg-white md:border-[rgba(0,0,0,0.06)]'
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
          {/* Header - Black background matching mobile app */}
          <div className="relative bg-black px-6 py-5">
            {/* Action Buttons - Top Right Corner */}
            <div className="absolute top-5 right-6 flex items-center gap-3 z-10">
              {/* Flag Button */}
              <button
                onClick={async () => {
                  try {
                    const newFlagState = !property.is_flagged
                    if (onFlagToggle) {
                      await onFlagToggle(property.id, newFlagState)
                    } else {
                      await togglePropertyFlag(property.id, newFlagState)
                      if (onPropertyUpdate) {
                        const updated = await updateProperty(property.id, { is_flagged: newFlagState })
                        onPropertyUpdate(updated)
                      }
                    }
                  } catch (error) {
                    console.error('Error toggling flag:', error)
                    alert('Error updating flag. Please try again.')
                  }
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  property.is_flagged ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={property.is_flagged ? 'Unflag property' : 'Flag property'}
              >
                <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h2v18H3V3zm3 2h12l-2 4 2 4H6V5z"/>
                </svg>
              </button>
              {/* Share Button */}
              <button
                onClick={handleCopyUrl}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                  copiedUrl ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                }`}
                title={copiedUrl ? 'URL Copied!' : 'Copy shareable link'}
              >
                {copiedUrl ? (
                  <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                )}
              </button>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
                title="Close"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col space-y-3 pr-20">
              {/* Title */}
              <h2 className="text-[22px] font-extrabold text-white leading-tight" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                {property.title || 'Untitled Property'}
              </h2>

              {/* Location with pin icon */}
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-white/70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-white/70 line-clamp-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                  {property.address}
                </span>
              </div>
              </div>

            {/* Status Pill - Below header */}
            <div className="relative mt-4 inline-block" ref={statusDropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-extrabold text-white transition-all"
                style={{ 
                  backgroundColor: getStatusColor(property.status),
                  fontFamily: 'Varela Round, sans-serif'
                }}
                >
                  {getStatusLabel(property.status)}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                    {PROPERTY_STATUS_OPTIONS.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusChange(status.value)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${status.value === property.status ? 'bg-gray-50 font-semibold' : ''
                        }`}
                    >
                      {status.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="px-6 py-6">
              {/* Rating Section - Card */}
              <div className="mb-4 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-bold text-[#4B5563] mb-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>Rating</h3>
                    <p className="text-[11px] text-[#9CA3AF]" style={{ fontFamily: 'Varela Round, sans-serif' }}>Click stars to rate this property</p>
                  </div>
                  <StarRating
                    rating={property.rating}
                    onRatingChange={(rating) => onRatingUpdate?.(property.id, rating)}
                    size="lg"
                    interactive={true}
                  />
                </div>
              </div>
              {/* Primary Specs - Asking Price Card */}
              <div className="mb-4 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="text-[13px] font-bold text-[#4B5563] mb-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>Asking Price</div>
              {property.asked_price !== null && property.asked_price !== 1 ? (
                  <>
                    <div className="text-2xl font-extrabold text-[#111827] mb-3" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                      {formatPrice(property.asked_price)} ₪
                      </div>
                    {property.price_per_meter !== null && property.asked_price !== null && property.asked_price !== 1 && property.square_meters !== null && property.square_meters !== 1 && (
                      <div className="text-sm font-semibold text-[#4B5563]" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                        {formatPrice(Math.round(property.price_per_meter))} ₪/m²
                      </div>
                    )}
                          </>
                        ) : (
                  <div className="text-sm text-[#9CA3AF]">Unknown</div>
                        )}
                      </div>

              {/* Size & Rooms Row - Two cards side-by-side */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                  <div className="text-[13px] font-bold text-[#4B5563] mb-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>Size</div>
                  <div className="text-2xl font-extrabold text-[#111827]" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                    {property.square_meters && property.square_meters !== 1 ? `${property.square_meters}m²` : 'Unknown'}
                        </div>
                    </div>
                <div className="flex-1 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                  <div className="text-[13px] font-bold text-[#4B5563] mb-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>Rooms</div>
                  <div className="text-2xl font-extrabold text-[#111827]" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                    {property.rooms || '—'}
                      </div>
                    </div>
                  </div>

              {/* Details Section - Card */}
              <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="text-xs font-extrabold text-[#9CA3AF] mb-4 uppercase tracking-wider" style={{ fontFamily: 'Varela Round, sans-serif', letterSpacing: '1px' }}>DETAILS</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[15px] text-[#4B5563] font-medium" style={{ fontFamily: 'Varela Round, sans-serif' }}>Type</span>
                    <span className="text-[15px] text-[#111827] font-bold" style={{ fontFamily: 'Varela Round, sans-serif' }}>{property.property_type || 'Unknown'}</span>
                </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[15px] text-[#4B5563] font-medium" style={{ fontFamily: 'Varela Round, sans-serif' }}>Source</span>
                    <span className="text-[15px] text-[#111827] font-bold" style={{ fontFamily: 'Varela Round, sans-serif' }}>{property.source || 'Unknown'}</span>
                </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[15px] text-[#4B5563] font-medium" style={{ fontFamily: 'Varela Round, sans-serif' }}>Broker</span>
                    <span className="text-[15px] text-[#111827] font-bold" style={{ fontFamily: 'Varela Round, sans-serif' }}>{property.apartment_broker ? 'Yes' : 'No'}</span>
                </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-[15px] text-[#4B5563] font-medium" style={{ fontFamily: 'Varela Round, sans-serif' }}>Added</span>
                    <span className="text-[15px] text-[#111827] font-bold" style={{ fontFamily: 'Varela Round, sans-serif' }}>{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
                {property.url && (
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-[15px] text-[#4B5563] font-medium" style={{ fontFamily: 'Varela Round, sans-serif' }}>Listing</span>
                    <a
                      href={property.url}
                      target="_blank"
                      rel="noopener noreferrer"
                        className="text-[15px] text-[#2563EB] hover:underline flex items-center gap-1 font-bold"
                        style={{ fontFamily: 'Varela Round, sans-serif' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Link
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                </div>
              </div>

              {/* Description Section - Card */}
              <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="text-xs font-extrabold text-[#9CA3AF] mb-4 uppercase tracking-wider" style={{ fontFamily: 'Varela Round, sans-serif', letterSpacing: '1px' }}>DESCRIPTION</div>
                {editingDescription ? (
                  <div className="space-y-4">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Add a description for this property..."
                      className="w-full px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent text-base text-right text-[#111827] min-h-[120px]"
                      style={{ fontFamily: 'Varela Round, sans-serif' }}
                      dir="rtl"
                      rows={6}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleDescriptionCancel}
                        className="px-4 py-2 text-[#9CA3AF] font-semibold transition-colors"
                        style={{ fontFamily: 'Varela Round, sans-serif' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDescriptionSave}
                        className="px-5 py-2 bg-[#2563EB] text-white rounded-[10px] hover:bg-[#1d4ed8] transition-colors font-bold"
                        style={{ fontFamily: 'Varela Round, sans-serif' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDoubleClick={handleDescriptionEdit}
                    className="cursor-pointer hover:bg-white/50 rounded-2xl p-3 -m-3 transition-colors"
                  >
                    {property.description ? (
                      <div
                        className="text-[16px] text-[#4B5563] leading-relaxed w-full text-right"
                        style={{ fontFamily: 'Varela Round, sans-serif', unicodeBidi: 'plaintext' }}
                        dir="rtl"
                        dangerouslySetInnerHTML={{ __html: property.description }}
                      />
                    ) : (
                      <p className="text-[#9CA3AF] italic text-left" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                        Double tap to add description...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section - Card with horizontal scroll */}
              <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-extrabold text-[#9CA3AF] uppercase tracking-wider" style={{ fontFamily: 'Varela Round, sans-serif', letterSpacing: '1px' }}>
                    ATTACHMENTS ({attachments.length})
                  </div>
                    {attachments.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedAttachmentIndex(0)
                          setIsZoomed(false)
                        }}
                      className="text-sm font-bold text-[#2563EB]"
                      style={{ fontFamily: 'Varela Round, sans-serif' }}
                      >
                        View All
                      </button>
                    )}
                </div>
                
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {/* Add Button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingAttachment}
                      className="hidden"
                    id="attachment-upload"
                    />
                    <label
                    htmlFor="attachment-upload"
                    className={`flex-shrink-0 w-[100px] h-[100px] rounded-2xl bg-[rgba(0,0,0,0.05)] flex flex-col items-center justify-center cursor-pointer transition-all ${uploadingAttachment
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[rgba(0,0,0,0.08)]'
                        }`}
                    >
                      {uploadingAttachment ? (
                      <div className="w-6 h-6 border-2 border-[#9CA3AF] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                        <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                        <span className="text-xs font-bold text-[#9CA3AF] mt-2" style={{ fontFamily: 'Varela Round, sans-serif' }}>Add</span>
                        </>
                      )}
                    </label>
                  
                  {/* Attachment Thumbnails */}
                  {attachments.map((attachment, index) => {
                      const url = getAttachmentUrl(attachment.file_path)
                      return (
                        <div
                          key={attachment.id}
                        className="flex-shrink-0 w-[120px] h-[100px] rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.1)] cursor-pointer hover:ring-2 hover:ring-[#2563EB]/50 transition-all"
                          onClick={() => {
                          setSelectedAttachmentIndex(index)
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
                          <div className="w-full h-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center relative">
                            <img
                              src={url}
                              alt={attachment.file_name}
                              className="w-full h-full object-cover absolute inset-0"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            </div>
                          ) : (
                          <div className="w-full h-full bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center p-2">
                            <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            <p className="text-[10px] font-medium text-[#64748B] mt-2 px-1 text-center truncate w-full" style={{ fontFamily: 'Varela Round, sans-serif' }}>
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
              </div>

              {/* Contact Section - Card */}
              {property.contact_name && (
                <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                  <div className="text-xs font-extrabold text-[#9CA3AF] mb-4 uppercase tracking-wider" style={{ fontFamily: 'Varela Round, sans-serif', letterSpacing: '1px' }}>CONTACT</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      </div>
                      <span className="text-[16px] font-bold text-[#111827]" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                        {property.contact_name || 'No contact name'}
                      </span>
                    </div>
                    {property.contact_phone && (
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-9 h-9 rounded-full bg-[rgba(0,0,0,0.05)] flex items-center justify-center">
                          <svg className="w-4.5 h-4.5 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        </div>
                        <a
                          href={`tel:${property.contact_phone.replace(/\D/g, '')}`}
                          className="flex-1 text-[16px] font-bold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                          style={{ fontFamily: 'Varela Round, sans-serif' }}
                          title="Click to call"
                        >
                          {property.contact_phone}
                        </a>
                        <a
                          href={`https://wa.me/${formatPhoneForWhatsApp(property.contact_phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#20ba5a] transition-colors flex items-center justify-center text-white flex-shrink-0"
                          title="Send WhatsApp message"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* Notes Section - Card */}
              <div className="mb-6 p-5 bg-[#F9FAFB] rounded-[20px] border border-[rgba(0,0,0,0.03)]">
                <div className="text-xs font-extrabold text-[#9CA3AF] mb-4 uppercase tracking-wider" style={{ fontFamily: 'Varela Round, sans-serif', letterSpacing: '1px' }}>
                  Notes ({notes.length})
                </div>

                {/* Notes List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-[#9CA3AF]">Loading notes...</div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <div className="text-base font-extrabold text-[#111827] mb-1" style={{ fontFamily: 'Varela Round, sans-serif' }}>No notes yet</div>
                    <div className="text-sm text-[#9CA3AF]" style={{ fontFamily: 'Varela Round, sans-serif' }}>Add your first note below</div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-white border-b border-[rgba(0,0,0,0.05)] pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold text-[#9CA3AF]" style={{ fontFamily: 'Varela Round, sans-serif' }}>
                            {formatNoteDate(note.created_at)}
                          </div>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                            className="text-xs font-bold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                            style={{ fontFamily: 'Varela Round, sans-serif' }}
                            >
                            Delete
                            </button>
                        </div>
                        {editingNoteId === note.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              onKeyDown={handleNoteEditKeyDown}
                              className="w-full px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none text-base min-h-[60px]"
                              style={{ fontFamily: 'Varela Round, sans-serif', textAlign: 'right' }}
                              dir="rtl"
                              rows={4}
                              autoFocus
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={handleCancelNoteEdit}
                                className="px-4 py-2 text-[#9CA3AF] font-semibold transition-colors"
                                style={{ fontFamily: 'Varela Round, sans-serif' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveNoteEdit}
                                className="px-5 py-2 bg-[#2563EB] text-white rounded-[10px] hover:bg-[#1d4ed8] transition-colors font-bold disabled:opacity-50"
                                style={{ fontFamily: 'Varela Round, sans-serif' }}
                                disabled={isSavingNote}
                              >
                                {isSavingNote ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p
                            className="text-[15px] text-[#4B5563] leading-relaxed cursor-pointer hover:bg-white/50 -m-2 p-2 rounded-lg transition-colors"
                            style={{ fontFamily: 'Varela Round, sans-serif', textAlign: 'right' }}
                            dir="rtl"
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

                {/* Add Note Form */}
                <div className="mt-6">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={handleNoteKeyDown}
                      placeholder="Add a note..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-[rgba(0,0,0,0.1)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none text-base"
                      style={{ fontFamily: 'Varela Round, sans-serif', textAlign: 'right' }}
                      dir="rtl"
                      disabled={submitting}
                    />
                      <button
                        type="submit"
                        disabled={submitting || !newNote.trim()}
                      className="w-full px-5 py-3.5 bg-[#2563EB] text-white rounded-2xl hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-extrabold"
                      style={{ fontFamily: 'Varela Round, sans-serif' }}
                      >
                        {submitting ? 'Adding...' : 'Add Note'}
                      </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons - Sticky bottom actions matching mobile */}
          <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-white border-t border-[rgba(0,0,0,0.05)]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 flex-1 px-6 py-3.5 bg-white border-2 border-[#DC2626] rounded-2xl hover:bg-red-50 transition-colors"
            >
              <svg className="w-4.5 h-4.5 text-[#DC2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-[#DC2626] font-extrabold" style={{ fontFamily: 'Varela Round, sans-serif' }}>Delete</span>
            </button>
            <button
              onClick={() => onEdit(property)}
              className="flex items-center justify-center gap-2 flex-1 px-6 py-3.5 bg-[#2563EB] text-white rounded-2xl hover:bg-[#1d4ed8] transition-colors"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-extrabold" style={{ fontFamily: 'Varela Round, sans-serif' }}>Edit</span>
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