'use client'

import React from 'react'
import { cn } from '@/utils/common'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

/**
 * Reusable Input component
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helperText, fullWidth = false, id, ...props },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-extrabold text-black/40 mb-1.5 uppercase tracking-wider ml-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'px-4 py-3 bg-gray-50 border border-[rgba(0,0,0,0.06)] rounded-2xl transition-all font-medium text-black',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-[rgba(0,0,0,0.06)] focus:ring-black',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            fullWidth && 'w-full',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error || helperText
              ? `${inputId}-${error ? 'error' : 'helper'}`
              : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
