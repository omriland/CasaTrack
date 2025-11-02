'use client'

import { Property } from '@/types/property'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useEffect, useRef } from 'react'
import { getPropertyNotes, updateProperty } from '@/lib/properties'

interface KanbanCardProps {
  property: Property
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
  notesRefreshKey?: number
  notesBump?: { id: string; delta: number; nonce: number } | null
}

export default function KanbanCard({ property, onEdit, onDelete, onViewNotes, notesRefreshKey, notesBump }: KanbanCardProps) {
  const [notesCount, setNotesCount] = useState<number>(0)
  const [rooms, setRooms] = useState<number>(property.rooms)
  const [showRoomsPicker, setShowRoomsPicker] = useState<boolean>(false)
  const roomsPickerRef = useRef<HTMLDivElement>(null)

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
  }, [notesBump?.nonce])

  useEffect(() => {
    setRooms(property.rooms)
  }, [property.rooms])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (roomsPickerRef.current && !roomsPickerRef.current.contains(e.target as Node)) {
        setShowRoomsPicker(false)
      }
    }
    if (showRoomsPicker) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showRoomsPicker])

  const handleQuickSetRooms = async (value: number) => {
    try {
      await updateProperty(property.id, { rooms: value })
      setRooms(value)
      setShowRoomsPicker(false)
    } catch (e) {
      console.error('Failed updating rooms:', e)
    }
  }

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
      className={`group bg-white rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all border border-slate-200 hover:border-slate-300 ${
        isDragging ? 'opacity-50 scale-105 rotate-1 border-primary/40' : ''
      }`}
    >
        <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-base text-slate-900 line-clamp-2 flex-1 leading-tight">
            {property.address}
          </h4>
          <div className="flex space-x-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(property)
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
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
              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 3a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div
              className={`relative inline-flex items-center space-x-1.5 rounded px-2.5 py-1.5 text-sm font-medium ${
                rooms === 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-700 border border-slate-200'
              } cursor-pointer hover:bg-slate-100 transition-colors`}
              onClick={(e) => { e.stopPropagation(); setShowRoomsPicker((v) => !v) }}
              title={rooms === 0 ? 'Add rooms' : 'Change rooms'}
              ref={roomsPickerRef}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>{rooms === 0 ? 'Add rooms' : `${rooms}`}</span>
              {showRoomsPicker && (
                <div className="absolute left-0 top-full mt-1.5 bg-white rounded-lg border border-slate-200 p-2 z-50">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 3.5, 4, 4.5, 5, 5.5, 6].map((r) => (
                      <button
                        key={r}
                        onClick={(ev) => { ev.stopPropagation(); handleQuickSetRooms(r) }}
                        className={`px-2.5 py-2 text-sm rounded font-medium transition-colors ${
                          rooms === r 
                            ? 'bg-primary text-white' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="inline-flex flex-col items-start bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5">
              <div className="flex items-center space-x-1.5">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
                </svg>
                <span className="text-sm font-medium text-slate-700">{property.square_meters} m²</span>
              </div>
              {property.balcony_square_meters && property.balcony_square_meters > 0 && (
                <span className="text-xs text-slate-500 mt-0.5 ml-5">+ {property.balcony_square_meters} m² balcony</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-lg font-bold text-slate-900">₪{formatPrice(property.asked_price)}</span>
            <span className="text-sm text-slate-500 font-medium">₪{formatPrice(Math.round(property.price_per_meter))}/m²</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded px-2.5 py-1 font-medium">{property.source}</span>
            {property.apartment_broker && (
              <div className="flex items-center space-x-1" title="Has apartment broker">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewNotes(property)
            }}
            className="flex items-center text-sm text-slate-600 hover:text-primary transition-colors font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {notesCount > 0 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-semibold">{notesCount}</span>}
          </button>
        </div>
      </div>
    </div>
  )
}