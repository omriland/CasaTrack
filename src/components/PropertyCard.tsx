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
  }, [property.id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-200 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight">
            {property.address}
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(property.status)}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-60"></div>
            {property.status}
          </span>
        </div>
        <div className="flex space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(property)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Edit property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title="Delete property"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            <span className="text-xs font-medium text-slate-600">Rooms</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">{property.rooms}</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 mb-1">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
            </svg>
            <span className="text-xs font-medium text-slate-600">Size</span>
          </div>
          <span className="text-lg font-semibold text-slate-900">{property.square_meters} m²</span>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600">Asking Price</span>
          <span className="text-xl font-bold text-slate-900">₪{formatPrice(property.asked_price)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Price per m²</span>
          <span className="font-semibold text-slate-700">₪{formatPrice(Math.round(property.price_per_meter))}</span>
        </div>
      </div>

      {/* Additional Details */}
      <div className="space-y-2 text-sm">
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
      </div>

      {/* Contact Information */}
      {property.contact_name && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
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
                  <span className="text-sm text-slate-600">{property.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Description</h4>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{property.description}</p>
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <button
          onClick={() => onViewNotes(property)}
          className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors group"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Notes</span>
          </div>
          {notesCount > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
              {notesCount}
            </span>
          )}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-sm w-full animate-fade-in">
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
              Are you sure you want to delete <strong>{property.address}</strong>? All associated notes and data will be permanently removed.
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
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
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