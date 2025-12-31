export type PropertyStatus = 'Seen' | 'Interested' | 'Contacted Realtor' | 'Visited' | 'On Hold' | 'Irrelevant' | 'Purchased'

export type PropertySource = 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'

export type PropertyType = 'New' | 'Existing apartment'

export interface Property {
  id: string
  title: string
  address: string
  rooms: number
  square_meters: number | null
  asked_price: number | null
  price_per_meter: number | null
  contact_name: string | null
  contact_phone: string | null
  source: PropertySource
  property_type: PropertyType
  description: string | null
  status: PropertyStatus
  url: string | null
  latitude: number | null
  longitude: number | null
  apartment_broker: boolean
  balcony_square_meters: number | null
  created_at: string
  updated_at: string
  rating?: number // User rating 0-5 stars
}

export interface PropertyInsert {
  title: string
  address: string
  rooms: number
  square_meters?: number | null
  asked_price?: number | null
  contact_name?: string | null
  contact_phone?: string | null
  source: PropertySource
  property_type: PropertyType
  description?: string | null
  status?: PropertyStatus
  url?: string | null
  latitude?: number | null
  longitude?: number | null
  apartment_broker?: boolean
  balcony_square_meters?: number | null
  rating?: number // User rating 0-5 stars
}

export interface Note {
  id: string
  property_id: string
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  property_id: string
  file_name: string
  file_path: string
  file_type: 'image' | 'video' | 'pdf'
  file_size: number
  mime_type: string
  created_at: string
  updated_at: string
}

export interface AttachmentInsert {
  property_id: string
  file_name: string
  file_path: string
  file_type: 'image' | 'video' | 'pdf'
  file_size: number
  mime_type: string
}
