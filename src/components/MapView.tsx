'use client'

import { useEffect, useRef, useState } from 'react'
import { Property } from '@/types/property'
import { getStatusLabel } from '@/constants/statuses'
import { getPropertyAttachments } from '@/lib/attachments'

interface MapViewProps {
  properties: Property[]
  onPropertyClick?: (property: Property) => void
  onCoordinateUpdate?: (propertyId: string, coordinates: { latitude: number; longitude: number }) => Promise<void>
}

export default function MapView({ properties, onPropertyClick, onCoordinateUpdate }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null)
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null)
  const bicycleLayerRef = useRef<google.maps.BicyclingLayer | null>(null)
  const schoolMarkersRef = useRef<google.maps.Marker[]>([])
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const [isLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [hoveredPropertyHasAttachments, setHoveredPropertyHasAttachments] = useState(false)
  const [showIrrelevantProperties, setShowIrrelevantProperties] = useState(false)
  const [layers, setLayers] = useState({
    transit: false,
    traffic: false,
    bicycle: false,
    schools: false
  })
  const [zoomLevel, setZoomLevel] = useState<number>(10)
  const [isMobile, setIsMobile] = useState(false)
  const [isLayerDrawerOpen, setIsLayerDrawerOpen] = useState(false)
  const [draggingPropertyId, setDraggingPropertyId] = useState<string | null>(null)
  const newBadgeOverlaysRef = useRef<google.maps.OverlayView[]>([])
  const nameLabelOverlaysRef = useRef<google.maps.OverlayView[]>([])

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
          const filteredProperties = showIrrelevantProperties 
            ? properties 
            : properties.filter(p => p.status !== 'Irrelevant')
          const propertiesWithCoords = filteredProperties.filter(p => p.latitude && p.longitude)

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

          // Detect mobile
          setIsMobile(window.innerWidth < 768)
          const handleResize = () => setIsMobile(window.innerWidth < 768)
          window.addEventListener('resize', handleResize)

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

          // Track zoom level
          mapInstanceRef.current.addListener('zoom_changed', () => {
            if (mapInstanceRef.current) {
              setZoomLevel(mapInstanceRef.current.getZoom() || 10)
            }
          })
          setZoomLevel(mapInstanceRef.current.getZoom() || 10)

          // Initialize layers
          transitLayerRef.current = new google.maps.TransitLayer()
          trafficLayerRef.current = new google.maps.TrafficLayer()
          bicycleLayerRef.current = new google.maps.BicyclingLayer()

          // Initialize Places Service
          if (google.maps.places) {
            placesServiceRef.current = new google.maps.places.PlacesService(mapInstanceRef.current)
          }

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
  }, [properties, showIrrelevantProperties])

  useEffect(() => {
    if (!mapInstanceRef.current || isLoading) {
      return
    }

    // Clear existing markers, labels, and badges
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    newBadgeOverlaysRef.current.forEach(overlay => overlay.setMap(null))
    newBadgeOverlaysRef.current = []
    nameLabelOverlaysRef.current.forEach(overlay => overlay.setMap(null))
    nameLabelOverlaysRef.current = []

    // Add markers for properties with coordinates (filtered by toggle state)
    const filteredProperties = showIrrelevantProperties 
      ? properties 
      : properties.filter(p => p.status !== 'Irrelevant')
    const propertiesWithCoords = filteredProperties.filter(p => p.latitude && p.longitude)

    propertiesWithCoords.forEach(property => {
      if (!mapInstanceRef.current) return

      // Determine marker color based on property status
      const isIrrelevant = property.status === 'Irrelevant'
      const isInterested = property.status === 'Interested'
      const isVisited = property.status === 'Visited'
      let markerColor: string
      let textColor: string
      
      if (isIrrelevant) {
        markerColor = '#64748b'
        textColor = '#64748b'
      } else if (isInterested) {
        markerColor = '#ca8a04' // Dark yellow (yellow-600)
        textColor = '#713f12' // Yellow-900 for contrast
      } else if (isVisited) {
        markerColor = '#60a5fa' // Light blue (blue-400)
        textColor = '#1e40af' // Dark blue for contrast
      } else {
        markerColor = 'oklch(0.72 0.13 160.9)'
        textColor = 'oklch(0.72 0.13 160.9)'
      }

      // Check if property should show "new" badge - only for "Seen" (Just Added) or "Interested" (To contact) statuses
      const isJustAdded = property.status === 'Seen' || property.status === 'Interested'

      // Check if mobile directly to ensure accuracy
      const isMobileDevice = window.innerWidth < 768
      
      // Create marker icon - yellow pin for flagged properties
      const flaggedMarkerColor = '#f59e0b' // Amber/yellow color for flagged
      const flaggedTextColor = '#713f12' // Dark amber for text contrast
      const pinColor = property.is_flagged ? flaggedMarkerColor : markerColor
      const pinTextColor = property.is_flagged ? flaggedTextColor : textColor
      
      const markerIconSvg = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="${pinColor}"/>
          <circle cx="16" cy="16" r="8" fill="white"/>
          <text x="16" y="20" text-anchor="middle" fill="${pinTextColor}" font-family="Varela Round, sans-serif" font-size="12" font-weight="600">₪</text>
        </svg>
      `
      
      const marker = new google.maps.Marker({
        position: { lat: property.latitude!, lng: property.longitude! },
        map: mapInstanceRef.current,
        draggable: !isMobileDevice && !!onCoordinateUpdate, // Only draggable on desktop/web when callback is provided
        cursor: !isMobileDevice && !!onCoordinateUpdate ? 'grab' : 'pointer',
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerIconSvg)}`
        }
      })

      // Add hover listeners
      marker.addListener('mouseover', async (event: google.maps.MapMouseEvent) => {
        if (event.domEvent) {
          const mouseEvent = event.domEvent as MouseEvent
          setHoverPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
          setHoveredProperty(property)
          
          // Check if property has attachments
          try {
            const attachments = await getPropertyAttachments(property.id)
            setHoveredPropertyHasAttachments(attachments.length > 0)
          } catch (error) {
            console.error('Error checking attachments:', error)
            setHoveredPropertyHasAttachments(false)
          }
        }
      })

      marker.addListener('mouseout', () => {
        setHoveredProperty(null)
        setHoverPosition(null)
        setHoveredPropertyHasAttachments(false)
      })

      // Update marker icon on hover
      marker.addListener('mouseover', () => {
        const hoverPinColor = property.is_flagged ? flaggedMarkerColor : markerColor
        const hoverPinTextColor = property.is_flagged ? flaggedTextColor : textColor
        const hoverIconSvg = `
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 0C8.059 0 0 8.059 0 18c0 18 18 26 18 26s18-8 18-26c0-9.941-8.059-18-18-18z" fill="${hoverPinColor}"/>
            <circle cx="18" cy="18" r="10" fill="white"/>
            <text x="18" y="23" text-anchor="middle" fill="${hoverPinTextColor}" font-family="Varela Round, sans-serif" font-size="14" font-weight="700">₪</text>
          </svg>
        `
        marker.setIcon({
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(hoverIconSvg)}`
        })
      })

      marker.addListener('mouseout', () => {
        marker.setIcon({
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerIconSvg)}`
        })
      })

      // Add drag listeners for coordinate updates (desktop only)
      if (!isMobileDevice && onCoordinateUpdate) {
        marker.addListener('dragstart', () => {
          setDraggingPropertyId(property.id)
          // Hide hover card when dragging starts
          setHoveredProperty(null)
          setHoverPosition(null)
          // Change cursor to grabbing
          marker.setCursor('grabbing')
          // Slightly increase marker size during drag for visual feedback
          const dragPinColor = property.is_flagged ? flaggedMarkerColor : markerColor
          const dragPinTextColor = property.is_flagged ? flaggedTextColor : textColor
          const dragIconSvg = `
            <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8.059 0 0 8.059 0 18c0 18 18 26 18 26s18-8 18-26c0-9.941-8.059-18-18-18z" fill="${dragPinColor}"/>
              <circle cx="18" cy="18" r="10" fill="white"/>
              <text x="18" y="23" text-anchor="middle" fill="${dragPinTextColor}" font-family="Varela Round, sans-serif" font-size="14" font-weight="700">₪</text>
            </svg>
          `
          marker.setIcon({
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(dragIconSvg)}`
          })
        })

        marker.addListener('dragend', async (event: google.maps.MapMouseEvent) => {
          const newPosition = event.latLng
          if (newPosition && onCoordinateUpdate) {
            try {
              await onCoordinateUpdate(property.id, {
                latitude: newPosition.lat(),
                longitude: newPosition.lng()
              })
            } catch (error) {
              console.error('Error updating coordinates:', error)
              // Revert marker position on error
              marker.setPosition({ lat: property.latitude!, lng: property.longitude! })
            }
          }
          // Reset cursor and icon
          marker.setCursor('grab')
          marker.setIcon({
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24c0-8.837-7.163-16-16-16z" fill="${markerColor}"/>
                <circle cx="16" cy="16" r="8" fill="white"/>
                <text x="16" y="20" text-anchor="middle" fill="${textColor}" font-family="Varela Round, sans-serif" font-size="12" font-weight="600">₪</text>
              </svg>
            `)}`
          })
          setDraggingPropertyId(null)
        })
      }

      // Add click listener
      marker.addListener('click', () => {
        // Don't trigger click if we just finished dragging
        if (draggingPropertyId === property.id) {
          return
        }
        
        // Clear hover UI when selecting a marker
        setHoveredProperty(null)
        setHoverPosition(null)
        if (onPropertyClick) {
          onPropertyClick(property)
        }

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-slate-900 mb-1">${property.title}</h3>
              <div class="text-xs text-slate-500 mb-2">${property.address}</div>
              <div class="space-y-1 text-sm text-slate-600">
                <div class="flex justify-between">
                  <span>Rooms:</span>
                  <span class="font-medium">${property.rooms}</span>
                </div>
                <div class="flex justify-between">
                  <span>Size:</span>
                  <span class="font-medium">${property.square_meters !== null && property.square_meters !== 1 ? property.square_meters + 'm²' : property.square_meters === 1 ? 'Unknown' : 'Not set'}</span>
                </div>
                <div class="flex justify-between">
                  <span>Price:</span>
                  <span class="font-medium">${property.asked_price !== null && property.asked_price !== 1 ? '₪' + property.asked_price.toLocaleString() : property.asked_price === 1 ? 'Unknown' : 'Not set'}</span>
                </div>
                <div class="flex justify-between">
                  <span>Per m²:</span>
                  <span class="font-medium">${property.price_per_meter !== null && property.asked_price !== null && property.asked_price !== 1 && property.square_meters !== null && property.square_meters !== 1 ? '₪' + property.price_per_meter.toLocaleString() : 'N/A'}</span>
                </div>
                <div class="flex justify-between">
                  <span>Status:</span>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${property.status === 'Purchased' ? 'bg-green-100 text-green-800' :
                      property.status === 'Visited' ? 'bg-blue-100 text-blue-800' :
                      property.status === 'Interested' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}">${getStatusLabel(property.status)}</span>
                </div>
              </div>
            </div>
          `
        })

        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)

      // Add "new" badge overlay for just added properties
      if (isJustAdded) {
        class NewBadgeOverlay extends google.maps.OverlayView {
          private div: HTMLDivElement | null = null
          private property: Property

          constructor(property: Property) {
            super()
            this.property = property
          }

          onAdd() {
            const div = document.createElement('div')
            div.style.position = 'absolute'
            div.style.pointerEvents = 'none'
            div.style.zIndex = '1001'
            div.style.transform = 'translate(-50%, -100%)'
            
            div.innerHTML = `
              <div style="
                background: #ef4444;
                color: white;
                border-radius: 8px;
                padding: 2px 6px;
                font-size: 9px;
                font-weight: 700;
                font-family: 'Varela Round', sans-serif;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                border: 1.5px solid white;
                letter-spacing: 0.3px;
              ">NEW</div>
            `
            
            this.div = div
            const panes = this.getPanes()
            if (panes) {
              panes.overlayMouseTarget.appendChild(div)
            }
          }

          draw() {
            if (!this.div) return
            
            const projection = this.getProjection()
            if (!projection) return
            
            const position = projection.fromLatLngToDivPixel(
              new google.maps.LatLng(this.property.latitude!, this.property.longitude!)
            )
            
            if (position) {
              // Position badge to the top-right of the marker
              this.div.style.left = (position.x + 18) + 'px'
              this.div.style.top = (position.y - 40) + 'px'
            }
          }

          onRemove() {
            if (this.div && this.div.parentNode) {
              this.div.parentNode.removeChild(this.div)
            }
            this.div = null
          }
        }

        const newBadgeOverlay = new NewBadgeOverlay(property)
        newBadgeOverlay.setMap(mapInstanceRef.current)
        newBadgeOverlaysRef.current.push(newBadgeOverlay)
      }


      // Add property name label overlay under each marker
      class PropertyNameLabelOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null
        private property: Property

        constructor(property: Property) {
          super()
          this.property = property
        }

        onAdd() {
          const div = document.createElement('div')
          div.style.position = 'absolute'
          div.style.pointerEvents = 'none'
          div.style.zIndex = '1000'
          div.style.transform = 'translate(-50%, 0)'
          
          const labelBackground = property.is_flagged ? '#fef3c7' : 'white' // Light yellow for flagged
          const labelBorder = property.is_flagged ? '#fcd34d' : '#e2e8f0' // Amber border for flagged
          
          div.innerHTML = `
            <div style="
              background: ${labelBackground};
              color: #1e293b;
              border-radius: 6px;
              padding: 3px 8px;
              font-size: 10px;
              font-weight: 600;
              font-family: 'Varela Round', sans-serif;
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.15);
              border: 1px solid ${labelBorder};
              max-width: 150px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${property.title || property.address || 'Property'}</div>
          `
          
          this.div = div
          const panes = this.getPanes()
          if (panes) {
            panes.overlayMouseTarget.appendChild(div)
          }
        }

        draw() {
          if (!this.div) return
          
          const projection = this.getProjection()
          if (!projection) return
          
          const position = projection.fromLatLngToDivPixel(
            new google.maps.LatLng(this.property.latitude!, this.property.longitude!)
          )
          
          if (position) {
            // Position label below the marker (marker is 40px tall, anchor is at bottom)
            this.div.style.left = position.x + 'px'
            this.div.style.top = (position.y + 8) + 'px'
          }
        }

        onRemove() {
          if (this.div && this.div.parentNode) {
            this.div.parentNode.removeChild(this.div)
          }
          this.div = null
        }
      }

      const nameLabelOverlay = new PropertyNameLabelOverlay(property)
      nameLabelOverlay.setMap(mapInstanceRef.current)
      nameLabelOverlaysRef.current.push(nameLabelOverlay)
    })

    // Adjust map bounds if there are properties
    if (propertiesWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      propertiesWithCoords.forEach(property => {
        bounds.extend({ lat: property.latitude!, lng: property.longitude! })
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [properties, isLoading, onPropertyClick, showIrrelevantProperties])

  // Handle layer toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (layers.transit && transitLayerRef.current) {
      transitLayerRef.current.setMap(mapInstanceRef.current)
    } else if (transitLayerRef.current) {
      transitLayerRef.current.setMap(null)
    }

    if (layers.traffic && trafficLayerRef.current) {
      trafficLayerRef.current.setMap(mapInstanceRef.current)
    } else if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null)
    }

    if (layers.bicycle && bicycleLayerRef.current) {
      bicycleLayerRef.current.setMap(mapInstanceRef.current)
    } else if (bicycleLayerRef.current) {
      bicycleLayerRef.current.setMap(null)
    }

    // Handle schools layer
    if (layers.schools) {
      if (!placesServiceRef.current) return

      // Clear existing school markers
      schoolMarkersRef.current.forEach(marker => marker.setMap(null))
      schoolMarkersRef.current = []

      const map = mapInstanceRef.current
      const bounds = map.getBounds()
      
      if (!bounds) return

      // Use PlacesService to search for schools
      const request: google.maps.places.PlaceSearchRequest = {
        bounds: bounds,
        type: 'school',
        keyword: 'school'
      }

      placesServiceRef.current.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          results.forEach((place) => {
            if (place.geometry && place.geometry.location && mapInstanceRef.current) {
              const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: mapInstanceRef.current,
                title: place.name || 'School',
                icon: {
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 0C6.268 0 0 6.268 0 14c0 14 14 22 14 22s14-8 14-22c0-7.732-6.268-14-14-14z" fill="#3b82f6"/>
                      <path d="M14 8l-6 3v4h12v-4l-6-3zm-4 8v6h8v-6h-8z" fill="white"/>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(28, 36),
                  anchor: new google.maps.Point(14, 36)
                }
              })

              // Add info window with school name
              if (place.name) {
                const infoWindow = new google.maps.InfoWindow({
                  content: `<div class="p-2"><div class="font-semibold text-sm text-slate-900">${place.name}</div></div>`
                })

                marker.addListener('click', () => {
                  infoWindow.open(mapInstanceRef.current, marker)
                })
              }

              schoolMarkersRef.current.push(marker)
            }
          })
        }
      })
    } else {
      // Clear school markers
      schoolMarkersRef.current.forEach(marker => marker.setMap(null))
      schoolMarkersRef.current = []
    }
  }, [layers])

  // Reload schools when map bounds change (zoom/pan)
  useEffect(() => {
    if (!layers.schools || !mapInstanceRef.current || !placesServiceRef.current) return

    const map = mapInstanceRef.current
    const boundsChangedListener = map.addListener('bounds_changed', () => {
      // Debounce the search
      setTimeout(() => {
        if (!layers.schools || !placesServiceRef.current) return

        // Clear existing school markers
        schoolMarkersRef.current.forEach(marker => marker.setMap(null))
        schoolMarkersRef.current = []

        const bounds = map.getBounds()
        if (!bounds) return

        const request: google.maps.places.PlaceSearchRequest = {
          bounds: bounds,
          type: 'school',
          keyword: 'school'
        }

        placesServiceRef.current.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place) => {
              if (place.geometry && place.geometry.location && mapInstanceRef.current) {
                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map: mapInstanceRef.current,
                  title: place.name || 'School',
                  icon: {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 0C6.268 0 0 6.268 0 14c0 14 14 22 14 22s14-8 14-22c0-7.732-6.268-14-14-14z" fill="#3b82f6"/>
                        <path d="M14 8l-6 3v4h12v-4l-6-3zm-4 8v6h8v-6h-8z" fill="white"/>
                      </svg>
                    `)}`,
                    scaledSize: new google.maps.Size(28, 36),
                    anchor: new google.maps.Point(14, 36)
                  }
                })

                if (place.name) {
                  const infoWindow = new google.maps.InfoWindow({
                    content: `<div class="p-2"><div class="font-semibold text-sm text-slate-900">${place.name}</div></div>`
                  })

                  marker.addListener('click', () => {
                    infoWindow.open(mapInstanceRef.current, marker)
                  })
                }

                schoolMarkersRef.current.push(marker)
              }
            })
          }
        })
      }, 500)
    })

    return () => {
      google.maps.event.removeListener(boundsChangedListener)
    }
  }, [layers.schools])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
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
      <div className="h-full flex items-center justify-center bg-slate-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading map...</p>
        </div>
      </div>
    )
  }

  const filteredProperties = showIrrelevantProperties 
    ? properties 
    : properties.filter(p => p.status !== 'Irrelevant')
  const propertiesWithCoords = filteredProperties.filter(p => p.latitude && p.longitude)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'Seen': 'bg-slate-100 text-slate-700',
      'Interested': 'bg-emerald-100 text-emerald-800',
      'Contacted Realtor': 'bg-blue-50 text-blue-700',
      'Visited': 'bg-indigo-100 text-indigo-800',
      'On Hold': 'bg-orange-100 text-orange-700',
      'Irrelevant': 'bg-red-50 text-red-700',
      'Purchased': 'bg-emerald-50 text-emerald-700'
    }
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700'
  }

  const renderLayerButtons = () => (
    <div className="space-y-1">
      <button
        onClick={() => setLayers(prev => ({ ...prev, transit: !prev.transit }))}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
          layers.transit
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Transit</span>
        </div>
        {layers.transit && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <button
        onClick={() => setLayers(prev => ({ ...prev, traffic: !prev.traffic }))}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
          layers.traffic
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Traffic</span>
        </div>
        {layers.traffic && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <button
        onClick={() => setLayers(prev => ({ ...prev, bicycle: !prev.bicycle }))}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
          layers.bicycle
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="5.5" cy="17.5" r="3.5" strokeWidth="2" />
            <circle cx="18.5" cy="17.5" r="3.5" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.5 17.5l3-7.5m10.5 0l-3 7.5M8.5 10h7M12 10v7.5M9 4l3 1.5 3-1.5" />
          </svg>
          <span>Bike lanes</span>
        </div>
        {layers.bicycle && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <button
        onClick={() => setLayers(prev => ({ ...prev, schools: !prev.schools }))}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
          layers.schools
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v7m0-7l-6.16-3.422a12.083 12.083 0 00-.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 006.824-2.998 12.078 12.078 0 00-.665-6.479L12 14z" />
          </svg>
          <span>Schools</span>
        </div>
        {layers.schools && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  )

  return (
    <div className="h-full relative bg-white rounded-lg overflow-hidden shadow-sm">
      <div ref={mapRef} className={`w-full h-full ${isMobile ? 'touch-none' : ''}`} />

      {/* Floating Hover Card */}
      {hoveredProperty && hoverPosition && (() => {
        const cardWidth = 320 // w-80 = 320px
        const cardHeight = 400 // Approximate max height
        const padding = 15
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Calculate horizontal position
        let left = hoverPosition.x + padding
        let horizontalTransform = 'none'
        
        // If too close to right edge, flip to left side
        if (hoverPosition.x + padding + cardWidth > viewportWidth) {
          left = hoverPosition.x - padding
          horizontalTransform = 'translateX(-100%)'
        }
        
        // Ensure it doesn't go off the left edge
        if (left < 0) {
          left = padding
          horizontalTransform = 'none'
        }
        
        // Calculate vertical position
        let top = hoverPosition.y - 10
        
        // If tooltip would go below viewport, shift it up just enough to be visible
        if (top + cardHeight > viewportHeight) {
          top = viewportHeight - cardHeight - padding
        }
        
        // If tooltip would go above viewport, shift it down just enough to be visible
        if (top < 0) {
          top = padding
        }
        
        return (
          <div
            className="fixed z-40 pointer-events-none"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: horizontalTransform
            }}
          >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200/50 p-4 w-80 animate-fade-in relative">
            {/* Attachment Indicator - Top Right */}
            {hoveredPropertyHasAttachments && (
              <div className="absolute top-3 right-3 z-10">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-slate-900 leading-tight line-clamp-2">
                  {hoveredProperty.title}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={hoveredProperty.address}>
                  {hoveredProperty.address}
                </div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hoveredProperty.status)}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60"></div>
                    {getStatusLabel(hoveredProperty.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <div className="flex items-center space-x-1.5 mb-1">
                  <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  <span className="text-xs font-medium text-slate-600">Rooms</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  <span>{hoveredProperty.rooms}</span>
                </span>
              </div>

              <div className={`rounded-lg p-2.5 ${hoveredProperty.square_meters === null ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  <svg className={`w-3 h-3 ${hoveredProperty.square_meters === null ? 'text-amber-600' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4a1 1 0 011-1h4m11 12v4a1 1 0 01-1 1h-4M4 16v4a1 1 0 001 1h4m11-12V4a1 1 0 00-1-1h-4" />
                  </svg>
                  <span className={`text-xs font-medium ${hoveredProperty.square_meters === null ? 'text-amber-700' : 'text-slate-600'}`}>Size</span>
                </div>
                <span className={`text-sm font-semibold ${hoveredProperty.square_meters === null || hoveredProperty.square_meters === 1 ? 'text-amber-700' : 'text-slate-900'}`}>
                  {hoveredProperty.square_meters === null ? 'Not set' : hoveredProperty.square_meters === 1 ? 'Unknown' : (
                    <>
                      <span>{hoveredProperty.square_meters}</span> m²
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Price Section */}
            {hoveredProperty.asked_price !== null && hoveredProperty.asked_price !== 1 ? (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-slate-600">Asking Price</span>
                  <span className="text-lg font-bold text-slate-900">
                    <span>{formatPrice(hoveredProperty.asked_price)}</span>₪
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Price per m²</span>
                  <span className="font-semibold text-slate-700">
                    {hoveredProperty.price_per_meter !== null && hoveredProperty.asked_price !== null && hoveredProperty.asked_price !== 1 && hoveredProperty.square_meters !== null && hoveredProperty.square_meters !== 1 ? (
                      <span>{formatPrice(Math.round(hoveredProperty.price_per_meter))}₪</span>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-700">Price not set</span>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center space-x-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0a2 2 0 01-2 2H7a2 2 0 01-2-2m2-2v2a2 2 0 002 2h2a2 2 0 002-2v-2m-6 0h4" />
                  </svg>
                  <span>Type</span>
                </span>
                <span className="font-medium text-slate-700">{hoveredProperty.property_type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center space-x-1">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Source</span>
                </span>
                <span className="font-medium text-slate-700">{hoveredProperty.source}</span>
              </div>
              {hoveredProperty.apartment_broker && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center space-x-1">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Broker</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-primary">Yes</span>
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Arrow pointing to marker */}
            <div className="absolute -bottom-2 left-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        </div>
        )
      })()}

      {filteredProperties.length > 0 && propertiesWithCoords.length === 0 && (
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

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
        {isMobile ? (
          <>
            <button
              onClick={() => setIsLayerDrawerOpen(prev => !prev)}
              className="bg-white/95 backdrop-blur-sm shadow-lg border border-slate-200/50 px-3 py-2 rounded-full text-sm font-medium text-slate-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Layers</span>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isLayerDrawerOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLayerDrawerOpen && (
              <div className="w-72 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-slate-200/60 p-3 mt-2">
                <div className="text-xs font-semibold text-slate-600 mb-2 px-1">Layers</div>
                {renderLayerButtons()}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Show irrelevant</span>
                    <button
                      onClick={() => setShowIrrelevantProperties(!showIrrelevantProperties)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        showIrrelevantProperties ? 'bg-primary' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          showIrrelevantProperties ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Layer Toggle */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-2">
              <div className="text-xs font-semibold text-slate-600 mb-2 px-2">Layers</div>
              {renderLayerButtons()}
            </div>

            {/* Toggle Control for Irrelevant Properties */}
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-slate-700">Show irrelevant</span>
                <button
                  onClick={() => setShowIrrelevantProperties(!showIrrelevantProperties)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    showIrrelevantProperties ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      showIrrelevantProperties ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Property Count Display */}
      {propertiesWithCoords.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200/50 p-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-4 h-4 bg-primary rounded-full"></div>
            <span className="text-slate-600">
              {propertiesWithCoords.length} of {filteredProperties.length} properties shown
            </span>
            {!showIrrelevantProperties && properties.filter(p => p.status === 'Irrelevant').length > 0 && (
              <span className="text-xs text-slate-500 ml-2">
                ({properties.filter(p => p.status === 'Irrelevant').length} hidden)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}