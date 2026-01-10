'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getProperty } from '@/lib/properties'

export default function PropertyMetaTags() {
  const searchParams = useSearchParams()
  const propertyId = searchParams?.get('property')

  useEffect(() => {
    if (!propertyId) {
      // Reset to default meta tags
      updateMetaTag('og:title', 'CasaTrack - Property Management')
      updateMetaTag('og:description', 'Track and manage your property search with CasaTrack')
      updateMetaTag('og:type', 'website')
      updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : '')
      updateMetaTag('description', 'Track and manage your property search with CasaTrack')
      return
    }

    // Fetch property and update meta tags
    getProperty(propertyId)
      .then((property) => {
        if (property) {
          const title = property.title
          const description = `${property.address} • ${property.rooms} rooms`
          const url = typeof window !== 'undefined' 
            ? window.location.href
            : ''

          // Update Open Graph tags
          updateMetaTag('og:title', title)
          updateMetaTag('og:description', description)
          updateMetaTag('og:type', 'website')
          updateMetaTag('og:url', url)

          // Update Twitter Card tags
          updateMetaTag('twitter:card', 'summary')
          updateMetaTag('twitter:title', title)
          updateMetaTag('twitter:description', description)

          // Update standard meta tags
          updateMetaTag('description', description)
          
          // Update page title
          if (typeof document !== 'undefined') {
            document.title = `${title} - CasaTrack`
          }
        }
      })
      .catch((error) => {
        console.error('Error loading property for meta tags:', error)
      })
  }, [propertyId])

  return null
}

function updateMetaTag(property: string, content: string) {
  if (typeof document === 'undefined') return

  // Update or create og: tags
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)

  // Also update name-based tags (for Twitter and standard meta)
  if (property.startsWith('twitter:')) {
    const name = property
    let nameElement = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
    if (!nameElement) {
      nameElement = document.createElement('meta')
      nameElement.setAttribute('name', name)
      document.head.appendChild(nameElement)
    }
    nameElement.setAttribute('content', content)
  } else if (property === 'description') {
    let nameElement = document.querySelector(`meta[name="description"]`) as HTMLMetaElement
    if (!nameElement) {
      nameElement = document.createElement('meta')
      nameElement.setAttribute('name', 'description')
      document.head.appendChild(nameElement)
    }
    nameElement.setAttribute('content', content)
  }
}

