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
  const [error, setError] = useState<string | null>(null)
  const lastKnownValue = useRef(value || '')

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
                } catch (error) {
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
    }
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    lastKnownValue.current = newValue
    onChange(newValue)
  }

  const handleBlur = async () => {
    // When input loses focus, check if DOM value differs from our tracked value
    if (inputRef.current) {
      const domValue = inputRef.current.value
      if (domValue !== lastKnownValue.current) {
        console.log('📍 Syncing DOM value on blur:', domValue)
        lastKnownValue.current = domValue

        // Try to get coordinates for the address
        let coordinates: { lat: number; lng: number } | undefined

        if (domValue.trim()) {
          try {
            // Use OpenStreetMap Nominatim to get coordinates
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(domValue)}&countrycodes=IL&limit=1`
            const response = await fetch(nominatimUrl)
            const data = await response.json()

            if (data && data.length > 0) {
              coordinates = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              }
              console.log('📍 Got coordinates for synced address:', coordinates)
            }
          } catch (error) {
            console.log('📍 Could not get coordinates for synced address')
          }
        }

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
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}