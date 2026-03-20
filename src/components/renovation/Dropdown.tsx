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
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-64 overflow-y-auto p-1.5 animate-fade-in origin-top text-slate-800 ring-1 ring-black/5">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-[15px] text-slate-400 italic font-medium text-center">No options</div>
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
                  className={`w-full text-left px-4 py-3 text-[15px] transition-all rounded-xl flex items-center mb-0.5 last:mb-0 ${
                    isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100 font-medium'
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
