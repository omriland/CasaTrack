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
          title: string
          address: string
          rooms: number
          square_meters: number | null
          asked_price: number | null
          price_per_meter: number | null
          contact_name: string | null
          contact_phone: string | null
          source: 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'
          property_type: 'New' | 'Existing apartment'
          description: string | null
          status:
            | 'Seen'
            | 'Interested'
            | 'Contacted Realtor'
            | 'Visited'
            | 'On Hold'
            | 'Irrelevant'
            | 'Purchased'
          url: string | null
          latitude: number | null
          longitude: number | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          address: string
          rooms: number
          square_meters?: number | null
          asked_price?: number | null
          price_per_meter?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          source: 'Yad2' | 'Friends & Family' | 'Facebook' | 'Madlan' | 'Other'
          property_type: 'New' | 'Existing apartment'
          description?: string | null
          status?:
            | 'Seen'
            | 'Interested'
            | 'Contacted Realtor'
            | 'Visited'
            | 'On Hold'
            | 'Irrelevant'
            | 'Purchased'
          url?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
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
          status?:
            | 'Seen'
            | 'Interested'
            | 'Contacted Realtor'
            | 'Visited'
            | 'On Hold'
            | 'Irrelevant'
            | 'Purchased'
          url?: string | null
          latitude?: number | null
          longitude?: number | null
          rating?: number | null
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
      attachments: {
        Row: {
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
        Insert: {
          id?: string
          property_id: string
          file_name: string
          file_path: string
          file_type: 'image' | 'video' | 'pdf'
          file_size: number
          mime_type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          file_name?: string
          file_path?: string
          file_type?: 'image' | 'video' | 'pdf'
          file_size?: number
          mime_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      property_scores: {
        Row: {
          id: string
          property_id: string
          score: number
          calculated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          score: number
          calculated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          score?: number
          calculated_at?: string
        }
      }
      scoring_config: {
        Row: {
          id: string
          criterion: string
          weight: number
          enabled: boolean
          preference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          criterion: string
          weight: number
          enabled?: boolean
          preference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          criterion?: string
          weight?: number
          enabled?: boolean
          preference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      renovation_wishlist_items: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          unit_price: number
          quantity: number
          purchased: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          unit_price?: number
          quantity?: number
          purchased?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          unit_price?: number
          quantity?: number
          purchased?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      renovation_wishlist_links: {
        Row: {
          id: string
          item_id: string
          label: string | null
          url: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          label?: string | null
          url: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          label?: string | null
          url?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      renovation_milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          color: string
          notes: string | null
          done: boolean
          start_date: string
          end_date: string
          sort_order: number
          created_by_member_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          color?: string
          notes?: string | null
          done?: boolean
          start_date: string
          end_date: string
          sort_order?: number
          created_by_member_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          color?: string
          notes?: string | null
          done?: boolean
          start_date?: string
          end_date?: string
          sort_order?: number
          created_by_member_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      renovation_milestone_tasks: {
        Row: {
          milestone_id: string
          task_id: string
        }
        Insert: {
          milestone_id: string
          task_id: string
        }
        Update: {
          milestone_id?: string
          task_id?: string
        }
      }
    }
  }
}
