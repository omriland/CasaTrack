/**
 * React Query hooks for properties
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  updatePropertyRating,
  togglePropertyFlag,
} from '@/services/propertyService'
import { Property, PropertyInsert } from '@/types/property'
import { useToast } from '@/components/ui/Toast'
import { useErrorHandler } from '@/hooks/common/useErrorHandler'

const QUERY_KEYS = {
  all: ['properties'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
}

/**
 * Hook to fetch all properties
 */
export function useProperties() {
  return useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: getProperties,
  })
}

/**
 * Hook to fetch a single property
 */
export function useProperty(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => getProperty(id!),
    enabled: !!id,
  })
}

/**
 * Hook to create a property
 */
export function useCreateProperty() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      // Invalidate and refetch properties list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      toast.success('Property created successfully')
    },
    onError: error => {
      handleError(error)
      toast.error('Failed to create property')
    },
  })
}

/**
 * Hook to update a property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PropertyInsert> }) =>
      updateProperty(id, updates),
    onSuccess: updatedProperty => {
      // Update cache for both list and detail
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.setQueryData(QUERY_KEYS.detail(updatedProperty.id), updatedProperty)
      toast.success('Property updated successfully')
    },
    onError: error => {
      handleError(error)
      toast.error('Failed to update property')
    },
  })
}

/**
 * Hook to delete a property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(deletedId) })
      toast.success('Property deleted successfully')
    },
    onError: error => {
      handleError(error)
      toast.error('Failed to delete property')
    },
  })
}

/**
 * Hook to update property status
 */
export function useUpdatePropertyStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Property['status'] }) =>
      updatePropertyStatus(id, status),
    onSuccess: updatedProperty => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.setQueryData(QUERY_KEYS.detail(updatedProperty.id), updatedProperty)
    },
    onError: () => {
      toast.error('Failed to update property status')
    },
  })
}

/**
 * Hook to update property rating
 */
export function useUpdatePropertyRating() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      updatePropertyRating(id, rating),
    onSuccess: updatedProperty => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.setQueryData(QUERY_KEYS.detail(updatedProperty.id), updatedProperty)
    },
    onError: () => {
      toast.error('Failed to update property rating')
    },
  })
}

/**
 * Hook to toggle property flag
 */
export function useTogglePropertyFlag() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, isFlagged }: { id: string; isFlagged: boolean }) =>
      togglePropertyFlag(id, isFlagged),
    onSuccess: updatedProperty => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.setQueryData(QUERY_KEYS.detail(updatedProperty.id), updatedProperty)
    },
    onError: () => {
      toast.error('Failed to update property flag')
    },
  })
}
