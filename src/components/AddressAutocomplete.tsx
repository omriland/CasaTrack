'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onBlur?: () => void
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter property address",
  className = "",
  disabled = false,
  onBlur
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingCoordinates, setIsFetchingCoordinates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastKnownValue = useRef(value || '')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

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
            fields: ['formatted_address', 'geometry', 'place_id', 'name']
          })

          // Add place changed listener
          autocompleteRef.current.addListener('place_changed', async () => {
            const place = autocompleteRef.current?.getPlace()

            if (!place) return

            // Use the formatted_address from Google - this is the complete address
            const selectedAddress = place.formatted_address || place.name || ''

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

  // Function to fetch coordinates for an address
  const fetchCoordinatesForAddress = async (address: string): Promise<{ lat: number; lng: number } | undefined> => {
    if (!address.trim()) return undefined

    try {
      setIsFetchingCoordinates(true)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=IL&limit=1`
      const response = await fetch(nominatimUrl)
      const data = await response.json()

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
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

    // Immediately update the address (without coordinates)
    onChange(newValue)

    // Debounce coordinate fetching for manual typing (only if not empty)
    if (newValue.trim()) {
      debounceTimer.current = setTimeout(async () => {
        const coordinates = await fetchCoordinatesForAddress(newValue)
        if (coordinates && lastKnownValue.current === newValue) {
          // Only update if the address hasn't changed since we started fetching
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
    if (value !== lastKnownValue.current && inputRef.current) {
      inputRef.current.value = value || ''
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
        defaultValue={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={isLoading ? "Loading address autocomplete..." : placeholder}
        className={`${className} ${isLoading ? 'bg-slate-50' : ''}`}
        disabled={disabled || isLoading}
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