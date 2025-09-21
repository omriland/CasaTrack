export type PropertyStatus = 'Seen' | 'Interested' | 'Contacted Realtor' | 'Visited' | 'On Hold' | 'Irrelevant' | 'Purchased'

export type PropertySource = 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'

export type PropertyType = 'New' | 'Existing apartment'

export interface Property {
  id: string
  address: string
  rooms: number
  square_meters: number
  asked_price: number
  price_per_meter: number
  contact_name: string | null
  contact_phone: string | null
  source: PropertySource
  property_type: PropertyType
  description: string | null
  status: PropertyStatus
  created_at: string
  updated_at: string
}

export interface PropertyInsert {
  address: string
  rooms: number
  square_meters: number
  asked_price: number
  contact_name?: string | null
  contact_phone?: string | null
  source: PropertySource
  property_type: PropertyType
  description?: string | null
  status?: PropertyStatus
}

export interface Note {
  id: string
  property_id: string
  content: string
  created_at: string
}