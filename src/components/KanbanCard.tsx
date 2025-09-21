'use client'

import { Property } from '@/types/property'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect } from 'react'
import { getPropertyNotes } from '@/lib/properties'

interface KanbanCardProps {
  property: Property
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
}

export default function KanbanCard({ property, onEdit, onDelete, onViewNotes }: KanbanCardProps) {
  const [notesCount, setNotesCount] = useState<number>(0)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
            {property.address}
          </h4>
          <div className="flex space-x-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(property)
              }}
              className="p-1 text-gray-400 hover:text-blue-600"
              title="Edit"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('Delete this property?')) {
                  onDelete(property.id)
                }
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>{property.rooms} rooms</span>
            <span>{property.square_meters} m²</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">₪{formatPrice(property.asked_price)}</span>
            <span>₪{formatPrice(Math.round(property.price_per_meter))}/m²</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">{property.source}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewNotes(property)
            }}
            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {notesCount > 0 && <span className="bg-blue-100 text-blue-800 px-1 rounded">({notesCount})</span>}
          </button>
        </div>
      </div>
    </div>
  )
}