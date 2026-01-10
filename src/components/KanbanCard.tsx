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
  notesRefreshKey?: number
  notesBump?: { id: string; delta: number; nonce: number } | null
}

export default function KanbanCard({ property, onViewNotes, notesRefreshKey, notesBump }: KanbanCardProps) {
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
  }, [property.id, notesRefreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notesBump) return
    if (notesBump.id !== property.id) return
    setNotesCount((prev) => Math.max(0, prev + notesBump.delta))
  }, [notesBump?.nonce, property.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      className={`group relative rounded-2xl p-4 transition-all border cursor-pointer hover:border-black/20 hover:bg-gray-50/50 ${
        property.is_flagged
          ? 'bg-[#FFFCF2] border-[#FEF3C7]'
          : 'bg-white border-[rgba(0,0,0,0.06)]'
      } ${isDragging ? 'opacity-50 scale-105 rotate-1 border-black/20 z-50 shadow-2xl' : ''}`}
      onClick={() => onViewNotes(property)}
    >
      {/* Drag Handle - Overlay on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 bg-black text-white rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 z-10"
        title="Drag to move"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <div className="space-y-3">
        <div className="pr-6">
          <h4 className="font-extrabold text-sm text-black line-clamp-2 leading-tight">
            {property.title}
          </h4>
          <div className="flex items-center gap-1 mt-1 opacity-40">
            <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-[10px] font-bold truncate italic" title={property.address}>
              {property.address}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[rgba(0,0,0,0.04)] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] font-black text-black/60">{property.rooms || '—'}</span>
            <span className="text-[8px] font-black text-black/30 uppercase tracking-tighter">R</span>
          </div>
          <span className="text-black/10 text-[10px] flex-shrink-0">•</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] font-black text-black/60">{property.square_meters && property.square_meters !== 1 ? `${property.square_meters}` : '—'}</span>
            <span className="text-[8px] font-black text-black/30 uppercase tracking-tighter">m²</span>
          </div>
          {property.asked_price && property.asked_price !== 1 && (
            <>
              <span className="text-black/10 text-[10px] flex-shrink-0">•</span>
              <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                <span className="text-[11px] font-black text-black">
                  {formatPrice(property.asked_price)} ₪
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer info: Notes & Source */}
        <div className="flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider bg-black/5 px-1.5 py-0.5 rounded-md">
              {property.source}
            </span>
          </div>
          {notesCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[10px] font-black">{notesCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
