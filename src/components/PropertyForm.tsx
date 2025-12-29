'use client'

import { useState, useEffect, useCallback } from 'react'
import { Property, PropertyInsert, PropertySource, PropertyType, Attachment } from '@/types/property'
import { PROPERTY_STATUS_OPTIONS, PROPERTY_STATUSES } from '@/constants/statuses'
import AddressAutocomplete from './AddressAutocomplete'
import AttachmentUpload from './AttachmentUpload'
import { getPropertyAttachments } from '@/lib/attachments'

interface PropertyFormProps {
  property?: Property
  onSubmit: (property: PropertyInsert) => void
  onCancel: () => void
  loading?: boolean
}

const SOURCES: PropertySource[] = ['Yad2', 'Friends & Family', 'Facebook', 'Madlan', 'Other']
const PROPERTY_TYPES: PropertyType[] = ['New', 'Existing apartment']

export default function PropertyForm({ property, onSubmit, onCancel, loading = false }: PropertyFormProps) {
  const [formData, setFormData] = useState<PropertyInsert>({
    title: property?.title || '',
    address: property?.address || '',
    rooms: property?.rooms || 0,
    square_meters: property?.square_meters ?? null,
    asked_price: property?.asked_price ?? null,
    contact_name: property?.contact_name || '',
    contact_phone: property?.contact_phone || '',
    source: property?.source || 'Yad2',
    property_type: property?.property_type || 'Existing apartment',
    description: property?.description || '',
    status: property?.status || PROPERTY_STATUSES[0],
    url: property?.url || '',
    latitude: property?.latitude || null,
    longitude: property?.longitude || null,
    apartment_broker: property?.apartment_broker || false,
    balcony_square_meters: property?.balcony_square_meters ?? null
  })

  // State for formatted price display
  const [formattedPrice, setFormattedPrice] = useState<string>(
    property?.asked_price ? property.asked_price.toLocaleString('en-US') : ''
  )
  
  // State for AI extraction
  const [extractionMode, setExtractionMode] = useState<'image' | 'html'>('image')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionProgress, setExtractionProgress] = useState(0)
  const [isAiSectionCollapsed, setIsAiSectionCollapsed] = useState(false)
  const [extractionResult, setExtractionResult] = useState<{
    show: boolean
    success: boolean
    message: string
    fieldsCount?: number
  }>({ show: false, success: false, message: '' })
  
  // State for extraction inputs
  const [pastedImage, setPastedImage] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState('')

  // State for attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  // Load attachments when editing existing property
  useEffect(() => {
    if (property?.id) {
      loadAttachments(property.id)
    } else {
      setAttachments([])
    }
  }, [property?.id])

  const loadAttachments = async (propertyId: string) => {
    setLoadingAttachments(true)
    try {
      const data = await getPropertyAttachments(propertyId)
      setAttachments(data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoadingAttachments(false)
    }
  }

  const geocodeNormalized = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    const normalized = address.includes('ישראל') || address.includes('Israel')
      ? address
      : `${address}, ישראל`
    try {
      // Try Nominatim first
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&countrycodes=IL&limit=1`
      const res = await fetch(nominatimUrl)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
      }
    } catch {}

    // Try Google Places findPlaceFromQuery (if available)
    try {
      if (typeof google !== 'undefined' && google.maps?.places) {
        const container = document.createElement('div')
        const service = new google.maps.places.PlacesService(container)
        const israelBounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(29.0, 34.2),
          new google.maps.LatLng(33.5, 35.9)
        )
        const request: google.maps.places.FindPlaceFromQueryRequest = { query: normalized, fields: ['geometry'], locationBias: israelBounds }
        const coords = await new Promise<{ lat: number; lng: number } | undefined>((resolve) => {
          service.findPlaceFromQuery(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
              const loc = results[0].geometry?.location
              if (loc) return resolve({ lat: loc.lat(), lng: loc.lng() })
            }
            resolve(undefined)
          })
        })
        if (coords) return coords
      }
    } catch {}

    // Final fallback: Google Geocoder
    try {
      if (typeof google !== 'undefined' && google.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder()
        const geocode = await geocoder.geocode({ address: normalized })
        const first = geocode.results?.[0]
        if (first?.geometry?.location) {
          return {
            lat: first.geometry.location.lat(),
            lng: first.geometry.location.lng()
          }
        }
      }
    } catch {}

    return undefined
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    // Ensure address present
    const address = (formData.address || '').trim()
    const addressChanged = property?.address && property.address !== address
    let payload = { ...formData, address }

    // Always attempt to geocode if:
    // 1. Address is present and coordinates are missing, OR
    // 2. Address has changed (to update coordinates for new address)
    if (address && ((!payload.latitude || !payload.longitude) || addressChanged)) {
      try {
        const coords = await geocodeNormalized(address)
        if (coords) {
          payload = { ...payload, latitude: coords.lat, longitude: coords.lng }
        } else if (addressChanged) {
          // If address changed but geocoding failed, clear old coordinates
          payload = { ...payload, latitude: null, longitude: null }
        }
      } catch (error) {
        console.error('Error geocoding address:', error)
        // If address changed but geocoding failed, clear old coordinates
        if (addressChanged) {
          payload = { ...payload, latitude: null, longitude: null }
        }
      }
    }

    onSubmit(payload)
  }, [formData, property?.address, onSubmit])

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading) {
          handleSubmit()
        }
      }
      // ESC to cancel
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [loading, formData, onSubmit, onCancel, handleSubmit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rooms' || name === 'square_meters' || name === 'asked_price' || name === 'balcony_square_meters'
        ? (value === '' ? null : Number(value))
        : value || null
    }))
  }

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => {
      // Auto-populate title with address if title is empty
      const newTitle = prev.title.trim() === '' ? address : prev.title
      // If address changed, always update coordinates (clear old ones if new address doesn't have coordinates yet)
      const addressChanged = prev.address !== address
      return {
        ...prev,
        title: newTitle,
        address,
        // If coordinates provided, use them. If address changed but no coordinates, clear old ones.
        // Otherwise keep existing coordinates (for when coordinates are fetched asynchronously)
        latitude: coordinates?.lat ?? (addressChanged ? null : prev.latitude),
        longitude: coordinates?.lng ?? (addressChanged ? null : prev.longitude)
      }
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Cmd+B for bold
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
      // Update form data with the new HTML content
      const element = e.currentTarget
      setFormData(prev => ({
        ...prev,
        description: element.innerHTML
      }))
    }
    
    // Handle Enter for line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertHTML', false, '<br>')
      // Update form data with the new HTML content
      const element = e.currentTarget
      setFormData(prev => ({
        ...prev,
        description: element.innerHTML
      }))
    }
  }

  const handleDescriptionInput = (e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    let content = element.innerHTML
    
    // Remove placeholder content if it exists
    if (content.includes('Additional details about the property')) {
      content = ''
      element.innerHTML = ''
    }
    
    setFormData(prev => ({
      ...prev,
      description: content
    }))
  }

  // Ensure placeholder disappears before the first typed character is inserted
  const handleDescriptionBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    if (element.innerHTML.includes('Additional details about the property')) {
      element.innerHTML = ''
      setFormData(prev => ({ ...prev, description: '' }))
    }
  }

  const handleDescriptionFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    // Clear placeholder on focus
    if (element.innerHTML.includes('Additional details about the property')) {
      element.innerHTML = ''
      setFormData(prev => ({
        ...prev,
        description: ''
      }))
    }
  }

  // Unified extraction handler
  const handleExtract = async () => {
    if (extractionMode === 'image' && !pastedImage) {
      setExtractionResult({
        show: true,
        success: false,
        message: 'Please paste an image first'
      })
      return
    }

    if (extractionMode === 'html' && !htmlContent.trim()) {
      setExtractionResult({
        show: true,
        success: false,
        message: 'Please paste the HTML content'
      })
      return
    }

    try {
      setIsExtracting(true)
      
      const requestBody = extractionMode === 'image' 
        ? { image: pastedImage }
        : { html: htmlContent }
      
      const response = await fetch('/api/extract-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to extract property data'
        throw new Error(errorMsg)
      }

      if (result.success && result.data) {
        const extractedData = result.data
        // Normalize extracted address
        if (extractedData.address) {
          extractedData.address = extractedData.address
            .replace(/\s+/g, ' ')
            .replace(/\u00A0/g, ' ')
            .trim()
        }
        
        const extractedFields = Object.entries(extractedData).filter(([, value]) => 
          value !== null && value !== 0 && value !== '' && value !== false
        ).length

        const extractedAddress = extractedData.address || formData.address
        setFormData(prev => ({
          ...prev,
          title: prev.title.trim() === '' ? extractedAddress : prev.title,
          address: extractedAddress,
          rooms: extractedData.rooms > 0 ? extractedData.rooms : prev.rooms,
          square_meters: extractedData.square_meters > 0 ? extractedData.square_meters : prev.square_meters ?? null,
          asked_price: extractedData.asked_price > 0 ? extractedData.asked_price : prev.asked_price ?? null,
          contact_name: extractedData.contact_name || prev.contact_name,
          contact_phone: extractedData.contact_phone || prev.contact_phone,
          property_type: extractedData.property_type || prev.property_type,
          description: extractedData.description || prev.description,
          apartment_broker: extractedData.apartment_broker ?? prev.apartment_broker
        }))

        if (extractedData.asked_price > 0) {
          setFormattedPrice(extractedData.asked_price.toLocaleString('en-US'))
        }

        setExtractionResult({
          show: true,
          success: true,
          message: `Property data extracted successfully! Found ${extractedFields} fields. Please review and complete any missing information.`,
          fieldsCount: extractedFields
        })
        
        // Clear extraction inputs on success
        setPastedImage(null)
        setHtmlContent('')
        
        // Auto-collapse AI section after successful extraction
        setIsAiSectionCollapsed(true)
      }
    } catch (error) {
      console.error('Extraction error:', error)
      setExtractionResult({
        show: true,
        success: false,
        message: `Failed to extract data: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsExtracting(false)
    }
  }

  // Handle image paste - only when in image extraction mode and extraction area is focused
  useEffect(() => {
    if (extractionMode !== 'image') return
    
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      // Check if any item is an image
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (!blob) return

          // Convert blob to data URL
          const reader = new FileReader()
          reader.onloadend = () => {
            const imageDataUrl = reader.result as string
            if (imageDataUrl) {
              setPastedImage(imageDataUrl)
            }
          }
          reader.readAsDataURL(blob)
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [extractionMode])

  // Animate progress bar during extraction (0% to 90% over 14 seconds)
  useEffect(() => {
    if (!isExtracting) {
      setExtractionProgress(0)
      return
    }

    const duration = 14000 // 14 seconds
    const targetProgress = 90 // 90%
    const interval = 50 // Update every 50ms
    const steps = duration / interval
    const increment = targetProgress / steps

    let currentProgress = 0
    const timer = setInterval(() => {
      currentProgress += increment
      if (currentProgress >= targetProgress) {
        setExtractionProgress(targetProgress)
        clearInterval(timer)
      } else {
        setExtractionProgress(currentProgress)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isExtracting])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove all non-digit characters
    const numericValue = inputValue.replace(/[^\d]/g, '')
    
    // Convert to number (null if empty)
    const numberValue = numericValue === '' ? null : parseInt(numericValue, 10)
    
    // Update form data with the numeric value
    setFormData(prev => ({
      ...prev,
      asked_price: numberValue
    }))
    
    // Update formatted display value
    setFormattedPrice(numberValue === null ? '' : numberValue.toLocaleString('en-US'))
  }

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const cursorPosition = input.selectionStart || 0
    
    // Prevent cursor from being positioned before the ₪ symbol area
    // The ₪ symbol takes up space, so cursor should be at position 0 minimum
    if (cursorPosition === 0 && (e.key === 'ArrowLeft' || e.key === 'Home')) {
      e.preventDefault()
      // Move cursor to start of actual number (after symbol area)
      setTimeout(() => {
        input.setSelectionRange(0, 0)
      }, 0)
    }
  }

  const handlePriceClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const cursorPosition = input.selectionStart || 0
    
    // If user clicks in the symbol area, move cursor to start of number
    if (cursorPosition === 0) {
      setTimeout(() => {
        input.setSelectionRange(0, 0)
      }, 0)
    }
  }


  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm md:flex md:items-center md:justify-center md:p-4 z-50 animate-fade-in"
      onClick={onCancel}
    >
      <div 
        className="bg-white md:rounded-lg md:shadow-2xl md:border md:border-slate-200 w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Purple Gradient */}
        <div className="relative bg-gradient-to-r from-[oklch(0.4_0.22_280)] to-[oklch(0.5_0.22_280)] px-4 py-4 md:px-10 md:py-6">
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 md:top-6 md:right-10 p-2 text-white hover:bg-white/20 rounded-lg transition-all z-10"
            title="Close"
          >
            <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-xl md:text-2xl font-bold text-white pr-10">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 md:bg-white">
          <div className="px-4 py-4 md:px-10 md:py-6 bg-white">

          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="Enter property title"
                required
                className="w-full px-4 py-3 md:px-5 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                tabIndex={1}
              />
              <p className="mt-1.5 text-xs text-gray-500">This will be auto-filled with the address if you enter the address first</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
              <AddressAutocomplete
                value={formData.address}
                onChange={handleAddressChange}
                placeholder="Enter property address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                  tabIndex={2}
                />
                {formData.latitude && formData.longitude && (
                  <div className="absolute -bottom-6 left-0 flex items-center space-x-1 text-xs text-primary">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Location found</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Property URL
              </label>
              <input
                type="url"
                name="url"
                value={formData.url || ''}
                onChange={handleChange}
                placeholder="https://www.yad2.co.il/..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                tabIndex={3}
              />
            </div>

            {/* AI Extraction Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  AI Data Extraction
                </label>
                <button
                  type="button"
                  onClick={() => setIsAiSectionCollapsed(!isAiSectionCollapsed)}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label={isAiSectionCollapsed ? 'Expand AI extraction section' : 'Collapse AI extraction section'}
                >
                  <svg 
                    className={`w-5 h-5 transition-transform ${isAiSectionCollapsed ? '' : 'rotate-180'}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {!isAiSectionCollapsed && (
                <>
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setExtractionMode('image')
                    setPastedImage(null)
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    extractionMode === 'image'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Image</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExtractionMode('html')
                    setHtmlContent('')
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    extractionMode === 'html'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>HTML</span>
                  </div>
                </button>
              </div>

              {/* Image Mode */}
              {extractionMode === 'image' && (
                <div className="space-y-3">
                  <div 
                    className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      // Trigger paste when clicking the area
                      document.execCommand('paste')
                    }}
                  >
                    {pastedImage ? (
                      <div className="relative">
                        <img 
                          src={pastedImage} 
                          alt="Pasted screenshot" 
                          className="max-w-full max-h-32 mx-auto rounded-lg shadow-md"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPastedImage(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium text-slate-700 mb-1">Paste Yad2 Screenshot</p>
                        <p className="text-xs text-slate-500">Click here and paste (Cmd+V / Ctrl+V) a screenshot of the Yad2 listing</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* HTML Mode */}
              {extractionMode === 'html' && (
                <div className="space-y-3">
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Paste the full HTML content here..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-sm font-mono min-h-[100px] max-h-[400px] resize-y"
                  />
                </div>
              )}

              {/* Extract Button */}
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || (extractionMode === 'image' && !pastedImage) || (extractionMode === 'html' && !htmlContent.trim())}
                className={`w-full mt-4 px-6 py-4 rounded-lg font-semibold transition-all shadow-lg relative overflow-hidden ${
                  isExtracting || (extractionMode === 'image' && !pastedImage) || (extractionMode === 'html' && !htmlContent.trim())
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {/* Progress bar overlay */}
                {isExtracting && (
                  <div 
                    className="absolute inset-0 bg-primary/20 transition-all duration-75 ease-linear"
                    style={{ width: `${extractionProgress}%` }}
                  />
                )}
                
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  {isExtracting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Extracting property data... {Math.round(extractionProgress)}%</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Extract Property Data</span>
                    </>
                  )}
                </div>
              </button>
              </>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rooms *
              </label>
              <div className="flex gap-2 flex-wrap">
                {[3, 3.5, 4, 4.5, 5, 5.5, 6].map((roomCount) => (
                  <button
                    key={roomCount}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rooms: roomCount }))}
                    className={`w-12 h-12 rounded-full text-sm font-medium transition-all flex-shrink-0 flex items-center justify-center ${
                      formData.rooms === roomCount
                        ? 'bg-[oklch(0.5_0.22_280)] text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-[oklch(0.5_0.22_280)]/30'
                    }`}
                    tabIndex={4}
                  >
                    <span>{roomCount}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Square Meters
                </label>
                <div className="relative">
                <input
                  type="number"
                  name="square_meters"
                  min="0"
                    value={formData.square_meters ?? ''}
                  onChange={handleChange}
                    placeholder="Optional"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                    tabIndex={4}
                  />
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <div className="w-px h-6 bg-gray-300"></div>
                  </div>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">m²</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Balcony m² (optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="balcony_square_meters"
                    min="0"
                    value={formData.balcony_square_meters ?? ''}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                  />
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <div className="w-px h-6 bg-gray-300"></div>
                  </div>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">m²</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Price row */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asked Price (ILS)
              </label>
              <div className="relative max-w-md">
                <input
                  type="text"
                  name="asked_price"
                  value={formattedPrice}
                  onChange={handlePriceChange}
                  onKeyDown={handlePriceKeyDown}
                  onClick={handlePriceClick}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                  tabIndex={7}
                />
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                  <div className="w-px h-6 bg-gray-300"></div>
                </div>
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-medium">₪</span>
                </div>
              </div>
            </div>

            {(() => {
              const balcony = formData.balcony_square_meters ?? 0
              const squareMeters = formData.square_meters ?? 0
              const effectiveArea = squareMeters + 0.5 * balcony
              return formData.asked_price != null && formData.asked_price > 0 && effectiveArea > 0
            })() && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Price per m²: <span>₪{(() => {
                    const balcony = formData.balcony_square_meters ?? 0
                    const squareMeters = formData.square_meters ?? 0
                    const effectiveArea = squareMeters + 0.5 * balcony
                    return formData.asked_price && effectiveArea > 0 
                      ? (formData.asked_price / effectiveArea).toLocaleString('en-US', { maximumFractionDigits: 0 })
                      : 'N/A'
                  })()}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                  tabIndex={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all"
                  tabIndex={7}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source *
                </label>
                <div className="relative">
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
                    tabIndex={9}
                  >
                    {SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property Type *
                </label>
                <div className="relative">
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
                    tabIndex={9}
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status *
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all appearance-none cursor-pointer"
                  tabIndex={11}
                >
                  {PROPERTY_STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <div className="space-y-2">
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the property"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.22_280)] focus:border-transparent bg-white transition-all text-right text-gray-900 min-h-[100px] max-h-[200px]"
                  dir="rtl"
                  tabIndex={12}
                />
                <div className="flex justify-end text-xs text-gray-500">
                  <span>Enter for new line</span>
                </div>
              </div>
            </div>

            {/* Attachments - only show when editing existing property */}
            {property?.id && (
              <div>
                {loadingAttachments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-slate-600">Loading attachments...</span>
                  </div>
                ) : (
                  <AttachmentUpload
                    propertyId={property.id}
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                  />
                )}
              </div>
            )}

            {!property?.id && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Attachments</p>
                    <p className="text-xs text-gray-500 mt-1">You can add photos and videos after creating the property.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="apartment_broker"
                  name="apartment_broker"
                  checked={formData.apartment_broker || false}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-[oklch(0.5_0.22_280)] bg-white border-2 border-gray-300 rounded focus:ring-[oklch(0.5_0.22_280)] focus:ring-2 transition-all"
                  tabIndex={13}
                />
                <label htmlFor="apartment_broker" className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  Has Apartment Broker
                </label>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">
                  Check this if the property listing includes an apartment broker service
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 md:flex-none px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                tabIndex={15}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 md:flex-none px-6 py-3 bg-[oklch(0.5_0.22_280)] text-white rounded-lg hover:bg-[oklch(0.45_0.22_280)] disabled:opacity-50 font-medium transition-all"
                tabIndex={14}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={property ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                    </svg>
                    <span>{property ? 'Update Property' : 'Create Property'}</span>
                  </div>
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>

      {/* Extraction Result Modal */}
      {extractionResult.show && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setExtractionResult({ show: false, success: false, message: '' })}
        >
          <div 
            className="bg-white/95 backdrop-blur-md shadow-2xl rounded-lg max-w-md w-full p-6 animate-fade-in border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                extractionResult.success 
                  ? 'bg-primary/10' 
                  : 'bg-red-100'
              }`}>
                {extractionResult.success ? (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {extractionResult.success ? 'Data Extracted!' : 'Extraction Failed'}
                </h3>
                {extractionResult.success && extractionResult.fieldsCount && (
                  <p className="text-sm text-slate-500">
                    Found {extractionResult.fieldsCount} property fields
                  </p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {extractionResult.message}
            </p>
            
            <div className="flex justify-end space-x-3">
              {!extractionResult.success && extractionResult.message.includes('CAPTCHA') && (
                <button
                  onClick={() => {
                    setExtractionResult({ show: false, success: false, message: '' })
                    setExtractionMode('html')
                  }}
                  className="px-6 py-2.5 rounded-lg font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Try HTML Mode
                </button>
              )}
              <button
                onClick={() => setExtractionResult({ show: false, success: false, message: '' })}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  extractionResult.success
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {extractionResult.success ? 'Continue Editing' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}