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
    latitude: property?.latitude || null,
    longitude: property?.longitude || null
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Submitting property:', {
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude
    })
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
    console.log('📍 Address changed:', address)
    console.log('📍 Coordinates:', coordinates)

    setFormData(prev => ({
      ...prev,
      address,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null
    }))
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <AddressAutocomplete
                value={formData.address}
                onChange={handleAddressChange}
                placeholder="Enter property address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rooms *
                </label>
                <input
                  type="number"
                  name="rooms"
                  required
                  step="0.5"
                  min="0"
                  value={formData.rooms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Square Meters *
                </label>
                <input
                  type="number"
                  name="square_meters"
                  required
                  min="1"
                  value={formData.square_meters}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asked Price (ILS) *
              </label>
              <input
                type="number"
                name="asked_price"
                required
                min="0"
                value={formData.asked_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.asked_price > 0 && formData.square_meters > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Price per m²: ₪{(formData.asked_price / formData.square_meters).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type *
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROPERTY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional details about the property"
              />
            </div>

            {/* Debug coordinates */}
            {(formData.latitude || formData.longitude) && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>Coordinates detected:</strong><br />
                  Latitude: {formData.latitude}<br />
                  Longitude: {formData.longitude}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : property ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}