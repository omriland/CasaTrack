/**
 * API response types and utilities
 */

import { Property, Note, Attachment } from './property'

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  error: string
  message?: string
  code?: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

// Property API responses
export type PropertyResponse = ApiResponse<Property>
export type PropertiesResponse = ApiResponse<Property[]>
export type PropertyCreateResponse = ApiResponse<Property>
export type PropertyUpdateResponse = ApiResponse<Property>

// Note API responses
export type NotesResponse = ApiResponse<Note[]>
export type NoteResponse = ApiResponse<Note>
export type NoteCreateResponse = ApiResponse<Note>
export type NoteUpdateResponse = ApiResponse<Note>

// Attachment API responses
export type AttachmentsResponse = ApiResponse<Attachment[]>
export type AttachmentResponse = ApiResponse<Attachment>
export type AttachmentUploadResponse = ApiResponse<Attachment>

/**
 * Type guard to check if response is an error
 */
export function isApiError<T>(response: ApiResponse<T> | ApiError): response is ApiError {
  return 'error' in response && !('data' in response)
}

/**
 * Extract data from API response, throwing if error
 */
export function extractApiData<T>(response: ApiResponse<T>): T {
  if (response.error) {
    throw new Error(response.error)
  }
  if (!response.data) {
    throw new Error('No data in response')
  }
  return response.data
}
