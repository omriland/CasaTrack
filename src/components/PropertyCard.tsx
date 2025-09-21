'use client'

import { Property } from '@/types/property'
import { useState, useEffect } from 'react'
import { getPropertyNotes } from '@/lib/properties'

interface PropertyCardProps {
  property: Property
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
}

export default function PropertyCard({ property, onEdit, onDelete, onViewNotes }: PropertyCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [notesCount, setNotesCount] = useState<number>(0)

  useEffect(() => {
    loadNotesCount()
  }, [property.id])

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

  const getStatusColor = (status: Property['status']) => {
    const colors = {
      'Seen': 'bg-gray-100 text-gray-800',
      'Interested': 'bg-yellow-100 text-yellow-800',
      'Contacted Realtor': 'bg-blue-100 text-blue-800',
      'Visited': 'bg-purple-100 text-purple-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Irrelevant': 'bg-red-100 text-red-800',
      'Purchased': 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {property.address}
          </h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
        </div>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={() => onEdit(property)}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Rooms:</span>
          <span className="font-medium">{property.rooms}</span>
        </div>
        <div className="flex justify-between">
          <span>Size:</span>
          <span className="font-medium">{property.square_meters} m²</span>
        </div>
        <div className="flex justify-between">
          <span>Price:</span>
          <span className="font-medium">₪{formatPrice(property.asked_price)}</span>
        </div>
        <div className="flex justify-between">
          <span>Price/m²:</span>
          <span className="font-medium">₪{formatPrice(Math.round(property.price_per_meter))}</span>
        </div>
        <div className="flex justify-between">
          <span>Source:</span>
          <span className="font-medium">{property.source}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="font-medium">{property.property_type}</span>
        </div>
      </div>

      {property.contact_name && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Contact:</span>
              <span className="font-medium">{property.contact_name}</span>
            </div>
            {property.contact_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{property.contact_phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {property.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewNotes(property)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Notes {notesCount > 0 && <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">({notesCount})</span>}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Property</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(property.id)
                  setShowDeleteConfirm(false)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}