/**
 * Property service - API layer for property operations
 */

import { supabase } from '@/lib/supabase'
import { Property, PropertyInsert } from '@/types/property'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { validatePropertyInsert, validatePropertyUpdate } from '@/lib/validation'

/**
 * Get all properties
 */
export async function getProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  return data || []
}

/**
 * Get a single property by ID
 */
export async function getProperty(id: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Property', id)
    }
    throw new Error(`Failed to fetch property: ${error.message}`)
  }

  if (!data) {
    throw new NotFoundError('Property', id)
  }

  return data
}

/**
 * Create a new property
 */
export async function createProperty(property: PropertyInsert): Promise<Property> {
  // Validate input
  const validated = validatePropertyInsert(property)

  const { data, error } = await supabase
    .from('properties')
    .insert(validated)
    .select()
    .single()

  if (error) {
    throw new ValidationError(`Failed to create property: ${error.message}`)
  }

  if (!data) {
    throw new Error('Property creation returned no data')
  }

  return data
}

/**
 * Update an existing property
 */
export async function updateProperty(
  id: string,
  updates: Partial<PropertyInsert>
): Promise<Property> {
  // Validate input
  const validated = validatePropertyUpdate(updates)

  const { data, error } = await supabase
    .from('properties')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Property', id)
    }
    throw new ValidationError(`Failed to update property: ${error.message}`)
  }

  if (!data) {
    throw new NotFoundError('Property', id)
  }

  return data
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id)

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Property', id)
    }
    throw new Error(`Failed to delete property: ${error.message}`)
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatus(
  id: string,
  status: Property['status']
): Promise<Property> {
  return updateProperty(id, { status })
}

/**
 * Update property rating
 */
export async function updatePropertyRating(
  id: string,
  rating: number
): Promise<Property> {
  if (rating < 0 || rating > 5) {
    throw new ValidationError('Rating must be between 0 and 5')
  }

  return updateProperty(id, { rating })
}

/**
 * Toggle property flag
 */
export async function togglePropertyFlag(
  id: string,
  isFlagged: boolean
): Promise<Property> {
  return updateProperty(id, { is_flagged: isFlagged })
}
