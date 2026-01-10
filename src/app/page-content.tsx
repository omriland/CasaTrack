'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { isAuthenticated, clearAuth } from '@/lib/auth'
import { getProperties, createProperty, updateProperty, deleteProperty, updatePropertyStatus, updatePropertyRating, togglePropertyFlag } from '@/lib/properties'
import { Property, PropertyInsert } from '@/types/property'
import LoginForm from '@/components/LoginForm'
import PropertyForm from '@/components/PropertyForm'
import PropertyCard from '@/components/PropertyCard'
import PropertyDetailModal from '@/components/PropertyDetailModal'
import KanbanBoard from '@/components/KanbanBoard'
import MapView from '@/components/MapView'
export default function HomeContent() {
  const searchParams = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'map'>('cards')
  const [showIrrelevantProperties, setShowIrrelevantProperties] = useState(false)
  const [notesRefreshKey, setNotesRefreshKey] = useState(0)
  const [notesBump, setNotesBump] = useState<null | { id: string; delta: number; nonce: number }>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const detectMobile = () => setIsMobile(window.innerWidth < 768)
    detectMobile()
    window.addEventListener('resize', detectMobile)

    return () => window.removeEventListener('resize', detectMobile)
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(isAuthenticated())
      setLoading(false)
    }

    checkAuth()

    // Check for property ID in URL
    const propertyId = searchParams?.get('property')
    if (propertyId) {
      setPendingPropertyId(propertyId)
    }
  }, [searchParams])

  const loadProperties = useCallback(async () => {
    try {
      const data = await getProperties()
      setProperties(data)
      return data
    } catch (error) {
      console.error('Error loading properties:', error)
      return []
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      loadProperties()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn && pendingPropertyId && properties.length > 0) {
      // After properties are loaded, check if we need to open a property modal
      const property = properties.find(p => p.id === pendingPropertyId)
      if (property) {
        setSelectedProperty(property)
        setShowPropertyDetail(true)
      }
      setPendingPropertyId(null)
      // Clean up URL
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [isLoggedIn, pendingPropertyId, properties])

  const handleNotesChanged = () => {
    setNotesRefreshKey((k) => k + 1)
  }

  const handleNotesDelta = (propertyId: string, delta: number) => {
    setNotesBump({ id: propertyId, delta, nonce: Date.now() })
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    // If there's a pending property ID, it will be handled in the useEffect above
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

  const handleCoordinateUpdate = async (propertyId: string, coordinates: { latitude: number; longitude: number }) => {
    try {
      const updatedProperty = await updateProperty(propertyId, coordinates)
      setProperties(prev => prev.map(p => p.id === updatedProperty.id ? updatedProperty : p))
      // Optionally refresh to ensure consistency
      await loadProperties()
    } catch (error) {
      console.error('Error updating coordinates:', error)
      throw error // Re-throw so MapView can handle the error (revert marker position)
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

  const handleRatingUpdate = async (propertyId: string, rating: number) => {
    try {
      const updatedProperty = await updatePropertyRating(propertyId, rating)
      setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p))
      // Update the selected property if it's the one being updated
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty)
      }
    } catch (error) {
      console.error('Error updating rating:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if it's a column doesn't exist error
      if (errorMessage.includes('column') && errorMessage.includes('rating')) {
        alert('Rating column not found. Please run the SQL migration: add-rating-field.sql')
      } else {
        alert(`Error updating rating: ${errorMessage}`)
      }
    }
  }

  const handleFlagToggle = async (propertyId: string, isFlagged: boolean) => {
    try {
      const updatedProperty = await togglePropertyFlag(propertyId, isFlagged)
      setProperties(prev => prev.map(p => p.id === propertyId ? updatedProperty : p))
      // Update the selected property if it's the one being updated
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty(updatedProperty)
      }
    } catch (error) {
      console.error('Error toggling flag:', error)
      alert('Error updating flag. Please try again.')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProperty(null)
  }

  // Helper functions to separate properties by status
  const relevantProperties = properties
    .filter(property => property.status !== 'Irrelevant')
    .sort((a, b) => {
      // Sort "Interested" (To contact) status first
      if (a.status === 'Interested' && b.status !== 'Interested') return -1
      if (b.status === 'Interested' && a.status !== 'Interested') return 1
      // For other properties, maintain original order (by created_at desc)
      return 0
    })
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
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Top Header - Light Minimalism */}
      <header className="sticky top-0 z-50 bg-white border-b border-[rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-[61px] md:h-14">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <div className="flex items-baseline space-x-0.5">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  <span className="text-black">Casa</span>
                  <span className="text-black/40">Track</span>
                </h1>
              </div>
            </div>

            {/* Center - View Toggle */}
            {properties.length > 0 && (
              <div className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="flex bg-gray-50 rounded-xl p-1 gap-1 border border-[rgba(0,0,0,0.06)]">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === 'cards'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-black/40 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                    </svg>
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === 'kanban'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-black/40 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <rect x="3" y="3" width="6" height="6" rx="1.5" />
                      <rect x="3" y="13" width="6" height="6" rx="1.5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 6h6M13 10h6M13 16h6M13 20h6" />
                    </svg>
                    <span>Kanban</span>
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                      viewMode === 'map'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-black/40 hover:text-black hover:bg-black/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Map</span>
                  </button>
                </div>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
              {/* Add Property Button - Minimalist black circle */}
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-black hover:bg-black/80 text-white transition-all duration-200 active:scale-90"
                title="Add Property"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Desktop Actions - Logout */}
              <div className="hidden md:flex items-center">
                <button
                  onClick={handleLogout}
                  className="p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-full transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Light Minimalism */}
      {properties.length > 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[rgba(0,0,0,0.06)] bg-white/80 backdrop-blur-xl">
          <div className="relative px-4 pb-safe pb-4 pt-3">
            <div className="flex items-center justify-around max-w-md mx-auto">
              {/* Cards View */}
              <button
                onClick={() => setViewMode('cards')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 transition-all duration-300 min-w-[70px] ${
                  viewMode === 'cards'
                    ? 'text-black'
                    : 'text-black/30 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'cards' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'cards' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14-4H5m14 8H5" />
                  </svg>
                </div>
                <span className={`text-[10px] font-extrabold transition-all duration-300 ${viewMode === 'cards' ? 'opacity-100' : 'opacity-70'}`}>
                  Cards
                </span>
              </button>

              {/* Kanban View */}
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 transition-all duration-300 min-w-[70px] ${
                  viewMode === 'kanban'
                    ? 'text-black'
                    : 'text-black/30 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'kanban' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'kanban' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <span className={`text-[10px] font-extrabold transition-all duration-300 ${viewMode === 'kanban' ? 'opacity-100' : 'opacity-70'}`}>
                  Kanban
                </span>
              </button>

              {/* Map View */}
              <button
                onClick={() => setViewMode('map')}
                className={`flex flex-col items-center justify-center space-y-1 px-4 py-2 transition-all duration-300 min-w-[70px] ${
                  viewMode === 'map'
                    ? 'text-black'
                    : 'text-black/30 active:scale-95'
                }`}
              >
                <div className={`relative transition-all duration-300 ${viewMode === 'map' ? 'scale-110' : ''}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={viewMode === 'map' ? 2.5 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className={`text-[10px] font-extrabold transition-all duration-300 ${viewMode === 'map' ? 'opacity-100' : 'opacity-70'}`}>
                  Map
                </span>
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className={`mx-auto px-6 sm:px-8 lg:px-10 py-10 md:py-12 pb-24 md:pb-8 ${viewMode === 'kanban' || viewMode === 'map' ? 'max-w-full' : 'max-w-7xl'}`}>
        {properties.length === 0 ? (
          <div className="text-center py-24 animate-fade-in-up">
            <div className="max-w-lg mx-auto">
              <div className="w-32 h-32 bg-gray-50 rounded-[32px] border border-[rgba(0,0,0,0.06)] flex items-center justify-center mx-auto mb-10">
                <svg className="w-16 h-16 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 21l4-4 4 4" />
                </svg>
              </div>
              <h3 className="text-4xl font-extrabold text-black mb-6">Welcome to CasaTrack</h3>
              <p className="text-black/50 mb-12 leading-relaxed text-lg font-medium">
                Start your home purchasing journey by adding your first property. Track details, manage status, and organize your notes all in one place.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center space-x-3 bg-black text-white px-12 py-5 rounded-2xl hover:bg-black/80 transition-all duration-200 font-extrabold text-lg active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Property</span>
              </button>

              <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl border border-[rgba(0,0,0,0.06)] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-extrabold text-black/40 uppercase tracking-wider">Track Details</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl border border-[rgba(0,0,0,0.06)] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-extrabold text-black/40 uppercase tracking-wider">Manage Status</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl border border-[rgba(0,0,0,0.06)] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-extrabold text-black/40 uppercase tracking-wider">Add Notes</p>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="animate-fade-in">
            {/* Properties Header - Mobile */}
            {relevantProperties.length > 0 && (
              <h2 className="text-gray-900 font-medium text-base md:hidden mb-4">
                <span>{relevantProperties.length}</span> {relevantProperties.length === 1 ? 'PROPERTY' : 'PROPERTIES'}
              </h2>
            )}
            
            {/* Main Properties Grid - Non-Irrelevant */}
            {relevantProperties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10.2px] md:gap-[27.2px]">
                {relevantProperties.map((property, index) => (
                  <div
                    key={property.id}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="animate-fade-in"
                  >
                    <PropertyCard
                      property={property}
                      onDelete={handleDeleteProperty}
                      onViewNotes={handleViewNotes}
                      onStatusUpdate={handleUpdatePropertyStatus}
                      onFlagToggle={handleFlagToggle}
                      notesRefreshKey={notesRefreshKey}
                      notesBump={notesBump}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Irrelevant Properties Collapsible Section */}
            {irrelevantProperties.length > 0 && (
              <div className="mt-8 md:mt-12">
                <button
                  onClick={() => setShowIrrelevantProperties(!showIrrelevantProperties)}
                  className="flex items-center justify-between w-full md:max-w-md p-4 bg-gray-50 border border-[rgba(0,0,0,0.06)] rounded-2xl transition-all mb-4 md:mb-6 active:scale-[0.98]"
                >
                  <div className="flex items-center space-x-3">
                    <h3 className="text-black/40 font-extrabold text-sm uppercase tracking-wider">Irrelevant Properties</h3>
                    <span className="bg-black/5 text-black/40 px-2 py-0.5 rounded-lg text-xs font-extrabold">{irrelevantProperties.length}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-black/20 transition-transform duration-300 ${showIrrelevantProperties ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Irrelevant Properties Grid */}
                <div className={`transition-all duration-300 overflow-hidden ${
                  showIrrelevantProperties 
                    ? 'max-h-full opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10.2px] md:gap-[20.4px]">
                    {irrelevantProperties.map((property, index) => (
                      <div
                        key={property.id}
                        style={{ animationDelay: `${(relevantProperties.length + index) * 50}ms` }}
                        className="animate-fade-in"
                      >
                        <PropertyCard
                          property={property}
                          onDelete={handleDeleteProperty}
                          onViewNotes={handleViewNotes}
                          onStatusUpdate={handleUpdatePropertyStatus}
                          onRatingUpdate={handleRatingUpdate}
                          onFlagToggle={handleFlagToggle}
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
          <div
            className={`animate-fade-in ${
              isMobile
                ? 'h-[calc(100vh-6.5rem)] -mx-4 sm:-mx-6 lg:-mx-8'
                : 'h-[calc(100vh-12rem)]'
            }`}
          >
            <MapView
              properties={properties}
              onPropertyClick={handleViewNotes}
              onCoordinateUpdate={handleCoordinateUpdate}
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
          onRatingUpdate={handleRatingUpdate}
          onFlagToggle={handleFlagToggle}
          onDataRefresh={loadProperties}
          onNotesChanged={handleNotesChanged}
          onNotesDelta={handleNotesDelta}
        />
      )}
    </div>
  )
}