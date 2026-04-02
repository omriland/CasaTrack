'use client'

import { useState } from 'react'
import { checkPassword, setAuthCookie } from '@/lib/auth'

interface LoginFormProps {
  onLogin: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (checkPassword(password)) {
      setAuthCookie()
      onLogin()
    } else {
      setError('Incorrect passcode')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-white sm:bg-[#fafafa] flex flex-col items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-[340px] animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="flex items-center justify-center w-14 h-14 bg-black rounded-2xl mb-5 shadow-lg shadow-black/10">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight mb-1" style={{ letterSpacing: '-0.02em' }}>
            <span className="text-black">Casa</span>
            <span className="text-black/40">Track</span>
          </h1>
          <p className="text-[12px] font-bold text-black/30 tracking-widest uppercase mt-1">
            Private Access
          </p>
        </div>

        {/* Form Container */}
        <div className="sm:bg-white sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-black/5 rounded-[24px] sm:p-8 sm:pt-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="w-full h-14 bg-black/[0.04] hover:bg-black/[0.06] focus:bg-black/[0.02] border focus:border-black/20 border-transparent rounded-[16px] px-5 text-[18px] font-bold tracking-widest text-black placeholder:text-black/30 placeholder:tracking-normal placeholder:font-medium outline-none transition-all duration-300"
                  placeholder="Passcode"
                  value={password}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '')
                    setPassword(numericValue)
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors p-1"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center justify-center space-x-2 text-rose-500 animate-fade-in bg-rose-50 rounded-[12px] p-3">
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[13px] font-bold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full h-14 mt-2 bg-black text-white font-bold rounded-[16px] hover:bg-black/90 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_20px_rgb(0,0,0,0.12)] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying</span>
                </>
              ) : (
                <>
                  <span className="text-[15px]">Continue</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-black">
          <p className="text-[10px] font-bold tracking-widest uppercase opacity-20 hover:opacity-100 transition-opacity">
            CasaTrack OS
          </p>
        </div>
      </div>
    </div>
  )
}

