/**
 * Zod validation schemas for runtime type checking
 */

import { z } from 'zod'

// Property status enum
export const PropertyStatusSchema = z.enum([
  'Seen',
  'Interested',
  'Contacted Realtor',
  'Visited',
  'On Hold',
  'Irrelevant',
  'Purchased',
])

// Property source enum
export const PropertySourceSchema = z.enum([
  'Yad2',
  'Friends & Family',
  'Facebook',
  'Madlan',
  'Other',
])

// Property type enum
export const PropertyTypeSchema = z.enum(['New', 'Existing apartment'])

// Property insert schema
export const PropertyInsertSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  address: z.string().min(1, 'Address is required'),
  rooms: z.number().min(0).max(20),
  square_meters: z.number().int().positive().nullable().optional(),
  balcony_square_meters: z.number().int().positive().nullable().optional(),
  asked_price: z.number().int().positive().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  source: PropertySourceSchema,
  property_type: PropertyTypeSchema,
  description: z.string().nullable().optional(),
  status: PropertyStatusSchema.optional(),
  url: z.string().url().nullable().optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  apartment_broker: z.boolean().optional(),
  is_flagged: z.boolean().optional(),
  rating: z.number().int().min(0).max(5).nullable().optional(),
})

// Property update schema (all fields optional)
export const PropertyUpdateSchema = PropertyInsertSchema.partial().extend({
  title: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
})

// Note schema
export const NoteSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  content: z.string().min(1, 'Note content cannot be empty'),
  created_at: z.string().datetime(),
})

export const NoteInsertSchema = z.object({
  property_id: z.string().uuid(),
  content: z.string().min(1, 'Note content cannot be empty'),
})

export const NoteUpdateSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty'),
})

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  file_name: z.string(),
  file_path: z.string(),
  file_type: z.enum(['image', 'video', 'pdf']),
  file_size: z.number().int().positive(),
  mime_type: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  propertyId: z.string().uuid(),
})

// Export inferred types
export type PropertyInsertInput = z.infer<typeof PropertyInsertSchema>
export type PropertyUpdateInput = z.infer<typeof PropertyUpdateSchema>
export type NoteInsertInput = z.infer<typeof NoteInsertSchema>
export type NoteUpdateInput = z.infer<typeof NoteUpdateSchema>

/**
 * Validate property insert data
 */
export function validatePropertyInsert(data: unknown): PropertyInsertInput {
  return PropertyInsertSchema.parse(data)
}

/**
 * Validate property update data
 */
export function validatePropertyUpdate(data: unknown): PropertyUpdateInput {
  return PropertyUpdateSchema.parse(data)
}

/**
 * Validate note insert data
 */
export function validateNoteInsert(data: unknown): NoteInsertInput {
  return NoteInsertSchema.parse(data)
}

/**
 * Validate note update data
 */
export function validateNoteUpdate(data: unknown): NoteUpdateInput {
  return NoteUpdateSchema.parse(data)
}
