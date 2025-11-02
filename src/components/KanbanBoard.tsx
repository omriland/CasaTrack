'use client'

import { Property, PropertyStatus } from '@/types/property'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
        className={`flex flex-col bg-slate-50/50 rounded-lg h-full transition-all duration-300 ${
          isOver ? 'ring-2 ring-primary/20 ring-offset-2' : ''
        }`}
        style={{ width: '100px' }}
      >
        <button
          onClick={onToggleCollapse}
          className={`flex flex-col items-center justify-start p-2 pt-4 rounded-md transition-all hover:bg-white/50 flex-1`}
        >
          <div className="flex items-center justify-center">
            <h3
              className="font-semibold text-sm text-slate-700 text-center leading-tight"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {title}
            </h3>
          </div>
          <div className="mt-3">
            <span
              className="text-xs text-slate-500 font-medium"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              {count}
            </span>
          </div>
          <svg 
            className="w-4 h-4 text-slate-400 mt-2 transform rotate-90" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div 
          ref={setNodeRef}
          className="flex-1 flex items-center justify-center p-2"
        >
          {count > 0 && (
            <div className="text-center text-slate-400 text-sm">
              <div className="transform rotate-90 whitespace-nowrap font-medium">
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
      className={`flex flex-col bg-slate-50/50 rounded-lg h-full transition-all ${
        isOver ? 'ring-2 ring-primary/20 ring-offset-2' : ''
      }`}
    >
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0 -ml-1"
              title={isCollapsed ? 'Expand column' : 'Collapse column'}
            >
              <svg 
                className={`w-4 h-4 text-slate-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-2.5 flex-1 min-w-0">
              <div className={`w-1 h-5 ${bgColor} rounded-full flex-shrink-0`}></div>
              <h3 className="font-semibold text-sm text-slate-700 text-left truncate">
                {title}
              </h3>
            </div>
          </div>
          <span className="text-sm text-slate-500 ml-2 flex-shrink-0 font-medium">{count}</span>
        </div>
      </div>
      <div className="px-2.5 py-2 flex-1 flex flex-col overflow-y-auto">
        {isEmpty ? (
          isDragging ? (
            <div
              className={`flex-1 grid place-items-center rounded-lg border-2 border-dashed transition-all ${
                isOver ? 'border-primary/40 bg-primary/5 text-primary' : 'border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex flex-col items-center space-y-2 text-xs">
                <svg className={`w-5 h-5 ${isOver ? 'text-primary' : 'text-slate-400'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span className="font-medium">{isOver ? 'Release to drop' : 'Drop here'}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center">
              <div className="text-xs text-slate-400 font-medium">No properties</div>
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
  { status: 'Seen', color: 'text-gray-800', bgColor: 'bg-gray-100' },
  { status: 'Interested', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  { status: 'Contacted Realtor', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  { status: 'Visited', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  { status: 'On Hold', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  { status: 'Irrelevant', color: 'text-red-800', bgColor: 'bg-red-100' },
  { status: 'Purchased', color: 'text-green-800', bgColor: 'bg-green-100' },
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
    new Set(['On Hold', 'Irrelevant', 'Purchased'])
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
          {STATUSES.map(({ status, color, bgColor }) => {
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
                  title={status}
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
            <div className="bg-white rounded-xl shadow-2xl border-2 border-primary/40 p-4 opacity-95 rotate-2 scale-105 max-w-xs">
              <div className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2">
                {activeProperty.address}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Rooms:</span>
                    <span className="font-medium text-slate-700">{activeProperty.rooms || '—'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Size:</span>
                    <span className="font-medium text-slate-700">
                      {activeProperty.square_meters} m²
                      {activeProperty.balcony_square_meters && activeProperty.balcony_square_meters > 0 && (
                        <span className="text-slate-500 ml-1">+ {activeProperty.balcony_square_meters}</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="font-semibold text-slate-900">
                    ₪{new Intl.NumberFormat('en-US').format(activeProperty.asked_price)}
                  </span>
                  <span className="text-slate-500">
                    ₪{new Intl.NumberFormat('en-US').format(Math.round(activeProperty.price_per_meter))}/m²
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}