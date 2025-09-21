'use client'

import { useState, useEffect, useCallback } from 'react'
import { Property, PropertyInsert, PropertySource, PropertyType, PropertyStatus } from '@/types/property'
import AddressAutocomplete from './AddressAutocomplete'

interface PropertyFormProps {
  property?: Property
  onSubmit: (property: PropertyInsert) => void
  onCancel: () => void
  loading?: boolean
}

const SOURCES: PropertySource[] = ['Yad2', 'Friends & Family', 'Facebook', 'Madlan', 'Other']
const PROPERTY_TYPES: PropertyType[] = ['New', 'Existing apartment']
const STATUSES: PropertyStatus[] = ['Seen', 'Interested', 'Contacted Realtor', 'Visited', 'On Hold', 'Irrelevant', 'Purchased']

export default function PropertyForm({ property, onSubmit, onCancel, loading = false }: PropertyFormProps) {
  const [formData, setFormData] = useState<PropertyInsert>({
    address: property?.address || '',
    rooms: property?.rooms || 0,
    square_meters: property?.square_meters || 0,
    asked_price: property?.asked_price || 0,
    contact_name: property?.contact_name || '',
    contact_phone: property?.contact_phone || '',
    source: property?.source || 'Yad2',
    property_type: property?.property_type || 'Existing apartment',
    description: property?.description || '',
    status: property?.status || 'Seen',
    url: property?.url || '',
    latitude: property?.latitude || null,
    longitude: property?.longitude || null,
    apartment_broker: property?.apartment_broker || false
  })

  // State for formatted price display
  const [formattedPrice, setFormattedPrice] = useState<string>(
    property?.asked_price ? property.asked_price.toLocaleString('en-US') : ''
  )
  
  // State for URL extraction
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<{
    show: boolean
    success: boolean
    message: string
    fieldsCount?: number
  }>({ show: false, success: false, message: '' })

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    onSubmit(formData)
  }, [formData, onSubmit])

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
      [name]: name === 'rooms' || name === 'square_meters' || name === 'asked_price'
        ? Number(value)
        : value || null
    }))
  }

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      address,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null
    }))
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

  const handleExtractFromURL = async () => {
    if (!formData.url || !formData.url.includes('yad2.co.il')) {
      setExtractionResult({
        show: true,
        success: false,
        message: 'Please enter a valid Yad2 URL first'
      })
      return
    }

    try {
      setIsExtracting(true)
      
      const response = await fetch('/api/extract-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.url })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract property data')
      }

      if (result.success && result.data) {
        const extractedData = result.data
        console.log('Received extracted data:', extractedData)
        
        // Count how many fields were extracted
        const extractedFields = Object.entries(extractedData).filter(([, value]) => 
          value !== null && value !== 0 && value !== '' && value !== false
        ).length

        // Update form data with extracted information (only non-empty values)
        setFormData(prev => ({
          ...prev,
          address: extractedData.address || prev.address,
          rooms: extractedData.rooms > 0 ? extractedData.rooms : prev.rooms,
          square_meters: extractedData.square_meters > 0 ? extractedData.square_meters : prev.square_meters,
          asked_price: extractedData.asked_price > 0 ? extractedData.asked_price : prev.asked_price,
          contact_name: extractedData.contact_name || prev.contact_name,
          contact_phone: extractedData.contact_phone || prev.contact_phone,
          property_type: extractedData.property_type || prev.property_type,
          description: extractedData.description || prev.description,
          apartment_broker: extractedData.apartment_broker ?? prev.apartment_broker
        }))

        // Update formatted price
        if (extractedData.asked_price > 0) {
          setFormattedPrice(extractedData.asked_price.toLocaleString('en-US'))
        }

        setExtractionResult({
          show: true,
          success: true,
          message: `Property data extracted successfully! Found ${extractedFields} fields. Please review and complete any missing information.`,
          fieldsCount: extractedFields
        })
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

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove all non-digit characters
    const numericValue = inputValue.replace(/[^\d]/g, '')
    
    // Convert to number
    const numberValue = numericValue === '' ? 0 : parseInt(numericValue, 10)
    
    // Update form data with the numeric value
    setFormData(prev => ({
      ...prev,
      asked_price: numberValue
    }))
    
    // Update formatted display value
    setFormattedPrice(numberValue === 0 ? '' : numberValue.toLocaleString('en-US'))
  }


  return (
    <div 
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21l4-4 4 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {property ? 'Edit Property' : 'Add New Property'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <AddressAutocomplete
                  value={formData.address}
                  onChange={handleAddressChange}
                  placeholder="Enter property address"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                  tabIndex={1}
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
              <div className="flex space-x-3">
                <input
                  type="url"
                  name="url"
                  value={formData.url || ''}
                  onChange={handleChange}
                  placeholder="https://www.yad2.co.il/..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                  tabIndex={2}
                />
                <button
                  type="button"
                  onClick={handleExtractFromURL}
                  disabled={isExtracting || !formData.url || !formData.url.includes('yad2.co.il')}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                  title="Extract property data from Yad2 URL using AI"
                >
                  {isExtracting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Extracting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Extract Data</span>
                    </div>
                  )}
                </button>
              </div>
              {formData.url && formData.url.includes('yad2.co.il') && (
                <div className="mt-2 text-xs text-slate-600 bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-700 mb-1">AI Data Extraction Available</p>
                      <p className="text-slate-600">Click &quot;Extract Data&quot; to automatically fill property details from this Yad2 listing using ChatGPT.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rooms *
              </label>
              <div className="flex gap-2">
                {[3, 3.5, 4, 4.5, 5, 5.5, 6].map((roomCount) => (
                  <button
                    key={roomCount}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rooms: roomCount }))}
                    className={`w-12 h-12 rounded-full text-sm font-medium transition-all flex-shrink-0 flex items-center justify-center ${
                      formData.rooms === roomCount
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-white/70 text-slate-700 border border-slate-300 hover:bg-primary/10 hover:border-primary/30'
                    }`}
                    tabIndex={3}
                  >
                    {roomCount}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Square Meters *
                </label>
                <input
                  type="number"
                  name="square_meters"
                  required
                  min="1"
                  value={formData.square_meters}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                  tabIndex={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Asked Price (ILS) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="asked_price"
                    required
                    value={formattedPrice}
                    onChange={handlePriceChange}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                    tabIndex={5}
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 text-sm font-medium">₪</span>
                  </div>
                  <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <div className="w-px h-6 bg-slate-300"></div>
                  </div>
                </div>
              </div>
            </div>

            {formData.asked_price > 0 && formData.square_meters > 0 && (
              <div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm font-medium text-slate-700">
                  Price per m²: ₪{(formData.asked_price / formData.square_meters).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                  tabIndex={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                  tabIndex={7}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Source *
                </label>
                <div className="relative">
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all appearance-none cursor-pointer"
                    tabIndex={8}
                  >
                    {SOURCES.map(source => (
                      <option key={source} value={source}>{source}</option>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Property Type *
                </label>
                <div className="relative">
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all appearance-none cursor-pointer"
                    tabIndex={9}
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status *
              </label>
              <div className="relative">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all appearance-none cursor-pointer"
                  tabIndex={10}
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <div className="space-y-2">
                <div
                  contentEditable
                  onInput={handleDescriptionInput}
                  onFocus={handleDescriptionFocus}
                  onKeyDown={handleDescriptionKeyDown}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all text-right min-h-[100px] max-h-[200px] overflow-y-auto"
                  dir="rtl"
                  style={{ unicodeBidi: 'plaintext' }}
                  dangerouslySetInnerHTML={{ __html: formData.description || '<span style="color: #94a3b8; font-style: italic;">Additional details about the property</span>' }}
                  suppressContentEditableWarning={true}
                  tabIndex={11}
                />
                <div className="flex justify-end space-x-2 text-xs text-slate-500">
                  <span>Cmd+B for bold</span>
                  <span>•</span>
                  <span>Enter for line break</span>
                  <span>•</span>
                  <span>Shift+Enter for new paragraph</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="apartment_broker"
                  name="apartment_broker"
                  checked={formData.apartment_broker || false}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 text-primary bg-white border-2 border-slate-300 rounded focus:ring-primary focus:ring-2 transition-all"
                  tabIndex={12}
                />
                <label htmlFor="apartment_broker" className="ml-3 text-sm font-semibold text-slate-700 cursor-pointer">
                  Has Apartment Broker
                </label>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-600">
                  Check this if the property listing includes an apartment broker service
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 font-medium transition-all"
                tabIndex={14}
              >
                <div className="flex items-center space-x-2">
                  <span>Cancel</span>
                  <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                    ESC
                  </span>
                </div>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                tabIndex={13}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={property ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                      </svg>
                      <span>{property ? 'Update Property' : 'Create Property'}</span>
                    </div>
                    <span className="text-xs bg-white/20 px-2 py-1 rounded text-primary-foreground/80">
                      ⌘↵
                    </span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Extraction Result Modal */}
      {extractionResult.show && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setExtractionResult({ show: false, success: false, message: '' })}
        >
          <div 
            className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl max-w-md w-full p-6 animate-fade-in border border-white/20"
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
            
            <div className="flex justify-end">
              <button
                onClick={() => setExtractionResult({ show: false, success: false, message: '' })}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  extractionResult.success
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {extractionResult.success ? 'Continue Editing' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}