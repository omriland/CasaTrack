'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onBlur?: () => void
  tabIndex?: number
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter property address",
  className = "",
  disabled = false,
  onBlur,
  tabIndex
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingCoordinates, setIsFetchingCoordinates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKnownValue = useRef(value || '')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const fetchedForValueRef = useRef<string>('')

  useEffect(() => {
    const initializeAutocomplete = () => {
      try {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          setError('Google Maps API key not configured')
          setIsLoading(false)
          return
        }

        if (inputRef.current && !autocompleteRef.current && typeof google !== 'undefined' && google.maps) {
          // Initialize autocomplete with explicit geometry field request
          autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'IL' },
            fields: ['formatted_address', 'geometry', 'place_id', 'name', 'address_components']
          })

          // Add place changed listener
          autocompleteRef.current.addListener('place_changed', async () => {
            console.log('Google place_changed event fired')
            const place = autocompleteRef.current?.getPlace()

            if (!place) {
              console.log('No place returned from getPlace()')
              return
            }

            // Use the formatted_address from Google - this is the complete address
            const selectedAddress = place.formatted_address || place.name || ''
            console.log('Selected address:', selectedAddress)

            if (selectedAddress) {
              let coordinates: { lat: number; lng: number } | undefined

              // Try to get coordinates from place geometry first
              if (place.geometry?.location) {
                coordinates = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              } else {
                // Fallback: Use OpenStreetMap Nominatim (free, reliable)
                try {
                  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedAddress)}&countrycodes=IL&limit=1`
                  const response = await fetch(nominatimUrl)
                  const data = await response.json()

                  if (data && data.length > 0) {
                    coordinates = {
                      lat: parseFloat(data[0].lat),
                      lng: parseFloat(data[0].lon)
                    }
                  }
                } catch {
                  // Silently fail - coordinates will be undefined
                }
              }

              // Store the value and notify parent
              lastKnownValue.current = selectedAddress
              if (inputRef.current && inputRef.current.value !== selectedAddress) {
                inputRef.current.value = selectedAddress
              }
              console.log('Calling onChange with coordinates:', coordinates)
              onChange(selectedAddress, coordinates)
            }
          })

          setIsLoading(false)
          setError(null)
        }
      } catch (err) {
        console.error('Error initializing Google Maps:', err)
        setError('Failed to load address autocomplete')
        setIsLoading(false)
      }
    }

    if (typeof google !== 'undefined' && google.maps) {
      initializeAutocomplete()
    } else {
      // Wait for Google Maps to load
      const handleGoogleMapsLoad = () => {
        initializeAutocomplete()
      }

      if ((window as typeof window & { googleMapsLoaded?: boolean }).googleMapsLoaded) {
        initializeAutocomplete()
      } else {
        window.addEventListener('google-maps-loaded', handleGoogleMapsLoad)
        return () => {
          window.removeEventListener('google-maps-loaded', handleGoogleMapsLoad)
        }
      }
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [onChange])

  // Google Places fallback using findPlaceFromQuery (more tolerant than Geocoder)
  const findWithGooglePlaces = async (query: string): Promise<{ lat: number; lng: number } | undefined> => {
    if (typeof google === 'undefined' || !google.maps?.places) return undefined
    try {
      // Create a dummy container for PlacesService
      const container = document.createElement('div')
      const service = new google.maps.places.PlacesService(container)
      // Bias to Israel bounds roughly
      const israelBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(29.0, 34.2),
        new google.maps.LatLng(33.5, 35.9)
      )
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query,
        fields: ['geometry'],
        locationBias: israelBounds
      }
      return await new Promise((resolve) => {
        service.findPlaceFromQuery(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const loc = results[0].geometry?.location
            if (loc) {
              resolve({ lat: loc.lat(), lng: loc.lng() })
              return
            }
          }
          resolve(undefined)
        })
      })
    } catch {
      return undefined
    }
  }

  // Function to fetch coordinates for an address
  const fetchCoordinatesForAddress = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    if (!address.trim()) return undefined

    try {
      setIsFetchingCoordinates(true)
      // Normalize address and try OpenStreetMap (Nominatim) first to avoid Google ZERO_RESULTS console noise
      const normalized = address.includes('ישראל') || address.includes('Israel')
        ? address
        : `${address}, ישראל`
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(normalized)}&countrycodes=IL&limit=1`
      const response = await fetch(nominatimUrl)
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }

      // Fallback to Google Places (findPlaceFromQuery) with Israel bounds
      const placesCoords = await findWithGooglePlaces(normalized)
      if (placesCoords) return placesCoords

      // Final fallback to Google Geocoder if available
      if (typeof google !== 'undefined' && google.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder()
        const geocode = await geocoder.geocode({ address: normalized })
        const first = geocode.results?.[0]
        if (first?.geometry?.location) {
          return {
            lat: first.geometry.location.lat(),
            lng: first.geometry.location.lng()
          }
        }
      }
    } catch (error) {
      console.error('Error fetching coordinates:', error)
    } finally {
      setIsFetchingCoordinates(false)
    }

    return undefined
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    lastKnownValue.current = newValue
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // If cleared, propagate clear to parent (address + no coordinates)
    if (!newValue.trim()) {
      onChange('')
      return
    }

    // Update parent with address only (no coordinates yet)
    onChange(newValue)
    
    // Debounce coordinate fetching for manual typing
    if (newValue.trim()) {
      debounceTimer.current = setTimeout(async () => {
        const coordinates = await fetchCoordinatesForAddress(newValue)
        if (coordinates && lastKnownValue.current === newValue) {
          // Update parent with coordinates when found
          onChange(newValue, coordinates)
        }
      }, 1000) // 1 second delay
    }
  }

  const handleBlur = async () => {
    // Clear any pending debounced coordinate fetch
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }

    // When input loses focus, check if DOM value differs from our tracked value
    if (inputRef.current) {
      const domValue = inputRef.current.value
      if (domValue !== lastKnownValue.current) {
        lastKnownValue.current = domValue

        // Try to get coordinates for the address
        const coordinates = await fetchCoordinatesForAddress(domValue)
        onChange(domValue, coordinates)
      }
    }
    onBlur?.()
  }

  // Only sync from prop to input when prop changes (for editing mode)
  useEffect(() => {
    if (value !== lastKnownValue.current) {
      lastKnownValue.current = value || ''
    }
  }, [value])

  if (error) {
    // Fallback to regular input if Google Maps fails to load
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          tabIndex={tabIndex}
        />
        <p className="text-xs text-amber-600 mt-1">
          Address autocomplete unavailable - using manual input
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          // Don't call parent onChange for every keystroke, let autocomplete handle it
          handleInputChange(e)
        }}
        onBlur={handleBlur}
        placeholder={isLoading ? "Loading address autocomplete..." : placeholder}
        className={`${className} ${isLoading ? 'bg-slate-50' : ''}`}
        disabled={disabled || isLoading}
        tabIndex={tabIndex}
      />
      {(isLoading || isFetchingCoordinates) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          {isFetchingCoordinates && (
            <div className="text-xs text-slate-500 whitespace-nowrap">
              Getting location...
            </div>
          )}
        </div>
      )}
    </div>
  )
}