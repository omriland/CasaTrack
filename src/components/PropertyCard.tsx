'use client'

import { Property, PropertyStatus, Note, Attachment } from '@/types/property'
import { useState, useEffect, useRef } from 'react'
import { getPropertyNotes, updatePropertyStatus, updateProperty } from '@/lib/properties'
import { getPropertyAttachments, getAttachmentUrl } from '@/lib/attachments'

interface PropertyCardProps {
  property: Property
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
  onStatusUpdate?: (propertyId: string, newStatus: PropertyStatus) => void
  notesRefreshKey?: number
  notesBump?: { id: string; delta: number; nonce: number } | null
}

export default function PropertyCard({ property, onEdit, onDelete, onViewNotes, onStatusUpdate, notesRefreshKey, notesBump }: PropertyCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notesCount, setNotesCount] = useState<number>(0)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [showNotesPreview, setShowNotesPreview] = useState(false)
  const [previewNotes, setPreviewNotes] = useState<Note[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [showDescPreview, setShowDescPreview] = useState(false)
  const descPreviewRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const notesPreviewRef = useRef<HTMLDivElement>(null)
  const [inlineEditing, setInlineEditing] = useState<null | { field: 'rooms' | 'square_meters'; value: number | null }>(null)
  const [localRooms, setLocalRooms] = useState<number>(property.rooms)
  const [localSquareMeters, setLocalSquareMeters] = useState<number | null>(property.square_meters)
  const roomsPickerRef = useRef<HTMLDivElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadNotesCount()
    loadAttachments()
    
    // Detect mobile and set initial expanded state
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsExpanded(false) // Collapsed by default on mobile
      } else {
        setIsExpanded(true) // Expanded by default on desktop
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [property.id, notesRefreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (!notesBump) return
    if (notesBump.id !== property.id) return
    setNotesCount((prev) => Math.max(0, prev + notesBump.delta))
  }, [notesBump?.nonce, property.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalRooms(property.rooms)
  }, [property.rooms])

  useEffect(() => {
    setLocalSquareMeters(property.square_meters)
  }, [property.square_meters])

  // Close rooms selector on outside click without saving
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (inlineEditing?.field !== 'rooms') return
      if (roomsPickerRef.current && !roomsPickerRef.current.contains(e.target as Node)) {
        setInlineEditing(null)
      }
    }
    if (inlineEditing?.field === 'rooms') {
      document.addEventListener('mousedown', handleOutside)
      return () => document.removeEventListener('mousedown', handleOutside)
    }
  }, [inlineEditing])

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

  // Handle click outside for notes preview
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notesPreviewRef.current && !notesPreviewRef.current.contains(event.target as Node)) {
        setShowNotesPreview(false)
      }
      if (descPreviewRef.current && !descPreviewRef.current.contains(event.target as Node)) {
        setShowDescPreview(false)
      }
    }

    if (showNotesPreview) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotesPreview])

  const loadNotesCount = async () => {
    try {
      const notes = await getPropertyNotes(property.id)
      setNotesCount(notes.length)
    } catch (error) {
      console.error('Error loading notes count:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price)
  }

  const formatExactDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getRelativeTime = (dateString: string) => {
    const now = new Date()
    const then = new Date(dateString)
    const diffMs = then.getTime() - now.getTime()
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

    const minutes = Math.round(diffMs / (1000 * 60))
    const hours = Math.round(diffMs / (1000 * 60 * 60))
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30))
    const years = Math.round(diffMs / (1000 * 60 * 60 * 24 * 365))

    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    if (Math.abs(months) < 12) return rtf.format(months, 'month')
    return rtf.format(years, 'year')
  }

  const getStatusColor = (status: Property['status']) => {
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

  const handleStatusChange = async (newStatus: PropertyStatus) => {
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(property.id, newStatus)
      } else {
        // Fallback to direct API call if no callback provided
        await updatePropertyStatus(property.id, newStatus)
      }
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating property status:', error)
      alert('Error updating property status. Please try again.')
    }
  }

  const handleCopyPhone = async () => {
    if (!property.contact_phone) return
    
    try {
      await navigator.clipboard.writeText(property.contact_phone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } catch (error) {
      console.error('Failed to copy phone number:', error)
    }
  }

  const allStatuses: PropertyStatus[] = [
    'Seen', 'Interested', 'Contacted Realtor', 'Visited', 'On Hold', 'Irrelevant', 'Purchased'
  ]

  const handleNotesHover = async () => {
    if (notesCount === 0) return
    
    try {
      setNotesLoading(true)
      setShowNotesPreview(true)
      const notes = await getPropertyNotes(property.id)
      setPreviewNotes(notes.slice(0, 3)) // Show only first 3 notes in preview
    } catch (error) {
      console.error('Error loading notes preview:', error)
    } finally {
      setNotesLoading(false)
    }
  }

  const handleNotesLeave = () => {
    // Small delay to allow moving to the preview tooltip
    setTimeout(() => {
      if (!showNotesPreview) {
        setShowNotesPreview(false)
      }
    }, 100)
  }

  // Inline edit helpers
  const openInlineEditor = (field: 'rooms' | 'square_meters', current: number | null) => {
    setInlineEditing({ field, value: current })
  }

  const commitInlineEdit = async () => {
    if (!inlineEditing) return
    try {
      const updates: Partial<Pick<Property, 'rooms' | 'square_meters'>> = { [inlineEditing.field]: inlineEditing.value } as Partial<Pick<Property, 'rooms' | 'square_meters'>>
      await updateProperty(property.id, updates)
      if (inlineEditing.field === 'square_meters') {
        setLocalSquareMeters(inlineEditing.value)
      }
      setInlineEditing(null)
    } catch (e) {
      console.error('Inline update failed:', e)
    }
  }

  const quickSetRooms = async (value: number) => {
    try {
      await updateProperty(property.id, { rooms: value })
      setLocalRooms(value)
      setInlineEditing(null)
    } catch (e) {
      console.error('Failed to set rooms:', e)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if user is selecting text or clicking on interactive elements
    if (window.getSelection()?.toString()) return
    // On mobile, if collapsed, expand it instead of opening modal
    if (isMobile && !isExpanded) {
      e.stopPropagation()
      setIsExpanded(true)
      return
    }
    onViewNotes(property)
  }

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div 
      className={`group bg-white rounded-lg shadow-sm border border-slate-200 ${isMobile ? (isExpanded ? 'p-6' : 'p-3') : 'p-6'} hover:shadow-lg hover:border-slate-300 transition-all duration-200 animate-fade-in cursor-pointer`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2 md:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-slate-900 mb-1 line-clamp-2 leading-tight ${isMobile && !isExpanded ? 'text-base' : 'text-lg'}`}>
            {property.title}
          </h3>
          <div className={`text-slate-500 mb-1 line-clamp-1 ${isMobile && !isExpanded ? 'text-xs' : 'text-xs'}`} title={property.address}>
            {property.address}
          </div>
          {(isExpanded || !isMobile) && (
            <>
              <div className="hidden md:block text-xs text-slate-500 mb-2" title={formatExactDateTime(property.created_at)}>
                Added {getRelativeTime(property.created_at)}
              </div>
              <div className="hidden md:block relative inline-block" ref={statusDropdownRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown) }}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm whitespace-nowrap ${getStatusColor(property.status)}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60"></div>
                  {property.status}
                  <svg className="w-3 h-3 ml-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50 animate-fade-in">
                    {allStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(status) }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center space-x-2 ${
                          status === property.status ? 'bg-slate-50 font-medium' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('bg-', 'bg-')}`}></div>
                        <span>{status}</span>
                        {status === property.status && (
                          <svg className="w-3 h-3 ml-auto text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {/* Expand/Collapse Chevron - Mobile Only */}
        {isMobile && (
          <button
            onClick={handleExpandToggle}
            className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Property Stats */}
      {isMobile && !isExpanded ? (
        // Compact collapsed view - Mobile only
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className={`text-xs font-medium ${localRooms === 0 ? 'text-amber-700' : 'text-slate-700'}`}>
              {localRooms === 0 ? 'Add rooms' : `${localRooms} rooms`}
            </span>
          </div>
        </div>
      ) : (
        // Full expanded view
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div
            className={`relative rounded-lg p-3 select-none ${property.rooms === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}
            onDoubleClick={(e) => { e.stopPropagation(); openInlineEditor('rooms', property.rooms) }}
            title="Double-click to edit rooms"
          >
            <div className="flex items-center space-x-2 mb-1">
              <svg className={`w-4 h-4 ${property.rooms === 0 ? 'text-amber-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span className={`text-xs font-medium ${property.rooms === 0 ? 'text-amber-700' : 'text-slate-600'}`}>Rooms</span>
            </div>
            <span className={`text-lg font-semibold ${localRooms === 0 ? 'text-amber-700' : 'text-slate-900'}`}>{localRooms === 0 ? 'Add rooms' : localRooms}</span>
          {inlineEditing?.field === 'rooms' && (
            <div
              className="absolute left-3 top-3 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50"
              onClick={(e) => e.stopPropagation()}
              ref={roomsPickerRef}
            >
              <div className="text-xs font-semibold text-slate-600 mb-2">Set Rooms</div>
              <div className="flex gap-2">
                {[3, 3.5, 4, 4.5, 5, 5.5, 6].map((roomCount) => (
                  <button
                    key={roomCount}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); quickSetRooms(roomCount) }}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-all flex-shrink-0 flex items-center justify-center ${
                      localRooms === roomCount
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-primary/10 hover:border-primary/30'
                    }`}
                  >
                    {roomCount}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} relative rounded-lg p-3 select-none ${property.square_meters === null ? 'bg-amber-50 border border-amber-200' : property.square_meters === 1 ? 'bg-slate-50' : 'bg-slate-50'}`} onDoubleClick={(e) => { e.stopPropagation(); openInlineEditor('square_meters', localSquareMeters) }} title="Double-click to edit size">
          <div className="flex items-center space-x-2 mb-1">
            <svg className={`w-4 h-4 ${property.square_meters === null ? 'text-amber-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
            </svg>
            <span className={`text-xs font-medium ${property.square_meters === null ? 'text-amber-700' : 'text-slate-600'}`}>Size</span>
          </div>
          {inlineEditing?.field === 'square_meters' ? (
            <div className="flex items-baseline space-x-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                autoFocus
                value={inlineEditing.value ?? ''}
                onChange={(e) => setInlineEditing({ field: 'square_meters', value: e.target.value === '' ? null : Number(e.target.value) })}
                onBlur={commitInlineEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitInlineEdit()
                  if (e.key === 'Escape') setInlineEditing(null)
                }}
                className="w-24 px-3 py-1.5 text-base border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:border-slate-400"
                min={0}
                placeholder="Optional"
              />
              <span className="text-xs text-slate-500">m²</span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className={`text-lg font-semibold ${localSquareMeters === null ? 'text-amber-700' : localSquareMeters === 1 ? 'text-slate-500' : 'text-slate-900'}`}>
                {localSquareMeters === null ? 'Add size' : localSquareMeters === 1 ? 'Unknown' : `${localSquareMeters} m²`}
              </span>
              {property.balcony_square_meters && property.balcony_square_meters > 0 && localSquareMeters !== null && localSquareMeters !== 1 && (
                <span className="text-xs text-slate-600 mt-0.5">+ {property.balcony_square_meters} m² balcony</span>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Price Section */}
      {isMobile && !isExpanded ? (
        // Compact collapsed price view - Mobile only
        property.asked_price !== null && property.asked_price !== 1 ? (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-500">Price:</span>
            <span className="text-base font-bold text-slate-900">₪{formatPrice(property.asked_price)}</span>
          </div>
        ) : property.asked_price === 1 ? (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500">Price:</span>
            <span className="text-xs font-medium text-slate-500">Unknown</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-amber-700">Price not set</span>
          </div>
        )
      ) : (
        // Full expanded price view
        property.asked_price !== null && property.asked_price !== 1 ? (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Asking Price</span>
              <span className="text-xl font-bold text-slate-900">₪{formatPrice(property.asked_price)}</span>
            </div>
            {property.price_per_meter !== null && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Price per m²</span>
                <span className="font-semibold text-slate-700">₪{formatPrice(Math.round(property.price_per_meter))}</span>
              </div>
            )}
          </div>
        ) : property.asked_price === 1 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600">Asking Price:</span>
              <span className="text-sm font-medium text-slate-500">Unknown</span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-amber-700">Price not set</span>
            </div>
          </div>
        )
      )}

      {/* Additional Details */}
      <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} space-y-2 text-sm`}>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-2v2a2 2 0 002 2h2a2 2 0 002-2v-2m-6 0h4" />
            </svg>
            <span>Type</span>
          </span>
          <span className="font-medium text-slate-700">{property.property_type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Source</span>
          </span>
          <span className="font-medium text-slate-700">{property.source}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Broker</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${property.apartment_broker ? 'text-primary' : 'text-slate-500'}`}>
              {property.apartment_broker ? 'Yes' : 'No'}
            </span>
            {property.apartment_broker && (
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            )}
          </div>
        </div>
      </div>

      {/* Property URL */}
      {property.url && (
        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} mt-4 pt-4 border-t border-slate-100`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Property Link</span>
            <a
              href={property.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors group"
              title="Open property listing"
            >
              <span className="text-sm font-medium">View Listing</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} mt-4 pt-4 border-t border-slate-100`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Attachments</span>
            <span className="text-xs text-slate-500">{attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {attachments.slice(0, 4).map((attachment, index) => {
              const url = getAttachmentUrl(attachment.file_path)
              return (
                <div 
                  key={attachment.id} 
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" 
                  onClick={(e) => {
                    e.stopPropagation()
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
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
            {attachments.length > 4 && (
              <div 
                className="aspect-square rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedAttachmentIndex(4)
                  setIsZoomed(false)
                }}
              >
                <span className="text-xs font-medium text-slate-600">+{attachments.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {property.contact_name && (
        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} mt-4 pt-4 border-t border-slate-100`}>
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Contact</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">{property.contact_name}</span>
              </div>
              {property.contact_phone && (
                <div className="flex items-center space-x-2">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopyPhone() }}
                    className="relative text-sm text-slate-600 hover:text-blue-600 transition-colors cursor-pointer group/phone"
                    title="Click to copy phone number"
                  >
                    {property.contact_phone}
                    {copiedPhone && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-fade-in">
                        Copied!
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-green-600"></div>
                      </div>
                    )}
                    <svg className="w-3 h-3 ml-1 inline-block opacity-0 group-hover/phone:opacity-60 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} mt-4 pt-4 border-t border-slate-100 relative`} ref={descPreviewRef}>
          <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Description</h4>
          <div
            className="text-sm text-slate-600 leading-relaxed line-clamp-3 text-right cursor-help"
            dir="rtl"
            style={{ unicodeBidi: 'plaintext' }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setShowDescPreview(true)}
            onMouseLeave={() => setShowDescPreview(false)}
            dangerouslySetInnerHTML={{ __html: property.description }}
          />

          {showDescPreview && (
            <div
              className="absolute bottom-full right-0 mb-2 w-96 max-w-[85vw] bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 animate-fade-in"
              onMouseEnter={() => setShowDescPreview(true)}
              onMouseLeave={() => setShowDescPreview(false)}
            >
              <div
                className="text-sm text-slate-700 leading-relaxed max-h-60 overflow-auto text-right"
                dir="rtl"
                style={{ unicodeBidi: 'plaintext' }}
                dangerouslySetInnerHTML={{ __html: property.description }}
              />
              <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              <div className="absolute top-full right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-200 transform translate-y-px"></div>
            </div>
          )}
        </div>
      )}

      {/* Notes Section */}
      <div className={`${isMobile && !isExpanded ? 'hidden' : 'block'} mt-4 pt-4 border-t border-slate-100`}>
        <div className="relative" ref={notesPreviewRef}>
          <button
            onClick={(e) => { e.stopPropagation(); onViewNotes(property) }}
            onMouseEnter={handleNotesHover}
            onMouseLeave={handleNotesLeave}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-primary transition-colors group"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Notes</span>
            </div>
            {notesCount > 0 && (
              <span className="bg-primary/10 text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                {notesCount}
              </span>
            )}
          </button>

          {/* Notes Preview Tooltip */}
          {showNotesPreview && notesCount > 0 && (
            <div 
              className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 animate-fade-in"
              onMouseEnter={() => setShowNotesPreview(true)}
              onMouseLeave={() => setShowNotesPreview(false)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-900">Recent Notes</h4>
                <span className="text-xs text-slate-500">{notesCount} total</span>
              </div>
              
              {notesLoading ? (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-500">Loading...</div>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {previewNotes.map((note) => (
                    <div key={note.id} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 mb-1">
                        {formatNoteDate(note.created_at)}
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2" dir="auto">
                        {note.content}
                      </p>
                    </div>
                  ))}
                  {notesCount > 3 && (
                    <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-200">
                      +{notesCount - 3} more notes
                    </div>
                  )}
                </div>
              )}
              
              {/* Arrow pointing down */}
              <div className="absolute top-full left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              <div className="absolute top-full left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-200 transform translate-y-px"></div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
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
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
              
              {/* Previous Button */}
              {hasPrev && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrev()
                  }}
                  className="absolute left-[20px] top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-all z-10 group"
                  title="Previous (←)"
                >
                  <svg className="w-10 h-10 group-hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {/* Next Button */}
              {hasNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext()
                  }}
                  className="absolute right-[20px] top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white transition-all z-10 group"
                  title="Next (→)"
                >
                  <svg className="w-10 h-10 group-hover:scale-110 transition-transform drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {/* Image/Video Display with Zoom */}
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
              ) : (
                <video
                  src={getAttachmentUrl(currentAttachment.file_path)}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                >
                  <source src={getAttachmentUrl(currentAttachment.file_path)} type={currentAttachment.mime_type} />
                </video>
              )}
              
              {/* Bottom Info Bar */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                  {currentAttachment.file_name}
                </div>
                {attachments.length > 1 && (
                  <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    {selectedAttachmentIndex + 1} / {attachments.length}
                  </div>
                )}
                {currentAttachment.file_type === 'image' && (
                  <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-xs">
                    {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}