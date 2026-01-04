'use client'

import { useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

// Simple toast implementation using React state
// For production, consider using a library like react-hot-toast or sonner
let toastListeners: Array<(toasts: Toast[]) => void> = []
let toastQueue: Toast[] = []

function notifyListeners(): void {
  toastListeners.forEach(listener => listener([...toastQueue]))
}

function addToast(message: string, type: ToastType = 'info', duration = 5000): string {
  const id = Math.random().toString(36).substring(7)
  const toast: Toast = { id, message, type, duration }
  
  toastQueue.push(toast)
  notifyListeners()
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  
  return id
}

function removeToast(id: string): void {
  toastQueue = toastQueue.filter(t => t.id !== id)
  notifyListeners()
}

// Export functions for use outside React components
export const toast = {
  success: (message: string, duration?: number) => addToast(message, 'success', duration),
  error: (message: string, duration?: number) => addToast(message, 'error', duration),
  warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  info: (message: string, duration?: number) => addToast(message, 'info', duration),
}

/**
 * Toast Container Component
 * Should be added to the root layout
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts)
    }
    
    toastListeners.push(listener)
    setToasts([...toastQueue])
    
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            relative flex items-start gap-3 p-4 rounded-lg shadow-lg
            animate-in slide-in-from-top-5 fade-in
            ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-900'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-900'
                : toast.type === 'warning'
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                : 'bg-blue-50 border border-blue-200 text-blue-900'
            }
          `}
        >
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close toast"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  return {
    success: (message: string, duration?: number) => toast.success(message, duration),
    error: (message: string, duration?: number) => toast.error(message, duration),
    warning: (message: string, duration?: number) => toast.warning(message, duration),
    info: (message: string, duration?: number) => toast.info(message, duration),
  }
}
