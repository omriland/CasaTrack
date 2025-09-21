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
  color,
  bgColor,
  isCollapsed,
  onToggleCollapse
}: {
  id: string
  children: React.ReactNode
  title: string
  count: number
  color: string
  bgColor: string
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  if (isCollapsed) {
    return (
      <div
        className={`flex flex-col bg-gray-50 rounded-lg transition-all duration-300 ${
          isOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
        }`}
        style={{ width: '100px', minHeight: '400px' }}
      >
        <button
          onClick={onToggleCollapse}
          className={`flex flex-col items-center justify-start p-4 rounded-md transition-all hover:scale-105 ${bgColor}`}
          style={{ minHeight: '200px' }}
        >
          <div className="flex-1 flex items-center justify-center mb-4" style={{ minHeight: '120px' }}>
            <h3 className={`font-medium text-sm ${color} transform rotate-90 whitespace-nowrap`}>
              {title}
            </h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full bg-white ${color} mb-3`}>
            {count}
          </span>
          <svg 
            className={`w-4 h-4 ${color} transform rotate-90`} 
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
            <div className="text-center text-gray-400 text-xs">
              <div className="transform rotate-90 whitespace-nowrap">
                {count} {count === 1 ? 'property' : 'properties'}
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
      className={`flex flex-col bg-gray-50 rounded-lg p-3 min-h-96 transition-all duration-300 ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''
      }`}
    >
      <div className={`flex items-center justify-between mb-3 p-2 rounded-md ${bgColor}`}>
        <h3 className={`font-medium text-sm ${color}`}>
          {title}
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full bg-white ${color}`}>
            {count}
          </span>
          <button
            onClick={onToggleCollapse}
            className={`p-1 rounded transition-all hover:scale-110 ${color} hover:bg-white/50`}
            title="Collapse column"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

interface KanbanBoardProps {
  properties: Property[]
  onUpdateStatus: (propertyId: string, newStatus: PropertyStatus) => Promise<void>
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewNotes: (property: Property) => void
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
  onViewNotes
}: KanbanBoardProps) {
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
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
        <div className="flex gap-4 h-full overflow-x-auto">
          {STATUSES.map(({ status, color, bgColor }) => {
            const columnProperties = getPropertiesByStatus(status)
            const isCollapsed = collapsedColumns.has(status)

            return (
              <div 
                key={status} 
                className={`flex-shrink-0 transition-all duration-300 ${
                  isCollapsed ? 'w-28' : 'w-80'
                }`}
              >
                <DroppableColumn
                  id={status}
                  title={status}
                  count={columnProperties.length}
                  color={color}
                  bgColor={bgColor}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleColumnCollapse(status)}
                >
                  {!isCollapsed && (
                    <SortableContext
                      items={columnProperties.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div
                        className="flex-1 space-y-2 overflow-y-auto"
                        style={{ minHeight: '200px' }}
                      >
                        {columnProperties.map(property => (
                          <KanbanCard
                            key={property.id}
                            property={property}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewNotes={onViewNotes}
                          />
                        ))}
                        {columnProperties.length === 0 && (
                          <div className="text-center text-gray-400 text-sm py-8">
                            Drop properties here
                          </div>
                        )}
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
            <div className="bg-white rounded-lg shadow-lg border-2 border-primary/30 p-3 rotate-3 opacity-90">
              <div className="font-medium text-sm text-gray-900 mb-1">
                {activeProperty.address}
              </div>
              <div className="text-xs text-gray-600">
                ₪{new Intl.NumberFormat('en-US').format(activeProperty.asked_price)}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}