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
  bgColor
}: {
  id: string
  children: React.ReactNode
  title: string
  count: number
  color: string
  bgColor: string
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-lg p-3 min-h-96 transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
    >
      <div className={`flex items-center justify-between mb-3 p-2 rounded-md ${bgColor}`}>
        <h3 className={`font-medium text-sm ${color}`}>
          {title}
        </h3>
        <span className={`text-xs px-2 py-1 rounded-full bg-white ${color}`}>
          {count}
        </span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 h-full">
          {STATUSES.map(({ status, color, bgColor }) => {
            const columnProperties = getPropertiesByStatus(status)

            return (
              <DroppableColumn
                key={status}
                id={status}
                title={status}
                count={columnProperties.length}
                color={color}
                bgColor={bgColor}
              >
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
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay>
          {activeProperty ? (
            <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300 p-3 rotate-3 opacity-90">
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