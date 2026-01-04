import { useCallback } from 'react'
import { getErrorMessage, logError, AppError } from '@/lib/errors'

interface UseErrorHandlerOptions {
  onError?: (message: string) => void
  showToast?: boolean
}

/**
 * Hook for consistent error handling across the application
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const handleError = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      const message = getErrorMessage(error)
      
      // Log error for debugging
      logError(error, context)
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(message)
      } else {
        // Default: show alert (will be replaced with toast system)
        if (typeof window !== 'undefined') {
          alert(message)
        }
      }
    },
    [options]
  )

  return { handleError }
}

/**
 * Wrapper for async functions with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      errorHandler(error)
      throw error
    }
  }) as T
}
