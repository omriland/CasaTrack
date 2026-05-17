'use client'

import { useState, useEffect, useCallback } from 'react'
import { checkPassword, setAuthCookie } from '@/lib/auth'

interface LoginFormProps {
  onLogin: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'enter']

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const submit = useCallback(
    (value: string) => {
      if (!value) return
      setLoading(true)
      setError(false)

      if (checkPassword(value)) {
        setAuthCookie()
        onLogin()
      } else {
        setShake(true)
        setError(true)
        setPin('')
        setTimeout(() => setShake(false), 500)
      }

      setLoading(false)
    },
    [onLogin]
  )

  const handleKey = useCallback(
    (key: string) => {
      if (loading) return
      if (key === 'del') {
        setPin((p) => p.slice(0, -1))
        setError(false)
      } else if (key === 'enter') {
        submit(pin)
      } else {
        setPin((p) => p + key)
        setError(false)
      }
    },
    [loading, pin, submit]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
      else if (e.key === 'Backspace') handleKey('del')
      else if (e.key === 'Enter') handleKey('enter')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[320px] flex flex-col items-center gap-10">

        {/* Branding */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[22px] bg-gray-50 border border-black/[0.06]">
            <svg className="w-9 h-9 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-black">Casa</span>
              <span className="text-black/40">Track</span>
            </h1>
            <p className="text-black/40 font-medium text-sm mt-1">Enter your PIN to continue</p>
          </div>
        </div>

        {/* PIN dots */}
        <div
          className={`flex items-center justify-center gap-3 h-8 transition-all duration-200 ${shake ? 'animate-shake' : ''}`}
          aria-live="polite"
          aria-label={`${pin.length} digits entered`}
        >
          {pin.length === 0 ? (
            <span className="text-black/20 text-sm font-medium tracking-widest">● ● ● ●</span>
          ) : (
            Array.from({ length: pin.length }).map((_, i) => (
              <span
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${error ? 'bg-red-500' : 'bg-black'}`}
              />
            ))
          )}
        </div>

        {/* Error message */}
        <div className={`-mt-6 text-xs font-semibold text-red-500 transition-opacity duration-200 ${error ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
          Incorrect PIN — try again
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full animate-fade-in-up [animation-delay:75ms] [animation-fill-mode:backwards]">
          {KEYS.map((key) => {
            const isDel = key === 'del'
            const isEnter = key === 'enter'
            const isDisabled = loading || (isEnter && !pin)

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                disabled={isDisabled}
                className={[
                  'flex items-center justify-center rounded-2xl h-16 text-lg font-bold select-none transition-all duration-150',
                  'active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed',
                  isEnter
                    ? 'bg-black text-white hover:bg-black/85'
                    : isDel
                    ? 'bg-gray-100 text-black/60 hover:bg-gray-200'
                    : 'bg-gray-50 text-black hover:bg-gray-100 border border-black/[0.05]',
                ].join(' ')}
                aria-label={isDel ? 'Delete' : isEnter ? 'Submit' : key}
              >
                {isDel ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7M19 12H5" />
                  </svg>
                ) : isEnter ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            )
          })}
        </div>

        <p className="text-[11px] font-medium text-black/25">Created by Omriland</p>
      </div>
    </div>
  )
}
