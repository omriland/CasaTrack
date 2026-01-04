/**
 * React Query hooks for notes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPropertyNotes,
  createNote,
  updateNote,
  deleteNote,
} from '@/services/noteService'
import { useToast } from '@/components/ui/Toast'
import { useErrorHandler } from '@/hooks/common/useErrorHandler'

const QUERY_KEYS = {
  all: ['notes'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (propertyId: string) => [...QUERY_KEYS.lists(), propertyId] as const,
}

/**
 * Hook to fetch notes for a property
 */
export function usePropertyNotes(propertyId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.list(propertyId!),
    queryFn: () => getPropertyNotes(propertyId!),
    enabled: !!propertyId,
  })
}

/**
 * Hook to create a note
 */
export function useCreateNote() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({ propertyId, content }: { propertyId: string; content: string }) =>
      createNote(propertyId, content),
    onSuccess: (_, variables) => {
      // Invalidate notes for this property
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(variables.propertyId) })
      toast.success('Note created successfully')
    },
    onError: (error) => {
      handleError(error)
      toast.error('Failed to create note')
    },
  })
}

/**
 * Hook to update a note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateNote(id, content),
    onSuccess: (updatedNote) => {
      // Invalidate notes for this property
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.list(updatedNote.property_id),
      })
      toast.success('Note updated successfully')
    },
    onError: (error) => {
      handleError(error)
      toast.error('Failed to update note')
    },
  })
}

/**
 * Hook to delete a note
 */
export function useDeleteNote() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_, deletedId) => {
      // Invalidate all notes lists (we don't know which property it belonged to)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      toast.success('Note deleted successfully')
    },
    onError: (error) => {
      handleError(error)
      toast.error('Failed to delete note')
    },
  })
}
