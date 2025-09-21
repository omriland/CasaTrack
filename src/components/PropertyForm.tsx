'use client'

import { useState } from 'react'
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
    longitude: property?.longitude || null
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

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
    console.log('🏠 Address changed:', address)
    console.log('📍 Coordinates received:', coordinates)
    
    const newFormData = {
      ...formData,
      address,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null
    }
    
    console.log('📝 Updated form data:', newFormData)
    setFormData(newFormData)
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
              <AddressAutocomplete
                value={formData.address}
                onChange={handleAddressChange}
                placeholder="Enter property address"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
              />
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
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
              />
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
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Asked Price (ILS) *
                </label>
                <input
                  type="number"
                  name="asked_price"
                  required
                  min="0"
                  value={formData.asked_price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all"
                />
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
              <textarea
                name="description"
                rows={4}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white/70 backdrop-blur-sm transition-all resize-none"
                placeholder="Additional details about the property"
              />
            </div>


            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 font-medium transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
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
  )
}