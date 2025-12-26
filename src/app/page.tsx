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
  const [notesRefreshKey, setNotesRefreshKey] = useState(0)
  const [notesBump, setNotesBump] = useState<null | { id: string; delta: number; nonce: number }>(null)

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

  const handleNotesChanged = () => {
    setNotesRefreshKey((k) => k + 1)
  }

  const handleNotesDelta = (propertyId: string, delta: number) => {
    setNotesBump({ id: propertyId, delta, nonce: Date.now() })
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
    // If detail modal is open, close it before opening the edit form
    setShowPropertyDetail(false)
    setSelectedProperty(null)
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
  const relevantPropertiesCount = relevantProperties.length

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-20 md:pb-8">
      {/* Top Header - Minimal on mobile, full on desktop */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-sm shadow-primary/20">
                <svg className="w-5 h-5 md:w-5.5 md:h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="flex items-baseline space-x-0.5">
                <h1 className="text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}>
                  <span className="text-slate-900">Casa</span>
                  <span className="text-primary">Track</span>
                </h1>
              </div>
              {relevantPropertiesCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ml-2.5">
                  {relevantPropertiesCount}
                </span>
              )}
            </div>

            {/* Desktop Actions - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-3">
              {/* View Toggle */}
              {properties.length > 0 && (
                <div className="flex bg-slate-50/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/60 shadow-sm">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-4H5m14 8H5" />
                    </svg>
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'kanban'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'map'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Map</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/90 text-white px-5 py-2.5 rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all duration-200 font-medium shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Property</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Mobile Menu Button - Only show logout on mobile */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Apple Style */}
      {properties.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 supports-[backdrop-filter]:bg-white/70" />
          
          {/* Safe area padding for iOS */}
          <div className="relative px-4 pb-safe pb-4 pt-3">
            <div className="flex items-center justify-around max-w-md mx-auto">
              {/* Cards View */}
              <button
                onClick={() => setViewMode('cards')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[70px] ${
                  viewMode === 'cards'
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-slate-500 hover:text-slate-700 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'cards' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'cards' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14-4H5m14 8H5" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold transition-all duration-300 ${viewMode === 'cards' ? 'opacity-100' : 'opacity-70'}`}>
                  Cards
                </span>
              </button>

              {/* Kanban View */}
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[70px] ${
                  viewMode === 'kanban'
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-slate-500 hover:text-slate-700 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'kanban' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'kanban' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold transition-all duration-300 ${viewMode === 'kanban' ? 'opacity-100' : 'opacity-70'}`}>
                  Kanban
                </span>
              </button>

              {/* Map View */}
              <button
                onClick={() => setViewMode('map')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[70px] ${
                  viewMode === 'map'
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-slate-500 hover:text-slate-700 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'map' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'map' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className={`text-[10px] font-semibold transition-all duration-300 ${viewMode === 'map' ? 'opacity-100' : 'opacity-70'}`}>
                  Map
                </span>
              </button>

              {/* Add Property Button - Prominent */}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/90 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Add Button - Show when no properties */}
      {properties.length === 0 && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/90 text-white shadow-xl shadow-primary/40 hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-8 ${viewMode === 'kanban' || viewMode === 'map' ? 'max-w-full' : 'max-w-7xl'}`}>
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
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-4 rounded-lg hover:from-primary/90 hover:to-primary/80 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Property</span>
              </button>

              <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Track Details</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-700">Manage Status</p>
                </div>
                <div>
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
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
                      notesRefreshKey={notesRefreshKey}
                      notesBump={notesBump}
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
                  className="flex items-center justify-between w-full max-w-md p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 mb-6"
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
                          notesRefreshKey={notesRefreshKey}
                          notesBump={notesBump}
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
                  <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
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
              notesRefreshKey={notesRefreshKey}
              notesBump={notesBump}
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
          onNotesChanged={handleNotesChanged}
          onNotesDelta={handleNotesDelta}
        />
      )}
    </div>
  )
}