'use client'

import { useEffect, useRef, useState } from 'react'
import { Property } from '@/types/property'

interface MapViewProps {
  properties: Property[]
  onPropertyClick?: (property: Property) => void
}

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [isLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeMap = () => {
      try {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          setError('Google Maps API key not configured')
          return
        }

        if (!mapRef.current) {
          return
        }

        if (typeof google === 'undefined' || !google.maps) {
          return
        }

        if (mapInstanceRef.current) {
          return
        }

        if (mapRef.current && !mapInstanceRef.current && typeof google !== 'undefined' && google.maps) {
          // Default center to Tel Aviv if no properties with coordinates
          const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude)

          const defaultCenter = { lat: 32.0853, lng: 34.7818 } // Tel Aviv

          let center = defaultCenter
          let zoom = 10

          if (propertiesWithCoords.length > 0) {
            // Calculate center based on properties
            const avgLat = propertiesWithCoords.reduce((sum, p) => sum + p.latitude!, 0) / propertiesWithCoords.length
            const avgLng = propertiesWithCoords.reduce((sum, p) => sum + p.longitude!, 0) / propertiesWithCoords.length
            center = { lat: avgLat, lng: avgLng }
            zoom = propertiesWithCoords.length === 1 ? 16 : 12
          }

          // Initialize map
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          })

          setError(null)
        }
      } catch {
        setError('Failed to load map')
      }
    }

    if (typeof google !== 'undefined' && google.maps) {
      initializeMap()
    } else {
      // Wait for Google Maps to load
      const handleGoogleMapsLoad = () => {
        initializeMap()
      }

      if ((window as typeof window & { googleMapsLoaded?: boolean }).googleMapsLoaded) {
        initializeMap()
      } else {
        window.addEventListener('google-maps-loaded', handleGoogleMapsLoad)

        // Fallback: try to initialize after 5 seconds if Google Maps still not loaded
        const fallbackTimeout = setTimeout(() => {
          if (typeof google !== 'undefined' && google.maps) {
            initializeMap()
          } else {
            setError('Google Maps failed to load')
          }
        }, 5000)

        return () => {
          window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad)
          clearTimeout(fallbackTimeout)
        }
      }
    }
  }, [properties])

  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) {
      return
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add markers for properties with coordinates
    const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude)

    propertiesWithCoords.forEach(property => {
      if (!mapInstanceRef.current) return

      const marker = new google.maps.Marker({
        position: { lat: property.latitude!, lng: property.longitude! },
        map: mapInstanceRef.current,
        title: property.address,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="#2563eb"/>
              <circle cx="16" cy="16" r="8" fill="white"/>
              <text x="16" y="20" text-anchor="middle" fill="#2563eb" font-family="Inter, sans-serif" font-size="12" font-weight="600">₪</text>
            </svg>
          `)}`
        }
      })

      // Add click listener
      marker.addListener('click', () => {
        if (onPropertyClick) {
          onPropertyClick(property)
        }

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-slate-900 mb-2">${property.address}</h3>
              <div class="space-y-1 text-sm text-slate-600">
                <div class="flex justify-between">
                  <span>Rooms:</span>
                  <span class="font-medium">${property.rooms}</span>
                </div>
                <div class="flex justify-between">
                  <span>Size:</span>
                  <span class="font-medium">${property.square_meters}m²</span>
                </div>
                <div class="flex justify-between">
                  <span>Price:</span>
                  <span class="font-medium">₪${property.asked_price.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Per m²:</span>
                  <span class="font-medium">₪${property.price_per_meter.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                  <span>Status:</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${property.status === 'Purchased' ? 'bg-green-100 text-green-800' :
                      property.status === 'Visited' ? 'bg-blue-100 text-blue-800' :
                      property.status === 'Interested' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}">${property.status}</span>
                </div>
              </div>
            </div>
          `
        })

        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Adjust map bounds if there are properties
    if (propertiesWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      propertiesWithCoords.forEach(property => {
        bounds.extend({ lat: property.latitude!, lng: property.longitude! })
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [properties, isLoading, onPropertyClick])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Map Unavailable</h3>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    )
  }

  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude)

  return (
    <div className="h-full relative bg-white rounded-xl overflow-hidden shadow-sm">
      <div ref={mapRef} className="w-full h-full" />

      {properties.length > 0 && propertiesWithCoords.length === 0 && (
        <div className="absolute inset-x-0 top-4 mx-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-amber-800">
                <span className="font-medium">No coordinates available</span> - Edit properties to add addresses with location data
              </p>
            </div>
          </div>
        </div>
      )}

      {propertiesWithCoords.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 border border-slate-200">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>{propertiesWithCoords.length} of {properties.length} properties shown</span>
          </div>
        </div>
      )}
    </div>
  )
}