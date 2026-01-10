'use client'

import { Property, PropertyStatus } from '@/types/property'
import { PROPERTY_STATUS_OPTIONS, getStatusLabel, getStatusColor } from '@/constants/statuses'
import { useState, useRef, useEffect } from 'react'
import { updatePropertyStatus } from '@/lib/properties'
import StarRating from './StarRating'

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface PropertyCardProps {
  property: Property
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
  onStatusUpdate?: (propertyId: string, newStatus: PropertyStatus) => void
  onRatingUpdate?: (propertyId: string, rating: number) => void
  onFlagToggle?: (propertyId: string, isFlagged: boolean) => void
  notesRefreshKey?: number
  notesBump?: { id: string; delta: number; nonce: number } | null
}

export default function PropertyCard({ property, onViewNotes, onStatusUpdate, onRatingUpdate, onFlagToggle }: PropertyCardProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    }
  }

  const statusColor = getStatusColor(property.status)
  const statusBgColor = hexToRgba(statusColor, 0.12)

  if (!mounted) return null

    return (
      <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 animate-fade-in cursor-pointer hover:border-black/20 hover:bg-gray-50/50 ${
          property.is_flagged 
          ? 'bg-[#FFFCF2] border-[#FEF3C7]' 
          : 'bg-white border-[rgba(0,0,0,0.06)]'
      }`}
      onClick={() => onViewNotes(property)}
    >
      {/* Flag Indicator */}
      {property.is_flagged && (
        <div className="absolute top-0 left-6 -translate-y-1/2">
          <div className="bg-[#FBBF24] text-white p-1 rounded-b-md shadow-sm">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h2v18H3V3zm3 2h12l-2 4 2 4H6V5z"/>
              </svg>
          </div>
        </div>
      )}

      {/* Header Row: Title + Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-lg font-extrabold text-black leading-tight flex-1 min-w-0 line-clamp-2">
          {property.title}
        </h3>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {/* Status Badge */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowStatusDropdown(!showStatusDropdown) }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all whitespace-nowrap uppercase tracking-wider border border-transparent hover:border-black/5"
              style={{ 
                backgroundColor: statusBgColor,
                color: statusColor,
              }}
            >
              {getStatusLabel(property.status)}
            </button>

            {showStatusDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-[rgba(0,0,0,0.06)] py-1.5 z-50 overflow-hidden">
                {PROPERTY_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(status.value) }}
                    className={`w-full px-4 py-2 text-left text-xs font-bold transition-all hover:bg-black/5 ${
                      status.value === property.status ? 'text-black bg-black/5' : 'text-black/40'
                      }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            )}
        </div>

          {/* Stars */}
          <div onClick={(e) => e.stopPropagation()}>
            <StarRating
              rating={property.rating}
              onRatingChange={(rating) => onRatingUpdate?.(property.id, rating)}
              size="sm"
              interactive={true}
            />
          </div>
        </div>
      </div>

      {/* Address Row */}
      <div className="flex items-center gap-1.5 mb-6">
        <svg className="w-3.5 h-3.5 text-black/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm text-black/50 line-clamp-1 font-medium italic">
            {property.address}
        </span>
      </div>

      {/* Stats Strip: Rooms • Size • Price */}
      <div className="flex items-center gap-2.5 pt-4 border-t border-[rgba(0,0,0,0.04)] mt-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-extrabold text-black/60">{property.rooms || '—'}</span>
          <span className="text-[10px] font-bold text-black/30 uppercase">Rooms</span>
        </div>
        <span className="text-black/10 text-xs flex-shrink-0">•</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs font-extrabold text-black/60">{property.square_meters && property.square_meters !== 1 ? `${property.square_meters}` : '—'}</span>
          <span className="text-[10px] font-bold text-black/30 uppercase">m²</span>
        </div>
        {property.asked_price && property.asked_price !== 1 && (
          <>
            <span className="text-black/10 text-xs flex-shrink-0">•</span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
              <span className="text-sm font-black text-black">
                {property.asked_price.toLocaleString()} ₪
              </span>
            </div>
          </>
        )}
      </div>

      {/* Hover Action Indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black text-white p-1.5 rounded-full shadow-lg">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
        </div>
      </div>
    </div>
  )
}
