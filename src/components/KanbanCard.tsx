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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-[5px] p-3 cursor-grab active:cursor-grabbing transition-all shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_-3px_rgba(0,0,0,0.10)] ${
        isDragging ? 'opacity-80 shadow-lg scale-[1.01] rotate-2' : ''
      }`}
    >
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm text-slate-900 line-clamp-2 flex-1">
            {property.address}
          </h4>
          <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(property)
              }}
              className="p-1 text-slate-400 hover:text-primary rounded hover:bg-primary/10"
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
              className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>{property.rooms} rooms</span>
            </div>
            <div className="inline-flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
              </svg>
              <span>{property.square_meters} m²</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-900">₪{formatPrice(property.asked_price)}</span>
            <span className="text-slate-500">₪{formatPrice(Math.round(property.price_per_meter))}/m²</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">{property.source}</span>
            {property.apartment_broker && (
              <div className="flex items-center space-x-1" title="Has apartment broker">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewNotes(property)
            }}
            className="flex items-center text-[11px] text-primary hover:text-primary/80"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {notesCount > 0 && <span className="bg-primary/10 text-primary px-1 rounded">({notesCount})</span>}
          </button>
        </div>
      </div>
    </div>
  )
}