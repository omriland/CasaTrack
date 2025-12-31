import { Metadata } from 'next'
import { Suspense } from 'react'
import HomeContent from './page-content'

type Props = {
  searchParams: Promise<{ property?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const propertyId = params?.property

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '') || 'https://casatrack.app'
  const ogImageUrl = `${siteUrl}/og-image`

  if (!propertyId) {
    return {
      title: "CasaTrack - Property Management",
      description: "Track and manage your property search with CasaTrack",
      openGraph: {
        title: "CasaTrack - Property Management",
        description: "Track and manage your property search with CasaTrack",
        type: "website",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: "CasaTrack",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "CasaTrack - Property Management",
        description: "Track and manage your property search with CasaTrack",
        images: [ogImageUrl],
      },
    }
  }

  // Fetch property for metadata
  try {
    const { getProperty } = await import('@/lib/properties')
    const property = await getProperty(propertyId)

    if (property) {
      const title = property.title
      const description = `${property.address} • ${property.rooms} rooms`
      const url = `${siteUrl}?property=${propertyId}`

      return {
        title: `${title} - CasaTrack`,
        description,
        openGraph: {
          title,
          description,
          type: "website",
          url,
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [ogImageUrl],
        },
      }
    }
  } catch (error) {
    console.error('Error loading property for metadata:', error)
  }

  // Fallback to default
  return {
    title: "CasaTrack - Property Management",
    description: "Track and manage your property search with CasaTrack",
  }
}

export default async function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
