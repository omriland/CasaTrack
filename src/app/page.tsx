'use client'

import { useState, useEffect } from 'react'
import { isAuthenticated, clearAuth } from '@/lib/auth'
import { getProperties, createProperty, updateProperty, deleteProperty, updatePropertyStatus } from '@/lib/properties'
import { Property, PropertyInsert } from '@/types/property'
import LoginForm from '@/components/LoginForm'
import PropertyForm from '@/components/PropertyForm'
import PropertyCard from '@/components/PropertyCard'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import KanbanBoard from '@/components/KanbanBoard'
import MapView from '@/components/MapView'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'map'>('cards')
  const [showIrrelevantProperties, setShowIrrelevantProperties] = useState(false)

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
      // Refresh data to ensure consistency
      await loadProperties()
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
      // Refresh data to ensure consistency
      await loadProperties()
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
      // Refresh data to ensure consistency
      await loadProperties()
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
    setShowPropertyDetail(true)
  }

  const handleClosePropertyDetail = () => {
    setShowPropertyDetail(false)
    setSelectedProperty(null)
  }

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: Property['status']) => {
    try {
      const updatedProperty = await updatePropertyStatus(propertyId, newStatus)
      setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p))
      // Update the selected property if it's the one being updated
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty)
      }
      // Refresh data to ensure consistency
      await loadProperties()
    } catch (error) {
      console.error('Error updating property status:', error)
      throw error
    }
  }

  const handlePropertyUpdate = async (updatedProperty: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
    // Update the selected property if it's the one being updated
    if (selectedProperty && selectedProperty.id === updatedProperty.id) {
      setSelectedProperty(updatedProperty)
    }
    // Refresh data to ensure consistency
    await loadProperties()
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  // Helper functions to separate properties by status
  const relevantProperties = properties.filter(property => property.status !== 'Irrelevant')
  const irrelevantProperties = properties.filter(property => property.status === 'Irrelevant')

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none">
                  <path d="M3 11L12 4L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 10.5V19a2 2 0 002 2h10a2 2 0 002-2v-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="10" y="14" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-slate-900">Casa</span>
                <span className="text-primary">Track</span>
              </h1>
              {properties.length > 0 && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ml-2">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              {properties.length > 0 && (
                <div className="flex bg-slate-100 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-4H5m14 8H5" />
                    </svg>
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'kanban'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <span className="hidden sm:inline">Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'map'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20.247l6-16.5 6 16.5-6-2.25-6 2.25z" />
                    </svg>
                    <span className="hidden sm:inline">Map</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Property</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 ${viewMode === 'kanban' || viewMode === 'map' ? 'max-w-full' : 'max-w-7xl'}`}>
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 21l4-4 4 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Welcome to CasaTrack</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Start your home purchasing journey by adding your first property. Track details, manage status, and organize your notes all in one place.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-4 rounded-2xl hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Property</span>
              </button>

              <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Track Details</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Manage Status</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Add Notes</p>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="animate-fade-in">
            {/* Main Properties Grid - Non-Irrelevant */}
            {relevantProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relevantProperties.map((property, index) => (
                  <div
                    key={property.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fade-in"
                  >
                    <PropertyCard
                      property={property}
                      onEdit={handleEditProperty}
                      onDelete={handleDeleteProperty}
                      onViewNotes={handleViewNotes}
                      onStatusUpdate={handleUpdatePropertyStatus}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Irrelevant Properties Collapsible Section */}
            {irrelevantProperties.length > 0 && (
              <div className="mt-12">
                <button
                  onClick={() => setShowIrrelevantProperties(!showIrrelevantProperties)}
                  className="flex items-center justify-between w-full max-w-md p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 mb-6"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900">Irrelevant Properties</h3>
                      <p className="text-sm text-slate-500">
                        {irrelevantProperties.length} {irrelevantProperties.length === 1 ? 'property' : 'properties'}
                      </p>
                    </div>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-slate-400 transition-transform ${showIrrelevantProperties ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Irrelevant Properties Grid */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  showIrrelevantProperties 
                    ? 'max-h-full opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {irrelevantProperties.map((property, index) => (
                      <div
                        key={property.id}
                        style={{ animationDelay: `${(relevantProperties.length + index) * 50}ms` }}
                        className="animate-fade-in"
                      >
                        <PropertyCard
                          property={property}
                          onEdit={handleEditProperty}
                          onDelete={handleDeleteProperty}
                          onViewNotes={handleViewNotes}
                          onStatusUpdate={handleUpdatePropertyStatus}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show message if no relevant properties */}
            {relevantProperties.length === 0 && irrelevantProperties.length > 0 && (
              <div className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Active Properties</h3>
                  <p className="text-slate-600">
                    All your properties are marked as irrelevant. Check the section below to view them.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="h-[calc(100vh-12rem)] animate-fade-in">
            <KanbanBoard
              properties={properties}
              onUpdateStatus={handleUpdatePropertyStatus}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onViewNotes={handleViewNotes}
            />
          </div>
        ) : (
          <div className="h-[calc(100vh-12rem)] animate-fade-in">
            <MapView
              properties={properties}
              onPropertyClick={handleViewNotes}
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

      {showPropertyDetail && selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={handleClosePropertyDetail}
          onEdit={handleEditProperty}
          onDelete={handleDeleteProperty}
          onStatusUpdate={handleUpdatePropertyStatus}
          onPropertyUpdate={handlePropertyUpdate}
          onDataRefresh={loadProperties}
        />
      )}
    </div>
  )
}