'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface DropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  className?: string
  placeholder?: string
}

export function Dropdown({ value, onChange, options, className = '', placeholder = 'Select...' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((o) => o.value === value)

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-full text-left focus:outline-none flex items-center justify-between px-3.5"
      >
        <div className={`flex items-center truncate ${!selectedOption && placeholder ? 'opacity-50' : ''}`}>
          {selectedOption?.icon && <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>}
          <span className="block truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <svg
          className={`w-4 h-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded shadow-xl max-h-60 overflow-y-auto py-1 animate-fade-in-up origin-top text-slate-800">
          {options.length === 0 ? (
            <div className="px-3.5 py-2.5 text-sm text-slate-400 italic">No options</div>
          ) : (
            options.map((option) => {
              const isActive = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors flex items-center ${
                    isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {option.icon && <span className="mr-2 flex-shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
