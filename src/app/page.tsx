'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, clearAuth } from '@/lib/auth'
import { getProperties, createProperty, updateProperty, deleteProperty, updatePropertyStatus } from '@/lib/properties'
import { Property, PropertyInsert } from '@/types/property'
import LoginForm from '@/components/LoginForm'
import PropertyForm from '@/components/PropertyForm'
import PropertyCard from '@/components/PropertyCard'
import NotesModal from '@/components/NotesModal'
import KanbanBoard from '@/components/KanbanBoard'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'kanban'>('cards')

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated())
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadProperties()
    }
  }, [isLoggedIn])

  const loadProperties = async () => {
    try {
      const data = await getProperties()
      setProperties(data)
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    clearAuth()
    setIsLoggedIn(false)
    setProperties([])
  }

  const handleCreateProperty = async (propertyData: PropertyInsert) => {
    try {
      setFormLoading(true)
      const newProperty = await createProperty(propertyData)
      setProperties(prev => [newProperty, ...prev])
      setShowForm(false)
    } catch (error) {
      console.error('Error creating property:', error)
      alert('Error creating property. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateProperty = async (propertyData: PropertyInsert) => {
    if (!editingProperty) return

    try {
      setFormLoading(true)
      const updatedProperty = await updateProperty(editingProperty.id, propertyData)
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
      setEditingProperty(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating property:', error)
      alert('Error updating property. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProperty = async (id: string) => {
    try {
      await deleteProperty(id)
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting property:', error)
      alert('Error deleting property. Please try again.')
    }
  }

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property)
    setShowForm(true)
  }

  const handleViewNotes = (property: Property) => {
    setSelectedProperty(property)
    setShowNotesModal(true)
  }

  const handleCloseNotesModal = () => {
    setShowNotesModal(false)
    setSelectedProperty(null)
  }

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: Property['status']) => {
    try {
      const updatedProperty = await updatePropertyStatus(propertyId, newStatus)
      setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p))
    } catch (error) {
      console.error('Error updating property status:', error)
      throw error
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">CasaTrack</h1>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kanban
                </button>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Property
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${viewMode === 'kanban' ? 'max-w-full' : 'max-w-7xl'}`}>
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No properties yet</div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Property
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(property => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteProperty}
                onViewNotes={handleViewNotes}
              />
            ))}
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <KanbanBoard
              properties={properties}
              onUpdateStatus={handleUpdatePropertyStatus}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onViewNotes={handleViewNotes}
            />
          </div>
        )}
      </main>

      {showForm && (
        <PropertyForm
          property={editingProperty || undefined}
          onSubmit={editingProperty ? handleUpdateProperty : handleCreateProperty}
          onCancel={handleCloseForm}
          loading={formLoading}
        />
      )}

      {showNotesModal && selectedProperty && (
        <NotesModal
          property={selectedProperty}
          onClose={handleCloseNotesModal}
        />
      )}
    </div>
  )
}