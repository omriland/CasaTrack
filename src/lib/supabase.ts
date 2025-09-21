import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          address: string
          rooms: number
          square_meters: number
          asked_price: number
          price_per_meter: number
          contact_name: string | null
          contact_phone: string | null
          source: 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'
          property_type: 'New' | 'Existing apartment'
          description: string | null
          status: 'Seen' | 'Interested' | 'Contacted Realtor' | 'Visited' | 'On Hold' | 'Irrelevant' | 'Purchased'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          rooms: number
          square_meters: number
          asked_price: number
          price_per_meter?: number
          contact_name?: string | null
          contact_phone?: string | null
          source: 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'
          property_type: 'New' | 'Existing apartment'
          description?: string | null
          status?: 'Seen' | 'Interested' | 'Contacted Realtor' | 'Visited' | 'On Hold' | 'Irrelevant' | 'Purchased'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address?: string
          rooms?: number
          square_meters?: number
          asked_price?: number
          price_per_meter?: number
          contact_name?: string | null
          contact_phone?: string | null
          source?: 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'
          property_type?: 'New' | 'Existing apartment'
          description?: string | null
          status?: 'Seen' | 'Interested' | 'Contacted Realtor' | 'Visited' | 'On Hold' | 'Irrelevant' | 'Purchased'
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          property_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}