/**
 * React Query hooks for attachments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPropertyAttachments,
  uploadAttachment,
  deleteAttachment,
} from '@/services/attachmentService'
import { useToast } from '@/components/ui/Toast'
import { useErrorHandler } from '@/hooks/common/useErrorHandler'

const QUERY_KEYS = {
  all: ['attachments'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (propertyId: string) => [...QUERY_KEYS.lists(), propertyId] as const,
}

/**
 * Hook to fetch attachments for a property
 */
export function usePropertyAttachments(propertyId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.list(propertyId!),
    queryFn: () => getPropertyAttachments(propertyId!),
    enabled: !!propertyId,
  })
}

/**
 * Hook to upload an attachment
 */
export function useUploadAttachment() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: ({
      propertyId,
      file,
      onProgress,
    }: {
      propertyId: string
      file: File
      onProgress?: (progress: number) => void
    }) => uploadAttachment(propertyId, file, onProgress),
    onSuccess: (_attachment, variables) => {
      // Invalidate attachments for this property
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.list(variables.propertyId),
      })
      toast.success('Attachment uploaded successfully')
    },
    onError: (error) => {
      handleError(error)
      toast.error('Failed to upload attachment')
    },
  })
}

/**
 * Hook to delete an attachment
 */
export function useDeleteAttachment() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { handleError } = useErrorHandler()

  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      // Invalidate all attachment lists (we don't know which property it belonged to)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      toast.success('Attachment deleted successfully')
    },
    onError: (error) => {
      handleError(error)
      toast.error('Failed to delete attachment')
    },
  })
}
