/**
 * Note service - API layer for note operations
 */

import { supabase } from '@/lib/supabase'
import { Note } from '@/types/property'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { validateNoteInsert, validateNoteUpdate } from '@/lib/validation'

/**
 * Get all notes for a property
 */
export async function getPropertyNotes(propertyId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch notes: ${error.message}`)
  }

  return data || []
}

/**
 * Get a single note by ID
 */
export async function getNote(id: string): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Note', id)
    }
    throw new Error(`Failed to fetch note: ${error.message}`)
  }

  if (!data) {
    throw new NotFoundError('Note', id)
  }

  return data
}

/**
 * Create a new note
 */
export async function createNote(propertyId: string, content: string): Promise<Note> {
  // Validate input
  const validated = validateNoteInsert({ property_id: propertyId, content })

  const { data, error } = await supabase
    .from('notes')
    .insert(validated)
    .select()
    .single()

  if (error) {
    throw new ValidationError(`Failed to create note: ${error.message}`)
  }

  if (!data) {
    throw new Error('Note creation returned no data')
  }

  return data
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, content: string): Promise<Note> {
  // Validate input
  const validated = validateNoteUpdate({ content })

  const { data, error } = await supabase
    .from('notes')
    .update(validated)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Note', id)
    }
    throw new ValidationError(`Failed to update note: ${error.message}`)
  }

  if (!data) {
    throw new NotFoundError('Note', id)
  }

  return data
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)

  if (error) {
    if (error.code === 'PGRST116') {
      throw new NotFoundError('Note', id)
    }
    throw new Error(`Failed to delete note: ${error.message}`)
  }
}
