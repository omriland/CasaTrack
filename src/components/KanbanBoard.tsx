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
  onToggleCollapse,
  isEmpty,
  isDragging
}: {
  id: string
  children: React.ReactNode
  title: string
  count: number
  color: string
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
        className={`flex flex-col bg-slate-100 rounded-[3px] h-full transition-all duration-300 ${
          isOver ? 'ring-2 ring-primary/30' : ''
        }`}
        style={{ width: '100px' }}
      >
        <button
          onClick={onToggleCollapse}
          className={`flex flex-col items-center justify-start p-2 pt-4 rounded-md transition-all hover:scale-105 flex-1`}
        >
          <div className="flex items-center justify-center">
            <h3
              className={`font-medium text-sm text-slate-700 text-center leading-tight`}
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' as any }}
            >
              {title}
            </h3>
          </div>
          <div className="mt-3">
            <span
              className="text-[10px] text-slate-500"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' as any }}
            >
              {count} {count === 1 ? 'property' : 'properties'}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-slate-500 mt-2 transform rotate-90`} 
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
      className={`flex flex-col bg-slate-100 rounded-[3px] h-full transition-colors ${
        isOver ? 'ring-2 ring-primary/30' : ''
      }`}
    >
      <div className={`sticky top-0 z-10 flex items-center justify-between px-4 py-3 rounded-t-[3px] bg-transparent mt-1 mx-1 mb-2`}>
        <h3 className={`font-semibold text-xs tracking-wide uppercase text-slate-700 mr-2 text-left`}>
          {title}
        </h3>
        <span className={`text-[11px] text-slate-500`}>{count} {count === 1 ? 'property' : 'properties'}</span>
      </div>
      <div className="px-3 pb-3 flex-1 flex flex-col">
        {isEmpty && isDragging ? (
          <div
            className={`flex-1 grid place-items-center rounded-lg border-2 border-dashed transition-colors ${
              isOver ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center space-x-2 text-xs">
              <svg className={`w-4 h-4 ${isOver ? 'text-primary' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <span>{isOver ? 'Release to drop here' : 'Drop property here'}</span>
            </div>
          </div>
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
        <div className="kanban-scroll flex gap-4 h-full overflow-x-auto px-1">
          {STATUSES.map(({ status, color, bgColor }) => {
            const columnProperties = getPropertiesByStatus(status)
            const isCollapsed = collapsedColumns.has(status)

            return (
              <div 
                key={status} 
                className={`flex-shrink-0 h-full transition-all duration-300 ${
                  isCollapsed ? 'w-24' : 'w-80'
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
                  isEmpty={columnProperties.length === 0}
                  isDragging={isDraggingSomething}
                >
                  {!isCollapsed && (
                    <SortableContext
                      items={columnProperties.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-full">
                        {columnProperties.map(property => (
                          <KanbanCard
                            key={property.id}
                            property={property}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewNotes={onViewNotes}
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
            <div className="bg-white rounded-lg shadow-lg border border-primary/30 p-3 opacity-95 rotate-3">
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