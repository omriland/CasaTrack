'use client'

import { useState, useEffect, useRef } from 'react'
import { Property, PropertyStatus, Note, Attachment } from '@/types/property'
import { getPropertyNotes, createNote, updateNote, deleteNote, updatePropertyStatus, updateProperty } from '@/lib/properties'
import { getPropertyAttachments, getAttachmentUrl, deleteAttachment, uploadAttachment } from '@/lib/attachments'

interface PropertyDetailModalProps {
  property: Property
  onClose: () => void
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onStatusUpdate?: (propertyId: string, newStatus: PropertyStatus) => void
  onPropertyUpdate?: (updatedProperty: Property) => void
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
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [deletingAttachment, setDeletingAttachment] = useState<string | null>(null)
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (selectedAttachment?.id === attachmentId) {
        setSelectedAttachment(null)
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete attachment')
    } finally {
      setDeletingAttachment(null)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingAttachment(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadAttachment(property.id, file))
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

  useEffect(() => {
    // Detect Mac for keyboard shortcut display
    setIsMac(typeof navigator !== 'undefined' && navigator.platform.includes('Mac'))
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

  const getStatusColor = (status: PropertyStatus) => {
    const colors = {
      'Seen': 'bg-slate-100 text-slate-700 border-slate-200',
      'Interested': 'bg-amber-50 text-amber-700 border-amber-200',
      'Contacted Realtor': 'bg-blue-50 text-blue-700 border-blue-200',
      'Visited': 'bg-purple-50 text-purple-700 border-purple-200',
      'On Hold': 'bg-orange-50 text-orange-700 border-orange-200',
      'Irrelevant': 'bg-red-50 text-red-700 border-red-200',
      'Purchased': 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'
  }

  const allStatuses: PropertyStatus[] = [
    'Seen', 'Interested', 'Contacted Realtor', 'Visited', 'On Hold', 'Irrelevant', 'Purchased'
  ]

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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-2xl font-bold text-slate-900 line-clamp-2 leading-tight">
                  {property.title}
                </h2>
                <div className="text-sm text-slate-500 mt-1 line-clamp-1" title={property.address}>
                  {property.address}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:shadow-sm ${getStatusColor(property.status)}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-current mr-2 opacity-60"></div>
                    {property.status}
                    <svg className="w-3 h-3 ml-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-fade-in">
                      {allStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2 ${
                            status === property.status ? 'bg-slate-50 font-medium' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-')}`}></div>
                          <span>{status}</span>
                          {status === property.status && (
                            <svg className="w-3 h-3 ml-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onEdit(property)}
                  className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Edit property"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete property"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Top Row: Property Details and Pricing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Property Details */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Property Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        <span className="text-sm font-medium text-slate-600">Rooms</span>
                      </div>
                      <span className="text-3xl font-bold text-slate-900">{property.rooms}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className={`w-4 h-4 ${property.square_meters === null ? 'text-amber-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
                        </svg>
                        <span className={`text-sm font-medium ${property.square_meters === null ? 'text-amber-700' : 'text-slate-600'}`}>Size</span>
                      </div>
                      {property.square_meters === null ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-semibold text-amber-700">Not set</span>
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-slate-900">{property.square_meters} <span className="text-lg text-slate-600">m²</span></span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-2v2a2 2 0 002 2h2a2 2 0 002-2v-2m-6 0h4" />
                        </svg>
                        <span className="text-sm font-medium text-slate-600">Type</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">{property.property_type}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-slate-600">Source</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">{property.source}</span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  {property.contact_name && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">Contact</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium text-slate-700">{property.contact_name}</span>
                        </div>
                        {property.contact_phone && (
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-slate-600">{property.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pricing */}
                {property.asked_price !== null ? (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wide">Pricing</h3>
                    <div className="space-y-6">
                      <div>
                        <span className="text-sm font-medium text-slate-600 block mb-1">Asking Price</span>
                        <span className="text-4xl font-bold text-slate-900">₪{formatPrice(property.asked_price)}</span>
                      </div>
                      {property.price_per_meter !== null && (
                        <div className="pt-4 border-t border-slate-200">
                          <span className="text-sm text-slate-500 block mb-1">Price per m²</span>
                          <span className="text-2xl font-semibold text-slate-700">₪{formatPrice(Math.round(property.price_per_meter))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-amber-700 mb-4 uppercase tracking-wide">Pricing</h3>
                    <div className="flex items-center space-x-3">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-lg font-semibold text-amber-700">Price not set</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="mb-8">
                <div className="bg-slate-50 rounded-xl p-6">
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
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        disabled={uploadingAttachment}
                        className="hidden"
                        id="detail-attachment-upload"
                      />
                      <label
                        htmlFor="detail-attachment-upload"
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                          uploadingAttachment 
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
                            className={`relative group aspect-video rounded-lg overflow-hidden border border-slate-200 cursor-pointer transition-all hover:shadow-lg ${
                              isDeleting ? 'opacity-50' : ''
                            }`}
                            onClick={() => setSelectedAttachment(attachment)}
                          >
                            {attachment.file_type === 'image' ? (
                              <img
                                src={url}
                                alt={attachment.file_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
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

              {/* Full Width Description */}
              <div className="mb-8">
                <div className="bg-slate-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Description</h3>
                    {!editingDescription && (
                      <span className="text-xs text-slate-400">Double-click to edit</span>
                    )}
                  </div>

                  {editingDescription ? (
                    <div className="space-y-4">
                      <textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        placeholder="Add a description for this property..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base text-right text-slate-900 min-h-[150px] max-h-[300px]"
                        dir="rtl"
                        rows={6}
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-slate-500">
                          Enter for new line
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDescriptionCancel}
                            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDescriptionSave}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={handleDescriptionEdit}
                      className="cursor-pointer hover:bg-slate-100 rounded-lg p-3 -m-3 transition-colors min-h-[100px] flex items-start w-full"
                    >
                      {property.description ? (
                        <div 
                          className="text-slate-700 leading-relaxed text-base w-full text-right" 
                          dir="rtl" 
                          style={{ unicodeBidi: 'plaintext' }}
                          dangerouslySetInnerHTML={{ __html: property.description }}
                        />
                      ) : (
                        <p className="text-slate-400 italic text-left">
                          No description yet. Double-click to add one.
                        </p>
                      )}
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
                      <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="text-sm text-slate-500 font-medium">
                            {formatDate(note.created_at)}
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
                              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none text-base"
                              rows={4}
                              dir="auto"
                              autoFocus
                            />
                            <div className="flex justify-end space-x-2 text-xs text-slate-500">
                              <span>{isMac ? 'Cmd' : 'Ctrl'}+Enter to save</span>
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
                      placeholder={`Add a note... (${isMac ? 'Cmd' : 'Ctrl'}+Enter to submit)`}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
                      disabled={submitting}
                      dir="auto"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting || !newNote.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {submitting ? 'Adding...' : 'Add Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {/* Attachment Lightbox */}
      {selectedAttachment && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in"
          onClick={() => setSelectedAttachment(null)}
        >
          <div
            className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAttachment(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {selectedAttachment.file_type === 'image' ? (
              <img
                src={getAttachmentUrl(selectedAttachment.file_path)}
                alt={selectedAttachment.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <video
                src={getAttachmentUrl(selectedAttachment.file_path)}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg"
              >
                <source src={getAttachmentUrl(selectedAttachment.file_path)} type={selectedAttachment.mime_type} />
              </video>
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
              {selectedAttachment.file_name}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full animate-fade-in"
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
                className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(property.id)
                  setShowDeleteConfirm(false)
                  onClose()
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
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