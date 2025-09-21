import { supabase } from './supabase'
import { Property, PropertyInsert, Note } from '@/types/property'

export async function getProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProperty(property: PropertyInsert): Promise<Property> {
  console.log('💾 Creating property with data:', property)
  
  const { data, error } = await supabase
    .from('properties')
    .insert(property)
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating property:', error)
    throw error
  }
  
  console.log('✅ Property created successfully:', data)
  return data
}

export async function updateProperty(id: string, updates: Partial<PropertyInsert>): Promise<Property> {
  console.log('🔄 Updating property', id, 'with data:', updates)
  
  const { data, error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('❌ Error updating property:', error)
    throw error
  }
  
  console.log('✅ Property updated successfully:', data)
  return data
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updatePropertyStatus(id: string, status: Property['status']): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPropertyNotes(propertyId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createNote(propertyId: string, content: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({ property_id: propertyId, content })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}