'use client'

import { Property, PropertyStatus } from '@/types/property'
import { getStatusLabel } from '@/constants/statuses'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState } from 'react'
import KanbanCard from './KanbanCard'

function DroppableColumn({
  id,
  children,
  title,
  count,
  bgColor,
  isCollapsed,
  onToggleCollapse,
  isEmpty,
  isDragging
}: {
  id: string
  children: React.ReactNode
  title: string
  count: number
  bgColor: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  isEmpty: boolean
  isDragging: boolean
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  if (isCollapsed) {
    return (
      <div
        className={`flex flex-col bg-gray-50 rounded-2xl h-full transition-all duration-300 border border-[rgba(0,0,0,0.06)] ${
          isOver ? 'ring-2 ring-black/10 ring-offset-2' : ''
        }`}
        style={{ width: '100px' }}
      >
        <button
          onClick={onToggleCollapse}
          className={`flex flex-col items-center justify-start p-2 pt-6 rounded-2xl transition-all hover:bg-black/5 flex-1`}
        >
          <div className="flex items-center justify-center">
            <h3
              className="font-extrabold text-xs text-black/40 text-center leading-tight uppercase tracking-wider"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {title}
            </h3>
          </div>
          <div className="mt-4">
            <span
              className="text-xs text-black font-black"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {count}
            </span>
          </div>
          <svg 
            className="w-4 h-4 text-black/20 mt-4 transform rotate-90" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth="3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div 
          ref={setNodeRef}
          className="flex-1 flex items-center justify-center p-2"
        >
          {count > 0 && (
            <div className="text-center text-black/40 text-sm">
              <div className="transform rotate-90 whitespace-nowrap font-black">
                {count}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-2xl h-full transition-all border border-[rgba(0,0,0,0.06)] ${
        isOver ? 'ring-2 ring-black/10 ring-offset-2' : ''
      }`}
    >
      <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-sm border-b border-[rgba(0,0,0,0.06)] px-5 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0 -ml-1.5"
              title={isCollapsed ? 'Expand column' : 'Collapse column'}
            >
              <svg 
                className={`w-4 h-4 text-black/30 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth="3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: bgColor.replace('bg-', '') === 'gray-100' ? '#e5e7eb' : bgColor.replace('bg-', '') }}></div>
              <h3 className="font-extrabold text-xs text-black uppercase tracking-wider truncate">
                {title}
              </h3>
            </div>
          </div>
          <span className="bg-black/5 text-black/40 px-2 py-0.5 rounded-lg text-xs font-black ml-3 flex-shrink-0">{count}</span>
        </div>
      </div>
      <div className="px-3 py-3 flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {isEmpty ? (
          isDragging ? (
            <div
              className={`flex-1 grid place-items-center rounded-2xl border-2 border-dashed transition-all ${
                isOver ? 'border-black/20 bg-black/5 text-black' : 'border-black/5 text-black/20'
              }`}
            >
              <div className="flex flex-col items-center space-y-2 text-[10px] uppercase font-black tracking-widest">
                <svg className={`w-6 h-6 ${isOver ? 'text-black' : 'text-black/10'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>{isOver ? 'Drop it' : 'Drop here'}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center opacity-20">
              <div className="text-[10px] text-black font-black uppercase tracking-widest">Empty</div>
            </div>
          )
        ) : (
          children
        )}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  properties: Property[]
  onUpdateStatus: (propertyId: string, newStatus: PropertyStatus) => Promise<void>
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
  notesRefreshKey?: number
  notesBump?: { id: string; delta: number; nonce: number } | null
}

const STATUSES: { status: PropertyStatus; color: string; bgColor: string }[] = [
  { status: 'Seen', color: 'text-gray-700', bgColor: '#6366f1' },
  { status: 'Interested', color: 'text-emerald-800', bgColor: '#22c55e' },
  { status: 'Contacted Realtor', color: 'text-blue-700', bgColor: '#3b82f6' },
  { status: 'Visited', color: 'text-indigo-800', bgColor: '#8b5cf6' },
  { status: 'On Hold', color: 'text-orange-700', bgColor: '#f59e0b' },
  { status: 'Irrelevant', color: 'text-red-700', bgColor: '#64748b' },
  { status: 'Purchased', color: 'text-green-700', bgColor: '#10b981' },
]

export default function KanbanBoard({
  properties,
  onUpdateStatus,
  onEdit,
  onDelete,
  onViewNotes,
  notesRefreshKey,
  notesBump
}: KanbanBoardProps) {
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [isDraggingSomething, setIsDraggingSomething] = useState(false)
  const [collapsedColumns, setCollapsedColumns] = useState<Set<PropertyStatus>>(
    new Set(['Irrelevant', 'Purchased'])
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  const getPropertiesByStatus = (status: PropertyStatus) => {
    return properties.filter(property => property.status === status)
  }

  const toggleColumnCollapse = (status: PropertyStatus) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const property = properties.find(p => p.id === event.active.id)
    setActiveProperty(property || null)
    setIsDraggingSomething(true)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const propertyId = active.id as string
    const overId = over.id as string

    // Check if we're dropping on a column (status)
    const isOverColumn = STATUSES.some(status => status.status === overId)

    if (isOverColumn) {
      return
    }

    // If dropping on another property, find its status
    const overProperty = properties.find(p => p.id === overId)
    if (overProperty) {
      const property = properties.find(p => p.id === propertyId)
      if (property && property.status !== overProperty.status) {
        // This would handle reordering within columns if needed
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProperty(null)
    setIsDraggingSomething(false)

    if (!over) return

    const propertyId = active.id as string
    const overId = over.id as string

    // Check if dropping on a column
    const targetStatus = STATUSES.find(status => status.status === overId)

    let newStatus: PropertyStatus
    if (targetStatus) {
      newStatus = targetStatus.status
    } else {
      // Dropping on another property - use that property's status
      const overProperty = properties.find(p => p.id === overId)
      if (!overProperty) return
      newStatus = overProperty.status
    }

    const property = properties.find(p => p.id === propertyId)
    if (!property || property.status === newStatus) return

    try {
      await onUpdateStatus(propertyId, newStatus)
    } catch (error) {
      console.error('Error updating property status:', error)
    }
  }

  return (
    <div className="h-full overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-scroll flex gap-3 h-full overflow-x-auto px-4 py-2">
          {STATUSES.map(({ status, bgColor }) => {
            const columnProperties = getPropertiesByStatus(status)
            const isCollapsed = collapsedColumns.has(status)

            return (
              <div 
                key={status} 
                className={`flex-shrink-0 h-full transition-all duration-300 ${
                  isCollapsed ? 'w-24' : 'w-[320px]'
                }`}
              >
                <DroppableColumn
                  id={status}
                  title={getStatusLabel(status)}
                  count={columnProperties.length}
                  bgColor={bgColor}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleColumnCollapse(status)}
                  isEmpty={columnProperties.length === 0}
                  isDragging={isDraggingSomething}
                >
                  {!isCollapsed && (
                    <SortableContext
                      items={columnProperties.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 space-y-2 min-h-full">
                        {columnProperties.map(property => (
                          <KanbanCard
                            key={property.id}
                            property={property}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewNotes={onViewNotes}
                            notesRefreshKey={notesRefreshKey}
                            notesBump={notesBump}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </DroppableColumn>
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeProperty ? (
            <div className="bg-white rounded-lg shadow-2xl border-2 border-primary/40 p-4 opacity-95 rotate-2 scale-105 max-w-xs">
              <div className="font-semibold text-sm text-slate-900 mb-1 line-clamp-2">
                {activeProperty.title}
              </div>
              <div className="text-xs text-slate-500 mb-2 line-clamp-1" title={activeProperty.address}>
                {activeProperty.address}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Rooms:</span>
                    <span className="font-medium text-slate-700">
                      {activeProperty.rooms ? <span>{activeProperty.rooms}</span> : '—'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Size:</span>
                    <span className={`font-medium ${activeProperty.square_meters === null ? 'text-amber-700' : activeProperty.square_meters === 1 ? 'text-slate-500' : 'text-slate-700'}`}>
                      {activeProperty.square_meters === null ? 'Not set' : activeProperty.square_meters === 1 ? 'Unknown' : (
                        <>
                          <span>{activeProperty.square_meters}</span> m²
                          {activeProperty.balcony_square_meters && activeProperty.balcony_square_meters > 0 && (
                            <span className="text-slate-500 ml-1">
                              + <span>{activeProperty.balcony_square_meters}</span>
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                </div>
                {activeProperty.asked_price !== null && activeProperty.asked_price !== 1 ? (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-900">
                      ₪{new Intl.NumberFormat('en-US').format(activeProperty.asked_price)}
                    </span>
                    <span className="text-slate-500">
                      {activeProperty.price_per_meter !== null && activeProperty.asked_price !== null && activeProperty.asked_price !== 1 && activeProperty.square_meters !== null && activeProperty.square_meters !== 1 ? (
                        `₪${new Intl.NumberFormat('en-US').format(Math.round(activeProperty.price_per_meter))}/m²`
                      ) : (
                        'N/A'
                      )}
                    </span>
                  </div>
                ) : activeProperty.asked_price === 1 ? (
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-500">Price: Unknown</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-100">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-700">Price not set</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}