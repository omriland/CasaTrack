'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'

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
  /** Search filter on option labels (e.g. long provider lists). */
  searchable?: boolean
  searchPlaceholder?: string
}

export function Dropdown({
  value,
  onChange,
  options,
  className = '',
  placeholder = 'Select...',
  searchable = false,
  searchPlaceholder = 'Search…',
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const visibleOptions = useMemo(() => {
    if (!searchable) return options
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchQuery, searchable])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) setSearchQuery('')
  }, [open])

  useEffect(() => {
    if (!open || !searchable) return
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open, searchable])

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
        <div
          className={`absolute z-50 mt-2 w-full animate-fade-in origin-top text-slate-800 ring-1 ring-black/5 ${
            searchable
              ? 'flex max-h-64 flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/95 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl'
              : 'max-h-64 overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/95 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] backdrop-blur-xl'
          }`}
        >
          {searchable && (
            <div className="shrink-0 border-b border-slate-100 p-2">
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200"
                dir="auto"
                aria-label={searchPlaceholder}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className={searchable ? 'max-h-52 overflow-y-auto p-1.5' : ''}>
            {options.length === 0 ? (
              <div className="px-4 py-3 text-center text-[15px] font-medium italic text-slate-400">No options</div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-[14px] font-medium text-slate-500">No matches</div>
            ) : (
              visibleOptions.map((option) => {
                const isActive = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={`mb-0.5 flex w-full items-center rounded-xl px-4 py-3 text-left text-[15px] transition-all last:mb-0 ${
                      isActive ? 'font-bold bg-indigo-50 text-indigo-700' : 'font-medium text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {option.icon && <span className="mr-2 flex-shrink-0">{option.icon}</span>}
                    <span className="truncate" dir="auto">
                      {option.label}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
