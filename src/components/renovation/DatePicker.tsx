'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { format, parseISO } from 'date-fns'

interface DatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedDate = value ? parseISO(value) : undefined
  const display = selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-11 pl-10 pr-3 rounded border border-slate-200 bg-slate-50 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm focus:bg-white text-left flex items-center justify-between"
      >
         <span className={`${!value ? 'text-slate-400 font-normal' : ''}`}>{display}</span>
      </button>

      {open && (
        <div className="absolute z-[100] mt-1 p-0 animate-fade-in-up origin-top">
           <style suppressHydrationWarning>{`
             .rdp-root {
               --rdp-accent-color: #4f46e5;
               --rdp-background-color: #e0e7ff;
               --rdp-accent-color-dark: #4338ca;
               --rdp-background-color-dark: #c7d2fe;
               --rdp-outline: 2px solid var(--rdp-accent-color);
               --rdp-outline-offset: 2px;
               --rdp-margin: 0;
             }
             .rdp-root * {
               font-family: inherit;
             }
           `}</style>
          <div className="bg-white rounded-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) {
                  onChange(format(d, 'yyyy-MM-dd'))
                  setOpen(false)
                }
              }}
              showOutsideDays
              className="m-0 p-4"
            />
          </div>
        </div>
      )}
    </div>
  )
}
